import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import {
  usePlayhead,
  useVideo,
} from '@videoflow/react-video-editor'
import {
  getEditorDirectives,
  selectEditorDirectivesForRoute,
  type EditorDirective,
  type EditorTrack,
} from '../../core/alpha/alphaEditorDirectives'
import {
  useAlphaStore,
} from '../../core/alpha/useAlphaStore'
import './alpha-semantic-timeline.css'

interface ProjectionMaps {
  resourceToLayer:
    Record<string, string>

  layerToResource:
    Record<string, string>
}

const ProjectionContext =
  createContext<ProjectionMaps>({
    resourceToLayer: {},
    layerToResource: {},
  })

export function AlphaTimelineProjectionProvider({
  maps,
  children,
}: {
  maps: ProjectionMaps
  children: ReactNode
}) {
  return (
    <ProjectionContext.Provider
      value={maps}
    >
      {children}
    </ProjectionContext.Provider>
  )
}

const TRACKS: Array<{
  track: EditorTrack
  label: string
  color: string
}> = [
  {
    track: 'captions',
    label: 'SUBTÍTULOS',
    color: '#c9c7c8',
  },
  {
    track: 'xr',
    label: 'XR',
    color: '#d298e4',
  },
  {
    track: 'images',
    label: 'IMÁGENES',
    color: '#9b8dca',
  },
  {
    track: 'motion',
    label: 'MOTION',
    color: '#d28e95',
  },
  {
    track: 'broll',
    label: 'B-ROLL',
    color: '#8f785e',
  },
  {
    track: 'vo',
    label: 'VO JOC',
    color: '#a8caa8',
  },
  {
    track: 'aroll',
    label: 'A-ROLL',
    color: '#a7bfcb',
  },
  {
    track: 'story',
    label: 'PARTES',
    color: '#c8a2af',
  },
  {
    track: 'sfx',
    label: 'SFX',
    color: '#dfcf78',
  },
  {
    track: 'music',
    label: 'MÚSICA',
    color: '#86b3a3',
  },
]

interface TimelineLayerShape {
  id: string

  settings?: {
    startTime?: number
    sourceDuration?: number
  }
}

function numberValue(
  value: unknown,
  fallback: number,
) {
  return (
    typeof value === 'number'
    && Number.isFinite(value)
  )
    ? value
    : fallback
}

function labelFor(
  directive: EditorDirective,
) {
  if (
    directive.track === 'aroll'
  ) {
    return (
      directive.speaker
      || directive.label
      || 'A-roll'
    )
  }

  return (
    directive.label
    || directive.description
    || directive.text
    || directive.type
  )
}

function compact(
  value: string,
  max = 46,
) {
  const normalized =
    value
      .replace(/\s+/gu, ' ')
      .trim()

  return normalized.length <= max
    ? normalized
    : `${normalized.slice(0, max - 1)}…`
}

function pixelsPerSecond(
  duration: number,
) {
  if (duration <= 150) {
    return 13
  }

  if (duration <= 420) {
    return 7
  }

  if (duration <= 1200) {
    return 4
  }

  return 2
}

function tickInterval(
  duration: number,
) {
  if (duration <= 150) {
    return 10
  }

  if (duration <= 420) {
    return 30
  }

  if (duration <= 1200) {
    return 60
  }

  return 300
}

function formatTime(
  seconds: number,
) {
  const safe =
    Math.max(
      0,
      Math.round(seconds),
    )

  const minutes =
    Math.floor(
      safe / 60,
    )

  const rest =
    safe % 60

  return (
    `${String(minutes).padStart(2, '0')}:`
    + `${String(rest).padStart(2, '0')}`
  )
}

