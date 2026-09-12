# Floating Editor Workflow

Abraxas puede mantener dos ventanas auxiliares:

1. `floating-timeline`
2. `floating-ghost`

Tauri las crea con:
- `always_on_top(true)`
- `visible_on_all_workspaces(true)`

Uso:
- editar en CapCut/DaVinci;
- Timeline flotante como guía;
- Ghost Info flotante con prompt, referencias, instrucciones y timing.

Botones:
- `↗ Timeline`
- `↗ Ghost`

`Ghost Info` mantiene el mismo inspector docked dentro de Abraxas.

Las ventanas flotantes usan un snapshot compacto sincronizado por
BroadcastChannel + localStorage fallback.
