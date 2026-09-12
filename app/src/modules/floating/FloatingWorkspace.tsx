import { useEffect, useMemo, useState } from 'react'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import type { FloatingEditorKind } from '../../core/alpha/floatingWindow'
import {
  readFloatingSnapshot,
  sendFloatingSelection,
  subscribeFloatingSnapshot,
  type FloatingEditorSnapshot,
} from '../../core/alpha/floatingEditorBridge'
import {
  TRACK_SLOTS,
  timelineGeometry,
} from '../../core/alpha/alphaTimelineModel'
import GhostInspectorPanel from '../alpha/GhostInspectorPanel'
import './floating-workspace.css'

export function getFloatingKind(): FloatingEditorKind | null {
  const query = new URLSearchParams(window.location.search).get('floating')

  if (query === 'timeline' || query === 'ghost') return query

  try {
    const label = getCurrentWebviewWindow().label
    if (label === 'floating-timeline') return 'timeline'
    if (label === 'floating-ghost') return 'ghost'
  } catch {
    // Browser / Pages mode.
  }

  return null
}

function FloatingTimeline({
  snapshot,
}: {
  snapshot: FloatingEditorSnapshot | null
}) {
  if (!snapshot) {
    return (
      <div className="floating-empty">
        Abre una ficha Alfa en el Editor.
      </div>
    )
  }

  return (
    <section className="floating-timeline">
      <header>
        <div>
          <small>ABRAXAS · T1–T9</small>
          <strong>{snapshot.title}</strong>
        </div>
        <span>{snapshot.route}</span>
      </header>

      <div className="floating-timeline-scroll">
        {TRACK_SLOTS.map((slot) => {
          const items = snapshot.items.filter((item) => item.slotId === slot.id)

          return (
            <div className="floating-lane" key={slot.id}>
              <strong>{slot.label}</strong>
              <div>
                {items.map((item) => {
                  const geometry = timelineGeometry(item, snapshot.duration)

                  return (
                    <div
                      key={item.resourceId}
                      className="floating-item-position"
                      style={{
                        left: `${geometry.leftPct}%`,
                        width: `${geometry.widthPct}%`,
                      }}
                    >
                      <button
                        type="button"
                        className={
                          snapshot.selectedResourceId === item.resourceId
                            ? 'selected'
                            : ''
                        }
                        style={{ backgroundColor: slot.color }}
                        onClick={() => sendFloatingSelection(item.resourceId)}
                        title={`${item.label} · ${item.start.toFixed(3)} → ${item.end.toFixed(3)}`}
                      >
                        {item.state === 'ghost' ? '👻 ' : '◆ '}
                        {item.label}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function FloatingWorkspace({
  kind,
}: {
  kind: FloatingEditorKind
}) {
  const [snapshot, setSnapshot] = useState<FloatingEditorSnapshot | null>(
    () => readFloatingSnapshot(),
  )

  useEffect(
    () => subscribeFloatingSnapshot(setSnapshot),
    [],
  )

  const selected = useMemo(
    () => snapshot?.selected ?? null,
    [snapshot],
  )

  return (
    <main className="floating-workspace">
      {kind === 'timeline'
        ? <FloatingTimeline snapshot={snapshot} />
        : <GhostInspectorPanel ghost={selected} compact />}
    </main>
  )
}
