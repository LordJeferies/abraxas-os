# F1 Media Compatibility Plan

## Razón

R9.x permitió seleccionar media pero la reproducción no quedó certificada.

La nueva arquitectura no continuará hacia Production Timeline sobre una
suposición.

## Qué se valida

- WebKit/browser realmente decodifica el video.
- Tauri/WKWebView realmente decodifica el video.
- VideoFlow DOM Renderer puede usar la misma fuente.
- seek/scrub son funcionales.
- frame stepping básico es funcional.
- audio es audible.
- horizontal y vertical funcionan.
- reopen funciona.

## Qué NO valida todavía F1

- render final 4K;
- AVFoundation;
- VideoToolbox;
- cortes batch;
- captions;
- XR;
- ghosts;
- timeline definitiva.

Eso viene después de certificar playback.
