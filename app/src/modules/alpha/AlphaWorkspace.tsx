import {
  useMemo,
  useRef,
  useState,
} from 'react'
import type {
  DragEvent,
} from 'react'
import {
  diffAlpha,
  importAlphaFile,
} from '../../core/alpha/normalizeAlpha'
import type {
  AlphaContent,
  AlphaDirective,
  AlphaEnvelope,
  AlphaTrack,
} from '../../core/alpha/types'
import './alpha-workspace.css'

const TRACKS: Array<{
  id: AlphaTrack
  label: string
}> = [
  { id: 'story', label: 'STORY' },
  { id: 'aroll', label: 'A-ROLL' },
  { id: 'vo', label: 'VOICE OVER' },
  { id: 'captions', label: 'CAPTIONS' },
  { id: 'xr', label: 'XR' },
  { id: 'broll', label: 'B-ROLL' },
  { id: 'motion', label: 'MOTION' },
  { id: 'transition', label: 'TRANSITION' },
  { id: 'sfx', label: 'SFX' },
  { id: 'music', label: 'MUSIC' },
]

const ACTIVE_ORDER = [
  'captions',
  'xr',
  'motion',
  'sfx',
  'aroll',
  'vo',
  'story',
  'transition',
  'music',
  'broll',
]

function sec(value: number) {
  const total = Number.isFinite(value) ? Math.max(0, value) : 0
  const minutes = Math.floor(total / 60)
  const seconds = Math.floor(total % 60)
  const ms = Math.floor((total % 1) * 1000)

  return (
    `${String(minutes).padStart(2, '0')}:`
    + `${String(seconds).padStart(2, '0')}.`
    + `${String(ms).padStart(3, '0')}`
  )
}

function pct(value: number, duration: number) {
  return duration > 0
    ? Math.max(0, Math.min(100, value / duration * 100))
    : 0
}

function routeMatch(item: AlphaDirective, route: string) {
  return (
    route === 'all'
    || item.routes.length === 0
    || item.routes.includes(route)
  )
}

function spokenAt(
  content: AlphaContent,
  playhead: number,
  route: string,
) {
  const rank = (track: AlphaTrack) =>
    track === 'aroll'
      ? 0
      : track === 'vo'
      ? 1
      : 2

  return content.timelineDirectives
    .filter(
      (item) =>
        routeMatch(item, route)
        && item.start <= playhead
        && item.end >= playhead
        && ['aroll', 'vo', 'story'].includes(item.track)
        && item.text
    )
    .sort((a, b) => rank(a.track) - rank(b.track))[0]
}

