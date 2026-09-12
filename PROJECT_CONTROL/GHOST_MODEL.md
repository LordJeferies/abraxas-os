# Ghost Model

Ghost es ESTADO, no tipo.

Contrato de proyección autoritativo:
`contracts/alpha-videoflow-projection.v2.schema.json`

## De ficha Alpha a VideoFlow

HTML / JSON
→ AlphaContent
→ UNA ficha
→ UNA ruta
→ Production Graph (`timelineDirectives`)
→ Track Slot T1-T9
→ VideoFlow Track Container Group
→ Ghost Group acotado por start/end
→ Text children editoriales
→ futuros assets materializados

Cada Ghost Group conserva:
- `resourceId <-> GroupLayer.id`;
- track semántico;
- track slot;
- estado;
- start absoluto;
- end absoluto;
- duración = end - start;
- parentResourceId;
- información: qué va aquí / timing / prompt / referencia / hacer.

Los child resources usan timing relativo dentro del Group padre para VideoFlow,
pero la Timeline Abraxas siempre los dibuja con su timing absoluto de la ficha.
