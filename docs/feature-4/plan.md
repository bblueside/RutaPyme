# Feature 4 · Panel con ventanas modales · Plan técnico

> Divide [`especificacion.md`](especificacion.md) en tareas pequeñas (una rama y un PR por tarea).
> Rama base: `feature/4-frontend`. El núcleo y la API ya existen y **no se tocan**, así que el orden de
> CLAUDE.md queda en **interfaz → validación → documentación**.
> Decisiones de IA: [`docs/ia/bitacora-feature-4.md`](../ia/bitacora-feature-4.md).
> Estado: **ejecutado el 2026-11-16** (T1 a T6). Validación en [`pruebas/prueba_manual_feature4.md`](../../pruebas/prueba_manual_feature4.md).

## 1. Punto de partida (verificado el 2026-11-16)

| Tema | Estado actual |
|------|---------------|
| Página | `components/panel/page/NetworkPage.tsx` arma intro, contadores, mapa + tablas (columna principal) y planificador + cobertura + nota (columna lateral). |
| Estado compartido | `useDeliverySelection` (origen, destino, modo del mapa), `useRouteQuery`, `useApiResource` para cobertura y alcance, todo en `NetworkPage`. |
| Diálogos | `shared/Modal.tsx` sobre `<dialog>` con título, subtítulo y X. Diálogos independientes: `AddPointDialog`, `AddConnectionDialog`, `PointDetailDialog`, `HelpDialog`, `ConfirmDialog`, `LoadSampleDialog`, `ClearNetworkDialog`. Estado `Dialog` local en `NetworkPage`. |
| Tablas | `tables/NetworkTables.tsx` ya tiene las pestañas Tus lugares / Trayectos, el buscador sin tildes y la columna Estado según la cobertura. |
| Planificador | `planner/DeliveryPlannerCard`, `RouteResult`, `RoutePath`, `DijkstraTrace`. |
| Cobertura | `coverage/CoverageCard`, `BfsTrace`; `checkReachability` solo lo usa `NetworkPage`. |
| Iconos | `shared/icons.tsx` (SVG propios): `NetworkIcon`, `PinIcon`, `RouteIcon`, `TargetIcon`, `InfoIcon`, `ChevronRightIcon`, `SearchIcon`, `BoxIcon`, `PlusIcon`, `CloseIcon`… |
| Calidad | `npm run build` y `npm run lint`. Sin pruebas automáticas del frontend. |

## 2. Cómo ejecutar

```bash
python main.py --ejemplo        # terminal 1, API en http://127.0.0.1:8000 con la red de ejemplo
cd frontend && npm run dev      # terminal 2, panel en http://localhost:5173/app
```

## 3. Tareas

Orden obligatorio: T1 → T2 → T3 → T4 → T5 → T6. Hasta T5 la página actual sigue funcionando: los
modales nuevos se prueban abriéndolos desde los botones que ya existen. T5 hace el cambio visible.

### T1 · Cabecera de `Modal` y diálogo con pila de vistas — `feature/4-modal-pila`

Cubre D-03, D-09, D-11, D-15, D-19, D-23 · CA-F4-07, 11, 12, 27, 28.

| # | Paso | Archivos |
|---|------|----------|
| T1.1 | Agregar a `Modal` las props `icon?: ReactNode`, `onBack?: () => void` y `size: 'sm' \| 'md' \| 'lg'`. Cabecera nueva: «‹ Volver», cuadro con icono, título grande, subtítulo y X absoluta. Anchos 460/540/780, `max-height: 90vh`, cuerpo con desplazamiento. | `shared/Modal.tsx`, `shared/Modal.module.css` |
| T1.2 | Móvil (< 640 px): pantalla completa y pie de botones apilado (`.pn-actions` dentro del modal). | `Modal.module.css`, `styles/panel-controls.css` |
| T1.3 | Crear `StackDialog`: un `<dialog>` con una pila de vistas `{ id, title, subtitle, icon, size, render }`. Expone `push`, `pop`, `replace` y `close` por contexto (`useDialogStack`). Al hacer `push`, el foco va al título; al hacer `pop`, vuelve al disparador guardado. Esc cierra todo. | `shared/StackDialog.tsx` (nuevo), `context/dialogStackContext.ts` (nuevo), `hooks/useDialogStack.ts` (nuevo) |
| T1.4 | Pasar los diálogos existentes a la cabecera nueva (con título terminado en punto e icono): `HelpDialog`, `ConfirmDialog`, `LoadSampleDialog`, `ClearNetworkDialog`. Sin cambiar su contenido. | `dialogs/HelpDialog.tsx`, `shared/*Dialog.tsx` |
| T1.5 | Revisar `HelpDialog` por referencias al diseño anterior (D-27). | `dialogs/HelpDialog.tsx` |

