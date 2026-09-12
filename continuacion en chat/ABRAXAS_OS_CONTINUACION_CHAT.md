# ABRAXAS OS — CONTINUACIÓN PARA CHAT

> Este es el archivo normal para retomar el proyecto sin subir el ZIP completo.

## Identidad

- Producto: Abraxas OS
- Repo local: `~/Desktop/Abrxs os`
- Generado: 2026-09-11T21:29:26-04:00
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


## Próximo paso

# Próximo paso

## Prueba visual final de F1.6

1. `./scripts/abraxas desktop`
2. abrir `F1.6 · Alpha`
3. importar Amanda R10.1 si no está persistida
4. confirmar las fichas Alfa
5. abrir una ficha VIDEO con `Editar →`
6. debe abrir el VideoEditor real
7. la timeline de VideoFlow debe contener los Ghost layers importados del Alfa
8. deben aparecer placeholders con 👻
9. cambiar a otra ficha desde el selector del Editor
10. salir y volver al Editor
11. el draft debe persistir
12. `Regenerar desde Alfa` debe reconstruir el VideoJSON canónico

## Después

1. vincular master vertical/horizontal
2. A-roll Ghost -> clip master real
3. XR Ghost -> imágenes/video/grupo
4. B-roll Ghost -> clip real
5. SFX Ghost -> audio real
6. captions -> CaptionsLayer real
7. Motion -> keyframes/animations
8. Global Drop Router Finder/Asset Library -> Ghost
9. sync VideoFlow -> Production Graph
10. SQLite privado
11. whisper-cli real


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
  "lastCompletedStep": "Integrated Alpha -> VideoFlow compila: HTML/JSON crea fichas Alfa persistentes y todas las TimelineDirectives audiovisuales válidas se proyectan como layers Ghost reales en VideoFlow.",
  "blockedReason": null,
  "nextStep": "Prueba visual con Amanda. Si los Ghost layers aparecen en la timeline real de VideoFlow, comenzar Source Binding + Ghost Materialization.",
  "updatedAt": "2026-09-11T21:29:22-04:00",
  "releaseGate": "F1_6_ALPHA_INGESTION_DOMAIN",
  "progress": {
    "foundation": 100,
    "mediaCompatibility": 100,
    "editorShell": 32,
    "productionTimeline": 22,
    "fastSourceRuntime": 80,
    "alphaIngestion": 88
  },
  "lastCheck": {
    "status": "passed",
    "updatedAt": "2026-09-11T21:29:22-04:00"
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
    "alphaTypeScriptBuildPass": true,
    "alphaGlobalRegistryImplemented": true,
    "alphaIndexedDbPersistenceImplemented": true,
    "alphaCrossViewPersistenceImplemented": true,
    "alphaEditorBridgeImplemented": true,
    "alphaMultipleDocumentsRegistryImplemented": true,
    "alphaHtmlToVideoFlowProjectionBuildPass": true,
    "alphaAllAudiovisualDirectivesProjectToVideoFlow": true,
    "alphaVideoFlowFrameQuantizationHandled": true,
    "alphaVideoFlowLayerIdSidecarImplemented": true,
    "alphaVideoFlowDraftPersistenceImplemented": true,
    "alphaVideoFlowCandidateBuiltBeforeApply": true,
    "alphaVideoFlowManualUiPass": false
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
| editor-shell | Editor Shell | in_progress | app/src/modules/editor-shell |
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
fe09ad1 feat(editor): safely integrate alpha ghosts into VideoFlow
55fa827 chore: sync generated project state
8424753 feat(alpha): stabilize Story Editor ingestion workspace
c235c30 chore: sync generated project state
2563c9a feat(runtime): add source jobs assets bundle
```

## Último check autoritativo

Archivo:
`docs/evidence/CHECK_20260911_212915.txt`

```text

OK HTML Alpha -> fichas -> Ghost layers -> real VideoFlow editor.

[3/8] TypeScript + Vite

> abraxas-os@0.0.0 build
> tsc -b && vite build

vite v8.3.0 building client environment for production...
transforming...
✓ 215 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                     0.45 kB │ gzip:   0.28 kB
dist/assets/index-Tgdujzyh.css                      2.31 kB │ gzip:   1.01 kB
dist/assets/AlphaWorkspace-DnddpBeD.css             4.42 kB │ gzip:   1.35 kB
dist/assets/RuntimePanel-DtAfwpUF.css               4.72 kB │ gzip:   1.42 kB
dist/assets/MediaCompatibilityLab-DADf_X2z.css      5.52 kB │ gzip:   1.76 kB
dist/assets/EditorSpike-J7ZKtVHS.css               50.31 kB │ gzip:   7.06 kB
dist/assets/dist-js-D0VCXaEV.js                     0.26 kB │ gzip:   0.21 kB
dist/assets/RuntimePanel-aKG1NMNU.js                7.84 kB │ gzip:   2.52 kB
dist/assets/MediaCompatibilityLab-Df1Zog2c.js      14.56 kB │ gzip:   5.22 kB
dist/assets/AlphaWorkspace-DrtmVAyE.js             16.02 kB │ gzip:   5.73 kB
dist/assets/index-auCEDnzv.js                     228.32 kB │ gzip:  71.63 kB
dist/assets/EditorSpike-DPzIfqQ4.js               336.27 kB │ gzip:  64.65 kB
dist/assets/dist-DrSIJS-2.js                    1,704.83 kB │ gzip: 358.93 kB

✓ built in 296ms
[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.

[4/8] Rust / Tauri
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.66s

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
 - docs/evidence/CHECK_20260911_212915.txt

[7/8] Git whitespace FINAL

[8/8] Record successful check
Status sincronizado: ~/Desktop/Abrxs os/site/data/status.json
~/Desktop/Abrxs os/continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md
✅ Generated/evidence text already normalized.

✅ PROJECT CHECK PASSED
Log: ~/Desktop/Abrxs os/docs/evidence/CHECK_20260911_212915.txt
```

## Última actividad

```text

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

## 2026-09-11 21:29:22 -0400
v0.16.4: safe recovery; Alpha fichas + Ghosts project into real VideoFlow after isolated candidate build.
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
