# ABRAXAS OS — CONTINUACIÓN PARA CHAT

> Este es el archivo normal para retomar el proyecto sin subir el ZIP completo.

## Identidad

- Producto: Abraxas OS
- Repo local: `~/Desktop/Abrxs os`
- Generado: 2026-09-12T01:29:27-04:00
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

## v0.19.3 · Canonical Editor + Projection Contract v2

Arquitectura integrada:
- Production Graph temporal = `timelineDirectives`;
- HTML raw = provenance + Timeline Truth;
- Ficha Studio editable;
- T1-T9 fijos;
- parent/child preservado;
- VideoFlow top-level = 9 Track Container Groups;
- Ghost Groups limitados por start/end;
- child resources anidados en su padre;
- Timeline oficial = Abraxas custom Timeline;
- Timeline flotante = misma geometría canónica;
- contrato Alpha -> VideoFlow v2 documenta la proyección completa.

Gate:
F1_6_ALPHA_INGESTION_DOMAIN


## Próximo paso

# Próximo paso

## Validación funcional v0.19.3

1. abrir Potenciales Alfa;
2. clic en tarjeta -> Ficha Studio;
3. editar texto/prompt y comprobar persistencia;
4. abrir Editor;
5. comprobar T1..T9 y huecos temporales reales;
6. verificar que XR/Image/Motion/SFX conservan start/end de la ficha;
7. abrir Timeline flotante y comparar;
8. seleccionar Ghost y revisar información completa;
9. reiniciar app y comprobar persistencia.

Después:
- Finder/Asset Library -> Group Ghost;
- materialización de Image/Video/Audio/Captions;
- drag/trim canónico -> Production Graph;
- mini editor XR.


## De dónde venimos / hacia dónde vamos

# De dónde venimos y hacia dónde vamos

## Base completada

- F0 Foundation: completada.
- F1 Media Compatibility: completada.
- F1.5 Fast Source Runtime: base funcional.

## Ahora

F1.6 · Alpha Ingestion & Domain Lock.

HTML / JSON
→ AlphaContent persistente
→ Ficha Studio editable
→ UNA ruta
→ Production Graph temporal
→ T1-T9 canónico
→ VideoFlow jerárquico
→ Group Ghosts acotados en tiempo
→ Timeline fija / flotante / Ghost Inspector

## Siguiente

Validación manual de paridad temporal y luego materialización de assets reales
dentro de los mismos Group Ghosts sin cambiar resourceId.


## Estado estructurado

