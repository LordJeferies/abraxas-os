#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"

limits = {
    "index.html": 170 * 1024,
    "assets/style.css": 95 * 1024,
    "assets/site.js": 18 * 1024,
    "assets/creation-hands-1800.jpg": 1200 * 1024,
    "assets/creation-hands-960.jpg": 650 * 1024,
}

errors = []
warnings = []

for rel, limit in limits.items():
    path = SITE / rel

    if not path.exists():
        errors.append(f"Falta {rel}")
        continue

    size = path.stat().st_size

    print(
        f"{rel:<38} "
        f"{size / 1024:>8.1f} KB "
        f"/ budget {limit / 1024:.0f} KB"
    )

    if size > limit:
        errors.append(
            f"{rel} excede presupuesto: {size/1024:.1f}KB > {limit/1024:.0f}KB"
        )

html = (SITE / "index.html").read_text(errors="replace")

for forbidden in [
    "cdn.jsdelivr.net",
    "cdnjs.cloudflare.com",
    "unpkg.com",
    "lenis",
    "ScrollTrigger",
]:
    if forbidden in html:
        errors.append(f"Dependencia externa/pesada detectada en HTML: {forbidden}")

js = (SITE / "assets" / "site.js").read_text(errors="replace")

if "requestAnimationFrame" in js:
    warnings.append("site.js usa requestAnimationFrame; revisar que no sea loop permanente.")

print("\nABRAXAS PUBLIC SITE PERFORMANCE BUDGET")

if warnings:
    for warning in warnings:
        print("⚠️", warning)

if errors:
    print()
    for error in errors:
        print("❌", error)
    sys.exit(2)

print("✅ Budget aprobado.")
