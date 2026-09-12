import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { VideoJSON } from '@videoflow/core'
import {
  VideoEditor,
} from '@videoflow/react-video-editor'
import '@videoflow/react-video-editor/style.css'
import {
  projectAlphaToVideoFlow,
} from '../../core/alpha/videoFlowProjection'
import {
  deleteVideoFlowDraft,
  loadVideoFlowDraft,
  saveVideoFlowDraft,
  type AlphaVideoFlowDraft,
} from '../../core/alpha/videoFlowDraftStore'
import {
  useAlphaStore,
} from '../../core/alpha/useAlphaStore'
import {
  useAppStore,
} from '../../core/state/useAppStore'
import './alpha-videoflow-editor.css'

export default function AlphaVideoFlowEditor() {
  const setAppView = useAppStore((state) => state.setView)

  const documents = useAlphaStore((state) => state.documents)
  const activeDocumentId = useAlphaStore(
    (state) => state.activeDocumentId,
  )
  const selectedContentId = useAlphaStore(
    (state) => state.selectedContentId,
  )
  const selectContent = useAlphaStore(
    (state) => state.selectContent,
  )

  const document = useMemo(
    () =>
      documents.find(
        (item) => item.documentId === activeDocumentId,
      )
      ?? documents[0]
      ?? null,
    [documents, activeDocumentId],
  )

  const content = useMemo(
    () =>
      document?.contents.find(
        (item) => item.contentId === selectedContentId,
      )
      ?? document?.contents[0]
      ?? null,
    [document, selectedContentId],
  )

  const [initialVideo, setInitialVideo] =
    useState<VideoJSON | null>(null)

  const [projectedCount, setProjectedCount] =
    useState(0)

  const [ghostCount, setGhostCount] =
    useState(0)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  const [projectionVersion, setProjectionVersion] =
    useState(0)

  const latestVideoRef =
    useRef<VideoJSON | null>(null)

  const latestMapsRef = useRef<{
    resourceToLayer: Record<string, string>
    layerToResource: Record<string, string>
  }>({
    resourceToLayer: {},
    layerToResource: {},
  })

  const autosaveTimer =
    useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!content) {
      setInitialVideo(null)
      latestVideoRef.current = null
      return
    }

    setLoading(true)
    setError('')
    setInitialVideo(null)

    const load = async () => {
      try {
        let draft: AlphaVideoFlowDraft | null = null

        if (projectionVersion === 0) {
          draft = await loadVideoFlowDraft(
            content.contentId,
          )
        }

        if (
          draft
          && draft.revisionId === content.revisionId
        ) {
          if (cancelled) {
            return
          }

          latestVideoRef.current = draft.video
          latestMapsRef.current = {
            resourceToLayer: draft.resourceToLayer,
            layerToResource: draft.layerToResource,
          }

          setProjectedCount(
            Object.keys(draft.resourceToLayer).length,
          )

          setGhostCount(
            content.timelineDirectives.filter(
              (item) => item.state === 'ghost',
            ).length,
          )

          setInitialVideo(draft.video)
          return
        }

        const projection =
          await projectAlphaToVideoFlow(content)

        if (cancelled) {
          return
        }

        latestVideoRef.current = projection.video
        latestMapsRef.current = {
          resourceToLayer: projection.resourceToLayer,
          layerToResource: projection.layerToResource,
        }

        setProjectedCount(
          projection.projectedResourceCount,
        )
        setGhostCount(
          projection.ghostCount,
        )
        setInitialVideo(
          projection.video,
        )

        await saveVideoFlowDraft({
          schemaVersion: 'abraxas.videoflow-draft.v1',
          contentId: content.contentId,
          revisionId: content.revisionId,
          video: projection.video,
          resourceToLayer: projection.resourceToLayer,
          layerToResource: projection.layerToResource,
          updatedAt: new Date().toISOString(),
        })
      } catch (cause) {
        if (cancelled) {
          return
        }

        setError(
          cause instanceof Error
            ? cause.message
            : String(cause),
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true

      if (autosaveTimer.current !== null) {
        window.clearTimeout(autosaveTimer.current)
        autosaveTimer.current = null
      }

      const latest = latestVideoRef.current

      if (latest) {
        void saveVideoFlowDraft({
          schemaVersion: 'abraxas.videoflow-draft.v1',
          contentId: content.contentId,
          revisionId: content.revisionId,
          video: latest,
          resourceToLayer: latestMapsRef.current.resourceToLayer,
          layerToResource: latestMapsRef.current.layerToResource,
          updatedAt: new Date().toISOString(),
        })
      }
    }
  }, [
    content?.contentId,
    content?.revisionId,
    projectionVersion,
  ])

  if (!document || !content) {
    return (
      <section className="alpha-vf-empty">
        <strong>No hay Alfa seleccionado.</strong>
        <p>
          Importa una colección en F1.6 · Alpha.
        </p>
        <button onClick={() => setAppView('alpha')}>
          Ir a Potenciales Alfa
        </button>
      </section>
    )
  }

  if (content.contentType === 'static') {
    return (
      <section className="alpha-vf-empty">
        <strong>Esta ficha es estática.</strong>
        <p>
          El carrusel conserva su Static Visual Graph hasta
          activar una versión animada.
        </p>
        <button onClick={() => setAppView('alpha')}>
          Volver a Potenciales
        </button>
      </section>
    )
  }

  const handleChange = (video: VideoJSON) => {
    latestVideoRef.current = video

    if (autosaveTimer.current !== null) {
      window.clearTimeout(autosaveTimer.current)
    }

    autosaveTimer.current = window.setTimeout(
      () => {
        autosaveTimer.current = null

        void saveVideoFlowDraft({
          schemaVersion: 'abraxas.videoflow-draft.v1',
          contentId: content.contentId,
          revisionId: content.revisionId,
          video,
          resourceToLayer: latestMapsRef.current.resourceToLayer,
          layerToResource: latestMapsRef.current.layerToResource,
          updatedAt: new Date().toISOString(),
        })
      },
      300,
    )
  }

  return (
    <section className="alpha-videoflow-editor">
      <header className="alpha-vf-toolbar">
        <button onClick={() => setAppView('alpha')}>
          ← Potenciales
        </button>

        <div className="alpha-vf-title">
          <small>PRODUCTION GRAPH → VIDEOFLOW</small>
          <strong>{content.title}</strong>
          <span>
            {ghostCount} Ghosts · {projectedCount} recursos proyectados
          </span>
        </div>

        <select
          value={content.contentId}
          onChange={(event) =>
            selectContent(event.target.value)
          }
        >
          {document.contents
            .filter(
              (item) => item.contentType !== 'static',
            )
            .map((item) => (
              <option
                value={item.contentId}
                key={item.contentId}
              >
                {item.title}
              </option>
            ))}
        </select>

        <button
          onClick={() => {
            void deleteVideoFlowDraft(
              content.contentId,
            ).finally(() => {
              setProjectionVersion(
                (value) => value + 1,
              )
            })
          }}
        >
          Regenerar desde Alfa
        </button>
      </header>

      <div className="alpha-vf-status">
        <span>👻 = pendiente</span>
        <span>
          Cada directiva Alfa es un layer real de VideoFlow.
        </span>
        <span>
          Production Graph sigue siendo la fuente de verdad.
        </span>
      </div>

      <div className="alpha-vf-host">
        {loading && (
          <div className="alpha-vf-loading">
            Creando Ghost layers dentro de VideoFlow…
          </div>
        )}

        {error && (
          <div className="alpha-vf-error">
            <strong>
              No pude proyectar el Alfa a VideoFlow.
            </strong>
            <pre>{error}</pre>
          </div>
        )}

        {!loading && !error && initialVideo && (
          <VideoEditor
            key={
              `${content.contentId}:`
              + `${content.revisionId}:`
              + projectionVersion
            }
            video={initialVideo}
            theme="night"
            onChange={handleChange}
          />
        )}
      </div>
    </section>
  )
}
