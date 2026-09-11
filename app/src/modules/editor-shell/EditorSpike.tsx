import type { VideoJSON } from '@videoflow/core'
import { VideoEditor } from '@videoflow/react-video-editor'
import '@videoflow/react-video-editor/style.css'

/**
 * IMPORTANTE:
 *
 * `video` se entrega como documento INICIAL al editor.
 * VideoFlow mantiene selección, playhead, history y edición en su store interno.
 *
 * No devolver cada `onChange` inmediatamente a la prop `video`.
 * Hacerlo puede reinyectar el documento mientras el usuario está arrastrando
 * o escribiendo y provocar pérdida de selección/foco/playhead.
 *
 * La persistencia real se implementará en F2 mediante un adapter/autosave
 * que NO rehidrate el editor en cada tecla.
 */
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
  return (
    <section className="editor-spike">
      <VideoEditor
        video={initialVideo}
        theme="night"
      />
    </section>
  )
}
