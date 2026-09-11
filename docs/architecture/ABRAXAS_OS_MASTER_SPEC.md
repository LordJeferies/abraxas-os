# ABRAXAS OS — MASTER SPEC

## Definición

Abraxas OS es un sistema operativo de producción de contenido.

Convierte material, conocimiento de marca y estructuras de producción en
objetos editoriales trazables y ejecutables.

No es solamente un editor de video.

## Flujo macro

SOURCE
→ ANALYSIS
→ BETA
→ ALFA
→ PRODUCTION
→ OMEGA
→ REVIEW
→ APPROVED
→ CALENDAR
→ READY TO PUBLISH
→ PUBLISHED

## Sol Blanco

Brand Knowledge Base.

Incluye:

- identidad
- posicionamiento
- audiencia
- voz
- vocabulario
- productos
- nicho
- campañas
- objetivos
- restricciones
- identidad visual
- estilos del cliente

## Sol Negro

Production Knowledge Base.

Incluye:

- estructuras de reel
- estructuras de intro
- storytelling
- XR
- B-roll
- motion
- SFX
- captions
- hooks
- carruseles
- posts
- newsletters
- QA
- reglas de producción

## Eclipse / Intelligence

Combina Sol Blanco + Sol Negro + Source Intelligence.

Produce potenciales de contenido y planes editoriales.

No es prioridad de F1, pero el modelo de datos debe permitirlo.

## Estados editoriales

BETA:
qué vale la pena crear.

ALFA:
cómo producirlo.

PRODUCTION:
assets y decisiones en ejecución.

OMEGA:
contenido materializado listo para revisión.

## Ghost

Ghost/Fantasma NO es un tipo de recurso.

Es un estado de producción.

Puede ser ghost:

- B-roll
- XR
- imagen
- SFX
- música
- VO
- motion
- caption
- transición
- recurso visual
- recurso sonoro

Estados iniciales:

ghost
creating
linked
ready
review
approved

## XR

XR es una secuencia visual diseñada/generada para complementar el discurso.

Es conceptualmente una modalidad especializada de B-roll producido o
diseñado con IA.

Puede contener varios assets/estados internos:

XR
├── S01 / A01
├── S02 / A02
├── S03 / A03
└── ...

Puede tener Motion.

Puede tener SFX solamente cuando el contexto visual/narrativo lo justifica.

SFX no es obligatorio.

## Motion

Motion es una operación aplicada a un objetivo.

Puede aplicarse a:

- A-roll
- B-roll
- XR completo
- estado interno de XR
- imagen
- texto
- caption
- overlay

Motion no pertenece exclusivamente a XR.

Ejemplos:

- scale
- pan
- push in
- pull out
- crop
- reframe
- position
- rotation
- opacity
- blur
- transition
- keyframes

## SFX

SFX es un evento independiente.

Puede asociarse con:

- XR
- B-roll
- aparición de texto
- transición
- corte
- gesto
- acción
- beat narrativo

Debe existir únicamente cuando tenga justificación contextual.

## Fuente de verdad

ABRAXAS PRODUCTION GRAPH

NO VideoFlow JSON.

NO HTML.

NO timeline visual.

VideoFlow será una proyección/render del Production Graph.

Esto permite sustituir motores sin destruir el proyecto.
