import type { AlphaContent, AlphaTrack } from './types'
import {
  selectEditorDirectivesForRoute,
  type EditorDirective,
} from './alphaEditorDirectives'

export type TrackSlotId =
  | 'T1'
  | 'T2'
  | 'T3'
  | 'T4'
  | 'T5'
  | 'T6'
  | 'T7'
  | 'T8'
  | 'T9'

export interface TrackSlotDefinition {
  id: TrackSlotId
  label: string
  shortLabel: string
  color: string
  accepts: AlphaTrack[]
  zIndex: number
}

export interface TimelineTruthIssue {
  resourceId: string
  field: 'start' | 'end' | 'missing'
  rawValue: number | null
  canonicalValue: number | null
}

export interface CanonicalTimelineModel {
  items: EditorDirective[]
  rootItems: EditorDirective[]
  storyItems: EditorDirective[]
  duration: number
  slots: TrackSlotDefinition[]
  truthIssues: TimelineTruthIssue[]
}

/**
 * Fixed editorial track identity.
 *
 * T1 is always the base A-roll track.
 * T9 is always captions and therefore the highest render/UI track.
 * Visual order in the product is T9 -> T1, while engine creation order is T1 -> T9.
 */
export const TRACK_SLOTS: TrackSlotDefinition[] = [
  {
    id: 'T9',
    label: 'T9 · CAPTIONS',
    shortLabel: 'CAPTIONS',
    color: '#c9c7c8',
    accepts: ['captions'],
    zIndex: 9,
  },
  {
    id: 'T8',
    label: 'T8 · MUSIC',
    shortLabel: 'MUSIC',
    color: '#86b3a3',
    accepts: ['music'],
    zIndex: 8,
  },
  {
    id: 'T7',
    label: 'T7 · SFX',
    shortLabel: 'SFX',
    color: '#dfcf78',
    accepts: ['sfx'],
    zIndex: 7,
  },
  {
    id: 'T6',
    label: 'T6 · VO JOC',
    shortLabel: 'VO JOC',
    color: '#a8caa8',
    accepts: ['vo'],
    zIndex: 6,
  },
  {
    id: 'T5',
    label: 'T5 · B-ROLL',
    shortLabel: 'B-ROLL',
    color: '#8f785e',
    accepts: ['broll'],
    zIndex: 5,
  },
  {
    id: 'T4',
    label: 'T4 · MOTION',
    shortLabel: 'MOTION',
    color: '#d28e95',
    accepts: ['motion', 'transition'],
    zIndex: 4,
  },
  {
    id: 'T3',
    label: 'T3 · IMAGES',
    shortLabel: 'IMAGES',
    color: '#9b8dca',
    accepts: ['images'],
    zIndex: 3,
  },
  {
    id: 'T2',
    label: 'T2 · XR',
    shortLabel: 'XR',
    color: '#d298e4',
    accepts: ['xr'],
    zIndex: 2,
  },
  {
    id: 'T1',
    label: 'T1 · A-ROLL',
    shortLabel: 'A-ROLL',
    color: '#a7bfcb',
    accepts: ['aroll'],
    zIndex: 1,
  },
]

export const TRACK_SLOTS_ENGINE_ORDER = [...TRACK_SLOTS]
  .sort((a, b) => a.zIndex - b.zIndex)

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function stringValue(value: unknown) {
  return value == null ? '' : String(value)
}

function routesOf(raw: Record<string, unknown>) {
  return Array.isArray(raw.routes)
    ? raw.routes.map(stringValue).filter(Boolean)
    : []
}

function truthIssuesFor(
  content: AlphaContent,
  route: string,
  items: EditorDirective[],
) {
  const rawTimeline = Array.isArray(content.sourcePayload.timeline)
    ? content.sourcePayload.timeline
    : []

  if (!rawTimeline.length) return []

  const canonical = new Map(items.map((item) => [item.resourceId, item]))
  const issues: TimelineTruthIssue[] = []

  for (const value of rawTimeline) {
    const raw = record(value)
    const rawRoutes = routesOf(raw)

    if (rawRoutes.length && !rawRoutes.includes(route)) continue

    const resourceId = stringValue(raw.id ?? raw.resourceId)
    if (!resourceId) continue

    const rawStart = numberValue(raw.start ?? raw.t0)
    const rawEnd = numberValue(raw.end ?? raw.t1)
    if (rawStart == null || rawEnd == null) continue

    const item = canonical.get(resourceId)

    if (!item) {
      issues.push({
        resourceId,
        field: 'missing',
        rawValue: null,
        canonicalValue: null,
      })
      continue
    }

    if (Math.abs(item.start - rawStart) > 0.001) {
      issues.push({
        resourceId,
        field: 'start',
        rawValue: rawStart,
        canonicalValue: item.start,
      })
    }

    if (Math.abs(item.end - rawEnd) > 0.001) {
      issues.push({
        resourceId,
        field: 'end',
        rawValue: rawEnd,
        canonicalValue: item.end,
      })
    }
  }

  return issues
}

export function slotForTrack(track: AlphaTrack): TrackSlotDefinition | null {
  return TRACK_SLOTS.find((slot) => slot.accepts.includes(track)) ?? null
}

export function slotForItem(item: Pick<EditorDirective, 'track'>) {
  return slotForTrack(item.track)
}

export function isGlobalTimelineItem(item: EditorDirective) {
  if (item.track === 'story') return false
  return slotForTrack(item.track) !== null
}

export function buildCanonicalTimeline(
  content: AlphaContent,
  route: string,
): CanonicalTimelineModel {
  const items = selectEditorDirectivesForRoute(content, route)
    .filter(
      (item) =>
        Number.isFinite(item.start)
        && Number.isFinite(item.end)
        && item.end > item.start,
    )

  const duration = Math.max(
    content.durationSeconds || 0,
    ...items.map((item) => item.end),
    1,
  )

  return {
    items,
    rootItems: items.filter(isGlobalTimelineItem),
    storyItems: items.filter((item) => item.track === 'story'),
    duration,
    slots: TRACK_SLOTS,
    truthIssues: truthIssuesFor(content, route, items),
  }
}

export function itemsForSlot(
  model: CanonicalTimelineModel,
  slotId: TrackSlotId,
) {
  const slot = model.slots.find((item) => item.id === slotId)
  if (!slot) return []

  return model.rootItems.filter((item) => slot.accepts.includes(item.track))
}

export function timelineGeometry(
  item: Pick<EditorDirective, 'start' | 'end'>,
  duration: number,
) {
  const safeDuration = Math.max(0.001, duration)
  const start = Math.max(0, Math.min(safeDuration, item.start))
  const end = Math.max(start, Math.min(safeDuration, item.end))

  return {
    leftPct: start / safeDuration * 100,
    widthPct: Math.max(0.02, (end - start) / safeDuration * 100),
  }
}

export function timelineTickInterval(duration: number) {
  if (duration <= 150) return 10
  if (duration <= 420) return 30
  if (duration <= 1200) return 60
  return 300
}

export function timelineCanvasWidth(duration: number, zoom = 1) {
  const pixelsPerSecond =
    duration <= 150 ? 12
    : duration <= 420 ? 7
    : duration <= 1200 ? 4
    : 2

  return Math.max(
    980,
    Math.ceil(duration * pixelsPerSecond * Math.max(0.4, zoom)),
  )
}

export function formatTimelineTime(seconds: number) {
  const safe = Math.max(0, seconds)
  const minutes = Math.floor(safe / 60)
  const rest = safe - minutes * 60

  return `${String(minutes).padStart(2, '0')}:${rest.toFixed(2).padStart(5, '0')}`
}
