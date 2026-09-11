#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

runtime_py = (ROOT / "scripts" / "abraxas_source_runtime.py").read_text(errors="replace")
lib = (ROOT / "app" / "src-tauri" / "src" / "lib.rs").read_text(errors="replace")
app = (ROOT / "app" / "src" / "App.tsx").read_text(errors="replace")
store = (ROOT / "app" / "src" / "core" / "state" / "useAppStore.ts").read_text(errors="replace")
panel = (ROOT / "app" / "src" / "modules" / "runtime" / "RuntimePanel.tsx").read_text(errors="replace")

requirements = {
    "atomic claim": "def claim_next_job" in runtime_py,
    "thumbnail worker": "def run_thumbnail_job" in runtime_py,
    "waveform worker": "def run_waveform_job" in runtime_py,
    "asset library": "def index_asset_folder" in runtime_py,
    "transcript adapter": "detect_transcription_backends" in runtime_py,
    "analysis adapter": "ABRAXAS_ANALYSIS_PROVIDER" in runtime_py,
    "Tauri runtime module": "mod source_runtime;" in lib,
    "Tauri asset command": "source_runtime_index_assets" in lib,
    "Tauri drain command": "source_runtime_drain" in lib,
    "App runtime view": "setView('runtime')" in app,
    "Media Lab keepalive": "MediaCompatibilityLab active={view === 'media-lab'}" in app,
    "Store runtime view": "'runtime'" in store,
    "Runtime source registration": "source_runtime_register" in panel,
    "Runtime asset indexing": "source_runtime_index_assets" in panel,
}

failed = [name for name, ok in requirements.items() if not ok]

print("ABRAXAS · F1.5 BUNDLE CHECK")
print("===========================")

for name, ok in requirements.items():
    print(("OK  " if ok else "FAIL"), name)

if failed:
    print("\nMissing:", ", ".join(failed))
    sys.exit(2)

print("\nOK F1.5 bundle wiring.")
