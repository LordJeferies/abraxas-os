#!/bin/bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/native/apple/AbraxasMediaProxy.swift"
OUTDIR="$ROOT/native/apple/build"
OUT="$OUTDIR/abraxas-media-proxy"

mkdir -p "$OUTDIR"

xcrun --sdk macosx swiftc \
  -O \
  -framework AVFoundation \
  -framework CoreMedia \
  "$SRC" \
  -o "$OUT"

"$OUT" --self-test

echo "Built: $OUT"
