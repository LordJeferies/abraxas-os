#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

required = [
    "app/src/core/alpha/types.ts",
    "app/src/core/alpha/normalizeAlpha.ts",
    "app/src/modules/alpha/AlphaWorkspace.tsx",
    "app/src/modules/alpha/alpha-workspace.css",
    "contracts/alpha-import-envelope.v1.schema.json",
    "contracts/alpha-content.v1.schema.json",
]

missing = [
    item
    for item in required
    if not (ROOT / item).is_file()
]

if missing:
    print("Missing:", *missing, sep="\n - ")
    sys.exit(2)

normalizer = (
    ROOT / "app/src/core/alpha/normalizeAlpha.ts"
).read_text(errors="replace")

workspace = (
    ROOT / "app/src/modules/alpha/AlphaWorkspace.tsx"
).read_text(errors="replace")

app = (ROOT / "app/src/App.tsx").read_text(errors="replace")

checks = {
    "app-data + seed parser": (
        "script#app-data" in normalizer
        and "script#seed" in normalizer
    ),
    "canonical Alpha": "abraxas.alpha-content.v1" in normalizer,
    "XR group + states": "groupRole: 'parent'" in normalizer,
    "legacy B-roll preserved": "cRollReference" in normalizer,
    "captions track": "track: 'captions'" in normalizer,
    "motion track": "track: 'motion'" in normalizer,
    "sfx track": "track: 'sfx'" in normalizer,
    "no-master viewer": "ALPHA PREVIEW · SIN MASTER" in workspace,
    "Kanban": "alpha-board" in workspace,
    "temporal/semantic": "Vista semántica" in workspace,
    "reimport diff": "diffAlpha" in workspace,
    "alpha nav": "setView('alpha')" in app,
}

failed = []

print("ABRAXAS · ALPHA INGESTION CHECK")
print("===============================")

for name, ok in checks.items():
    print(("OK  " if ok else "FAIL"), name)
    if not ok:
        failed.append(name)

if failed:
    print("\nFailed:", ", ".join(failed))
    sys.exit(3)

print("\nOK Alpha Ingestion wiring.")
