import { useEffect, useMemo } from 'react'
import { usePlayhead, useVideo } from '@videoflow/react-video-editor'
import {
  applyAlphaEdits,
  getAlphaOverlay,
  useAlphaEditStore,
} from '../../core/alpha/alphaEditStore'
import { useAlphaStore } from '../../core/alpha/useAlphaStore'
import CanonicalTimeline from './CanonicalTimeline'
import './alpha-semantic-timeline.css'

export default function AlphaSemanticTimeline() {
  const video = useVideo()
  const { frame } = usePlayhead()
  const documents = useAlphaStore((state) => state.documents)
  const activeDocumentId = useAlphaStore((state) => state.activeDocumentId)
  const selectedContentId = useAlphaStore((state) => state.selectedContentId)
  const selectedResourceId = useAlphaStore((state) => state.selectedResourceId)
  const route = useAlphaStore((state) => state.route)
  const selectResource = useAlphaStore((state) => state.selectResource)
  const overlays = useAlphaEditStore((state) => state.overlays)
  const hydrateEdits = useAlphaEditStore((state) => state.hydrate)

  useEffect(() => { void hydrateEdits() }, [hydrateEdits])

  const document = useMemo(
    () => documents.find((item) => item.documentId === activeDocumentId) ?? documents[0] ?? null,
    [documents, activeDocumentId],
  )

  const content = useMemo(() => {
    const base = document?.contents.find((item) => item.contentId === selectedContentId)
      ?? document?.contents[0]
      ?? null
    if (!base || !document) return null
    return applyAlphaEdits(base, getAlphaOverlay(overlays, document.documentId, base.contentId))
  }, [document, selectedContentId, overlays])

  if (!content) return null

  return (
    <CanonicalTimeline
      content={content}
      route={route}
      selectedResourceId={selectedResourceId}
      onSelectResource={selectResource}
      playheadSeconds={Math.max(0, frame) / Math.max(1, video.fps || 30)}
    />
  )
}