**Listo cuando:** los diálogos actuales se ven con la cabecera de los bocetos, y un `StackDialog` de prueba
hace push y pop con «Volver» y foco correcto. Build y lint pasan.

### T2 · Gestionar red — `feature/4-gestionar-red`

Cubre D-02 (solo el modal), D-03, D-04, D-05, D-10, D-13, D-14, D-16, D-25, D-26, D-29 · CA-F4-02 a 12, 24 a 26.

| # | Paso | Archivos |
|---|------|----------|
| T2.1 | Extraer los formularios en componentes de vista: `PointForm` y `ConnectionForm` con `onDone` y `onCancel`. Al terminar con éxito: toast, `refresh()` y `pop()` (o `close()` si es la raíz, D-15). Textos e iconos según §6.4 y §6.5 de la especificación, con el recuadro informativo. Desplegables solo con `displayName`. | `dialogs/PointForm.tsx`, `dialogs/ConnectionForm.tsx` (nuevos, salen de `AddPointDialog` y `AddConnectionDialog`) |
| T2.2 | Extraer `PointDetail` como vista (título «<Nombre>.», icono del tipo). | `dialogs/PointDetailDialog.tsx` → `dialogs/PointDetailView.tsx` |
| T2.3 | Adaptar `NetworkTables` como cuerpo de la vista «Los detalles de tu red.»: botón azul según la pestaña (Agregar lugar o Agregar trayecto), columnas de §6.3 (incluido COSTO en Trayectos, calculado con la tarifa de la API), flechas del teclado en `tablist`, estados vacíos y sin resultados de §7, Estado «—» sin origen. «›» hace push del detalle. | `tables/NetworkTables.tsx`, `.module.css` |
| T2.4 | Sin conexión: oculta o desactiva los botones de agregar. Con < 2 lugares, «+ Agregar trayecto» queda desactivado con tooltip. | `tables/NetworkTables.tsx` |
| T2.5 | `NetworkDetailsDialog`: abre el `StackDialog` con la vista raíz Gestionar red (`lg`). Temporalmente se conecta a un botón existente para poder probarlo. | `dialogs/NetworkDetailsDialog.tsx` (nuevo) |

> **Costo por trayecto (verificado).** En `/api/red`, `costo` es el tiempo en minutos. La tarifa
> (`tarifa_por_minuto`) solo llega en la respuesta de `/api/ruta`. Hay dos opciones sin tocar el backend:
> mostrar COSTO solo cuando ya se consultó una ruta («—» antes), o pedir una ruta entre dos lugares conectados
> al abrir el modal para obtener la tarifa. Se decide al iniciar T2 y se registra en la bitácora (riesgo R-2).

**Listo cuando:** CA-F4-02 a 12 pasan con el modal abierto desde un botón temporal.

### T3 · Planear entrega — `feature/4-planear-entrega`

Cubre D-06, D-07, D-08, D-17 · CA-F4-13 a 19.

