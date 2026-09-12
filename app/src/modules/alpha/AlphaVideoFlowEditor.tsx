import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import type { VideoJSON } from '@videoflow/core'
import { VideoEditor } from '@videoflow/react-video-editor'
import '@videoflow/react-video-editor/style.css'
import {
  getEditorRoutes,
  getGhostInspectorData,
  preferredEditorRoute,
  selectEditorDirectivesForRoute,
} from '../../core/alpha/alphaEditorDirectives'
import { projectAlphaToVideoFlow } from '../../core/alpha/videoFlowProjection'
import {
  deleteVideoFlowDraft,
  loadVideoFlowDraft,
  saveVideoFlowDraft,
  type AlphaVideoFlowDraft,
} from '../../core/alpha/videoFlowDraftStore'
import { openFloatingEditorWindow } from '../../core/alpha/floatingWindow'
import {
  publishFloatingSnapshot,
  subscribeFloatingSelection,
} from '../../core/alpha/floatingEditorBridge'
import { useAlphaStore } from '../../core/alpha/useAlphaStore'
import { useAppStore } from '../../core/state/useAppStore'
import AlphaSemanticTimeline, {
  AlphaTimelineProjectionProvider,
} from './AlphaSemanticTimeline'
import GhostInspectorPanel from './GhostInspectorPanel'
import AlphaFichaReview from './AlphaFichaReview'
import './alpha-videoflow-editor.css'

type TimelineView = 'semantic' | 'videoflow'

function routeLabel(route: string) {
  if (route === 'voA') return 'VO A · documental'
  if (route === 'voB') return 'VO B · cine'
  if (route === 'source') return 'Entrevista original'
  return route
}

interface RuntimeLayer {
  id: string
  settings?: {
    startTime?: number
    sourceDuration?: number
  }
}