export default function AlphaWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null)

  const [document, setDocument] =
    useState<AlphaEnvelope | null>(null)

  const [pending, setPending] =
    useState<AlphaEnvelope | null>(null)

  const [history, setHistory] =
    useState<AlphaEnvelope[]>([])

  const [selectedContentId, setSelectedContentId] =
    useState('')

  const [selectedResourceId, setSelectedResourceId] =
    useState('')

  const [route, setRoute] = useState('all')
  const [playhead, setPlayhead] = useState(0)
  const [view, setView] =
    useState<'board' | 'editor'>('board')

  const [timelineMode, setTimelineMode] =
    useState<'temporal' | 'semantic'>('temporal')

  const [message, setMessage] = useState('READY')
  const [dragging, setDragging] = useState(false)

  const content = useMemo(
    () =>
      document?.contents.find(
        (item) => item.contentId === selectedContentId
      )
      ?? document?.contents[0]
      ?? null,
    [document, selectedContentId]
  )

  const diff = useMemo(
    () => pending ? diffAlpha(document, pending) : null,
    [document, pending]
  )

  const filtered = useMemo(
    () =>
      content?.timelineDirectives.filter(
        (item) => routeMatch(item, route)
      )
      ?? [],
    [content, route]
  )

  const selected = useMemo(
    () =>
      filtered.find(
        (item) => item.resourceId === selectedResourceId
      )
      ?? null,
    [filtered, selectedResourceId]
  )

  const active = useMemo(
    () =>
      filtered
        .filter(
          (item) =>
            item.start <= playhead
            && item.end >= playhead
            && item.groupRole !== 'parent'
        )
        .sort(
          (a, b) =>
            ACTIVE_ORDER.indexOf(a.track)
            - ACTIVE_ORDER.indexOf(b.track)
        ),
    [filtered, playhead]
  )

  const spoken = useMemo(
    () =>
      content
        ? spokenAt(content, playhead, route)
        : undefined,
    [content, playhead, route]
  )

  const loadFile = async (file: File) => {
    try {
      setMessage('ANALIZANDO ALFA…')
      const next = await importAlphaFile(file)
      setPending(next)
      setMessage(
        `PREVIEW · ${next.contents.length} fichas · ${next.sourceFamily}`
      )
    } catch (error) {
      setMessage(`ERROR · ${String(error)}`)
    }
  }

  const applyPending = () => {
    if (!pending) return

    if (document) {
      setHistory((items) =>
        [document, ...items].slice(0, 2)
      )
    }

    setDocument(pending)
    setSelectedContentId(
      pending.contents[0]?.contentId ?? ''
    )
    setSelectedResourceId('')
    setPlayhead(0)
    setRoute('all')
    setView('board')
    setMessage(
      `ALFA CARGADO · ${pending.contents.length} fichas`
    )
    setPending(null)
  }

  const undoImport = () => {
    const previous = history[0]
    if (!previous) return

    if (document) {
      setHistory((items) =>
        [document, ...items.slice(1)].slice(0, 2)
      )
    }

    setDocument(previous)
    setSelectedContentId(
      previous.contents[0]?.contentId ?? ''
    )
    setSelectedResourceId('')
    setPlayhead(0)
    setView('board')
    setMessage('UNDO · importación anterior restaurada')
  }

  const drop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]

    if (file) {
      await loadFile(file)
    }
  }

  const openContent = (item: AlphaContent) => {
    setSelectedContentId(item.contentId)
    setSelectedResourceId('')
    setPlayhead(0)
    setRoute(
      item.routes.includes('source')
        ? 'source'
        : item.routes[0] ?? 'all'
    )
    setView('editor')
  }

  const groups = useMemo(() => {
    const items = document?.contents ?? []

    return {
      video: items.filter(
        (item) => item.contentType === 'video'
      ),
      static: items.filter(
        (item) => item.contentType === 'static'
      ),
      other: items.filter(
        (item) =>
          item.contentType !== 'video'
          && item.contentType !== 'static'
      ),
    }
  }, [document])

  return (
    <div
      className={`alpha-workspace ${dragging ? 'dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) {
          setDragging(false)
        }
      }}
      onDrop={drop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".html,.htm,.json,text/html,application/json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void loadFile(file)
          event.currentTarget.value = ''
        }}
      />

      <header className="alpha-header">
        <div>
          <span>F1.6 · ALPHA INGESTION</span>
          <h1>Potenciales Alfa</h1>
          <p>
            Arrastra un HTML/JSON o selecciónalo.
            No hace falta tener el video master.
          </p>
        </div>

        <div className="alpha-actions">
          <button
            className="primary"
            onClick={() => inputRef.current?.click()}
          >
            + Importar Story Editor
          </button>

          <button
            disabled={!history.length}
            onClick={undoImport}
          >
            Deshacer import
          </button>

          <span>{message}</span>
        </div>
      </header>

      {dragging && (
        <div className="alpha-drop-overlay">
          <strong>SUELTA EL ALFA AQUÍ</strong>
          <span>HTML o JSON</span>
        </div>
      )}

      {pending && diff && (
        <section className="alpha-import-preview">
          <div>
            <small>IMPORT PREVIEW</small>
            <strong>{pending.title}</strong>
            <p>
              {pending.contents.length} fichas ·{' '}
              {pending.sourceFamily}
            </p>
          </div>

          <div className="alpha-diff">
            <b>+{diff.added.length}</b><span>nuevas</span>
            <b>~{diff.changed.length}</b><span>cambios</span>
            <b>={diff.unchanged.length}</b><span>iguales</span>
            <b>-{diff.removed.length}</b><span>retiradas</span>
          </div>

          <div className="alpha-import-buttons">
            {diff.requiresConfirmation && document && (
              <em>
                Reimportación detectada. Nada se actualiza
                hasta que confirmes.
              </em>
            )}

            <button
              className="primary"
              onClick={applyPending}
            >
              Aplicar y cargar
            </button>

            <button onClick={() => setPending(null)}>
              Cancelar
            </button>
          </div>
        </section>
      )}

      {!document ? (
        <section className="alpha-empty">
          <strong>Importa uno de tus HTML Alfa.</strong>
          <p>
            Abraxas extraerá el JSON embebido, generará fichas
            y reconstruirá la timeline semántica con sus Ghosts.
          </p>
        </section>
      ) : view === 'board' ? (
        <Board
          document={document}
          groups={groups}
          onOpen={openContent}
        />
      ) : content ? (
        <Editor
          document={document}
          content={content}
          route={route}
          setRoute={setRoute}
          playhead={playhead}
          setPlayhead={setPlayhead}
          selected={selected}
          selectedResourceId={selectedResourceId}
          setSelectedResourceId={setSelectedResourceId}
          active={active}
          spoken={spoken}
          filtered={filtered}
          timelineMode={timelineMode}
          setTimelineMode={setTimelineMode}
          onBack={() => setView('board')}
          onOpen={openContent}
        />
      ) : null}
    </div>
  )
}

function Board({
  document,
  groups,
  onOpen,
}: {
  document: AlphaEnvelope
  groups: {
    video: AlphaContent[]
    static: AlphaContent[]
    other: AlphaContent[]
  }
  onOpen: (item: AlphaContent) => void
}) {
  return (
    <section className="alpha-board-shell">
      <div className="alpha-board-title">
        <div>
          <small>{document.sourceFamily}</small>
          <h2>{document.title}</h2>
        </div>
        <span>{document.contents.length} fichas</span>
      </div>

      <div className="alpha-board">
        {([
          ['video', 'VIDEO'],
          ['static', 'STATIC / CARRUSEL'],
          ['other', 'OTROS'],
        ] as const).map(([key, label]) => (
          <div className="alpha-column" key={key}>
            <header>
              <strong>{label}</strong>
              <span>{groups[key].length}</span>
            </header>

            {groups[key].map((item) => (
              <button
                className="alpha-card"
                key={item.contentId}
                onClick={() => onOpen(item)}
              >
                <small>
                  {item.orientation} · {item.status}
                </small>
                <strong>{item.title}</strong>
                <p>{item.thesis || item.objective}</p>
                <footer>
                  <span>
                    {item.timelineDirectives.length}
                    {' '}timeline objects
                  </span>
                  <span>
                    {item.staticGraph?.slides.length ?? 0}
                    {' '}slides
                  </span>
                </footer>
              </button>
            ))}

            {!groups[key].length && (
              <div className="alpha-column-empty">
                Sin piezas
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function Editor({
  document,
  content,
  route,
  setRoute,
  playhead,
  setPlayhead,
  selected,
  selectedResourceId,
  setSelectedResourceId,
  active,
  spoken,
  filtered,
  timelineMode,
  setTimelineMode,
  onBack,
  onOpen,
}: {
  document: AlphaEnvelope
  content: AlphaContent
  route: string
  setRoute: (value: string) => void
  playhead: number
  setPlayhead: (value: number) => void
  selected: AlphaDirective | null
  selectedResourceId: string
  setSelectedResourceId: (value: string) => void
  active: AlphaDirective[]
  spoken?: AlphaDirective
  filtered: AlphaDirective[]
  timelineMode: 'temporal' | 'semantic'
  setTimelineMode: (value: 'temporal' | 'semantic') => void
  onBack: () => void
  onOpen: (item: AlphaContent) => void
}) {
  const duration = Math.max(1, content.durationSeconds || 1)

  const tracks = TRACKS.map((track) => ({
    ...track,
    items: filtered.filter(
      (item) => item.track === track.id
    ),
  }))

  return (
    <section className="alpha-editor">
      <aside className="alpha-piece-list">
        <button className="back" onClick={onBack}>
          ← Kanban
        </button>
        <strong>Fichas</strong>

        {document.contents.map((item) => (
          <button
            className={
              item.contentId === content.contentId
                ? 'active'
                : ''
            }
            key={item.contentId}
            onClick={() => onOpen(item)}
          >
            <small>{item.orientation}</small>
            <span>{item.title}</span>
          </button>
        ))}
      </aside>

      <main className="alpha-editor-main">
        <header className="alpha-piece-head">
          <div>
            <small>
              {content.contentType}
              {' · '}
              {content.orientation}
              {' · '}
              {content.revisionId}
            </small>
            <h2>{content.title}</h2>
            <p>{content.thesis || content.objective}</p>
          </div>

          <div className="alpha-route-tools">
            {content.routes.length > 1 && (
              <select
                value={route}
                onChange={(event) => {
                  setRoute(event.target.value)
                  setSelectedResourceId('')
                  setPlayhead(0)
                }}
              >
                {content.routes.map((item) => (
                  <option key={item} value={item}>
                    Ruta · {item}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() =>
                setTimelineMode(
                  timelineMode === 'temporal'
                    ? 'semantic'
                    : 'temporal'
                )
              }
            >
              {timelineMode === 'temporal'
                ? 'Vista semántica'
                : 'Vista temporal'}
            </button>
          </div>
        </header>

        {content.contentType === 'static' ? (
          <StaticViewer content={content} />
        ) : (
          <>
            <div className="alpha-upper">
              <Viewer
                content={content}
                playhead={playhead}
                spoken={spoken}
                selected={selected}
                active={active}
                onDeselect={() =>
                  setSelectedResourceId('')
                }
              />

              <Inspector
                content={content}
                selected={selected}
                active={active}
              />
            </div>

            {timelineMode === 'temporal' ? (
              <TemporalTimeline
                duration={duration}
                playhead={playhead}
                setPlayhead={(value) => {
                  setPlayhead(value)
                  setSelectedResourceId('')
                }}
                tracks={tracks}
                selectedResourceId={selectedResourceId}
                onSelect={(item) => {
                  setSelectedResourceId(item.resourceId)
                  setPlayhead(item.start)
                }}
              />
            ) : (
              <SemanticTimeline
                tracks={tracks}
                selectedResourceId={selectedResourceId}
                onSelect={(item) => {
                  setSelectedResourceId(item.resourceId)
                  setPlayhead(item.start)
                }}
              />
            )}
          </>
        )}
      </main>
    </section>
  )
}

function Viewer({
  content,
  playhead,
  spoken,
  selected,
  active,
  onDeselect,
}: {
  content: AlphaContent
  playhead: number
  spoken?: AlphaDirective
  selected: AlphaDirective | null
  active: AlphaDirective[]
  onDeselect: () => void
}) {
  const shown = selected ? [selected] : active

  return (
    <section className="alpha-viewer">
      <header>
        <span>VISOR · {sec(playhead)}</span>
        {selected && (
          <button onClick={onDeselect}>
            Volver al momento
          </button>
        )}
      </header>

      <div className="alpha-screen">
        <small>ALPHA PREVIEW · SIN MASTER</small>

        {spoken?.text ? (
          <>
            <em>{spoken.speaker || spoken.label}</em>
            <blockquote>{spoken.text}</blockquote>
          </>
        ) : (
          <blockquote>
            {content.thesis || content.objective || content.title}
          </blockquote>
        )}

        <div className="alpha-overlay-list">
          {shown.map((item) => (
            <article
              key={item.resourceId}
              className={`alpha-overlay-card ${item.state}`}
            >
              <b>{item.track}</b>
              <strong>{item.label}</strong>

              {item.text && item !== spoken && (
                <p>{item.text}</p>
              )}

              {item.description && (
                <p>{item.description}</p>
              )}

              <small>
                {sec(item.start)} → {sec(item.end)}
              </small>
            </article>
          ))}

          {!shown.length && (
            <p className="alpha-no-overlay">
              No hay objetos activos en este punto.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function Inspector({
  content,
  selected,
  active,
}: {
  content: AlphaContent
  selected: AlphaDirective | null
  active: AlphaDirective[]
}) {
  const target = selected ?? active[0] ?? null

  return (
    <section className="alpha-inspector">
      <header>
        <span>INSPECTOR</span>
        <b>{target?.label ?? 'Ficha Alfa'}</b>
      </header>

      {target ? (
        <div className="alpha-inspector-body">
          <dl>
            <dt>Tipo</dt><dd>{target.type}</dd>
            <dt>Estado</dt><dd>{target.state}</dd>
            <dt>Track</dt><dd>{target.track}</dd>
            <dt>Tiempo</dt>
            <dd>
              {sec(target.start)} → {sec(target.end)}
            </dd>
          </dl>

          {target.description && (
            <section>
              <small>QUÉ VA AQUÍ</small>
              <p>{target.description}</p>
            </section>
          )}

          {target.text && (
            <section>
              <small>TEXTO</small>
              <p>{target.text}</p>
            </section>
          )}

          {target.sourceRange && (
            <section>
              <small>RANGO FUENTE</small>
              <p>
                {String(target.sourceRange.start ?? '—')}
                {' → '}
                {String(target.sourceRange.end ?? '—')}
              </p>
            </section>
          )}

          <details>
            <summary>Información Alfa original</summary>
            <pre>
              {JSON.stringify(target.parameters, null, 2)}
            </pre>
          </details>
        </div>
      ) : (
        <div className="alpha-inspector-body">
          <section>
            <small>TESIS</small>
            <p>{content.thesis || '—'}</p>
          </section>
          <section>
            <small>OBJETIVO</small>
            <p>{content.objective || '—'}</p>
          </section>
        </div>
      )}
    </section>
  )
}

function TemporalTimeline({
  duration,
  playhead,
  setPlayhead,
  tracks,
  selectedResourceId,
  onSelect,
}: {
  duration: number
  playhead: number
  setPlayhead: (value: number) => void
  tracks: Array<{
    id: AlphaTrack
    label: string
    items: AlphaDirective[]
  }>
  selectedResourceId: string
  onSelect: (item: AlphaDirective) => void
}) {
  return (
    <section className="alpha-timeline">
      <div className="alpha-transport">
        <span>TIMELINE</span>
        <input
          type="range"
          min="0"
          max={duration}
          step="0.01"
          value={playhead}
          onChange={(event) =>
            setPlayhead(Number(event.target.value))
          }
        />
        <time>{sec(playhead)}</time>
        <small>{sec(duration)}</small>
      </div>

      <div className="alpha-tracks">
        {tracks.map((track) => (
          <div className="alpha-track" key={track.id}>
            <strong>{track.label}</strong>

            <div
              className="alpha-lane"
              onClick={(event) => {
                if (event.target !== event.currentTarget) return

                const rect =
                  event.currentTarget.getBoundingClientRect()

                const ratio = Math.max(
                  0,
                  Math.min(
                    1,
                    (event.clientX - rect.left) / rect.width
                  )
                )

                setPlayhead(ratio * duration)
              }}
            >
              <i
                className="alpha-playhead"
                style={{
                  left: `${pct(playhead, duration)}%`,
                }}
              />

              {track.items.map((item) => {
                const left = pct(item.start, duration)
                const width = Math.max(
                  item.track === 'sfx' ? 0.6 : 0.8,
                  pct(item.end - item.start, duration)
                )

                return (
                  <button
                    key={item.resourceId}
                    className={[
                      'alpha-block',
                      item.state,
                      item.groupRole
                        ? `group-${item.groupRole}`
                        : '',
                      selectedResourceId === item.resourceId
                        ? 'selected'
                        : '',
                    ].join(' ')}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                    }}
                    onClick={(event) => {
                      event.stopPropagation()
                      onSelect(item)
                    }}
                    title={`${item.label} · ${item.state}`}
                  >
                    <span>
                      {item.track === 'sfx'
                        ? '●'
                        : item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function SemanticTimeline({
  tracks,
  selectedResourceId,
  onSelect,
}: {
  tracks: Array<{
    id: AlphaTrack
    label: string
    items: AlphaDirective[]
  }>
  selectedResourceId: string
  onSelect: (item: AlphaDirective) => void
}) {
  return (
    <section className="alpha-semantic">
      <header>SEMANTIC TIMELINE</header>

      {tracks
        .filter((track) => track.items.length)
        .map((track) => (
          <article key={track.id}>
            <strong>{track.label}</strong>
            <div>
              {track.items.map((item) => (
                <button
                  className={
                    selectedResourceId === item.resourceId
                      ? 'selected'
                      : ''
                  }
                  key={item.resourceId}
                  onClick={() => onSelect(item)}
                >
                  <small>{item.state}</small>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </article>
        ))}
    </section>
  )
}

function StaticViewer({
  content,
}: {
  content: AlphaContent
}) {
  const slides = content.staticGraph?.slides ?? []

  return (
    <section className="alpha-static">
      <header>
        <div>
          <small>STATIC VISUAL GRAPH</small>
          <h3>{slides.length} slides</h3>
        </div>
        <p>
          Carruseles no usan una timeline audiovisual hasta que
          una slide se convierta explícitamente en animación.
        </p>
      </header>

      <div className="alpha-slides">
        {slides.map((slide) => (
          <article
            className={slide.state}
            key={slide.slideId}
          >
            <small>
              SLIDE {slide.index} · {slide.state}
            </small>
            <strong>
              {slide.role || `Slide ${slide.index}`}
            </strong>

            {slide.text && (
              <p className="main">{slide.text}</p>
            )}

            {slide.visual && (
              <section>
                <b>Visual</b>
                <p>{slide.visual}</p>
              </section>
            )}

            {slide.composition && (
              <section>
                <b>Composición</b>
                <p>{slide.composition}</p>
              </section>
            )}

            {slide.prompt && (
              <details>
                <summary>Prompt</summary>
                <p>{slide.prompt}</p>
              </details>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
