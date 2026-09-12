import { useMemo } from 'react'
import type { AlphaContent } from '../../core/alpha/types'
import {
  buildCanonicalTimeline,
  formatTimelineTime,
  itemsForSlot,
  timelineCanvasWidth,
  timelineGeometry,
  timelineTickInterval,
} from '../../core/alpha/alphaTimelineModel'
import './canonical-timeline.css'

function compact(value: string, max = 48) {
  const normalized = value.replace(/\s+/gu, ' ').trim()
  return normalized.length <= max
    ? normalized
    : `${normalized.slice(0, max - 1)}…`
}

export default function CanonicalTimeline({
  content,
  route,
  selectedResourceId,
  onSelectResource,
  playheadSeconds = null,
  zoom = 1,
  compactMode = false,
}: {
  content: AlphaContent
  route: string
  selectedResourceId: string
  onSelectResource: (resourceId: string) => void
  playheadSeconds?: number | null
  zoom?: number
  compactMode?: boolean
}) {
  const model = useMemo(
    () => buildCanonicalTimeline(content, route),
    [content, route],
  )

  const width = timelineCanvasWidth(model.duration, zoom)
  const interval = timelineTickInterval(model.duration)
  const ticks: number[] = []

  for (let value = 0; value <= model.duration; value += interval) {
    ticks.push(value)
  }

  const playheadPct = playheadSeconds == null
    ? null
    : Math.max(0, Math.min(100, playheadSeconds / model.duration * 100))

  return (
    <section
      className={`abx-canonical-timeline${compactMode ? ' is-compact' : ''}`}
      data-route={route}
      data-duration={model.duration}
    >
      {model.truthIssues.length > 0 && (
        <div className="abx-timeline-truth-error">
          ⚠ Timeline Truth: {model.truthIssues.length} diferencias entre el HTML importado y el Production Graph.
        </div>
      )}

      {model.storyItems.length > 0 && (
        <div className="abx-story-ribbon">
          <strong>STORY</strong>
          <div>
            {model.storyItems.map((item) => {
              const geometry = timelineGeometry(item, model.duration)
              return (
                <button
                  type="button"
                  key={item.resourceId}
                  style={{
                    left: `${geometry.leftPct}%`,
                    width: `${geometry.widthPct}%`,
                  }}
                  onClick={() => onSelectResource(item.resourceId)}
                  title={`${item.label} · ${formatTimelineTime(item.start)} → ${formatTimelineTime(item.end)}`}
                >
                  {compact(item.label, 32)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="abx-canonical-scroll">
        <div className="abx-canonical-canvas" style={{ width: width + 112 }}>
          <div className="abx-canonical-ruler-row">
            <strong>TIME</strong>
            <div>
              {ticks.map((time) => (
                <span
                  key={time}
                  style={{ left: `${time / model.duration * 100}%` }}
                >
                  {formatTimelineTime(time)}
                </span>
              ))}
            </div>
          </div>

          <div className="abx-canonical-body">
            {playheadPct != null && (
              <div
                className="abx-canonical-playhead"
                style={{ left: 112 + width * playheadPct / 100 }}
              />
            )}

            {model.slots.map((slot) => {
              const items = itemsForSlot(model, slot.id)

              return (
                <div
                  className="abx-canonical-row"
                  key={slot.id}
                  data-track-slot={slot.id}
                >
                  <strong>{slot.label}</strong>
                  <div className="abx-canonical-lane">
                    {ticks.map((time) => (
                      <i
                        key={time}
                        style={{ left: `${time / model.duration * 100}%` }}
                      />
                    ))}

                    {items.map((item) => {
                      const geometry = timelineGeometry(item, model.duration)

                      return (
                        <div
                          key={item.resourceId}
                          className="abx-timeline-item-position"
                          data-resource-id={item.resourceId}
                          data-start={item.start}
                          data-end={item.end}
                          style={{
                            left: `${geometry.leftPct}%`,
                            width: `${geometry.widthPct}%`,
                          }}
                        >
                          <button
                            type="button"
                            className={`abx-timeline-item-button${item.state === 'ghost' ? ' is-ghost' : ''}${item.resourceId === selectedResourceId ? ' is-selected' : ''}`}
                            style={{ backgroundColor: slot.color }}
                            title={`${item.label} · ${formatTimelineTime(item.start)} → ${formatTimelineTime(item.end)}`}
                            onClick={() => onSelectResource(item.resourceId)}
                          >
                            <small>{item.state === 'ghost' ? '👻' : '◆'}</small>
                            <span>{compact(item.label || item.description || item.type)}</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
