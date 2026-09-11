# Protocolo de desarrollo modular

Toda actualización futura de Abraxas OS debe intentar seguir este orden:

1. Leer `continuacion en chat/ABRAXAS_OS_CONTINUACION_CHAT.md`.
2. Identificar el módulo exacto que cambia.
3. Hacer backup sólo de los archivos que se tocarán.
4. No reescribir módulos que ya pasan sus gates.
5. Aplicar el patch.
6. Ejecutar pruebas del módulo.
7. Ejecutar `./scripts/abraxas check`.
8. Actualizar PROJECT_CONTROL.
9. Ejecutar checkpoint.
10. Regenerar `continuacion en chat`.
11. Abrir automáticamente esa carpeta para compartirla con ChatGPT.
12. Commit/push cuando corresponda.

## Regla de privacidad

El repositorio público contiene el producto reproducible.

Los datos reales de clientes pertenecen a `CLIENTES_PRIVADOS_LOCAL/`
y nunca se publican.

## Regla de integración

Los módulos se comunican mediante:

- contratos;
- domain models;
- adapters;
- stores públicos;
- APIs documentadas.

No mediante dependencias internas improvisadas.
