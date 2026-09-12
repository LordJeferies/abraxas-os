#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

files = {
    "timeline_model":
        ROOT / "app/src/core/alpha/alphaTimelineModel.ts",

    "projection":
        ROOT / "app/src/core/alpha/videoFlowProjection.ts",

    "drafts":
        ROOT / "app/src/core/alpha/videoFlowDraftStore.ts",

    "semantic":
        ROOT / "app/src/modules/alpha/AlphaSemanticTimeline.tsx",

    "floating":
        ROOT / "app/src/modules/floating/FloatingWorkspace.tsx",

    "ficha":
        ROOT / "app/src/modules/alpha/AlphaFichaReview.tsx",

    "editor":
        ROOT / "app/src/modules/alpha/AlphaVideoFlowEditor.tsx",

    "inspector":
        ROOT / "app/src/modules/alpha/GhostInspectorPanel.tsx",

    "normalizer":
        ROOT / "app/src/core/alpha/normalizeAlpha.ts",

    "store":
        ROOT / "app/src/core/alpha/useAlphaStore.ts",
}

missing = [
    name
    for name, path
    in files.items()
    if not path.is_file()
]

if missing:
    print("Missing:", ", ".join(missing))
    sys.exit(2)

text = {
    name:
        path.read_text(
          errors="replace"
        )
    for name, path
    in files.items()
}

css = (
    ROOT / "app/src/modules/alpha/alpha-semantic-timeline.css"
).read_text(errors="replace")

checks = {
    "stable importer preserved":
        "export async function importAlphaFile"
        in text["normalizer"],

    "stable registry preserved":
        "export const useAlphaStore"
        in text["store"],

    "canonical timeline shared":
        "buildCanonicalTimeline"
        in text["timeline_model"],

    "group projection":
        "flow.group"
        in text["projection"],

    "resource id binds group id":
        "resourceToLayer"
        in text["projection"]
        and "group.id"
        in text["projection"],

    "exact group timing":
        "sourceDuration:"
        in text["projection"]
        and "normalizeCompiledTiming"
        in text["projection"],

    "no parallel wait start bug":
        "wait(timing.start)"
        not in text["projection"],

    "ordered text children":
        "01 · QUÉ VA AQUÍ"
        in text["projection"]
        and "03 · PROMPT"
        in text["projection"]
        and "04 · REFERENCIA"
        in text["projection"],

    "draft v5 invalidates bad drafts":
        "abraxas.videoflow-draft.v5"
        in text["drafts"]
        and "abraxas-videoflow-drafts-v5"
        in text["drafts"],

    "semantic uses alpha exact timing":
        "buildCanonicalTimeline"
        in text["semantic"]
        and "settings?.sourceDuration"
        not in text["semantic"],

    "one fixed semantic lane per type":
        "height:40px"
        in css
        and "model.tracks.map"
        in text["semantic"],

    "floating uses canonical lanes":
        "CANONICAL_TRACKS"
        in text["floating"],

    "ficha exists":
        "TIMELINE ALFA"
        in text["ficha"],

    "ghost inspector retained":
        "Ghost Info"
        in text["inspector"],

    "real VideoFlow retained":
        "<VideoEditor"
        in text["editor"],

    "canonical snapshot retained":
        "buildCanonicalTimeline"
        in text["editor"],
}

failed = []

print("ABRAXAS · EXACT GROUP GHOST CHECK")
print("================================")

for name, ok in checks.items():
    print(("OK  " if ok else "FAIL"), name)
    if not ok:
        failed.append(name)

if failed:
    print("\nFailed:", ", ".join(failed))
    sys.exit(3)

print(
    "\nOK Alpha -> exact Group Ghost -> single-lane Semantic/Floating/Ficha."
)
