# F2 — VideoFlow Spike Findings

## Qué ya funciona

El editor base carga y permite:

- añadir video;
- añadir imagen;
- añadir texto;
- visualizar timeline;
- visualizar inspector;
- preview de composición.

## Problema observado

Durante el spike se observó:

- selección que se perdía después de mover una capa;
- escribir una letra podía hacer perder foco;
- el playhead/timeline podía volver a cero.

## Causa probable en nuestra integración

`EditorSpike` trataba `VideoEditor` como componente totalmente controlado:

`video={video}`
+
`onChange={setVideo}`

VideoFlow mantiene internamente:

- selección;
- playhead;
- history;
- viewport;
- documento de edición.

Reinyectar un nuevo `VideoJSON` desde React después de cada commit puede
interferir con ese estado interactivo.

## Corrección

El spike ahora entrega un `VideoJSON` inicial estable y deja la sesión activa
dentro del store de VideoFlow.

La persistencia real de F2 se hará mediante adapter/autosave, sin rehidratar
el editor en cada tecla o drag.

## Qué debemos comprobar después de F1

Smoke test del Editor Spike:

1. añadir texto;
2. escribir una frase completa;
3. seleccionar/mover varias veces sin perder selección;
4. cambiar font/size/color;
5. mover playhead;
6. añadir imagen/video;
7. confirmar que el playhead no salta a 0 por editar una propiedad.

Si el comportamiento persiste con el wrapper limpio, entonces se investiga como
problema del editor VideoFlow/browser y no como feedback loop de Abraxas.
