import { create } from 'zustand'
import type { AlphaContent, AlphaDirective } from './types'

export interface AlphaResourceEdit {
  label?: string
  description?: string
  text?: string
  prompt?: string
}

export interface AlphaContentFieldEdit {
  title?: string
  thesis?: string
  objective?: string
  status?: string
  copy?: string
  notes?: string
}

export interface AlphaContentEditOverlay {
  schemaVersion: 'abraxas.alpha-content-edit.v1'
  documentId: string
  contentId: string
  baseRevisionId: string
  content: AlphaContentFieldEdit
  resources: Record<string, AlphaResourceEdit>
  updatedAt: string
}

interface AlphaEditState {
  hydrated: boolean
  overlays: Record<string, AlphaContentEditOverlay>
  hydrate: () => Promise<void>
  patchContent: (documentId: string, content: AlphaContent, patch: AlphaContentFieldEdit) => void
  patchResource: (documentId: string, content: AlphaContent, resourceId: string, patch: AlphaResourceEdit) => void
  resetContent: (documentId: string, contentId: string) => void
}

const DB_NAME = 'abraxas-alpha-content-edits-v1'
const DB_VERSION = 1
const STORE_NAME = 'edits'

function editKey(documentId: string, contentId: string) {
  return `${documentId}::${contentId}`
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function readAll(): Promise<AlphaContentEditOverlay[]> {
  const db = await openDatabase()
  if (!db) return []

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAll()

    request.onsuccess = () => {
      const values = Array.isArray(request.result) ? request.result : []
      resolve(values.filter((item): item is AlphaContentEditOverlay =>
        Boolean(item && item.schemaVersion === 'abraxas.alpha-content-edit.v1')
      ))
    }

    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

async function writeOverlay(overlay: AlphaContentEditOverlay) {
  const db = await openDatabase()
  if (!db) return

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(overlay, editKey(overlay.documentId, overlay.contentId))
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

async function deleteOverlay(documentId: string, contentId: string) {
  const db = await openDatabase()
  if (!db) return

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(editKey(documentId, contentId))
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => reject(tx.error)
  })
}

function emptyOverlay(documentId: string, content: AlphaContent): AlphaContentEditOverlay {
  return {
    schemaVersion: 'abraxas.alpha-content-edit.v1',
    documentId,
    contentId: content.contentId,
    baseRevisionId: content.revisionId,
    content: {},
    resources: {},
    updatedAt: new Date().toISOString(),
  }
}

let hydratePromise: Promise<void> | null = null

export const useAlphaEditStore = create<AlphaEditState>((set, get) => ({
  hydrated: false,
  overlays: {},

  hydrate: async () => {
    if (get().hydrated) return

    if (!hydratePromise) {
      hydratePromise = readAll()
        .then((values) => {
          const overlays: Record<string, AlphaContentEditOverlay> = {}
          for (const overlay of values) overlays[editKey(overlay.documentId, overlay.contentId)] = overlay
          set({ overlays, hydrated: true })
        })
        .catch((error) => {
          console.error('Alpha edit hydration failed', error)
          set({ hydrated: true })
        })
        .finally(() => { hydratePromise = null })
    }

    await hydratePromise
  },

  patchContent: (documentId, content, patch) => {
    const key = editKey(documentId, content.contentId)
    const current = get().overlays[key] ?? emptyOverlay(documentId, content)
    const next: AlphaContentEditOverlay = {
      ...current,
      baseRevisionId: content.revisionId,
      content: { ...current.content, ...patch },
      updatedAt: new Date().toISOString(),
    }

    set({ overlays: { ...get().overlays, [key]: next } })
    void writeOverlay(next).catch((error) => console.error('Alpha content edit persist failed', error))
  },

  patchResource: (documentId, content, resourceId, patch) => {
    const key = editKey(documentId, content.contentId)
    const current = get().overlays[key] ?? emptyOverlay(documentId, content)
    const next: AlphaContentEditOverlay = {
      ...current,
      baseRevisionId: content.revisionId,
      resources: {
        ...current.resources,
        [resourceId]: { ...current.resources[resourceId], ...patch },
      },
      updatedAt: new Date().toISOString(),
    }

    set({ overlays: { ...get().overlays, [key]: next } })
    void writeOverlay(next).catch((error) => console.error('Alpha resource edit persist failed', error))
  },

  resetContent: (documentId, contentId) => {
    const key = editKey(documentId, contentId)
    const overlays = { ...get().overlays }
    delete overlays[key]
    set({ overlays })
    void deleteOverlay(documentId, contentId).catch((error) => console.error('Alpha edit reset failed', error))
  },
}))

export function getAlphaOverlay(
  overlays: Record<string, AlphaContentEditOverlay>,
  documentId: string,
  contentId: string,
) {
  return overlays[editKey(documentId, contentId)] ?? null
}

function applyResourceEdit(directive: AlphaDirective, edit: AlphaResourceEdit | undefined): AlphaDirective {
  if (!edit) return directive

  return {
    ...directive,
    label: edit.label ?? directive.label,
    description: edit.description ?? directive.description,
    text: edit.text ?? directive.text,
    parameters: {
      ...directive.parameters,
      ...(edit.prompt !== undefined ? { editorPrompt: edit.prompt } : {}),
    },
  }
}

export function applyAlphaEdits(content: AlphaContent, overlay: AlphaContentEditOverlay | null): AlphaContent {
  if (!overlay) return content

  return {
    ...content,
    revisionId: `${content.revisionId}+edit@${overlay.updatedAt}`,
    title: overlay.content.title ?? content.title,
    thesis: overlay.content.thesis ?? content.thesis,
    objective: overlay.content.objective ?? content.objective,
    status: overlay.content.status ?? content.status,
    timelineDirectives: content.timelineDirectives.map((directive) =>
      applyResourceEdit(directive, overlay.resources[directive.resourceId])
    ),
  }
}

export function overlayText(
  overlay: AlphaContentEditOverlay | null,
  field: 'copy' | 'notes',
  fallback: string,
) {
  const value = overlay?.content[field]
  return value !== undefined ? value : fallback
}
