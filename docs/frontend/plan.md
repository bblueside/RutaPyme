# Panel React — Plan técnico

> Documento SDD del nuevo frontend (`frontend/src`). Se apoya en los criterios ya aprobados de la
> Feature 1 (CA-01 a CA-16) y de la Feature 2 (CA-17 a CA-31) y agrega los criterios propios del
> panel (sección 3). La composición visual está en [`plan-diseno.md`](plan-diseno.md) y sus bocetos
> aprobados (`bocetos/`). Se versiona en `feature_2/frontend` antes de escribir código.
> Decisiones tomadas en una sesión de preguntas con IA: ver `docs/ia/bitacora-frontend.md`.

## 1. Objetivo

Reemplazar el placeholder "Panel en construcción" de `/app` por un panel en **React + TypeScript**
que consuma **todos** los endpoints de la API real y cubra todas las funcionalidades del backend:
registrar y consultar puntos, registrar conexiones, ver la red (resumen, lista de adyacencia e
imagen), cargar la red de ejemplo, vaciar la red y consultar la cobertura de entregas.

El frontend legacy (`frontend/legacy/`, servido por el backend en `:8000`) **no se toca** y sigue
como respaldo.

## 2. Decisiones de arquitectura

| Tema | Decisión |
|------|----------|
| Rutas | Subrutas anidadas: `/app` (resumen), `/app/points`, `/app/connections`, `/app/coverage?from=&to=` |
| Conexión con la API | Proxy de Vite: `/api` → `http://127.0.0.1:8000`. El backend no cambia (no hay CORS) |
| Estado | React Context propio (`NetworkContext`, `ApiHealthContext`, `ToastContext`). Sin dependencias nuevas |
| Carpetas | Por tipo de archivo: `types/`, `services/`, `constants/`, `context/`, `hooks/`, `styles/`, `components/panel/…` |
| Estilos | CSS Modules (`*.module.css`) por componente + un único `styles/panel-tokens.css` global |
| Tokens visuales | Solo colores y fuentes de marca. **Este plan no define composición** (grillas, posiciones, tamaños) |
| Contrato | Los tipos TypeScript reflejan el JSON **tal cual** (claves en español). No hay capa de traducción |
| Idioma | Identificadores en inglés; textos de la interfaz y comentarios en español |
| Encabezado | Se reutiliza y extiende `HeaderLight`: ítems de navegación por ruta, CTA opcional y hueco `actions` |
| Mensajes | Toasts para mutaciones (crear, vaciar, cargar ejemplo); errores en línea para formularios y consultas |
| Acciones destructivas | Diálogo propio accesible con `<dialog>` (nada de `window.confirm`) |
| API caída | Indicador rojo + botón "Reintentar"; acciones deshabilitadas hasta reconectar. Sin sondeo |
| Cobertura | Origen y destino viven en la URL; se recalcula sola cuando cambia la versión de la red (CA-31) |
| Verificación | `npm run lint`, `npm run build`, checklist manual y control de ≤ 500 líneas por archivo |
| Git | Todo en la rama `feature_2/frontend`, un commit por paso (prefijos `feat:`, `docs:`, `test:`…) |

Reglas transversales:

1. **Una responsabilidad por archivo.** Un componente, un hook, un service o un grupo de tipos.
2. **Ningún archivo supera 500 líneas** (incluye `.tsx`, `.ts` y `.css`).
3. Las reglas del dominio (formato de identificador, costo > 0, duplicados) **las valida la API**; el
   frontend solo muestra su mensaje. Única validación propia: el origen de cobertura es obligatorio.
4. Toda petición pasa por `services/httpClient.ts`; ningún componente llama a `fetch` directamente.

## 3. Criterios de aceptación del panel

