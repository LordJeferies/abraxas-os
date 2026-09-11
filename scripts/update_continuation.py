#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from datetime import datetime
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
CONTROL = ROOT / "PROJECT_CONTROL"
CONT = ROOT / "continuacion en chat"
APP = ROOT / "app"
EVIDENCE = ROOT / "docs" / "evidence"

CONT.mkdir(parents=True, exist_ok=True)

def run(args, cwd=ROOT, timeout=30):
    try:
        p = subprocess.run(
            args,
            cwd=cwd,
            text=True,
            capture_output=True,
            timeout=timeout,
        )
        out = (p.stdout or "").strip()
        err = (p.stderr or "").strip()
        return out or err
    except Exception as e:
        return f"UNAVAILABLE: {e}"

def read(path: Path, fallback=""):
    try:
        return path.read_text(errors="replace")
    except Exception:
        return fallback

def load_json(path: Path, fallback):
    try:
        return json.loads(path.read_text())
    except Exception:
        return fallback

def sanitize(s: str) -> str:
    s = s.replace(str(Path.home()), "~")
    s = s.replace(str(ROOT), "<REPO>")
    patterns = [
        r'ghp_[A-Za-z0-9_]{20,}',
        r'github_pat_[A-Za-z0-9_]{20,}',
        r'sk-[A-Za-z0-9_-]{20,}',
        r'AKIA[0-9A-Z]{16}',
    ]
    for pat in patterns:
        s = re.sub(pat, "[REDACTED]", s)
    return s

state = load_json(CONTROL / "PROJECT_STATE.json", {})
modules = load_json(CONTROL / "MODULES.json", {"modules": []})
github = load_json(CONTROL / "GITHUB.json", {})
pkg = load_json(APP / "package.json", {})

git_branch = run(["git", "branch", "--show-current"]) or "unknown"
git_status = run(["git", "status", "--short", "--branch"])
git_remote = run(["git", "remote", "-v"]) or "SIN REMOTE"
git_log = run(["git", "log", "-5", "--oneline"])
if not git_log:
    git_log = "SIN COMMITS TODAVÍA"

deps = pkg.get("dependencies", {})
devdeps = pkg.get("devDependencies", {})

versions = {
    "node": run(["node", "--version"]),
    "npm": run(["npm", "--version"]),
    "react": deps.get("react"),
    "@videoflow/core": deps.get("@videoflow/core"),
    "@videoflow/react-video-editor": deps.get("@videoflow/react-video-editor"),
    "@tauri-apps/api": deps.get("@tauri-apps/api"),
    "@tauri-apps/cli": devdeps.get("@tauri-apps/cli"),
    "typescript": devdeps.get("typescript"),
    "vite": devdeps.get("vite"),
}

