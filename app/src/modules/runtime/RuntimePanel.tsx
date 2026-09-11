import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { invoke, isTauri } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import type {
  BackgroundJob,
  SourceRecord,
  SourceRole,
} from '../../core/media/runtimeTypes'
import './runtime-panel.css'

interface RuntimeStatus {
  schemaVersion: string
  runtimeRoot: string
  sourceCount: number
  jobCount: number
  assetCount: number
  jobsByStatus: Record<string, number>
  supportedExecutors: string[]
  transcriptionBackends: string[]
  analysisProvider: string | null
}

interface AssetRecord {
  id: string
  fileName: string
  kind: string
  rootRef: string
  sizeBytes: number
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let amount = value
  let index = 0
  while (amount >= 1024 && index < units.length - 1) {
    amount /= 1024
    index += 1
  }
  return `${amount.toFixed(index > 1 ? 1 : 0)} ${units[index]}`
}

function formatDuration(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '—'
  const h = Math.floor(value / 3600)
  const m = Math.floor((value % 3600) / 60)
  const s = Math.floor(value % 60)
  return [h, m, s]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}

export default function RuntimePanel() {
  const desktop = isTauri()
  const [sources, setSources] = useState<SourceRecord[]>([])
  const [jobs, setJobs] = useState<BackgroundJob[]>([])
  const [assets, setAssets] = useState<AssetRecord[]>([])
  const [status, setStatus] = useState<RuntimeStatus | null>(null)
  const [role, setRole] = useState<SourceRole>('other')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    if (!desktop) return
    try {
      const [nextSources, nextJobs, nextAssets, nextStatus] =
        await Promise.all([
          invoke<SourceRecord[]>('source_runtime_sources'),
          invoke<BackgroundJob[]>('source_runtime_jobs'),
          invoke<AssetRecord[]>('source_runtime_assets'),
          invoke<RuntimeStatus>('source_runtime_status'),
        ])

      setSources(nextSources)
      setJobs(nextJobs)
      setAssets(nextAssets)
      setStatus(nextStatus)
    } catch (error) {
      setMessage(`ERROR · ${String(error)}`)
    }
  }, [desktop])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const activeJobs = useMemo(
    () =>
      jobs.some(
        (job) =>
          job.status === 'queued' ||
          job.status === 'running'
      ),
    [jobs]
  )

  useEffect(() => {
    if (!desktop || !activeJobs) return
    const timer = window.setInterval(() => void refresh(), 1200)
    return () => window.clearInterval(timer)
  }, [desktop, activeJobs, refresh])

  const addSource = async () => {
    if (!desktop) return
    const selected = await open({
      multiple: false,
      directory: false,
      title: 'Registrar master en Abraxas',
      filters: [{
        name: 'Media',
        extensions: [
          'mp4', 'mov', 'm4v', 'webm',
          'mp3', 'wav', 'm4a', 'aac',
        ],
      }],
    })
    if (typeof selected !== 'string') return

    setBusy(true)
    setMessage('Registrando master…')
    try {
      const source = await invoke<SourceRecord>(
        'source_runtime_register',
        { path: selected, role }
      )
      setMessage(`READY · ${source.fileName}`)
      await refresh()
    } catch (error) {
      setMessage(`ERROR · ${String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  const addAssetFolder = async () => {
    if (!desktop) return
    const selected = await open({
      multiple: false,
      directory: true,
      title: 'Agregar carpeta de assets',
    })
    if (typeof selected !== 'string') return

    setBusy(true)
    setMessage('Indexando assets…')
    try {
      const result = await invoke<{
        indexed: number
        total: number
      }>('source_runtime_index_assets', {
        folder: selected,
      })
      setMessage(
        `ASSETS · ${result.indexed} nuevos/actualizados · ${result.total} total`
      )
      await refresh()
    } catch (error) {
      setMessage(`ERROR · ${String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  const prepareSource = async (source: SourceRecord) => {
    setBusy(true)
    setMessage(`Preparando ${source.fileName}…`)
    try {
      await invoke('source_runtime_enqueue_thumbnail', {
        sourceId: source.id,
        atSeconds: 0,
      })

      if (source.metadata.audioCodec) {
        await invoke('source_runtime_enqueue_waveform', {
          sourceId: source.id,
        })
      }

      await refresh()

      void invoke('source_runtime_drain', {
        maxJobs: 8,
      })
        .then(() => refresh())
        .catch((error) => {
          setMessage(`ERROR worker · ${String(error)}`)
        })

      setMessage('Preparación ligera en background.')
    } catch (error) {
      setMessage(`ERROR · ${String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  const runQueue = async () => {
    setBusy(true)
    setMessage('Ejecutando jobs pendientes…')
    try {
      await invoke('source_runtime_drain', { maxJobs: 16 })
      await refresh()
      setMessage('Queue actualizada.')
    } catch (error) {
      setMessage(`ERROR · ${String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  if (!desktop) {
    return (
      <div className="runtime-panel runtime-unavailable">
        <span>F1.5 · FAST SOURCE RUNTIME</span>
        <h1>Sources, Jobs & Assets</h1>
        <p>
          Este módulo usa el runtime local de macOS y está
          disponible dentro de la app Tauri.
        </p>
      </div>
    )
  }

  const transcriptionReady =
    (status?.transcriptionBackends.length ?? 0) > 0
  const analysisReady = Boolean(status?.analysisProvider)

  return (
    <div className="runtime-panel">
      <header className="runtime-hero">
        <div>
          <span>F1.5 · FAST SOURCE RUNTIME</span>
          <h1>Sources, Jobs & Assets</h1>
          <p>
            Registra masters al instante. La preparación pesada ocurre
            en jobs independientes y reutilizables.
          </p>
        </div>

        <div className="runtime-summary">
          <b>{status?.sourceCount ?? sources.length}</b><small>SOURCES</small>
          <b>{status?.jobCount ?? jobs.length}</b><small>JOBS</small>
          <b>{status?.assetCount ?? assets.length}</b><small>ASSETS</small>
        </div>
      </header>

      <div className="runtime-capabilities">
        <span className="ok">CUT · READY</span>
        <span className="ok">THUMBNAIL · READY</span>
        <span className="ok">WAVEFORM · READY</span>
        <span className={transcriptionReady ? 'ok' : 'pending'}>
          TRANSCRIPT · {transcriptionReady ? status?.transcriptionBackends.join(', ') : 'ADAPTER READY'}
        </span>
        <span className={analysisReady ? 'ok' : 'pending'}>
          ANALYSIS · {analysisReady ? status?.analysisProvider : 'ADAPTER READY'}
        </span>
      </div>

      <div className="runtime-toolbar">
        <select
          value={role}
          onChange={(event) =>
            setRole(event.target.value as SourceRole)
          }
          disabled={busy}
        >
          <option value="other">Auto / other</option>
          <option value="horizontal_master">Horizontal master</option>
          <option value="vertical_master">Vertical master</option>
          <option value="audio_master">Audio master</option>
        </select>

        <button
          className="runtime-primary"
          onClick={addSource}
          disabled={busy}
        >
          + Registrar master
        </button>

        <button onClick={addAssetFolder} disabled={busy}>
          + Carpeta de assets
        </button>

        <button onClick={() => void refresh()}>
          Actualizar
        </button>

        <button
          onClick={runQueue}
          disabled={busy || !activeJobs}
        >
          Run queued jobs
        </button>

        <span className="runtime-message">
          {message || 'READY'}
        </span>
      </div>

      <div className="runtime-layout">
        <section className="runtime-card runtime-sources">
          <div className="runtime-card-head">
            <div><small>SOURCE REGISTRY</small><strong>Masters locales</strong></div>
            <span>{sources.length}</span>
          </div>
          <div className="source-list">
            {sources.length === 0 ? (
              <div className="runtime-empty">
                Registra el primer master. Importar no genera un proxy completo.
              </div>
            ) : sources.map((source) => (
              <article className="source-row" key={source.id}>
                <div className="source-main">
                  <strong>{source.fileName}</strong>
                  <span>
                    {source.metadata.width ?? '—'}×
                    {source.metadata.height ?? '—'}
                    {' · '}{source.metadata.orientation}
                    {' · '}{formatDuration(source.metadata.durationSeconds)}
                  </span>
                  <small>
                    {formatBytes(source.sizeBytes)}
                    {' · '}{source.metadata.videoCodec ?? 'no-video'}
                    {' / '}{source.metadata.audioCodec ?? 'no-audio'}
                  </small>
                </div>
                <div className="source-actions">
                  <span className="source-role">{source.role}</span>
                  <button
                    onClick={() => prepareSource(source)}
                    disabled={busy}
                  >
                    Prepare timeline
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="runtime-card">
          <div className="runtime-card-head">
            <div><small>BACKGROUND JOBS</small><strong>Queue</strong></div>
            <span>{jobs.length}</span>
          </div>
          <div className="job-list">
            {jobs.length === 0 ? (
              <div className="runtime-empty">No hay jobs todavía.</div>
            ) : [...jobs].reverse().slice(0, 50).map((job) => (
              <article
                className={`job-row ${job.status}`}
                key={job.id}
              >
                <div>
                  <strong>{job.kind}</strong>
                  <span>{job.status}</span>
                </div>
                <div className="job-progress">
                  <i style={{
                    width: `${Math.max(0, Math.min(100, job.progress))}%`,
                  }} />
                </div>
                <small>
                  {job.error ? job.error : job.message || job.id}
                </small>
              </article>
            ))}
          </div>
        </section>

        <section className="runtime-card">
          <div className="runtime-card-head">
            <div><small>ASSET LIBRARY</small><strong>Fotos, video y audio</strong></div>
            <span>{assets.length}</span>
          </div>
          <div className="asset-list">
            {assets.length === 0 ? (
              <div className="runtime-empty">
                Agrega una carpeta. Más adelante XR/SFX Resolver usará
                esta biblioteca para cumplir ghosts.
              </div>
            ) : [...assets].reverse().slice(0, 80).map((asset) => (
              <article className="asset-row" key={asset.id}>
                <strong>{asset.fileName}</strong>
                <span>{asset.kind} · {formatBytes(asset.sizeBytes)}</span>
              </article>
            ))}
          </div>
        </section>
      </div>

      <footer className="runtime-footer">
        <span>Runtime privado · {status?.runtimeRoot ?? 'local'}</span>
        <span>
          {activeJobs ? 'Background work active' : 'No active jobs'}
        </span>
      </footer>
    </div>
  )
}
