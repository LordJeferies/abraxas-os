#!/usr/bin/env python3

from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"
TAURI = APP / "src-tauri"

cargo_path = TAURI / "Cargo.toml"
conf_path = TAURI / "tauri.conf.json"
lib_path = TAURI / "src" / "lib.rs"
cap_path = TAURI / "capabilities" / "default.json"
package_path = APP / "package.json"

errors = []
warnings = []

cargo = cargo_path.read_text(errors="replace")
conf = json.loads(conf_path.read_text())
lib = lib_path.read_text(errors="replace") if lib_path.exists() else ""
pkg = json.loads(package_path.read_text())
cap = json.loads(cap_path.read_text()) if cap_path.exists() else {}

asset_protocol = (
    conf.get("app", {})
        .get("security", {})
        .get("assetProtocol", {})
)

if asset_protocol.get("enable") is True:
    if "protocol-asset" not in cargo:
        errors.append(
            "tauri.conf.json habilita app.security.assetProtocol, "
            "pero Cargo.toml no incluye la feature tauri/protocol-asset."
        )
    if not asset_protocol.get("scope"):
        errors.append("assetProtocol está habilitado pero no tiene scope.")

js_deps = {
    **pkg.get("dependencies", {}),
    **pkg.get("devDependencies", {}),
}

has_dialog_js = "@tauri-apps/plugin-dialog" in js_deps
has_dialog_rust = "tauri-plugin-dialog" in cargo
has_dialog_builder = "tauri_plugin_dialog::init()" in lib

permissions = cap.get("permissions", [])
has_dialog_permission = any(
    isinstance(p, str) and p.startswith("dialog:")
    for p in permissions
)

if has_dialog_js and not has_dialog_rust:
    errors.append(
        "Existe @tauri-apps/plugin-dialog en package.json, "
        "pero falta tauri-plugin-dialog en Cargo.toml."
    )

if has_dialog_rust and not has_dialog_builder:
    errors.append(
        "tauri-plugin-dialog está en Cargo.toml, "
        "pero lib.rs no registra tauri_plugin_dialog::init()."
    )

if has_dialog_js and not has_dialog_permission:
    errors.append(
        "El dialog plugin está instalado, pero no aparece ningún permiso "
        "dialog:* en capabilities/default.json."
    )

build = conf.get("build", {})

if build.get("frontendDist") != "../dist":
    warnings.append(
        f"frontendDist inesperado: {build.get('frontendDist')!r}"
    )

if not build.get("devUrl"):
    warnings.append("tauri.conf.json no define build.devUrl.")

gitignore = (ROOT / ".gitignore").read_text(errors="replace")

if "CLIENTES_PRIVADOS_LOCAL/*" not in gitignore:
    errors.append(
        "Falta regla Git para ignorar CLIENTES_PRIVADOS_LOCAL/*."
    )

print("ABRAXAS · TAURI COHERENCE CHECK")
print("================================")

if warnings:
    print("\nWARNINGS:")
    for item in warnings:
        print("⚠️", item)

if errors:
    print("\nERRORS:")
    for item in errors:
        print("❌", item)
    sys.exit(2)

print("\n✅ Configuración Tauri/Cargo/plugins coherente.")
