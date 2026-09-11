#!/usr/bin/env python3

from pathlib import Path
from datetime import datetime
import glob
import json
import sys
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CONTROL = ROOT / "PROJECT_CONTROL"
PRIVATE = ROOT / "CLIENTES_PRIVADOS_LOCAL" / "_ABRAXAS_F1_VALIDATION"
PRIVATE.mkdir(parents=True, exist_ok=True)

ATTESTATION = CONTROL / "F1_MANUAL_ATTESTATION.json"

patterns = sys.argv[1:] or [
    str(Path.home() / "Downloads" / "*.json")
]

paths: list[Path] = []

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

slot_name = {
    ("browser", "horizontal"): "browser_horizontal",
    ("browser", "vertical"): "browser_vertical",
    ("tauri", "horizontal"): "tauri_horizontal",
    ("tauri", "vertical"): "tauri_vertical",
}

required_checks = {
    "selected",
    "metadata",
    "canplay",
    "play",
    "pause",
    "seek",
    "frame",
    "rvfc",
    "videoflow-load",
    "videoflow-play",
    "videoflow-seek",
    "audio",
}

best: dict[tuple[str, str], dict[str, Any]] = {}
ignored: list[tuple[str, str]] = []

def effective_pass(data: dict[str, Any]) -> tuple[bool, list[str]]:
    raw_checks = data.get("checks") or []

    if not isinstance(raw_checks, list):
        return False, ["checks-no-es-lista"]

    checks = {
        item.get("id"): item.get("state")
        for item in raw_checks
        if isinstance(item, dict)
    }

    missing = sorted(
        check_id
        for check_id in required_checks
        if checks.get(check_id) != "pass"
    )

    return not missing, missing

for path in paths:
    try:
        parsed = json.loads(path.read_text())
    except Exception:
        continue

    if not isinstance(parsed, dict):
        continue

    if parsed.get("schemaVersion") != "abraxas.media-compatibility-report.v2":
        continue

    media = parsed.get("media")

    if not isinstance(media, dict):
        continue

    key = (
        parsed.get("runtime"),
        media.get("orientation"),
    )

    if key not in required_slots:
        ignored.append((path.name, f"slot inesperado: {key}"))
        continue

    passed, missing_checks = effective_pass(parsed)

    if not passed:
        ignored.append(
            (
                path.name,
                "faltan checks F1: " + ", ".join(missing_checks),
            )
        )
        continue

    candidate = {
        "source": "report",
        "file": path.name,
        "modifiedAt": path.stat().st_mtime,
        "generatedAt": parsed.get("generatedAt"),
        "media": media,
        "videoFlowProxyStrategy": parsed.get("videoFlowProxyStrategy"),
    }

    current = best.get(key)

    if current is None or candidate["modifiedAt"] >= current.get("modifiedAt", 0):
        best[key] = candidate

attestation_used = False
attestation_data: dict[str, Any] | None = None

if ATTESTATION.is_file():
    try:
        parsed = json.loads(ATTESTATION.read_text())

        if (
            isinstance(parsed, dict)
            and parsed.get("schemaVersion") == "abraxas.f1-manual-attestation.v1"
            and parsed.get("userConfirmedAllFourSlots") is True
            and isinstance(parsed.get("slots"), dict)
        ):
            attestation_data = parsed

            for key in required_slots:
                if key in best:
                    continue

                slot = parsed["slots"].get(slot_name[key])

                if isinstance(slot, dict) and slot.get("passed") is True:
                    best[key] = {
                        "source": "manual-attestation",
                        "file": ATTESTATION.name,
                        "attestedAt": parsed.get("attestedAt"),
                        "evidence": slot.get("evidence"),
                    }
                    attestation_used = True
    except Exception as exc:
        ignored.append(
            (ATTESTATION.name, f"atestación inválida: {exc}")
        )

missing_slots = sorted(required_slots - set(best))

print("ABRAXAS F1 RELEASE GATE")
print("======================")

for key in sorted(required_slots):
    if key in best:
        print(
            "PASS",
            f"{key[0]:7} · {key[1]:10}",
            "·",
            best[key]["source"],
        )
    else:
        print("MISS", f"{key[0]:7} · {key[1]:10}")

if attestation_used:
    print("\nManual attestation: USED")
    print("Reason:", (attestation_data or {}).get("basis"))

if ignored:
    print("\nIgnored:")
    for name, reason in ignored[-10:]:
        print(" -", name, ":", reason)

summary = {
    "schemaVersion": "abraxas.f1-validation-summary.v4",
    "generatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
    "passed": not missing_slots,
    "manualAttestationUsed": attestation_used,
    "coverage": {
        f"{runtime}_{orientation}": (runtime, orientation) in best
        for runtime, orientation in sorted(required_slots)
    },
    "evidence": {
        f"{runtime}_{orientation}": best.get((runtime, orientation))
        for runtime, orientation in sorted(required_slots)
    },
    "missing": [
        f"{runtime}/{orientation}"
        for runtime, orientation in missing_slots
    ],
}

(PRIVATE / "F1_VALIDATION_REPORT.json").write_text(
    json.dumps(summary, indent=2, ensure_ascii=False) + "\n"
)

(CONTROL / "F1_GATE_SUMMARY.json").write_text(
    json.dumps(summary, indent=2, ensure_ascii=False) + "\n"
)

if missing_slots:
    print("\nF1 NO cerrado.")
    print("Faltan:", ", ".join(summary["missing"]))
    raise SystemExit(10)

state_path = CONTROL / "PROJECT_STATE.json"
state = json.loads(state_path.read_text())

state["currentPhase"] = "F1.5"
state["phaseName"] = "Fast Source Runtime & Proven Cut Engine"
state["status"] = "in_progress"
state["blockedReason"] = None
state["lastCompletedStep"] = (
    "F1 Media Compatibility COMPLETED. Los cuatro casos fueron verificados; "
    "se utilizó atestación manual porque los JSON finales no se conservaron."
)
state["nextStep"] = (
    "Construir Source Registry persistente y Background Job Queue; "
    "integrar CUT_ONLY como job ejecutable sin VideoFlow."
)
state.setdefault("progress", {})["mediaCompatibility"] = 100

manual = state.setdefault("manualObservations", {})
manual["f1ManualAttestationAccepted"] = attestation_used
manual["f1AllFourSlotsPass"] = True

state_path.write_text(
    json.dumps(state, indent=2, ensure_ascii=False) + "\n"
)

modules_path = CONTROL / "MODULES.json"
modules = json.loads(modules_path.read_text())

for module in modules.get("modules", []):
    if module.get("id") == "media-lab":
        module["status"] = "completed"
    elif module.get("id") in {
        "fast-source-runtime",
        "proven-cut-engine",
    }:
        module["status"] = "started"

modules_path.write_text(
    json.dumps(modules, indent=2, ensure_ascii=False) + "\n"
)

print("\nF1 COMPLETED.")
print("CURRENT PHASE: F1.5 Fast Source Runtime & Proven Cut Engine.")
