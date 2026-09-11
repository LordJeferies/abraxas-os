# Abraxas OS — Qué estamos haciendo

Esta carpeta explica el proyecto en lenguaje sencillo.

## Qué es Abraxas OS

Una herramienta para convertir material bruto y criterio editorial en producción
de contenido ejecutable y trazable.

La primera meta NO es reemplazar CapCut o DaVinci por completo.

La primera meta útil es:

1. cargar un video real,
2. reproducirlo de verdad,
3. ver una timeline,
4. mostrar en esa timeline qué debería existir en cada momento,
5. representar como objetos fantasma XR, B-roll, Motion, SFX, captions, VO, etc.,
6. hacer clic en cada objeto y entender cómo producirlo,
7. enlazar luego el asset real,
8. cortar/exportar el contenido.

Después se añaden análisis, Beta, Alfa, automatización, carruseles, revisión,
calendario y publicación.

## Cómo saber por dónde vamos

- CURRENT_STATUS.md: estado de hoy.
- NEXT_STEP.md: lo siguiente que debemos hacer.
- PROJECT_STATE.json: estado legible por scripts y por la web.
- MODULES.json: cada módulo y su progreso.
- CHANGELOG.md: qué cambió.
- SESSION_LOG.md: registro cronológico.
- ROADMAP_SIMPLE.md: camino completo resumido.

## Regla de desarrollo

Cada módulo debe poder evolucionar sin obligar a reescribir los demás.

La integración ocurre mediante contratos y adapters.
