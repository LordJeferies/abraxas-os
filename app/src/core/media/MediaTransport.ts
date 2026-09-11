import { invoke } from '@tauri-apps/api/core'

export interface RegisteredDesktopMedia {
  url: string
  transport: 'tauri-http-range'
}

/**
 * Verifica primero que el bridge Rust esté realmente escuchando.
 * Después registra la ruta local y recibe una URL opaca de loopback.
 *
 * La ruta absoluta nunca queda expuesta en el DOM.
 */
export async function registerDesktopMediaPath(
  path: string
): Promise<RegisteredDesktopMedia> {
  const baseUrl = await invoke<string>('media_server_health')

  const health = await fetch(`${baseUrl}/health`, {
    cache: 'no-store',
  })

  if (!health.ok) {
    throw new Error(
      `Tauri media bridge health failed: HTTP ${health.status}`
    )
  }

  const url = await invoke<string>('register_media_source_http', {
    path,
  })

  return {
    url,
    transport: 'tauri-http-range',
  }
}
