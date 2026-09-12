# Ghost Model

## Regla central

Ghost es un ESTADO, no un tipo de recurso.

Cada recurso pendiente se representa en VideoFlow como un `GroupLayer`.

`resourceId Abraxas <-> VideoFlow GroupLayer.id`

Dentro del Group existe un TextLayer hijo con una descripción breve de lo que
debe agregarse. El TextLayer es editorial y se mantiene oculto del preview.

Cuando el recurso se materializa, NO se reemplaza el Group:

Group Ghost
- placeholder text

→

MISMO Group / MISMO resourceId
- image/video/audio/captions/etc

La información larga vive en Ghost Inspector.

Tracks:
SUBTÍTULOS / XR / IMÁGENES / MOTION / B-ROLL /
VO JOC / A-ROLL / PARTES / SFX / MÚSICA.
