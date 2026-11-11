# Panel «Mi red de entregas» · Plan técnico

> Divide [`especificacion-mi-red.md`](especificacion-mi-red.md) en tareas pequeñas. Rama
> `feature/3-panel-mi-red` (sale de `feature/3-adicion-costo`, la única con `costo_monetario`).
> Orden de CLAUDE.md: aquí el núcleo y la API ya existen, así que se va de **interfaz → validación →
> documentación**. El backend no se toca.

## 1. Punto de partida (verificado el 2026-11-11)

| Tema | Estado actual |
|------|---------------|
| Stack | React 19 · react-router 7 · TypeScript 6 · Vite 8. Sin Tailwind, sin librerías de UI ni de iconos. |
| Estilos | Tokens en `src/styles/panel-tokens.css`, formas en `panel-shape.css`, controles en `panel-controls.css`, un CSS Module por componente. |
| Iconos | SVG propios en `src/components/panel/shared/icons.tsx` y el símbolo `#graph-logo` de `index.html`. |
| Fuentes | Google Fonts: Inter Tight 500–700, Manrope 400–700 (falta el 800). |
| API | `src/services/httpClient.ts` es la única puerta a `fetch`; el proxy `/api` de Vite apunta a `127.0.0.1:8000`. |
| Feature 3 | **Ningún servicio React llama a `/api/ruta`.** Solo `frontend/legacy` lo usa. |
| Calidad | `npm run build` y `npm run lint` pasan. No hay script de pruebas del frontend. |

## 2. Cómo ejecutar

```bash
python main.py --ejemplo        # terminal 1, API en http://127.0.0.1:8000 con la red de ejemplo
cd frontend && npm run dev      # terminal 2, panel en http://localhost:5173/app
```

Se agrega `.claude/launch.json` (raíz) con las dos configuraciones (`api` y `panel`) para poder
abrir la vista previa en el navegador integrado.

## 3. Mapa de archivos

### Nuevos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/types/route.ts` | Tipos del contrato de `/api/ruta` (`RouteFound`, `RouteNotFound`, `RouteLeg`, `FewestHopsComparison`, `DijkstraStep`). |
| `src/services/routeService.ts` | `getRoute(o, d)` y `routeImageUrl(o, d, version)`. |
| `src/constants/pointNames.ts` | Diccionario de §6 y `displayName(id)`. |
| `src/lib/formatCop.ts` | `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`. |
| `src/lib/networkLayout.ts` | Función pura: posiciones `{x, y}` por lugar a partir de `capas` y `no_alcanzables` de la API, y desplazamiento de aristas en ambos sentidos. No recorre el grafo. |
| `src/hooks/useDeliverySelection.ts` | Origen, destino, valores por defecto (D-11), intercambio y modo del mapa. |
| `src/hooks/useRouteQuery.ts` | Estado de la consulta de ruta (cargando, resultado, error) y su invalidación. |
| `src/hooks/useMapViewport.ts` | Zoom (+/−), arrastre con *pointer events* y recentrar. |
| `src/components/panel/page/NetworkPage.tsx` | Página única: compone todas las secciones. |
| `src/components/panel/page/PageIntro.tsx` | Antetítulo, título, frase y «Agregar lugar». |
| `src/components/panel/page/StatCards.tsx` | Los tres contadores. |
| `src/components/panel/page/PanelFooter.tsx` | Pie de página. |
| `src/components/panel/map/NetworkMapCard.tsx` | Tarjeta: título, «Agregar trayecto», selector de modo, lienzo, leyenda, enlace al PNG. |
| `src/components/panel/map/NetworkMap.tsx` | SVG: nodos, aristas, etiquetas, resaltados por modo, estado vacío. |
| `src/components/panel/map/MapNode.tsx`, `MapEdge.tsx`, `MapControls.tsx`, `MapLegend.tsx` | Piezas del lienzo. |
| `src/components/panel/planner/DeliveryPlannerCard.tsx` | «Tu próxima entrega»: selectores, ⇅, botón, estado inicial. |
| `src/components/panel/planner/RouteResult.tsx` | Veredicto, cifras, tramos, comparación, explicación. |
| `src/components/panel/planner/DijkstraTrace.tsx` | Desplegable «Ver cómo se calculó». |
| `src/components/panel/coverage/CoverageCard.tsx` | «¿Hasta dónde puedes llegar?». |
| `src/components/panel/tables/NetworkTables.tsx` | Pestañas, buscador y pie. |
| `src/components/panel/tables/PlacesTable.tsx`, `TripsTable.tsx` | Filas y versión apilada en móvil. |
| `src/components/panel/dialogs/AddPointDialog.tsx`, `AddConnectionDialog.tsx` | Formularios en diálogo (reutilizan la lógica de `PointForm` y `ConnectionForm`). |
| `src/components/panel/dialogs/PointDetailDialog.tsx` | Detalle del lugar con `GET /api/puntos/{id}` (reutiliza la lógica de `PointLookup`). |
| `src/components/panel/dialogs/HelpDialog.tsx` | «Ayuda y cómo funciona». |
| `src/components/panel/layout/DemoMenu.tsx` | «Modo de demostración»: cargar ejemplo y vaciar red. |
| `.claude/launch.json` | Configuraciones `api` y `panel`. |

