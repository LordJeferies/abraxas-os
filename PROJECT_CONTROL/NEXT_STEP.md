# Próximo paso

La reproducción de SOURCE en Tauri ya funciona en vertical y horizontal.

No repetir esa investigación.

## Reprobar sólo VideoFlow en Tauri

`./scripts/abraxas desktop`

Seleccionar vertical.

Completar los checks Source normales y después pulsar:

`Prepare proxy + Load VideoFlow (8s)`

Esperado:

1. UI sigue respondiendo.
2. Event Log muestra "Preparando Apple preview proxy".
3. Luego "Apple proxy listo".
4. VideoFlow DOM load pasa.
5. Play Flow pasa.
6. Seek Flow pasa.

Descargar JSON.

Repetir horizontal.

## Decisión

Si ambos proxies pasan:
`./scripts/abraxas f1-validate`
→ F2.

Si incluso el proxy 960x540 de 8 s congela WKWebView:
no crear más transportes.
F2 Preview backend pasa a AVPlayer/AVFoundation nativo.
