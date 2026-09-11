# Próximo paso

Browser vertical ya tiene todos los checks F1 relevantes en PASS.

No hace falta repetirlo si conservas el reporte JSON v2 que ya generaste.

## Faltan tres slots

1. Browser horizontal.
2. Tauri vertical.
3. Tauri horizontal.

En cada uno:

- selected;
- metadata;
- canplay;
- play;
- pause;
- seek;
- frame;
- VideoFlow sample load;
- VideoFlow sample play;
- VideoFlow sample seek;
- audio audible.

`Reopen` ya no forma parte de F1.

## Consolidar

Cuando estén los cuatro JSON:

`./scripts/abraxas f1-validate`

El validador acepta tu reporte Browser vertical anterior aunque
`currentRunPassed=false`, porque ahora recalcula el PASS usando los checks
relevantes de F1.
