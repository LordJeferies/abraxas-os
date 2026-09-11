# ABRAXAS OS — CONTINUACIÓN PARA CHAT

> Este es el archivo normal para retomar el proyecto sin subir el ZIP completo.

## Identidad

- Producto: Abraxas OS
- Repo local: `~/Desktop/Abrxs os`
- Generado: 2026-09-11T15:30:25-04:00
- Rama Git: `main`
- GitHub público: https://github.com/LordJeferies/abraxas-os
- Status / Product page: https://lordjeferies.github.io/abraxas-os/
- Workspace privado de clientes: `CLIENTES_PRIVADOS_LOCAL/`

## Privacidad

El repositorio GitHub contiene código, contratos, documentación y ejemplos
publicables.

Videos, podcasts, transcripciones, assets y trabajos reales de clientes
NO pertenecen al repositorio. Se guardan localmente en
`CLIENTES_PRIVADOS_LOCAL/`.

## Regla de fuente de verdad

1. decisiones explícitas actuales;
2. código probado;
3. contratos actuales;
4. PROJECT_CONTROL;
5. documentación actual;
6. referencias;
7. histórico R9.x / legacy.

VideoFlow NO es la fuente de verdad.

La fuente de verdad audiovisual/editorial es Abraxas Production Graph.

Ghost NO es un tipo de recurso: es un estado.

Motion puede aplicarse a A-roll, B-roll, XR, imagen, texto/caption, etc.

SFX es independiente y opcional según contexto.

XR es una secuencia visual compuesta que puede contener varios estados/assets.

## Estado actual

# Estado actual

## F0 — Foundation
COMPLETED

Foundation continúa protegida por gates.

## F1 — Media Compatibility Lab
IN PROGRESS

El módulo ya existe en código.

Incluye dos caminos reales de preview:

1. HTMLVideoElement;
2. VideoFlow DOM Renderer.

También incluye:

- selección local browser;
- selector nativo macOS/Tauri;
- asset protocol;
- metadata;
- play/pause;
- scrub/seek;
- frame step;
- requestVideoFrameCallback;
- VideoFlow load/play/seek;
- confirmación manual de audio;
- confirmación manual de reopen;
- acumulación de runs horizontal/vertical;
- acumulación browser/Tauri;
- reporte JSON sin ruta privada del cliente.

## Release gate

F1 TODAVÍA NO está completada.

Debe ejecutarse realmente con:

- browser horizontal;
- browser vertical;
- Tauri horizontal;
- Tauri vertical.

Los cuatro runs deben quedar PASS.

## Sitio público

El sitio de status/producto fue rediseñado como una experiencia original de
scrollytelling "Content Renaissance", inspirada en la estructura narrativa de
sitios editoriales inmersivos, usando arte público de Michelangelo como hero.

No contiene assets propietarios de Shopify.


## Próximo paso

# Próximo paso

## Ejecutar F1

### Browser

Desde el repo:

`./scripts/abraxas web`

Probar:

1. video horizontal real;
2. video vertical real.

En cada uno:

- seleccionar video;
- play;
- pause;
- mover scrubber;
- frame step;
- Load VideoFlow;
- Play Flow;
- Seek Flow;
- confirmar Audio audible;
- confirmar Reopen sólo después de haber cerrado/reabierto y repetido carga;
- guardar run.

### Tauri

`./scripts/abraxas desktop`

Repetir:

1. horizontal;
2. vertical.

### Gate

Cuando las cuatro celdas acumuladas estén verdes, descargar/copiar reporte.

Sólo después se evaluará marcar F1 como COMPLETED.

## En paralelo

La web pública puede revisarse en GitHub Pages después del push.


## De dónde venimos / hacia dónde vamos

# De dónde venimos y hacia dónde vamos

## De dónde venimos

ABRXOS R9.x demostró y exploró:

