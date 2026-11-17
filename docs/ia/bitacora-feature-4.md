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
| 9 | Columna COSTO en Trayectos | Claude Code · contraste con la API | Riesgo R-2: la tarifa solo llega en `/api/ruta` | **Se decidió al implementar T2** (fila 21) | `types/network.ts`: `costo` es el tiempo en minutos |

## Implementación de las tareas T1 a T6 (2026-11-16)

Herramienta: **Claude Code** (modelo Claude Sonnet 5.5), una rama por tarea, apilada sobre la anterior
(`feature/4-modal-pila` → `feature/4-gestionar-red` → `feature/4-planear-entrega` → `feature/4-cobertura` →
`feature/4-pagina` → `docs/feature-4-cierre`). Las decisiones de abajo salieron al implementar y **no estaban
cerradas en la especificación**: el revisor de cada PR las confirma o las rechaza.

| # | Decisión o pieza | Herramienta / objetivo de IA | Propuesta recibida | Acepté o rechacé y por qué | Cómo la verifiqué |
|---|------------------|------------------------------|--------------------|----------------------------|-------------------|
| 10 | Texto del campo «Nombre del lugar» | Claude Code · contraste con la API | El boceto pone «Ej. Barrio Occidente», pero `ID_PATTERN` de la API no admite espacios | **Ajustada (T2).** Ejemplo «Ej. Barrio-Occidente» y se conserva la pista de caracteres permitidos; el mensaje de error es el de la API | `backend/network.py` línea 26 y guardado de `BAR-OCCIDENTE` en el navegador |
| 11 | Formato de pesos | Claude Code · contraste con el boceto | `formatCop` pasa de «$ 3.600» a «$3.600» | **Adoptada (T2).** Coincide con los bocetos | Pantallas de Trayectos y de Planear entrega |
| 12 | Línea de tramos del resultado | Claude Code · diseño | Componente nuevo `RouteTimeline` (lugar · «Inicio», tramo con minutos y acumulados) en lugar de modificar `RoutePath` | **Adoptada (T3).** `RoutePath` seguía en uso por `CoverageCard` hasta T4; se borró en T4.5 al quedar sin uso | `npm run build`; CA-F4-13 en el navegador |
| 13 | Lista de Cobertura | Claude Code · contraste con la API | `/api/cobertura/{origen}` no incluye el origen en ninguna lista (`5 de 6` con 7 lugares): la lista muestra los demás lugares en el orden de la red | **Adoptada (T4).** Los contadores «n de m» coinciden con la lista | `curl /api/cobertura/BOD-CENTRO`; CA-F4-20 |
| 14 | Aviso de lugares fuera de cobertura | Claude Code · lógica pura | `describeUnreachable(names)` en `lib/` con los casos de D-18 | **Adoptada (T4).** Probada con 0, 1, 2, 3, 4 y 6 nombres | Script de Node con `--experimental-strip-types` |
| 15 | Foco al abrir un modal | Claude Code · accesibilidad | `autoFocus` de React no enfoca mientras el `<dialog>` sigue cerrado (el foco caía en la X). `Modal` enfoca el elemento con `data-autofocus` justo después de `showModal()` | **Adoptada (T5).** Cumple CA-F4-06 en la vista raíz de D-15 y deja «Cancelar» enfocado en las confirmaciones | Navegador: foco en el campo del formulario y en «Cancelar» |
| 16 | Tooltips de botones desactivados | Claude Code · diseño | Los botones de `PageIntro` y «+ Agregar trayecto» van dentro de un `<span title>` para que el navegador muestre el motivo aunque el botón esté desactivado | **Adoptada (T5).** Textos de §7; para Cobertura sin lugares se usó «Necesitas al menos un lugar.» (no estaba en §7) | CA-F4-25 y CA-F4-26 en el navegador |
| 17 | Los modales con pila conservan la vista de abajo | Claude Code · arquitectura | `StackDialog` deja montadas (ocultas) las vistas anteriores para que «Volver» no pierda la pestaña ni el buscador (CA-F4-08 y 10 exigen volver a la misma pestaña) | **Adoptada (T1).** Sin esto la pestaña volvía a «Tus lugares» tras agregar un trayecto | Navegador: pestaña Trayectos se mantiene tras guardar |
| 18 | CA-F4-24 con la API detenida | Claude Code · contraste con el código | El proveedor de salud no sondea y `PanelContent` reemplaza la página por `OfflineNotice` cuando está `offline`: la página degradada no se ve con la API caída. Se dejaron las reglas en los componentes y se comprobaron simulando el estado | **Pendiente de decisión del equipo.** Cambiar el proveedor de salud queda fuera del alcance de la especificación | `pruebas/prueba_manual_feature4.md`, nota 1 |
| 19 | Validación de la API | Claude Code · pruebas | Las aceptaciones 1, 2 y 3 se ejecutaron contra una API propia (puerto 8101). La 3 se cortó una vez con `ConnectionResetError` y pasó completa al repetirla | **Adoptada (T6).** El backend no cambió (`git diff main -- backend main.py datos` vacío) | 33/33, 27/27 y 39/39 |
| 20 | Capturas | Claude Code · evidencia | Salen del panel del navegador integrado (1440 px se reduce a 800 px de ancho; 390 px sale completo) | **Adoptada (T6).** Sirven de evidencia, no de maqueta pixel a pixel | `docs/feature-4/capturas/` frente a los bocetos |
| 21 | Columna COSTO en Trayectos (decisión de R-2) | Claude Code · contraste con la API | Pedir `GET /api/ruta` de un trayecto ya registrado al abrir Gestionar red (hook `useRatePerMinute`) y calcular `minutos × tarifa`, redondeando como la API (mitad hacia arriba) | **Adoptada (T2).** Evita mostrar «—» hasta consultar una ruta y no toca el backend; si la consulta falla, COSTO muestra «—» | Con la tarifa 200 de la API: 8 min → $1.600, igual que `costo_cop` de `/api/ruta/BOD-CENTRO/BAR-SUR` |
