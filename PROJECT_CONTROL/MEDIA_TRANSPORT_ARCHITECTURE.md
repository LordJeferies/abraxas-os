# Media Transport Architecture

## Qué estamos determinando en F1

No estamos comprobando si el archivo H.264/AAC existe o si el navegador puede
decodificarlo: Browser ya demostró eso en horizontal y vertical.

Estamos aislando cómo debe viajar un archivo local grande desde macOS hasta el
visor dentro de Tauri/WKWebView.

## Capas

### Browser

File → Blob URL → HTMLVideoElement.

Estado: PASS.

### Tauri attempt A

absolute path → asset:// → WKWebView.

Estado: FAIL con MediaError code 4.

### Tauri attempt B

absolute path → custom URI scheme → Range protocol.

El patch v0.7.4 no llegó a compilarse/gatearse por un checker demasiado
literal, y además el test manual no resolvió playback.

### Tauri attempt C — actual

absolute path
→ Rust registry
→ token opaco
→ HTTP loopback 127.0.0.1 con puerto aleatorio
→ Range / 206
→ WKWebView.

Ventajas:

- protocolo HTTP estándar para el media element;
- Range requests estándar;
- no expone ruta absoluta en DOM;
- servidor sólo loopback;
- no existe directory browsing;
- master no se carga entero en memoria.

## Regla de escalamiento

Este es el último transporte WebView que se intenta para Source Playback.

Si el mismo master sigue sin reproducirse mediante HTTP Range estándar:

Tauri Source Viewer
→ AVPlayer / AVFoundation nativo.

VideoFlow continuará como Composition/Timeline engine sobre proxies/segmentos,
por lo que ese cambio NO obliga a reescribir Production Graph ni F2/F3.
