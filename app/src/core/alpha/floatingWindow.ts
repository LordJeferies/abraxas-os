import { invoke } from '@tauri-apps/api/core'

export type FloatingEditorKind = 'timeline' | 'ghost'

export async function openFloatingEditorWindow(kind: FloatingEditorKind) {
  try {
    await invoke('open_floating_editor_window', { kind })
  } catch {
    const popup = window.open(
      `?floating=${kind}`,
      `abraxas-floating-${kind}`,
      kind === 'timeline'
        ? 'width=1120,height=360'
        : 'width=430,height=760',
    )

    popup?.focus()
  }
}