Cada componente nuevo con estilos lleva su `*.module.css`.

### Se modifican

| Archivo | Cambio |
|---------|--------|
| `index.html` | Agregar Manrope 800. |
| `src/styles/panel-tokens.css` | Tokens del brief que falten: estados (texto/fondo), información `#EAF0FD`, lavanda, radios 14/8/6, alturas 36/40, sombra azulada. |
| `src/styles/panel-shape.css`, `panel-controls.css` | Ajustes de tarjetas, botones, selectores, pestañas y chips al brief. |
| `src/routes.ts`, `src/App.tsx` | `/app` → `NetworkPage`; `/app/*` → `<Navigate to="/app" replace />`. |
| `src/components/header/HeaderLight.tsx` / `.css` | Variante del panel: pastilla única, ayuda y bloque de demostración; sin subnavegación. |
| `src/components/panel/layout/PanelLayout.tsx` | Usa el header nuevo y renderiza `NetworkPage`. |
| `src/hooks/useCoverageQuery.ts` | Que la cobertura siga al origen elegido (si hace falta). |
| `src/components/panel/shared/TypeBadge`, `PathChips`, `ConfirmDialog`, `InlineError`, `ToastViewport`, `icons.tsx` | Se reutilizan; se agregan los iconos que faltan (caja, pin, objetivo, ruta, intercambio, ayuda, lupa, zoom). |
| `src/components/panel/coverage/TraversalTrace.tsx`, `BfsLayers.tsx` | Se reutilizan dentro del desplegable de cobertura. |

### Se borran (si quedan sin importaciones; se confirma con `grep` antes de borrar)

`overview/*` (`OverviewView`, `NetworkSummary`, `AdjacencyList`, `UpdatedAgo`), `points/PointsView`,
`points/PointLookup`, `coverage/CoverageView`, `CoverageForm`, `CoverageResult`, `StatTiles`,
`ReachableList`, `UnreachableList`, `ReachabilityResult`, `shared/GraphImage`, `NetworkImageCard`,
`CopyLinkChip`, `EndpointLabel`, `PointDatalist`, `layout/ViewHeader`, `PanelHeaderActions` y sus
`*.module.css`. `LoadSampleButton` se conserva si `DemoMenu` y el estado vacío lo reutilizan.

## 4. Diseño del mapa

1. **Datos:** `/api/red` (`lista_adyacencia`) para nodos y aristas; `/api/cobertura/{origen}` para
   `capas` y `no_alcanzables`.
2. **Columnas:** cada capa del BFS es una columna (origen a la izquierda). Los no alcanzables van en una
   columna extra a la derecha, arriba, como «La Laguna» en la captura. Dentro de una columna, los
   lugares se reparten en vertical en el orden de la capa.
3. **Aristas:** recta con flecha y etiqueta «N min» en el punto medio (fondo del lienzo detrás del
   texto). Si existe A→B y B→A, cada una se desplaza ±6 px en perpendicular.
4. **Vista:** `viewBox` según el número de columnas y filas; zoom 0,6×–2,5× con pasos de 0,2; arrastre
   con *pointer events*; recentrar vuelve a 1× y al centro.
