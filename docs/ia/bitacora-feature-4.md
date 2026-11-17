# Bitácora de IA — Feature 4 (panel con ventanas modales)

Herramienta: **Claude Code** (modelo Claude Opus) con la skill `grilling` (sesión de preguntas por
rondas). Especificación: [`docs/feature-4/especificacion.md`](../feature-4/especificacion.md). Plan:
[`docs/feature-4/plan.md`](../feature-4/plan.md). Bocetos: [`docs/feature-4/bocetos/`](../feature-4/bocetos/).

> Cada integrante debe poder explicar cada fila. Si una fila no se entiende, no se entrega.

## Especificación y plan a partir de los bocetos (2026-11-16)

Se partió de 8 bocetos de ventanas modales y se compararon con el panel actual (`NetworkPage`,
`NetworkMapCard`, `Modal`, diálogos). Hubo tres rondas de preguntas (29 decisiones, D-01 a D-29). Se
aceptaron todas las recomendaciones.

| # | Decisión o pieza | Herramienta / objetivo de IA | Propuesta recibida | Acepté o rechacé y por qué | Cómo la verifiqué |
|---|------------------|------------------------------|--------------------|----------------------------|-------------------|
| 1 | Composición de `/app` | Claude Code · contraste boceto/código | Encabezado + contadores + mapa a todo el ancho; planificador, cobertura y tablas pasan a modales | **Aceptada.** Es lo que muestran los bocetos | Fondo desenfocado de los bocetos frente a `NetworkPage.tsx` |
| 2 | Navegación «Volver» | Claude Code · arquitectura | Un solo `<dialog>` con pila de vistas | **Aceptada.** Foco y Esc más simples que modales apilados | — |
| 3 | Trazas Dijkstra/BFS | Claude Code · diseño | Conservarlas en un plegable «Cómo se calculó» | **Aceptada.** Muestran que los algoritmos son propios (regla 3) sin alterar el boceto | — |
| 4 | Alcance a un destino | Claude Code · diseño | Eliminar `checkReachability` del panel | **Aceptada.** No aparece en los bocetos | — |
| 5 | Cabecera de los modales | Claude Code · diseño | Rediseñar `Modal.tsx` una vez; todos los diálogos la heredan | **Aceptada.** Estilo uniforme | — |
| 6 | Reutilización | Claude Code · arquitectura | Convertir las tarjetas y tablas actuales en cuerpos de modal | **Aceptada.** Se conservan servicios, hooks y tokens | `NetworkTables` ya tiene pestañas y buscador |
| 7 | Validación | Claude Code · pruebas | Build, lint, escenarios PASÓ/FALLÓ en el navegador, capturas y aceptación de la API | **Aceptada.** Las pruebas con `urllib` son para la API, que no cambia | — |
| 8 | Tarifa del boceto ($500) | Claude Code · contraste con la API | Mostrar la tarifa que devuelve la API | **Aceptada.** No se fija en el código | `types/route.ts` (`tarifa_por_minuto`) |
| 9 | Columna COSTO en Trayectos | Claude Code · contraste con la API | Riesgo R-2: la tarifa solo llega en `/api/ruta`; decidir al iniciar T2 | **Pendiente** | `types/network.ts`: `costo` es el tiempo en minutos |
