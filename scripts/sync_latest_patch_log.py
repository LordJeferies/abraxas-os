#!/usr/bin/env python3

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "docs" / "evidence"
CONT = ROOT / "continuacion en chat"
TARGET = CONT / "ULTIMO_PATCH_LOG.txt"

CONT.mkdir(parents=True, exist_ok=True)

logs = sorted(
    EVIDENCE.glob("ABRAXAS_OS_*.log"),
    key=lambda p: p.stat().st_mtime,
    reverse=True,
)

if not logs:
    TARGET.write_text("SIN PATCH LOG\n")
    print("No patch logs found.")
    raise SystemExit(0)

source = logs[0]
text = source.read_text(errors="replace")

text = text.replace(str(Path.home()), "~")
text = re.sub(r'ghp_[A-Za-z0-9_]{20,}', '[REDACTED]', text)
text = re.sub(r'github_pat_[A-Za-z0-9_]{20,}', '[REDACTED]', text)
text = re.sub(r'sk-[A-Za-z0-9_-]{20,}', '[REDACTED]', text)

TARGET.write_text(text.rstrip() + "\n")
print("Patch log sincronizado:", source.name)
