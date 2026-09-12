import type { AlphaContent, AlphaDirective, AlphaState, AlphaTrack } from './types'

export type EditorTrack = AlphaTrack

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
  groupRole: 'parent' | 'child' | null
  raw: Record<string, unknown>
  parameters: Record<string, unknown>
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

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function stringValue(value: unknown) {
  return value == null ? '' : String(value)
}

function toEditorDirective(directive: AlphaDirective): EditorDirective {
  const raw = record(directive.parameters.raw)
  const editorPrompt = stringValue(directive.parameters.editorPrompt)

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
    routes: directive.routes,
    parentResourceId: directive.parentResourceId ?? null,
    groupRole: directive.groupRole ?? null,
    raw: editorPrompt ? { ...raw, abraxasEditorPrompt: editorPrompt } : raw,
    parameters: directive.parameters,
  }
}

function scalar(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : ''
}

function flatten(value: unknown, prefix = '', depth = 0): GhostInfoField[] {
  if (value == null || depth > 4) return []

  if (Array.isArray(value)) {
    const values = value.map(scalar).filter(Boolean)
    if (values.length === value.length && values.length > 0) {
      return [{ key: prefix, label: prefix, value: values.join(' · ') }]
    }
    return value.flatMap((item, index) => flatten(item, `${prefix}[${index}]`, depth + 1))
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
  const routes = new Set<string>(content.routes.filter(Boolean))
  for (const directive of content.timelineDirectives) {
    for (const route of directive.routes) if (route) routes.add(route)
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
  const seen = new Set<string>()

  return content.timelineDirectives
    .filter((directive) => {
      if (!Number.isFinite(directive.start) || !Number.isFinite(directive.end)) return false
      if (directive.end <= directive.start || seen.has(directive.resourceId)) return false
      seen.add(directive.resourceId)
      return true
    })
    .map(toEditorDirective)
    .sort((a, b) => a.start - b.start || a.end - b.end || a.resourceId.localeCompare(b.resourceId))
}

export function selectEditorDirectivesForRoute(content: AlphaContent, route: string) {
  return getEditorDirectives(content).filter(
    (item) => item.routes.length === 0 || item.routes.includes(route),
  )
}

export function getGhostInspectorData(directive: EditorDirective): GhostInspectorData {
  const mergedRaw = {
    ...directive.raw,
    __abraxas: {
      resourceId: directive.resourceId,
      type: directive.type,
      track: directive.track,
      state: directive.state,
      start: directive.start,
      end: directive.end,
      duration: directive.end - directive.start,
      parentResourceId: directive.parentResourceId,
      routes: directive.routes,
      editorPrompt: directive.parameters.editorPrompt ?? null,
    },
  }

  const allFields = uniqueFields(flatten(mergedRaw))
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
    actionFields: allFields.filter((field) => /(motion|sfx|sound|instruction|function|purpose|description|mix|trigger|change|locked|exit)/iu.test(signature(field))),
    allFields,
  }
}