# Latest authoritative CHECK first.
latest_check = None
if EVIDENCE.exists():
    checks = sorted(
        EVIDENCE.glob("CHECK_*.txt"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if checks:
        latest_check = checks[0]

last_check_text = ""
if latest_check:
    raw = read(latest_check)
    last_check_text = sanitize("\n".join(raw.splitlines()[-60:]))

session_tail = sanitize(
    "\n".join(read(CONTROL / "SESSION_LOG.md").splitlines()[-30:])
)

module_rows = [
    f"| {m.get('id','')} | {m.get('name','')} | {m.get('status','')} | {m.get('path','')} |"
    for m in modules.get("modules", [])
]

key_files = [
    "PROJECT_CONTROL/00_LEEME_PRIMERO.md",
    "PROJECT_CONTROL/CURRENT_STATUS.md",
    "PROJECT_CONTROL/NEXT_STEP.md",
    "PROJECT_CONTROL/FROM_TO.md",
    "PROJECT_CONTROL/PROJECT_STATE.json",
    "PROJECT_CONTROL/MODULES.json",
    "PROJECT_CONTROL/GITHUB.json",
    "PROJECT_CONTROL/DEVELOPMENT_PROTOCOL.md",
    "docs/architecture/ABRAXAS_OS_MASTER_SPEC.md",
    "docs/architecture/RELEASE_GATES.md",
    "docs/decisions/DECISIONS.md",
    "docs/roadmap/ROADMAP.md",
    "contracts/production-graph.v1.schema.json",
    "examples/production-graph.demo.json",
    "app/package.json",
    "app/src/App.tsx",
    "app/src-tauri/tauri.conf.json",
    "site/index.html",
    ".github/workflows/pages.yml",
]

now = datetime.now().astimezone().isoformat(timespec="seconds")

repo_url = github.get("repoUrl", "SIN CONFIGURAR")
pages_url = github.get("pagesUrl", "SIN CONFIGURAR")

md = f"""# ABRAXAS OS — CONTINUACIÓN PARA CHAT

> Este es el archivo normal para retomar el proyecto sin subir el ZIP completo.

## Identidad

- Producto: Abraxas OS
- Repo local: `~/Desktop/Abrxs os`
- Generado: {now}
- Rama Git: `{git_branch}`
- GitHub público: {repo_url}
- Status / Product page: {pages_url}
- Workspace privado de clientes: `CLIENTES_PRIVADOS_LOCAL/`

## Privacidad

El repositorio GitHub contiene código, contratos, documentación y ejemplos
publicables.

Videos, podcasts, transcripciones, assets y trabajos reales de clientes
NO pertenecen al repositorio. Se guardan localmente en
`CLIENTES_PRIVADOS_LOCAL/`.

## Regla de fuente de verdad

1. decisiones explícitas actuales;
2. código probado;
3. contratos actuales;
4. PROJECT_CONTROL;
5. documentación actual;
6. referencias;
7. histórico R9.x / legacy.

VideoFlow NO es la fuente de verdad.

La fuente de verdad audiovisual/editorial es Abraxas Production Graph.

Ghost NO es un tipo de recurso: es un estado.

Motion puede aplicarse a A-roll, B-roll, XR, imagen, texto/caption, etc.

SFX es independiente y opcional según contexto.

XR es una secuencia visual compuesta que puede contener varios estados/assets.

## Estado actual

{read(CONTROL / "CURRENT_STATUS.md", "No disponible.")}

## Próximo paso

{read(CONTROL / "NEXT_STEP.md", "No disponible.")}

## De dónde venimos / hacia dónde vamos

{read(CONTROL / "FROM_TO.md", "No disponible.")}

## Estado estructurado

```json
{json.dumps(state, indent=2, ensure_ascii=False)}
```

## Módulos

| ID | Módulo | Estado | Ruta |
|---|---|---|---|
{chr(10).join(module_rows) if module_rows else "| - | Sin datos | - | - |"}

## Versiones clave

```json
{json.dumps(versions, indent=2, ensure_ascii=False)}
```

## Git

### Status

```text
{sanitize(git_status)}
```

### Remote

```text
{sanitize(git_remote)}
```

### Últimos commits

```text
{sanitize(git_log)}
```

## Último check autoritativo

Archivo:
`{str(latest_check.relative_to(ROOT)) if latest_check else "SIN CHECK"}`

```text
{last_check_text or "Todavía no existe un project check."}
```

## Última actividad

```text
{session_tail}
```

## Archivos clave

"""

for rel in key_files:
    md += f"- [{'x' if (ROOT / rel).exists() else ' '}] `{rel}`\n"

md += """
## Cómo continuar correctamente

1. Leer este archivo.
2. Identificar el módulo actual.
3. Inspeccionar únicamente los archivos relevantes.
4. Preservar los módulos que ya funcionan.
5. Aplicar un patch pequeño/reversible.
6. Ejecutar gates.
7. Actualizar PROJECT_CONTROL.
8. Regenerar esta carpeta.
9. Pedir el ZIP completo sólo cuando sea realmente necesario.
"""

(CONT / "ABRAXAS_OS_CONTINUACION_CHAT.md").write_text(md)

structured = {
    "generatedAt": now,
    "projectState": state,
    "modules": modules.get("modules", []),
    "github": github,
    "versions": versions,
    "git": {
        "branch": git_branch,
        "status": sanitize(git_status),
        "remote": sanitize(git_remote),
        "lastCommits": sanitize(git_log),
    },
    "latestCheck": (
        str(latest_check.relative_to(ROOT)) if latest_check else None
    ),
}

(CONT / "ESTADO_ACTUAL.json").write_text(
    json.dumps(structured, indent=2, ensure_ascii=False) + "\n"
)

(CONT / "ARCHIVOS_CLAVE.txt").write_text("\n".join(key_files) + "\n")
(CONT / "ULTIMO_CHECK.txt").write_text(
    last_check_text + "\n" if last_check_text else "SIN CHECK\n"
)

(CONT / "QUE_SUBIR_AL_CHAT.txt").write_text(
    """NORMALMENTE SUBIR:
ABRAXAS_OS_CONTINUACION_CHAT.md

SI HAY UN ERROR, AÑADIR:
ULTIMO_CHECK.txt
ULTIMO_ERROR.md (si existe)

SÓLO SI SE SOLICITA:
ZIP completo del repositorio.
"""
)

print(CONT / "ABRAXAS_OS_CONTINUACION_CHAT.md")
