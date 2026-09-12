# Estado actual

Fase: F1.6 · Alpha Ingestion & Domain Lock

F0 Foundation: COMPLETED.
F1 Media Compatibility: COMPLETED.
F1.5 Fast Source Runtime: base funcional.

## Audited one-ficha VideoFlow

El importador HTML/JSON, el Content Registry y useAlphaStore se preservaron.

El Editor ahora interpreta `sourcePayload.timeline` mediante un adapter
específico de edición sin reescribir el normalizador estable.

Flujo:

HTML / JSON
→ AlphaContent persistente
→ seleccionar UNA ficha
→ seleccionar UNA ruta
→ EditorDirective[]
→ VideoJSON
→ VideoEditor real
→ Timeline semántico dentro del propio VideoEditor

Una ficha activa produce un solo VideoJSON.

Una ruta activa produce un draft independiente:
`contentId::route`.

Orden de pistas:
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

Los Ghosts continúan siendo layers reales de VideoFlow con:
`resourceId <-> layer.id`.

La vista `VideoFlow` nativa se conserva como fallback temporal para drag/trim.
La vista `Semántica` reemplaza sólo el panel Timeline y lee el VideoJSON vivo
con `useVideo()` + `usePlayhead()`.

Gate:
F1_6_ALPHA_INGESTION_DOMAIN
