#!/bin/bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONT="$ROOT/continuacion en chat"
MSG="${*:-Actualización terminada}"

if [ -f "$ROOT/scripts/sync_status.py" ]; then
  python3 "$ROOT/scripts/sync_status.py"
fi

if [ -f "$ROOT/scripts/sync_latest_patch_log.py" ]; then
  python3 "$ROOT/scripts/sync_latest_patch_log.py"
fi

if [ -f "$ROOT/scripts/update_continuation.py" ]; then
  python3 "$ROOT/scripts/update_continuation.py"
fi

if [ -f "$ROOT/scripts/normalize_generated_text.py" ]; then
  python3 "$ROOT/scripts/normalize_generated_text.py"
fi

printf "\n%s\n" "$MSG"
echo
echo "📁 Archivos para continuar en ChatGPT:"
echo "$CONT"
echo
echo "Normalmente sube:"
echo "$CONT/ABRAXAS_OS_CONTINUACION_CHAT.md"

open "$CONT" >/dev/null 2>&1 || true
