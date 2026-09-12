import VideoFlow, { type VideoJSON } from '@videoflow/core'
import {
  getGhostInspectorData,
  selectEditorDirectivesForRoute,
  type EditorDirective,
  type GhostInfoField,
} from './alphaEditorDirectives'
import {
  TRACK_SLOTS_ENGINE_ORDER,
  slotForItem,
} from './alphaTimelineModel'
import type { AlphaContent } from './types'

export interface AlphaVideoFlowProjection {
  video: VideoJSON
  route: string
  resourceToLayer: Record<string, string>
  layerToResource: Record<string, string>
  projectedResourceCount: number
  ghostCount: number
  trackContainerCount: number
  nestedGhostCount: number
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

interface ExpectedTiming {
  startTime: number
  sourceDuration: number
  name: string
}

const FPS = 30
const FRAME = 1 / FPS

function compact(value: string, max = 120) {
  const normalized = value.replace(/\s+/gu, ' ').trim()
  return normalized.length <= max
    ? normalized
    : `${normalized.slice(0, max - 1)}…`
}

function frameTime(seconds: number) {
  return Math.max(0, Math.round(seconds * FPS) / FPS)
}

function timing(start: number, end: number) {
  const startTime = frameTime(start)
  const endTime = Math.max(startTime + FRAME, frameTime(end))
  return {
    startTime,
    sourceDuration: endTime - startTime,
  }
}

function fieldCards(
  prefix: string,
  fields: GhostInfoField[],
  maxItems: number,
) {
  return fields.slice(0, maxItems).map((field, index) => ({
    name: `${prefix} ${index + 1} · ${field.label}`,
    text: compact(field.value),
  }))
}

function infoCards(directive: EditorDirective) {
  const info = getGhostInspectorData(directive)

  return [
    {
      name: '01 · QUÉ VA AQUÍ',
      text: compact(
        directive.description
        || directive.text
        || directive.label
        || 'Agregar contenido',
      ),
    },
    {
      name: '02 · TIMING',
      text:
        `${directive.start.toFixed(3)} → ${directive.end.toFixed(3)}`
        + ` · ${(directive.end - directive.start).toFixed(3)} s`,
    },
    ...fieldCards('03 · PROMPT', info.promptFields, 3),
    ...fieldCards('04 · REFERENCIA', info.referenceFields, 3),
    ...fieldCards('05 · HACER', info.actionFields, 3),
  ]
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

function flattenLayers(layers: MutableLayer[]): MutableLayer[] {
  return layers.flatMap(
    (layer) => [
      layer,
      ...flattenLayers(layer.children ?? []),
    ],
  )
}

function normalizeTimings(
  video: VideoJSON,
  expected: Map<string, ExpectedTiming>,
  duration: number,
) {
  const mutable = video as unknown as MutableVideo

  for (const layer of flattenLayers(mutable.layers)) {
    const value = expected.get(layer.id)
    if (!value) continue

    layer.settings = {
      ...(layer.settings ?? {}),
      startTime: value.startTime,
      sourceDuration: value.sourceDuration,
      name: value.name,
    }
  }

  mutable.duration = Math.max(1, duration)
}

/**
 * Abraxas fixed track topology:
 *
 * T1 A-ROLL
 * T2 XR
 * T3 IMAGES
 * T4 MOTION / TRANSITIONS
 * T5 B-ROLL
 * T6 VO JOC
 * T7 SFX
 * T8 MUSIC
 * T9 CAPTIONS
 *
 * The 9 top-level VideoFlow layers are structural Track Container Groups.
 * Every real resource is a nested Group Ghost. Children with parentResourceId
 * stay inside their parent Ghost, so XR images/motion/SFX never become extra
 * top-level tracks.
 */
export async function projectAlphaToVideoFlow(
  content: AlphaContent,
  route: string,
): Promise<AlphaVideoFlowProjection> {
  const canvas = canvasFor(content)
  const directives = selectEditorDirectivesForRoute(content, route)
    .filter((item) => item.track !== 'story')

  const duration = Math.max(
    content.durationSeconds || 0,
    ...directives.map((item) => item.end),
    1,
  )

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
  const expected = new Map<string, ExpectedTiming>()
  const byId = new Map(directives.map((item) => [item.resourceId, item]))
  const childrenByParent = new Map<string, EditorDirective[]>()

  for (const item of directives) {
    if (!item.parentResourceId || !byId.has(item.parentResourceId)) continue

    const children = childrenByParent.get(item.parentResourceId) ?? []
    children.push(item)
    childrenByParent.set(item.parentResourceId, children)
  }

  let nestedGhostCount = 0

  const addGhost = (
    item: EditorDirective,
    parentAbsoluteStart: number,
  ) => {
    const relativeStart = Math.max(0, item.start - parentAbsoluteStart)
    const relativeEnd = relativeStart + Math.max(FRAME, item.end - item.start)
    const relativeTiming = timing(relativeStart, relativeEnd)

    const group = flow.group(
      { opacity: 1 },
      {
        startTime: relativeTiming.startTime,
        sourceDuration: relativeTiming.sourceDuration,
        name:
          `${item.state === 'ghost' ? 'Ghost' : 'Resource'}`
          + ` · ${item.track} · ${item.label}`,
      },
      () => {
        for (const card of infoCards(item)) {
          const textLayer = flow.addText(
            {
              text: card.text,
              opacity: 0,
              fontSize: 1.1,
              color: '#ffffff',
              position: [0.5, 0.5],
            },
            {
              startTime: 0,
              sourceDuration: relativeTiming.sourceDuration,
              name: card.name,
            },
          )

          expected.set(textLayer.id, {
            startTime: 0,
            sourceDuration: relativeTiming.sourceDuration,
            name: card.name,
          })
        }

        const children = (childrenByParent.get(item.resourceId) ?? [])
          .slice()
          .sort((a, b) => a.start - b.start || a.end - b.end)

        for (const child of children) {
          nestedGhostCount += 1
          addGhost(child, item.start)
        }
      },
    )

    resourceToLayer[item.resourceId] = group.id
    layerToResource[group.id] = item.resourceId
    expected.set(group.id, {
      startTime: relativeTiming.startTime,
      sourceDuration: relativeTiming.sourceDuration,
      name:
        `${item.state === 'ghost' ? 'Ghost' : 'Resource'}`
        + ` · ${item.track} · ${item.label}`,
    })
  }

  flow.parallel(
    TRACK_SLOTS_ENGINE_ORDER.map((slot) => () => {
      const trackGroup = flow.group(
        { opacity: 1 },
        {
          startTime: 0,
          sourceDuration: frameTime(duration),
          name: `${slot.id} · ${slot.shortLabel}`,
        },
        () => {
          // Structural marker guarantees an empty canonical track still exists.
          const marker = flow.addText(
            {
              text: `${slot.id} · ${slot.shortLabel}`,
              opacity: 0,
              fontSize: 1,
              color: '#ffffff',
            },
            {
              startTime: 0,
              sourceDuration: frameTime(duration),
              name: `${slot.id} · TRACK MARKER`,
            },
          )

          expected.set(marker.id, {
            startTime: 0,
            sourceDuration: frameTime(duration),
            name: `${slot.id} · TRACK MARKER`,
          })

          const roots = directives
            .filter((item) => !item.parentResourceId || !byId.has(item.parentResourceId))
            .filter((item) => slotForItem(item)?.id === slot.id)
            .sort((a, b) => a.start - b.start || a.end - b.end)

          for (const root of roots) {
            addGhost(root, 0)
          }
        },
      )

      expected.set(trackGroup.id, {
        startTime: 0,
        sourceDuration: frameTime(duration),
        name: `${slot.id} · ${slot.shortLabel}`,
      })
    }),
  )

  const video = await flow.compile()
  normalizeTimings(video, expected, duration)

  return {
    video,
    route,
    resourceToLayer,
    layerToResource,
    projectedResourceCount: Object.keys(resourceToLayer).length,
    ghostCount: directives.filter((item) => item.state === 'ghost').length,
    trackContainerCount: video.layers.length,
    nestedGhostCount,
  }
}