| ID | Dado | Cuando | Entonces |
|------|------|--------|----------|
| CA-P1 | la API encendida | se abre `/app` | se ve el encabezado con navegación Resumen · Puntos · Conexiones · Cobertura y el ítem activo marcado |
| CA-P2 | la API apagada | se abre `/app` | el indicador de salud está en rojo, hay un botón "Reintentar" y las acciones están deshabilitadas |
| CA-P3 | cualquier red | se pulsa "Cargar red de ejemplo" o "Vaciar red" | aparece un diálogo de confirmación; al confirmar se llama la API, se muestra un toast y todas las vistas se actualizan |
| CA-P4 | la vista Puntos | se registra un punto válido, duplicado o con formato inválido | 201 → toast y fila nueva; 409/400 → mensaje de la API en línea, junto al formulario |
| CA-P5 | la vista Puntos | se consultan las salidas de un punto existente o inexistente | se listan sus salidas con costo, o el mensaje 404/400 en línea |
| CA-P6 | la vista Conexiones | se registra una conexión válida, duplicada, con punto inexistente o costo inválido | 201 → toast y fila nueva; 409/404/400 → mensaje en línea |
| CA-P7 | la vista Resumen | se carga | muestra contadores (puntos, conexiones, por tipo), la lista de adyacencia y la imagen de la red; si la imagen da 503 se muestra el mensaje de la API |
| CA-P8 | la vista Cobertura | se consulta solo un origen | veredicto, alcanzables (saltos y `llega_desde`), no alcanzables con motivo, capas BFS, orden de visita, traza e imagen resaltada |
| CA-P9 | la vista Cobertura | se consulta origen y destino | veredicto; si es alcanzable, camino de evidencia, saltos y nota; si no, explicación y `alcanzables_desde_origen` |
| CA-P10 | una cobertura en pantalla | se copia la URL `/app/coverage?from=…&to=…` y se abre en otra pestaña | se ve la misma consulta |
| CA-P11 | una cobertura en pantalla | se registra una conexión, se carga el ejemplo o se vacía la red | la cobertura se recalcula; si el origen deja de existir, se limpia la URL y se avisa con un toast |
| CA-P12 | el formulario de cobertura sin origen | se envía | no se llama a la API; se muestra "Indique el punto de origen" en línea |
| CA-P13 | la landing en `/` | se navega por secciones y se pulsa el CTA | funciona igual que antes de modificar `HeaderLight` |
| CA-P14 | el código del panel | se revisa | `npm run lint` y `npm run build` pasan y ningún archivo supera 500 líneas |
| CA-P15 | las vistas Puntos o Conexiones | se registra un punto o una conexión válidos | la imagen de la red de esa vista se redibuja y muestra el punto nuevo (aunque no tenga conexiones) o la arista nueva, sin recargar la página |

## 4. Cobertura de endpoints

| Método | Ruta | Función del service | Quién la usa |
|--------|------|---------------------|--------------|
| GET | `/api/salud` | `healthService.getHealth` | `ApiHealthProvider` → `HealthIndicator` |
| GET | `/api/tipos` | `pointService.getPointTypes` | `PointForm` (opciones del tipo) |
| GET | `/api/puntos` | `pointService.listPoints` | `NetworkProvider` → `PointsTable`, `PointDatalist` |
| POST | `/api/puntos` | `pointService.createPoint` | `PointForm` |
| GET | `/api/puntos/{id}` | `pointService.getPoint` | `PointLookup` |
| GET | `/api/conexiones` | `connectionService.listConnections` | `NetworkProvider` → `ConnectionsTable` |
| POST | `/api/conexiones` | `connectionService.createConnection` | `ConnectionForm` |
| GET | `/api/red` | `networkService.getNetwork` | `NetworkProvider` → `NetworkSummary`, `AdjacencyList`, `PointsTable` (salidas) |
| DELETE | `/api/red` | `networkService.clearNetwork` | `PanelHeaderActions` |
| POST | `/api/red/ejemplo` | `networkService.loadSampleNetwork` | `PanelHeaderActions` |
| GET | `/api/red/imagen` | `networkService.networkImageUrl` | `GraphImage` en `OverviewView`, `PointsView` y `ConnectionsView` |
| GET | `/api/red/imagen/cobertura/{origen}` | `coverageService.coverageImageUrl` | `GraphImage` en `CoverageView` |
| GET | `/api/cobertura/{origen}` | `coverageService.getCoverage` | `useCoverageQuery` → `CoverageResult` |
| GET | `/api/cobertura/{origen}/{destino}` | `coverageService.checkReachability` | `useCoverageQuery` → `ReachabilityResult` |
| GET | `/api/cobertura` | — (no se llama) | CA-P12: el cliente exige el origen; el 400 `formato_incorrecto` queda cubierto por `pruebas/aceptacion_feature2.py` |

Errores que el panel debe saber mostrar: 400 `formato_incorrecto` / `dato_invalido`,
404 `punto_inexistente` / `red_vacia` / `ruta_no_encontrada`, 405 `metodo_no_permitido`,
409 `punto_duplicado` / `conexion_duplicada`, 503 `visualizacion_no_disponible` y la falta de red
(API apagada, que el cliente traduce a un error propio `sin_conexion`).

