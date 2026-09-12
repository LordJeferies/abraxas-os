#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

files = {
    'normalizer': ROOT / 'app/src/core/alpha/normalizeAlpha.ts',
    'store': ROOT / 'app/src/core/alpha/useAlphaStore.ts',
    'edits': ROOT / 'app/src/core/alpha/alphaEditStore.ts',
    'adapter': ROOT / 'app/src/core/alpha/alphaEditorDirectives.ts',
    'model': ROOT / 'app/src/core/alpha/alphaTimelineModel.ts',
    'projection': ROOT / 'app/src/core/alpha/videoFlowProjection.ts',
    'draft': ROOT / 'app/src/core/alpha/videoFlowDraftStore.ts',
    'workspace': ROOT / 'app/src/modules/alpha/AlphaWorkspace.tsx',
    'studio': ROOT / 'app/src/modules/alpha/AlphaFichaStudio.tsx',
    'timeline': ROOT / 'app/src/modules/alpha/CanonicalTimeline.tsx',
    'semantic': ROOT / 'app/src/modules/alpha/AlphaSemanticTimeline.tsx',
    'editor': ROOT / 'app/src/modules/alpha/AlphaVideoFlowEditor.tsx',
}

missing = [name for name, path in files.items() if not path.is_file()]
if missing:
    print('Missing:', ', '.join(missing))
    sys.exit(2)

text = {name: path.read_text(errors='replace') for name, path in files.items()}

checks = {
    'canonical Alpha import': 'abraxas.alpha-content.v1' in text['normalizer'],
    'durable registry': 'indexedDB.open' in text['store'],
    'persisted migration': 'migrateAlphaEnvelope' in text['store'],
    'editable overlay persistence': 'abraxas.alpha-content-edit.v1' in text['edits'],
    'single directive adapter': 'content.timelineDirectives' in text['adapter'],
    'fixed track slots': 'TRACK_SLOTS' in text['model'],
    'hierarchical VideoFlow': 'TRACK_SLOTS_ENGINE_ORDER.map' in text['projection'],
    'draft v7': 'abraxas.videoflow-draft.v7' in text['draft'],
    'board opens Ficha Studio': 'openFicha' in text['workspace'],
    'Ficha editable': 'patchResource' in text['studio'],
    'one canonical timeline component': 'CanonicalTimeline' in text['semantic'],
    'real VideoEditor retained': '<VideoEditor' in text['editor'],
    'custom timeline always mounted': 'components={{' in text['editor'] and 'AlphaSemanticTimeline' in text['editor'],
    'native Track N toggle absent': 'timelineView' not in text['editor'],
    'no reinjection anti-pattern': 'onChange={setVideo}' not in text['editor'],
}

failed = []

print('ABRAXAS · CANONICAL ALPHA EDITOR CHECK')
print('======================================')

for name, ok in checks.items():
    print(('OK  ' if ok else 'FAIL'), name)
    if not ok:
        failed.append(name)

if failed:
    print('\nFailed:', ', '.join(failed))
    sys.exit(3)

print('\nOK Alpha -> Production Graph -> T1-T9 Timeline -> hierarchical VideoFlow + Ficha Studio.')
