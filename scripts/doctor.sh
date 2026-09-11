#!/usr/bin/env bash
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/app"

echo "ABRAXAS OS DOCTOR"
echo "================="
echo "Date: $(date '+%Y-%m-%d %H:%M:%S %z')"
echo
sw_vers || true
echo
uname -m || true
echo
node --version || true
npm --version || true
rustc --version || true
cargo --version || true
swift --version 2>&1 | head -n 2 || true
xcodebuild -version || true
echo
cd "$APP"
npx tauri info || true