## 5. Mapa de archivos

Rutas relativas a `frontend/`. **N** = nuevo, **M** = modificado. Presupuesto = líneas máximas
orientativas (el límite duro es 500).

| Archivo | N/M | Responsabilidad única | Presupuesto |
|---------|-----|-----------------------|-------------|
| `vite.config.ts` | M | Proxy `/api` hacia la API real | 20 |
| `src/types/network.ts` | N | Tipos de puntos, conexiones, red y resumen | 60 |
| `src/types/coverage.ts` | N | Tipos de cobertura, verificación, capas y traza | 80 |
| `src/types/apiError.ts` | N | Forma del cuerpo de error `{error: {codigo, mensaje}}` | 20 |
| `src/services/httpClient.ts` | N | `request<T>()` y la clase `ApiError` (status, código, mensaje) | 70 |
| `src/services/healthService.ts` | N | `GET /api/salud` | 20 |
| `src/services/pointService.ts` | N | Tipos de punto, listar, crear y consultar un punto | 50 |
| `src/services/connectionService.ts` | N | Listar y crear conexiones | 35 |
| `src/services/networkService.ts` | N | Ver red, vaciar, cargar ejemplo, URL de la imagen | 50 |
| `src/services/coverageService.ts` | N | Cobertura, verificación, URL de la imagen de cobertura | 50 |
| `src/constants/pointTypes.ts` | N | Etiquetas en español de cada tipo de punto | 20 |
| `src/styles/panel-tokens.css` | N | Variables de color y fuente del panel (sin composición) | 60 |
| `src/routes.ts` | M | Agregar las rutas del panel (`PANEL_ROUTES`) | 20 |
| `src/App.tsx` | M | Montar `PanelLayout` con sus rutas hijas en `/app` | 100 |
| `src/context/apiHealthContext.ts` | N | `createContext` y tipo del estado de salud | 25 |
| `src/context/ApiHealthProvider.tsx` | N | Consultar salud al iniciar y al reintentar | 60 |
| `src/context/networkContext.ts` | N | `createContext` y tipo del estado de la red | 30 |
| `src/context/NetworkProvider.tsx` | N | Cargar puntos, conexiones y red; `version` y `refresh()` | 90 |
| `src/context/toastContext.ts` | N | `createContext` y tipo de los avisos | 25 |
| `src/context/ToastProvider.tsx` | N | Cola de avisos con cierre automático | 60 |
| `src/hooks/useApiHealth.ts` | N | Consumir `ApiHealthContext` | 15 |
| `src/hooks/useNetwork.ts` | N | Consumir `NetworkContext` | 15 |
| `src/hooks/useToast.ts` | N | Consumir `ToastContext` | 15 |
| `src/hooks/useSubmit.ts` | N | Estado de envío de un formulario: `pending`, `error`, `run()` | 50 |
| `src/hooks/useCoverageQuery.ts` | N | Leer `from`/`to` de la URL, consultar y recalcular por versión | 100 |
| `src/components/header/HeaderLight.tsx` | M | Ítems por ruta (`NavLink`), CTA opcional y hueco `actions` | 90 |
| `src/components/header/HeaderLight.css` | M | Estado activo de los ítems de ruta y del hueco `actions` | 110 |
| `components/panel/layout/PanelLayout.tsx` (+ `.module.css`) | N | Providers + `HeaderLight` + `<Outlet>` + `ToastViewport` | 70 |
| `components/panel/layout/PanelHeaderActions.tsx` (+ css) | N | Indicador de salud y botones "Cargar ejemplo" / "Vaciar" con confirmación | 90 |
| `components/panel/layout/HealthIndicator.tsx` (+ css) | N | Estado de la API y botón "Reintentar" | 50 |
| `components/panel/layout/OfflineNotice.tsx` (+ css) | N | Mensaje de API sin conexión en lugar de la vista | 40 |
| `components/panel/shared/ConfirmDialog.tsx` (+ css) | N | Diálogo `<dialog>` de confirmación accesible | 80 |
| `components/panel/shared/ToastViewport.tsx` (+ css) | N | Pintar los avisos (`aria-live`) | 50 |
| `components/panel/shared/TypeBadge.tsx` (+ css) | N | Insignia de color según el tipo de punto | 30 |
| `components/panel/shared/InlineError.tsx` (+ css) | N | Mensaje de error en línea (`role="alert"`) | 25 |
| `components/panel/shared/PointDatalist.tsx` | N | `<datalist>` con los identificadores de la red | 25 |
| `components/panel/shared/PathChips.tsx` (+ css) | N | Secuencia de puntos `A → B → C` | 35 |
| `components/panel/shared/GraphImage.tsx` (+ css) | N | `<img>` de la API con versión y mensaje si falla (p. ej. 503) | 70 |
| `components/panel/overview/OverviewView.tsx` | N | Vista Resumen: compone resumen, adyacencia e imagen | 50 |
| `components/panel/overview/NetworkSummary.tsx` (+ css) | N | Contadores de puntos, conexiones y por tipo | 50 |
| `components/panel/overview/AdjacencyList.tsx` (+ css) | N | Lista de adyacencia por punto (`red.lista_adyacencia`) con color del tipo | 50 |
| `components/panel/points/PointsView.tsx` | N | Vista Puntos: compone imagen en vivo, formulario, tabla y consulta | 45 |
| `components/panel/points/PointForm.tsx` (+ css) | N | Registrar punto (`POST /api/puntos`) | 90 |
| `components/panel/points/PointsTable.tsx` (+ css) | N | Tabla de puntos con tipo y número de salidas | 60 |
| `components/panel/points/PointLookup.tsx` (+ css) | N | Consultar salidas de un punto (`GET /api/puntos/{id}`) | 80 |
| `components/panel/connections/ConnectionsView.tsx` | N | Vista Conexiones: compone imagen en vivo, formulario, tabla y sugerencia | 45 |
| `components/panel/connections/ConnectionForm.tsx` (+ css) | N | Registrar conexión (`POST /api/conexiones`) | 100 |
| `components/panel/connections/ConnectionsTable.tsx` (+ css) | N | Tabla origen → destino con costo | 50 |
| `components/panel/coverage/CoverageView.tsx` | N | Vista Cobertura: formulario, resultado e imagen resaltada | 70 |
| `components/panel/coverage/CoverageForm.tsx` (+ css) | N | Origen/destino → parámetros de la URL; exige el origen | 90 |
| `components/panel/coverage/CoverageResult.tsx` (+ css) | N | Resultado de cobertura completa (compone las piezas siguientes) | 70 |
| `components/panel/coverage/ReachableList.tsx` (+ css) | N | Alcanzables con saltos y `llega_desde` | 50 |
| `components/panel/coverage/UnreachableList.tsx` (+ css) | N | No alcanzables con su motivo | 45 |
| `components/panel/coverage/BfsLayers.tsx` (+ css) | N | Capas del recorrido (nivel → puntos) | 45 |
| `components/panel/coverage/TraversalTrace.tsx` (+ css) | N | Traza paso a paso, plegable (`<details>`) | 60 |
| `components/panel/coverage/ReachabilityResult.tsx` (+ css) | N | Veredicto origen → destino: camino y nota, o explicación | 80 |
| `pruebas/prueba_manual_panel.md` (raíz del repo) | N | Checklist manual que recorre CA-P1 a CA-P15 | 150 |
| `docs/ia/bitacora-frontend.md` (raíz del repo) | N | Registro de propuestas de IA aceptadas y rechazadas | 80 |

