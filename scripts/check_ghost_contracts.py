#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]

ghost_path = ROOT / "contracts/ghost-resource.v1.schema.json"
projection_path = ROOT / "contracts/alpha-editor-projection.v1.schema.json"
demo_path = ROOT / "examples/ghost-resource.demo.json"
projection_code = (
    ROOT / "app/src/core/alpha/videoFlowProjection.ts"
).read_text(errors="replace")
timeline_model = (
    ROOT / "app/src/core/alpha/alphaTimelineModel.ts"
).read_text(errors="replace")

for path in [ghost_path, projection_path, demo_path]:
    if not path.is_file():
        print("FAIL missing", path)
        sys.exit(2)

ghost = json.loads(ghost_path.read_text())
projection = json.loads(projection_path.read_text())
demo = json.loads(demo_path.read_text())

checks = {
    "ghost schema id":
        ghost.get("$id", "").endswith("ghost-resource.v1.schema.json"),

    "ghost requires exact timing":
        set(["start", "end", "duration"]).issubset(
            set(
                ghost["properties"]["timing"]["required"]
            )
        ),

    "ghost representation is group":
        ghost["properties"]["group"]["properties"]["representation"].get("const")
        == "videoflow-group",

    "placeholder child roles":
        "prompt"
        in ghost["properties"]["group"]["properties"]["placeholderChildren"]
            ["items"]["properties"]["role"]["enum"],

    "projection lane order":
        projection["properties"]["laneOrder"]["const"]
        == [
            "captions", "xr", "images", "motion", "broll",
            "vo", "aroll", "story", "sfx", "music",
        ],

    "demo duration consistent":
        abs(
            demo["timing"]["duration"]
            - (
                demo["timing"]["end"]
                - demo["timing"]["start"]
            )
        ) < 1e-9,

    "code uses group":
        "flow.group" in projection_code,

    "code has ordered placeholder cards":
        "01 · QUÉ VA AQUÍ" in projection_code
        and "02 · TIMING" in projection_code
        and "03 · PROMPT" in projection_code
        and "04 · REFERENCIA" in projection_code
        and "05 · HACER" in projection_code,

    "code forbids wait start pattern":
        "wait(timing.start)" not in projection_code,

    "canonical lanes shared":
        "CANONICAL_TRACKS" in timeline_model,
}

failed = []

print("ABRAXAS · GHOST CONTRACT CHECK")
print("==============================")

for name, ok in checks.items():
    print(("OK  " if ok else "FAIL"), name)
    if not ok:
        failed.append(name)

if failed:
    print("\nFailed:", ", ".join(failed))
    sys.exit(3)

print("\nOK Ghost Resource + Alpha Editor Projection contracts.")
