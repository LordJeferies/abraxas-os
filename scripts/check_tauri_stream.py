#!/usr/bin/env python3

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
TAURI = ROOT / "app" / "src-tauri"
LAB = ROOT / "app" / "src" / "modules" / "media-lab" / "MediaCompatibilityLab.tsx"
ADAPTER = ROOT / "app" / "src" / "core" / "media" / "MediaTransport.ts"

lib = (TAURI / "src" / "lib.rs").read_text(errors="replace")
server = (TAURI / "src" / "media_http.rs").read_text(errors="replace")
cargo = (TAURI / "Cargo.toml").read_text(errors="replace")
lab = LAB.read_text(errors="replace")
adapter = ADAPTER.read_text(errors="replace")

requirements = {
    "loopback bind": '127.0.0.1:0' in server,
    "random assigned port": "server_addr()" in server,
    "opaque token registry": "HashMap<String, PathBuf>" in server,
    "range parser": "HttpRange::parse" in server,
    "206 partial content": "StatusCode(206)" in server,
    "bounded range chunks": "MAX_RANGE_CHUNK" in server,
    "full GET streams File": "Response::from_file(file)" in server,
    "CORS": "Access-Control-Allow-Origin" in server,
    "health endpoint": '"/health"' in server,
    "tiny_http dependency": "tiny_http" in cargo,
    "http-range dependency": "http-range" in cargo,
    "server managed by Tauri": ".manage(media_server)" in lib,
    "register command": "register_media_source_http" in lib,
    "transport adapter": "registerDesktopMediaPath" in adapter,
    "runtime health fetch": "/health" in adapter,
    "Media Lab uses adapter": "registerDesktopMediaPath(selected)" in lab,
    "source kind http": "'http'" in lab,
}

failed = [name for name, ok in requirements.items() if not ok]

print("ABRAXAS · TAURI LOCALHOST MEDIA CHECK")
print("====================================")

for name, ok in requirements.items():
    print(("OK  " if ok else "FAIL"), name)

if failed:
    print("\nMissing:", ", ".join(failed))
    sys.exit(2)

print("\nOK localhost media bridge wiring.")
