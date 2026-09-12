import { useMemo, useState } from 'react'
import type { AlphaContent, AlphaTrack } from '../../core/alpha/types'
import {
  applyAlphaEdits,
  getAlphaOverlay,
  overlayText,
  useAlphaEditStore,
} from '../../core/alpha/alphaEditStore'
import { buildCanonicalTimeline, formatTimelineTime } from '../../core/alpha/alphaTimelineModel'
import {
  getEditorRoutes,
  getGhostInspectorData,
  selectEditorDirectivesForRoute,
} from '../../core/alpha/alphaEditorDirectives'
import CanonicalTimeline from './CanonicalTimeline'
import './alpha-ficha-studio.css'

const BOARD: Array<{ id: string; label: string; tracks: AlphaTrack[] }> = [
  { id: 'narrative', label: 'NARRATIVA', tracks: ['story', 'aroll', 'vo', 'captions'] },
  { id: 'visual', label: 'VISUAL / MONTAJE', tracks: ['xr', 'images', 'motion', 'broll', 'transition'] },
  { id: 'audio', label: 'AUDIO', tracks: ['sfx', 'music'] },
]

function stringValue(value: unknown) {
  return value == null ? '' : String(value)
}

function firstPrompt(raw: Record<string, unknown>) {
  const candidates = [
    raw.abraxasEditorPrompt,
    raw.prompt,
    raw.promptNoText,
    raw.promptWithText,
    raw.generationPrompt,
  ]

  for (const candidate of candidates) {
    const value = stringValue(candidate)
    if (value) return value
  }

  const asset = raw.asset
  if (asset && typeof asset === 'object' && !Array.isArray(asset)) {
    const value = stringValue((asset as Record<string, unknown>).prompt)
    if (value) return value
  }

  return ''
}

