# Ghost Model

## Contract

`contracts/ghost-resource.v1.schema.json`

Ghost es un estado. La representación de edición de un recurso Ghost es un
VideoFlow `GroupLayer`.

Identidad:

`resourceId Abraxas <-> VideoFlow GroupLayer.id`

## Timing obligatorio

La fuente de verdad es Alfa / Production Graph.

- `startTime = start`
- `sourceDuration = end - start`
- ningún Ghost puede prolongarse hasta el final por auto-layout.

## Contenido del Group Ghost

El Group contiene TextLayers editoriales ordenados:

1. `QUÉ VA AQUÍ`
2. `TIMING`
3. `PROMPT`
4. `REFERENCIA`
5. `HACER`

Puede haber varios Prompt/Referencia/Hacer.

Todos los TextLayers internos:
- empiezan en `0` relativo al Group;
- duran exactamente lo mismo que el Group;
- están ocultos del preview/render;
- siguen disponibles al abrir/inspeccionar el Group.

Materializar no reemplaza el Group:
se añaden children reales al MISMO `resourceId`.
