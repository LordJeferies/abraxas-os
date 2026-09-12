import {
  useMemo,
} from 'react'
import {
  usePlayhead,
  useVideo,
} from '@videoflow/react-video-editor'
import {
  buildCanonicalTimeline,
  formatTimelineTime,
  itemsForTrack,
  timelinePixelsPerSecond,
  timelineTickInterval,
} from '../../core/alpha/alphaTimelineModel'
import {
  useAlphaStore,
} from '../../core/alpha/useAlphaStore'
import './alpha-semantic-timeline.css'

function compact(
  value: string,
  max = 44,
) {
  const normalized =
    value
      .replace(/\s+/gu, ' ')
      .trim()

  return normalized.length <= max
    ? normalized
    : `${normalized.slice(0, max - 1)}…`
}

export default function AlphaSemanticTimeline() {
  const video =
    useVideo()

  const {
    frame,
  } =
    usePlayhead()

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

  const model =
    useMemo(
      () =>
        content
          ? buildCanonicalTimeline(
              content,
              route,
            )
          : null,

      [
        content,
        route,
      ],
    )

  if (!model) {
    return null
  }

  const pixels =
    timelinePixelsPerSecond(
      model.duration,
    )

  const width =
    Math.max(
      980,
      Math.ceil(
        model.duration
        * pixels,
      ),
    )

  const interval =
    timelineTickInterval(
      model.duration,
    )

  const ticks: number[] = []

  for (
    let time = 0;
    time <= model.duration;
    time += interval
  ) {
    ticks.push(time)
  }

  const currentSeconds =
    Math.max(
      0,
      frame,
    )
    / Math.max(
      1,
      video.fps
      || 30,
    )

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
          {model.items.length}
          {' recursos'}
        </span>

        {model.tracks.map(
          (entry) => (
            <span
              key={entry.track}
              className="abx-semantic-chip"
            >
              {entry.label}
              {' '}
              <b>
                {
                  itemsForTrack(
                    model,
                    entry.track,
                  ).length
                }
              </b>
            </span>
          ),
        )}
      </header>

      <div
        className="abx-semantic-scroll"
      >
        <div
          className="abx-semantic-canvas"
          style={{
            width:
              width
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
                width,
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
                    {
                      formatTimelineTime(
                        time,
                      )
                    }
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
                    width,
                    currentSeconds
                    * pixels,
                  ),
              }}
            />

            {model.tracks.map(
              (entry) => {
                const items =
                  itemsForTrack(
                    model,
                    entry.track,
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
                        width,
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

                      {items.map(
                        (item) => (
                          <button
                            key={
                              item.resourceId
                            }
                            type="button"
                            className={[
                              'abx-semantic-block',
                              item.state
                              === 'ghost'
                                ? 'is-ghost'
                                : 'is-ready',
                              item.resourceId
                              === selectedResourceId
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
                                  8,
                                  (
                                    item.end
                                    - item.start
                                  )
                                  * pixels,
                                ),

                              backgroundColor:
                                entry.color,
                            }}
                            title={
                              `${item.label} · `
                              + `${formatTimelineTime(item.start)} → `
                              + `${formatTimelineTime(item.end)}`
                            }
                            onClick={() =>
                              selectResource(
                                item.resourceId,
                              )
                            }
                          >
                            <small>
                              {
                                item.state
                                === 'ghost'
                                  ? '👻'
                                  : '◆'
                              }
                            </small>

                            <span>
                              {compact(
                                item.label
                                || item.description
                                || item.type,
                              )}
                            </span>
                          </button>
                        ),
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
