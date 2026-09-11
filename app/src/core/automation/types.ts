export type AutomationDirectiveType =
  | 'cut'
  | 'caption'
  | 'motion'
  | 'xr'
  | 'broll'
  | 'sfx'
  | 'music'
  | 'transition'

export type ProductionResourceState =
  | 'ghost'
  | 'planned'
  | 'ready'
  | 'materialized'
  | 'approved'

export interface TimeRange {
  start: number
  end: number
}

export interface AssetReference {
  id: string
  pathRef: string
  kind: 'image' | 'video' | 'audio' | 'sfx' | 'music'
  tags?: string[]
}

export interface CaptionPreset {
  id: string
  maxLines: number
  maxCharsPerLine: number
  minDurationMs: number
  maxDurationMs: number
  position: 'top' | 'center' | 'bottom'
  emphasisMode:
    | 'none'
    | 'keyword'
    | 'speaker'
    | 'semantic'
}

export interface MotionPreset {
  id: string
  kind:
    | 'zoom-in'
    | 'zoom-out'
    | 'pan-left'
    | 'pan-right'
    | 'push-in'
    | 'pull-out'
    | 'ken-burns'
    | 'parallax'
    | 'hold'
  strength: number
  easing?: string
}

export interface AutomationDirective
  extends TimeRange {
  id: string
  type: AutomationDirectiveType
  state: ProductionResourceState
  reason?: string
  confidence?: number
  presetId?: string
  assetQuery?: string
  assetId?: string
  parameters?: Record<string, unknown>
}

export interface AutomationPlan {
  schemaVersion: 'abraxas.automation-plan.v1'
  sourceId: string
  presetId?: string
  directives: AutomationDirective[]
}

/**
 * Ghost = existe la necesidad semántica, pero todavía no existe
 * el recurso físico/materializado.
 *
 * Ejemplo:
 * XR ghost 01:20.0–01:24.0
 * -> asset resolver encuentra 3 fotos
 * -> motion engine aplica preset
 * -> transition engine compone
 * -> mismo directive pasa a materialized.
 */
export function isGhost(
  directive: AutomationDirective
): boolean {
  return directive.state === 'ghost'
}