| # | Paso | Archivos |
|---|------|----------|
| T3.1 | Convertir `DeliveryPlannerCard` en el cuerpo `DeliveryPlannerView`: etiquetas «○ Punto de origen» y «⌖ Destino», botón ⇅ entre campos, botón primario a todo el ancho con flecha. | `planner/DeliveryPlannerCard.tsx` → `planner/DeliveryPlannerView.tsx`, CSS |
| T3.2 | Rediseñar `RouteResult`: veredicto + «RUTA ÓPTIMA», dos tarjetas (tiempo y costo), `RoutePath` con «Inicio» y acumulados, comparación de menos tramos, tarifa de la API, `<details>` «Cómo se calculó» con `DijkstraTrace`, y el caso sin ruta (§7). | `planner/RouteResult.tsx`, `RoutePath.tsx`, CSS |
| T3.3 | Ocultar el resultado si cambian origen o destino (`useRouteQuery` compara la clave consultada con la actual). | `hooks/useRouteQuery.ts` |
| T3.4 | «Ver ruta en la red»: callback `onShowOnMap('route')` que cierra el diálogo, cambia el modo y hace `scrollIntoView({ behavior: 'smooth' })` sobre la tarjeta del mapa. | `planner/DeliveryPlannerView.tsx`, `page/NetworkPage.tsx` |
| T3.5 | `DeliveryPlannerDialog` (`md`, `RouteIcon`) que recibe la selección compartida por props. | `planner/DeliveryPlannerDialog.tsx` (nuevo) |

**Listo cuando:** CA-F4-13 a 19 pasan.

### T4 · Cobertura — `feature/4-cobertura`

Cubre D-05, D-06, D-07, D-17, D-18 · CA-F4-19 a 23.

| # | Paso | Archivos |
|---|------|----------|
| T4.1 | Convertir `CoverageCard` en el cuerpo `CoverageView`: desplegable de origen (comparte `setOrigin`), frase «Desde X puedes llegar a n de m lugares.», barra y leyenda. | `coverage/CoverageCard.tsx` → `coverage/CoverageView.tsx`, CSS |
| T4.2 | Aviso naranja o verde según D-18 (función pura `describeUnreachable(names)` en `lib/`). | `lib/describeUnreachable.ts` (nuevo) |
| T4.3 | Lista con icono del tipo, insignia y «›», que hace push de `PointDetailView`. | `coverage/CoverageView.tsx` |
| T4.4 | `<details>` «Cómo se calculó» con `BfsTrace`. Enlace «Ver cobertura en la red →» con `onShowOnMap('coverage')`. | `coverage/CoverageView.tsx` |
| T4.5 | Quitar `checkReachability` del panel: su uso en `NetworkPage`, el modo cobertura con camino en `NetworkMapCard` y el servicio si queda sin uso. | `page/NetworkPage.tsx`, `map/NetworkMapCard.tsx`, `services/coverageService.ts`, `types/coverage.ts` |
| T4.6 | `CoverageDialog` (`md`, `TargetIcon`). | `coverage/CoverageDialog.tsx` (nuevo) |

**Listo cuando:** CA-F4-19 a 23 pasan.

### T5 · Recomposición de la página — `feature/4-pagina`

Cubre D-01, D-02, D-13, D-14, D-27 · CA-F4-01, 17, 23 a 27.

| # | Paso | Archivos |
|---|------|----------|
| T5.1 | `PageIntro`: quitar «Agregar lugar»; agregar «Cobertura» (secundario, `TargetIcon`) y «Planear entrega» (primario, `RouteIcon`) con las reglas de desactivación y tooltips de D-13 y D-14. | `page/PageIntro.tsx`, CSS |
| T5.2 | `NetworkMapCard`: cambiar los dos botones por «Gestionar red» (secundario, `NetworkIcon`); pistas de §7 con enlace que abre el modal; `ref` o `id` para el desplazamiento. | `map/NetworkMapCard.tsx`, CSS |
| T5.3 | `NetworkPage`: quitar la columna lateral, las tablas y la nota; el mapa a todo el ancho; un solo estado `openDialog: 'network' \| 'planner' \| 'coverage' \| 'add-point-root' \| null`; conectar `onShowOnMap`. | `page/NetworkPage.tsx`, `NetworkPage.module.css` |
| T5.4 | Borrar los componentes que queden sin uso (`AddPointDialog`, `AddConnectionDialog` y `PointDetailDialog` si ya los reemplazó la pila) y quitar los botones temporales de T2 a T4. | varios |
| T5.5 | Responsive: revisar 1440, 1024, 768 y 390 px. | CSS |

