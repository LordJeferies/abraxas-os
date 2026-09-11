# Architectural Decisions

## ADR-001
Frontend: React + TypeScript + Vite.

## ADR-002
Desktop: Tauri 2 desde etapas tempranas.

No se esperará hasta el final para probar WKWebView.

## ADR-003
VideoFlow entra desde el primer editor serio.

Usos iniciales:

- timeline
- preview
- inspector
- groups
- keyframes
- layers
- captions
- audio
- rendering de prueba

## ADR-004
VideoFlow NO es source of truth.

Se implementará:

ABRAXAS PRODUCTION GRAPH
↕
VIDEOFLOW ADAPTER
↕
VideoJSON

## ADR-005
El motor final macOS podrá seleccionar backend de render.

Objetivo principal:

Apple Native Render
AVFoundation + VideoToolbox

Backends adicionales:

- VideoFlow Browser
- VideoFlow Server
- compatibilidad futura

## ADR-006
Ghost es estado, no tipo.

## ADR-007
Motion puede pertenecer a A-roll, B-roll, XR, imagen, texto y otros visuales.

## ADR-008
SFX es opcional.

La IA no debe agregar sonido por cuota.

## ADR-009
XR es un grupo audiovisual con estados/assets internos.

## ADR-010
La interfaz desktop y móvil comparten dominio y estado,
pero tienen layouts diferentes.

## ADR-011
Las versiones R9.x y la web histórica son referencia,
no base de código obligatoria.

## ADR-012
Antes de continuar con grandes módulos debe aprobarse
la reproducción REAL dentro de Tauri.
