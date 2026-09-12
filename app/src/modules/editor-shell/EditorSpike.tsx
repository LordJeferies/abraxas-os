import type { VideoJSON } from '@videoflow/core'
import {
  VideoEditor,
} from '@videoflow/react-video-editor'
import '@videoflow/react-video-editor/style.css'
import {
  useAlphaStore,
} from '../../core/alpha/useAlphaStore'
import AlphaVideoFlowEditor from '../alpha/AlphaVideoFlowEditor'

const initialVideo: VideoJSON = {
  name: 'Abraxas OS · Editor',
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 12,
  backgroundColor: '#000000',
  layers: [],
}

export default function EditorSpike() {
  const hasAlpha = useAlphaStore(
    (state) =>
      state.documents.length > 0
      && Boolean(state.selectedContentId),
  )

  if (hasAlpha) {
    return <AlphaVideoFlowEditor />
  }

  return (
    <section className="editor-spike">
      <VideoEditor
        video={initialVideo}
        theme="night"
      />
    </section>
  )
}
