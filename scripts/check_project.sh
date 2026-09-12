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
now = datetime.now().astimezone().isoformat(timespec="seconds")

d["status"] = "blocked"
d["blockedReason"] = f"El último project check falló con exit code {code}."
d["updatedAt"] = now
d["lastCheck"] = {
    "status": "failed",
    "exitCode": code,
    "updatedAt": now,
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
echo "[0/8] Predictive preflight"
python3 "$ROOT/scripts/preflight_predictive.py"

echo
echo "[1/8] Syntax + generated-text hygiene"
python3 "$ROOT/scripts/normalize_generated_text.py"
"$ROOT/scripts/check_syntax.sh"

echo
echo "[2/8] Tauri config coherence"
python3 "$ROOT/scripts/check_tauri_coherence.py"

echo
echo "[2b/8] VideoFlow integration coherence"
python3 "$ROOT/scripts/check_videoflow_integration.py"
echo
echo "[2c/8] Apple preview proxy"
"$ROOT/scripts/check_apple_media_proxy.sh"
echo
echo "[2d/8] Proven media engine"
python3 "$ROOT/scripts/abraxas_media_engine.py" preflight
echo
echo "[2e/8] Fast Source Runtime"
python3 "$ROOT/scripts/abraxas_source_runtime.py" preflight
echo
echo "[2f/8] F1.5 bundle wiring"
python3 "$ROOT/scripts/check_runtime_ui.py"
echo
echo "[2g/8] Alpha Ingestion"
python3 "$ROOT/scripts/check_alpha_ingestion.py"
echo
echo "[2h/8] Ghost / Editor contracts"
python3 "$ROOT/scripts/check_ghost_contracts.py"
echo
echo
echo "[2i/8] Canonical T1-T9 / Ficha Studio"
python3 "$ROOT/scripts/check_timeline_truth.py"
echo
echo "[3/8] TypeScript + Vite"
cd "$APP"
npm run build

echo
echo "[4/8] Rust / Tauri"
cd "$APP/src-tauri"
cargo check

echo
echo "[5/8] Public repo guard"
cd "$ROOT"
python3 "$ROOT/scripts/prepush_guard.py" --working-tree

echo
echo "[6/8] Sync generated state"
python3 "$ROOT/scripts/sync_status.py"
python3 "$ROOT/scripts/update_continuation.py"
python3 "$ROOT/scripts/normalize_generated_text.py"

echo
echo "[7/8] Git whitespace FINAL"
git diff --check

echo
echo "[8/8] Record successful check"
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
    "updatedAt": now,
}

if d.get("status") == "blocked":
    d["status"] = "in_progress"
    d["blockedReason"] = None

p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n")
PY

python3 "$ROOT/scripts/sync_status.py"
python3 "$ROOT/scripts/update_continuation.py"
python3 "$ROOT/scripts/normalize_generated_text.py"

# Verificación final después de generar todos los archivos.
git diff --check

echo
echo "✅ PROJECT CHECK PASSED"
echo "Log: $LOG"