export default function AlphaVideoFlowEditor() {
  const setAppView = useAppStore((state) => state.setView)

  const documents = useAlphaStore((state) => state.documents)
  const activeDocumentId = useAlphaStore((state) => state.activeDocumentId)
  const selectedContentId = useAlphaStore((state) => state.selectedContentId)
  const selectedResourceId = useAlphaStore((state) => state.selectedResourceId)
  const selectContent = useAlphaStore((state) => state.selectContent)
  const selectResource = useAlphaStore((state) => state.selectResource)
  const route = useAlphaStore((state) => state.route)
  const setRoute = useAlphaStore((state) => state.setRoute)

  const document = useMemo(
    () =>
      documents.find((item) => item.documentId === activeDocumentId)
      ?? documents[0]
      ?? null,
    [documents, activeDocumentId],
  )

  const content = useMemo(
    () =>
      document?.contents.find((item) => item.contentId === selectedContentId)
      ?? document?.contents[0]
      ?? null,
    [document, selectedContentId],
  )

  const routes = useMemo(
    () => content ? getEditorRoutes(content) : ['default'],
    [content],
  )

  const activeRoute = useMemo(
    () => content ? preferredEditorRoute(content, route) : 'default',
    [content, route],
  )

  const directives = useMemo(
    () => content ? selectEditorDirectivesForRoute(content, activeRoute) : [],
    [content, activeRoute],
  )

  const selectedGhost = useMemo(() => {
    const directive = directives.find(
      (item) => item.resourceId === selectedResourceId,
    )

    return directive ? getGhostInspectorData(directive) : null
  }, [directives, selectedResourceId])

  const [initialVideo, setInitialVideo] = useState<VideoJSON | null>(null)
  const [projectedCount, setProjectedCount] = useState(0)
  const [ghostCount, setGhostCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [projectionVersion, setProjectionVersion] = useState(0)
  const [timelineView, setTimelineView] = useState<TimelineView>('semantic')
  const [inspectorDocked, setInspectorDocked] = useState(true)
  const [fichaOpen, setFichaOpen] = useState(false)
  const [projectionMaps, setProjectionMaps] = useState({
    resourceToLayer: {} as Record<string, string>,
    layerToResource: {} as Record<string, string>,
  })

  const latestVideoRef = useRef<VideoJSON | null>(null)
  const latestMapsRef = useRef({
    resourceToLayer: {} as Record<string, string>,
    layerToResource: {} as Record<string, string>,
  })
  const autosaveTimer = useRef<number | null>(null)

  const publishSnapshot = (video: VideoJSON | null) => {
    if (!content) return

    const layerById = new Map<string, RuntimeLayer>()

    for (const raw of video?.layers ?? []) {
      const layer = raw as unknown as RuntimeLayer
      layerById.set(layer.id, layer)
    }

    const items = directives.map((directive) => {
      const layerId = latestMapsRef.current.resourceToLayer[directive.resourceId]
      const layer = layerId ? layerById.get(layerId) : undefined
      const start = layer?.settings?.startTime ?? directive.start
      const duration =
        layer?.settings?.sourceDuration
        ?? (directive.end - directive.start)

      return {
        resourceId: directive.resourceId,
        track: directive.track,
        state: directive.state,
        start,
        end: start + Math.max(0.03, duration),
        label: directive.label,
      }
    })

    publishFloatingSnapshot({
      schemaVersion: 'abraxas.floating-editor.v1',
      title: content.title,
      contentId: content.contentId,
      route: activeRoute,
      selectedResourceId,
      selected: selectedGhost,
      items,
      duration: Math.max(
        content.durationSeconds || 0,
        ...items.map((item) => item.end),
        1,
      ),
      updatedAt: new Date().toISOString(),
    })
  }

  useEffect(() => {
    if (content && route !== activeRoute) setRoute(activeRoute)
  }, [content, activeRoute, route, setRoute])

  useEffect(
    () => subscribeFloatingSelection((resourceId) => selectResource(resourceId)),
    [selectResource],
  )

  useEffect(() => {
    publishSnapshot(latestVideoRef.current)
  }, [
    content?.contentId,
    activeRoute,
    selectedResourceId,
    selectedGhost,
    directives,
  ])

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
          draft = await loadVideoFlowDraft(content.contentId, activeRoute)
        }

        if (draft && draft.revisionId === content.revisionId) {
          if (cancelled) return

          latestVideoRef.current = draft.video
          latestMapsRef.current = {
            resourceToLayer: draft.resourceToLayer,
            layerToResource: draft.layerToResource,
          }
          setProjectionMaps(latestMapsRef.current)
          setProjectedCount(Object.keys(draft.resourceToLayer).length)
          setGhostCount(
            directives.filter((item) => item.state === 'ghost').length,
          )
          setInitialVideo(draft.video)
          publishSnapshot(draft.video)
          return
        }

        const projection = await projectAlphaToVideoFlow(
          content,
          activeRoute,
        )

        if (cancelled) return

        latestVideoRef.current = projection.video
        latestMapsRef.current = {
          resourceToLayer: projection.resourceToLayer,
          layerToResource: projection.layerToResource,
        }
        setProjectionMaps(latestMapsRef.current)
        setProjectedCount(projection.projectedResourceCount)
        setGhostCount(projection.ghostCount)
        setInitialVideo(projection.video)
        publishSnapshot(projection.video)

        await saveVideoFlowDraft({
          schemaVersion: 'abraxas.videoflow-draft.v3',
          contentId: content.contentId,
          revisionId: content.revisionId,
          route: activeRoute,
          video: projection.video,
          resourceToLayer: projection.resourceToLayer,
          layerToResource: projection.layerToResource,
          updatedAt: new Date().toISOString(),
        })
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true

      if (autosaveTimer.current !== null) {
        window.clearTimeout(autosaveTimer.current)
        autosaveTimer.current = null
      }
    }
  }, [
    content,
    activeRoute,
    projectionVersion,
  ])

  if (!document || !content) {
    return (
      <section className="alpha-vf-empty">
        <strong>No hay Alfa seleccionado.</strong>
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
        <button onClick={() => setAppView('alpha')}>
          Volver a Potenciales
        </button>
      </section>
    )
  }

  const handleChange = (video: VideoJSON) => {
    latestVideoRef.current = video
    publishSnapshot(video)

    if (autosaveTimer.current !== null) {
      window.clearTimeout(autosaveTimer.current)
    }

    autosaveTimer.current = window.setTimeout(() => {
      autosaveTimer.current = null

      void saveVideoFlowDraft({
        schemaVersion: 'abraxas.videoflow-draft.v3',
        contentId: content.contentId,
        revisionId: content.revisionId,
        route: activeRoute,
        video,
        resourceToLayer: latestMapsRef.current.resourceToLayer,
        layerToResource: latestMapsRef.current.layerToResource,
        updatedAt: new Date().toISOString(),
      })
    }, 300)
  }

  return (
    <section className="alpha-videoflow-editor">
      <header className="alpha-vf-toolbar">
        <button onClick={() => setAppView('alpha')}>
          ← Potenciales
        </button>

        <div className="alpha-vf-title">
          <small>GROUP GHOSTS · VIDEOFLOW</small>
          <strong>{content.title}</strong>
          <span>
            {routeLabel(activeRoute)} · {ghostCount} Ghosts · {projectedCount} Groups
          </span>
        </div>

        <select
          value={content.contentId}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            selectContent(event.target.value)
          }
        >
          {document.contents
            .filter((item) => item.contentType !== 'static')
            .map((item) => (
              <option value={item.contentId} key={item.contentId}>
                {item.title}
              </option>
            ))}
        </select>

        {routes.length > 1 && (
          <select
            value={activeRoute}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setRoute(event.target.value)
            }
          >
            {routes.map((item) => (
              <option value={item} key={item}>
                {routeLabel(item)}
              </option>
            ))}
          </select>
        )}

        <button
          className={fichaOpen ? 'active' : ''}
          onClick={() => setFichaOpen((value) => !value)}
        >
          Ficha
        </button>

        <div className="alpha-vf-view-toggle">
          <button
            className={timelineView === 'semantic' ? 'active' : ''}
            onClick={() => setTimelineView('semantic')}
          >
            Semántica
          </button>
          <button
            className={timelineView === 'videoflow' ? 'active' : ''}
            onClick={() => setTimelineView('videoflow')}
          >
            VideoFlow
          </button>
        </div>

        <button
          className={inspectorDocked ? 'active' : ''}
          onClick={() => setInspectorDocked((value) => !value)}
        >
          Ghost Info
        </button>

        <button onClick={() => void openFloatingEditorWindow('timeline')}>
          ↗ Timeline
        </button>

        <button
          disabled={!selectedGhost}
          onClick={() => void openFloatingEditorWindow('ghost')}
        >
          ↗ Ghost
        </button>

        <button
          onClick={() => {
            void deleteVideoFlowDraft(
              content.contentId,
              activeRoute,
            ).finally(() => {
              setProjectionVersion((value) => value + 1)
            })
          }}
        >
          Regenerar
        </button>
      </header>

      <div className="alpha-vf-status">
        <span>👻 = Group Ghost</span>
        <span>Texto placeholder dentro del Group, oculto en preview.</span>
        <span>Timeline / Ghost Info pueden flotar sobre CapCut.</span>
      </div>

      <div
        className={[
          'alpha-vf-body',
          inspectorDocked ? 'with-inspector' : '',
        ].join(' ')}
      >
        {inspectorDocked && (
          <GhostInspectorPanel ghost={selectedGhost} />
        )}

        <div className="alpha-vf-host">
          {fichaOpen && (
            <AlphaFichaReview
              content={content}
              route={activeRoute}
              selectedResourceId={selectedResourceId}
              onSelectResource={selectResource}
              onClose={() => setFichaOpen(false)}
            />
          )}

          {loading && (
            <div className="alpha-vf-loading">
              Creando Group Ghosts…
            </div>
          )}

          {error && (
            <div className="alpha-vf-error">
              <strong>No pude proyectar el Alfa.</strong>
              <pre>{error}</pre>
            </div>
          )}

          {!loading && !error && initialVideo && (
            <AlphaTimelineProjectionProvider maps={projectionMaps}>
              <VideoEditor
                key={
                  `${content.contentId}:`
                  + `${content.revisionId}:`
                  + `${activeRoute}:`
                  + projectionVersion
                }
                video={initialVideo}
                theme="night"
                onChange={handleChange}
                components={
                  timelineView === 'semantic'
                    ? { Timeline: AlphaSemanticTimeline }
                    : undefined
                }
              />
            </AlphaTimelineProjectionProvider>
          )}
        </div>
      </div>
    </section>
  )
}
