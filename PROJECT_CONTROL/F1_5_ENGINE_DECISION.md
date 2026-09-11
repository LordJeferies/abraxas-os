# F1.5 — Engine Decision

## Hallazgo

Los intentos de un Apple Cut Engine escrito directamente en Swift introdujeron
fricción por cambios de API/async antes de aportar valor adicional.

El playbook funcional aportado por el usuario demuestra una ruta de producción
ya usada:

- FFmpeg;
- Apple VideoToolbox;
- H.264 40M;
- AAC 192k;
- source fingerprints;
- canonical PART cache;
- multicut por PARTS;
- ensamblaje `concat + -c copy`;
- checkpoints;
- outputs atómicos.

## Decisión

Abraxas adopta esa ruta como CUT_ONLY engine de F1.5.

No se reescribe una solución probada mientras no exista una razón medible.

## Apple Native

Se conserva AVFoundation para:

- preview proxies;
- futuras capacidades donde aporte ventaja concreta;
- integración nativa cuando sea necesaria.

No es requisito para simples cortes.

## Release strategy

Primero certificar un motor de corte externo, reiniciable y testeable.

Después integrarlo en Tauri mediante adapter/sidecar sin cambiar el contrato
`abraxas.cut-job.v1`.
