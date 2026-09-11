# Próximo paso

## 1. Volver a abrir Browser

`./scripts/abraxas web`

Confirmar primero que ahora puedes hacer scroll hasta:

- VideoFlow DOM Renderer;
- Accumulated Coverage;
- Event Log.

## 2. Completar los dos runs Browser

- horizontal;
- vertical.

Descargar ambos reportes v2.

## 3. Probar Tauri

`./scripts/abraxas desktop`

Completar:

- horizontal;
- vertical.

## 4. Consolidar

`./scripts/abraxas f1-validate`

## 5. Si F1 pasa

Comienza F2 Editor Shell.

Antes de construir nuestro shell definitivo, repetir un smoke test corto en
Editor Base para confirmar que texto, drag y playhead ya no se resetean con el
wrapper VideoFlow corregido.
