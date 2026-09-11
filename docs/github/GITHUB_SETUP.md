# GitHub setup

No se crea ni reemplaza ningún remote automáticamente.

## Antes de publicar

1. Verificar cuenta:
   `gh auth status`

2. Crear un repositorio nuevo para Abraxas OS o conectar uno vacío.

3. Confirmar que NO se está apuntando a un repositorio histórico que deba conservarse.

4. Hacer push de `main`.

5. En GitHub:
   Settings → Pages → Source → GitHub Actions.

El workflow `.github/workflows/pages.yml` publicará la carpeta `site/`.

La página pública NO debe incluir:

- videos privados,
- transcripciones de clientes,
- credenciales,
- bases de datos,
- archivos fuente sensibles.
