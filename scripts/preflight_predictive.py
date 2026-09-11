#!/usr/bin/env python3

from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"
TAURI = APP / "src-tauri"

errors = []
warnings = []

def load_json(path: Path):
    try:
        return json.loads(path.read_text())
    except Exception as exc:
        errors.append(f"JSON inválido {path.relative_to(ROOT)}: {exc}")
        return {}

def command(args):
    try:
        p = subprocess.run(
            args,
            cwd=ROOT,
            text=True,
            capture_output=True,
            timeout=20,
        )
        return p.returncode, (p.stdout or "").strip(), (p.stderr or "").strip()
    except Exception as exc:
        return 99, "", str(exc)

required = [
    ROOT / "PROJECT_CONTROL" / "PROJECT_STATE.json",
    ROOT / "PROJECT_CONTROL" / "MODULES.json",
    ROOT / "PROJECT_CONTROL" / "GITHUB.json",
    ROOT / "contracts" / "production-graph.v1.schema.json",
    APP / "package.json",
    APP / "package-lock.json",
    TAURI / "Cargo.toml",
    TAURI / "Cargo.lock",
    TAURI / "tauri.conf.json",
    TAURI / "capabilities" / "default.json",
    ROOT / "scripts" / "check_project.sh",
    ROOT / "scripts" / "update_continuation.py",
    ROOT / "scripts" / "prepush_guard.py",
]

for path in required:
    if not path.exists():
        errors.append(f"Falta archivo obligatorio: {path.relative_to(ROOT)}")

pkg = load_json(APP / "package.json")
tauri = load_json(TAURI / "tauri.conf.json")
cap = load_json(TAURI / "capabilities" / "default.json")
github = load_json(ROOT / "PROJECT_CONTROL" / "GITHUB.json")

# Node requirement.
rc, node_out, _ = command(["node", "-p", "process.versions.node.split('.')[0]"])
if rc != 0:
    errors.append("No se pudo leer Node.")
else:
    try:
        if int(node_out) < 20:
            errors.append(f"Node demasiado antiguo: {node_out}. VideoFlow requiere >=20.")
    except Exception:
        errors.append(f"Versión Node inesperada: {node_out}")

# Git branch / remote.
rc, branch, _ = command(["git", "branch", "--show-current"])
if rc == 0 and branch != "main":
    errors.append(f"Branch activa inesperada: {branch}")

rc, origin, _ = command(["git", "remote", "get-url", "origin"])
expected_origin = "https://github.com/LordJeferies/abraxas-os.git"
if rc == 0 and origin != expected_origin:
    errors.append(f"origin inesperado: {origin}")

# Public/private rules.
gitignore = (ROOT / ".gitignore").read_text(errors="replace")
if "CLIENTES_PRIVADOS_LOCAL/*" not in gitignore:
    errors.append("CLIENTES_PRIVADOS_LOCAL no está protegido por .gitignore.")

rc, tracked_private, _ = command(["git", "ls-files", "CLIENTES_PRIVADOS_LOCAL"])
if rc == 0:
    bad = [
        line for line in tracked_private.splitlines()
        if line and line != "CLIENTES_PRIVADOS_LOCAL/README.md"
    ]
    if bad:
        errors.append("Hay material privado trackeado: " + ", ".join(bad))

if github.get("publishPrivateClientData") is not False:
    errors.append("GITHUB.json no declara publishPrivateClientData=false.")

# npm local cache.
npmrc = APP / ".npmrc"
if npmrc.exists():
    content = npmrc.read_text(errors="replace")
    if "cache=../.npm-cache" not in content:
        warnings.append("app/.npmrc no apunta al cache npm local esperado.")
else:
    warnings.append("No existe app/.npmrc.")

# Tauri asset protocol.
cargo = (TAURI / "Cargo.toml").read_text(errors="replace")
lib = (TAURI / "src" / "lib.rs").read_text(errors="replace")

asset = (
    tauri.get("app", {})
         .get("security", {})
         .get("assetProtocol", {})
)

if asset.get("enable") is True:
    if "protocol-asset" not in cargo:
        errors.append(
            "assetProtocol está activo pero Cargo no tiene feature protocol-asset."
        )
    if not asset.get("scope"):
        errors.append("assetProtocol está activo sin scope.")

# Dialog plugin four-way coherence.
deps = {
    **pkg.get("dependencies", {}),
    **pkg.get("devDependencies", {}),
}

dialog_js = "@tauri-apps/plugin-dialog" in deps
dialog_rust = "tauri-plugin-dialog" in cargo
dialog_init = "tauri_plugin_dialog::init()" in lib
dialog_permission = any(
    isinstance(item, str) and item.startswith("dialog:")
    for item in cap.get("permissions", [])
)

if dialog_js and not dialog_rust:
    errors.append("Dialog plugin JS instalado pero Rust dependency falta.")
if dialog_rust and not dialog_init:
    errors.append("Dialog Rust dependency existe pero no se registra en lib.rs.")
if dialog_js and not dialog_permission:
    errors.append("Dialog plugin instalado sin permission dialog:*.")

# F1 module coherence.
f1_files = [
    APP / "src" / "modules" / "media-lab" / "MediaCompatibilityLab.tsx",
    APP / "src" / "modules" / "media-lab" / "media-lab.css",
    APP / "src" / "modules" / "media-lab" / "README.md",
    ROOT / "PROJECT_CONTROL" / "F1_MEDIA_COMPATIBILITY_PLAN.md",
]
for path in f1_files:
    if not path.exists():
        errors.append(f"F1 incompleto: falta {path.relative_to(ROOT)}")

# Public site expected assets.
site_files = [
    ROOT / "site" / "index.html",
    ROOT / "site" / "assets" / "style.css",
    ROOT / "site" / "assets" / "site.js",
    ROOT / "site" / "data" / "content.json",
]
for path in site_files:
    if not path.exists():
        errors.append(f"Public site incompleto: falta {path.relative_to(ROOT)}")

hero = ROOT / "site" / "assets" / "creation-hands.jpg"
if not hero.exists() or hero.stat().st_size < 10_000:
    warnings.append(
        "Hero local creation-hands.jpg ausente/pequeño; el HTML tiene fallback remoto."
    )

# Workflow files should exist in public repo source.
for workflow in ["ci.yml", "pages.yml"]:
    path = ROOT / ".github" / "workflows" / workflow
    if not path.exists():
        errors.append(f"Falta workflow: .github/workflows/{workflow}")

print("ABRAXAS · PREDICTIVE PREFLIGHT")
print("==============================")

if warnings:
    print("\nWARNINGS:")
    for item in warnings:
        print("⚠️", item)

if errors:
    print("\nERRORS:")
    for item in errors:
        print("❌", item)
    sys.exit(2)

print("\n✅ Preflight predictivo aprobado.")
