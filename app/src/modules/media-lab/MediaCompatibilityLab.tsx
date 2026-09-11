import { useEffect, useMemo, useRef, useState } from 'react'
import VideoFlow from '@videoflow/core'
import DomRenderer from '@videoflow/renderer-dom'
import { convertFileSrc, isTauri } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import './media-lab.css'

type CheckState = 'pending' | 'pass' | 'fail' | 'manual'

interface Check {
  id: string
  label: string
  state: CheckState
  detail?: string
}

interface SavedRun {
  id: string
  date: string
  runtime: 'browser' | 'tauri'
  orientation: 'horizontal' | 'vertical' | 'square' | 'unknown'
  fileName: string
  passed: boolean
}

const CHECKS: Check[] = [
  { id: 'selected', label: 'Archivo seleccionado', state: 'pending' },
  { id: 'metadata', label: 'Metadata cargada', state: 'pending' },
  { id: 'canplay', label: 'CanPlay / decode inicial', state: 'pending' },
  { id: 'play', label: 'Play real', state: 'pending' },
  { id: 'pause', label: 'Pause real', state: 'pending' },
  { id: 'seek', label: 'Seek / scrub', state: 'pending' },
  { id: 'frame', label: 'Frame step', state: 'pending' },
  { id: 'rvfc', label: 'requestVideoFrameCallback', state: 'pending' },
  { id: 'videoflow-load', label: 'VideoFlow DOM load', state: 'pending' },
  { id: 'videoflow-play', label: 'VideoFlow DOM play', state: 'pending' },
  { id: 'videoflow-seek', label: 'VideoFlow DOM seek', state: 'pending' },
  { id: 'audio', label: 'Audio audible', state: 'manual' },
  { id: 'reopen', label: 'Reopen verificado', state: 'manual' },
]

const REQUIRED_IDS = [
  'selected',
  'metadata',
  'canplay',
  'play',
  'pause',
  'seek',
  'frame',
  'videoflow-load',
  'videoflow-play',
  'videoflow-seek',
  'audio',
  'reopen',
]

const STORAGE_KEY = 'abraxas.media-lab.runs.v1'

function basename(path: string) {
  return path.split(/[\\/]/).pop() || 'video'
}

function runtimeName() {
  return isTauri() ? 'tauri' : 'browser'
}

function orientation(width: number, height: number): SavedRun['orientation'] {
  if (!width || !height) return 'unknown'
  if (width === height) return 'square'
  return width > height ? 'horizontal' : 'vertical'
}

