#!/usr/bin/env python3
"""
Project semantic state -> public status projection.

PROJECT_CONTROL/PROJECT_STATE.json is READ-ONLY here.
"""

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "PROJECT_CONTROL" / "PROJECT_STATE.json"
OUTPUT = ROOT / "site" / "data" / "status.json"

state = json.loads(
    SOURCE.read_text(
        encoding="utf-8",
    )
)

OUTPUT.parent.mkdir(
    parents=True,
    exist_ok=True,
)

OUTPUT.write_text(
    json.dumps(
        state,
        indent=2,
        ensure_ascii=False,
    )
    + "\n",
    encoding="utf-8",
)

print(
    f"Status sincronizado (PROJECT_STATE read-only): {OUTPUT}"
)
