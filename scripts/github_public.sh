#!/bin/bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTROL="$ROOT/PROJECT_CONTROL"
FULL="LordJeferies/abraxas-os"
EXPECTED_REPO="https://github.com/LordJeferies/abraxas-os"
EXPECTED_PAGES="https://lordjeferies.github.io/abraxas-os/"

cd "$ROOT"

command -v gh >/dev/null 2>&1 || {
  echo "❌ Falta GitHub CLI."
  exit 2
}

gh auth status >/dev/null 2>&1 || {
  echo "❌ GitHub CLI no está autenticado."
  exit 3
}

AUTH_OWNER="$(gh api user --jq .login)"
if [ "$(echo "$AUTH_OWNER" | tr '[:upper:]' '[:lower:]')" != "lordjeferies" ]; then
  echo "❌ Cuenta GitHub inesperada: $AUTH_OWNER"
  exit 4
fi

echo "GitHub: $AUTH_OWNER"
echo "Objetivo: $FULL"

# Un origin diferente nunca se reemplaza silenciosamente.
if git remote get-url origin >/dev/null 2>&1; then
  ORIGIN="$(git remote get-url origin)"
  case "$ORIGIN" in
    *"LordJeferies/abraxas-os.git"|*"LordJeferies/abraxas-os")
      echo "↪ origin correcto."
      ;;
    *)
      echo "❌ origin apunta a otro repositorio:"
      echo "$ORIGIN"
      exit 5
      ;;
  esac
fi

echo
echo "Ejecutando gates..."
"$ROOT/scripts/check_project.sh"

python3 "$ROOT/scripts/update_continuation.py"
git add -A

python3 "$ROOT/scripts/prepush_guard.py" --staged

# Identidad local de Git, sin modificar configuración global.
USER_ID="$(gh api user --jq .id)"

if ! git config user.name >/dev/null 2>&1; then
  git config user.name "LordJeferies"
fi

if ! git config user.email >/dev/null 2>&1; then
  git config user.email "${USER_ID}+LordJeferies@users.noreply.github.com"
fi

if ! git diff --cached --quiet; then
  git commit -m "chore: publish Abraxas OS foundation"
fi

REMOTE_EXISTS=0
if gh repo view "$FULL" >/dev/null 2>&1; then
  REMOTE_EXISTS=1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  if [ "$REMOTE_EXISTS" -eq 0 ]; then
    echo
    echo "Creando repositorio público..."
    gh repo create "$FULL" \
      --public \
      --source=. \
      --remote=origin \
      --push \
      --description "Abraxas OS — Content Operating System for premium high-volume content production."
  else
    SIZE="$(gh api "repos/$FULL" --jq .size)"
    if [ "${SIZE:-1}" = "0" ]; then
      git remote add origin "https://github.com/$FULL.git"
      git push -u origin main
    else
      echo "❌ $FULL ya existe y no está vacío."
      echo "No lo enlazaré automáticamente a este repo local."
      exit 6
    fi
  fi
else
  git push -u origin main
fi

echo
echo "Configurando GitHub Pages por workflow..."

if gh api "repos/$FULL/pages" >/dev/null 2>&1; then
  gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "repos/$FULL/pages" \
    -f build_type=workflow \
    >/dev/null || true
else
  gh api \
    --method POST \
    -H "Accept: application/vnd.github+json" \
    "repos/$FULL/pages" \
    -f build_type=workflow \
    >/dev/null || true
fi

PAGES="$EXPECTED_PAGES"
API_PAGE="$(gh api "repos/$FULL/pages" --jq .html_url 2>/dev/null || true)"
if [ -n "$API_PAGE" ]; then
  PAGES="$API_PAGE"
fi

python3 - "$PAGES" <<'PY'
from pathlib import Path
import json
import sys

root = Path.home() / "Desktop" / "Abrxs os"
p = root / "PROJECT_CONTROL" / "GITHUB.json"
d = json.loads(p.read_text())
d["repoUrl"] = "https://github.com/LordJeferies/abraxas-os"
d["pagesUrl"] = sys.argv[1]
p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n")
PY

"$ROOT/scripts/checkpoint.sh" \
  "Repositorio público conectado/pusheado: $EXPECTED_REPO"

echo
echo "✅ GitHub:"
echo "$EXPECTED_REPO"
echo
echo "✅ Pages:"
echo "$PAGES"
echo

open "$EXPECTED_REPO" >/dev/null 2>&1 || true
open "$PAGES" >/dev/null 2>&1 || true