`components/panel/…` está dentro de `src/`. Cada `(+ css)` es un `*.module.css` hermano con el mismo
nombre del componente.

## 6. Pasos de implementación

Cada paso termina con `npm run lint` y `npm run build` en verde y un commit en `feature_2/frontend`.
Para probar: terminal 1 `python main.py --ejemplo`; terminal 2 `cd frontend && npm run dev`.

1. **Proxy de Vite** — `vite.config.ts`: agregar `server.proxy` con `'/api': 'http://127.0.0.1:8000'`.
   Hecho cuando: con `npm run dev`, `http://localhost:5173/api/salud` responde el JSON de la API.
   Commit: `chore: proxy de Vite hacia la API real`.

2. **Tipos del contrato** — `types/network.ts`, `types/coverage.ts` y `types/apiError.ts` copiando las
   respuestas de `docs/feature-1/especificacion.md` y `docs/feature-2/especificacion.md` (sección 5),
   con las claves en español. `PointType` como unión literal (`'bodega' | 'barrio' | 'punto_recogida'`).
   Hecho cuando: compila y cada endpoint de la sección 4 tiene su tipo de respuesta.
   Commit: `feat: tipos del contrato de la API`.

3. **Cliente HTTP y services** — `httpClient.ts` con `request<T>(method, path, body?)`: arma JSON,
   lanza `ApiError` con `status`, `code` y `message` leídos del cuerpo de error, y convierte el fallo
   de red en `ApiError` con código `sin_conexion`. Luego los cinco services de la sección 4, usando
   `encodeURIComponent` en cada parámetro de ruta. Las funciones `…ImageUrl(…, version)` solo arman la
   URL con `?v=<version>` para que el navegador no use una imagen vieja.
   Hecho cuando: los 14 endpoints que se llaman tienen su función tipada.
   Commit: `feat: cliente HTTP y services de la API`.

