import type { AlphaContent, AlphaState } from './types'

export type EditorTrack =
  | 'captions'
  | 'xr'
  | 'images'
  | 'motion'
  | 'broll'
  | 'vo'
  | 'aroll'
  | 'story'
  | 'sfx'
  | 'music'
  | 'transition'

export interface EditorDirective {
  resourceId: string
  type: string
  track: EditorTrack
  state: AlphaState
  start: number
  end: number
  label: string
  description: string
  text: string
  speaker: string
  routes: string[]
  parentResourceId: string | null
  raw: Record<string, unknown>
}

export interface GhostInfoField {
  key: string
  label: string
  value: string
}

export interface GhostInspectorData {
  resourceId: string
  type: string
  track: EditorTrack
  state: AlphaState
  start: number
  end: number
  label: string
  description: string
  text: string
  speaker: string
  parentResourceId: string | null
  routes: string[]
  promptFields: GhostInfoField[]
  referenceFields: GhostInfoField[]
  actionFields: GhostInfoField[]
  allFields: GhostInfoField[]
}

const VALID_TRACKS = new Set<EditorTrack>([
  'captions', 'xr', 'images', 'motion', 'broll',
  'vo', 'aroll', 'story', 'sfx', 'music', 'transition',
])

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function str(value: unknown) {
  return value == null ? '' : String(value)
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeTrack(trackValue: unknown, typeValue: unknown): EditorTrack | null {
  const aliases: Record<string, EditorTrack> = {
    caption: 'captions', subtitle: 'captions', subtitles: 'captions',
    voiceover: 'vo', voice_over: 'vo',
    'a-roll': 'aroll', a_roll: 'aroll',
    'b-roll': 'broll', b_roll: 'broll',
    image: 'images', images: 'images', photo: 'images', still: 'images',
    sound: 'sfx', fx: 'sfx',
  }

  const rawTrack = str(trackValue).trim().toLowerCase()
  const rawType = str(typeValue).trim().toLowerCase()
  const track = (aliases[rawTrack] ?? rawTrack) as EditorTrack

  if (VALID_TRACKS.has(track)) return track

  const fallback = (aliases[rawType] ?? rawType) as EditorTrack
  return VALID_TRACKS.has(fallback) ? fallback : null
}

function routesOf(raw: Record<string, unknown>) {
  if (Array.isArray(raw.routes)) return raw.routes.map(str).filter(Boolean)
  const route = str(raw.route)
  return route ? [route] : []
}

function stateOf(raw: Record<string, unknown>, track: EditorTrack): AlphaState {
  const state = str(raw.state) as AlphaState

  if (
    state === 'ghost'
    || state === 'planned'
    || state === 'ready'
    || state === 'materialized'
    || state === 'approved'
  ) {
    return state
  }

  if (str(raw.status).toLowerCase().startsWith('pending')) return 'ghost'
  return track === 'story' ? 'planned' : 'ghost'
}

function parseRawDirective(value: unknown, index: number): EditorDirective | null {
  const raw = rec(value)
  const track = normalizeTrack(raw.track, raw.type ?? raw.kind)

  if (!track) return null

  const start = num(raw.start ?? raw.t0)
  if (start == null) return null

  const duration = num(raw.duration ?? raw.durationSeconds)
  const rawEnd = num(raw.end ?? raw.t1)
  const end =
    rawEnd != null && rawEnd > start
      ? rawEnd
      : start + (duration != null && duration > 0 ? duration : track === 'sfx' ? 0.25 : 1)

  return {
    resourceId: str(raw.id ?? raw.resourceId) || `editor_${index}`,
    type: str(raw.type ?? raw.kind) || track,
    track,
    state: stateOf(raw, track),
    start,
    end,
    label: str(raw.label ?? raw.role ?? raw.title) || track.toUpperCase(),
    description: str(
      raw.function
      ?? raw.description
      ?? raw.imageDescription
      ?? raw.purpose
      ?? rec(raw.asset).description
      ?? rec(raw.asset).shortDescription
    ),
    text: str(raw.displayText ?? raw.text),
    speaker: str(raw.speaker),
    routes: routesOf(raw),
    parentResourceId: str(raw.parentResourceId ?? raw.parentId) || null,
    raw,
  }
}

function rawTimeline(content: AlphaContent) {
  const value = content.sourcePayload.timeline
  return Array.isArray(value) ? value : []
}

function scalar(value: unknown) {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function flatten(value: unknown, prefix = '', depth = 0): GhostInfoField[] {
  if (depth > 3 || value == null) return []

  if (Array.isArray(value)) {
    const scalars = value.map(scalar).filter(Boolean)
    if (scalars.length === value.length && scalars.length > 0) {
      return [{ key: prefix, label: prefix, value: scalars.join(' · ') }]
    }

    return value.flatMap((item, index) =>
      flatten(item, `${prefix}[${index}]`, depth + 1)
    )
  }

  if (typeof value !== 'object') {
    const formatted = scalar(value)
    return formatted && prefix ? [{ key: prefix, label: prefix, value: formatted }] : []
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key, depth + 1)
  )
}

function uniqueFields(fields: GhostInfoField[]) {
  const seen = new Set<string>()

  return fields.filter((field) => {
    const signature = `${field.key}::${field.value}`
    if (seen.has(signature)) return false
    seen.add(signature)
    return true
  })
}

export function getEditorRoutes(content: AlphaContent) {
  const routes = new Set(content.routes.filter(Boolean))

  for (const item of rawTimeline(content)) {
    for (const route of routesOf(rec(item))) routes.add(route)
  }

  const result = [...routes]
  return result.length ? result : ['default']
}

export function preferredEditorRoute(content: AlphaContent, current: string) {
  const routes = getEditorRoutes(content)
  if (routes.includes(current)) return current
  if (routes.includes('source')) return 'source'
  if (routes.includes('voA')) return 'voA'
  if (routes.includes('voB')) return 'voB'
  return routes[0]
}

export function getEditorDirectives(content: AlphaContent) {
  const raw = rawTimeline(content)
  const source = raw.length
    ? raw.map(parseRawDirective).filter((item): item is EditorDirective => item !== null)
    : content.timelineDirectives
        .map((item, index) => parseRawDirective({ ...item, id: item.resourceId }, index))
        .filter((item): item is EditorDirective => item !== null)

  const seen = new Set<string>()

  return source
    .filter((item) => {
      if (seen.has(item.resourceId)) return false
      seen.add(item.resourceId)
      return true
    })
    .sort(
      (a, b) =>
        a.start - b.start
        || a.end - b.end
        || a.resourceId.localeCompare(b.resourceId)
    )
}

export function selectEditorDirectivesForRoute(content: AlphaContent, route: string) {
  return getEditorDirectives(content).filter(
    (item) => item.routes.length === 0 || item.routes.includes(route)
  )
}

export function getGhostInspectorData(directive: EditorDirective): GhostInspectorData {
  const allFields = uniqueFields(flatten(directive.raw))
  const signature = (field: GhostInfoField) => `${field.key} ${field.label}`

  return {
    resourceId: directive.resourceId,
    type: directive.type,
    track: directive.track,
    state: directive.state,
    start: directive.start,
    end: directive.end,
    label: directive.label,
    description: directive.description,
    text: directive.text,
    speaker: directive.speaker,
    parentResourceId: directive.parentResourceId,
    routes: directive.routes,
    promptFields: allFields.filter((field) => /(prompt|generate|generation)/iu.test(signature(field))),
    referenceFields: allFields.filter((field) => /(search|reference|croll|c-roll|visual|image|asset|source)/iu.test(signature(field))),
    actionFields: allFields.filter((field) => /(motion|sfx|sound|instruction|function|purpose|description|mix|trigger)/iu.test(signature(field))),
    allFields,
  }
}
