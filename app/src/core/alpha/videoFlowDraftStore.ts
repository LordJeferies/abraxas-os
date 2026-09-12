import type { VideoJSON } from '@videoflow/core'

export interface AlphaVideoFlowDraft {
  schemaVersion: 'abraxas.videoflow-draft.v3'
  contentId: string
  revisionId: string
  route: string
  video: VideoJSON
  resourceToLayer: Record<string, string>
  layerToResource: Record<string, string>
  updatedAt: string
}

const DB_NAME = 'abraxas-videoflow-drafts-v3'
const DB_VERSION = 1
const STORE_NAME = 'drafts'

function draftKey(contentId: string, route: string) {
  return `${contentId}::${route}`
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

export async function loadVideoFlowDraft(
  contentId: string,
  route: string,
): Promise<AlphaVideoFlowDraft | null> {
  const db = await openDatabase()
  if (!db) return null

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(draftKey(contentId, route))

    request.onsuccess = () => {
      const value = request.result as AlphaVideoFlowDraft | undefined
      resolve(
        value
        && value.schemaVersion === 'abraxas.videoflow-draft.v3'
        && value.contentId === contentId
        && value.route === route
          ? value
          : null
      )
    }

    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function saveVideoFlowDraft(draft: AlphaVideoFlowDraft): Promise<void> {
  const db = await openDatabase()
  if (!db) return

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(
      draft,
      draftKey(draft.contentId, draft.route),
    )
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function deleteVideoFlowDraft(
  contentId: string,
  route: string,
): Promise<void> {
  const db = await openDatabase()
  if (!db) return

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(draftKey(contentId, route))
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => reject(tx.error)
  })
}