4. **Tokens visuales** — `styles/panel-tokens.css` con variables `--panel-*`: colores de marca
   (`#0146C1`, `#E3E5FC`, fondo claro `#F6F7FE`, tinta `#0B1640` / `#4C5680`), estados (éxito, error,
   aviso), colores por tipo de punto (`#E4572E`, `#2E86AB`, `#3BB273`, los mismos de la imagen de
   NetworkX) y fuentes (Inter Tight para títulos, Manrope para texto, monoespaciada para
   identificadores). Solo variables: nada de tamaños, grillas ni posiciones. Se importa una vez en
   `PanelLayout`. `constants/pointTypes.ts` con las etiquetas en español.
   Commit: `feat: tokens de color y fuente del panel`.

5. **Contextos y hooks** —
   - `ApiHealthProvider`: llama `getHealth` al montar; expone `status` (`checking | online | offline`) y `retry()`.
   - `NetworkProvider`: si la API está `online`, carga en paralelo puntos, conexiones y red; expone
     esos datos, `loading`, `error`, `version` (entero que sube en cada `refresh()`) y `refresh()`.
   - `ToastProvider`: `notify(message, kind)` con `kind` = `success | error | warning` y cierre automático a los 4 s.
   - `useApiHealth`, `useNetwork` y `useToast` lanzan un error claro si se usan fuera de su provider.
   - `useSubmit(action)`: ejecuta la acción, guarda `pending` y `error` (`ApiError`) y devuelve el resultado.

   Context y Provider van en archivos separados para cumplir `react-refresh/only-export-components`.
   Commit: `feat: contextos de salud, red y avisos`.

6. **Piezas compartidas** — `ConfirmDialog` (usa `showModal()`, cierra con Esc, foco en "Cancelar"),
   `ToastViewport`, `TypeBadge`, `InlineError`, `PointDatalist`, `PathChips` y `GraphImage`. Si la
   imagen falla, `GraphImage` pide la misma URL con `request` para obtener y mostrar el mensaje de la
   API (p. ej. 503 `visualizacion_no_disponible` o 404 `punto_inexistente`).
   Commit: `feat: componentes compartidos del panel`.

7. **Encabezado, layout y rutas** —
   - `HeaderLight`: cada ítem de `sections` acepta `to` (se renderiza como `NavLink` y toma el estado
     activo del router) o se queda como botón con `onSelectSection` (landing). `ctaLabel` / `ctaHref`
     pasan a opcionales y se agrega `actions?: ReactNode`. La landing no cambia su forma de llamarlo.
   - `HealthIndicator`, `OfflineNotice` y `PanelHeaderActions` (diálogo antes de `loadSampleNetwork`
     y de `clearNetwork`; al terminar `notify` + `refresh()`; botones deshabilitados si `offline`).
   - `PanelLayout`: `ApiHealthProvider` > `NetworkProvider` > `ToastProvider`, `HeaderLight` con las
     cuatro rutas y `PanelHeaderActions` en `actions`, `<Outlet>` (u `OfflineNotice` si la API está caída) y `ToastViewport`.
   - `routes.ts`: `PANEL_ROUTES = { overview: '/app', points: '/app/points', connections: '/app/connections', coverage: '/app/coverage' }`.
   - `App.tsx`: `<Route path="/app" element={<PanelLayout />}>` con una ruta `index` y tres hijas;
     se elimina el placeholder.

   Hecho cuando: CA-P1, CA-P2, CA-P3 y CA-P13.
   Commit: `feat: layout del panel y navegación en HeaderLight`.

8. **Vista Resumen** — `NetworkSummary` (`red.resumen`), `AdjacencyList` (`red.lista_adyacencia`) y `GraphImage`
   con `networkImageUrl(version)`, compuestos en `OverviewView`.
   Hecho cuando: CA-P7.
   Commit: `feat: vista de resumen de la red`.