**Listo cuando:** CA-F4-01 y CA-F4-24 a 27 pasan, y los escenarios de T2 a T4 siguen pasando desde los botones definitivos.

### T6 · Validación y documentación — `docs/feature-4-cierre`

| # | Paso | Archivos |
|---|------|----------|
| T6.1 | Recorrer CA-F4-01 a 30 y escribir la tabla escenario / esperado / obtenido / PASÓ-FALLÓ. | `pruebas/prueba_manual_feature4.md` (nuevo) |
| T6.2 | Capturas de cada modal (1440 y 390 px) y de la página. | `docs/feature-4/capturas/` |
| T6.3 | Nota de reemplazo en `docs/frontend/especificacion-mi-red.md` y `plan-mi-red.md` (D-28). Actualizar `frontend/README.md` si describe la página. | docs |
| T6.4 | Cerrar la bitácora y cambiar la especificación a «implementada». | `docs/ia/bitacora-feature-4.md`, `especificacion.md` |

## 4. Mapa de archivos

| Acción | Archivos |
|--------|----------|
| **Nuevos** | `shared/StackDialog.tsx`, `context/dialogStackContext.ts`, `hooks/useDialogStack.ts`, `dialogs/PointForm.tsx`, `dialogs/ConnectionForm.tsx`, `dialogs/PointDetailView.tsx`, `dialogs/NetworkDetailsDialog.tsx`, `planner/DeliveryPlannerView.tsx`, `planner/DeliveryPlannerDialog.tsx`, `coverage/CoverageView.tsx`, `coverage/CoverageDialog.tsx`, `lib/describeUnreachable.ts` |
| **Cambian** | `shared/Modal.tsx` (+CSS), `tables/NetworkTables.tsx`, `planner/RouteResult.tsx`, `planner/RoutePath.tsx`, `hooks/useRouteQuery.ts`, `map/NetworkMapCard.tsx`, `page/NetworkPage.tsx`, `page/PageIntro.tsx`, `dialogs/HelpDialog.tsx`, diálogos de `shared/` |
| **Se borran (T5.4)** | `dialogs/AddPointDialog.tsx`, `dialogs/AddConnectionDialog.tsx`, `dialogs/PointDetailDialog.tsx`, `planner/DeliveryPlannerCard.*`, `coverage/CoverageCard.*` y uso de `checkReachability` |
| **Sin cambios** | Backend, landing, `frontend/legacy`, tokens de estilo, `PanelHeader`, `StatCards`, `NetworkMap`, `MapLegend`, `PanelFooter` |

## 5. Riesgos

| # | Riesgo | Mitigación |
|---|--------|------------|
| R-1 | El `<dialog>` nativo y la pila: el foco y Esc se comportan distinto entre navegadores. | Un solo `<dialog>`; se gestiona `onCancel` y el foco a mano (T1.3), y se prueba en Chrome y Firefox. |
| R-2 | La columna COSTO de Trayectos necesita la tarifa, que solo devuelve `/api/ruta`. | Decidir al iniciar T2 entre las dos opciones de la nota de T2; no se toca la API. |
| R-3 | Quitar las tablas y la columna lateral deja la página sin funciones si T5 se mezcla antes que T2 a T4. | Orden obligatorio y botones temporales hasta T5. |
| R-4 | Las trazas largas dentro de `md` hacen el modal muy alto. | Plegable cerrado por defecto con desplazamiento interno. |
| R-5 | Conflictos con otras ramas que tocan `NetworkPage`. | Ramas cortas, PR por tarea y rebase sobre `feature/4-frontend` antes de pedir revisión. |
