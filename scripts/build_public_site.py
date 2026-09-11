#!/usr/bin/env python3
from pathlib import Path
from html import escape
import json

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"

content = json.loads((SITE / "data" / "content.json").read_text())
status = json.loads((SITE / "data" / "status.json").read_text())

# status.json puede existir en dos formas:
# A) {"projectState": {...}}
# B) PROJECT_STATE directo, donde "project" es un string.
candidate = status.get("projectState") if isinstance(status, dict) else None

if isinstance(candidate, dict):
    project = candidate
elif isinstance(status, dict) and isinstance(status.get("project"), dict):
    project = status["project"]
elif isinstance(status, dict):
    project = status
else:
    project = {}

progress = project.get("progress", {}) if isinstance(project, dict) else {}

def e(value):
    return escape(str(value), quote=True)

def status_class(value):
    return value if value in {"complete","building","designed","planned"} else "planned"

nav = []
sections = []

for category in content["categories"]:
    nav.append(
        f'<a href="#{e(category["id"])}">'
        f'<span>{e(category["index"])}</span>'
        f'<b>{e(category["label"])}</b>'
        f'</a>'
    )

    cards = []
    for feature in category["features"]:
        state = status_class(feature["status"])
        cards.append(f"""
        <details class="feature-card" data-status="{e(state)}">
          <summary>
            <div class="feature-topline">
              <span class="status-dot {e(state)}"></span>
              <small>{e(content["statusLabels"].get(state, state.upper()))}</small>
            </div>
            <h3>{e(feature["title"])}</h3>
            <p>{e(feature["summary"])}</p>
            <span class="open-hint">Ver cómo funciona <i>+</i></span>
          </summary>
          <div class="feature-detail">
            <p>{e(feature["detail"])}</p>
          </div>
        </details>
        """)

    sections.append(f"""
    <section class="edition-section" id="{e(category["id"])}">
      <header class="section-intro">
        <div class="section-index">{e(category["index"])}</div>
        <div>
          <span class="section-label">{e(category["label"])}</span>
          <h2>{e(category["headline"])}</h2>
          <p>{e(category["summary"])}</p>
        </div>
      </header>

      <div class="feature-grid">
        {''.join(cards)}
      </div>

      <a class="back-link" href="#edition-nav">Volver a categorías ↑</a>
    </section>
    """)

outcomes = "".join(
    f"""
    <article>
      <h3>{e(item["title"])}</h3>
      <p>{e(item["text"])}</p>
    </article>
    """
    for item in content["outcomes"]
)

f0 = int(progress.get("foundation", 0) or 0)
f1 = int(progress.get("mediaCompatibility", 0) or 0)
f2 = int(progress.get("editorShell", 0) or 0)
f3 = int(progress.get("productionTimeline", 0) or 0)

