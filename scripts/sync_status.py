#!/usr/bin/env python3
from pathlib import Path
import json
from datetime import datetime, timezone

root = Path(__file__).resolve().parents[1]
src = root / "PROJECT_CONTROL" / "PROJECT_STATE.json"
dst = root / "site" / "data" / "status.json"

data = json.loads(src.read_text())
data["updatedAt"] = datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")
src.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

dst.parent.mkdir(parents=True, exist_ok=True)
dst.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

print(f"Status sincronizado: {dst}")
