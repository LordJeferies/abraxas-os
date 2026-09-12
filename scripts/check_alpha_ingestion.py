#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

files = {
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
    "vf_editor":
        ROOT / "app/src/modules/alpha/AlphaVideoFlowEditor.tsx",
    "editor":
        ROOT / "app/src/modules/editor-shell/EditorSpike.tsx",
    "app":
        ROOT / "app/src/App.tsx",
}

missing = [
    name
    for name, path in files.items()
    if not path.is_file()
]

if missing:
    print("Missing:", ", ".join(missing))
    sys.exit(2)

text = {
    name: path.read_text(errors="replace")
    for name, path in files.items()
}

checks = {
    "HTML/JSON canonical Alpha":
        "abraxas.alpha-content.v1" in text["normalizer"],

    "global Alpha registry":
        (
            "useAlphaStore" in text["store"]
            and "documents:" in text["store"]
        ),

    "Alpha durable persistence":
        "indexedDB.open" in text["store"],

    "VideoFlow draft persistence":
        (
            "abraxas-videoflow-drafts" in text["drafts"]
            and "saveVideoFlowDraft" in text["drafts"]
        ),

    "VideoFlow projection adapter":
        (
            "new VideoFlow" in text["projection"]
            and "flow.addText" in text["projection"]
        ),

    "directive -> real layer mapping":
        (
            "directive.resourceId" in text["projection"]
            and "layer.id" in text["projection"]
        ),

    "frame aligned timing":
        (
            "frameTime" in text["projection"]
            and "startTime:" in text["projection"]
            and "sourceDuration:" in text["projection"]
        ),

    "ghost payload":
        "👻" in text["projection"],

    "Alpha board opens Editor":
        "setAppView('editor-spike')" in text["workspace"],

    "Editor uses actual VideoEditor":
        (
            "projectAlphaToVideoFlow" in text["vf_editor"]
            and "<VideoEditor" in text["vf_editor"]
        ),

    "VideoFlow autosave":
        (
            "onChange={handleChange}" in text["vf_editor"]
            and "saveVideoFlowDraft" in text["vf_editor"]
        ),

    "no reinjection anti-pattern":
        (
            "onChange={setVideo}" not in text["vf_editor"]
            and "video={video}" not in text["vf_editor"]
        ),

    "Editor routes Alpha to VF":
        "AlphaVideoFlowEditor" in text["editor"],

    "App hydrates Alpha":
        "hydrateAlpha" in text["app"],
}

failed = []

print("ABRAXAS · ALPHA → VIDEOFLOW CHECK")
print("=================================")

for name, ok in checks.items():
    print(("OK  " if ok else "FAIL"), name)
    if not ok:
        failed.append(name)

if failed:
    print("\nFailed:", ", ".join(failed))
    sys.exit(3)

print(
    "\nOK HTML Alpha -> fichas -> Ghost layers -> real VideoFlow editor."
)
