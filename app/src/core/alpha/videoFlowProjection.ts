import VideoFlow, { type VideoJSON } from '@videoflow/core'
import {
  selectEditorDirectivesForRoute,
  type EditorDirective,
} from './alphaEditorDirectives'
import type { AlphaContent } from './types'

export interface AlphaVideoFlowProjection {
  video: VideoJSON
  route: string
  resourceToLayer: Record<string, string>
  layerToResource: Record<string, string>
  projectedResourceCount: number
  ghostCount: number
}

const FPS = 30
const FRAME = 1 / FPS

function compact(value: string, max = 86) {
  const normalized = value.replace(/\s+/gu, ' ').trim()
  return normalized.length <= max
    ? normalized
    : `${normalized.slice(0, max - 1)}…`
}

function placeholderText(directive: EditorDirective) {
  return (
    `👻 ${directive.track.toUpperCase()} · ${compact(directive.label, 34)}\n`
    + compact(directive.description || directive.text || 'Agregar contenido')
  )
}

function frameTime(seconds: number) {
  return Math.max(0, Math.round(seconds * FPS) / FPS)
}

function timingOf(directive: EditorDirective) {
  const start = frameTime(directive.start)
  const end = Math.max(start + FRAME, frameTime(directive.end))
  return { start, duration: end - start }
}

function canvasFor(content: AlphaContent) {
  if (content.orientation === 'vertical') return { width: 1080, height: 1920 }
  if (content.orientation === 'square') return { width: 1080, height: 1080 }
  return { width: 1920, height: 1080 }
}

/**
 * Canonical Ghost projection:
 * every pending/editorial resource is a real VideoFlow GroupLayer.
 * A hidden TextLayer child carries the short placeholder instruction.
 * Future materialisation adds real children to the SAME group/resourceId.
 */
export async function projectAlphaToVideoFlow(
  content: AlphaContent,
  route: string,
): Promise<AlphaVideoFlowProjection> {
  const canvas = canvasFor(content)
  const flow = new VideoFlow({
    name: `${content.title} · ${route} · Abraxas`,
    width: canvas.width,
    height: canvas.height,
    fps: FPS,
    backgroundColor: '#08090b',
    autoDetectDurations: false,
  })

  const resourceToLayer: Record<string, string> = {}
  const layerToResource: Record<string, string> = {}
  const directives = selectEditorDirectivesForRoute(content, route)

  flow.parallel(
    directives.map((directive) => () => {
      const timing = timingOf(directive)

      if (timing.start > 0) flow.wait(timing.start)

      const group = flow.group(
        { opacity: 1 },
        {},
        () => {
          flow.addText({
            text: placeholderText(directive),
            fontSize: 1.5,
            color: '#ffffff',
            position: [0.5, 0.5],
            // Editorial child: exists inside the Group but does not clutter preview/export.
            opacity: 0,
          })

          flow.wait(timing.duration)
        },
      )

      resourceToLayer[directive.resourceId] = group.id
      layerToResource[group.id] = directive.resourceId
    }),
  )

  if (directives.length === 0) {
    flow.group(
      { opacity: 1 },
      {},
      () => {
        flow.addText({
          text: `👻 Sin directivas para ${route}`,
          fontSize: 1.5,
          color: '#ffffff',
          opacity: 0,
        })
        flow.wait(1)
      },
    )
  }

  return {
    video: await flow.compile(),
    route,
    resourceToLayer,
    layerToResource,
    projectedResourceCount: directives.length,
    ghostCount: directives.filter((item) => item.state === 'ghost').length,
  }
}
