# F1 — Tauri VideoFlow proxy finding

## Estado comprobado

El localhost HTTP Range bridge resolvió Source Playback en Tauri.

El usuario pudo:

- cargar vertical;
- reproducir vertical;
- pausar vertical;
- escuchar vertical;
- cargar horizontal;
- reproducir horizontal;
- pausar horizontal;
- escuchar horizontal.

Por tanto, la frontera Source → Tauri/WKWebView está resuelta.

## Problema restante

Al pulsar Load VideoFlow sample, la app queda sin responder y no completa
VideoFlow DOM load.

No es un comportamiento aceptable ni se interpreta como "todavía pensando".

## Razón arquitectónica probable

Aunque la composición se limite a 8 s y el canvas a 1080, la fuente de la capa
seguía siendo el master 4K original.

Reducir el tamaño de salida no reduce automáticamente el costo de decodificar
el source.

## Solución actual

Para Tauri:

master
→ AVFoundation
→ proxy temporal de 8 s usando AVAssetExportPreset960x540
→ H.264/AAC MP4 optimizado
→ localhost HTTP Range
→ VideoFlow DOM Renderer.

Browser mantiene la prueba original porque ya pasa.

## Límite

Si DomRenderer también congela WKWebView con un proxy Apple pequeño de 8 s:

- se marca VideoFlow DOM media preview como no apto dentro de Tauri/WKWebView;
- NO se sigue parcheando F1 con más transportes;
- F2 usa AVPlayer/AVFoundation como Preview backend;
- VideoFlow Core sigue disponible para modelo/composición/export donde sea útil.
