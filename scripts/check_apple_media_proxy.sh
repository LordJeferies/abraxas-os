#!/bin/bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/native/apple/AbraxasMediaProxy.swift"
BIN="$ROOT/native/apple/build/abraxas-media-proxy"

echo "ABRAXAS · APPLE MEDIA PROXY CHECK"
echo "================================"

[ -f "$SRC" ] || {
  echo "ERROR: falta $SRC"
  exit 2
}

xcrun --sdk macosx swiftc \
  -typecheck \
  -framework AVFoundation \
  -framework CoreMedia \
  "$SRC"

echo "OK Swift typecheck"

if [ ! -x "$BIN" ]; then
  "$ROOT/scripts/build_apple_media_proxy.sh"
fi

"$BIN" --self-test | grep -q "ABRAXAS_MEDIA_PROXY_SELF_TEST_OK"

echo "OK helper self-test"
