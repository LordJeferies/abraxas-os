import { useMemo } from 'react'
import type {
  GhostInspectorData,
  GhostInfoField,
} from '../../core/alpha/alphaEditorDirectives'
import './ghost-inspector.css'

function formatTime(value: number) {
  const minutes = Math.floor(value / 60)
  const seconds = value - minutes * 60
  return `${String(minutes).padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    // Clipboard availability never blocks the inspector.
  }
}

function Fields({
  title,
  fields,
}: {
  title: string
  fields: GhostInfoField[]
}) {
  if (fields.length === 0) return null

  return (
    <section className="ghost-info-section">
      <h4>{title}</h4>

      {fields.map((field, index) => (
        <article className="ghost-info-field" key={`${field.key}:${index}`}>
          <div>
            <small>{field.label}</small>
            <button type="button" onClick={() => void copyText(field.value)}>
              Copiar
            </button>
          </div>
          <p>{field.value}</p>
        </article>
      ))}
    </section>
  )
}

export default function GhostInspectorPanel({
  ghost,
  compact = false,
}: {
  ghost: GhostInspectorData | null
  compact?: boolean
}) {
  const visibleAll = useMemo(
    () =>
      ghost
        ? ghost.allFields
            .filter(
              (field) =>
                !ghost.promptFields.some((item) => item.key === field.key)
                && !ghost.referenceFields.some((item) => item.key === field.key)
                && !ghost.actionFields.some((item) => item.key === field.key)
            )
            .slice(0, compact ? 10 : 40)
        : [],
    [ghost, compact],
  )

  if (!ghost) {
    return (
      <section className="ghost-inspector ghost-empty">
        <strong>Ghost Info</strong>
        <p>Selecciona un Ghost en la timeline.</p>
      </section>
    )
  }

  return (
    <section className="ghost-inspector">
      <header>
        <div>
          <small>{ghost.track.toUpperCase()} · {ghost.state}</small>
          <h3>{ghost.label}</h3>
        </div>
        <span>{formatTime(ghost.start)} → {formatTime(ghost.end)}</span>
      </header>

      <section className="ghost-summary">
        {ghost.description && <p>{ghost.description}</p>}
        {ghost.text && <blockquote>{ghost.text}</blockquote>}

        <dl>
          <dt>resourceId</dt>
          <dd>{ghost.resourceId}</dd>
          <dt>tipo</dt>
          <dd>{ghost.type}</dd>

          {ghost.speaker && (
            <>
              <dt>speaker</dt>
              <dd>{ghost.speaker}</dd>
            </>
          )}

          {ghost.parentResourceId && (
            <>
              <dt>parent</dt>
              <dd>{ghost.parentResourceId}</dd>
            </>
          )}
        </dl>
      </section>

      <Fields title="PROMPTS / GENERACIÓN" fields={ghost.promptFields} />
      <Fields title="REFERENCIAS / ASSETS" fields={ghost.referenceFields} />
      <Fields title="QUÉ HACER" fields={ghost.actionFields} />
      <Fields title="INFORMACIÓN EXTRA" fields={visibleAll} />

      <section className="ghost-materialize-slot">
        <small>MATERIALIZACIÓN</small>
        <strong>Mismo Group · mismo resourceId</strong>
        <p>
          Aquí se conectarán imágenes, video, audio, captions y otros assets
          sin sustituir el Group Ghost.
        </p>
      </section>
    </section>
  )
}