html = f"""<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#0a0908">
  <meta name="description" content="Abraxas OS — Content Operating System para producción masiva de contenido con criterio profesional.">

  <title>Abraxas OS · {e(content["meta"]["edition"])}</title>

  <link
    rel="preload"
    href="assets/creation-hands-1800.jpg"
    as="image"
    media="(min-width: 721px)"
    fetchpriority="high"
  >
  <link rel="stylesheet" href="assets/style.css">
  <script defer src="assets/site.js"></script>
</head>

<body id="top">
  <header class="site-header">
    <a class="brand" href="#top"><span>A</span>Abraxas OS</a>

    <nav>
      <a href="#edition-nav">Sistema</a>
      <a href="#outcomes">Impacto</a>
      <a href="#build">Estado</a>
      <a href="https://github.com/LordJeferies/abraxas-os" target="_blank" rel="noopener">GitHub ↗</a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <picture class="hero-picture">
        <source media="(max-width:720px)" srcset="assets/creation-hands-960.jpg">
        <img
          src="assets/creation-hands-1800.jpg"
          width="1800"
          height="900"
          alt="Detalle de las manos de La creación de Adán de Miguel Ángel"
          decoding="async"
          fetchpriority="high"
        >
      </picture>

      <div class="hands left-hand" aria-hidden="true"></div>
      <div class="hands right-hand" aria-hidden="true"></div>

      <div class="hero-shade"></div>

      <div class="hero-copy">
        <span>{e(content["meta"]["eyebrow"])}</span>
        <p class="edition-name">{e(content["meta"]["edition"])}</p>
        <h1>{e(content["meta"]["title"])}</h1>
        <p>{e(content["meta"]["lead"])}</p>

        <div class="hero-actions">
          <a href="#edition-nav">Explorar el sistema ↓</a>
          <a class="subtle" href="#build">Ver avance</a>
        </div>
      </div>

      <div class="hero-promise">{e(content["meta"]["promise"])}</div>
    </section>

    <section class="orientation" id="edition-nav">
      <div class="orientation-copy">
        <span>EL MAPA</span>
        <h2>Entender Abraxas OS en seis partes.</h2>
        <p>
          Cada categoría explica una función del sistema. Abre una tarjeta sólo
          cuando quieras profundizar; la información esencial se entiende sin
          hacer clic.
        </p>
      </div>

      <nav class="category-nav">
        {''.join(nav)}
      </nav>
    </section>

    <section class="outcomes" id="outcomes">
      <header>
        <span>POR QUÉ EXISTE</span>
        <h2>El volumen sirve sólo si mantiene criterio.</h2>
      </header>

      <div class="outcome-grid">
        {outcomes}
      </div>
    </section>

    {''.join(sections)}

    <section class="build-section" id="build">
      <header>
        <span>BUILDING IN PUBLIC</span>
        <h2>Lo que funciona se marca. Lo que falta también.</h2>
        <p>{e(project.get("nextStep",""))}</p>
      </header>

      <div class="build-grid">
        <article>
          <div><span>F0</span><b>{f0}%</b></div>
          <h3>Foundation</h3>
          <progress max="100" value="{f0}">{f0}%</progress>
          <p>Arquitectura, contratos, Tauri, VideoFlow, gates y repositorio.</p>
        </article>

        <article class="active">
          <div><span>F1</span><b>{f1}%</b></div>
          <h3>Media Compatibility</h3>
          <progress max="100" value="{f1}">{f1}%</progress>
          <p>Certificar playback real horizontal/vertical en browser y Tauri.</p>
        </article>

        <article>
          <div><span>F2</span><b>{f2}%</b></div>
          <h3>Editor Shell</h3>
          <progress max="100" value="{f2}">{f2}%</progress>
          <p>Workspace premium de Preview, Timeline e Inspector.</p>
        </article>

        <article>
          <div><span>F3</span><b>{f3}%</b></div>
          <h3>Production Timeline</h3>
          <progress max="100" value="{f3}">{f3}%</progress>
          <p>Ghost objects, assets, XR, B-roll, Motion, SFX y captions.</p>
        </article>
      </div>

      <div class="status-footer">
        <span>Estado real del repositorio</span>
        <b>{e(project.get("currentPhase","F1"))} · {e(project.get("phaseName","Media Compatibility Lab"))}</b>
        <a href="https://github.com/LordJeferies/abraxas-os" target="_blank" rel="noopener">Ver código ↗</a>
      </div>
    </section>

    <section class="finale">
      <span>ABRAXAS OS</span>
      <h2>Una fuente.<br>Muchas piezas.<br><em>Un solo criterio.</em></h2>
      <a href="#top">Volver al inicio ↑</a>
    </section>
  </main>

  <footer>
    <span>Abraxas OS · Content Operating System</span>
    <span>Hero: Michelangelo · The Creation of Adam · Public Domain</span>
  </footer>
</body>
</html>
"""

html = "\n".join(line.rstrip(" \\t") for line in html.splitlines()) + "\n"
(SITE / "index.html").write_text(html)
print("Built:", SITE / "index.html")
