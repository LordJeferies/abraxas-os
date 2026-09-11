# Abraxas OS — Automated Composition Plan

Sí: el objetivo final incluye automatización audiovisual completa.

## Pipeline

SOURCE
→ transcription / semantic analysis
→ Beta / Alfa
→ Production Graph
→ Automation Plan
→ Ghost Timeline
→ Resource Fulfillment
→ Preview
→ Render

## 1. Captions automáticos

La transcripción debe entregar timing por palabra/frase.

Caption Engine aplica un preset:

- máximo de líneas;
- caracteres por línea;
- duración mínima/máxima;
- posición;
- énfasis por palabra clave;
- safe zones;
- estilo por cliente.

No se "quema" caption hasta que el Production Graph lo aprueba.

## 2. Zooms / movimientos automáticos

Motion Engine puede aplicar movimientos a:

- A-roll;
- B-roll;
- XR;
- imágenes;
- captions/texto.

Las reglas pueden incluir:

- intensidad;
- duración;
- frecuencia máxima;
- prohibir dos movimientos fuertes seguidos;
- usar push-in en énfasis;
- hold en momentos sensibles;
- pan/ken-burns en fotos.

## 3. XR desde carpeta/repositorio de fotos

Asset Library registra imágenes/videos con:

- path privado;
- tags;
- persona/tema;
- orientación;
- campaña;
- cliente;
- prioridad;
- uso previo.

Un Ghost XR puede decir:

"necesito 3 imágenes de X entre 01:20–01:26"

Asset Resolver selecciona assets compatibles.

XR Composer:

- ordena;
- recorta;
- adapta encuadre;
- anima;
- aplica transiciones;
- respeta el preset visual.

## 4. SFX Repository

Repositorio local con sonidos etiquetados:

- click;
- whoosh;
- hit;
- piano;
- riser;
- ambience;
- etc.

Un Ghost SFX contiene:

- momento;
- intención;
- motivo;
- intensidad;
- duración esperada.

SFX Resolver selecciona un sonido compatible,
lo posiciona y aplica fade/gain/ducking según reglas.

## 5. Timeline fantasma

Ghost NO es un tipo.

Es estado de cualquier recurso:

- XR ghost;
- B-roll ghost;
- SFX ghost;
- Motion ghost;
- Caption ghost;
- Music ghost.

Cuando el motor encuentra/crea el recurso:

ghost
→ planned
→ ready
→ materialized
→ approved

## 6. Automatización determinista + IA

La IA decide QUÉ recurso tiene sentido y POR QUÉ.

Los presets/rules deciden CÓMO ejecutarlo de forma consistente.

Ejemplo:

semantic event:
"momento de revelación"

→ motion rule: push-in suave
→ caption rule: énfasis en keyword
→ SFX rule: no usar hit agresivo
→ XR rule: usar sólo si aporta comprensión

Esto evita que el sistema añada efectos "porque sí".

## 7. Modos

CUT_ONLY:
master → timestamps → cut engine

COMPOSITION:
master → ranges/proxies → automation plan → renderer

STATIC_VISUAL:
slides/pages/layers, sin timeline audiovisual falsa.

## Regla de calidad

La automatización nunca debe significar "más efectos".

Debe significar:
el recurso correcto, en el momento correcto, con el preset correcto.
