# Timeline Model

## Fuente temporal única

`AlphaContent.timelineDirectives` es el Production Graph temporal canónico.

`sourcePayload.timeline` queda como provenance para Timeline Truth.

## Slots fijos

- T1 · A-ROLL
- T2 · XR
- T3 · IMAGES
- T4 · MOTION / TRANSITIONS
- T5 · B-ROLL
- T6 · VO JOC
- T7 · SFX
- T8 · MUSIC
- T9 · CAPTIONS

T1 nunca cambia de identidad y T9 siempre es la pista superior.
Story beats son metadata editorial y no consumen un Track numerado.

## Geometría

`left = start / duration`
`width = (end - start) / duration`

Los bloques usan wrappers absolutos aislados del CSS interno de VideoFlow.
Los huecos temporales del HTML permanecen huecos.

## Jerarquía

Un child resource puede estar anidado en VideoFlow dentro de su Ghost padre y,
al mismo tiempo, seguir apareciendo en su lane semántica canónica.

Ejemplo:
- XR root vive estructuralmente en T2.
- Image child aparece semánticamente en T3, pero está nested bajo el XR.
- Motion child aparece semánticamente en T4, pero está nested bajo el XR.
- SFX child aparece semánticamente en T7, pero está nested bajo el XR.
