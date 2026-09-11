# ABRAXAS OS — CONTINUACIÓN PARA CHAT

> Este es el archivo normal para retomar el proyecto sin subir el ZIP completo.

## Identidad

- Producto: Abraxas OS
- Repo local: `~/Desktop/Abrxs os`
- Generado: 2026-09-11T16:55:36-04:00
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

## F0 Foundation
COMPLETED.

## F1 Media Compatibility
IN PROGRESS.

Confirmado manualmente:

- Browser carga video real;
- video se visualiza;
- Play funciona;
- Pause funciona.

Corregido:

- scroll del Media Compatibility Lab;
- lifecycle del Blob URL;
- separación de reports Browser/Tauri.

Pendiente para cerrar F1:

- run Browser horizontal;
- run Browser vertical;
- run Tauri horizontal;
- run Tauri vertical;
- consolidar con `./scripts/abraxas f1-validate`.

## Editor Base

El comportamiento extraño de selección/texto no se ignora.

Encontramos un anti-patrón en nuestro wrapper:
`onChange={setVideo}` reinyectaba el VideoJSON al editor después de cada cambio.

El spike fue simplificado para dejar que VideoFlow mantenga selección,
playhead e history en su store interno.

Esto se vuelve a probar antes de construir F2.


## Próximo paso

# Próximo paso

## Repetir Browser vertical

`./scripts/abraxas web`

Usar el mismo video vertical.

El Source Player debe seguir trabajando con el master completo.

En la sección VideoFlow usar:

`Load VideoFlow sample (8s)`

Esa prueba ya NO intentará cargar los ~90 minutos dentro del DomRenderer.

Debe probar:

- VideoFlow sample load;
- Play Flow;
- Seek Flow.

El audio audible se certifica en el Source Player, no en el sample muteado.

## Si Browser vertical pasa

Completar:

- Browser horizontal;
- Tauri vertical;
- Tauri horizontal.

Luego:

`./scripts/abraxas f1-validate`

## Si incluso el sample de 8 s provoca crash

No insistir con el master bruto.

Se registra DomRenderer + blob 4K como no seguro para este source y el siguiente
paso será generar/use proxy para VideoFlow mientras el master permanece en el
Source/Native Player.


## De dónde venimos / hacia dónde vamos

# De dónde venimos y hacia dónde vamos

## De dónde venimos

ABRXOS R9.x dejó aprendizaje útil sobre Beta/Alfa, Story Editors, cortes,
paquetes IA y arquitectura Tauri/Rust/Swift.

Abraxas OS reutiliza ese aprendizaje con una arquitectura modular nueva.

## Dónde estamos ahora

F0 Foundation está completada.

Estamos en F1 Media Compatibility Lab.

El código de F1 compila en frontend y Tauri, pero todavía falta la prueba que
realmente importa: reproducir videos reales.

## Hacia dónde vamos inmediatamente

Certificar cuatro casos:

1. Browser horizontal.
2. Browser vertical.
3. Tauri horizontal.
4. Tauri vertical.

Después comienza F2 Editor Shell y F3 Production Timeline.

## Regla

El sitio público puede evolucionar en paralelo, pero no vuelve a bloquear el
roadmap de la aplicación.


## Estado estructurado

