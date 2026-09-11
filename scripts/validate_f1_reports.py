#!/usr/bin/env python3

from pathlib import Path
from datetime import datetime
import glob
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
CONTROL = ROOT / "PROJECT_CONTROL"
PRIVATE = ROOT / "CLIENTES_PRIVADOS_LOCAL" / "_ABRAXAS_F1_VALIDATION"
PRIVATE.mkdir(parents=True, exist_ok=True)

patterns = sys.argv[1:] or [
    str(Path.home() / "Downloads" / "abraxas-f1-*.json")
]

paths = []
for pattern in patterns:
    paths.extend(Path(p) for p in glob.glob(pattern))

paths = sorted(
    set(paths),
    key=lambda p: p.stat().st_mtime if p.exists() else 0
)

required_slots = {
    ("browser", "horizontal"),
    ("browser", "vertical"),
    ("tauri", "horizontal"),
    ("tauri", "vertical"),
}

required_check_ids = {
    "selected",
    "metadata",
    "canplay",
    "play",
    "pause",
    "seek",
    "frame",
    "videoflow-load",
    "videoflow-play",
    "videoflow-seek",
    "audio",
}

best = {}
rejected = []

def effective_pass(data):
    checks = {
        item.get("id"): item.get("state")
        for item in (data.get("checks") or [])
        if isinstance(item, dict)
    }

    missing = sorted(
        check_id
        for check_id in required_check_ids
        if checks.get(check_id) != "pass"
    )

    return (not missing), missing

for path in paths:
    try:
        data = json.loads(path.read_text())
    except Exception as exc:
        rejected.append((path.name, f"JSON inválido: {exc}"))
        continue

    if data.get("schemaVersion") != "abraxas.media-compatibility-report.v2":
        rejected.append((path.name, "reporte anterior a v2"))
        continue

    runtime = data.get("runtime")
    orient = (data.get("media") or {}).get("orientation")
    key = (runtime, orient)

    if key not in required_slots:
        rejected.append(
            (path.name, f"runtime/orientation no esperado: {key}")
        )
        continue

    passed, missing_checks = effective_pass(data)

    if not passed:
        rejected.append(
            (
                path.name,
                "faltan checks F1: " + ", ".join(missing_checks)
            )
        )
        continue

    # currentRunPassed puede ser false en reportes v2 generados antes de que
    # `reopen` saliera del gate. La fuente de verdad son los checks relevantes.
    best[key] = {
        "generatedAt": data.get("generatedAt"),
        "reportedCurrentRunPassed": data.get("currentRunPassed"),
        "effectivePass": True,
        "media": {
            "width": (data.get("media") or {}).get("width"),
            "height": (data.get("media") or {}).get("height"),
            "duration": (data.get("media") or {}).get("duration"),
        },
    }

missing_slots = sorted(required_slots - set(best))

print("ABRAXAS F1 REPORT CONSOLIDATOR")
print("=============================")

for key in sorted(required_slots):
    print(
        ("PASS" if key in best else "MISS"),
        f"{key[0]:7} · {key[1]}"
    )

if rejected:
    print("\nIgnored reports:")
    for name, reason in rejected[-10:]:
        print(" -", name, ":", reason)

summary = {
    "schemaVersion": "abraxas.f1-validation-summary.v2",
    "generatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
    "passed": not missing_slots,
    "coverage": {
        f"{runtime}_{orient}": (runtime, orient) in best
        for runtime, orient in sorted(required_slots)
    },
    "missing": [
        f"{runtime}/{orient}"
        for runtime, orient in missing_slots
    ],
}

(PRIVATE / "F1_VALIDATION_REPORT.json").write_text(
    json.dumps(summary, indent=2, ensure_ascii=False) + "\n"
)

(CONTROL / "F1_GATE_SUMMARY.json").write_text(
    json.dumps(summary, indent=2, ensure_ascii=False) + "\n"
)

if missing_slots:
    print("\nF1 todavía NO está completo.")
    print("Faltan:", ", ".join(summary["missing"]))
    raise SystemExit(10)

state_path = CONTROL / "PROJECT_STATE.json"
state = json.loads(state_path.read_text())

state["currentPhase"] = "F2"
state["phaseName"] = "Editor Shell"
state["status"] = "pending"
state["blockedReason"] = None
state["lastCompletedStep"] = (
    "F1 Media Compatibility COMPLETED: browser/Tauri, "
    "horizontal/vertical, todos los checks F1 relevantes PASS."
)
state["nextStep"] = (
    "Construir F2 Editor Shell sobre playback certificado."
)
state.setdefault("progress", {})["mediaCompatibility"] = 100

state_path.write_text(
    json.dumps(state, indent=2, ensure_ascii=False) + "\n"
)

modules_path = CONTROL / "MODULES.json"
modules = json.loads(modules_path.read_text())

for module in modules.get("modules", []):
    if module.get("id") == "media-lab":
        module["status"] = "completed"

modules_path.write_text(
    json.dumps(modules, indent=2, ensure_ascii=False) + "\n"
)

print("\nF1 COMPLETED.")
print("Siguiente fase: F2 Editor Shell.")