- contratos Beta/Alfa;
- importación y normalización;
- Story Editors HTML;
- cortes y automatizaciones;
- arquitectura Tauri/Rust/Swift;
- conceptos de SHIM y producción editorial.

La nueva rama Abraxas OS NO elimina ese aprendizaje, pero comienza con una
arquitectura más limpia y modular.

El primer bootstrap de Abraxas OS creó Foundation parcialmente.
El segundo bootstrap instaló VideoFlow y Tauri, pero el primer build detectó
que `VideoJSON` de VideoFlow exige `backgroundColor`.

Ese error se corrige de forma localizada en v0.3.

## Dónde estamos

Estamos cerrando F0 — Foundation.

Todavía NO hemos demostrado reproducción real de un MP4 dentro de Tauri.

## A dónde vamos inmediatamente

F1 — Media Compatibility Lab.

Debe demostrar con archivos reales:

- load;
- play;
- pause;
- seek;
- scrub;
- audio;
- frame step;
- horizontal;
- vertical;
- reopen.

## Dirección de producto

Después de F1:

- Editor Shell;
- Production Timeline;
- objetos fantasma;
- inspector;
- Alfa Adapter;
- XR Studio;
- Asset Workflow;
- Apple Native Cut/Render;
- SHIM;
- Sol Blanco / Sol Negro;
- Beta / Alfa;
- captions;
- Visual Studio;
- Arquitecto;
- Omega / Review;
- Calendar;
- Publisher.

Luna 2 y Luna 3 quedan para etapas posteriores.


## Estado estructurado

```json
{
  "project": "Abraxas OS",
  "schemaVersion": "abraxas.project-state.v1",
  "currentPhase": "F1",
  "phaseName": "Media Compatibility Lab",
  "status": "in_progress",
  "lastCompletedStep": "v0.5.2: build frontend y Tauri pasan; se añadieron gates predictivos, coherencia Tauri y normalización automática. Falta certificar media real.",
  "blockedReason": null,
  "nextStep": "Ejecutar cuatro runs reales F1: browser horizontal, browser vertical, Tauri horizontal y Tauri vertical.",
  "updatedAt": "2026-09-11T15:30:24-04:00",
  "releaseGate": "F1_REAL_MEDIA_PLAYBACK",
  "progress": {
    "foundation": 100,
    "mediaCompatibility": 30,
    "editorShell": 0,
    "productionTimeline": 0
  },
  "lastCheck": {
    "status": "passed",
    "updatedAt": "2026-09-11T15:30:24-04:00"
  }
}
```

## Módulos

| ID | Módulo | Estado | Ruta |
|---|---|---|---|
| foundation | Foundation | completed | PROJECT_CONTROL |
| domain | Core Domain / Production Graph | started | contracts |
| media-lab | Media Compatibility Lab | in_progress | app/src/modules/media-lab |
| editor-shell | Editor Shell | pending | app/src/modules/editor-shell |
| timeline | Production Timeline | pending | app/src/modules/timeline |
| inspector | Inspector | pending | app/src/modules/inspector |
| xr-studio | XR Studio | pending | app/src/modules/xr-studio |
| assets | Asset Workflow | pending | app/src/modules/assets |
| captions | Captions Studio | pending | app/src/modules/captions |
| visual-studio | Visual / Carousel Studio | pending | app/src/modules/visual-studio |
| apple-media | Apple Media Engine | pending | native/apple |
| architect | Arquitecto | pending | app/src/modules/architect |
| review | Omega / Review | pending | app/src/modules/review |
| calendar | Calendar | pending | app/src/modules/calendar |
| publisher | Publisher | pending | app/src/modules/publisher |
| public-site | Status / Product Website | in_progress | site |

## Versiones clave

```json
{
  "node": "v24.18.0",
  "npm": "11.16.0",
  "react": "^19.2.8",
  "@videoflow/core": "^1.3.3",
  "@videoflow/react-video-editor": "^1.3.3",
  "@tauri-apps/api": "^2.11.1",
  "@tauri-apps/cli": "^2.11.4",
  "typescript": "~6.0.2",
  "vite": "^8.3.0"
}
```