9. **Vista Puntos** — `PointForm` (tipos desde `getPointTypes`, `useSubmit(createPoint)`; si sale bien
   `notify` + `refresh()` y se limpia el identificador; si falla, `InlineError`), `PointsTable` (puntos
   + número de salidas desde `red.lista_adyacencia`), `PointLookup` (`getPoint`, salidas con costo o
   error en línea) y `PointsView`, con `GraphImage` (`networkImageUrl(version)`) arriba.
   Hecho cuando: CA-P4, CA-P5 y CA-P15 (el punto nuevo aparece en la imagen).
   Commit: `feat: vista de puntos`.

10. **Vista Conexiones** — `ConnectionForm` (origen y destino con `PointDatalist`; costo numérico,
    vacío → `null` para que la API responda su propio 400), `ConnectionsTable` y `ConnectionsView`, con `GraphImage` (`networkImageUrl(version)`) arriba.
    Hecho cuando: CA-P6 y CA-P15 (la arista nueva aparece en la imagen).
    Commit: `feat: vista de conexiones`.

11. **Vista Cobertura** —
    - `useCoverageQuery`: lee `from` y `to` con `useSearchParams`; si hay `from`, llama
      `checkReachability` (con `to`) o `getCoverage` (sin `to`) y repite cuando cambian `from`, `to` o
      `version` de la red. Si un recálculo por cambio de versión responde 404 (`punto_inexistente` o
      `red_vacia`), borra los parámetros de la URL y avisa con `notify` (CA-P11). Ignora respuestas
      que llegan tarde (bandera de cancelación en el efecto).
    - `CoverageForm`: escribe `from`/`to` en la URL; sin origen muestra `InlineError` y no llama a la
      API (CA-P12). Botón "Limpiar" que borra los parámetros.
    - `CoverageResult` (veredicto con `mensaje` + `ReachableList`, `UnreachableList`, `BfsLayers`,
      `PathChips` con `orden_visita` y `TraversalTrace`) y `ReachabilityResult` (`mensaje`; si es
      alcanzable, `PathChips` con `camino`, `saltos` y `nota`; si no, `explicacion` y
      `alcanzables_desde_origen`).
    - `CoverageView`: compone lo anterior y `GraphImage` con `coverageImageUrl(origen.id, version)`
      cuando hay resultado (usa el id normalizado que devuelve la API).

    Hecho cuando: CA-P8 a CA-P12.
    Commit: `feat: vista de cobertura de entregas`.

12. **Verificación** — escribir `pruebas/prueba_manual_panel.md` con un escenario por criterio
    CA-P1 a CA-P15 (escenario, esperado, obtenido, PASÓ/FALLÓ, igual que los scripts de aceptación) y
    ejecutarlo con la red de ejemplo. Control de líneas:
    `find frontend/src -name '*.ts*' -o -name '*.css' | xargs wc -l | sort -n | tail` → ningún
    archivo pasa de 500. Regresión del backend: `python pruebas/aceptacion_feature1.py` y
    `python pruebas/aceptacion_feature2.py` siguen en verde (no deberían cambiar).
    Commit: `test: checklist manual del panel`.

13. **Documentación** — `docs/ia/bitacora-frontend.md` con las decisiones de la sesión de preguntas y
    las propuestas de IA aceptadas o rechazadas durante la implementación; en `frontend/README.md`
    reemplazar el texto de la plantilla de Vite por cómo levantar el panel (API + `npm run dev`).
    Commit: `docs: bitácora y README del panel`.

## 7. Fuera de alcance

- Servir el build de React (`dist/`) desde el backend y retirar `frontend/legacy/`.
- Cambios en el backend (CORS, endpoints nuevos o reglas nuevas).
- Ruta de menor costo (Feature 3).
- Frameworks de pruebas en el frontend (Vitest, Testing Library) y dependencias de estado (React Query, Zustand).
- Definir la composición visual (disposición, tamaños, grillas): se decide al implementar cada vista.

## 8. Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Modificar `HeaderLight` rompe la landing | Props nuevas opcionales; la landing no cambia su llamada; CA-P13 en el checklist |
| Imagen vieja en caché tras un cambio | `?v=<version>` en la URL de la imagen (la API ya responde `Cache-Control: no-store`) |
| Respuestas de cobertura que llegan fuera de orden | Bandera de cancelación en `useCoverageQuery` |
| Tipos desalineados con la API | Se copian del contrato aprobado; cualquier cambio de contrato pasa primero por su especificación |
| Componentes que crecen sin control | Presupuesto de líneas por archivo (sección 5) y control en el paso 12 |
