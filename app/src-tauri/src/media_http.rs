use http_range::HttpRange;
use std::{
    collections::HashMap,
    fs::File,
    io::{Read, Seek, SeekFrom},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc, Mutex,
    },
    thread,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::State;
use tiny_http::{Header, Method, Request, Response, Server, StatusCode};

static NEXT_MEDIA_TOKEN: AtomicU64 = AtomicU64::new(1);
const MAX_RANGE_CHUNK: u64 = 2 * 1024 * 1024;

#[derive(Clone)]
pub struct MediaHttpServer {
    registry: Arc<Mutex<HashMap<String, PathBuf>>>,
    base_url: String,
}

impl MediaHttpServer {
    pub fn start() -> Result<Self, String> {
        let server = Server::http("127.0.0.1:0")
            .map_err(|error| format!("No se pudo iniciar media server: {error}"))?;

        let address = server
            .server_addr()
            .to_ip()
            .ok_or_else(|| "Media server no obtuvo dirección TCP.".to_string())?;

        let base_url = format!("http://127.0.0.1:{}", address.port());
        let registry = Arc::new(Mutex::new(HashMap::new()));

        let server_registry = registry.clone();
        let log_url = base_url.clone();

        thread::spawn(move || {
            println!("[abraxas-media-http] listening {log_url}");

            for request in server.incoming_requests() {
                let request_registry = server_registry.clone();

                thread::spawn(move || {
                    handle_request(request, request_registry);
                });
            }
        });

        Ok(Self { registry, base_url })
    }

    fn register(&self, path: PathBuf) -> Result<String, String> {
        let canonical = std::fs::canonicalize(&path)
            .map_err(|error| format!("No se pudo resolver archivo: {error}"))?;

        let metadata = std::fs::metadata(&canonical)
            .map_err(|error| format!("No se pudo leer metadata: {error}"))?;

        if !metadata.is_file() {
            return Err("La ruta seleccionada no es un archivo.".into());
        }

        if !allowed_extension(&canonical) {
            return Err("Extensión de video no permitida para F1.".into());
        }

        let counter = NEXT_MEDIA_TOKEN.fetch_add(1, Ordering::Relaxed);
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|value| value.as_nanos())
            .unwrap_or_default();

        let token = format!("{nanos:x}-{counter:x}");

        self.registry
            .lock()
            .map_err(|_| "Media registry lock poisoned".to_string())?
            .insert(token.clone(), canonical);

        Ok(format!("{}/media/{}", self.base_url, token))
    }
}

#[tauri::command]
pub fn register_media_source_http(
    path: String,
    server: State<'_, MediaHttpServer>,
) -> Result<String, String> {
    server.register(PathBuf::from(path))
}

#[tauri::command]
pub fn media_server_health(
    server: State<'_, MediaHttpServer>,
) -> String {
    server.base_url.clone()
}

fn allowed_extension(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| ext.to_ascii_lowercase())
            .as_deref(),
        Some("mp4" | "mov" | "m4v" | "webm")
    )
}

fn mime_for(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_ascii_lowercase())
        .as_deref()
    {
        Some("mov") => "video/quicktime",
        Some("m4v") => "video/x-m4v",
        Some("webm") => "video/webm",
        _ => "video/mp4",
    }
}

fn header(name: &str, value: &str) -> Header {
    Header::from_bytes(name.as_bytes(), value.as_bytes())
        .expect("static HTTP header must be valid")
}

fn add_common_headers<R: Read>(
    response: Response<R>,
    mime: &str,
) -> Response<R> {
    response
        .with_header(header("Content-Type", mime))
        .with_header(header("Accept-Ranges", "bytes"))
        .with_header(header("Access-Control-Allow-Origin", "*"))
        .with_header(header("Access-Control-Allow-Headers", "Range, Content-Type"))
        .with_header(header(
            "Access-Control-Expose-Headers",
            "Accept-Ranges, Content-Length, Content-Range",
        ))
        .with_header(header("Cache-Control", "no-store"))
}

fn token_from_url(url: &str) -> Option<&str> {
    let path = url.split('?').next().unwrap_or(url);
    path.strip_prefix("/media/")
        .filter(|token| !token.is_empty() && !token.contains('/'))
}

fn range_header(request: &Request) -> Option<String> {
    request
        .headers()
        .iter()
        .find(|item| item.field.equiv("Range"))
        .map(|item| item.value.as_str().to_string())
}