export default function AlphaFichaStudio({
  documentId,
  baseContent,
  route,
  onRouteChange,
  selectedResourceId,
  onSelectResource,
  onBack,
  onEditVideo,
}: {
  documentId: string
  baseContent: AlphaContent
  route: string
  onRouteChange: (route: string) => void
  selectedResourceId: string
  onSelectResource: (resourceId: string) => void
  onBack: () => void
  onEditVideo: () => void
}) {
  const overlays = useAlphaEditStore((state) => state.overlays)
  const patchContent = useAlphaEditStore((state) => state.patchContent)
  const patchResource = useAlphaEditStore((state) => state.patchResource)
  const resetContent = useAlphaEditStore((state) => state.resetContent)
  const overlay = getAlphaOverlay(overlays, documentId, baseContent.contentId)
  const content = applyAlphaEdits(baseContent, overlay)
  const routes = getEditorRoutes(content)
  const activeRoute = routes.includes(route) ? route : routes.includes('source') ? 'source' : routes[0]

  const directives = useMemo(
    () => selectEditorDirectivesForRoute(content, activeRoute),
    [content, activeRoute],
  )

  const selected = directives.find((item) => item.resourceId === selectedResourceId)
    ?? directives.find((item) => item.track === 'xr')
    ?? directives[0]
    ?? null

  const selectedInfo = selected ? getGhostInspectorData(selected) : null
  const [rawOpen, setRawOpen] = useState(false)
  const model = useMemo(() => buildCanonicalTimeline(content, activeRoute), [content, activeRoute])
  const sourceCopy = stringValue(baseContent.copyVariants.default ?? baseContent.sourcePayload.copy)
  const copy = overlayText(overlay, 'copy', sourceCopy)
  const notes = overlayText(overlay, 'notes', '')
  const prompt = selected
    ? stringValue(selected.parameters.editorPrompt) || firstPrompt(selected.raw)
    : ''
  const stale = Boolean(overlay && overlay.baseRevisionId !== baseContent.revisionId)

  return (
    <section className="alpha-ficha-studio">
      <header className="alpha-ficha-studio-head">
        <button type="button" onClick={onBack}>← Potenciales</button>
        <div>
          <small>FICHA STUDIO · ALPHA</small>
          <h1>{content.title}</h1>
          <p>{activeRoute} · {formatTimelineTime(model.duration)} · {model.items.length} recursos</p>
        </div>
        <select value={activeRoute} onChange={(event) => onRouteChange(event.target.value)}>
          {routes.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        {content.contentType === 'video' && (
          <button type="button" className="primary" onClick={onEditVideo}>Abrir Editor →</button>
        )}
      </header>

      {stale && (
        <div className="alpha-ficha-warning">
          El Alfa importado cambió desde estas ediciones. El original se conserva y las ediciones siguen en overlay.
        </div>
      )}

      {model.truthIssues.length > 0 && (
        <div className="alpha-ficha-warning">
          Timeline Truth detectó {model.truthIssues.length} diferencias temporales. No se compactan ni se ocultan.
        </div>
      )}

      <div className="alpha-ficha-studio-main">
        <section className="alpha-ficha-general">
          <div className="alpha-ficha-section-title">
            <div><small>INFORMACIÓN GENERAL</small><strong>Editable sin alterar el HTML importado</strong></div>
            <button type="button" onClick={() => resetContent(documentId, baseContent.contentId)}>Restaurar original</button>
          </div>

          <label>
            <span>Título</span>
            <input value={content.title} onChange={(event) => patchContent(documentId, baseContent, { title: event.target.value })} />
          </label>

          <div className="alpha-ficha-two">
            <label>
              <span>Tesis</span>
              <textarea value={content.thesis} onChange={(event) => patchContent(documentId, baseContent, { thesis: event.target.value })} />
            </label>
            <label>
              <span>Objetivo</span>
              <textarea value={content.objective} onChange={(event) => patchContent(documentId, baseContent, { objective: event.target.value })} />
            </label>
          </div>

          <label>
            <span>Copy / descripción general</span>
            <textarea value={copy} onChange={(event) => patchContent(documentId, baseContent, { copy: event.target.value })} />
          </label>

          <div className="alpha-ficha-two">
            <label>
              <span>Estado</span>
              <input value={content.status} onChange={(event) => patchContent(documentId, baseContent, { status: event.target.value })} />
            </label>
            <label>
              <span>Notas de revisión</span>
              <textarea value={notes} onChange={(event) => patchContent(documentId, baseContent, { notes: event.target.value })} />
            </label>
          </div>
        </section>

        <section className="alpha-ficha-kanban">
          <div className="alpha-ficha-section-title">
            <div><small>MAPA DE PRODUCCIÓN</small><strong>Mini-kanban interno de la ficha</strong></div>
          </div>

          <div className="alpha-ficha-kanban-columns">
            {BOARD.map((column) => {
              const items = directives.filter((item) => column.tracks.includes(item.track))
              return (
                <div className="alpha-ficha-kanban-column" key={column.id}>
                  <header><strong>{column.label}</strong><span>{items.length}</span></header>
                  {items.map((item) => (
                    <button
                      type="button"
                      key={item.resourceId}
                      className={item.resourceId === selected?.resourceId ? 'active' : ''}
                      onClick={() => onSelectResource(item.resourceId)}
                    >
                      <small>{item.track.toUpperCase()} · {formatTimelineTime(item.start)} → {formatTimelineTime(item.end)}</small>
                      <strong>{item.label}</strong>
                      <p>{item.description || item.text || 'Sin descripción'}</p>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </section>

        <aside className="alpha-ficha-resource">
          <div className="alpha-ficha-section-title">
            <div><small>RECURSO SELECCIONADO</small><strong>{selected?.label ?? 'Selecciona un bloque'}</strong></div>
          </div>

          {selected ? (
            <>
              <div className="alpha-ficha-resource-meta">
                <span>{selected.track}</span>
                <span>{formatTimelineTime(selected.start)} → {formatTimelineTime(selected.end)}</span>
                <span>{(selected.end - selected.start).toFixed(3)} s</span>
              </div>

              <label>
                <span>Título / label</span>
                <input value={selected.label} onChange={(event) => patchResource(documentId, baseContent, selected.resourceId, { label: event.target.value })} />
              </label>
              <label>
                <span>Qué debe hacer</span>
                <textarea value={selected.description} onChange={(event) => patchResource(documentId, baseContent, selected.resourceId, { description: event.target.value })} />
              </label>
              <label>
                <span>Texto / guion</span>
                <textarea value={selected.text} onChange={(event) => patchResource(documentId, baseContent, selected.resourceId, { text: event.target.value })} />
              </label>
              <label>
                <span>Prompt editorial</span>
                <textarea value={prompt} onChange={(event) => patchResource(documentId, baseContent, selected.resourceId, { prompt: event.target.value })} />
              </label>

              <button type="button" onClick={() => setRawOpen((value) => !value)}>
                {rawOpen ? 'Ocultar información completa' : 'Ver información completa'}
              </button>

              {rawOpen && (
                <div className="alpha-ficha-raw">
                  {selectedInfo?.allFields.map((field, index) => (
                    <article key={`${field.key}:${index}`}>
                      <small>{field.label}</small>
                      <p>{field.value}</p>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : <p>Esta ruta no tiene recursos temporales.</p>}
        </aside>
      </div>

      <section className="alpha-ficha-timeline">
        <div className="alpha-ficha-section-title">
          <div><small>TIMELINE CANÓNICA</small><strong>Los huecos representan tiempo real; no se compactan.</strong></div>
        </div>
        <CanonicalTimeline
          content={content}
          route={activeRoute}
          selectedResourceId={selected?.resourceId ?? selectedResourceId}
          onSelectResource={onSelectResource}
        />
      </section>
    </section>
  )
}
