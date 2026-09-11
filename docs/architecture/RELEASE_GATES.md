# Release Gates

## Gate F1 — Real Media Playback

Debe aprobarse con archivos reales.

Browser:
- MP4 carga
- play
- pause
- seek
- scrub
- frame navigation
- audio

Tauri/macOS:
- MP4 carga
- play
- pause
- seek
- scrub
- frame navigation
- audio

También:
- master horizontal
- master vertical
- reopen
- no black screen
- no silent failure

Compilar NO equivale a aprobar este gate.

## Gate de datos

No se pierde:

- sourceRange
- editorialRange
- segmentId
- eventId
- relaciones parent/target
- ghost state
- versiones

Los segmentos discontinuos nunca se colapsan silenciosamente.

## Gate de UI

Debe ser usable sin mostrar toda la complejidad simultáneamente.

Progressive disclosure obligatorio.
