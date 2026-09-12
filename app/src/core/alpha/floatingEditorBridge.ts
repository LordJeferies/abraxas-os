import type {
  GhostInspectorData,
} from './alphaEditorDirectives'
import type {
  TrackSlotId,
} from './alphaTimelineModel'

export interface FloatingTimelineItem {
  resourceId: string
  slotId: TrackSlotId
  state: string
  start: number
  end: number
  label: string
}

export interface FloatingEditorSnapshot {
  schemaVersion: 'abraxas.floating-editor.v2'
  title: string
  contentId: string
  route: string
  selectedResourceId: string
  selected: GhostInspectorData | null
  items: FloatingTimelineItem[]
  duration: number
  updatedAt: string
}

type FloatingMessage =
  | {
      type: 'snapshot'
      payload: FloatingEditorSnapshot
    }
  | {
      type: 'select-resource'
      resourceId: string
    }

const STORAGE_KEY = 'abraxas.floating-editor.snapshot.v2'
const CHANNEL = 'abraxas-floating-editor-v2'

function makeChannel() {
  return typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(CHANNEL)
    : null
}

export function publishFloatingSnapshot(
  snapshot: FloatingEditorSnapshot,
) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Floating UI failure must never break the editor.
  }

  const target = makeChannel()
  if (target) {
    target.postMessage({ type: 'snapshot', payload: snapshot } satisfies FloatingMessage)
    target.close()
  }
}

export function readFloatingSnapshot(): FloatingEditorSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as FloatingEditorSnapshot
    return parsed.schemaVersion === 'abraxas.floating-editor.v2'
      ? parsed
      : null
  } catch {
    return null
  }
}

export function subscribeFloatingSnapshot(
  callback: (snapshot: FloatingEditorSnapshot) => void,
) {
  const target = makeChannel()
  if (!target) return () => undefined

  target.onmessage = (event: MessageEvent<FloatingMessage>) => {
    if (event.data.type === 'snapshot') {
      callback(event.data.payload)
    }
  }

  return () => target.close()
}

export function sendFloatingSelection(resourceId: string) {
  const target = makeChannel()
  if (target) {
    target.postMessage({ type: 'select-resource', resourceId } satisfies FloatingMessage)
    target.close()
  }
}

export function subscribeFloatingSelection(
  callback: (resourceId: string) => void,
) {
  const target = makeChannel()
  if (!target) return () => undefined

  target.onmessage = (event: MessageEvent<FloatingMessage>) => {
    if (event.data.type === 'select-resource') {
      callback(event.data.resourceId)
    }
  }

  return () => target.close()
}
