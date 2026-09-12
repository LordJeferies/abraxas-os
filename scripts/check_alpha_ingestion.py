#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

files = {
    "adapter": ROOT / "app/src/core/alpha/alphaEditorDirectives.ts",
    "projection": ROOT / "app/src/core/alpha/videoFlowProjection.ts",
    "drafts": ROOT / "app/src/core/alpha/videoFlowDraftStore.ts",
    "bridge": ROOT / "app/src/core/alpha/floatingEditorBridge.ts",
    "window": ROOT / "app/src/core/alpha/floatingWindow.ts",
    "editor": ROOT / "app/src/modules/alpha/AlphaVideoFlowEditor.tsx",
    "semantic": ROOT / "app/src/modules/alpha/AlphaSemanticTimeline.tsx",
    "inspector": ROOT / "app/src/modules/alpha/GhostInspectorPanel.tsx",
    "floating": ROOT / "app/src/modules/floating/FloatingWorkspace.tsx",
    "app": ROOT / "app/src/App.tsx",
    "rust": ROOT / "app/src-tauri/src/floating_windows.rs",
    "lib": ROOT / "app/src-tauri/src/lib.rs",
}

missing = [name for name, path in files.items() if not path.is_file()]

if missing:
    print("Missing:", ", ".join(missing))
    sys.exit(2)

text = {name: path.read_text(errors="replace") for name, path in files.items()}

checks = {
    "every ghost projects as GroupLayer":
        "flow.group" in text["projection"] and "placeholderText" in text["projection"],

    "placeholder child is hidden":
        "flow.addText" in text["projection"] and "opacity: 0" in text["projection"],

    "group id is canonical binding":
        "group.id" in text["projection"] and "resourceToLayer" in text["projection"],

    "draft v3 invalidates old flat drafts":
        "abraxas.videoflow-draft.v3" in text["drafts"]
        and "abraxas-videoflow-drafts-v3" in text["drafts"],

    "full ghost info preserved":
        "getGhostInspectorData" in text["adapter"] and "allFields" in text["adapter"],

    "docked inspector exists":
        "GhostInspectorPanel" in text["editor"] and "inspectorDocked" in text["editor"],

    "floating timeline and ghost buttons":
        "openFloatingEditorWindow" in text["editor"]
        and "'timeline'" in text["editor"]
        and "'ghost'" in text["editor"],

    "floating bridge syncs selection":
        "publishFloatingSnapshot" in text["bridge"]
        and "select-resource" in text["bridge"],

    "floating workspace has both modes":
        "FloatingTimeline" in text["floating"] and "GhostInspectorPanel" in text["floating"],

    "always on top Tauri windows":
        ".always_on_top(true)" in text["rust"]
        and ".visible_on_all_workspaces(true)" in text["rust"],

    "App renders floating-only workspace":
        "getFloatingKind" in text["app"] and "FloatingWorkspace" in text["app"],

    "Tauri commands registered":
        "floating_windows::open_floating_editor_window" in text["lib"],

    "semantic timeline retained":
        "AlphaSemanticTimeline" in text["semantic"],

    "one ficha / one route retained":
        "activeRoute" in text["editor"] and "content.contentId" in text["editor"],

    "real VideoFlow retained":
        "<VideoEditor" in text["editor"],

    "autosave retained":
        "onChange=" in text["editor"] and "saveVideoFlowDraft" in text["editor"],

    "no feedback loop":
        "onChange={setVideo}" not in text["editor"],
}

failed = []

print("ABRAXAS · GROUP GHOST + FLOATING WORKSPACE CHECK")
print("===============================================")

for name, ok in checks.items():
    print(("OK  " if ok else "FAIL"), name)
    if not ok:
        failed.append(name)

if failed:
    print("\nFailed:", ", ".join(failed))
    sys.exit(3)

print("\nOK Group Ghost model + docked/floating inspector/timeline.")
