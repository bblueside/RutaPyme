# Bitácora de IA — Panel React (`/app`)

Herramienta: **Claude Code** (modelo Claude Opus) con la skill `grilling` (sesión de preguntas por
rondas). Planes: [`docs/frontend/plan.md`](../frontend/plan.md) y
[`docs/frontend/plan-diseno.md`](../frontend/plan-diseno.md). Bocetos aprobados:
[`docs/frontend/bocetos/`](../frontend/bocetos/).

> Cada integrante debe poder explicar cada fila. Si una fila no se entiende, no se entrega.

## Ajuste del plan de diseño a los bocetos (2026-10-28)

El panel aparece al pulsar "Probar el optimizador" en la landing. Se partió de nueve bocetos y se
contrastaron con el contrato real de la API (`backend/api.py`, `backend/red.py`).

| # | Decisión o pieza | Herramienta / objetivo de IA | Propuesta recibida | Acepté o rechacé y por qué | Cómo la verifiqué |
|---|------------------|------------------------------|--------------------|----------------------------|-------------------|
| 1 | Qué documento cambiar | Claude Code · planificación | Actualizar `plan-diseno.md` con los bocetos y dejar `plan.md` casi igual | **Aceptada.** La arquitectura ya cubre todos los endpoints; solo cambia la composición | Revisión de `plan.md` §4 (cobertura de endpoints) |
| 2 | Marca en `HeaderLight` | Claude Code · diseño | Mantener el logo y agregar la etiqueta "Panel de rutas" | **Modificada.** Se mantiene el logo, **sin** etiqueta | — |
| 3 | Ítem para la Feature 3 | Claude Code · diseño | No agregarlo hasta que exista | **Aceptada.** Un botón sin función confunde en el pitch | — |
| 4 | Datos sin respaldo en la API | Claude Code · contraste boceto/contrato | Quitar costo total, "Estado", "Tipo de arco", "red vN" y resaltado de arista/destino; calcular "Actualizado hace X" en el cliente | **Aceptada.** No se cambia el backend; el costo total contradice la nota de la Feature 2 | `red.py` `verificar_cobertura` no devuelve costo; los puntos y conexiones no tienen estado ni tipo |
| 5 | Imagen del grafo | Claude Code · diseño | Usar el PNG de NetworkX de la API; el boceto solo lo representa | **Aceptada.** Regla 3 de `CLAUDE.md` | `visualizacion.dibujar_red` |
| 6 | Datos y textos | Claude Code · diseño | Todo desde la API real; "trayectos" en lugar de "saltos" | **Aceptada.** Glosario del plan de diseño | Mensajes de `red.py` |
| 7 | Pantallas pequeñas | Claude Code · diseño | Mantener la sección 7 aunque no haya bocetos de móvil | **Aceptada** | — |
| 8 | Errores del boceto | Claude Code · revisión | Error de origen solo con origen vacío; "Si no hay ruta" = variante no alcanzable; textos ajustados; toasts sin hora | **Aceptada** | — |
| 9 | Imagen en Conexiones | Claude Code · diseño | Mantenerla, sin "En vivo" ni leyenda de última conexión | **Aceptada con condición.** Debe redibujarse en tiempo real como hoy: punto nuevo y conexión nueva aparecen al instante | `frontend/legacy/app.js:97` recarga la imagen con `?v=` tras cada acción; CA-P15 en `plan.md` |
| 10 | Cabecera de vista | Claude Code · diseño | Sin eyebrow; título, frase y dato `meta` | **Aceptada** | — |
| 11 | Traza del recorrido | Claude Code · diseño | Abierta; más de 10 pasos → "Ver todos" | **Aceptada** | — |
| 12 | Chip de URL en Cobertura | Claude Code · diseño | Copia el enlace y muestra "Enlace copiado" | **Aceptada.** Apoya CA-P10 | — |
| 13 | Estados sin boceto | Claude Code · diseño | Red vacía con "Cargar red de ejemplo", esqueleto de carga, cobertura sin consulta con ejemplos | **Aceptada** | — |
| 14 | Tarjetas de ayuda | Claude Code · diseño | Mantener "Nota de la API" (campo `nota`) y "Sugerencia" con texto fijo | **Aceptada** | — |
| 15 | Bocetos en el repositorio | Claude Code · organización | Moverlos de `frontend/drafts/` a `docs/frontend/bocetos/` con nombres simples | **Aceptada** | `ls docs/frontend/bocetos` |
| 16 | Rama | Claude Code · flujo de trabajo | Seguir en `feature_2/frontend` con un primer commit `docs:` | **Aceptada** (en lugar de un PR de plan aparte) | — |
| 17 | Imagen en Puntos | Claude Code · diseño | Agregar la imagen en vivo también en Puntos | **Aceptada.** El punto registrado se ve en el diagrama sin cambiar de vista | — |
| 18 | Alcance del "tiempo real" | Claude Code · arquitectura | Redibujar tras cada acción del panel, sin sondeo | **Aceptada.** `plan.md` descarta el sondeo y la legacy funciona así | — |
| 19 | Alcance de "implementa este plan" | Claude Code · implementación | Como el panel no existía en `src/`, implementar `plan.md` (base) y `plan-diseno.md` (visual) juntos | **Aceptada.** El plan de diseño depende de contextos, services y vistas | `npm run lint` y `npm run build` en verde |
| 20 | Imagen de cobertura en la vista de ruta | Claude Code · implementación | Mostrarla también cuando el destino no es alcanzable | **Aceptada.** Es la imagen del origen; ayuda a explicar el veredicto | Revisión en el navegador |
| 21 | Orden de "Capas" en una columna | Claude Code · implementación | Renderizar `BfsLayers` dos veces (izquierda en escritorio, tras las listas en móvil) con `pn-only-desktop` / `pn-only-mobile` | **Aceptada.** Respeta el orden de la sección 7 sin reordenar con CSS | Revisión a 390 px |
| 22 | Reglas de React 19 del lint | Claude Code · implementación | Cargar datos con `.then(...)` en los efectos en lugar de funciones `async` que llaman a `setState` | **Aceptada.** `react-hooks/set-state-in-effect` lo exige | `npm run lint` |
