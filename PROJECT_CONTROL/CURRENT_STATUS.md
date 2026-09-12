# Estado actual

Fase: F1.6 · Alpha Ingestion & Domain Lock

F0 Foundation: COMPLETED.
F1 Media Compatibility: COMPLETED.
F1.5 Fast Source Runtime: base funcional.

## Group Ghost model

Cada Ghost se proyecta como `GroupLayer` real de VideoFlow.

Dentro:
- TextLayer placeholder hijo;
- información corta;
- placeholder invisible en preview.

Fuera:
- Ghost Inspector contiene la información completa;
- prompts;
- references;
- instrucciones;
- raw Alpha context.

Ghost Info:
- docked;
- floating always-on-top.

Timeline semántica:
- fija dentro de VideoEditor;
- floating always-on-top para acompañar CapCut/DaVinci.

El Group conserva `resourceId <-> layer.id`.

La materialización futura añadirá assets al MISMO Group.

Gate:
F1_6_ALPHA_INGESTION_DOMAIN
