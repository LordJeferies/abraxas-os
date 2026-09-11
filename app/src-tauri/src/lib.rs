mod media_http;

use media_http::MediaHttpServer;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let media_server = MediaHttpServer::start()
        .expect("failed to start Abraxas localhost media server");

    tauri::Builder::default()
        .manage(media_server)
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            media_http::register_media_source_http,
            media_http::media_server_health,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
