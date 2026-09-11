import { lazy, Suspense } from 'react'
import { useAppStore } from './core/state/useAppStore'
import './App.css'

const MediaCompatibilityLab = lazy(
  () => import('./modules/media-lab/MediaCompatibilityLab')
)

const EditorSpike = lazy(
  () => import('./modules/editor-shell/EditorSpike')
)

function LoadingModule() {
  return (
    <div className="module-loading">
      <span>ABRAXAS OS</span>
      <strong>Cargando módulo…</strong>
    </div>
  )
}

export default function App() {
  const view = useAppStore((state) => state.view)
  const setView = useAppStore((state) => state.setView)

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="mark">A</div>
          <div>
            <strong>Abraxas OS</strong>
            <span>Content Operating System</span>
          </div>
        </div>

        <nav className="app-nav">
          <button
            className={view === 'media-lab' ? 'active' : ''}
            onClick={() => setView('media-lab')}
          >
            F1 · Media Lab
          </button>
          <button
            className={view === 'editor-spike' ? 'active' : ''}
            onClick={() => setView('editor-spike')}
          >
            Editor Base
          </button>
        </nav>

        <div className="phase">
          F1
          <b>REAL MEDIA GATE</b>
        </div>
      </header>

      <section className="workspace">
        <Suspense fallback={<LoadingModule />}>
          {view === 'media-lab' ? <MediaCompatibilityLab /> : <EditorSpike />}
        </Suspense>
      </section>
    </main>
  )
}
