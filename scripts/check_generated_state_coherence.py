#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]

STATE = ROOT / "PROJECT_CONTROL" / "PROJECT_STATE.json"
STATUS = ROOT / "site" / "data" / "status.json"
SYNC = ROOT / "scripts" / "sync_status.py"

required = [STATE, STATUS, SYNC]

missing = [
    str(path.relative_to(ROOT))
    for path in required
    if not path.is_file()
]

if missing:
    print("Missing:", ", ".join(missing))
    sys.exit(2)

sync_text = SYNC.read_text(
    encoding="utf-8",
    errors="replace",
)

checks = {
    "sync_status does not write PROJECT_STATE":
        "SOURCE.write_text" not in sync_text
        and "src.write_text" not in sync_text,

    "sync_status does not assign source updatedAt":
        'state["updatedAt"]' not in sync_text
        and 'data["updatedAt"]' not in sync_text
        and "data['updatedAt']" not in sync_text,

    "PROJECT_STATE valid JSON": True,
    "site/data/status valid JSON": True,
}

try:
    state = json.loads(
        STATE.read_text(
            encoding="utf-8",
        )
    )
except Exception as exc:
    state = {"__error__": str(exc)}
    checks["PROJECT_STATE valid JSON"] = False

try:
    status = json.loads(
        STATUS.read_text(
            encoding="utf-8",
        )
    )
except Exception as exc:
    status = {"__error__": str(exc)}
    checks["site/data/status valid JSON"] = False

checks["public status exactly projects PROJECT_STATE"] = (
    state == status
)

failed = []

print("ABRAXAS · GENERATED STATE COHERENCE")
print("===================================")

for name, ok in checks.items():
    print(("OK  " if ok else "FAIL"), name)

    if not ok:
        failed.append(name)

if failed:
    print("\nFailed:", ", ".join(failed))
    sys.exit(3)

print(
    "\nOK PROJECT_STATE is semantic source; generated status is output-only."
)
