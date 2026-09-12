import { create } from 'zustand'
import type { AlphaEnvelope } from './types'
import { migrateAlphaEnvelope } from './normalizeAlpha'

export type AlphaTimelineMode = 'temporal' | 'semantic'

interface PersistedAlphaWorkspace {
  schemaVersion: 'abraxas.alpha-workspace-state.v1'
  documents: AlphaEnvelope[]
  activeDocumentId: string
  selectedContentId: string
  selectedResourceId: string
  route: string
  playhead: number
  timelineMode: AlphaTimelineMode
}

interface AlphaWorkspaceState extends PersistedAlphaWorkspace {
  hydrated: boolean
  history: Record<string, AlphaEnvelope[]>
  hydrate: () => Promise<void>
  upsertDocument: (document: AlphaEnvelope) => void
  selectDocument: (documentId: string) => void
  selectContent: (contentId: string) => void
  selectResource: (resourceId: string) => void
  setRoute: (route: string) => void
  setPlayhead: (playhead: number) => void
  setTimelineMode: (mode: AlphaTimelineMode) => void
  undoDocument: () => void
  clearWorkspace: () => void
}

const DB_NAME = 'abraxas-alpha-workspace'
const DB_VERSION = 1
const STORE_NAME = 'workspace'
const STATE_KEY = 'current'

function blankPersisted(): PersistedAlphaWorkspace {
  return {
    schemaVersion: 'abraxas.alpha-workspace-state.v1',
    documents: [],
    activeDocumentId: '',
    selectedContentId: '',
    selectedResourceId: '',
    route: 'all',
    playhead: 0,
    timelineMode: 'temporal',
  }
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null)
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function readPersisted():
  Promise<PersistedAlphaWorkspace | null> {
  const db =
    await openDatabase()

  if (!db) {
    return null
  }

  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const tx =
        db.transaction(
          STORE_NAME,
          'readonly',
        )

      const store =
        tx.objectStore(
          STORE_NAME,
        )

      const request =
        store.get(
          STATE_KEY,
        )

      request.onsuccess =
        () => {
          const value =
            request.result as
              | PersistedAlphaWorkspace
              | undefined

          if (
            value?.schemaVersion
            !== 'abraxas.alpha-workspace-state.v1'
          ) {
            resolve(null)
            return
          }

          resolve({
            ...value,

            documents:
              value.documents.map(
                migrateAlphaEnvelope,
              ),
          })
        }

      request.onerror =
        () =>
          reject(
            request.error,
          )

      tx.oncomplete =
        () =>
          db.close()
    },
  )
}

async function writePersisted(
  value: PersistedAlphaWorkspace,
): Promise<void> {
  const db = await openDatabase()
  if (!db) return

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    store.put(value, STATE_KEY)

    tx.oncomplete = () => {
      db.close()
      resolve()
    }

    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

async function clearPersisted(): Promise<void> {
  const db = await openDatabase()
  if (!db) return

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(STATE_KEY)

    tx.oncomplete = () => {
      db.close()
      resolve()
    }

    tx.onerror = () => reject(tx.error)
  })
}

function persistedSnapshot(
  state: AlphaWorkspaceState,
): PersistedAlphaWorkspace {
  return {
    schemaVersion: 'abraxas.alpha-workspace-state.v1',
    documents: state.documents,
    activeDocumentId: state.activeDocumentId,
    selectedContentId: state.selectedContentId,
    selectedResourceId: state.selectedResourceId,
    route: state.route,
    playhead: state.playhead,
    timelineMode: state.timelineMode,
  }
}

let hydratePromise: Promise<void> | null = null
let persistTimer: number | null = null

function schedulePersist() {
  if (typeof window === 'undefined') return

  if (persistTimer !== null) {
    window.clearTimeout(persistTimer)
  }

  persistTimer = window.setTimeout(() => {
    persistTimer = null

    void writePersisted(
      persistedSnapshot(useAlphaStore.getState())
    ).catch((error) => {
      console.error('Alpha persistence failed', error)
    })
  }, 80)
}

