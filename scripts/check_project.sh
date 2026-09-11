#!/bin/bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/app"
EVIDENCE="$ROOT/docs/evidence"
STAMP="$(date '+%Y%m%d_%H%M%S')"
LOG="$EVIDENCE/CHECK_${STAMP}.txt"

mkdir -p "$EVIDENCE"

on_error() {
  code=$?

  python3 - "$code" <<'PY'
from pathlib import Path
from datetime import datetime
import json
import sys

root = Path.home() / "Desktop" / "Abrxs os"
p = root / "PROJECT_CONTROL" / "PROJECT_STATE.json"
code = int(sys.argv[1])

d = json.loads(p.read_text())
d["status"] = "blocked"
d["blockedReason"] = f"El último project check falló con exit code {code}."
d["updatedAt"] = datetime.now().astimezone().isoformat(timespec="seconds")
d["lastCheck"] = {
    "status": "failed",
    "exitCode": code,
    "updatedAt": d["updatedAt"]
}
p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n")
PY

  "$ROOT/scripts/finalize_update.sh" \
    "❌ Project check falló. Revisar ULTIMO_CHECK / evidencia." || true

  exit "$code"
}
trap on_error ERR

exec > >(tee "$LOG") 2>&1

echo "ABRAXAS OS PROJECT CHECK"
echo "========================"
echo "Date: $(date '+%Y-%m-%d %H:%M:%S %z')"

echo
echo "[1/6] JSON canonical files"
python3 - <<'PY'
from pathlib import Path
import json

root = Path.home() / "Desktop" / "Abrxs os"
files = [
    root / "PROJECT_CONTROL" / "PROJECT_STATE.json",
    root / "PROJECT_CONTROL" / "MODULES.json",
    root / "PROJECT_CONTROL" / "GITHUB.json",
    root / "contracts" / "production-graph.v1.schema.json",
    root / "examples" / "production-graph.demo.json",
    root / "app" / "package.json",
    root / "app" / "src-tauri" / "tauri.conf.json",
]

for p in files:
    if not p.exists():
        raise SystemExit(f"Falta archivo obligatorio: {p}")
    json.loads(p.read_text())
    print("OK", p.relative_to(root))
PY

echo
echo "[2/6] TypeScript + Vite"
cd "$APP"
npm run build

echo
echo "[3/6] Rust / Tauri"
cd "$APP/src-tauri"
cargo check

echo
echo "[4/6] Git whitespace"
cd "$ROOT"
git diff --check

echo
echo "[5/6] Public repo guard"
python3 "$ROOT/scripts/prepush_guard.py" --working-tree

echo
echo "[6/6] Registrar check SIN cambiar la fase"
python3 - <<'PY'
from pathlib import Path
from datetime import datetime
import json

root = Path.home() / "Desktop" / "Abrxs os"
p = root / "PROJECT_CONTROL" / "PROJECT_STATE.json"
d = json.loads(p.read_text())

now = datetime.now().astimezone().isoformat(timespec="seconds")
d["updatedAt"] = now
d["lastCheck"] = {
    "status": "passed",
    "updatedAt": now
}

# Si el estado estaba bloqueado únicamente por un check anterior, liberarlo,
# sin inventar que la fase funcional ya terminó.
if d.get("status") == "blocked":
    d["status"] = "in_progress" if d.get("currentPhase") != "F0" else "completed"
    d["blockedReason"] = None

p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n")
PY

"$ROOT/scripts/finalize_update.sh" "✅ PROJECT CHECK PASSED"

echo
echo "Log: $LOG"
