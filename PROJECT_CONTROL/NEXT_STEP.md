# Próximo paso

## F1
COMPLETED.

## F1.5 implementado

- Source Registry.
- Proven Cut Engine.
- Background Job Queue con claim atómico.
- Thumbnail worker.
- Waveform coarse worker.
- Asset Library base.
- Sources / Jobs / Assets UI dentro de Tauri.
- Adapter de transcripción con autodetección de backend.
- Adapter de análisis semántico por configuración.

## Probar

`./scripts/abraxas desktop`

Abrir `F1.5 · Sources & Jobs`.

Registrar un master y pulsar `Prepare timeline`.
Agregar una carpeta de fotos/video/audio con `+ Carpeta de assets`.

## Siguiente

Activar un backend real de transcripción y un proveedor de análisis semántico.
No se instala un modelo pesado a ciegas: el runtime detecta backends disponibles
y deja esos jobs en `blocked` mientras no haya uno configurado.

Después comienza F2 Editor Shell.
