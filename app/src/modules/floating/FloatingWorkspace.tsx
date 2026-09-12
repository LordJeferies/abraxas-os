import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  getCurrentWebviewWindow,
} from '@tauri-apps/api/webviewWindow'
import type {
  FloatingEditorKind,
} from '../../core/alpha/floatingWindow'
import {
  readFloatingSnapshot,
  sendFloatingSelection,
  subscribeFloatingSnapshot,
  type FloatingEditorSnapshot,
} from '../../core/alpha/floatingEditorBridge'
import {
  CANONICAL_TRACKS,
} from '../../core/alpha/alphaTimelineModel'
import GhostInspectorPanel from '../alpha/GhostInspectorPanel'
import './floating-workspace.css'

export function getFloatingKind():
  FloatingEditorKind
  | null {
  const query =
    new URLSearchParams(
      window.location.search,
    ).get(
      'floating',
    )

  if (
    query === 'timeline'
    || query === 'ghost'
  ) {
    return query
  }

  try {
    const label =
      getCurrentWebviewWindow()
        .label

    if (
      label === 'floating-timeline'
    ) {
      return 'timeline'
    }

    if (
      label === 'floating-ghost'
    ) {
      return 'ghost'
    }
  } catch {
    // Browser / Pages mode.
  }

  return null
}

function FloatingTimeline({
  snapshot,
}: {
  snapshot:
    FloatingEditorSnapshot
    | null
}) {
  if (!snapshot) {
    return (
      <div
        className="floating-empty"
      >
        Abre una ficha Alfa en el Editor.
      </div>
    )
  }

  const duration =
    Math.max(
      1,
      snapshot.duration,
    )

  return (
    <section
      className="floating-timeline"
    >
      <header>
        <div>
          <small>
            ABRAXAS · TIMELINE CANÓNICA
          </small>

          <strong>
            {snapshot.title}
          </strong>
        </div>

        <span>
          {snapshot.route}
        </span>
      </header>

      <div
        className="floating-timeline-scroll"
      >
        {CANONICAL_TRACKS.map(
          (entry) => {
            const items =
              snapshot.items.filter(
                (item) =>
                  item.track
                  === entry.track,
              )

            return (
              <div
                className="floating-lane"
                key={entry.track}
              >
                <strong>
                  {entry.label}
                </strong>

                <div>
                  {items.map(
                    (item) => (
                      <button
                        key={
                          item.resourceId
                        }
                        className={
                          snapshot
                            .selectedResourceId
                          === item.resourceId
                            ? 'selected'
                            : ''
                        }
                        style={{
                          left:
                            `${item.start / duration * 100}%`,

                          width:
                            `${Math.max(
                              0.45,
                              (
                                item.end
                                - item.start
                              )
                              / duration
                              * 100,
                            )}%`,

                          backgroundColor:
                            entry.color,
                        }}
                        onClick={() =>
                          sendFloatingSelection(
                            item.resourceId,
                          )
                        }
                        title={
                          `${item.label} · ${item.start.toFixed(3)} → ${item.end.toFixed(3)}`
                        }
                      >
                        {
                          item.state
                          === 'ghost'
                            ? '👻 '
                            : '◆ '
                        }

                        {item.label}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )
          },
        )}
      </div>
    </section>
  )
}

export default function FloatingWorkspace({
  kind,
}: {
  kind:
    FloatingEditorKind
}) {
  const [
    snapshot,
    setSnapshot,
  ] =
    useState<
      FloatingEditorSnapshot
      | null
    >(
      () =>
        readFloatingSnapshot(),
    )

  useEffect(
    () =>
      subscribeFloatingSnapshot(
        setSnapshot,
      ),
    [],
  )

  const selected =
    useMemo(
      () =>
        snapshot?.selected
        ?? null,

      [snapshot],
    )

  return (
    <main
      className="floating-workspace"
    >
      {kind === 'timeline'
        ? (
            <FloatingTimeline
              snapshot={
                snapshot
              }
            />
          )
        : (
            <GhostInspectorPanel
              ghost={
                selected
              }
              compact
            />
          )}
    </main>
  )
}
