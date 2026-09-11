export type SourceRole =
  | 'horizontal_master'
  | 'vertical_master'
  | 'audio_master'
  | 'other'

export interface SourceMetadata {
  durationSeconds: number
  sizeBytes: number
  formatName?: string | null
  width?: number | null
  height?: number | null
  orientation:
    | 'horizontal'
    | 'vertical'
    | 'square'
    | 'unknown'
  videoCodec?: string | null
  audioCodec?: string | null
  sampleRate?: string | null
}

export interface SourceRecord {
  id: string
  fingerprint: string
  pathRef: string
  fileName: string
  role: SourceRole
  sizeBytes: number
  mtimeNs: number
  metadata: SourceMetadata
  status: 'ready' | 'missing' | 'error'
  registeredAt: string
  updatedAt?: string
}

export type BackgroundJobKind =
  | 'probe'
  | 'cut'
  | 'transcript'
  | 'analysis'
  | 'thumbnail'
  | 'waveform'
  | 'proxy'
  | 'asset-index'

export type BackgroundJobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'cancelled'

export interface BackgroundJob {
  id: string
  kind: BackgroundJobKind
  sourceId?: string | null
  payload: Record<string, unknown>
  status: BackgroundJobStatus
  progress: number
  message?: string | null
  error?: string | null
  result?: unknown
  createdAt: string
  updatedAt: string
  startedAt?: string | null
  completedAt?: string | null
}
