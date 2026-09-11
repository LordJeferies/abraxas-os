mod media_http;
mod source_runtime;
mod media_proxy;

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
            media_proxy::create_videoflow_proxy,
            source_runtime::source_runtime_status,
            source_runtime::source_runtime_sources,
            source_runtime::source_runtime_jobs,
            source_runtime::source_runtime_assets,
            source_runtime::source_runtime_register,
            source_runtime::source_runtime_index_assets,
            source_runtime::source_runtime_enqueue_thumbnail,
            source_runtime::source_runtime_enqueue_waveform,
            source_runtime::source_runtime_worker_once,
            source_runtime::source_runtime_drain,
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
