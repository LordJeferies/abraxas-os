import {
  useMemo,
  useRef,
  useState,
} from 'react'
import type { DragEvent } from 'react'
import { useAppStore } from '../../core/state/useAppStore'
import {
  diffAlpha,
  importAlphaFile,
} from '../../core/alpha/normalizeAlpha'
import { useAlphaStore } from '../../core/alpha/useAlphaStore'
import type {
  AlphaContent,
  AlphaEnvelope,
} from '../../core/alpha/types'
import './alpha-workspace.css'

export default function AlphaWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null)

  const setAppView = useAppStore((state) => state.setView)

  const documents = useAlphaStore((state) => state.documents)
  const activeDocumentId = useAlphaStore(
    (state) => state.activeDocumentId
  )
  const hydrated = useAlphaStore((state) => state.hydrated)
  const history = useAlphaStore((state) => state.history)
  const upsertDocument = useAlphaStore(
    (state) => state.upsertDocument
  )
  const selectDocument = useAlphaStore(
    (state) => state.selectDocument
  )
  const selectContent = useAlphaStore(
    (state) => state.selectContent
  )
  const undoDocument = useAlphaStore(
    (state) => state.undoDocument
  )

  const [pending, setPending] =
    useState<AlphaEnvelope | null>(null)

  const [message, setMessage] = useState('READY')
  const [dragging, setDragging] = useState(false)

  const document = useMemo(
    () =>
      documents.find(
        (item) => item.documentId === activeDocumentId
      )
      ?? documents[0]
      ?? null,
    [documents, activeDocumentId]
  )

  const diff = useMemo(
    () => pending ? diffAlpha(document, pending) : null,
    [document, pending]
  )

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

    upsertDocument(pending)

    setMessage(
      `ALFA INTEGRADO · ${pending.contents.length} fichas`
    )
    setPending(null)
  }

  const openInEditor = (item: AlphaContent) => {
    selectContent(item.contentId)
    setAppView('editor-spike')
  }

  const drop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)

    const file = event.dataTransfer.files[0]

    if (file) {
      await loadFile(file)
    }
  }

  if (!hydrated) {
    return (
      <div className="alpha-workspace">
        <section className="alpha-empty">
          <strong>Restaurando Content Registry…</strong>
        </section>
      </div>
    )
  }

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
          <span>F1.6 · ALPHA CONTENT REGISTRY</span>
          <h1>Potenciales Alfa</h1>
          <p>
            Importar aquí registra el Alfa para toda la app.
            Editor y futuros módulos consumen el mismo Content Registry.
          </p>
        </div>

        <div className="alpha-actions">
          <button
            className="primary"
            onClick={() => inputRef.current?.click()}
          >
            + Importar Story Editor
          </button>

          <select
            value={document?.documentId ?? ''}
            onChange={(event) =>
              selectDocument(event.target.value)
            }
            disabled={!documents.length}
          >
            {documents.length === 0 && (
              <option value="">Sin colecciones</option>
            )}

            {documents.map((item) => (
              <option
                value={item.documentId}
                key={item.documentId}
              >
                {item.title} · {item.contents.length}
              </option>
            ))}
          </select>

          <button
            disabled={
              !document
              || !(history[document.documentId]?.length)
            }
            onClick={undoDocument}
          >
            Deshacer actualización
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
              Integrar en Abraxas
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
            La información dejará de vivir sólo en este visor:
            se registrará como Content Registry persistente y
            podrá abrirse directamente en el Editor.
          </p>
        </section>
      ) : (
        <section className="alpha-board-shell">
          <div className="alpha-board-title">
            <div>
              <small>
                {document.sourceFamily}
                {' · '}
                PERSISTIDO EN ABRAXAS
              </small>
              <h2>{document.title}</h2>
            </div>

            <div className="alpha-board-summary">
              <span>{document.contents.length} fichas</span>
              <button
                disabled={!document.contents.length}
                onClick={() => {
                  const first = document.contents[0]
                  if (first) openInEditor(first)
                }}
              >
                Abrir Editor →
              </button>
            </div>
          </div>

          <div className="alpha-board">
            <Column
              label="VIDEO"
              items={groups.video}
              onOpen={openInEditor}
            />
            <Column
              label="STATIC / CARRUSEL"
              items={groups.static}
              onOpen={openInEditor}
            />
            <Column
              label="OTROS"
              items={groups.other}
              onOpen={openInEditor}
            />
          </div>
        </section>
      )}
    </div>
  )
}

function Column({
  label,
  items,
  onOpen,
}: {
  label: string
  items: AlphaContent[]
  onOpen: (item: AlphaContent) => void
}) {
  return (
    <div className="alpha-column">
      <header>
        <strong>{label}</strong>
        <span>{items.length}</span>
      </header>

      {items.map((item) => (
        <article className="alpha-card" key={item.contentId}>
          <button
            className="alpha-card-main"
            onClick={() => onOpen(item)}
          >
            <small>
              {item.orientation} · {item.status}
            </small>
            <strong>{item.title}</strong>
            <p>{item.thesis || item.objective}</p>
          </button>

          <footer>
            <span>
              {item.timelineDirectives.length}
              {' '}timeline objects
            </span>
            <span>
              {item.staticGraph?.slides.length ?? 0}
              {' '}slides
            </span>
            <button onClick={() => onOpen(item)}>
              Editar →
            </button>
          </footer>
        </article>
      ))}

      {!items.length && (
        <div className="alpha-column-empty">
          Sin piezas
        </div>
      )}
    </div>
  )
}
