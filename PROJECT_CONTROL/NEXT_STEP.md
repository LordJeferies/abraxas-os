# Próximo paso

## Validación manual v0.17.3

1. `./scripts/abraxas desktop`
2. F1.6 · Alpha
3. Amanda R10.1
4. abrir `The only way out is through`
5. `Editar →`
6. Vista `Semántica`

Para `Entrevista original`:
- total esperado: 82 recursos.

Para `VO A · documental`:
- total esperado: 99 recursos.

Para `VO B · cine`:
- total esperado: 99 recursos.

En cada ruta debe existir UNA sola fila:
SUBTÍTULOS / XR / IMÁGENES / MOTION / B-ROLL /
VO JOC / A-ROLL / PARTES / SFX / MÚSICA.

No deben reaparecer Track 1...Track 208.

Al cambiar de ficha debe reconstruirse el VideoJSON sólo para esa ficha.
Al cambiar de ruta debe cambiar el draft `contentId::route`.

## Después de validar

1. drag/trim directo en Timeline Semántica usando commands de VideoFlow;
2. selección semántica -> Inspector;
3. source binding vertical/horizontal;
4. materialización A-roll/XR/B-roll/SFX/captions/motion;
5. Finder/Asset Library -> Ghost;
6. SQLite privado.
