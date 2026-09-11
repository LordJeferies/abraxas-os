#!/bin/bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "ABRAXAS · SYNTAX CHECK"
echo "======================"

echo
echo "[bash]"
while IFS= read -r -d '' file; do
  bash -n "$file"
  echo "OK ${file#$ROOT/}"
done < <(
  find "$ROOT/scripts" -maxdepth 1 -type f \
    \( -name "*.sh" -o -name "abraxas" \) \
    -print0
)

echo
echo "[python]"
python3 - <<'PY'
from pathlib import Path

root = Path.home() / "Desktop" / "Abrxs os"
for path in sorted((root / "scripts").glob("*.py")):
    source = path.read_text()
    compile(source, str(path), "exec")
    print("OK", path.relative_to(root))
PY

echo
echo "[site javascript]"
node --check "$ROOT/site/assets/site.js"
echo "OK site/assets/site.js"

echo
echo "[json]"
python3 - <<'PY'
from pathlib import Path
import json

root = Path.home() / "Desktop" / "Abrxs os"
files = [
    "PROJECT_CONTROL/PROJECT_STATE.json",
    "PROJECT_CONTROL/MODULES.json",
    "PROJECT_CONTROL/GITHUB.json",
    "contracts/production-graph.v1.schema.json",
    "examples/production-graph.demo.json",
    "app/package.json",
    "app/src-tauri/tauri.conf.json",
    "app/src-tauri/capabilities/default.json",
    "site/data/content.json",
    "site/data/status.json",
]
for rel in files:
    path = root / rel
    json.loads(path.read_text())
    print("OK", rel)
PY

echo
echo "✅ Syntax gate aprobado."
