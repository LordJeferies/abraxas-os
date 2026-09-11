#!/usr/bin/env python3
from pathlib import Path
import argparse
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]

parser = argparse.ArgumentParser()
parser.add_argument("--staged", action="store_true")
parser.add_argument("--working-tree", action="store_true")
args = parser.parse_args()

def run(cmd):
    return subprocess.run(
        cmd, cwd=ROOT, text=True, capture_output=True, check=False
    )

if args.staged:
    out = run(["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"]).stdout
    files = [x for x in out.splitlines() if x.strip()]
else:
    tracked = run(["git", "ls-files"]).stdout.splitlines()
    untracked = run(
        ["git", "ls-files", "--others", "--exclude-standard"]
    ).stdout.splitlines()
    files = sorted(set(tracked + untracked))

forbidden_parts = {
    "node_modules",
    ".npm-cache",
    "target",
    "dist",
    ".env",
    "assets/private",
    "media/private",
    "user-data",
    "workspace-private",
}

forbidden_suffixes = {
    ".p12", ".pfx", ".pem", ".key", ".mobileprovision"
}

secret_patterns = [
    (re.compile(rb'ghp_[A-Za-z0-9_]{20,}'), "GitHub classic token"),
    (re.compile(rb'github_pat_[A-Za-z0-9_]{20,}'), "GitHub fine-grained token"),
    (re.compile(rb'sk-[A-Za-z0-9_-]{20,}'), "API key"),
    (re.compile(rb'AKIA[0-9A-Z]{16}'), "AWS access key"),
    (re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'), "Private key"),
]

errors = []
warnings = []

for rel in files:
    p = ROOT / rel
    normalized = rel.replace("\\", "/")

    if any(
        normalized == bad
        or normalized.startswith(bad + "/")
        or f"/{bad}/" in f"/{normalized}/"
        for bad in forbidden_parts
    ):
        errors.append(f"Ruta prohibida para repo público: {rel}")
        continue

    if p.suffix.lower() in forbidden_suffixes:
        errors.append(f"Archivo sensible por extensión: {rel}")
        continue

    if not p.exists() or not p.is_file():
        continue

    size = p.stat().st_size
    if size >= 90 * 1024 * 1024:
        errors.append(f"Archivo >= 90 MB: {rel} ({size/1024/1024:.1f} MB)")

    # Avisar sobre media real en un repo público.
    if p.suffix.lower() in {".mp4",".mov",".m4v",".wav",".mp3",".aiff",".mkv"}:
        warnings.append(f"Revisar que sea media DEMO y publicable: {rel}")

    if size <= 5 * 1024 * 1024:
        try:
            data = p.read_bytes()
        except Exception:
            continue
        for rx, label in secret_patterns:
            if rx.search(data):
                errors.append(f"{label} detectado en: {rel}")

print("ABRAXAS PUBLIC REPO GUARD")
print("=========================")

if warnings:
    print("\nWARNINGS:")
    for w in warnings:
        print("⚠️", w)

if errors:
    print("\nERRORS:")
    for e in errors:
        print("❌", e)
    sys.exit(2)

print("\n✅ No se detectaron bloqueos para un repo público.")
