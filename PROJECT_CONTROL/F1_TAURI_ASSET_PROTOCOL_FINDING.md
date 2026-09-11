# F1 — Tauri local-media transport finding

## Evidencia

El mismo master H.264/AAC funciona en Browser:

- metadata PASS;
- canplay PASS;
- play/pause PASS;
- seek PASS;
- audio PASS;
- VideoFlow bounded sample PASS.

Dentro de Tauri, usando:

`convertFileSrc(selectedPath)`

el archivo se seleccionaba pero:

- duration = 0;
- dimensions = 0×0;
- metadata no llegaba;
- canplay devolvía MediaError code 4.

Esto señala al transporte `asset://`, no al codec del archivo.

## Investigación

Tauri mantiene un ejemplo oficial de reproducción de video mediante un custom
URI scheme que responde peticiones HTTP Range con `206 Partial Content`.

La arquitectura de Abraxas adopta ese patrón.

## Solución

Tauri:

native dialog
→ absolute path
→ Rust `register_media_source`
→ token opaco
→ `stream://localhost/<token>`
→ Rust range protocol
→ 206 + Content-Range
→ WKWebView `<video>`

La ruta absoluta no se introduce en la URL del DOM.

Cada respuesta está limitada a chunks, por lo que no se lee un master completo
de varios GB en memoria.

## Arquitectura resultante

Browser:
File → Blob URL → HTMLVideoElement

Tauri:
Path → Rust Range Stream → HTMLVideoElement

Futuro:
Master → Native/Source layer
Proxy/segment → VideoFlow composition layer
