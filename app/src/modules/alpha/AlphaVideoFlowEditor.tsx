import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import type {
  VideoJSON,
} from '@videoflow/core'
import {
  VideoEditor,
} from '@videoflow/react-video-editor'
import '@videoflow/react-video-editor/style.css'
import {
  getEditorRoutes,
  preferredEditorRoute,
  selectEditorDirectivesForRoute,
} from '../../core/alpha/alphaEditorDirectives'
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
import AlphaSemanticTimeline, {
  AlphaTimelineProjectionProvider,
} from './AlphaSemanticTimeline'
import './alpha-videoflow-editor.css'

type TimelineView =
  | 'semantic'
  | 'videoflow'

function routeLabel(
  route: string,
) {
  if (
    route === 'voA'
  ) {
    return 'VO A · documental'
  }

  if (
    route === 'voB'
  ) {
    return 'VO B · cine'
  }

  if (
    route === 'source'
  ) {
    return 'Entrevista original'
  }

  return route
}

export default function AlphaVideoFlowEditor() {
  const setAppView =
    useAppStore(
      (state) =>
        state.setView,
    )

  const documents =
    useAlphaStore(
      (state) =>
        state.documents,
    )

  const activeDocumentId =
    useAlphaStore(
      (state) =>
        state.activeDocumentId,
    )

  const selectedContentId =
    useAlphaStore(
      (state) =>
        state.selectedContentId,
    )

  const selectContent =
    useAlphaStore(
      (state) =>
        state.selectContent,
    )

  const route =
    useAlphaStore(
      (state) =>
        state.route,
    )

  const setRoute =
    useAlphaStore(
      (state) =>
        state.setRoute,
    )

  const document =
    useMemo(
      () =>
        documents.find(
          (item) =>
            item.documentId
            === activeDocumentId,
        )
        ?? documents[0]
        ?? null,

      [
        documents,
        activeDocumentId,
      ],
    )

  const content =
    useMemo(
      () =>
        document?.contents.find(
          (item) =>
            item.contentId
            === selectedContentId,
        )
        ?? document?.contents[0]
        ?? null,

      [
        document,
        selectedContentId,
      ],
    )

  const routes =
    useMemo(
      () =>
        content
          ? getEditorRoutes(
              content,
            )
          : ['default'],

      [content],
    )

  const activeRoute =
    useMemo(
      () =>
        content
          ? preferredEditorRoute(
              content,
              route,
            )
          : 'default',

      [
        content,
        route,
      ],
    )

  const [
    initialVideo,
    setInitialVideo,
  ] =
    useState<
      VideoJSON
      | null
    >(null)

  const [
    projectedCount,
    setProjectedCount,
  ] =
    useState(0)

  const [
    ghostCount,
    setGhostCount,
  ] =
    useState(0)

  const [
    loading,
    setLoading,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    projectionVersion,
    setProjectionVersion,
  ] =
    useState(0)

  const [
    timelineView,
    setTimelineView,
  ] =
    useState<
      TimelineView
    >('semantic')

  const [
    projectionMaps,
    setProjectionMaps,
  ] =
    useState({
      resourceToLayer:
        {} as Record<string, string>,

      layerToResource:
        {} as Record<string, string>,
    })

  const latestVideoRef =
    useRef<
      VideoJSON
      | null
    >(null)

  const latestMapsRef =
    useRef({
      resourceToLayer:
        {} as Record<string, string>,

      layerToResource:
        {} as Record<string, string>,
    })

  const autosaveTimer =
    useRef<
      number
      | null
    >(null)

  useEffect(
    () => {
      if (
        content
        && route
        !== activeRoute
      ) {
        setRoute(
          activeRoute,
        )
      }
    },

    [
      content,
      activeRoute,
      route,
      setRoute,
    ],
  )

  useEffect(
    () => {
      let cancelled =
        false

      if (!content) {
        setInitialVideo(
          null,
        )

        latestVideoRef.current =
          null

        return
      }

      setLoading(
        true,
      )

      setError(
        '',
      )

      setInitialVideo(
        null,
      )

      const load =
        async () => {
          try {
            let draft:
              AlphaVideoFlowDraft
              | null = null

            if (
              projectionVersion
              === 0
            ) {
              draft =
                await loadVideoFlowDraft(
                  content.contentId,
                  activeRoute,
                )
            }

            if (
              draft
              && draft.revisionId
              === content.revisionId
            ) {
              if (
                cancelled
              ) {
                return
              }

              latestVideoRef.current =
                draft.video

              latestMapsRef.current = {
                resourceToLayer:
                  draft.resourceToLayer,

                layerToResource:
                  draft.layerToResource,
              }

              setProjectionMaps(
                latestMapsRef.current,
              )

              setProjectedCount(
                Object.keys(
                  draft.resourceToLayer,
                ).length,
              )

              setGhostCount(
                selectEditorDirectivesForRoute(
                  content,
                  activeRoute,
                ).filter(
                  (item) =>
                    item.state
                    === 'ghost',
                ).length,
              )

              setInitialVideo(
                draft.video,
              )

              return
            }

            const projection =
              await projectAlphaToVideoFlow(
                content,
                activeRoute,
              )

            if (
              cancelled
            ) {
              return
            }

            latestVideoRef.current =
              projection.video

            latestMapsRef.current = {
              resourceToLayer:
                projection.resourceToLayer,

              layerToResource:
                projection.layerToResource,
            }

            setProjectionMaps(
              latestMapsRef.current,
            )

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
              schemaVersion:
                'abraxas.videoflow-draft.v2',

              contentId:
                content.contentId,

              revisionId:
                content.revisionId,

              route:
                activeRoute,

              video:
                projection.video,

              resourceToLayer:
                projection.resourceToLayer,

              layerToResource:
                projection.layerToResource,

              updatedAt:
                new Date()
                  .toISOString(),
            })
          } catch (cause) {
            if (
              cancelled
            ) {
              return
            }

            setError(
              cause instanceof Error
                ? cause.message
                : String(cause),
            )
          } finally {
            if (
              !cancelled
            ) {
              setLoading(
                false,
              )
            }
          }
        }

      void load()

      return () => {
        cancelled =
          true

        if (
          autosaveTimer.current
          !== null
        ) {
          window.clearTimeout(
            autosaveTimer.current,
          )

          autosaveTimer.current =
            null
        }

        const latest =
          latestVideoRef.current

        if (
          latest
        ) {
          void saveVideoFlowDraft({
            schemaVersion:
              'abraxas.videoflow-draft.v2',

            contentId:
              content.contentId,

            revisionId:
              content.revisionId,

            route:
              activeRoute,

            video:
              latest,

            resourceToLayer:
              latestMapsRef.current
                .resourceToLayer,

            layerToResource:
              latestMapsRef.current
                .layerToResource,

            updatedAt:
              new Date()
                .toISOString(),
          })
        }
      }
    },

    [
      content,
      activeRoute,
      projectionVersion,
    ],
  )

  if (
    !document
    || !content
  ) {
    return (
      <section
        className="alpha-vf-empty"
      >
        <strong>
          No hay Alfa seleccionado.
        </strong>

        <button
          onClick={() =>
            setAppView(
              'alpha',
            )
          }
        >
          Ir a Potenciales Alfa
        </button>
      </section>
    )
  }

  if (
    content.contentType
    === 'static'
  ) {
    return (
      <section
        className="alpha-vf-empty"
      >
        <strong>
          Esta ficha es estática.
        </strong>

        <button
          onClick={() =>
            setAppView(
              'alpha',
            )
          }
        >
          Volver a Potenciales
        </button>
      </section>
    )
  }

  const handleChange =
    (
      video: VideoJSON,
    ) => {
      latestVideoRef.current =
        video

      if (
        autosaveTimer.current
        !== null
      ) {
        window.clearTimeout(
          autosaveTimer.current,
        )
      }

      autosaveTimer.current =
        window.setTimeout(
          () => {
            autosaveTimer.current =
              null

            void saveVideoFlowDraft({
              schemaVersion:
                'abraxas.videoflow-draft.v2',

              contentId:
                content.contentId,

              revisionId:
                content.revisionId,

              route:
                activeRoute,

              video,

              resourceToLayer:
                latestMapsRef.current
                  .resourceToLayer,

              layerToResource:
                latestMapsRef.current
                  .layerToResource,

              updatedAt:
                new Date()
                  .toISOString(),
            })
          },

          300,
        )
    }

  return (
    <section
      className="alpha-videoflow-editor"
    >
      <header
        className="alpha-vf-toolbar"
      >
        <button
          onClick={() =>
            setAppView(
              'alpha',
            )
          }
        >
          ← Potenciales
        </button>

        <div
          className="alpha-vf-title"
        >
          <small>
            1 FICHA · VIDEOFLOW
          </small>

          <strong>
            {content.title}
          </strong>

          <span>
            {routeLabel(
              activeRoute,
            )}
            {' · '}
            {ghostCount}
            {' Ghosts · '}
            {projectedCount}
            {' recursos'}
          </span>
        </div>

        <select
          value={
            content.contentId
          }
          onChange={(
            event:
              ChangeEvent<HTMLSelectElement>,
          ) =>
            selectContent(
              event.target.value,
            )
          }
        >
          {document.contents
            .filter(
              (item) =>
                item.contentType
                !== 'static',
            )
            .map(
              (item) => (
                <option
                  value={
                    item.contentId
                  }
                  key={
                    item.contentId
                  }
                >
                  {item.title}
                </option>
              ),
            )}
        </select>

        {routes.length > 1 && (
          <select
            value={
              activeRoute
            }
            onChange={(
              event:
                ChangeEvent<HTMLSelectElement>,
            ) =>
              setRoute(
                event.target.value,
              )
            }
          >
            {routes.map(
              (item) => (
                <option
                  value={item}
                  key={item}
                >
                  {routeLabel(
                    item,
                  )}
                </option>
              ),
            )}
          </select>
        )}

        <div
          className="alpha-vf-view-toggle"
        >
          <button
            className={
              timelineView
              === 'semantic'
                ? 'active'
                : ''
            }
            onClick={() =>
              setTimelineView(
                'semantic',
              )
            }
          >
            Semántica
          </button>

          <button
            className={
              timelineView
              === 'videoflow'
                ? 'active'
                : ''
            }
            onClick={() =>
              setTimelineView(
                'videoflow',
              )
            }
          >
            VideoFlow
          </button>
        </div>

        <button
          onClick={() => {
            void deleteVideoFlowDraft(
              content.contentId,
              activeRoute,
            ).finally(
              () => {
                setProjectionVersion(
                  (value) =>
                    value + 1,
                )
              },
            )
          }}
        >
          Regenerar desde Alfa
        </button>
      </header>

      <div
        className="alpha-vf-status"
      >
        <span>
          👻 = pendiente
        </span>

        <span>
          Una ficha · una ruta.
        </span>

        <span>
          Una fila por tipo.
        </span>
      </div>

      <div
        className="alpha-vf-host"
      >
        {loading && (
          <div
            className="alpha-vf-loading"
          >
            Proyectando esta ficha…
          </div>
        )}

        {error && (
          <div
            className="alpha-vf-error"
          >
            <strong>
              No pude proyectar el Alfa.
            </strong>

            <pre>
              {error}
            </pre>
          </div>
        )}

        {!loading
          && !error
          && initialVideo
          && (
            <AlphaTimelineProjectionProvider
              maps={
                projectionMaps
              }
            >
              <VideoEditor
                key={
                  `${content.contentId}:`
                  + `${content.revisionId}:`
                  + `${activeRoute}:`
                  + projectionVersion
                }

                video={
                  initialVideo
                }

                theme="night"

                onChange={
                  handleChange
                }

                components={
                  timelineView
                  === 'semantic'
                    ? {
                        Timeline:
                          AlphaSemanticTimeline,
                      }
                    : undefined
                }
              />
            </AlphaTimelineProjectionProvider>
          )}
      </div>
    </section>
  )
}