```json
{
  "project": "Abraxas OS",
  "schemaVersion": "abraxas.project-state.v1",
  "currentPhase": "F1.6",
  "phaseName": "Alpha Ingestion & Domain Lock",
  "status": "in_progress",
  "lastCompletedStep": "v0.19.3 integra Ficha Studio, T1-T9 canónico y contrato Alpha -> VideoFlow v2: cada recurso conserva start/end y termina como Group acotado o child nested dentro de su parentResourceId.",
  "blockedReason": null,
  "nextStep": "Validar manualmente paridad de Ficha/Timeline/VideoFlow y luego materializar assets reales dentro de los mismos Group Ghosts.",
  "updatedAt": "2026-09-12T01:29:27-04:00",
  "releaseGate": "F1_6_ALPHA_INGESTION_DOMAIN",
  "progress": {
    "foundation": 100,
    "mediaCompatibility": 100,
    "editorShell": 70,
    "productionTimeline": 68,
    "fastSourceRuntime": 80,
    "alphaIngestion": 98
  },
  "lastCheck": {
    "status": "passed",
    "updatedAt": "2026-09-12T01:29:26-04:00"
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
    "alphaVideoFlowManualUiPass": false,
    "alphaOneFichaProjectionImplemented": true,
    "alphaOneRouteProjectionImplemented": true,
    "alphaSemanticVideoFlowTimelineImplemented": true,
    "alphaImagesHandledInEditorAdapter": true,
    "alphaDraftV2PerContentRouteImplemented": true,
    "alphaImporterRegistryPreserved": true,
    "alphaSemanticLaneLayoutManualUiPass": false,
    "ghostIsGroupLayerModelImplemented": true,
    "ghostPlaceholderChildImplemented": true,
    "ghostInspectorDockedImplemented": true,
    "ghostInspectorFloatingImplemented": true,
    "timelineFloatingAlwaysOnTopImplemented": true,
    "floatingWindowsVisibleOnAllWorkspaces": true,
    "ghostMaterializationPending": true,
    "ghostResourceContractV1Implemented": true,
    "alphaEditorProjectionContractV1Implemented": true,
    "groupGhostOrderedTextChildrenImplemented": true,
    "groupGhostExactAlphaTimingImplemented": true,
    "semanticFloatingCanonicalTimingImplemented": true,
    "draftV5InvalidatesPriorTimingDrafts": true,
    "contractGateAddedToProjectCheck": true,
    "exactTimingManualUiPass": false,
    "fixedTrackSlotsT1T9Implemented": true,
    "videoFlowNineTrackContainersImplemented": true,
    "alphaImagesFirstClassTrackImplemented": true,
    "alphaParentChildMigrationImplemented": true,
    "canonicalAbsoluteTimingImplemented": true,
    "hierarchicalVideoFlowProjectionImplemented": true,
    "alphaVideoFlowProjectionContractV2Implemented": true,
    "nativeVideoFlowTimelineRemovedFromProductUi": true,
    "fichaStudioImplemented": true,
    "alphaEditOverlayPersistenceImplemented": true,
    "timelineModuleInProgress": true,
    "inspectorModuleInProgress": true,
    "v0193ManualFunctionalPass": false
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
| timeline | Production Timeline | in_progress | app/src/modules/timeline |
| inspector | Inspector | in_progress | app/src/modules/inspector |
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
 M PROJECT_CONTROL/CURRENT_STATUS.md
 M PROJECT_CONTROL/FROM_TO.md
 M PROJECT_CONTROL/GHOST_MODEL.md
 M PROJECT_CONTROL/MODULES.json
 M PROJECT_CONTROL/NEXT_STEP.md
 M PROJECT_CONTROL/PROJECT_STATE.json
 M PROJECT_CONTROL/SESSION_LOG.md
 M PROJECT_CONTROL/TIMELINE_MODEL.md
 M app/src/core/alpha/alphaEditorDirectives.ts
 M app/src/core/alpha/alphaTimelineModel.ts
 M app/src/core/alpha/floatingEditorBridge.ts
 M app/src/core/alpha/normalizeAlpha.ts
 M app/src/core/alpha/types.ts
 M app/src/core/alpha/useAlphaStore.ts
 M app/src/core/alpha/videoFlowDraftStore.ts
 M app/src/core/alpha/videoFlowProjection.ts
 M app/src/modules/alpha/AlphaSemanticTimeline.tsx
 M app/src/modules/alpha/AlphaVideoFlowEditor.tsx
 M app/src/modules/alpha/AlphaWorkspace.tsx
 M app/src/modules/alpha/alpha-semantic-timeline.css
 M app/src/modules/alpha/alpha-videoflow-editor.css
 M app/src/modules/alpha/alpha-workspace.css
 M app/src/modules/floating/FloatingWorkspace.tsx
 M app/src/modules/floating/floating-workspace.css
 M "continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md"
 M "continuacion en chat/ESTADO_ACTUAL.json"
 M "continuacion en chat/ULTIMO_CHECK.txt"
 M "continuacion en chat/ULTIMO_PATCH_LOG.txt"
 M docs/architecture/ABRAXAS_OS_MASTER_SPEC.md
 M docs/decisions/DECISIONS.md
 M scripts/check_alpha_ingestion.py
 M scripts/check_ghost_contracts.py
 M scripts/check_project.sh
 M site/data/status.json
 M site/index.html
?? PROJECT_CONTROL/FICHA_STUDIO.md
?? app/src/core/alpha/alphaEditStore.ts
?? app/src/modules/alpha/AlphaFichaStudio.tsx
?? app/src/modules/alpha/CanonicalTimeline.tsx
?? app/src/modules/alpha/alpha-ficha-studio.css
?? app/src/modules/alpha/canonical-timeline.css
?? contracts/alpha-content-edit.v1.schema.json
?? contracts/alpha-videoflow-projection.v2.schema.json
?? contracts/editor-track-slots.v1.schema.json
?? docs/evidence/CHECK_20260912_011326.txt
?? docs/evidence/CHECK_20260912_012921.txt
?? examples/alpha-videoflow-projection.v2.demo.json
?? examples/canonical-timeline-truth.demo.json
?? scripts/check_timeline_truth.py
```

