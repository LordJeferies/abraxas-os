import { useState } from 'react'
import type { VideoJSON } from '@videoflow/core'
import { VideoEditor } from '@videoflow/react-video-editor'
import '@videoflow/react-video-editor/style.css'

const initialVideo: VideoJSON = {
  name: 'Abraxas OS · Editor Spike',
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 12,
  backgroundColor: '#000000',
  layers: [],
}

export default function EditorSpike() {
  const [video, setVideo] = useState<VideoJSON>(initialVideo)

  return (
    <section className="editor-spike">
      <VideoEditor
        video={video}
        onChange={setVideo}
        theme="night"
      />
    </section>
  )
}
