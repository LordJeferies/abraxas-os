import { useEffect, useMemo, useState } from 'react'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import type { FloatingEditorKind } from '../../core/alpha/floatingWindow'
import {
  readFloatingSnapshot,
  sendFloatingSelection,
  subscribeFloatingSnapshot,
  type FloatingEditorSnapshot,
} from '../../core/alpha/floatingEditorBridge'
import GhostInspectorPanel from '../alpha/GhostInspectorPanel'
import './floating-workspace.css'

const ORDER = [
  'captions', 'xr', 'images', 'motion', 'broll',
  'vo', 'aroll', 'story', 'sfx', 'music',
] as const

const LABELS: Record<string, string> = {
  captions: 'SUBTÍTULOS',
  xr: 'XR',
  images: 'IMÁGENES',
  motion: 'MOTION',
  broll: 'B-ROLL',
  vo: 'VO JOC',
  aroll: 'A-ROLL',
  story: 'PARTES',
  sfx: 'SFX',
  music: 'MÚSICA',
}

const COLORS: Record<string, string> = {
  captions: '#c9c7c8',
  xr: '#d298e4',
  images: '#9b8dca',
  motion: '#d28e95',
  broll: '#8f785e',
  vo: '#a8caa8',
  aroll: '#a7bfcb',
  story: '#c8a2af',
  sfx: '#dfcf78',
  music: '#86b3a3',
}

export function getFloatingKind(): FloatingEditorKind | null {
  const query = new URLSearchParams(window.location.search).get('floating')

  if (query === 'timeline' || query === 'ghost') return query

  try {
    const label = getCurrentWebviewWindow().label
    if (label === 'floating-timeline') return 'timeline'
    if (label === 'floating-ghost') return 'ghost'
  } catch {
    // Browser/Pages mode.
  }

  return null
}

function FloatingTimeline({
  snapshot,
}: {
  snapshot: FloatingEditorSnapshot | null
}) {
  if (!snapshot) {
    return <div className="floating-empty">Abre una ficha Alfa en el Editor.</div>
  }

  const duration = Math.max(1, snapshot.duration)

  return (
    <section className="floating-timeline">
      <header>
        <div>
          <small>ABRAXAS · TIMELINE</small>
          <strong>{snapshot.title}</strong>
        </div>
        <span>{snapshot.route}</span>
      </header>

      <div className="floating-timeline-scroll">
        {ORDER.map((track) => {
          const items = snapshot.items.filter((item) => item.track === track)

          return (
            <div className="floating-lane" key={track}>
              <strong>{LABELS[track]}</strong>
              <div>
                {items.map((item) => (
                  <button
                    key={item.resourceId}
                    className={
                      snapshot.selectedResourceId === item.resourceId
                        ? 'selected'
                        : ''
                    }
                    style={{
                      left: `${item.start / duration * 100}%`,
                      width: `${Math.max(
                        0.5,
                        (item.end - item.start) / duration * 100,
                      )}%`,
                      backgroundColor: COLORS[track],
                    }}
                    onClick={() => sendFloatingSelection(item.resourceId)}
                    title={item.label}
                  >
                    {item.state === 'ghost' ? '👻 ' : '◆ '}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function FloatingWorkspace({
  kind,
}: {
  kind: FloatingEditorKind
}) {
  const [snapshot, setSnapshot] = useState<FloatingEditorSnapshot | null>(
    () => readFloatingSnapshot(),
  )

  useEffect(
    () => subscribeFloatingSnapshot(setSnapshot),
    [],
  )

  const selected = useMemo(
    () => snapshot?.selected ?? null,
    [snapshot],
  )

  return (
    <main className="floating-workspace">
      {kind === 'timeline'
        ? <FloatingTimeline snapshot={snapshot} />
        : <GhostInspectorPanel ghost={selected} compact />}
    </main>
  )
}
