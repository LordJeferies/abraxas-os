# Known Warnings

## VideoFlow / bundle size

Vite avisa que algunos chunks superan 500 kB.

Estado: ACCEPTED FOR F1.

Razón:
F1 valida reproducción, Tauri y VideoFlow. El editor ya está separado mediante
lazy loading, pero VideoFlow sigue siendo una dependencia grande.

Acción futura:
medir carga real y optimizar code splitting en Editor Shell / Production Timeline.

No bloquear Media Compatibility por este warning.
