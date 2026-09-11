# Error Prevention Policy — Abraxas OS

Antes de agregar una función, se intenta predecir qué capas puede romper.

## Orden obligatorio

1. Preflight del entorno y repo.
2. Backup sólo de archivos afectados.
3. Validación de dependencias/configuración cruzada.
4. Syntax checks.
5. Test del módulo modificado.
6. Build frontend.
7. Cargo/Tauri check.
8. Guard de privacidad/repositorio público.
9. Generación de estado.
10. Normalización de archivos generados.
11. `git diff --check`.
12. Checkpoint.
13. Commit/push.

## Errores que ya se previenen automáticamente

- cache npm global con permisos incorrectos;
- `VideoJSON` incompleto en gates de TypeScript;
- assetProtocol sin feature `protocol-asset`;
- dialog plugin desalineado entre npm/Rust/lib.rs/capabilities;
- JSON inválido;
- shell scripts con sintaxis inválida;
- Python de scripts con sintaxis inválida;
- JavaScript público con sintaxis inválida;
- trailing whitespace en archivos generados;
- material privado accidentalmente trackeado;
- `.env`, tokens, private keys y binarios sensibles;
- origin GitHub inesperado;
- branch inesperada;
- archivos fundamentales faltantes;
- F1 incompleto a nivel de estructura.

## Principio

Un warning conocido no debe convertirse automáticamente en bloqueo.

Ejemplo actual:
VideoFlow produce chunks grandes en Vite. Es una deuda de performance futura,
no un fallo funcional de F1.

Un gate sólo bloquea cuando existe riesgo real para compilación, ejecución,
privacidad, persistencia o integridad del proyecto.
