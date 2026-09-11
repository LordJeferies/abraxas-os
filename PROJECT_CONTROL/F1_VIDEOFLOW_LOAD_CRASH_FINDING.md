# F1 — VideoFlow load crash finding

## Qué ocurrió

Con un master vertical:

- 2160 × 3840;
- ~5455 s;
- aproximadamente 90.9 minutos;

`HTMLVideoElement` funciona correctamente.

Al pulsar `Load VideoFlow` con el master completo, Chrome terminó mostrando
"Aw, Snap" / error code 5.

Eso representa un crash del renderer del navegador, no una excepción JS
capturable por el Media Lab.

## Decisión F1

No usar `DomRenderer.loadVideo()` con el master completo como gate.

F1 queda dividido en:

### Master compatibility

HTMLVideoElement / Tauri source player:

- master completo;
- metadata;
- play;
- pause;
- seek;
- frame step;
- audio.

### VideoFlow composition compatibility

DomRenderer:

- una muestra acotada de 8 s;
- sourceDuration explícito;
- autoDetectDurations=false;
- canvas de preview con lado largo máximo 1080;
- audio muteado en la muestra.

El audio del master ya se valida en Source Player.

## Implicación de arquitectura

Los masters largos pertenecen al Source/Native Media layer.

VideoFlow se usa como composition/preview engine sobre:

- piezas seleccionadas;
- segmentos;
- proxies;
- timelines de producción;

no como reproductor bruto obligatorio de un master 4K de 90 minutos.

En F2/F3 se diseñará explícitamente esta frontera.
