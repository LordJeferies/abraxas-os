import type {
  AlphaContent,
  AlphaDirective,
  AlphaEnvelope,
  AlphaSlide,
  AlphaTrack,
} from './types'

const VIDEO_WORDS = [
  'video',
  'intro',
  'vertical',
  'horizontal',
  'reel',
  'clip',
  'podcast',
  'full_episode',
]

const STATIC_WORDS = [
  'carousel',
  'carrusel',
  'static',
  'slide',
  'thread',
  'hilo',
  'quote',
  'nota',
  'pdf',
]

function str(value: unknown) {
  return value == null ? '' : String(value)
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, value)
  }

  const raw = str(value).trim()
  if (!raw) return null

  if (!raw.includes(':')) {
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? Math.max(0, parsed) : null
  }

  const parts = raw.split(':').map(Number)
  if (parts.some((part) => !Number.isFinite(part))) return null

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }

  return null
}

function words(value: string) {
  return value.trim()
    ? value.trim().split(/\s+/u).length
    : 0
}

function estimate(value: string) {
  return Math.max(2.5, words(value) / 2.35 + 0.5)
}

function stable(prefix: string, ...parts: unknown[]) {
  const raw = parts.map(str).join('|')
  let hash = 2166136261

  for (let index = 0; index < raw.length; index += 1) {
    hash ^= raw.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return `${prefix}_${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function orientation(piece: Record<string, unknown>) {
  const joined = [
    piece.orientation,
    piece.format,
    piece.kind,
    piece.type,
    piece.id,
    piece.canonicalId,
  ].map(str).join(' ').toLowerCase()

  if (joined.includes('vertical') || joined.includes('9:16')) return 'vertical'
  if (joined.includes('horizontal') || joined.includes('16:9')) return 'horizontal'
  if (joined.includes('square') || joined.includes('1:1')) return 'square'
  return 'unspecified'
}

function contentType(piece: Record<string, unknown>): AlphaContent['contentType'] {
  const raw = str(
    piece.kind
    ?? piece.type
    ?? piece.variant
  ).toLowerCase()

  if (VIDEO_WORDS.some((word) => raw.includes(word))) return 'video'
  if (STATIC_WORDS.some((word) => raw.includes(word))) return 'static'
  return 'other'
}

function normalizeTrack(
  trackValue: unknown,
  typeValue: unknown,
): [AlphaTrack, AlphaTrack] {
  const aliases: Record<string, AlphaTrack> = {
    'caption': 'captions',
    'subtitle': 'captions',
    'subtitles': 'captions',
    'voiceover': 'vo',
    'voice_over': 'vo',
    'a-roll': 'aroll',
    'a_roll': 'aroll',
    'b-roll': 'broll',
    'b_roll': 'broll',
    'image': 'images',
    'images': 'images',
    'photo': 'images',
    'still': 'images',
    'sound': 'sfx',
    'fx': 'sfx',
  }

  const rawTrack = (
    aliases[str(trackValue).toLowerCase()]
    ?? str(trackValue).toLowerCase()
  ) as AlphaTrack

  const rawType = (
    aliases[str(typeValue).toLowerCase()]
    ?? str(typeValue).toLowerCase()
  ) as AlphaTrack

  const valid: AlphaTrack[] = [
    'story',
    'aroll',
    'vo',
    'captions',
    'xr',
    'images',
    'broll',
    'motion',
    'transition',
    'sfx',
    'music',
  ]

  const track = valid.includes(rawTrack)
    ? rawTrack
    : valid.includes(rawType)
    ? rawType
    : 'story'

  const type = valid.includes(rawType)
    ? rawType
    : track

  return [track, type]
}

function directive(
  input: Partial<AlphaDirective>
  & Pick<AlphaDirective, 'resourceId' | 'track' | 'type' | 'start' | 'end'>,
): AlphaDirective {
  return {
    state: input.type === 'story' ? 'planned' : 'ghost',
    label: input.type.toUpperCase(),
    description: '',
    text: '',
    speaker: '',
    routes: [],
    assetBindings: [],
    parameters: {},
    ...input,
    end: Math.max(input.start + 0.01, input.end),
  }
}

function explicitTimeline(
  piece: Record<string, unknown>,
  contentId: string,
) {
  if (!Array.isArray(piece.timeline)) return []

  return piece.timeline
    .filter((item): item is Record<string, unknown> =>
      Boolean(item)
      && typeof item === 'object'
      && !Array.isArray(item)
    )
    .map((item, index) => {
      const [track, type] = normalizeTrack(
        item.track,
        item.type ?? item.kind,
      )

      const start = num(
        item.start ?? item.t0,
      ) ?? 0

      const end = num(
        item.end ?? item.t1,
      )
        ?? start + (
          num(item.duration)
          ?? num(item.durationSeconds)
          ?? estimate(
            str(
              item.text
              ?? item.displayText
              ?? item.label
            )
          )
        )

      const parentResourceId = (
        str(
          item.parentResourceId
          ?? item.parentId
        )
        || null
      )

      const groupRole = (
        item.groupRole === 'parent'
        || item.groupRole === 'child'
      )
        ? item.groupRole
        : parentResourceId
        ? 'child'
        : track === 'xr'
        ? 'parent'
        : null

      return directive({
        resourceId:
          str(
            item.id
            ?? item.resourceId
          )
          || stable(
            'res',
            contentId,
            'explicit',
            index,
          ),

        track,
        type,
        start,
        end,

        state:
          type === 'story'
            ? 'planned'
            : 'ghost',

        label:
          str(
            item.label
            ?? item.role
            ?? item.title
          )
          || type.toUpperCase(),

        description:
          str(
            item.function
            ?? item.description
            ?? item.imageDescription
            ?? item.purpose
          ),

        text:
          str(
            item.displayText
            ?? item.text
          ),

        speaker:
          str(item.speaker),

        routes:
          Array.isArray(item.routes)
            ? item.routes
                .map(str)
                .filter(Boolean)
            : item.route
            ? [str(item.route)]
            : [],

        presetId:
          item.presetId
            ? str(item.presetId)
            : null,

        parentResourceId,
        groupRole,

        assetBindings:
          Array.isArray(item.assetIds)
            ? item.assetIds.map(str)
            : [],

        sourceRange: (
          item.sourceStart != null
          || item.sourceEnd != null
          || item.startTc != null
          || item.endTc != null
        )
          ? {
              start:
                item.sourceStart
                ?? item.startTc,

              end:
                item.sourceEnd
                ?? item.endTc,
            }
          : null,

        parameters: {
          sourceUnitId:
            item.sourceUnitId,

          partId:
            item.partId,

          timingStatus:
            item.timingStatus,

          raw:
            item,
        },
      })
    })
}

function partsTimeline(
  piece: Record<string, unknown>,
  contentId: string,
) {
  const parts = Array.isArray(piece.parts) ? piece.parts : []
  const result: AlphaDirective[] = []
  let cursor = 0

  parts.forEach((rawPart, index) => {
    if (!rawPart || typeof rawPart !== 'object') return
    const part = rawPart as Record<string, unknown>
    const editing = (
      part.editing && typeof part.editing === 'object'
        ? part.editing
        : {}
    ) as Record<string, unknown>

    const start = num(part.t0) ?? cursor
    const end = num(part.t1)
      ?? start + (
        num(part.duration)
        ?? num(editing.duration_seconds)
        ?? estimate(str(part.text))
      )

    cursor = Math.max(cursor, end)

    const partId = str(part.id ?? part.part_id)
      || stable('part', contentId, index)

    const role = str(part.role ?? part.beatGoal) || `Parte ${index + 1}`
    const text = str(part.text)
    const source = (
      part.source && typeof part.source === 'object'
        ? part.source
        : {}
    ) as Record<string, unknown>

    const speaker = str(part.speaker ?? source.speaker)
    const sourceRange = (
      source.in != null || source.out != null
    )
      ? { start: source.in, end: source.out }
      : (
          part.start != null || part.end != null
        )
        ? { start: part.start, end: part.end }
        : null

    result.push(
      directive({
        resourceId: `${partId}_story`,
        track: 'story',
        type: 'story',
        start,
        end,
        label: role,
        description: str(part.narrativeEdit ?? part.beatGoal),
        text,
        speaker,
        sourceRange,
        parameters: { partId, raw: part },
      }),
      directive({
        resourceId: `${partId}_aroll`,
        track: 'aroll',
        type: 'aroll',
        start,
        end,
        label: speaker || 'A-roll',
        description: str(part.edit ?? editing.instruction),
        text,
        speaker,
        sourceRange,
        parameters: { partId },
      }),
      directive({
        resourceId: `${partId}_captions`,
        track: 'captions',
        type: 'captions',
        start,
        end,
        label: 'Subtítulos',
        description: str(piece.subtitles),
        text,
        speaker,
        parameters: { partId },
      }),
    )

    const assets = Array.isArray(part.assets) ? part.assets : []

    assets.forEach((rawAsset, assetIndex) => {
      if (!rawAsset || typeof rawAsset !== 'object') return
      const asset = rawAsset as Record<string, unknown>
      const category = str(asset.category ?? asset.type).toUpperCase()

      if (category !== 'XR') {
        // Los antiguos "BR" se conservan en sourcePayload.
        // No se reinterpretan como el nuevo B-roll sin confirmación.
        return
      }

      const offset = num(asset.offset_seconds) ?? 0
      const duration = num(asset.duration_seconds) ?? Math.min(6, end - start)
      const xrStart = start + offset
      const xrEnd = Math.min(end, xrStart + Math.max(0.25, duration))
      const xrId = str(asset.asset_id ?? asset.id)
        || stable('xr', contentId, partId, assetIndex)

      result.push(
        directive({
          resourceId: xrId,
          track: 'xr',
          type: 'xr',
          start: xrStart,
          end: xrEnd,
          label: str(asset.family ?? asset.description) || 'XR',
          description: str(asset.purpose ?? asset.visual_function ?? asset.description),
          presetId: asset.family ? str(asset.family) : null,
          parameters: {
            raw: asset,
            cRollReference: asset.search ?? asset.croll ?? null,
          },
        }),
      )

      if (asset.motion) {
        result.push(
          directive({
            resourceId: `${xrId}_motion`,
            track: 'motion',
            type: 'motion',
            start: xrStart,
            end: xrEnd,
            label: 'Motion XR',
            description: str(asset.motion),
            parentResourceId: xrId,
            parameters: { targetResourceId: xrId },
          }),
        )
      }

      const sfx = str(asset.sfx)
      if (sfx && !sfx.toLowerCase().includes('sin sfx')) {
        const sound = (
          asset.sound && typeof asset.sound === 'object'
            ? asset.sound
            : {}
        ) as Record<string, unknown>

        const fraction = Math.max(
          0,
          Math.min(1, Number(sound.when_fraction ?? 0) || 0)
        )
        const sfxStart = xrStart + (xrEnd - xrStart) * fraction

        result.push(
          directive({
            resourceId: `${xrId}_sfx`,
            track: 'sfx',
            type: 'sfx',
            start: sfxStart,
            end: Math.min(xrEnd, sfxStart + 0.25),
            label: sfx,
            description: str(sound.function),
            parentResourceId: xrId,
            parameters: { raw: sound },
          }),
        )
      }
    })
  })

  return result
}

function xrsTimeline(
  piece: Record<string, unknown>,
  contentId: string,
) {
  if (!Array.isArray(piece.xrs)) return []

  const result: AlphaDirective[] = []

  piece.xrs.forEach((rawXr, index) => {
    if (!rawXr || typeof rawXr !== 'object') return
    const xr = rawXr as Record<string, unknown>

    const start = num(xr.t0) ?? 0
    const end = num(xr.t1) ?? start + (num(xr.duration) ?? 6)
    const xrId = str(xr.id) || stable('xr', contentId, index)

    result.push(
      directive({
        resourceId: xrId,
        track: 'xr',
        type: 'xr',
        start,
        end,
        label: str(xr.label ?? xr.familyName) || 'XR',
        description: str(xr.function ?? xr.summary),
        presetId: xr.family || xr.familyName
          ? str(xr.family ?? xr.familyName)
          : null,
        groupRole: 'parent',
        parameters: {
          isGroup: true,
          family: xr.family,
          familyName: xr.familyName,
          assetMode: xr.assetMode,
          continuity: xr.continuity,
          textStyle: xr.textStyle,
          // El antiguo broll alternativo se conserva como
          // referencia C-roll/búsqueda dentro del XR.
          cRollReference: (
            xr.broll && typeof xr.broll === 'object'
              ? xr.broll
              : null
          ),
          raw: xr,
        },
      }),
    )

    const states = Array.isArray(xr.states) ? xr.states : []

    states.forEach((rawState, stateIndex) => {
      if (!rawState || typeof rawState !== 'object') return
      const state = rawState as Record<string, unknown>

      result.push(
        directive({
          resourceId: str(state.id)
            || stable('xrstate', xrId, stateIndex),
          track: 'xr',
          type: 'xr',
          start: num(state.t0) ?? start,
          end: num(state.t1) ?? end,
          label: str(state.label) || `Estado ${stateIndex + 1}`,
          description: str(state.description),
          parentResourceId: xrId,
          groupRole: 'child',
          assetBindings: Array.isArray(state.assetIds)
            ? state.assetIds.map(str)
            : [],
          parameters: {
            motion: state.motion,
            raw: state,
          },
        }),
      )
    })

    if (xr.motion) {
      result.push(
        directive({
          resourceId: `${xrId}_motion`,
          track: 'motion',
          type: 'motion',
          start,
          end,
          label: 'Motion XR',
          description: str(xr.motion),
          parentResourceId: xrId,
          parameters: { targetResourceId: xrId },
        }),
      )
    }

    if (Array.isArray(xr.sfx)) {
      xr.sfx.forEach((rawSfx, sfxIndex) => {
        if (!rawSfx || typeof rawSfx !== 'object') return
        const sfx = rawSfx as Record<string, unknown>
        const sfxStart = num(sfx.t0) ?? start

        result.push(
          directive({
            resourceId: str(sfx.id)
              || stable('sfx', xrId, sfxIndex),
            track: 'sfx',
            type: 'sfx',
            start: sfxStart,
            end: num(sfx.t1) ?? Math.min(end, sfxStart + 0.25),
            label: str(sfx.name) || 'SFX',
            description: str(sfx.description ?? sfx.trigger),
            parentResourceId: xrId,
            parameters: {
              search: sfx.search,
              mix: sfx.mix,
              trigger: sfx.trigger,
              raw: sfx,
            },
          }),
        )
      })
    }
  })

  return result
}

function staticGraph(
  piece: Record<string, unknown>,
  contentId: string,
) {
  if (contentType(piece) !== 'static') return null

  const parts = Array.isArray(piece.parts) ? piece.parts : []
  const slides: AlphaSlide[] = parts
    .filter((part): part is Record<string, unknown> =>
      Boolean(part) && typeof part === 'object'
    )
    .map((part, index) => {
      const assets = Array.isArray(part.assets) ? part.assets : []

      return {
        slideId: str(part.part_id ?? part.id)
          || stable('slide', contentId, index),
        index: index + 1,
        role: str(part.role),
        text: str(part.text),
        visual: str(part.visual),
        composition: str(part.composition),
        prompt: str(part.prompt_override),
        state: assets.length ? 'materialized' : 'ghost',
        assets,
        raw: part,
      }
    })

  return {
    schemaVersion: 'abraxas.static-visual-graph.v1' as const,
    slides,
  }
}

function pieceRoutes(piece: Record<string, unknown>) {
  const routes: string[] = []

  if (
    piece.storyScripts
    && typeof piece.storyScripts === 'object'
    && !Array.isArray(piece.storyScripts)
  ) {
    routes.push(...Object.keys(piece.storyScripts))
  }

  if (Array.isArray(piece.timeline)) {
    piece.timeline.forEach((raw) => {
      if (!raw || typeof raw !== 'object') return
      const item = raw as Record<string, unknown>

      if (Array.isArray(item.routes)) {
        routes.push(...item.routes.map(str))
      }
    })
  }

  return [...new Set(routes)].length
    ? [...new Set(routes)]
    : ['default']
}

function normalizePiece(
  piece: Record<string, unknown>,
  index: number,
  documentId: string,
  sourceName: string,
  sourceFamily: string,
) {
  const originalId = str(
    piece.canonicalId
    ?? piece.contentId
    ?? piece.content_id
    ?? piece.uid
    ?? piece.id
    ?? `piece-${index + 1}`
  )

  const contentId =
    originalId
    || stable(
      'content',
      documentId,
      index,
    )

  const type =
    contentType(piece)

  let timeline =
    explicitTimeline(
      piece,
      contentId,
    )

  const hasRichExplicitTimeline =
    timeline.some(
      (item) =>
        [
          'vo',
          'xr',
          'images',
          'motion',
          'broll',
          'sfx',
          'music',
          'transition',
        ].includes(
          item.track,
        ),
    )

  if (
    !timeline.length
    && type === 'video'
  ) {
    timeline =
      partsTimeline(
        piece,
        contentId,
      )
  }

  if (
    type === 'video'
    && !hasRichExplicitTimeline
  ) {
    const known =
      new Set(
        timeline.map(
          (item) =>
            item.resourceId,
        ),
      )

    xrsTimeline(
      piece,
      contentId,
    ).forEach(
      (item) => {
        if (
          !known.has(
            item.resourceId,
          )
        ) {
          known.add(
            item.resourceId,
          )

          timeline.push(
            item,
          )
        }
      },
    )
  }

  const duration =
    Math.max(
      num(piece.durationSeconds)
      ?? 0,

      num(piece.duration)
      ?? 0,

      ...timeline.map(
        (item) =>
          item.end,
      ),
    )

  const title =
    str(piece.title)
    || originalId

  const payloadForRevision =
    JSON.stringify({
      title,
      timeline,
      staticGraph:
        staticGraph(
          piece,
          contentId,
        ),
      copies:
        piece.copies
        ?? piece.copy
        ?? null,
    })

  const revisionId =
    `${contentId}@${stable(
      'rev',
      payloadForRevision,
    ).slice(-8)}`

  const copies = (
    piece.copies
    && typeof piece.copies === 'object'
      ? piece.copies
      : piece.copy
      ? {
          default:
            piece.copy,
        }
      : {}
  ) as Record<string, unknown>

  return {
    schemaVersion:
      'abraxas.alpha-content.v1' as const,

    contentId,
    revisionId,
    title,

    thesis:
      str(piece.thesis),

    objective:
      str(piece.objective),

    contentType:
      type,

    orientation:
      orientation(piece),

    status:
      str(
        piece.status
        ?? piece.workflow_status
        ?? 'alpha',
      ),

    routes:
      pieceRoutes(piece),

    durationSeconds:
      duration,

    timelineDirectives:
      timeline.sort(
        (a, b) =>
          a.start - b.start
          || a.end - b.end,
      ),

    staticGraph:
      staticGraph(
        piece,
        contentId,
      ),

    copyVariants:
      copies,

    provenance: [
      {
        sourceName,
        sourceFamily,
        originalPieceId:
          originalId,
      },
    ],

    sourcePayload:
      piece,
  } satisfies AlphaContent
}

function choosePayload(
  html: string,
) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const scripts = [
    ...doc.querySelectorAll<HTMLScriptElement>(
      'script[type="application/json"], script#app-data, script#seed'
    ),
  ]

  const candidates = scripts
    .map((script) => {
      try {
        const value = JSON.parse(script.textContent ?? '')
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
          return null
        }

        const payload = value as Record<string, unknown>
        const score =
          (Array.isArray(payload.pieces) ? 100 : 0)
          + (script.id === 'app-data' ? 40 : 0)
          + (script.id === 'seed' ? 35 : 0)
          + (payload.schemaVersion ? 20 : 0)
          + (payload.schema ? 15 : 0)

        return { payload, score, scriptId: script.id || 'application-json' }
      } catch {
        return null
      }
    })
    .filter(Boolean) as Array<{
      payload: Record<string, unknown>
      score: number
      scriptId: string
    }>

  candidates.sort((a, b) => b.score - a.score)

  if (!candidates[0] || !Array.isArray(candidates[0].payload.pieces)) {
    throw new Error(
      'No encontré JSON Alfa embebido con una lista pieces.'
    )
  }

  return candidates[0]
}

function family(payload: Record<string, unknown>) {
  const schemaVersion = str(payload.schemaVersion).toLowerCase()
  const schema = str(payload.schema).toLowerCase()

  if (schemaVersion.includes('abrxos.alpha.story-editor')) {
    return 'abrxos-alpha-story-editor'
  }

  if (schema === 'joc-story-editor-r5') {
    return 'joc-story-editor-r5'
  }

  if (
    payload.families
    && payload.sources
    && Array.isArray(payload.pieces)
  ) {
    return 'joc-mesa-editorial'
  }

  return 'generic-pieces-json'
}

export function migrateAlphaEnvelope(
  document: AlphaEnvelope,
): AlphaEnvelope {
  return {
    ...document,

    contents:
      document.contents.map(
        (content, index) => {
          const raw =
            content.sourcePayload

          if (
            !raw
            || typeof raw !== 'object'
            || Array.isArray(raw)
          ) {
            return content
          }

          const piece =
            raw as Record<string, unknown>

          if (
            !Array.isArray(piece.timeline)
            && !Array.isArray(piece.parts)
            && !Array.isArray(piece.xrs)
          ) {
            return content
          }

          try {
            return normalizePiece(
              piece,
              index,
              document.documentId,
              document.sourceName,
              document.sourceFamily,
            )
          } catch {
            return content
          }
        },
      ),
  }
}

export async function importAlphaFile(
  file: File,
): Promise<AlphaEnvelope> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  let payload: Record<string, unknown>
  let sourceFormat: string
  let sourceFamily: string

  if (extension === 'json') {
    const parsed = JSON.parse(await file.text())

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('El JSON raíz debe ser un objeto.')
    }

    payload = parsed as Record<string, unknown>
    sourceFormat = 'json'
    sourceFamily = family(payload)
  } else {
    const selected = choosePayload(await file.text())
    payload = selected.payload
    sourceFormat = `html:${selected.scriptId}`
    sourceFamily = family(payload)
  }

  const identity = str(
    payload.projectId
    ?? payload.collection
    ?? payload.documentType
    ?? payload.title
    ?? payload.name
    ?? payload.version
    ?? file.name
  )

  const identityKey = `${sourceFamily}:${identity}`
  const documentId = stable('alpha_doc', identityKey)
  const pieces = payload.pieces as unknown[]

  return {
    schemaVersion: 'abraxas.alpha-import-envelope.v1',
    documentId,
    identityKey,
    title: str(
      payload.title
      ?? payload.name
      ?? payload.documentType
      ?? identity
    ),
    sourceFamily,
    sourceFormat,
    sourceName: file.name,
    contents: pieces
      .filter((piece): piece is Record<string, unknown> =>
        Boolean(piece) && typeof piece === 'object' && !Array.isArray(piece)
      )
      .map((piece, index) =>
        normalizePiece(
          piece,
          index,
          documentId,
          file.name,
          sourceFamily,
        )
      ),
  }
}

export function diffAlpha(
  previous: AlphaEnvelope | null,
  next: AlphaEnvelope,
) {
  if (!previous || previous.documentId !== next.documentId) {
    return {
      added: next.contents,
      changed: [],
      unchanged: [],
      removed: [],
      requiresConfirmation: false,
    }
  }

  const before = new Map(
    previous.contents.map((item) => [item.contentId, item])
  )
  const after = new Map(
    next.contents.map((item) => [item.contentId, item])
  )

  const added: AlphaContent[] = []
  const changed: AlphaContent[] = []
  const unchanged: AlphaContent[] = []
  const removed: AlphaContent[] = []

  after.forEach((item, id) => {
    const old = before.get(id)

    if (!old) {
      added.push(item)
    } else if (old.revisionId !== item.revisionId) {
      changed.push(item)
    } else {
      unchanged.push(item)
    }
  })

  before.forEach((item, id) => {
    if (!after.has(id)) removed.push(item)
  })

  return {
    added,
    changed,
    unchanged,
    removed,
    requiresConfirmation: Boolean(
      added.length || changed.length || removed.length
    ),
  }
}
