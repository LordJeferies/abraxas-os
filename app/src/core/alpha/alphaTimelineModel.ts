import type { AlphaContent } from './types'
import {
  selectEditorDirectivesForRoute,
  type EditorDirective,
  type EditorTrack,
} from './alphaEditorDirectives'

export interface TimelineTrackDefinition {
  track: EditorTrack
  label: string
  color: string
}

export interface CanonicalTimelineModel {
  items: EditorDirective[]
  duration: number
  tracks: TimelineTrackDefinition[]
}

export const CANONICAL_TRACKS: TimelineTrackDefinition[] = [
  { track: 'captions', label: 'SUBTÍTULOS', color: '#c9c7c8' },
  { track: 'xr', label: 'XR', color: '#d298e4' },
  { track: 'images', label: 'IMÁGENES', color: '#9b8dca' },
  { track: 'motion', label: 'MOTION', color: '#d28e95' },
  { track: 'broll', label: 'B-ROLL', color: '#8f785e' },
  { track: 'vo', label: 'VO JOC', color: '#a8caa8' },
  { track: 'aroll', label: 'A-ROLL', color: '#a7bfcb' },
  { track: 'story', label: 'PARTES', color: '#c8a2af' },
  { track: 'sfx', label: 'SFX', color: '#dfcf78' },
  { track: 'music', label: 'MÚSICA', color: '#86b3a3' },
]

export function buildCanonicalTimeline(
  content: AlphaContent,
  route: string,
): CanonicalTimelineModel {
  const items = selectEditorDirectivesForRoute(
    content,
    route,
  ).filter(
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
    duration,
    tracks: CANONICAL_TRACKS,
  }
}

export function itemsForTrack(
  model: CanonicalTimelineModel,
  track: EditorTrack,
) {
  return model.items.filter(
    (item) => item.track === track,
  )
}

export function timelinePixelsPerSecond(
  duration: number,
) {
  if (duration <= 150) return 13
  if (duration <= 420) return 7
  if (duration <= 1200) return 4
  return 2
}

export function timelineTickInterval(
  duration: number,
) {
  if (duration <= 150) return 10
  if (duration <= 420) return 30
  if (duration <= 1200) return 60
  return 300
}

export function formatTimelineTime(
  seconds: number,
) {
  const safe = Math.max(0, seconds)
  const minutes = Math.floor(safe / 60)
  const rest = safe - minutes * 60

  return (
    `${String(minutes).padStart(2, '0')}:`
    + `${rest.toFixed(2).padStart(5, '0')}`
  )
}
