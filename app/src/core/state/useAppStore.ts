import { create } from 'zustand'

export type AppView = 'media-lab' | 'editor-spike'

interface AppState {
  view: AppView
  setView: (view: AppView) => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'media-lab',
  setView: (view) => set({ view }),
}))
