import { useMemo } from 'react'
import type { AlphaContent } from '../../core/alpha/types'
import {
  selectEditorDirectivesForRoute,
  type EditorDirective,
  type EditorTrack,
} from '../../core/alpha/alphaEditorDirectives'
import './alpha-ficha-review.css'

const TRACKS: Array<{track: EditorTrack; label: string; color: string}> = [
  { track: 'captions', label: 'SUBTÍTULOS', color: '#c9c7c8' },
  { track: 'xr', label: 'XR', color: '#d298e4' },
  { track: 'images', label: 'IMÁGENES', color: '#9b8dca' },
  { track: 'motion', label: 'MOTION', color: '#d28e95' },
  { track: 'broll', label: 'B-ROLL', color: '#8f785e' },
  { track: 'vo', label: 'VO JOC', color: '#a8caa8' },
  { track: 'aroll', label: 'A-ROLL', color: '#a7bfcb' },
  { track: 'story', label: 'PARTES', color: '#c8a2af' },
  { track: 'sfx', label: 'SFX', color: '#dfcf78' },
  { track: 'music', label: 'MÚSICA', color: '#86b3a3' },
]

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function str(value: unknown) {
  return value == null ? '' : String(value)
}

function labelFor(item: EditorDirective) {
  if (item.track === 'aroll') {
    return item.speaker || item.label || 'A-roll'
  }
  return item.label || item.description || item.text || item.type
}

function formatTime(value: number) {
  const safe = Math.max(0, value)
  const minutes = Math.floor(safe / 60)
  const seconds = safe - minutes * 60
  return `${String(minutes).padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`
}

function pxPerSecond(duration: number) {
  if (duration <= 150) return 13
  if (duration <= 420) return 7
  return 4
}

export default function AlphaFichaReview({
  content,
  route,
  selectedResourceId,
  onSelectResource,
  onClose,
}: {
  content: AlphaContent
  route: string
  selectedResourceId: string
  onSelectResource: (resourceId: string) => void
  onClose: () => void
}) {
  const directives = useMemo(
    () => selectEditorDirectivesForRoute(content, route),
    [content, route],
  )

  const duration = Math.max(
    content.durationSeconds || 0,
    ...directives.map((item) => item.end),
    1,
  )

  const pixels = pxPerSecond(duration)
  const width = Math.max(1000, Math.ceil(duration * pixels))
  const generic = content as unknown as Record<string, unknown>
  const payload = rec(content.sourcePayload)
  const scripts = rec(payload.storyScripts)
  const routeScript = scripts[route]

  const metadata = Object.entries(payload)
    .filter(([key, value]) =>
      key !== 'timeline'
      && key !== 'storyScripts'
      && !Array.isArray(value)
      && (
        typeof value === 'string'
        || typeof value === 'number'
        || typeof value === 'boolean'
      )
    )
    .slice(0, 18)

  return (
    <section className="alpha-ficha-review">
      <header className="alpha-ficha-head">
        <div>
          <small>FICHA ALFA · REVIEW</small>
          <h2>{content.title}</h2>
          <p>{route} · {directives.length} recursos · {formatTime(duration)}</p>
        </div>
        <button onClick={onClose}>Cerrar ficha</button>
      </header>

      <div className="alpha-ficha-info">
        <article>
          <small>TESIS</small>
          <p>{str(generic.thesis) || '—'}</p>
        </article>
        <article>
          <small>OBJETIVO</small>
          <p>{str(generic.objective) || '—'}</p>
        </article>
        <article>
          <small>FORMATO</small>
          <p>{content.contentType} · {content.orientation} · {str(generic.status)}</p>
        </article>
        <article>
          <small>RUTA</small>
          <p>{route}</p>
        </article>
      </div>

      {routeScript != null && (
        <details className="alpha-ficha-script">
          <summary>Guion / Story Script de esta ruta</summary>
          <pre>{JSON.stringify(routeScript, null, 2)}</pre>
        </details>
      )}

      {metadata.length > 0 && (
        <section className="alpha-ficha-metadata">
          {metadata.map(([key, value]) => (
            <div key={key}>
              <small>{key}</small>
              <span>{str(value)}</span>
            </div>
          ))}
        </section>
      )}

      <section className="alpha-ficha-timeline-shell">
        <header>
          <strong>TIMELINE ALFA ORIGINAL</strong>
          <span>start/end reales de la ficha</span>
        </header>

        <div className="alpha-ficha-timeline-scroll">
          <div style={{ width: width + 112 }}>
            {TRACKS.map((entry) => {
              const items = directives.filter((item) => item.track === entry.track)

              return (
                <div className="alpha-ficha-row" key={entry.track}>
                  <strong>{entry.label}</strong>
                  <div style={{ width }}>
                    {items.map((item) => (
                      <button
                        key={item.resourceId}
                        className={
                          item.resourceId === selectedResourceId
                            ? 'selected'
                            : ''
                        }
                        style={{
                          left: item.start * pixels,
                          width: Math.max(
                            7,
                            (item.end - item.start) * pixels,
                          ),
                          backgroundColor: entry.color,
                        }}
                        title={
                          `${labelFor(item)} · ${formatTime(item.start)} → `
                          + formatTime(item.end)
                        }
                        onClick={() => onSelectResource(item.resourceId)}
                      >
                        {item.state === 'ghost' ? '👻 ' : '◆ '}
                        {labelFor(item)}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </section>
  )
}
