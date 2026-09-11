# ABRAXAS OS — CONTINUACIÓN PARA CHAT

> Este es el archivo normal para retomar el proyecto sin subir el ZIP completo.

## Identidad

- Producto: Abraxas OS
- Repo local: `~/Desktop/Abrxs os`
- Generado: 2026-09-11T14:36:04-04:00
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

Validado automáticamente:

- contratos JSON;
- React + TypeScript + Vite;
- VideoFlow instalado;
- Tauri 2 creado;
- build frontend;
- Cargo/Tauri check;
- Git whitespace;
- guard para repositorio público.

## F1 — Media Compatibility Lab
PENDING / NEXT

Todavía NO se afirma que el reproductor funcione con material real.

La siguiente prueba debe usar archivos MP4 reales y comprobar:

- load;
- play;
- pause;
- seek;
- scrub;
- audio;
- frame step;
- master horizontal;
- master vertical;
- reopen;
- browser;
- Tauri / WKWebView.

## GitHub

El repositorio objetivo es público:

https://github.com/LordJeferies/abraxas-os

GitHub Pages:

https://lordjeferies.github.io/abraxas-os/

## Datos reales de clientes

Todo material privado debe almacenarse en:

`CLIENTES_PRIVADOS_LOCAL/`

El contenido de esa carpeta NO se publica en GitHub.


## Próximo paso

# Próximo paso

## F1 — Media Compatibility Lab

La siguiente actualización de código debe concentrarse en:

`app/src/modules/media-lab`

y únicamente en adapters/core necesarios para reproducir medios.

## Prueba obligatoria

Seleccionar un MP4 REAL y validar:

1. metadata;
2. load;
3. play;
4. pause;
5. seek;
6. scrub;
7. audio;
8. frame step;
9. vertical;
10. horizontal;
11. reopen;
12. ejecución en navegador;
13. ejecución dentro de Tauri.

## Regla

No comenzar Production Timeline sobre un reproductor no validado.

No reconstruir Foundation.

No tocar módulos ajenos salvo que exista una dependencia técnica demostrable.


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
  "status": "pending",
  "lastCompletedStep": "F0 Foundation completada y validada: frontend build, Cargo/Tauri check y public-repo guard pasan.",
  "blockedReason": null,
  "nextStep": "Implementar Media Compatibility Lab y demostrar reproducción de MP4 real en browser y Tauri.",
  "updatedAt": "2026-09-11T14:36:04-04:00",
  "releaseGate": "F1_REAL_MEDIA_PLAYBACK",
  "progress": {
    "foundation": 100,
    "mediaCompatibility": 0,
    "editorShell": 0,
    "productionTimeline": 0
  },
  "lastCheck": {
    "status": "passed",
    "updatedAt": "2026-09-11T14:36:04-04:00"
  }
}
```

## Módulos

| ID | Módulo | Estado | Ruta |
|---|---|---|---|
| foundation | Foundation | completed | PROJECT_CONTROL |
| domain | Core Domain / Production Graph | started | contracts |
| media-lab | Media Compatibility Lab | pending | app/src/modules/media-lab |
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
| public-site | Status / Product Website | started | site |

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
## No commits yet on main
?? .github/
?? .gitignore
?? CLIENTES_PRIVADOS_LOCAL/
?? PROJECT_CONTROL/
?? README.md
?? app/
?? archive/
?? "continuacion en chat/"
?? contracts/
?? docs/
?? examples/
?? packages/
?? scripts/
?? site/
```

### Remote

```text
SIN REMOTE
```

### Últimos commits

```text
fatal: your current branch 'main' does not have any commits yet
```

## Último check autoritativo

Archivo:
`docs/evidence/CHECK_20260911_143602.txt`

```text
ABRAXAS OS PROJECT CHECK
========================
Date: 2026-09-11 14:36:02 -0400

[1/6] JSON canonical files
OK PROJECT_CONTROL/PROJECT_STATE.json
OK PROJECT_CONTROL/MODULES.json
OK PROJECT_CONTROL/GITHUB.json
OK contracts/production-graph.v1.schema.json
OK examples/production-graph.demo.json
OK app/package.json
OK app/src-tauri/tauri.conf.json

[2/6] TypeScript + Vite

> abraxas-os@0.0.0 build
> tsc -b && vite build

vite v8.3.0 building client environment for production...
transforming...
✓ 197 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.45 kB │ gzip:   0.29 kB
dist/assets/index-BiAW1H3s.css     50.06 kB │ gzip:   7.16 kB
dist/assets/index-DGQjAUnD.js   2,242.36 kB │ gzip: 486.37 kB

[plugin builtin:vite-reporter] 
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 194ms

[3/6] Rust / Tauri
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.18s

[4/6] Git whitespace

[5/6] Public repo guard
ABRAXAS PUBLIC REPO GUARD
=========================

✅ No se detectaron bloqueos para un repo público.

[6/6] Registrar check SIN cambiar la fase
Status sincronizado: ~/Desktop/Abrxs os/site/data/status.json
~/Desktop/Abrxs os/continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md

✅ PROJECT CHECK PASSED

📁 Archivos para continuar en ChatGPT:
~/Desktop/Abrxs os/continuacion en chat

Normalmente sube:
~/Desktop/Abrxs os/continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md

Log: ~/Desktop/Abrxs os/docs/evidence/CHECK_20260911_143602.txt
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
