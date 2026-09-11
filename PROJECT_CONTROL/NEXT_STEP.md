# Próximo paso

## Repetir Browser vertical

`./scripts/abraxas web`

Usar el mismo video vertical.

El Source Player debe seguir trabajando con el master completo.

En la sección VideoFlow usar:

`Load VideoFlow sample (8s)`

Esa prueba ya NO intentará cargar los ~90 minutos dentro del DomRenderer.

Debe probar:

- VideoFlow sample load;
- Play Flow;
- Seek Flow.

El audio audible se certifica en el Source Player, no en el sample muteado.

## Si Browser vertical pasa

Completar:

- Browser horizontal;
- Tauri vertical;
- Tauri horizontal.

Luego:

`./scripts/abraxas f1-validate`

## Si incluso el sample de 8 s provoca crash

No insistir con el master bruto.

Se registra DomRenderer + blob 4K como no seguro para este source y el siguiente
paso será generar/use proxy para VideoFlow mientras el master permanece en el
Source/Native Player.
