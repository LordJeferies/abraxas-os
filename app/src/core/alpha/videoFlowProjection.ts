import VideoFlow, {
  type VideoJSON,
} from '@videoflow/core'
import {
  selectEditorDirectivesForRoute,
  type EditorDirective,
  type EditorTrack,
} from './alphaEditorDirectives'
import type {
  AlphaContent,
} from './types'

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

const TRACK_Y:
  Record<EditorTrack, number> = {
    captions: 0.08,
    xr: 0.18,
    images: 0.28,
    motion: 0.38,
    broll: 0.48,
    vo: 0.58,
    aroll: 0.68,
    story: 0.76,
    sfx: 0.86,
    music: 0.94,
    transition: 0.98,
  }

const TRACK_COLOR:
  Record<EditorTrack, string> = {
    captions: '#d4d1d2',
    xr: '#d6a1e8',
    images: '#ad9bd8',
    motion: '#d9959d',
    broll: '#9d8568',
    vo: '#a9d1aa',
    aroll: '#a9c5d4',
    story: '#d7a9b8',
    sfx: '#e9d98a',
    music: '#92bfae',
    transition: '#c6a2a0',
  }

function compact(
  value: string,
  max = 100,
) {
  const normalized =
    value
      .replace(/\s+/gu, ' ')
      .trim()

  return normalized.length <= max
    ? normalized
    : `${normalized.slice(0, max - 1)}…`
}

function ghostText(
  directive: EditorDirective,
) {
  const marker =
    directive.state === 'ghost'
      ? '👻'
      : '◆'

  const primary =
    directive.text
    || directive.description
    || directive.label
    || directive.type

  return (
    `${marker} ${directive.track.toUpperCase()}`
    + ` · ${compact(directive.label, 34)}\n`
    + compact(primary)
  )
}

function canvasFor(
  content: AlphaContent,
) {
  if (
    content.orientation === 'vertical'
  ) {
    return {
      width: 1080,
      height: 1920,
    }
  }

  if (
    content.orientation === 'square'
  ) {
    return {
      width: 1080,
      height: 1080,
    }
  }

  return {
    width: 1920,
    height: 1080,
  }
}

function frameTime(
  seconds: number,
) {
  return Math.max(
    0,
    Math.round(
      seconds * FPS,
    ) / FPS,
  )
}

function timingFor(
  directive: EditorDirective,
) {
  const startTime =
    frameTime(
      directive.start,
    )

  const requestedEnd =
    frameTime(
      directive.end,
    )

  const endTime =
    Math.max(
      startTime + FRAME,
      requestedEnd,
    )

  return {
    startTime,
    sourceDuration:
      endTime - startTime,
  }
}

export async function projectAlphaToVideoFlow(
  content: AlphaContent,
  route: string,
): Promise<AlphaVideoFlowProjection> {
  const canvas =
    canvasFor(content)

  const flow =
    new VideoFlow({
      name:
        `${content.title} · ${route} · Abraxas`,

      width:
        canvas.width,

      height:
        canvas.height,

      fps: FPS,

      backgroundColor:
        '#08090b',

      autoDetectDurations:
        false,
    })

  const resourceToLayer:
    Record<string, string> = {}

  const layerToResource:
    Record<string, string> = {}

  const directives =
    selectEditorDirectivesForRoute(
      content,
      route,
    )

  directives.forEach(
    (
      directive,
      index,
    ) => {
      const timing =
        timingFor(
          directive,
        )

      const layer =
        flow.addText(
          {
            text:
              ghostText(
                directive,
              ),

            fontSize:
              directive.track
              === 'captions'
                ? 2.4
                : 1.6,

            color:
              TRACK_COLOR[
                directive.track
              ],

            position: [
              0.5,
              Math.min(
                0.98,
                TRACK_Y[
                  directive.track
                ]
                + (
                  (index % 2)
                  * 0.004
                ),
              ),
            ],

            opacity:
              directive.state
              === 'ghost'
                ? 0.14
                : 0.90,
          },

          {
            startTime:
              timing.startTime,

            sourceDuration:
              timing.sourceDuration,
          },
        )

      resourceToLayer[
        directive.resourceId
      ] = layer.id

      layerToResource[
        layer.id
      ] = directive.resourceId
    },
  )

  if (
    directives.length === 0
  ) {
    const fallback =
      flow.addText(
        {
          text:
            `👻 Sin directivas para ${route}`,

          fontSize: 2,

          color:
            '#ffffff',

          position:
            [0.5, 0.5],
        },

        {
          startTime: 0,
          sourceDuration: 1,
        },
      )

    resourceToLayer[
      '__alpha_empty__'
    ] = fallback.id

    layerToResource[
      fallback.id
    ] = '__alpha_empty__'
  }

  const video =
    await flow.compile()

  return {
    video,
    route,
    resourceToLayer,
    layerToResource,
    projectedResourceCount:
      directives.length,
    ghostCount:
      directives.filter(
        (item) =>
          item.state === 'ghost',
      ).length,
  }
}