5. **Modos:** clases CSS sobre nodos y aristas (`is-route`, `is-fewest`, `is-dimmed`, `is-unreachable`)
   según el resultado de la consulta activa. Transiciones desactivadas con `prefers-reduced-motion`.
6. **Accesibilidad:** `role="img"` con `aria-label` que resume la red, y un `<title>` por nodo y arista.
   Las tablas son la alternativa textual completa.

Esto cumple la regla 3 de `CLAUDE.md`: el frontend solo dibuja lo que ya calculó el backend.

## 5. Tareas

| # | Tarea | Criterios | Commit |
|---|-------|-----------|--------|
| T1 | Especificación, plan y bitácora (este documento) | — | `docs:` |
| T2 | Tokens, fuentes, rutas de página única y `launch.json` | CA-M01 | `feat:` |
| T3 | Header del panel, menú de demostración y diálogo de ayuda | CA-M12, CA-M16 | `feat:` |
| T4 | Capa de datos: tipos y servicio de ruta, nombres, formato COP, `useDeliverySelection`, `useRouteQuery` | CA-M03 | `feat:` |
| T5 | Página: encabezado, contadores, rejilla de dos columnas, nota y pie | CA-M01, CA-M02 | `feat:` |
| T6 | Mapa SVG: distribución, aristas, zoom y arrastre, modos, leyenda, enlace al PNG, estado vacío | CA-M04, CA-M05, CA-M14 | `feat:` |
| T7 | Planificador: formulario, resultado, comparación, sin ruta, errores, traza de Dijkstra | CA-M06, CA-M07, CA-M15 | `feat:` |
| T8 | Tarjeta de cobertura, modo Cobertura con destino y traza BFS | CA-M08, CA-M15 | `feat:` |
| T9 | Tablas, buscador y detalle del lugar | CA-M13, CA-M18 | `feat:` |
| T10 | Diálogos para agregar lugar y trayecto, con recarga de datos (RI-06) | CA-M09, CA-M10, CA-M11 | `feat:` |
| T11 | Borrar el código sin uso | CA-M20 | `refactor:` |
| T12 | Pase de móvil y accesibilidad | CA-M17 | `fix:` |
| T13 | Validación completa y capturas de evidencia | CA-M19, CA-M20 | `test:` |
| T14 | `docs/frontend/plan.md` (prueba manual), `frontend/README.md` y bitácora | — | `docs:` |

## 6. Validación (T13)

1. `npm run build` y `npm run lint` desde `frontend/`.
2. Con `python main.py --ejemplo`: `python pruebas/aceptacion_feature1.py`, `..._feature2.py` y
   `..._feature3.py`. Deben seguir en verde (prueban que el backend no cambió).
3. En el navegador integrado, a **1440 px** y **390 px**, comparar con las capturas de referencia:
   header, encabezado, contadores, mapa, planificador, cobertura, tablas y pie.
4. Estados interactivos, cada uno con su captura:
   - los tres modos del mapa, el zoom y recentrar;
   - Bodega Central → La Estación (ruta encontrada con comparación);
   - Bodega Central → La Laguna (inalcanzable con explicación);
   - agregar un lugar y un trayecto; costo `0` (400) y duplicado (409);
   - detalle de un lugar, el buscador y «Ver imagen generada»;
   - vaciar la red (estado vacío) y cargar el ejemplo;
   - API apagada (aviso y reintento);
   - recargar la página (nada persiste en el navegador).
5. Consola del navegador sin errores.

## 7. Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Las capturas usan datos distintos (6 lugares y 8 trayectos) a la red de ejemplo real (7 y 10). | Se reproduce la composición, no las cifras; las cifras salen de la API. |
| Las posiciones de los nodos no serán idénticas a la captura. | La distribución por capas da la misma lectura (origen a la izquierda, inalcanzables arriba a la derecha). |
| La tarifa de `Guias.md` (500) no coincide con la del backend (200). | D-01: se muestra la de la API; el cambio va en una tarea aparte del backend. |
| Mapa ilegible en móvil con muchos lugares. | Zoom, arrastre y altura mínima; las tablas son la alternativa completa. |