function preferredRoute(document: AlphaEnvelope, contentId: string) {
  const content = document.contents.find(
    (item) => item.contentId === contentId
  )

  if (!content) return 'all'
  if (content.routes.includes('source')) return 'source'

  return content.routes[0] ?? 'all'
}

export const useAlphaStore = create<AlphaWorkspaceState>((set, get) => ({
  ...blankPersisted(),
  hydrated: false,
  history: {},

  hydrate: async () => {
    if (get().hydrated) return

    if (!hydratePromise) {
      hydratePromise = (async () => {
        try {
          const persisted = await readPersisted()

          if (persisted) {
            set({
              ...persisted,
              hydrated: true,
            })
          } else {
            set({ hydrated: true })
          }
        } catch (error) {
          console.error('Alpha hydration failed', error)
          set({ hydrated: true })
        }
      })().finally(() => {
        hydratePromise = null
      })
    }

    await hydratePromise
  },

  upsertDocument: (document) => {
    const state = get()
    const previous = state.documents.find(
      (item) => item.documentId === document.documentId
    )

    const documents = [
      document,
      ...state.documents.filter(
        (item) => item.documentId !== document.documentId
      ),
    ]

    const history = { ...state.history }

    if (previous) {
      history[document.documentId] = [
        previous,
        ...(history[document.documentId] ?? []),
      ].slice(0, 2)
    }

    const selectedContentId =
      document.contents[0]?.contentId ?? ''

    set({
      documents,
      activeDocumentId: document.documentId,
      selectedContentId,
      selectedResourceId: '',
      route: preferredRoute(document, selectedContentId),
      playhead: 0,
      timelineMode: 'temporal',
      history,
    })

    schedulePersist()
  },

  selectDocument: (documentId) => {
    const document = get().documents.find(
      (item) => item.documentId === documentId
    )

    if (!document) return

    const selectedContentId =
      document.contents[0]?.contentId ?? ''

    set({
      activeDocumentId: documentId,
      selectedContentId,
      selectedResourceId: '',
      route: preferredRoute(document, selectedContentId),
      playhead: 0,
    })

    schedulePersist()
  },

  selectContent: (contentId) => {
    const state = get()
    const document = state.documents.find(
      (item) => item.documentId === state.activeDocumentId
    )

    if (!document) return

    set({
      selectedContentId: contentId,
      selectedResourceId: '',
      route: preferredRoute(document, contentId),
      playhead: 0,
    })

    schedulePersist()
  },

  selectResource: (resourceId) => {
    set({ selectedResourceId: resourceId })
    schedulePersist()
  },

  setRoute: (route) => {
    set({
      route,
      selectedResourceId: '',
      playhead: 0,
    })
    schedulePersist()
  },

  setPlayhead: (playhead) => {
    set({
      playhead: Math.max(0, playhead),
    })
    schedulePersist()
  },

  setTimelineMode: (timelineMode) => {
    set({ timelineMode })
    schedulePersist()
  },

  undoDocument: () => {
    const state = get()
    const stack = state.history[state.activeDocumentId] ?? []
    const previous = stack[0]

    if (!previous) return

    const documents = [
      previous,
      ...state.documents.filter(
        (item) => item.documentId !== previous.documentId
      ),
    ]

    const nextHistory = {
      ...state.history,
      [previous.documentId]: stack.slice(1),
    }

    const selectedContentId =
      previous.contents[0]?.contentId ?? ''

    set({
      documents,
      activeDocumentId: previous.documentId,
      selectedContentId,
      selectedResourceId: '',
      route: preferredRoute(previous, selectedContentId),
      playhead: 0,
      history: nextHistory,
    })

    schedulePersist()
  },

  clearWorkspace: () => {
    set({
      ...blankPersisted(),
      history: {},
      hydrated: true,
    })

    void clearPersisted().catch((error) => {
      console.error('Alpha persistence clear failed', error)
    })
  },
}))
