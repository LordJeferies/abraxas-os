#!/usr/bin/env python3

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Sólo contenido que Abraxas genera automáticamente.
# Incluimos docs/evidence porque captura stdout de herramientas que a veces
# contiene trailing spaces y no debe bloquear un commit.
TARGET_DIRS = [
    ROOT / "continuacion en chat",
    ROOT / "PROJECT_CONTROL",
    ROOT / "docs" / "evidence",
]

TARGET_FILES = [
    ROOT / "site" / "data" / "status.json",
]

TEXT_SUFFIXES = {
    ".md", ".txt", ".json", ".log"
}

changed = []

def normalize(path: Path):
    if not path.exists() or not path.is_file():
        return

    if path.suffix.lower() not in TEXT_SUFFIXES:
        return

    try:
        text = path.read_text(errors="strict")
    except Exception:
        return

    normalized = "\n".join(
        line.rstrip(" \t")
        for line in text.splitlines()
    ) + "\n"

    if normalized != text:
        path.write_text(normalized)
        changed.append(path)

for directory in TARGET_DIRS:
    if directory.exists():
        for path in directory.rglob("*"):
            normalize(path)

for path in TARGET_FILES:
    normalize(path)

if changed:
    print("NORMALIZED:")
    for path in changed:
        print(" -", path.relative_to(ROOT))
else:
    print("✅ Generated/evidence text already normalized.")
