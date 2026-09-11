#!/bin/bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MSG="${*:-checkpoint}"
STAMP="$(date '+%Y-%m-%d %H:%M:%S %z')"

printf "\n## %s\n%s\n" "$STAMP" "$MSG" \
  >> "$ROOT/PROJECT_CONTROL/SESSION_LOG.md"

"$ROOT/scripts/finalize_update.sh" "✅ Checkpoint guardado."
