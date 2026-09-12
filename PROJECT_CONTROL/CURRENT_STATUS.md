# Estado actual

Fase: F1.6 · Alpha Ingestion & Domain Lock

F0 Foundation: COMPLETED.
F1 Media Compatibility: COMPLETED.
F1.5 Fast Source Runtime: base funcional.

## Integrated Alpha -> VideoFlow

Flujo compilado:

HTML / JSON
→ normalizeAlpha
→ AlphaContent
→ Content Registry persistente
→ Production Graph
→ VideoFlow Projection Adapter
→ VideoJSON
→ VideoEditor real

Cada TimelineDirective audiovisual válida genera un layer real de VideoFlow.

Tracks proyectables:
- STORY
- A-ROLL
- VO
- CAPTIONS
- XR
- B-ROLL
- MOTION
- TRANSITION
- SFX
- MUSIC

Identidad:
`resourceId <-> VideoFlow layer.id`

Timing:
Production Graph conserva los tiempos semánticos exactos.
La proyección de VideoFlow se alinea explícitamente a frames de 30fps.

Persistencia:
- Content Registry Alfa: IndexedDB
- draft VideoFlow: IndexedDB separado

Los Ghosts siguen siendo placeholders hasta materializarlos con assets/master.

Pendiente:
validación visual manual con un Story Editor real.

Gate:
F1_6_ALPHA_INGESTION_DOMAIN
