import VideoFlow, {
  type VideoJSON,
} from '@videoflow/core'
import {
  getGhostInspectorData,
  selectEditorDirectivesForRoute,
  type EditorDirective,
  type GhostInfoField,
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

interface MutableLayer {
  id: string
  type?: string
  settings?: Record<string, unknown>
  children?: MutableLayer[]
}

interface MutableVideo {
  duration: number
  layers: MutableLayer[]
}

interface ChildCard {
  name: string
  text: string
}

const FPS = 30
const FRAME = 1 / FPS

function compact(
  value: string,
  max = 150,
) {
  const normalized =
    value
      .replace(/\s+/gu, ' ')
      .trim()

  return normalized.length <= max
    ? normalized
    : `${normalized.slice(0, max - 1)}…`
}

function frameTime(
  seconds: number,
) {
  return Math.max(
    0,
    Math.round(seconds * FPS) / FPS,
  )
}

function timingOf(
  directive: EditorDirective,
) {
  const startTime =
    frameTime(directive.start)

  const endTime =
    Math.max(
      startTime + FRAME,
      frameTime(directive.end),
    )

  return {
    startTime,
    sourceDuration:
      endTime - startTime,
    endTime,
  }
}

function fieldCards(
  prefix: string,
  fields: GhostInfoField[],
  maxItems: number,
) {
  return fields
    .slice(0, maxItems)
    .map(
      (field, index): ChildCard => ({
        name:
          `${prefix} ${String(index + 1).padStart(2, '0')} · ${field.label}`,

        text:
          compact(field.value),
      }),
    )
}

function cardsFor(
  directive: EditorDirective,
): ChildCard[] {
  const info =
    getGhostInspectorData(
      directive,
    )

  const cards: ChildCard[] = [
    {
      name:
        '01 · QUÉ VA AQUÍ',

      text:
        compact(
          directive.description
          || directive.text
          || directive.label
          || 'Agregar contenido',
        ),
    },

    {
      name:
        '02 · TIMING',

      text:
        `${directive.start.toFixed(3)}s → ${directive.end.toFixed(3)}s`
        + ` · duración ${(directive.end - directive.start).toFixed(3)}s`,
    },
  ]

  cards.push(
    ...fieldCards(
      '03 · PROMPT',
      info.promptFields,
      4,
    ),

    ...fieldCards(
      '04 · REFERENCIA',
      info.referenceFields,
      4,
    ),

    ...fieldCards(
      '05 · HACER',
      info.actionFields,
      4,
    ),
  )

  return cards.length
    ? cards
    : [{
        name:
          '01 · QUÉ VA AQUÍ',

        text:
          'Agregar contenido',
      }]
}

function childY(
  index: number,
  total: number,
) {
  if (total <= 1) {
    return 0.5
  }

  const top = 0.16
  const bottom = 0.84
  const step =
    (bottom - top)
    / Math.max(
      1,
      total - 1,
    )

  return Math.min(
    bottom,
    top
    + index * step,
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

function normalizeCompiledTiming(
  video: VideoJSON,
  expected:
    Map<
      string,
      {
        startTime: number
        sourceDuration: number
        name: string
      }
    >,
  maxEnd: number,
) {
  const mutable =
    video as unknown as MutableVideo

  for (
    const layer
    of mutable.layers
  ) {
    const timing =
      expected.get(
        layer.id,
      )

    if (!timing) {
      continue
    }

    layer.settings = {
      ...(layer.settings ?? {}),
      startTime:
        timing.startTime,
      sourceDuration:
        timing.sourceDuration,
      name:
        timing.name,
    }

    for (
      const child
      of layer.children
      ?? []
    ) {
      child.settings = {
        ...(child.settings ?? {}),
        startTime: 0,
        sourceDuration:
          timing.sourceDuration,
      }
    }
  }

  mutable.duration =
    Math.max(
      1,
      maxEnd,
    )
}

/**
 * Contract:
 *   Alpha resource -> ONE VideoFlow GroupLayer
 *   Group startTime  = Alpha start
 *   Group duration   = Alpha end - Alpha start
 *   resourceId       <-> GroupLayer.id
 *
 * The group contains ordered editorial TextLayer children:
 *   01 what goes here
 *   02 timing
 *   03 prompts
 *   04 references/assets
 *   05 actions/motion/sfx/etc.
 *
 * The child text is hidden from preview/render but remains inspectable inside
 * the Group. We intentionally do NOT use wait(start) inside parallel branches.
 */
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

  const expected =
    new Map<
      string,
      {
        startTime: number
        sourceDuration: number
        name: string
      }
    >()

  const directives =
    selectEditorDirectivesForRoute(
      content,
      route,
    )

  flow.parallel(
    directives.map(
      (
        directive,
      ) =>
        () => {
          const timing =
            timingOf(
              directive,
            )

          const cards =
            cardsFor(
              directive,
            )

          const group =
            flow.group(
              {
                opacity: 1,
              },

              {
                startTime:
                  timing.startTime,

                sourceDuration:
                  timing.sourceDuration,

                name:
                  `Ghost · ${directive.track} · ${directive.label}`,
              },

              () => {
                cards.forEach(
                  (
                    card,
                    index,
                  ) => {
                    flow.addText(
                      {
                        text:
                          card.text,

                        fontSize:
                          1.35,

                        color:
                          '#ffffff',

                        position: [
                          0.5,
                          childY(
                            index,
                            cards.length,
                          ),
                        ],

                        // Editorial child only.
                        opacity: 0,
                      },

                      {
                        startTime: 0,

                        sourceDuration:
                          timing.sourceDuration,

                        name:
                          card.name,
                      },
                    )
                  },
                )
              },
            )

          resourceToLayer[
            directive.resourceId
          ] = group.id

          layerToResource[
            group.id
          ] = directive.resourceId

          expected.set(
            group.id,
            {
              startTime:
                timing.startTime,

              sourceDuration:
                timing.sourceDuration,

              name:
                `Ghost · ${directive.track} · ${directive.label}`,
            },
          )
        },
    ),
  )

  const video =
    await flow.compile()

  const maxEnd =
    Math.max(
      content.durationSeconds
      || 0,

      ...directives.map(
        (item) =>
          timingOf(
            item,
          ).endTime,
      ),

      1,
    )

  normalizeCompiledTiming(
    video,
    expected,
    maxEnd,
  )

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
