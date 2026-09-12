export type AlphaState =
  | 'ghost'
  | 'planned'
  | 'ready'
  | 'materialized'
  | 'approved'

export type AlphaTrack =
  | 'story'
  | 'aroll'
  | 'vo'
  | 'captions'
  | 'xr'
  | 'broll'
  | 'motion'
  | 'transition'
  | 'sfx'
  | 'music'

export interface AlphaDirective {
  resourceId: string
  type: string
  track: AlphaTrack
  state: AlphaState
  start: number
  end: number
  label: string
  description: string
  text: string
  speaker: string
  routes: string[]
  presetId?: string | null
  parentResourceId?: string | null
  groupRole?: 'parent' | 'child' | null
  assetBindings: string[]
  sourceRange?: {
    start?: unknown
    end?: unknown
  } | null
  parameters: Record<string, unknown>
}

export interface AlphaSlide {
  slideId: string
  index: number
  role: string
  text: string
  visual: string
  composition: string
  prompt: string
  state: AlphaState
  assets: unknown[]
  raw: Record<string, unknown>
}

export interface AlphaContent {
  schemaVersion: 'abraxas.alpha-content.v1'
  contentId: string
  revisionId: string
  title: string
  thesis: string
  objective: string
  contentType: 'video' | 'static' | 'other'
  orientation: string
  status: string
  routes: string[]
  durationSeconds: number
  timelineDirectives: AlphaDirective[]
  staticGraph?: {
    schemaVersion: 'abraxas.static-visual-graph.v1'
    slides: AlphaSlide[]
  } | null
  copyVariants: Record<string, unknown>
  provenance: Array<Record<string, unknown>>
  sourcePayload: Record<string, unknown>
}

export interface AlphaEnvelope {
  schemaVersion: 'abraxas.alpha-import-envelope.v1'
  documentId: string
  identityKey: string
  title: string
  sourceFamily: string
  sourceFormat: string
  sourceName: string
  contents: AlphaContent[]
}
