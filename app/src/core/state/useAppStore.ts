import { create } from 'zustand'

export type AppView =
  | 'alpha'
  | 'media-lab'
  | 'runtime'
  | 'editor-spike'

interface AppState {
  view: AppView
  setView: (view: AppView) => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'alpha',
  setView: (view) => set({ view }),
}))
