import { useState } from 'react'
import type { VideoJSON } from '@videoflow/core'
import { VideoEditor } from '@videoflow/react-video-editor'
import '@videoflow/react-video-editor/style.css'
import './App.css'

const initialVideo: VideoJSON = {
  name: 'Abraxas OS · Foundation',
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 12,
  backgroundColor: '#000000',
  layers: [],
}

export default function App() {
  const [video, setVideo] = useState<VideoJSON>(initialVideo)

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

        <div className="phase">
          F0 · Foundation
          <b>Media gate pendiente</b>
        </div>
      </header>

      <section className="editor">
        <VideoEditor
          video={video}
          onChange={setVideo}
          theme="night"
        />
      </section>
    </main>
  )
}
