# ABRAXAS OS — CONTINUACIÓN PARA CHAT

> Este es el archivo normal para retomar el proyecto sin subir el ZIP completo.

## Identidad

- Producto: Abraxas OS
- Repo local: `~/Desktop/Abrxs os`
- Generado: 2026-09-11T20:41:03-04:00
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

Fase: F1.6 · Alpha Ingestion & Domain Lock

F0 Foundation: COMPLETED.
F1 Media Compatibility: COMPLETED.
F1.5 Fast Source Runtime: base funcional.
F1.6 Alpha Ingestion: build técnico aprobado; pendiente validación manual
con los tres Story Editors reales.

Implementado:
- HTML/JSON -> AlphaContent;
- Kanban;
- visor sin master;
- Ghost Timeline temporal;
- vista semántica;
- XR padre + estados internos;
- captions / Motion / SFX como pistas;
- Static Visual Graph para carruseles;
- preview/diff antes de reimportar.

Gate actual:
F1_6_ALPHA_INGESTION_DOMAIN


## Próximo paso

# Próximo paso

## Prueba manual F1.6

`./scripts/abraxas desktop`

Abrir:

`F1.6 · Alpha`

Importar en este orden:

1. JOC55 Amanda R10.1.
2. JOC 3 llamadas.
3. JOC Semanas 1-2.

Verificar:
- fichas Kanban;
- A-roll visible como texto sin master;
- captions;
- XR padre + estados internos;
- Motion;
- SFX;
- timeline temporal;
- timeline semántica;
- carruseles como Static Visual Graph;
- reimportación muestra diff antes de aplicar.

## Después

1. persistencia SQLite privada del Alfa;
2. source binding manual/automático vertical/horizontal;
3. drag/drop Finder -> Ghost/Timeline;
4. transcript worker real con whisper-cli;
5. cerrar F1.6 y abrir F2/F3.


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
  "currentPhase": "F1.6",
  "phaseName": "Alpha Ingestion & Domain Lock",
  "status": "in_progress",
  "lastCompletedStep": "F1.6 compila: HTML/JSON Alpha Import, Kanban, visor sin master, Ghost Timeline temporal/semántica y Static Visual Graph.",
  "blockedReason": null,
  "nextStep": "Validar los tres Story Editors reales; luego persistencia SQLite del Alfa, source binding y drag/drop Finder -> Ghost/Timeline.",
  "updatedAt": "2026-09-11T20:41:00-04:00",
  "releaseGate": "F1_6_ALPHA_INGESTION_DOMAIN",
  "progress": {
    "foundation": 100,
    "mediaCompatibility": 100,
    "editorShell": 0,
    "productionTimeline": 0,
    "fastSourceRuntime": 80,
    "alphaIngestion": 55
  },
  "lastCheck": {
    "status": "passed",
    "updatedAt": "2026-09-11T20:40:59-04:00"
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
    "videoFlowSafeSampleModeApplied": true,
    "browserVerticalChecksPass": true,
    "reopenMovedToF2": true,
    "mediaLabKeepAliveAcrossViews": true,
    "browserVerticalPass": true,
    "browserHorizontalPass": true,
    "tauriAssetProtocolCode4Observed": true,
    "tauriRangeStreamApplied": true,
    "tauriHttpRangeBridgeApplied": true,
    "nativeAVPlayerIsNextEscalation": true,
    "tauriSourceVerticalPlaybackPass": true,
    "tauriSourceHorizontalPlaybackPass": true,
    "tauriVideoFlowOriginalSourceHang": true,
    "applePreviewProxyApplied": true,
    "provenLegacyCutPlaybookAnalyzed": true,
    "ffmpegVideoToolboxCutEngineApplied": true,
    "swiftCutExperimentRetired": true,
    "provenCutEngineSelfTestPass": true,
    "automationPlanContractAdded": true,
    "f1ValidatorNonObjectJsonFixApplied": true,
    "f1ManualAttestationAccepted": true,
    "f1AllFourSlotsPass": true,
    "fastSourceRuntimeSelfTestPass": true,
    "sourceRegistryImplemented": true,
    "backgroundJobQueueImplemented": true,
    "cutWorkerImplemented": true,
    "runtimeUiIntegrated": true,
    "atomicJobClaimImplemented": true,
    "thumbnailWorkerSelfTestPass": true,
    "waveformWorkerSelfTestPass": true,
    "assetLibraryBaseImplemented": true,
    "transcriptionAdapterImplemented": true,
    "analysisAdapterImplemented": true,
    "alphaImportEnvelopeImplemented": true,
    "alphaHtmlImportImplemented": true,
    "alphaReimportDiffImplemented": true,
    "alphaViewerWithoutMasterImplemented": true,
    "ghostTimelineFromAlphaImplemented": true,
    "staticVisualGraphImportImplemented": true,
    "alphaTypeScriptBuildPass": true
  }
}
```

## Módulos

| ID | Módulo | Estado | Ruta |
|---|---|---|---|
| foundation | Foundation | completed | PROJECT_CONTROL |
| domain | Core Domain / Production Graph | in_progress | contracts |
| fast-source-runtime | Fast Source Runtime | in_progress | app/src/core/media |
| alpha-ingestion | Alpha Ingestion & Domain Lock | in_progress | app/src/modules/alpha |
| proven-cut-engine | Proven Cut Engine · FFmpeg + VideoToolbox | in_progress | scripts/abraxas_media_engine.py |
| media-lab | Media Compatibility Lab | completed | app/src/modules/media-lab |
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
| automation-runtime | Automation Runtime / Ghost Fulfillment | pending | app/src/core/automation |

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
```

