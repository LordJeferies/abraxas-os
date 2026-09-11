# Próximo paso

Browser ya está certificado en horizontal y vertical.

## Probar únicamente Tauri

`./scripts/abraxas desktop`

### Señales esperadas

Al seleccionar video:

- Source = `http`;
- metadata debe cargar;
- size y orientation dejan de ser unknown;
- Terminal debe mostrar:
  `[abraxas-media-http] ... bytes ...`

Completar vertical y horizontal.

## Si funciona

Descargar ambos reportes y ejecutar:

`./scripts/abraxas f1-validate`

Entonces empieza F2 Editor Shell.

## Si NO funciona

No crear otro transporte WebView.

El siguiente paso será Source Viewer nativo con AVPlayer/AVFoundation,
manteniendo VideoFlow para composición y Production Timeline.