```json
{
  "project": "Abraxas OS",
  "schemaVersion": "abraxas.project-state.v1",
  "currentPhase": "F1",
  "phaseName": "Media Compatibility Lab",
  "status": "in_progress",
  "lastCompletedStep": "Master vertical completo reproduce correctamente en Browser Source Player. VideoFlow full-master provocó crash del renderer; F1 ahora valida VideoFlow con una muestra acotada segura de 8 s.",
  "blockedReason": null,
  "nextStep": "Repetir run Browser vertical usando Load VideoFlow sample (8s). Si pasa, completar Browser horizontal y los dos runs Tauri.",
  "updatedAt": "2026-09-11T16:55:36-04:00",
  "releaseGate": "F1_REAL_MEDIA_PLAYBACK",
  "progress": {
    "foundation": 100,
    "mediaCompatibility": 40,
    "editorShell": 0,
    "productionTimeline": 0
  },
  "lastCheck": {
    "status": "failed",
    "exitCode": 2,
    "updatedAt": "2026-09-11T15:55:18-04:00"
  },
  "publicSiteDeploy": {
    "status": "verified",
    "url": "https://lordjeferies.github.io/abraxas-os/",
    "checkedAt": "2026-09-11T15:30:45-04:00"
  },
  "publicSiteIsReleaseGate": false,
  "manualObservations": {
    "browserVideoLoads": true,
    "browserPlayPause": true,
    "mediaLabScrollFixApplied": true,
    "editorSpikeFeedbackLoopFixApplied": true,
    "videoFlowFullMasterCrashObserved": true,
    "videoFlowSafeSampleModeApplied": true
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
 M PROJECT_CONTROL/NEXT_STEP.md
 M PROJECT_CONTROL/PROJECT_STATE.json
 M PROJECT_CONTROL/SESSION_LOG.md
 M app/src-tauri/Cargo.toml
 M app/src/modules/media-lab/MediaCompatibilityLab.tsx
 M "continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md"
 M "continuacion en chat/ESTADO_ACTUAL.json"
 M "continuacion en chat/ULTIMO_PATCH_LOG.txt"
 M site/data/status.json
?? PROJECT_CONTROL/F1_VIDEOFLOW_LOAD_CRASH_FINDING.md
```

### Remote

```text
origin	https://github.com/LordJeferies/abraxas-os.git (fetch)
origin	https://github.com/LordJeferies/abraxas-os.git (push)
```

### Últimos commits

```text
a75fe12 fix(ui): restore media lab scroll and stabilize VideoFlow spike
695fc3e fix(f1): preserve browser media blob and add report consolidation
d4387d8 docs: record F1 publication state
7a47bff feat: publish F1 media lab and content renaissance site
12942a2 docs: record successful GitHub publication
```

## Último check autoritativo

Archivo:
`docs/evidence/CHECK_20260911_155515.txt`

```text
+
site/index.html:341: trailing whitespace.
+
site/index.html:356: trailing whitespace.
+
site/index.html:371: trailing whitespace.
+
site/index.html:376: trailing whitespace.
+
site/index.html:388: trailing whitespace.
+
site/index.html:403: trailing whitespace.
+
site/index.html:418: trailing whitespace.
+
site/index.html:433: trailing whitespace.
+
site/index.html:448: trailing whitespace.
+
site/index.html:453: trailing whitespace.
+
site/index.html:465: trailing whitespace.
+
site/index.html:480: trailing whitespace.
+
site/index.html:495: trailing whitespace.
+
site/index.html:510: trailing whitespace.
+
site/index.html:515: trailing whitespace.
+
site/index.html:527: trailing whitespace.
+
site/index.html:542: trailing whitespace.
+
site/index.html:557: trailing whitespace.
+
site/index.html:572: trailing whitespace.
+
site/index.html:587: trailing whitespace.
+
site/index.html:592: trailing whitespace.
+
Status sincronizado: ~/Desktop/Abrxs os/site/data/status.json
Patch log sincronizado: ABRAXAS_OS_V0_6_1_20260911_155514.log
~/Desktop/Abrxs os/continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md
                                                                                                                                                                                                                                                                                                            NORMALIZED:
 - continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md
 - continuacion en chat/ULTIMO_PATCH_LOG.txt
 - continuacion en chat/ULTIMO_CHECK.txt
 - docs/evidence/CHECK_20260911_155515.txt
 - docs/evidence/ABRAXAS_OS_V0_6_1_20260911_155514.log

❌ Project check falló. Revisar ULTIMO_CHECK / evidencia.

📁 Archivos para continuar en ChatGPT:
~/Desktop/Abrxs os/continuacion en chat

Normalmente sube:
~/Desktop/Abrxs os/continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md
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

## 2026-09-11 16:05:29 -0400
v0.7: Browser Blob URL corregido; reportes F1 v2 y consolidador Browser/Tauri agregados. Sitio congelado hasta F1/F2.

## 2026-09-11 16:24:41 -0400
v0.7.1: scroll Media Lab corregido; Editor Spike deja de reinyectar VideoJSON en cada cambio. F1 sigue como gate actual.

## 2026-09-11 16:55:36 -0400
v0.7.2: VideoFlow F1 cambia a safe sample 8s; master completo queda en Source Player. Evita full-master DomRenderer crash.
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
