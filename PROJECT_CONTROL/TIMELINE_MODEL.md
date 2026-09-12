# Timeline Model

Contrato:
`contracts/alpha-editor-projection.v1.schema.json`

Semántica, Ficha Review y Floating Timeline usan el mismo modelo canónico:

`app/src/core/alpha/alphaTimelineModel.ts`

Orden único de lanes:

1. SUBTÍTULOS
2. XR
3. IMÁGENES
4. MOTION
5. B-ROLL
6. VO JOC
7. A-ROLL
8. PARTES
9. SFX
10. MÚSICA

Cada tipo tiene UNA sola lane.

La posición horizontal usa solamente:
- `left = start`
- `width = end - start`

VideoFlow no decide el timing editorial del Ghost.
