#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]

files = {
    'types': ROOT / 'app/src/core/alpha/types.ts',
    'normalizer': ROOT / 'app/src/core/alpha/normalizeAlpha.ts',
    'store': ROOT / 'app/src/core/alpha/useAlphaStore.ts',
    'adapter': ROOT / 'app/src/core/alpha/alphaEditorDirectives.ts',
    'model': ROOT / 'app/src/core/alpha/alphaTimelineModel.ts',
    'projection': ROOT / 'app/src/core/alpha/videoFlowProjection.ts',
    'draft': ROOT / 'app/src/core/alpha/videoFlowDraftStore.ts',
    'timeline': ROOT / 'app/src/modules/alpha/CanonicalTimeline.tsx',
    'timeline_css': ROOT / 'app/src/modules/alpha/canonical-timeline.css',
    'studio': ROOT / 'app/src/modules/alpha/AlphaFichaStudio.tsx',
    'workspace': ROOT / 'app/src/modules/alpha/AlphaWorkspace.tsx',
    'editor': ROOT / 'app/src/modules/alpha/AlphaVideoFlowEditor.tsx',
    'floating': ROOT / 'app/src/modules/floating/FloatingWorkspace.tsx',
    'edits': ROOT / 'app/src/core/alpha/alphaEditStore.ts',
}

missing = [name for name, path in files.items() if not path.is_file()]
if missing:
    print('Missing:', ', '.join(missing))
    sys.exit(2)

text = {name: path.read_text(errors='replace') for name, path in files.items()}

checks = {
    'images first-class AlphaTrack':
        "| 'images'" in text['types'],

    'normalizer maps images and parent hierarchy':
        "'image': 'images'" in text['normalizer']
        and 'parentResourceId:' in text['normalizer']
        and 'item.parentId' in text['normalizer'],

    'persisted Alpha migration exists':
        'migrateAlphaEnvelope' in text['normalizer']
        and 'migrateAlphaEnvelope' in text['store'],

    'canonical adapter uses timelineDirectives':
        'content.timelineDirectives' in text['adapter']
        and 'sourcePayload.timeline' not in text['adapter'],

    'fixed T1-T9 contract exists':
        "id: 'T1'" in text['model']
        and "id: 'T9'" in text['model']
        and "label: 'T1 · A-ROLL'" in text['model']
        and "label: 'T9 · CAPTIONS'" in text['model'],

    'child resources stay visible in their one semantic lane':
        "if (item.parentResourceId) return false" not in text['model']
        and "return slotForTrack(item.track) !== null" in text['model'],

    'absolute timing geometry':
        'leftPct:' in text['model']
        and 'widthPct:' in text['model']
        and 'timelineGeometry' in text['timeline'],

    'CSS isolation prevents sequential flow layout':
        'position:absolute!important' in text['timeline_css']
        and 'all:unset!important' in text['timeline_css'],

    'exact nine top-level VideoFlow track containers':
        'TRACK_SLOTS_ENGINE_ORDER.map' in text['projection']
        and 'TRACK MARKER' in text['projection']
        and 'trackContainerCount' in text['projection'],

    'nested Ghost Groups preserve parent relationship':
        'childrenByParent' in text['projection']
        and 'addGhost(child, item.start)' in text['projection'],

    'old topology drafts invalidated':
        'abraxas.videoflow-draft.v7' in text['draft']
        and 'abraxas-videoflow-drafts-v7' in text['draft'],

    'native VideoFlow timeline removed from product UI':
        'timelineView' not in text['editor']
        and 'components={{' in text['editor']
        and 'AlphaSemanticTimeline' in text['editor'],

    'Ficha Studio opens from board and is editable':
        'AlphaFichaStudio' in text['workspace']
        and 'openFicha' in text['workspace']
        and 'patchContent' in text['studio']
        and 'patchResource' in text['studio'],

    'Ficha edits persist without mutating source':
        'abraxas-alpha-content-edits-v1' in text['edits']
        and 'sourcePayload' not in text['edits'],

    'floating timeline uses fixed slots':
        'TRACK_SLOTS' in text['floating']
        and 'item.slotId' in text['floating'],
}

failed = []

print('ABRAXAS · CANONICAL T1-T9 / FICHA STUDIO CHECK')
print('================================================')

for name, ok in checks.items():
    print(('OK  ' if ok else 'FAIL'), name)
    if not ok:
        failed.append(name)

if failed:
    print('\nFailed:', ', '.join(failed))
    sys.exit(3)

fixture = ROOT / 'examples/canonical-timeline-truth.demo.json'
if fixture.is_file():
    data = json.loads(fixture.read_text())
    duration = float(data['duration'])
    first, second = data['resources'][0], data['resources'][1]
    first_end = float(first['end']) / duration * 100
    second_start = float(second['start']) / duration * 100

    if second_start - first_end < 10:
        print('FAIL synthetic fixture does not preserve a large real gap')
        sys.exit(4)

    print(f'OK  synthetic real gap = {second_start - first_end:.3f}%')

print('\nOK fixed T1-T9 tracks, absolute timing, hierarchy and editable Ficha Studio.')
