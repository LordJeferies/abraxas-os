import { useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { useAppStore } from '../../core/state/useAppStore'
import { diffAlpha, importAlphaFile } from '../../core/alpha/normalizeAlpha'
import {
  applyAlphaEdits,
  getAlphaOverlay,
  useAlphaEditStore,
} from '../../core/alpha/alphaEditStore'
import { useAlphaStore } from '../../core/alpha/useAlphaStore'
import type { AlphaContent, AlphaEnvelope } from '../../core/alpha/types'
import AlphaFichaStudio from './AlphaFichaStudio'
import './alpha-workspace.css'

export default function AlphaWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null)
  const setAppView = useAppStore((state) => state.setView)
  const documents = useAlphaStore((state) => state.documents)
  const activeDocumentId = useAlphaStore((state) => state.activeDocumentId)
  const hydrated = useAlphaStore((state) => state.hydrated)
  const history = useAlphaStore((state) => state.history)
  const route = useAlphaStore((state) => state.route)
  const selectedResourceId = useAlphaStore((state) => state.selectedResourceId)
  const upsertDocument = useAlphaStore((state) => state.upsertDocument)
  const selectDocument = useAlphaStore((state) => state.selectDocument)
  const selectContent = useAlphaStore((state) => state.selectContent)
  const selectResource = useAlphaStore((state) => state.selectResource)
  const setRoute = useAlphaStore((state) => state.setRoute)
  const undoDocument = useAlphaStore((state) => state.undoDocument)
  const overlays = useAlphaEditStore((state) => state.overlays)
  const hydrateEdits = useAlphaEditStore((state) => state.hydrate)

  useEffect(() => { void hydrateEdits() }, [hydrateEdits])

  const [pending, setPending] = useState<AlphaEnvelope | null>(null)
  const [message, setMessage] = useState('READY')
  const [dragging, setDragging] = useState(false)
  const [fichaContentId, setFichaContentId] = useState('')

  const document = useMemo(
    () => documents.find((item) => item.documentId === activeDocumentId) ?? documents[0] ?? null,
    [documents, activeDocumentId],
  )

  const effectiveContents = useMemo(
    () => document
      ? document.contents.map((content) =>
          applyAlphaEdits(content, getAlphaOverlay(overlays, document.documentId, content.contentId))
        )
      : [],
    [document, overlays],
  )

  const diff = useMemo(() => pending ? diffAlpha(document, pending) : null, [document, pending])

  const groups = useMemo(() => ({
    video: effectiveContents.filter((item) => item.contentType === 'video'),
    static: effectiveContents.filter((item) => item.contentType === 'static'),
    other: effectiveContents.filter((item) => item.contentType !== 'video' && item.contentType !== 'static'),
  }), [effectiveContents])

  const fichaBase = fichaContentId && document
    ? document.contents.find((item) => item.contentId === fichaContentId) ?? null
    : null

  const loadFile = async (file: File) => {
    try {
      setMessage('ANALIZANDO ALFA…')
      const next = await importAlphaFile(file)
      setPending(next)
      setMessage(`PREVIEW · ${next.contents.length} fichas · ${next.sourceFamily}`)
    } catch (error) {
      setMessage(`ERROR · ${String(error)}`)
    }
  }

  const applyPending = () => {
    if (!pending) return
    upsertDocument(pending)
    setMessage(`ALFA INTEGRADO · ${pending.contents.length} fichas`)
    setPending(null)
  }

  const openFicha = (item: AlphaContent) => {
    selectContent(item.contentId)
    setFichaContentId(item.contentId)
  }

  const openInEditor = (item: AlphaContent) => {
    selectContent(item.contentId)
    setAppView('editor-spike')
  }

  const drop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) await loadFile(file)
  }

  if (!hydrated) {
    return <div className="alpha-workspace"><section className="alpha-empty"><strong>Restaurando Content Registry…</strong></section></div>
  }

  if (document && fichaBase) {
    return (
      <div className="alpha-workspace alpha-workspace-ficha">
        <AlphaFichaStudio
          documentId={document.documentId}
          baseContent={fichaBase}
          route={route}
          onRouteChange={setRoute}
          selectedResourceId={selectedResourceId}
          onSelectResource={selectResource}
          onBack={() => setFichaContentId('')}
          onEditVideo={() => openInEditor(fichaBase)}
        />
      </div>
    )
  }

  return (
    <div
      className={`alpha-workspace${dragging ? ' dragging' : ''}`}
      onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
      onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false) }}
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
          <span>F1.6 · ALPHA CONTENT REGISTRY</span>
          <h1>Potenciales Alfa</h1>
          <p>Clic en una tarjeta abre Ficha Studio. “Editar video” abre VideoFlow con la Timeline canónica de Abraxas.</p>
        </div>

        <div className="alpha-actions">
          <button className="primary" onClick={() => inputRef.current?.click()}>+ Importar Story Editor</button>
          <select
            value={document?.documentId ?? ''}
            onChange={(event) => selectDocument(event.target.value)}
            disabled={!documents.length}
          >
            {documents.length === 0 && <option value="">Sin colecciones</option>}
            {documents.map((item) => (
              <option value={item.documentId} key={item.documentId}>{item.title} · {item.contents.length}</option>
            ))}
          </select>
          <button
            disabled={!document || !(history[document.documentId]?.length)}
            onClick={undoDocument}
          >
            Deshacer actualización
          </button>
          <span>{message}</span>
        </div>
      </header>

      {dragging && <div className="alpha-drop-overlay"><strong>SUELTA EL ALFA AQUÍ</strong><span>HTML o JSON</span></div>}

      {pending && diff && (
        <section className="alpha-import-preview">
          <div><small>IMPORT PREVIEW</small><strong>{pending.title}</strong><p>{pending.contents.length} fichas · {pending.sourceFamily}</p></div>
          <div className="alpha-diff">
            <b>+{diff.added.length}</b><span>nuevas</span>
            <b>~{diff.changed.length}</b><span>cambios</span>
            <b>={diff.unchanged.length}</b><span>iguales</span>
            <b>-{diff.removed.length}</b><span>retiradas</span>
          </div>
          <div className="alpha-import-buttons">
            {diff.requiresConfirmation && document && <em>Reimportación detectada. Nada se actualiza hasta confirmar.</em>}
            <button className="primary" onClick={applyPending}>Integrar en Abraxas</button>
            <button onClick={() => setPending(null)}>Cancelar</button>
          </div>
        </section>
      )}

      {!document ? (
        <section className="alpha-empty">
          <strong>Importa uno de tus HTML Alfa.</strong>
          <p>Se convertirá en Content Registry persistente, Ficha Studio editable y Timeline canónica.</p>
        </section>
      ) : (
        <section className="alpha-board-shell">
          <div className="alpha-board-title">
            <div><small>{document.sourceFamily} · PERSISTIDO EN ABRAXAS</small><h2>{document.title}</h2></div>
            <div className="alpha-board-summary"><span>{document.contents.length} fichas</span></div>
          </div>

          <div className="alpha-board">
            <Column label="VIDEO" items={groups.video} onFicha={openFicha} onEdit={openInEditor} />
            <Column label="STATIC / CARRUSEL" items={groups.static} onFicha={openFicha} onEdit={openInEditor} />
            <Column label="OTROS" items={groups.other} onFicha={openFicha} onEdit={openInEditor} />
          </div>
        </section>
      )}
    </div>
  )
}

function Column({
  label,
  items,
  onFicha,
  onEdit,
}: {
  label: string
  items: AlphaContent[]
  onFicha: (item: AlphaContent) => void
  onEdit: (item: AlphaContent) => void
}) {
  return (
    <div className="alpha-column">
      <header><strong>{label}</strong><span>{items.length}</span></header>
      {items.map((item) => (
        <article className="alpha-card" key={item.contentId}>
          <button className="alpha-card-main" onClick={() => onFicha(item)}>
            <small>{item.orientation} · {item.status}</small>
            <strong>{item.title}</strong>
            <p>{item.thesis || item.objective || 'Abrir ficha completa'}</p>
          </button>
          <footer>
            <span>{item.timelineDirectives.length} objetos</span>
            <button onClick={() => onFicha(item)}>Ficha</button>
            {item.contentType === 'video' && <button onClick={() => onEdit(item)}>Editar video →</button>}
          </footer>
        </article>
      ))}
      {!items.length && <div className="alpha-column-empty">Sin piezas</div>}
    </div>
  )
}
