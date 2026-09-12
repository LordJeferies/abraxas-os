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
import {
  buildCanonicalTimeline,
  slotForItem,
} from '../../core/alpha/alphaTimelineModel'
import {
  applyAlphaEdits,
  getAlphaOverlay,
  useAlphaEditStore,
} from '../../core/alpha/alphaEditStore'
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
import AlphaSemanticTimeline from './AlphaSemanticTimeline'
import AlphaFichaStudio from './AlphaFichaStudio'
import GhostInspectorPanel from './GhostInspectorPanel'
import './alpha-videoflow-editor.css'

function routeLabel(route: string) {
  if (route === 'voA') return 'VO A · documental'
  if (route === 'voB') return 'VO B · cine'
  if (route === 'source') return 'Entrevista original'
  return route
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
  const overlays = useAlphaEditStore((state) => state.overlays)
  const hydrateEdits = useAlphaEditStore((state) => state.hydrate)

  useEffect(() => { void hydrateEdits() }, [hydrateEdits])

  const document = useMemo(
    () => documents.find((item) => item.documentId === activeDocumentId) ?? documents[0] ?? null,
    [documents, activeDocumentId],
  )

  const baseContent = useMemo(
    () => document?.contents.find((item) => item.contentId === selectedContentId)
      ?? document?.contents[0]
      ?? null,
    [document, selectedContentId],
  )

  const content = useMemo(() => {
    if (!document || !baseContent) return null
    return applyAlphaEdits(
      baseContent,
      getAlphaOverlay(overlays, document.documentId, baseContent.contentId),
    )
  }, [document, baseContent, overlays])

  const routes = useMemo(() => content ? getEditorRoutes(content) : ['default'], [content])
  const activeRoute = useMemo(
    () => content ? preferredEditorRoute(content, route) : 'default',
    [content, route],
  )
  const directives = useMemo(
    () => content ? selectEditorDirectivesForRoute(content, activeRoute) : [],
    [content, activeRoute],
  )
  const selectedGhost = useMemo(() => {
    const directive = directives.find((item) => item.resourceId === selectedResourceId)
    return directive ? getGhostInspectorData(directive) : null
  }, [directives, selectedResourceId])

  const [initialVideo, setInitialVideo] = useState<VideoJSON | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [projectionVersion, setProjectionVersion] = useState(0)
  const [fichaOpen, setFichaOpen] = useState(false)
  const [inspectorDocked, setInspectorDocked] = useState(true)
  const [trackGroups, setTrackGroups] = useState(0)
  const [projectedCount, setProjectedCount] = useState(0)

  const latestVideoRef = useRef<VideoJSON | null>(null)
  const latestMapRef = useRef({
    resourceToLayer: {} as Record<string, string>,
    layerToResource: {} as Record<string, string>,
  })
  const autosaveTimer = useRef<number | null>(null)

  const publishSnapshot = () => {
    if (!content) return
    const model = buildCanonicalTimeline(content, activeRoute)
    publishFloatingSnapshot({
      schemaVersion: 'abraxas.floating-editor.v2',
      title: content.title,
      contentId: content.contentId,
      route: activeRoute,
      selectedResourceId,
      selected: selectedGhost,
      items: model.rootItems.flatMap((item) => {
        const slot = slotForItem(item)

        return slot
          ? [{
              resourceId: item.resourceId,
              slotId: slot.id,
              state: item.state,
              start: item.start,
              end: item.end,
              label: item.label,
            }]
          : []
      }),
      duration: model.duration,
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

  useEffect(() => { publishSnapshot() }, [content, activeRoute, selectedResourceId, selectedGhost, directives])

  useEffect(() => {
    let cancelled = false

    if (!content || fichaOpen) return () => { cancelled = true }

    setLoading(true)
    setError('')

    const load = async () => {
      try {
        let draft: AlphaVideoFlowDraft | null = null
        if (projectionVersion === 0) draft = await loadVideoFlowDraft(content.contentId, activeRoute)

        if (draft && draft.revisionId === content.revisionId) {
          if (cancelled) return
          latestVideoRef.current = draft.video
          latestMapRef.current = {
            resourceToLayer: draft.resourceToLayer,
            layerToResource: draft.layerToResource,
          }
          setTrackGroups(draft.video.layers.length)
          setProjectedCount(Object.keys(draft.resourceToLayer).length)
          setInitialVideo(draft.video)
          return
        }

        const projection = await projectAlphaToVideoFlow(content, activeRoute)
        if (cancelled) return

        latestVideoRef.current = projection.video
        latestMapRef.current = {
          resourceToLayer: projection.resourceToLayer,
          layerToResource: projection.layerToResource,
        }
        setTrackGroups(projection.trackContainerCount)
        setProjectedCount(projection.projectedResourceCount)
        setInitialVideo(projection.video)

        await saveVideoFlowDraft({
          schemaVersion: 'abraxas.videoflow-draft.v7',
          contentId: content.contentId,
          revisionId: content.revisionId,
          route: activeRoute,
          video: projection.video,
          resourceToLayer: projection.resourceToLayer,
          layerToResource: projection.layerToResource,
          updatedAt: new Date().toISOString(),
        })
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
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
  }, [content, activeRoute, projectionVersion, fichaOpen])

  if (!document || !baseContent || !content) {
    return (
      <section className="alpha-vf-empty">
        <strong>No hay Alfa seleccionado.</strong>
        <button onClick={() => setAppView('alpha')}>Ir a Potenciales Alfa</button>
      </section>
    )
  }

  if (content.contentType === 'static') {
    return (
      <section className="alpha-vf-empty">
        <strong>Esta ficha es estática.</strong>
        <button onClick={() => setAppView('alpha')}>Volver a Potenciales</button>
      </section>
    )
  }

  const handleChange = (video: VideoJSON) => {
    latestVideoRef.current = video
    if (autosaveTimer.current !== null) window.clearTimeout(autosaveTimer.current)

    autosaveTimer.current = window.setTimeout(() => {
      autosaveTimer.current = null
      void saveVideoFlowDraft({
        schemaVersion: 'abraxas.videoflow-draft.v7',
        contentId: content.contentId,
        revisionId: content.revisionId,
        route: activeRoute,
        video,
        resourceToLayer: latestMapRef.current.resourceToLayer,
        layerToResource: latestMapRef.current.layerToResource,
        updatedAt: new Date().toISOString(),
      })
    }, 300)
  }

  return (
    <section className="alpha-videoflow-editor">
      <header className="alpha-vf-toolbar">
        <button onClick={() => setAppView('alpha')}>← Potenciales</button>
        <div className="alpha-vf-title">
          <small>VIDEOFLOW ENGINE + ABRAXAS TIMELINE</small>
          <strong>{content.title}</strong>
          <span>{routeLabel(activeRoute)} · {trackGroups} track containers · {projectedCount} recursos</span>
        </div>

        <select
          value={content.contentId}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => selectContent(event.target.value)}
        >
          {document.contents.filter((item) => item.contentType !== 'static').map((item) => (
            <option value={item.contentId} key={item.contentId}>{item.title}</option>
          ))}
        </select>

        {routes.length > 1 && (
          <select value={activeRoute} onChange={(event: ChangeEvent<HTMLSelectElement>) => setRoute(event.target.value)}>
            {routes.map((item) => <option value={item} key={item}>{routeLabel(item)}</option>)}
          </select>
        )}

        <button className={fichaOpen ? 'active' : ''} onClick={() => setFichaOpen((value) => !value)}>Ficha</button>
        <button className={inspectorDocked ? 'active' : ''} onClick={() => setInspectorDocked((value) => !value)}>Ghost Info</button>
        <button onClick={() => void openFloatingEditorWindow('timeline')}>↗ Timeline</button>
        <button disabled={!selectedGhost} onClick={() => void openFloatingEditorWindow('ghost')}>↗ Ghost</button>
        <button onClick={() => {
          void deleteVideoFlowDraft(content.contentId, activeRoute).finally(() => setProjectionVersion((value) => value + 1))
        }}>Regenerar</button>
      </header>

      <div className="alpha-vf-status">
        <span>Timeline oficial = Abraxas</span>
        <span>VideoFlow = motor de layers/preview/render</span>
        <span>T1 A-roll → T9 Captions; children anidados por resourceId</span>
      </div>

      <div className={`alpha-vf-body${inspectorDocked ? ' with-inspector' : ''}`}>
        {inspectorDocked && <GhostInspectorPanel ghost={selectedGhost} />}

        <div className="alpha-vf-host">
          {fichaOpen && (
            <div className="alpha-vf-ficha-overlay">
              <AlphaFichaStudio
                documentId={document.documentId}
                baseContent={baseContent}
                route={activeRoute}
                onRouteChange={setRoute}
                selectedResourceId={selectedResourceId}
                onSelectResource={selectResource}
                onBack={() => setFichaOpen(false)}
                onEditVideo={() => setFichaOpen(false)}
              />
            </div>
          )}

          {loading && <div className="alpha-vf-loading">Construyendo topología canónica…</div>}
          {error && <div className="alpha-vf-error"><strong>No pude proyectar el Alfa.</strong><pre>{error}</pre></div>}

          {!loading && !error && initialVideo && (
            <VideoEditor
              key={`${content.contentId}:${content.revisionId}:${activeRoute}:${projectionVersion}`}
              video={initialVideo}
              theme="night"
              onChange={handleChange}
              components={{ Timeline: AlphaSemanticTimeline }}
            />
          )}
        </div>
      </div>
    </section>
  )
}
