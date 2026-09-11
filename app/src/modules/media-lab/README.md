# F1 — Media Compatibility Lab

## Objetivo

Demostrar que el stack elegido reproduce video REAL antes de construir la
Production Timeline encima.

## Dos caminos bajo prueba

### A. HTMLVideoElement

Prueba básica de WebKit/browser:

- load
- play
- pause
- seek
- scrub
- frame step
- audio

### B. VideoFlow DOM Renderer

Prueba del motor previsto para preview/composición:

- compile
- loadVideo
- play
- seek
- actual rendered FPS

## Selección de archivos

### Browser

`<input type="file">` + `URL.createObjectURL`.

### Tauri/macOS

`@tauri-apps/plugin-dialog` + `convertFileSrc`.

Tauri asset protocol está habilitado.

## Privacidad

Los reportes NO almacenan la ruta completa del archivo.

El material real permanece local.

## Gate F1

Se necesitan cuatro runs completos:

- browser + horizontal
- browser + vertical
- Tauri + horizontal
- Tauri + vertical

Compilar no completa F1.