function loadSavedRuns(): SavedRun[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export default function MediaCompatibilityLab() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const flowHostRef = useRef<HTMLDivElement | null>(null)
  const flowRendererRef = useRef<DomRenderer | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const [checks, setChecks] = useState<Check[]>(CHECKS)
  const [source, setSource] = useState('')
  const [fileName, setFileName] = useState('Sin archivo')
  const [sourceKind, setSourceKind] = useState<'blob' | 'asset' | 'none'>('none')
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoWidth, setVideoWidth] = useState(0)
  const [videoHeight, setVideoHeight] = useState(0)
  const [fps, setFps] = useState(30)
  const [events, setEvents] = useState<string[]>([])
  const [flowFrame, setFlowFrame] = useState(0)
  const [flowFps, setFlowFps] = useState(0)
  const [flowReady, setFlowReady] = useState(false)
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>(loadSavedRuns)

  const runtime = runtimeName()
  const currentOrientation = orientation(videoWidth, videoHeight)

  const setCheck = (id: string, state: CheckState, detail?: string) => {
    setChecks((items) =>
      items.map((item) =>
        item.id === id ? { ...item, state, detail } : item
      )
    )
  }

  const log = (message: string) => {
    const stamp = new Date().toLocaleTimeString()
    setEvents((items) => [`${stamp} · ${message}`, ...items].slice(0, 80))
  }

  const clearSource = () => {
    flowRendererRef.current?.stop()
    flowRendererRef.current?.destroy(true)
    flowRendererRef.current = null
    setFlowReady(false)

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }

  const resetRun = () => {
    clearSource()
    setChecks(CHECKS)
    setSource('')
    setFileName('Sin archivo')
    setSourceKind('none')
    setDuration(0)
    setCurrentTime(0)
    setVideoWidth(0)
    setVideoHeight(0)
    setFlowFrame(0)
    setFlowFps(0)
    setEvents([])
  }

  useEffect(() => {
    return () => clearSource()
  }, [])

  const acceptSource = (
    nextSource: string,
    nextName: string,
    kind: 'blob' | 'asset'
  ) => {
    // Limpiar la fuente ANTERIOR antes de registrar la nueva.
    clearSource()

    if (kind === 'blob') {
      objectUrlRef.current = nextSource
    }

    setSource(nextSource)
    setFileName(nextName)
    setSourceKind(kind)
    setChecks(CHECKS)
    setEvents([])
    setCheck('selected', 'pass', `${kind} · ${nextName}`)
    log(`Seleccionado ${nextName} (${kind})`)
  }

  const onBrowserFile = (file?: File) => {
    if (!file) return

    const url = URL.createObjectURL(file)
    acceptSource(url, file.name, 'blob')

    log(
      `Browser file · ${file.type || 'unknown MIME'} · ` +
      `${(file.size / 1024 / 1024).toFixed(1)} MB`
    )
  }

  const chooseVideo = async () => {
    if (!isTauri()) {
      inputRef.current?.click()
      return
    }

    try {
      const selected = await open({
        multiple: false,
        directory: false,
        title: 'Seleccionar video real para F1',
        filters: [
          {
            name: 'Video',
            extensions: ['mp4', 'mov', 'm4v', 'webm'],
          },
        ],
      })

      if (typeof selected !== 'string') return

      const assetUrl = convertFileSrc(selected)
      acceptSource(assetUrl, basename(selected), 'asset')
    } catch (error) {
      log(`ERROR picker Tauri: ${String(error)}`)
    }
  }

  const seekTo = (value: number) => {
    const video = videoRef.current
    if (!video || !Number.isFinite(value)) return
    video.currentTime = Math.max(0, Math.min(video.duration || 0, value))
  }

  const frameStep = (direction: -1 | 1) => {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration)) return

    const step = 1 / Math.max(1, fps)
    video.pause()
    video.currentTime = Math.max(
      0,
      Math.min(video.duration, video.currentTime + direction * step)
    )
    setCheck('frame', 'pass', `${fps} fps · ${direction > 0 ? '+1' : '-1'} frame`)
    log(`Frame step ${direction > 0 ? '+' : '-'}1 @ ${fps} fps`)
  }

  const loadVideoFlow = async () => {
    if (!source || !flowHostRef.current) return

    try {
      flowRendererRef.current?.stop()
      flowRendererRef.current?.destroy(true)
      flowRendererRef.current = null

      const projectWidth = videoWidth || 1920
      const projectHeight = videoHeight || 1080

      const flow = new VideoFlow({
        name: `F1 · ${fileName}`,
        width: projectWidth,
        height: projectHeight,
        fps,
        backgroundColor: '#000000',
      })

      flow.addVideo(
        { fit: 'contain', volume: 1 },
        { source },
        { waitFor: 'finish' }
      )

      const json = await flow.compile()
      const renderer = new DomRenderer(flowHostRef.current)

      renderer.onFrame = (frame) => {
        setFlowFrame(frame)
      }

      await renderer.loadVideo(json)

      flowRendererRef.current = renderer
      setFlowReady(true)
      setCheck('videoflow-load', 'pass', `${json.duration.toFixed(2)}s`)
      log(`VideoFlow DOM loaded · ${json.duration.toFixed(2)}s`)
    } catch (error) {
      setFlowReady(false)
      setCheck('videoflow-load', 'fail', String(error))
      log(`ERROR VideoFlow load: ${String(error)}`)
    }
  }

  const playVideoFlow = async () => {
    const renderer = flowRendererRef.current
    if (!renderer) return

    try {
      await renderer.play({
        fpsCallback: (actualFps) => {
          setFlowFps(actualFps)
        },
      })
      setCheck('videoflow-play', 'pass', 'play() iniciado')
      log('VideoFlow play() iniciado')
    } catch (error) {
      setCheck('videoflow-play', 'fail', String(error))
      log(`ERROR VideoFlow play: ${String(error)}`)
    }
  }

  const stopVideoFlow = () => {
    flowRendererRef.current?.stop()
    log('VideoFlow stop()')
  }

  const seekVideoFlow = async () => {
    const renderer = flowRendererRef.current
    if (!renderer) return

    try {
      const frame = Math.max(0, Math.round((currentTime || 0) * fps))
      await renderer.seek(frame)
      setFlowFrame(frame)
      setCheck('videoflow-seek', 'pass', `frame ${frame}`)
      log(`VideoFlow seek(frame ${frame})`)
    } catch (error) {
      setCheck('videoflow-seek', 'fail', String(error))
      log(`ERROR VideoFlow seek: ${String(error)}`)
    }
  }

  const toggleManual = (id: 'audio' | 'reopen') => {
    const item = checks.find((check) => check.id === id)
    const next: CheckState = item?.state === 'pass' ? 'manual' : 'pass'
    setCheck(id, next, next === 'pass' ? 'Confirmado manualmente' : undefined)
  }

  const runPassed = useMemo(
    () =>
      REQUIRED_IDS.every(
        (id) => checks.find((check) => check.id === id)?.state === 'pass'
      ),
    [checks]
  )

  const saveRun = () => {
    const run: SavedRun = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      runtime,
      orientation: currentOrientation,
      fileName,
      passed: runPassed,
    }

    const next = [run, ...savedRuns].slice(0, 30)
    setSavedRuns(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    log(`Run guardado · ${runtime} · ${currentOrientation} · ${runPassed ? 'PASS' : 'PARTIAL'}`)
  }

  const coverage = useMemo(() => {
    const has = (r: SavedRun['runtime'], o: SavedRun['orientation']) =>
      savedRuns.some((run) => run.runtime === r && run.orientation === o && run.passed)

    return {
      browserHorizontal: has('browser', 'horizontal'),
      browserVertical: has('browser', 'vertical'),
      tauriHorizontal: has('tauri', 'horizontal'),
      tauriVertical: has('tauri', 'vertical'),
    }
  }, [savedRuns])

  // Browser y Tauri NO comparten localStorage.
  // Cada runtime certifica sus dos orientaciones y un validador externo
  // consolida los cuatro reportes.
  const runtimeReady =
    runtime === 'browser'
      ? coverage.browserHorizontal && coverage.browserVertical
      : coverage.tauriHorizontal && coverage.tauriVertical

  const report = useMemo(
    () => ({
      schemaVersion: 'abraxas.media-compatibility-report.v2',
      generatedAt: new Date().toISOString(),
      runtime,
      sourceKind,
      fileName,
      media: {
        duration,
        width: videoWidth,
        height: videoHeight,
        orientation: currentOrientation,
        assumedFps: fps,
      },
      checks,
      currentRunPassed: runPassed,
      accumulatedCoverage: coverage,
      runtimeCoverageReady: runtimeReady,
      requiresExternalConsolidation: true,
      note: 'No contiene ruta completa del archivo ni media del cliente.',
    }),
    [
      runtime,
      sourceKind,
      fileName,
      duration,
      videoWidth,
      videoHeight,
      currentOrientation,
      fps,
      checks,
      runPassed,
      coverage,
      runtimeReady,
    ]
  )

  const copyReport = async () => {
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2))
    log('Reporte copiado')
  }

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `abraxas-f1-${runtime}-${currentOrientation}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    log('Reporte descargado')
  }

  return (
    <div className="media-lab">
      <header className="lab-hero">
        <div>
          <span className="lab-kicker">F1 · RELEASE GATE</span>
          <h1>Media Compatibility Lab</h1>
          <p>
            Antes de construir la Production Timeline, probamos reproducción real
            en browser, Tauri y VideoFlow con archivos privados sin subirlos al repo.
          </p>
        </div>

        <div className={`runtime-badge ${runtime}`}>
          <span />
          {runtime === 'tauri' ? 'TAURI / WKWEBVIEW' : 'BROWSER'}
        </div>
      </header>

      <div className="lab-grid">
        <section className="lab-panel player-panel">
          <div className="panel-head">
            <div>
              <small>01 · SOURCE PLAYER</small>
              <strong>{fileName}</strong>
            </div>
            <button className="primary-button" onClick={chooseVideo}>
              {runtime === 'tauri' ? 'Seleccionar con macOS' : 'Seleccionar video'}
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,.m4v"
            hidden
            onChange={(event) => onBrowserFile(event.target.files?.[0])}
          />

          <div className="video-shell">
            {source ? (
              <video
                ref={videoRef}
                src={source}
                controls
                preload="metadata"
                playsInline
                onLoadedMetadata={(event) => {
                  const video = event.currentTarget
                  setDuration(video.duration || 0)
                  setVideoWidth(video.videoWidth || 0)
                  setVideoHeight(video.videoHeight || 0)
                  setCheck(
                    'metadata',
                    'pass',
                    `${video.videoWidth}×${video.videoHeight} · ${video.duration.toFixed(2)}s`
                  )
                  log(`loadedmetadata ${video.videoWidth}×${video.videoHeight}`)

                  if ('requestVideoFrameCallback' in video) {
                    video.requestVideoFrameCallback(() => {
                      setCheck('rvfc', 'pass', 'frame callback recibido')
                      log('requestVideoFrameCallback OK')
                    })
                  } else {
                    setCheck('rvfc', 'fail', 'API no disponible')
                  }
                }}
                onCanPlay={() => {
                  setCheck('canplay', 'pass')
                  log('canplay')
                }}
                onPlay={() => {
                  setCheck('play', 'pass')
                  log('play')
                }}
                onPause={() => {
                  setCheck('pause', 'pass')
                  log('pause')
                }}
                onSeeking={() => log('seeking')}
                onSeeked={() => {
                  setCheck('seek', 'pass', `${videoRef.current?.currentTime.toFixed(3)}s`)
                  log('seeked')
                }}
                onTimeUpdate={(event) => {
                  setCurrentTime(event.currentTarget.currentTime)
                }}
                onError={(event) => {
                  const error = event.currentTarget.error
                  const detail = error
                    ? `code ${error.code} · ${error.message || 'sin mensaje'}`
                    : 'HTMLVideoElement error sin MediaError'

                  setCheck('canplay', 'fail', detail)
                  log(`ERROR video element · ${detail}`)
                }}
              />
            ) : (
              <div className="empty-player">
                <span>DROP-IN TEST</span>
                <strong>Selecciona un MP4/MOV real.</strong>
                <p>El archivo permanece local.</p>
              </div>
            )}
          </div>

          <div className="transport">
            <button onClick={() => videoRef.current?.play()}>▶ Play</button>
            <button onClick={() => videoRef.current?.pause()}>Ⅱ Pause</button>
            <button onClick={() => frameStep(-1)}>← 1 frame</button>
            <button onClick={() => frameStep(1)}>1 frame →</button>

            <label>
              FPS
              <select
                value={fps}
                onChange={(event) => setFps(Number(event.target.value))}
              >
                {[24, 25, 30, 50, 60].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="scrubber">
            <input
              type="range"
              min="0"
              max={Math.max(duration, 0.01)}
              step="0.001"
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => seekTo(Number(event.target.value))}
              disabled={!source}
            />
            <span>{currentTime.toFixed(3)} / {duration.toFixed(3)}s</span>
          </div>

          <dl className="metadata">
            <div><dt>Runtime</dt><dd>{runtime}</dd></div>
            <div><dt>Source</dt><dd>{sourceKind}</dd></div>
            <div><dt>Size</dt><dd>{videoWidth || '—'} × {videoHeight || '—'}</dd></div>
            <div><dt>Orientation</dt><dd>{currentOrientation}</dd></div>
          </dl>
        </section>

        <aside className="lab-panel checks-panel">
          <div className="panel-head">
            <div>
              <small>02 · TEST MATRIX</small>
              <strong>{runPassed ? 'RUN PASS' : 'Verificación activa'}</strong>
            </div>
          </div>

          <div className="checks">
            {checks.map((check) => (
              <div className={`check ${check.state}`} key={check.id}>
                <i />
                <div>
                  <b>{check.label}</b>
                  {check.detail && <span>{check.detail}</span>}
                </div>

                {check.id === 'audio' && (
                  <button onClick={() => toggleManual('audio')}>
                    {check.state === 'pass' ? '✓' : 'Confirmar'}
                  </button>
                )}

                {check.id === 'reopen' && (
                  <button onClick={() => toggleManual('reopen')}>
                    {check.state === 'pass' ? '✓' : 'Confirmar'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </aside>

        <section className="lab-panel videoflow-panel">
          <div className="panel-head">
            <div>
              <small>03 · VIDEOFLOW DOM RENDERER</small>
              <strong>Segundo camino de playback</strong>
            </div>
            <span className={`flow-state ${flowReady ? 'ready' : ''}`}>
              {flowReady ? 'READY' : 'NOT LOADED'}
            </span>
          </div>

          <div ref={flowHostRef} className="flow-host" />

          <div className="transport">
            <button onClick={loadVideoFlow} disabled={!source}>Load VideoFlow</button>
            <button onClick={playVideoFlow} disabled={!flowReady}>▶ Play Flow</button>
            <button onClick={stopVideoFlow} disabled={!flowReady}>■ Stop</button>
            <button onClick={seekVideoFlow} disabled={!flowReady}>Seek to source playhead</button>
          </div>

          <div className="flow-metrics">
            <span>Frame: {flowFrame}</span>
            <span>Rendered FPS: {flowFps || '—'}</span>
            <span>Project FPS: {fps}</span>
          </div>
        </section>

        <section className="lab-panel coverage-panel">
          <div className="panel-head">
            <div>
              <small>04 · ACCUMULATED COVERAGE</small>
              <strong>{runtimeReady ? 'CURRENT RUNTIME READY' : 'Faltan ejecuciones reales'}</strong>
            </div>
          </div>

          <div className="coverage-grid">
            <Coverage
              label={`${runtime} · horizontal`}
              pass={
                runtime === 'browser'
                  ? coverage.browserHorizontal
                  : coverage.tauriHorizontal
              }
            />
            <Coverage
              label={`${runtime} · vertical`}
              pass={
                runtime === 'browser'
                  ? coverage.browserVertical
                  : coverage.tauriVertical
              }
            />
          </div>

          <p className="coverage-note">
            Browser y Tauri guardan estado por separado. Completa horizontal y
            vertical en este runtime, descarga ambos reportes y luego consolida
            los cuatro con <code>./scripts/abraxas f1-validate</code>.
          </p>

          <div className="report-actions">
            <button className="primary-button" onClick={saveRun} disabled={!source}>
              Guardar este run
            </button>
            <button onClick={copyReport}>Copiar reporte</button>
            <button onClick={downloadReport}>Descargar JSON</button>
            <button onClick={resetRun}>Nuevo run</button>
          </div>
        </section>

        <section className="lab-panel log-panel">
          <div className="panel-head">
            <div>
              <small>05 · EVENT LOG</small>
              <strong>Lo que realmente ocurrió</strong>
            </div>
          </div>

          <div className="event-log">
            {events.length === 0 ? (
              <span>Esperando eventos…</span>
            ) : (
              events.map((event, index) => <code key={`${event}-${index}`}>{event}</code>)
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function Coverage({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className={`coverage-item ${pass ? 'pass' : ''}`}>
      <i />
      <span>{label}</span>
      <b>{pass ? 'PASS' : 'PENDING'}</b>
    </div>
  )
}
