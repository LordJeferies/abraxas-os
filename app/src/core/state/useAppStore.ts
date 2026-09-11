import { create } from 'zustand'

export type AppView = 'media-lab' | 'runtime' | 'editor-spike'

interface AppState {
  view: AppView
  setView: (view: AppView) => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'runtime',
  setView: (view) => set({ view }),
}))
