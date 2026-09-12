import VideoFlow, {
  type VideoJSON,
} from '@videoflow/core'
import type {
  AlphaContent,
  AlphaDirective,
  AlphaTrack,
} from './types'

export interface AlphaVideoFlowProjection {
  video: VideoJSON
  resourceToLayer: Record<string, string>
  layerToResource: Record<string, string>
  projectedResourceCount: number
  ghostCount: number
}

const FPS = 30
const FRAME = 1 / FPS

const TRACK_Y: Record<AlphaTrack, number> = {
  story: 0.10,
  aroll: 0.22,
  vo: 0.32,
  captions: 0.84,
  xr: 0.44,
  broll: 0.52,
  motion: 0.60,
  transition: 0.68,
  sfx: 0.76,
  music: 0.92,
}

const TRACK_COLOR: Record<AlphaTrack, string> = {
  story: '#cbd5e1',
  aroll: '#e2e8f0',
  vo: '#ddd6fe',
  captions: '#bfdbfe',
  xr: '#e9d5ff',
  broll: '#a7f3d0',
  motion: '#fde68a',
  transition: '#fecaca',
  sfx: '#bbf7d0',
  music: '#bae6fd',
}

function short(value: string, max = 108) {
  const compact = value.replace(/\s+/gu, ' ').trim()

  return compact.length <= max
    ? compact
    : `${compact.slice(0, max - 1)}…`
}

function ghostText(directive: AlphaDirective) {
  const icon = directive.state === 'ghost' ? '👻' : '◆'
  const track = directive.track.toUpperCase()
  const primary =
    directive.text
    || directive.description
    || directive.label
    || directive.type

  const speaker =
    directive.speaker
      ? ` · ${directive.speaker}`
      : ''

  return `${icon} ${track}${speaker}\n${short(primary)}`
}

function frameTime(seconds: number) {
  return Math.max(0, Math.round(seconds * FPS) / FPS)
}

function timingFor(directive: AlphaDirective) {
  const startTime = frameTime(directive.start)
  const requestedEnd = frameTime(directive.end)
  const endTime = Math.max(startTime + FRAME, requestedEnd)

  return {
    startTime,
    sourceDuration: endTime - startTime,
  }
}

function canvasFor(content: AlphaContent) {
  if (content.orientation === 'vertical') {
    return { width: 1080, height: 1920 }
  }

  if (content.orientation === 'square') {
    return { width: 1080, height: 1080 }
  }

  return { width: 1920, height: 1080 }
}

function yFor(track: AlphaTrack, index: number) {
  const offset = ((index % 3) - 1) * 0.022

  return Math.max(
    0.06,
    Math.min(0.94, TRACK_Y[track] + offset),
  )
}

function validDirectives(content: AlphaContent) {
  return content.timelineDirectives
    .filter(
      (directive) =>
        Number.isFinite(directive.start)
        && Number.isFinite(directive.end)
        && directive.end > directive.start,
    )
    .sort(
      (a, b) =>
        a.start - b.start
        || a.end - b.end,
    )
}

/**
 * Alpha Production Graph -> VideoFlow projection.
 *
 * Every valid audiovisual TimelineDirective becomes one real TextLayer
 * placeholder in VideoFlow. Exact semantic timing remains in Production Graph;
 * the VideoFlow projection is intentionally frame-aligned at 30fps.
 */
export async function projectAlphaToVideoFlow(
  content: AlphaContent,
): Promise<AlphaVideoFlowProjection> {
  const canvas = canvasFor(content)

  const flow = new VideoFlow({
    name: `${content.title} · Abraxas`,
    width: canvas.width,
    height: canvas.height,
    fps: FPS,
    backgroundColor: '#08090b',
    autoDetectDurations: false,
  })

  const resourceToLayer: Record<string, string> = {}
  const layerToResource: Record<string, string> = {}

  const directives = validDirectives(content)

  directives.forEach((directive, index) => {
    const timing = timingFor(directive)

    const layer = flow.addText(
      {
        text: ghostText(directive),
        fontSize:
          directive.track === 'captions'
            ? 2.5
            : 1.8,
        color: TRACK_COLOR[directive.track],
        position: [
          0.5,
          yFor(directive.track, index),
        ],
        opacity:
          directive.state === 'ghost'
            ? 0.78
            : 0.94,
      },
      {
        startTime: timing.startTime,
        sourceDuration: timing.sourceDuration,
      },
    )

    resourceToLayer[directive.resourceId] = layer.id
    layerToResource[layer.id] = directive.resourceId
  })

  if (directives.length === 0) {
    const fallback = flow.addText(
      {
        text: '👻 ALPHA · Sin directivas temporales',
        fontSize: 2,
        color: '#ffffff',
        position: [0.5, 0.5],
      },
      {
        startTime: 0,
        sourceDuration: 1,
      },
    )

    resourceToLayer.__alpha_empty__ = fallback.id
    layerToResource[fallback.id] = '__alpha_empty__'
  }

  const video = await flow.compile()

  return {
    video,
    resourceToLayer,
    layerToResource,
    projectedResourceCount: directives.length,
    ghostCount: directives.filter(
      (directive) => directive.state === 'ghost',
    ).length,
  }
}
