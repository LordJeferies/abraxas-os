#!/usr/bin/env python3

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
EDITOR = ROOT / "app" / "src" / "modules" / "editor-shell" / "EditorSpike.tsx"
LAB_CSS = ROOT / "app" / "src" / "modules" / "media-lab" / "media-lab.css"
APP_CSS = ROOT / "app" / "src" / "App.css"

errors = []
warnings = []

editor = EDITOR.read_text(errors="replace")
lab_css = LAB_CSS.read_text(errors="replace")
app_css = APP_CSS.read_text(errors="replace")

# Anti-patrón detectado durante el spike:
# onChange de VideoFlow no debe reinyectarse en la prop video en cada commit.
if "onChange={setVideo}" in editor:
    errors.append(
        "EditorSpike contiene onChange={setVideo}; "
        "puede reinicializar estado interactivo de VideoFlow."
    )

if "useState<VideoJSON>" in editor:
    warnings.append(
        "EditorSpike usa useState<VideoJSON>. Revisar que ese state no sea "
        "feedback inmediato a la prop `video`."
    )

# La app shell bloquea el scroll global por diseño; Media Lab debe crear
# explícitamente su propio scroll container.
required_css = [
    "height:100%",
    "min-height:0",
    "overflow-y:auto",
]

for token in required_css:
    if token not in lab_css:
        errors.append(f"Media Lab scroll incompleto: falta `{token}`.")

if ".workspace" not in app_css or "overflow:hidden" not in app_css:
    warnings.append(
        "App shell cambió su estrategia de overflow; revisar Media Lab scroll."
    )

print("ABRAXAS · VIDEOFLOW INTEGRATION CHECK")
print("====================================")

if warnings:
    print("\nWARNINGS:")
    for item in warnings:
        print("WARN", item)

if errors:
    print("\nERRORS:")
    for item in errors:
        print("ERROR", item)
    sys.exit(2)

print("\nOK integración spike coherente.")
