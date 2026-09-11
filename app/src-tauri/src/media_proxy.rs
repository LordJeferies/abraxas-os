use std::{
    collections::hash_map::DefaultHasher,
    hash::{Hash, Hasher},
    path::PathBuf,
    process::Command,
    time::UNIX_EPOCH,
};
use tauri::{AppHandle, Manager};

fn helper_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../native/apple/build/abraxas-media-proxy")
}

fn proxy_cache_key(
    path: &str,
    start_seconds: f64,
    duration_seconds: f64,
) -> Result<u64, String> {
    let metadata = std::fs::metadata(path)
        .map_err(|error| format!("Proxy metadata error: {error}"))?;

    let modified = metadata
        .modified()
        .ok()
        .and_then(|value| value.duration_since(UNIX_EPOCH).ok())
        .map(|value| value.as_nanos())
        .unwrap_or_default();

    let mut hasher = DefaultHasher::new();
    path.hash(&mut hasher);
    metadata.len().hash(&mut hasher);
    modified.hash(&mut hasher);
    start_seconds.to_bits().hash(&mut hasher);
    duration_seconds.to_bits().hash(&mut hasher);

    Ok(hasher.finish())
}

#[tauri::command]
pub async fn create_videoflow_proxy(
    app: AppHandle,
    path: String,
    start_seconds: f64,
    duration_seconds: f64,
) -> Result<String, String> {
    let helper = helper_path();

    if !helper.is_file() {
        return Err(format!(
            "Apple proxy helper no existe: {}. Ejecuta scripts/build_apple_media_proxy.sh",
            helper.display()
        ));
    }

    let key = proxy_cache_key(&path, start_seconds, duration_seconds)?;

    let cache_root = app
        .path()
        .app_cache_dir()
        .map_err(|error| format!("App cache dir error: {error}"))?
        .join("videoflow-proxies");

    std::fs::create_dir_all(&cache_root)
        .map_err(|error| format!("Proxy cache create error: {error}"))?;

    let output = cache_root.join(format!("{key:016x}.mp4"));

    if output.is_file() {
        let size = std::fs::metadata(&output)
            .map(|metadata| metadata.len())
            .unwrap_or_default();

        if size > 16 * 1024 {
            println!(
                "[abraxas-proxy] cache hit {} bytes {}",
                size,
                output.display()
            );

            return Ok(output.to_string_lossy().to_string());
        }

        let _ = std::fs::remove_file(&output);
    }

    let helper_for_task = helper.clone();
    let path_for_task = path.clone();
    let output_for_task = output.clone();

    let result = tauri::async_runtime::spawn_blocking(move || {
        Command::new(&helper_for_task)
            .arg(&path_for_task)
            .arg(&output_for_task)
            .arg(format!("{start_seconds:.3}"))
            .arg(format!("{duration_seconds:.3}"))
            .output()
    })
    .await
    .map_err(|error| format!("Proxy task join error: {error}"))?
    .map_err(|error| format!("Proxy helper launch error: {error}"))?;

    if !result.status.success() {
        return Err(format!(
            "Apple proxy failed: {}",
            String::from_utf8_lossy(&result.stderr).trim()
        ));
    }

    let size = std::fs::metadata(&output)
        .map_err(|error| format!("Proxy output metadata error: {error}"))?
        .len();

    if size < 16 * 1024 {
        return Err(format!(
            "Apple proxy output too small: {size} bytes"
        ));
    }

    println!(
        "[abraxas-proxy] created {} bytes {}",
        size,
        output.display()
    );

    Ok(output.to_string_lossy().to_string())
}
