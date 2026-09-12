#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

files = {
    "adapter":
        ROOT / "app/src/core/alpha/alphaEditorDirectives.ts",

    "normalizer":
        ROOT / "app/src/core/alpha/normalizeAlpha.ts",

    "store":
        ROOT / "app/src/core/alpha/useAlphaStore.ts",

    "drafts":
        ROOT / "app/src/core/alpha/videoFlowDraftStore.ts",

    "projection":
        ROOT / "app/src/core/alpha/videoFlowProjection.ts",

    "workspace":
        ROOT / "app/src/modules/alpha/AlphaWorkspace.tsx",

    "semantic":
        ROOT / "app/src/modules/alpha/AlphaSemanticTimeline.tsx",

    "vf_editor":
        ROOT / "app/src/modules/alpha/AlphaVideoFlowEditor.tsx",

    "editor":
        ROOT / "app/src/modules/editor-shell/EditorSpike.tsx",

    "app":
        ROOT / "app/src/App.tsx",
}

missing = [
    name
    for name, path
    in files.items()
    if not path.is_file()
]

if missing:
    print(
        "Missing:",
        ", ".join(missing),
    )
    sys.exit(2)

text = {
    name:
        path.read_text(
            errors="replace"
        )
    for name, path
    in files.items()
}

checks = {
    "existing HTML importer preserved":
        "export async function importAlphaFile"
        in text["normalizer"],

    "existing Alpha registry preserved":
        "export const useAlphaStore"
        in text["store"],

    "editor adapter reads raw source timeline":
        "content.sourcePayload.timeline"
        in text["adapter"],

    "images supported in editor adapter":
        "images: 'images'"
        in text["adapter"],

    "unknown raw tracks are dropped safely":
        "return VALID_TRACKS.has(fallback)"
        in text["adapter"],

    "one route selected":
        "selectEditorDirectivesForRoute"
        in text["adapter"]
        and "item.routes.includes"
        in text["adapter"],

    "route isolated drafts v2":
        "abraxas-videoflow-drafts-v2"
        in text["drafts"]
        and "contentId"
        in text["drafts"]
        and "route"
        in text["drafts"],

    "real VideoFlow layers preserved":
        "new VideoFlow"
        in text["projection"]
        and "flow.addText"
        in text["projection"],

    "resourceId layer.id sidecar preserved":
        "resourceToLayer"
        in text["projection"]
        and "layer.id"
        in text["projection"],

    "custom VideoFlow timeline uses verified hooks":
        "useVideo"
        in text["semantic"]
        and "usePlayhead"
        in text["semantic"],

    "semantic lanes fixed":
        "SUBTÍTULOS"
        in text["semantic"]
        and "XR"
        in text["semantic"]
        and "A-ROLL"
        in text["semantic"]
        and "SFX"
        in text["semantic"],

    "one ficha active":
        "selectedContentId"
        in text["vf_editor"]
        and "content.contentId"
        in text["vf_editor"],

    "Timeline custom panel supported":
        "Timeline:"
        in text["vf_editor"]
        and "AlphaSemanticTimeline"
        in text["vf_editor"],

    "native VideoFlow fallback retained":
        "'videoflow'"
        in text["vf_editor"],

    "autosave retained":
        "onChange="
        in text["vf_editor"]
        and "saveVideoFlowDraft"
        in text["vf_editor"],

    "no feedback loop":
        "onChange={setVideo}"
        not in text["vf_editor"]
        and "video={video}"
        not in text["vf_editor"],

    "Alpha opens Editor":
        "setAppView('editor-spike')"
        in text["workspace"],

    "Editor bridge preserved":
        "AlphaVideoFlowEditor"
        in text["editor"],

    "App hydrates registry":
        "hydrateAlpha"
        in text["app"],
}

failed = []

print(
    "ABRAXAS · SAFE ONE-FICHA VIDEOFLOW CHECK"
)
print(
    "========================================"
)

for name, ok in checks.items():
    print(
        ("OK  " if ok else "FAIL"),
        name,
    )

    if not ok:
        failed.append(name)

if failed:
    print(
        "\nFailed:",
        ", ".join(failed),
    )
    sys.exit(3)

print(
    "\nOK one ficha + one route + one semantic lane per type "
    "with real VideoFlow layers."
)