export default function AlphaSemanticTimeline() {
  const video =
    useVideo()

  const {
    frame,
  } =
    usePlayhead()

  const maps =
    useContext(
      ProjectionContext,
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

  const route =
    useAlphaStore(
      (state) =>
        state.route,
    )

  const selectedResourceId =
    useAlphaStore(
      (state) =>
        state.selectedResourceId,
    )

  const selectResource =
    useAlphaStore(
      (state) =>
        state.selectResource,
    )

  const content =
    useMemo(
      () => {
        const document =
          documents.find(
            (item) =>
              item.documentId
              === activeDocumentId,
          )
          ?? documents[0]

        return (
          document?.contents.find(
            (item) =>
              item.contentId
              === selectedContentId,
          )
          ?? document?.contents[0]
          ?? null
        )
      },

      [
        documents,
        activeDocumentId,
        selectedContentId,
      ],
    )

  const directives =
    useMemo(
      () =>
        content
          ? selectEditorDirectivesForRoute(
              content,
              route,
            )
          : [],

      [
        content,
        route,
      ],
    )

  const layerById =
    useMemo(
      () => {
        const result =
          new Map<
            string,
            TimelineLayerShape
          >()

        for (
          const raw
          of video.layers
        ) {
          const layer = raw as unknown as TimelineLayerShape

          result.set(
            layer.id,
            layer,
          )
        }

        return result
      },

      [video],
    )

  const items =
    useMemo(
      () =>
        directives
          .map(
            (
              directive,
            ) => {
              const layerId =
                maps.resourceToLayer[
                  directive.resourceId
                ]

              const layer =
                layerId
                  ? layerById.get(
                      layerId,
                    )
                  : undefined

              const start =
                numberValue(
                  layer
                    ?.settings
                    ?.startTime,

                  directive.start,
                )

              const duration =
                Math.max(
                  1
                  / Math.max(
                    1,
                    video.fps
                    || 30,
                  ),

                  numberValue(
                    layer
                      ?.settings
                      ?.sourceDuration,

                    directive.end
                    - directive.start,
                  ),
                )

              return {
                directive,
                layerId,
                start,
                duration,
                end:
                  start
                  + duration,
              }
            },
          )
          .filter(
            (item) =>
              Boolean(
                item.layerId,
              ),
          ),

      [
        directives,
        maps.resourceToLayer,
        layerById,
        video.fps,
      ],
    )

  const duration =
    Math.max(
      1,
      numberValue(
        video.duration,
        0,
      ),
      ...items.map(
        (item) =>
          item.end,
      ),
    )

  const pixels =
    pixelsPerSecond(
      duration,
    )

  const timelineWidth =
    Math.max(
      980,
      Math.ceil(
        duration
        * pixels,
      ),
    )

  const interval =
    tickInterval(
      duration,
    )

  const ticks: number[] = []

  for (
    let time = 0;
    time <= duration;
    time += interval
  ) {
    ticks.push(
      time,
    )
  }

  const fps =
    Math.max(
      1,
      video.fps
      || 30,
    )

  const currentSeconds =
    Math.max(
      0,
      frame,
    ) / fps

  const totalDirectives =
    content
      ? getEditorDirectives(
          content,
        ).length
      : 0

  return (
    <section
      className="abx-semantic-timeline"
    >
      <header
        className="abx-semantic-summary"
      >
        <span
          className="abx-semantic-route"
        >
          1 ficha
          {' · '}
          {route}
          {' · '}
          {items.length}
          {' / '}
          {totalDirectives}
        </span>

        {TRACKS.map(
          (entry) => {
            const count =
              items.filter(
                (item) =>
                  item.directive.track
                  === entry.track,
              ).length

            return (
              <span
                key={entry.track}
                className="abx-semantic-chip"
              >
                {entry.label}
                {' '}
                <b>
                  {count}
                </b>
              </span>
            )
          },
        )}
      </header>

      <div
        className="abx-semantic-scroll"
      >
        <div
          className="abx-semantic-canvas"
          style={{
            width:
              timelineWidth
              + 118,
          }}
        >
          <div
            className="abx-semantic-ruler-row"
          >
            <div
              className="abx-semantic-ruler-label"
            >
              TIME
            </div>

            <div
              className="abx-semantic-ruler"
              style={{
                width:
                  timelineWidth,
              }}
            >
              {ticks.map(
                (time) => (
                  <span
                    key={time}
                    className="abx-semantic-tick"
                    style={{
                      left:
                        time
                        * pixels,
                    }}
                  >
                    {formatTime(
                      time,
                    )}
                  </span>
                ),
              )}
            </div>
          </div>

          <div
            className="abx-semantic-body"
          >
            <div
              className="abx-semantic-playhead"
              style={{
                left:
                  118
                  + Math.min(
                    timelineWidth,
                    currentSeconds
                    * pixels,
                  ),
              }}
            />

            {TRACKS.map(
              (entry) => {
                const laneItems =
                  items.filter(
                    (item) =>
                      item.directive.track
                      === entry.track,
                  )

                return (
                  <div
                    className="abx-semantic-row"
                    key={entry.track}
                  >
                    <div
                      className="abx-semantic-label"
                    >
                      {entry.label}
                    </div>

                    <div
                      className="abx-semantic-lane"
                      style={{
                        width:
                          timelineWidth,
                      }}
                    >
                      {ticks.map(
                        (time) => (
                          <i
                            aria-hidden="true"
                            key={time}
                            className="abx-semantic-grid"
                            style={{
                              left:
                                time
                                * pixels,
                            }}
                          />
                        ),
                      )}

                      {laneItems.map(
                        (item) => {
                          const directive =
                            item.directive

                          const selected =
                            directive.resourceId
                            === selectedResourceId

                          return (
                            <button
                              key={
                                directive.resourceId
                              }
                              type="button"
                              className={[
                                'abx-semantic-block',
                                directive.state
                                === 'ghost'
                                  ? 'is-ghost'
                                  : 'is-ready',
                                selected
                                  ? 'is-selected'
                                  : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              style={{
                                left:
                                  item.start
                                  * pixels,

                                width:
                                  Math.max(
                                    12,
                                    item.duration
                                    * pixels,
                                  ),

                                backgroundColor:
                                  entry.color,
                              }}
                              title={[
                                entry.label,
                                labelFor(
                                  directive,
                                ),
                                (
                                  `${item.start.toFixed(2)}`
                                  + '–'
                                  + `${item.end.toFixed(2)}s`
                                ),
                              ].join(
                                ' · ',
                              )}
                              onClick={() =>
                                selectResource(
                                  directive.resourceId,
                                )
                              }
                            >
                              <small>
                                {
                                  directive.state
                                  === 'ghost'
                                    ? '👻'
                                    : '◆'
                                }
                              </small>

                              <span>
                                {compact(
                                  labelFor(
                                    directive,
                                  ),
                                )}
                              </span>
                            </button>
                          )
                        },
                      )}
                    </div>
                  </div>
                )
              },
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
