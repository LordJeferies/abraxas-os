#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]

ghost_path = ROOT / "contracts/ghost-resource.v1.schema.json"
projection_path = ROOT / "contracts/alpha-videoflow-projection.v2.schema.json"
track_path = ROOT / "contracts/editor-track-slots.v1.schema.json"
demo_path = ROOT / "examples/alpha-videoflow-projection.v2.demo.json"

model_path = ROOT / "app/src/core/alpha/alphaTimelineModel.ts"
projection_code_path = ROOT / "app/src/core/alpha/videoFlowProjection.ts"
adapter_path = ROOT / "app/src/core/alpha/alphaEditorDirectives.ts"

required = [
    ghost_path,
    projection_path,
    track_path,
    demo_path,
    model_path,
    projection_code_path,
    adapter_path,
]

missing = [
    str(path.relative_to(ROOT))
    for path in required
    if not path.is_file()
]

if missing:
    print("Missing:", ", ".join(missing))
    sys.exit(2)

ghost = json.loads(ghost_path.read_text())
projection_contract = json.loads(projection_path.read_text())
track_contract = json.loads(track_path.read_text())
demo = json.loads(demo_path.read_text())

model = model_path.read_text(errors="replace")
projection_code = projection_code_path.read_text(errors="replace")
adapter = adapter_path.read_text(errors="replace")

expected_slots = [
    {"id": "T1", "label": "A-ROLL", "accepts": ["aroll"], "zIndex": 1},
    {"id": "T2", "label": "XR", "accepts": ["xr"], "zIndex": 2},
    {"id": "T3", "label": "IMAGES", "accepts": ["images"], "zIndex": 3},
    {"id": "T4", "label": "MOTION", "accepts": ["motion", "transition"], "zIndex": 4},
    {"id": "T5", "label": "B-ROLL", "accepts": ["broll"], "zIndex": 5},
    {"id": "T6", "label": "VO JOC", "accepts": ["vo"], "zIndex": 6},
    {"id": "T7", "label": "SFX", "accepts": ["sfx"], "zIndex": 7},
    {"id": "T8", "label": "MUSIC", "accepts": ["music"], "zIndex": 8},
    {"id": "T9", "label": "CAPTIONS", "accepts": ["captions"], "zIndex": 9},
]

demo_resources = demo.get("resources", [])
xr = next(
    (item for item in demo_resources if item.get("resourceId") == "XR_DEMO_01"),
    None,
)
image = next(
    (item for item in demo_resources if item.get("resourceId") == "XR_DEMO_01_A01"),
    None,
)

checks = {
    "ghost v1 exact timing retained":
        set(["start", "end", "duration"]).issubset(
            set(ghost["properties"]["timing"]["required"])
        ),

    "ghost representation remains VideoFlow Group":
        ghost["properties"]["group"]["properties"]["representation"].get("const")
        == "videoflow-group",

    "projection v2 schema":
        projection_contract["properties"]["schemaVersion"].get("const")
        == "abraxas.alpha-videoflow-projection.v2",

    "fixed T1-T9 contract":
        track_contract["properties"]["slots"]["const"]
        == expected_slots,

    "projection v2 references fixed track slots":
        projection_contract["properties"]["trackSlots"]["const"]
        == expected_slots,

    "projection timing is absolute Alpha truth":
        projection_contract["properties"]["resources"]["items"]
            ["properties"]["timing"]["properties"]["source"].get("const")
        == "alpha-production-graph",

    "projection captures parent-child hierarchy":
        "parentResourceId"
        in projection_contract["properties"]["resources"]["items"]["properties"]
        and "groupRole"
        in projection_contract["properties"]["resources"]["items"]["properties"],

    "projection captures VideoFlow group mapping":
        projection_contract["properties"]["resources"]["items"]
            ["properties"]["videoFlow"]["properties"]["representation"].get("const")
        == "group-layer",

    "projection carries ordered information children":
        "informationChildren"
        in projection_contract["properties"]["resources"]["items"]
            ["properties"]["videoFlow"]["properties"],

    "demo root XR is exact and bounded":
        xr is not None
        and xr["trackSlot"] == "T2"
        and xr["groupRole"] == "root"
        and abs(
            xr["timing"]["duration"]
            - (xr["timing"]["end"] - xr["timing"]["start"])
        ) < 1e-9,

    "demo child is nested but keeps semantic lane":
        image is not None
        and image["parentResourceId"] == "XR_DEMO_01"
        and image["groupRole"] == "child"
        and image["trackSlot"] == "T3"
        and image["videoFlow"]["nestedUnderResourceId"] == "XR_DEMO_01",

    "code uses fixed TRACK_SLOTS":
        "TRACK_SLOTS" in model
        and "TRACK_SLOTS_ENGINE_ORDER" in model,

    "code creates nine structural Track Containers":
        "TRACK_SLOTS_ENGINE_ORDER.map" in projection_code
        and "TRACK MARKER" in projection_code,

    "code nests children under parent groups":
        "childrenByParent" in projection_code
        and "addGhost(child, item.start)" in projection_code,

    "code preserves exact group timing":
        "sourceDuration: relativeTiming.sourceDuration" in projection_code
        and "normalizeTimings" in projection_code,

    "semantic children are not dropped":
        "if (item.parentResourceId) return false" not in model,

    "adapter consumes canonical timelineDirectives":
        "content.timelineDirectives" in adapter
        and "sourcePayload.timeline" not in adapter,
}

failed = []

print("ABRAXAS · GHOST / VIDEOFLOW PROJECTION CONTRACT CHECK v2")
print("========================================================")

for name, ok in checks.items():
    print(("OK  " if ok else "FAIL"), name)
    if not ok:
        failed.append(name)

if failed:
    print("\nFailed:", ", ".join(failed))
    sys.exit(3)

print(
    "\nOK Ficha Alpha -> Production Graph -> T1-T9 -> bounded VideoFlow Groups."
)