### Remote

```text
origin	https://github.com/LordJeferies/abraxas-os.git (fetch)
origin	https://github.com/LordJeferies/abraxas-os.git (push)
```

### Últimos commits

```text
a0cfaac chore: sync generated project state
137a866 fix(timeline): recover exact Group Ghost timing and contracts
38a12cb chore: sync generated project state
ed4e8b3 feat(editor): add Group Ghosts and floating workspace
5e4112a chore: sync generated project state
```

## Último check autoritativo

Archivo:
`docs/evidence/CHECK_20260912_012921.txt`

```text

[3/8] TypeScript + Vite

> abraxas-os@0.0.0 build
> tsc -b && vite build

vite v8.3.0 building client environment for production...
transforming...
✓ 236 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                     0.45 kB │ gzip:   0.29 kB
dist/assets/RuntimePanel-DtAfwpUF.css               4.72 kB │ gzip:   1.42 kB
dist/assets/AlphaWorkspace-CwLsoOAF.css             4.72 kB │ gzip:   1.42 kB
dist/assets/MediaCompatibilityLab-DADf_X2z.css      5.52 kB │ gzip:   1.76 kB
dist/assets/index-DDFdI7Xk.css                      6.20 kB │ gzip:   2.00 kB
dist/assets/AlphaFichaStudio-srwMs5U9.css           8.30 kB │ gzip:   2.11 kB
dist/assets/EditorSpike-Z9mrWnC8.css               50.83 kB │ gzip:   7.18 kB
dist/assets/dist-js-KKXgbApR.js                     0.15 kB │ gzip:   0.15 kB
dist/assets/AlphaWorkspace-Z-urxclc.js              6.17 kB │ gzip:   2.23 kB
dist/assets/RuntimePanel-DwORPwBi.js                7.84 kB │ gzip:   2.53 kB
dist/assets/AlphaFichaStudio-DI3qVV-u.js           12.35 kB │ gzip:   3.94 kB
dist/assets/MediaCompatibilityLab-CaiDPfhW.js      14.56 kB │ gzip:   5.22 kB
dist/assets/index-BWgwl8Xj.js                     269.98 kB │ gzip:  83.13 kB
dist/assets/EditorSpike-DgAR9ut2.js               340.25 kB │ gzip:  65.79 kB
dist/assets/dist-DRPzMndF.js                    1,704.83 kB │ gzip: 358.93 kB

✓ built in 187ms
[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.

[4/8] Rust / Tauri
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.22s

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
 - docs/evidence/CHECK_20260912_012921.txt

[7/8] Git whitespace FINAL

[8/8] Record successful check
Status sincronizado: ~/Desktop/Abrxs os/site/data/status.json
~/Desktop/Abrxs os/continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md
✅ Generated/evidence text already normalized.

✅ PROJECT CHECK PASSED
Log: ~/Desktop/Abrxs os/docs/evidence/CHECK_20260912_012921.txt
```

## Última actividad

```text

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

## 2026-09-11 22:30:10 -0400
v0.17.3: audited one-ficha route-aware semantic VideoFlow.

## 2026-09-11 23:08:20 -0400
v0.18: Group Ghost model + docked/floating Ghost Info + floating always-on-top timeline.

## 2026-09-11 23:25:57 -0400
v0.18: Group Ghost model + docked/floating Ghost Info + floating always-on-top timeline.

## 2026-09-12 00:08:22 -0400
v0.18.4: recovered exact Group Ghosts + canonical timeline + contracts.

## 2026-09-12 01:29:27 -0400
v0.19.3: canonical editor + projection contract v2 + site status sync.
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