fn handle_request(
    request: Request,
    registry: Arc<Mutex<HashMap<String, PathBuf>>>,
) {
    if request.url().split('?').next() == Some("/health") {
        let response = Response::from_string("ok")
            .with_status_code(StatusCode(200))
            .with_header(header("Access-Control-Allow-Origin", "*"))
            .with_header(header("Cache-Control", "no-store"));

        let _ = request.respond(response);
        return;
    }

    if request.method() == &Method::Options {
        let response = Response::empty(StatusCode(204))
            .with_header(header("Access-Control-Allow-Origin", "*"))
            .with_header(header("Access-Control-Allow-Headers", "Range, Content-Type"))
            .with_header(header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS"));

        let _ = request.respond(response);
        return;
    }

    let Some(token) = token_from_url(request.url()) else {
        let _ = request.respond(
            Response::from_string("Not found")
                .with_status_code(StatusCode(404)),
        );
        return;
    };

    let path = registry
        .lock()
        .ok()
        .and_then(|items| items.get(token).cloned());

    let Some(path) = path else {
        let _ = request.respond(
            Response::from_string("Unknown media token")
                .with_status_code(StatusCode(404))
                .with_header(header("Access-Control-Allow-Origin", "*")),
        );
        return;
    };

    let mime = mime_for(&path);

    let mut file = match File::open(&path) {
        Ok(file) => file,
        Err(error) => {
            let _ = request.respond(
                Response::from_string(format!("Open error: {error}"))
                    .with_status_code(StatusCode(500)),
            );
            return;
        }
    };

    let len = match file.metadata() {
        Ok(metadata) => metadata.len(),
        Err(error) => {
            let _ = request.respond(
                Response::from_string(format!("Metadata error: {error}"))
                    .with_status_code(StatusCode(500)),
            );
            return;
        }
    };

    if len == 0 {
        let _ = request.respond(
            Response::from_string("Empty media")
                .with_status_code(StatusCode(416)),
        );
        return;
    }

    if request.method() == &Method::Head {
        let response = Response::new(
            StatusCode(200),
            vec![
                header("Content-Type", mime),
                header("Accept-Ranges", "bytes"),
                header("Access-Control-Allow-Origin", "*"),
                header("Cache-Control", "no-store"),
            ],
            std::io::empty(),
            Some(len as usize),
            None,
        );

        let _ = request.respond(response);
        return;
    }

    if let Some(range_text) = range_header(&request) {
        let ranges = match HttpRange::parse(&range_text, len) {
            Ok(ranges) if !ranges.is_empty() => ranges,
            _ => {
                let response = Response::empty(StatusCode(416))
                    .with_header(header("Content-Range", &format!("bytes */{len}")))
                    .with_header(header("Access-Control-Allow-Origin", "*"));

                let _ = request.respond(response);
                return;
            }
        };

        let range = &ranges[0];
        let start = range.start;

        if start >= len {
            let response = Response::empty(StatusCode(416))
                .with_header(header("Content-Range", &format!("bytes */{len}")))
                .with_header(header("Access-Control-Allow-Origin", "*"));

            let _ = request.respond(response);
            return;
        }

        let requested_end = start
            .saturating_add(range.length.saturating_sub(1))
            .min(len - 1);

        let end = requested_end
            .min(start.saturating_add(MAX_RANGE_CHUNK - 1))
            .min(len - 1);

        let bytes_to_read = end + 1 - start;
        let mut body = Vec::with_capacity(bytes_to_read as usize);

        if file.seek(SeekFrom::Start(start)).is_err()
            || file.take(bytes_to_read).read_to_end(&mut body).is_err()
        {
            let _ = request.respond(
                Response::from_string("Range read error")
                    .with_status_code(StatusCode(500)),
            );
            return;
        }

        println!(
            "[abraxas-media-http] {} bytes {}-{}/{}",
            range_text, start, end, len
        );

        let response = add_common_headers(
            Response::from_data(body)
                .with_status_code(StatusCode(206))
                .with_header(header(
                    "Content-Range",
                    &format!("bytes {start}-{end}/{len}"),
                )),
            mime,
        );

        let _ = request.respond(response);
        return;
    }

    // Sin Range: tiny_http transmite el archivo desde File; no lo carga entero
    // en un Vec. Esto es importante para masters de varios GB.
    let response = add_common_headers(
        Response::from_file(file).with_status_code(StatusCode(200)),
        mime,
    );

    let _ = request.respond(response);
}