## Git

### Status

```text
## main...origin/main
M  PROJECT_CONTROL/CURRENT_STATUS.md
A  PROJECT_CONTROL/ERROR_PREVENTION_POLICY.md
A  PROJECT_CONTROL/F1_MEDIA_COMPATIBILITY_PLAN.md
A  PROJECT_CONTROL/KNOWN_WARNINGS.md
M  PROJECT_CONTROL/MODULES.json
M  PROJECT_CONTROL/NEXT_STEP.md
M  PROJECT_CONTROL/PROJECT_STATE.json
M  PROJECT_CONTROL/SESSION_LOG.md
M  app/package-lock.json
M  app/package.json
M  app/src-tauri/Cargo.lock
M  app/src-tauri/Cargo.toml
M  app/src-tauri/capabilities/default.json
M  app/src-tauri/src/lib.rs
M  app/src-tauri/tauri.conf.json
M  app/src/App.css
M  app/src/App.tsx
A  app/src/core/state/useAppStore.ts
M  app/src/index.css
A  app/src/modules/editor-shell/EditorSpike.tsx
A  app/src/modules/media-lab/MediaCompatibilityLab.tsx
M  app/src/modules/media-lab/README.md
A  app/src/modules/media-lab/media-lab.css
M  "continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md"
M  "continuacion en chat/ESTADO_ACTUAL.json"
M  "continuacion en chat/ULTIMO_CHECK.txt"
AD "continuacion en chat/ULTIMO_ERROR.md"
A  "continuacion en chat/ULTIMO_PATCH_LOG.txt"
M  docs/evidence/CHECK_20260911_142937.txt
M  docs/evidence/CHECK_20260911_143556.txt
M  docs/evidence/CHECK_20260911_143602.txt
M  docs/evidence/CHECK_20260911_144956.txt
A  docs/evidence/CHECK_20260911_151031.txt
A  docs/evidence/CHECK_20260911_151356.txt
A  docs/evidence/CHECK_20260911_151858.txt
A  docs/evidence/CHECK_20260911_153021.txt
M  scripts/check_project.sh
A  scripts/check_syntax.sh
A  scripts/check_tauri_coherence.py
M  scripts/finalize_update.sh
A  scripts/normalize_generated_text.py
A  scripts/preflight_predictive.py
A  scripts/sync_latest_patch_log.py
A  site/assets/creation-hands.jpg
M  site/assets/site.js
M  site/assets/style.css
A  site/data/content.json
M  site/data/status.json
M  site/index.html
```

### Remote

```text
origin	https://github.com/LordJeferies/abraxas-os.git (fetch)
origin	https://github.com/LordJeferies/abraxas-os.git (push)
```

### Últimos commits

```text
12942a2 docs: record successful GitHub publication
03d0e78 chore: finalize GitHub public setup
3946491 chore: publish Abraxas OS foundation
```

## Último check autoritativo

Archivo:
`docs/evidence/CHECK_20260911_153021.txt`

