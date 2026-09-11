# Media Transport

Esta capa separa el origen del archivo de la UI.

## Browser

File → Blob URL → HTMLVideoElement.

## Tauri/macOS

Native file dialog
→ absolute path
→ Rust registry
→ opaque token
→ http://127.0.0.1:<random-port>/media/<token>
→ HTTP Range / 206
→ WKWebView video.

## Futuro

Si WKWebView sigue siendo inestable incluso usando HTTP estándar, Source Viewer
pasa a un adapter nativo AVPlayer/AVFoundation sin cambiar Production Graph,
Timeline o Project model.
