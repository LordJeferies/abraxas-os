# Abraxas OS — Media Execution Modes

## Decisión vigente

CUT_ONLY no necesita VideoFlow ni proxy de edición.

El motor elegido para corte automatizado sigue el patrón ya probado del
playbook histórico del usuario:

MASTER
→ fingerprint
→ canonical PARTS
→ FFmpeg + Apple VideoToolbox
→ concat `-c copy`
→ output
→ QA

AVFoundation/Swift se conserva para el proxy de preview que ya demostró
funcionar con VideoFlow. No se usa un Cut Engine Swift personalizado mientras
el pipeline FFmpeg/VideoToolbox sea más estable y probado.

## CUT_ONLY · continuo

Por defecto:

MASTER
→ rango exacto
→ `h264_videotoolbox`
→ H.264 40M + AAC 192k
→ MP4

Esto evita depender de keyframes para precisión editorial.

`fast_copy` queda disponible sólo para borrador o cortes donde la precisión
por keyframe sea aceptable.

## CUT_ONLY · multicut

MASTER
→ rangos en orden editorial
→ canonical PART cache
→ cada PART se codifica una vez con VideoToolbox
→ concat compatible con `-c copy`
→ output

No ordenar por cronología del master si el manifest define otro orden.

## COMPOSITION

Sólo cuando hay XR/B-roll/Motion/captions/texto/SFX:

MASTER
→ ranges
→ proxy/cache bajo demanda
→ VideoFlow/Abraxas Preview
→ Production Graph
→ render final.

## Principio de velocidad

Importar un master de 2–4 horas NO significa transcodificarlo entero.

El source debe quedar disponible de inmediato y los PARTS/proxies se generan
sólo para los rangos realmente necesarios.