```text

[2/8] Tauri config coherence
ABRAXAS · TAURI COHERENCE CHECK
================================

✅ Configuración Tauri/Cargo/plugins coherente.

[3/8] TypeScript + Vite

> abraxas-os@0.0.0 build
> tsc -b && vite build

vite v8.3.0 building client environment for production...
transforming...
✓ 204 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                     0.45 kB │ gzip:   0.29 kB
dist/assets/index-Bf5GYW6i.css                      2.18 kB │ gzip:   0.98 kB
dist/assets/MediaCompatibilityLab-BJdpb-Oa.css      5.40 kB │ gzip:   1.71 kB
dist/assets/EditorSpike-DfuJObso.css               48.48 kB │ gzip:   6.59 kB
dist/assets/MediaCompatibilityLab-BDgEXvvc.js      12.90 kB │ gzip:   4.45 kB
dist/assets/index-DAYfg3X0.js                     223.71 kB │ gzip:  70.29 kB
dist/assets/EditorSpike-CumHErcO.js               329.10 kB │ gzip:  62.36 kB
dist/assets/dist-C70y3Iyj.js                    1,704.83 kB │ gzip: 358.93 kB

[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 206ms

[4/8] Rust / Tauri
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.49s

[5/8] Public repo guard
ABRAXAS PUBLIC REPO GUARD
=========================

✅ No se detectaron bloqueos para un repo público.

[6/8] Sync generated state
Status sincronizado: ~/Desktop/Abrxs os/site/data/status.json
~/Desktop/Abrxs os/continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md
 NORMALIZED:
 - continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md
 - continuacion en chat/ULTIMO_CHECK.txt
 - docs/evidence/CHECK_20260911_153021.txt
 - docs/evidence/ABRAXAS_OS_V0_5_3_20260911_153021.log

[7/8] Git whitespace FINAL

[8/8] Record successful check
Status sincronizado: ~/Desktop/Abrxs os/site/data/status.json
~/Desktop/Abrxs os/continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md
✅ Generated/evidence text already normalized.

✅ PROJECT CHECK PASSED
Log: ~/Desktop/Abrxs os/docs/evidence/CHECK_20260911_153021.txt
```

## Última actividad

```text
# Session Log

## 2026-09-11 14:03:22 -0400
Inicio de recuperación no destructiva del bootstrap Foundation.

## 2026-09-11 14:30:09 -0400
Patch v0.3: backgroundColor corregido, Continuación en Chat automática, CLI unificada y GitHub público preparado.

## 2026-09-11 14:36:00 -0400
v0.4: estado coherente, workspace privado, GitHub LordJeferies configurado, CI y finalizador automático añadidos.

## 2026-09-11 14:50:04 -0400
GitHub public push corregido con scope workflow. Repo publicado; siguiente F1 Media Compatibility Lab.

## 2026-09-11 15:19:02 -0400
v0.5.2: pipeline predictivo/higiene agregado. Frontend y Tauri pasan. Próximo: cuatro runs reales F1.
```

## Archivos clave

- [x] `PROJECT_CONTROL/00_LEEME_PRIMERO.md`
- [x] `PROJECT_CONTROL/CURRENT_STATUS.md`
- [x] `PROJECT_CONTROL/NEXT_STEP.md`
- [x] `PROJECT_CONTROL/FROM_TO.md`
- [x] `PROJECT_CONTROL/PROJECT_STATE.json`
- [x] `PROJECT_CONTROL/MODULES.json`
- [x] `PROJECT_CONTROL/GITHUB.json`
- [x] `PROJECT_CONTROL/DEVELOPMENT_PROTOCOL.md`
- [x] `docs/architecture/ABRAXAS_OS_MASTER_SPEC.md`
- [x] `docs/architecture/RELEASE_GATES.md`
- [x] `docs/decisions/DECISIONS.md`
- [x] `docs/roadmap/ROADMAP.md`
- [x] `contracts/production-graph.v1.schema.json`
- [x] `examples/production-graph.demo.json`
- [x] `app/package.json`
- [x] `app/src/App.tsx`
- [x] `app/src-tauri/tauri.conf.json`
- [x] `site/index.html`
- [x] `.github/workflows/pages.yml`

## Cómo continuar correctamente

1. Leer este archivo.
2. Identificar el módulo actual.
3. Inspeccionar únicamente los archivos relevantes.
4. Preservar los módulos que ya funcionan.
5. Aplicar un patch pequeño/reversible.
6. Ejecutar gates.
7. Actualizar PROJECT_CONTROL.
8. Regenerar esta carpeta.
9. Pedir el ZIP completo sólo cuando sea realmente necesario.
