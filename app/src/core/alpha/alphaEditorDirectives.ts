import type {
  AlphaContent,
  AlphaState,
} from './types'

export type EditorTrack =
  | 'captions'
  | 'xr'
  | 'images'
  | 'motion'
  | 'broll'
  | 'vo'
  | 'aroll'
  | 'story'
  | 'sfx'
  | 'music'
  | 'transition'

export interface EditorDirective {
  resourceId: string
  type: string
  track: EditorTrack
  state: AlphaState
  start: number
  end: number
  label: string
  description: string
  text: string
  speaker: string
  routes: string[]
  parentResourceId: string | null
}

const VALID_TRACKS = new Set<EditorTrack>([
  'captions',
  'xr',
  'images',
  'motion',
  'broll',
  'vo',
  'aroll',
  'story',
  'sfx',
  'music',
  'transition',
])

function asRecord(
  value: unknown,
): Record<string, unknown> {
  return (
    value
    && typeof value === 'object'
    && !Array.isArray(value)
  )
    ? value as Record<string, unknown>
    : {}
}

function text(
  value: unknown,
) {
  return value == null
    ? ''
    : String(value)
}

function numberValue(
  value: unknown,
): number | null {
  if (
    typeof value === 'number'
    && Number.isFinite(value)
  ) {
    return value
  }

  const parsed =
    Number(value)

  return Number.isFinite(parsed)
    ? parsed
    : null
}

function normalizeTrack(
  trackValue: unknown,
  typeValue: unknown,
): EditorTrack | null {
  const aliases:
    Record<string, EditorTrack> = {
      caption: 'captions',
      subtitle: 'captions',
      subtitles: 'captions',
      voiceover: 'vo',
      voice_over: 'vo',
      'a-roll': 'aroll',
      a_roll: 'aroll',
      'b-roll': 'broll',
      b_roll: 'broll',
      image: 'images',
      images: 'images',
      photo: 'images',
      still: 'images',
      sound: 'sfx',
      fx: 'sfx',
    }

  const rawTrack =
    text(trackValue)
      .trim()
      .toLowerCase()

  const rawType =
    text(typeValue)
      .trim()
      .toLowerCase()

  const track = (
    aliases[rawTrack]
    ?? rawTrack
  ) as EditorTrack

  if (
    VALID_TRACKS.has(track)
  ) {
    return track
  }

  const fallback = (
    aliases[rawType]
    ?? rawType
  ) as EditorTrack

  return VALID_TRACKS.has(fallback)
    ? fallback
    : null
}

function routesOf(
  raw: Record<string, unknown>,
) {
  if (
    Array.isArray(raw.routes)
  ) {
    return raw.routes
      .map(text)
      .filter(Boolean)
  }

  const route =
    text(raw.route)

  return route
    ? [route]
    : []
}

function stateOf(
  raw: Record<string, unknown>,
  track: EditorTrack,
): AlphaState {
  const state = text(raw.state) as AlphaState

  if (
    state === 'ghost'
    || state === 'planned'
    || state === 'ready'
    || state === 'materialized'
    || state === 'approved'
  ) {
    return state
  }

  if (
    text(raw.status)
      .toLowerCase()
      .startsWith('pending')
  ) {
    return 'ghost'
  }

  return track === 'story'
    ? 'planned'
    : 'ghost'
}

function parseRawDirective(
  value: unknown,
  index: number,
): EditorDirective | null {
  const raw =
    asRecord(value)

  const track =
    normalizeTrack(
      raw.track,
      raw.type ?? raw.kind,
    )

  if (!track) {
    return null
  }

  const start =
    numberValue(
      raw.start ?? raw.t0,
    )

  if (
    start == null
  ) {
    return null
  }

  const duration =
    numberValue(
      raw.duration
      ?? raw.durationSeconds,
    )

  const rawEnd =
    numberValue(
      raw.end ?? raw.t1,
    )

  const end =
    rawEnd != null
    && rawEnd > start
      ? rawEnd
      : start
        + (
          duration != null
          && duration > 0
            ? duration
            : track === 'sfx'
              ? 0.25
              : 1
        )

  return {
    resourceId:
      text(
        raw.id
        ?? raw.resourceId,
      )
      || `editor_${index}`,

    type:
      text(
        raw.type
        ?? raw.kind,
      )
      || track,

    track,

    state:
      stateOf(
        raw,
        track,
      ),

    start,
    end,

    label:
      text(
        raw.label
        ?? raw.role
        ?? raw.title,
      )
      || track.toUpperCase(),

    description:
      text(
        raw.function
        ?? raw.description
        ?? raw.imageDescription,
      ),

    text:
      text(
        raw.displayText
        ?? raw.text,
      ),

    speaker:
      text(
        raw.speaker,
      ),

    routes:
      routesOf(raw),

    parentResourceId:
      text(
        raw.parentResourceId
        ?? raw.parentId,
      )
      || null,
  }
}

function rawTimeline(
  content: AlphaContent,
) {
  const value =
    content.sourcePayload.timeline

  return Array.isArray(value)
    ? value
    : []
}

export function getEditorRoutes(
  content: AlphaContent,
) {
  const routes =
    new Set<string>(
      content.routes
        .filter(Boolean),
    )

  for (
    const item
    of rawTimeline(content)
  ) {
    const raw =
      asRecord(item)

    for (
      const route
      of routesOf(raw)
    ) {
      routes.add(route)
    }
  }

  const result =
    [...routes]

  return result.length
    ? result
    : ['default']
}

export function preferredEditorRoute(
  content: AlphaContent,
  current: string,
) {
  const routes =
    getEditorRoutes(content)

  if (
    routes.includes(current)
  ) {
    return current
  }

  if (
    routes.includes('source')
  ) {
    return 'source'
  }

  if (
    routes.includes('voA')
  ) {
    return 'voA'
  }

  if (
    routes.includes('voB')
  ) {
    return 'voB'
  }

  return routes[0]
}

export function getEditorDirectives(
  content: AlphaContent,
) {
  const raw =
    rawTimeline(content)

  const source =
    raw.length
      ? raw
          .map(parseRawDirective)
          .filter(
            (
              item,
            ): item is EditorDirective =>
              item !== null,
          )
      : content
          .timelineDirectives
          .map(
            (
              item,
              index,
            ) =>
              parseRawDirective(
                {
                  ...item,
                  id:
                    item.resourceId,
                },
                index,
              ),
          )
          .filter(
            (
              item,
            ): item is EditorDirective =>
              item !== null,
          )

  const seen =
    new Set<string>()

  return source
    .filter(
      (item) => {
        if (
          seen.has(
            item.resourceId,
          )
        ) {
          return false
        }

        seen.add(
          item.resourceId,
        )

        return true
      },
    )
    .sort(
      (a, b) =>
        a.start - b.start
        || a.end - b.end
        || a.resourceId.localeCompare(
          b.resourceId,
        ),
    )
}

export function selectEditorDirectivesForRoute(
  content: AlphaContent,
  route: string,
) {
  return getEditorDirectives(
    content,
  ).filter(
    (item) =>
      item.routes.length === 0
      || item.routes.includes(
        route,
      ),
  )
}