### Remote

```text
origin	https://github.com/LordJeferies/abraxas-os.git (fetch)
origin	https://github.com/LordJeferies/abraxas-os.git (push)
```

### Últimos commits

```text
8424753 feat(alpha): stabilize Story Editor ingestion workspace
c235c30 chore: sync generated project state
2563c9a feat(runtime): add source jobs assets bundle
7810f59 chore: sync generated project state
d66dd7a feat(runtime): close F1 and add fast source job runtime
```

## Último check autoritativo

Archivo:
`docs/evidence/CHECK_20260911_204054.txt`

```text

OK Alpha Ingestion wiring.

[3/8] TypeScript + Vite

> abraxas-os@0.0.0 build
> tsc -b && vite build

vite v8.3.0 building client environment for production...
transforming...
✓ 210 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                     0.45 kB │ gzip:   0.29 kB
dist/assets/index-Tgdujzyh.css                      2.31 kB │ gzip:   1.01 kB
dist/assets/RuntimePanel-DtAfwpUF.css               4.72 kB │ gzip:   1.42 kB
dist/assets/MediaCompatibilityLab-DADf_X2z.css      5.52 kB │ gzip:   1.76 kB
dist/assets/AlphaWorkspace-C--cLnza.css            11.23 kB │ gzip:   2.86 kB
dist/assets/EditorSpike-DfuJObso.css               48.48 kB │ gzip:   6.59 kB
dist/assets/dist-js-D0VCXaEV.js                     0.26 kB │ gzip:   0.21 kB
dist/assets/RuntimePanel-JwHgy4pn.js                7.83 kB │ gzip:   2.53 kB
dist/assets/MediaCompatibilityLab-DlLjk7kL.js      14.55 kB │ gzip:   5.22 kB
dist/assets/AlphaWorkspace-CmqR6Oes.js             24.46 kB │ gzip:   7.88 kB
dist/assets/index-PMGYhBeH.js                     224.69 kB │ gzip:  70.54 kB
dist/assets/EditorSpike-BqgdkGsN.js               329.07 kB │ gzip:  62.35 kB
dist/assets/dist-Bvlp1drt.js                    1,704.83 kB │ gzip: 358.93 kB

✓ built in 224ms
[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.

[4/8] Rust / Tauri
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.24s

[5/8] Public repo guard
ABRAXAS PUBLIC REPO GUARD
=========================

✅ No se detectaron bloqueos para un repo público.

[6/8] Sync generated state
Status sincronizado: ~/Desktop/Abrxs os/site/data/status.json
~/Desktop/Abrxs os/continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md
      NORMALIZED:
 - continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md
 - continuacion en chat/ULTIMO_CHECK.txt
 - docs/evidence/CHECK_20260911_204054.txt

[7/8] Git whitespace FINAL

[8/8] Record successful check
Status sincronizado: ~/Desktop/Abrxs os/site/data/status.json
~/Desktop/Abrxs os/continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md
✅ Generated/evidence text already normalized.

✅ PROJECT CHECK PASSED
Log: ~/Desktop/Abrxs os/docs/evidence/CHECK_20260911_204054.txt
```

## Última actividad

```text

## 2026-09-11 15:19:02 -0400
v0.5.2: pipeline predictivo/higiene agregado. Frontend y Tauri pasan. Próximo: cuatro runs reales F1.

## 2026-09-11 16:05:29 -0400
v0.7: Browser Blob URL corregido; reportes F1 v2 y consolidador Browser/Tauri agregados. Sitio congelado hasta F1/F2.

## 2026-09-11 16:24:41 -0400
v0.7.1: scroll Media Lab corregido; Editor Spike deja de reinyectar VideoJSON en cada cambio. F1 sigue como gate actual.

## 2026-09-11 16:55:36 -0400
v0.7.2: VideoFlow F1 cambia a safe sample 8s; master completo queda en Source Player. Evita full-master DomRenderer crash.

## 2026-09-11 17:02:58 -0400
v0.7.3: reopen sale de F1; Media Lab conserva sesión entre vistas; validator recalcula PASS por checks relevantes.

## 2026-09-11 17:28:42 -0400
v0.8: Tauri media local usa localhost HTTP Range bridge; se crea MediaTransport adapter reutilizable. Browser PASS; faltan dos Tauri.

## 2026-09-11 17:41:35 -0400
v0.9: Tauri Source Playback PASS manual; VideoFlow Tauri ahora usa Apple AVFoundation 960x540 proxy. Última discriminación antes de elegir AVPlayer Preview.

## 2026-09-11 18:33:21 -0400
v0.12: F1 cerrado por atestación manual; Fast Source Runtime implementado con registry/jobs/probe/cut worker.

## 2026-09-11 18:48:42 -0400
v0.13: Sources/Jobs/Assets UI + thumbnail/waveform workers + transcript/analysis adapters.

## 2026-09-11 20:41:00 -0400
v0.14.3: repara preflight de directorios untracked, TS6133 y completa F1.6 hasta gates verdes.
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
