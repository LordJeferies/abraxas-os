import { lazy, Suspense } from 'react'
import { useAppStore } from './core/state/useAppStore'
import './App.css'

const AlphaWorkspace = lazy(
  () => import('./modules/alpha/AlphaWorkspace')
)

const MediaCompatibilityLab = lazy(
  () => import('./modules/media-lab/MediaCompatibilityLab')
)

const RuntimePanel = lazy(
  () => import('./modules/runtime/RuntimePanel')
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
            className={view === 'alpha' ? 'active' : ''}
            onClick={() => setView('alpha')}
          >
            F1.6 · Alpha
          </button>
          <button
            className={view === 'runtime' ? 'active' : ''}
            onClick={() => setView('runtime')}
          >
            F1.5 · Sources & Jobs
          </button>
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
          F1.6
          <b>ALPHA INGESTION</b>
        </div>
      </header>

      <section className="workspace">
        <Suspense fallback={<LoadingModule />}>
          {view === 'alpha' && (
            <div className="workspace-pane is-active">
              <AlphaWorkspace />
            </div>
          )}

          <div
            className={`workspace-pane ${
              view === 'media-lab' ? 'is-active' : 'is-hidden'
            }`}
            aria-hidden={view !== 'media-lab'}
          >
            <MediaCompatibilityLab active={view === 'media-lab'} />
          </div>

          {view === 'runtime' && (
            <div className="workspace-pane is-active">
              <RuntimePanel />
            </div>
          )}

          {view === 'editor-spike' && (
            <div className="workspace-pane is-active">
              <EditorSpike />
            </div>
          )}
        </Suspense>
      </section>
    </main>
  )
}
