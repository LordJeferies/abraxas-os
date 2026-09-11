# Estado actual

## F0 Foundation
COMPLETED.

## F1 Media Compatibility
IN PROGRESS.

Confirmado manualmente:

- Browser carga video real;
- video se visualiza;
- Play funciona;
- Pause funciona.

Corregido:

- scroll del Media Compatibility Lab;
- lifecycle del Blob URL;
- separación de reports Browser/Tauri.

Pendiente para cerrar F1:

- run Browser horizontal;
- run Browser vertical;
- run Tauri horizontal;
- run Tauri vertical;
- consolidar con `./scripts/abraxas f1-validate`.

## Editor Base

El comportamiento extraño de selección/texto no se ignora.

Encontramos un anti-patrón en nuestro wrapper:
`onChange={setVideo}` reinyectaba el VideoJSON al editor después de cada cambio.

El spike fue simplificado para dejar que VideoFlow mantenga selección,
playhead e history en su store interno.

Esto se vuelve a probar antes de construir F2.
