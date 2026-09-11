# F2 — Session / Project Persistence

## Qué era `Reopen`

En F1 se había añadido una comprobación manual para cerrar/reabrir la app y
volver a cargar el mismo archivo.

Ese check mezclaba dos problemas diferentes:

- compatibilidad/reproducción de media;
- persistencia de sesión/proyecto.

Por eso `reopen` deja de bloquear F1.

## Qué sí pertenece a F2

F2 debe definir cómo Abraxas conserva:

- proyecto abierto;
- masters seleccionados;
- playhead;
- selección;
- timeline;
- assets;
- inspector;
- estado de ventanas;
- última vista.

## Cambio provisional útil

Mientras seguimos en F1, Media Lab queda montado al cambiar a Editor Base.

Eso permite ir:

Media Lab -> Editor Base -> Media Lab

sin perder:

- video seleccionado;
- checks;
- metadata;
- report state.

Al ocultarse, el playback se pausa para no consumir recursos innecesarios.
