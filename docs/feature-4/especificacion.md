# Feature 4 · Panel con ventanas modales · Especificación

> Documento de entrada del desarrollo orientado a especificaciones (SDD) para recomponer el panel
> React (`/app`) según los bocetos de [`bocetos/`](bocetos/). Primero se acuerda **qué** hace y
> **cómo se ve**; después se escribe el código.
> Estado: **implementada** (2026-11-16; la revisión de otro integrante se registra en cada PR). Rama base: `feature/4-frontend`.
> Validación: [`pruebas/prueba_manual_feature4.md`](../../pruebas/prueba_manual_feature4.md) y capturas en [`capturas/`](capturas/).
> Plan técnico: [`plan.md`](plan.md). Decisiones de IA: [`docs/ia/bitacora-feature-4.md`](../ia/bitacora-feature-4.md).
> Reemplaza la composición de [`docs/frontend/especificacion-mi-red.md`](../frontend/especificacion-mi-red.md).

## 1. Valor

Hoy la página «Mi red de entregas» muestra todo a la vez: mapa, tablas y una columna lateral con el
planificador y la cobertura. Hay mucha información al mismo tiempo y el mapa queda angosto. Con los
bocetos, la página se queda con lo esencial (encabezado, contadores y mapa a todo el ancho) y cada tarea
del despachador se abre en una ventana modal enfocada en esa tarea: **gestionar la red**, **planear una
entrega** y **revisar la cobertura**.

## 2. Alcance

**Incluye:** la recomposición de `/app`, el rediseño de la cabecera de todos los modales, un diálogo con
pila de vistas («Volver»), los modales Gestionar red, Agregar lugar, Agregar trayecto, Detalle de lugar,
Planear entrega y Cobertura, sus estados (carga, vacío, sin conexión, error) y su versión móvil.

**No incluye:** cambios en el backend (`backend/`, `main.py`, `datos/`), en la landing (`/`) ni en
`frontend/legacy`. Ninguna dependencia nueva. Ninguna función que no aparezca en los bocetos o que la API
no ofrezca. No cambia el estado de la URL.

**Se mantiene igual:** fuentes, colores, tokens (`panel-tokens.css`, `panel-shape.css`,
`panel-controls.css`), clases `pn-*`, logo, header, contadores, mapa SVG, leyenda y footer.

## 3. Referencias

| Fuente | Qué aporta |
|--------|-----------|
| [`bocetos/ventana_modal_gestionar_red_1.png`](bocetos/ventana_modal_gestionar_red_1.png), [`_2`](bocetos/ventana_modal_gestionar_red_2.png) | «Los detalles de tu red.»: pestañas Tus lugares / Trayectos |
| [`bocetos/ventana_modal_agregar_lugar.png`](bocetos/ventana_modal_agregar_lugar.png) | «Un nuevo lugar en tu red.» con «Volver» |
| [`bocetos/ventana_modal_agregar_trayecto.png`](bocetos/ventana_modal_agregar_trayecto.png) | «Conecta dos lugares.» con «Volver» y recuadro informativo |
| [`bocetos/ventana_modal_planear_entrega_1.png`](bocetos/ventana_modal_planear_entrega_1.png), [`_2`](bocetos/ventana_modal_planear_entrega_2.png) | «Planea tu próxima entrega.» y su resultado |
| [`bocetos/ventana_modal_cobertura_1.png`](bocetos/ventana_modal_cobertura_1.png), [`_2`](bocetos/ventana_modal_cobertura_2.png) | «¿Hasta dónde puedes llegar?» |
| Fondo desenfocado de los bocetos | Encabezado con «Cobertura» y «Planear entrega»; mapa a todo el ancho con «Gestionar red» |
| `backend/api.py` | Contrato real (no cambia) |

## 4. Decisiones cerradas (sesión de preguntas, 2026-11-16)

| # | Decisión |
|---|----------|
| D-01 | La página queda en **encabezado + contadores + mapa a todo el ancho**. Se quitan la columna lateral (planificador, cobertura, nota «Ir no siempre significa poder volver») y las tablas. En el encabezado, «Agregar lugar» se cambia por **«Cobertura»** (secundario) y **«Planear entrega»** (primario). |
| D-02 | En la tarjeta del mapa, «Agregar lugar» y «Agregar trayecto» se cambian por un solo botón secundario **«Gestionar red»**. El estado vacío del mapa conserva «Agregar lugar» y «Cargar datos de ejemplo». |
| D-03 | **Un solo `<dialog>` con pila de vistas.** «Volver» regresa a la vista anterior. Al guardar con éxito se muestra un toast y se vuelve a la pestaña correspondiente con la lista actualizada. «Cancelar» hace lo mismo que «Volver». |
| D-04 | Agregar trayecto: campo «Tiempo estimado (minutos)» con ejemplo «Ej. 12». Desplegables con el nombre amigable (el id sigue siendo el `value`). El recuadro «El regreso no se agrega automáticamente…» reemplaza la nota lateral. |
| D-05 | Las flechas «›» de Tus lugares y de la lista de Cobertura abren el **detalle del lugar** como otra vista de la pila, con «Volver». |
| D-06 | Las trazas `DijkstraTrace` y `BfsTrace` se conservan en un plegable `<details>` **«Cómo se calculó»**, cerrado por defecto, al final de Planear entrega y de Cobertura. Se **elimina** la consulta de alcance a un destino (`checkReachability`) del panel. |
| D-07 | «Ver ruta en la red» y «Ver cobertura en la red» cierran el modal, ponen el mapa en modo «Mejor ruta» o «Cobertura» y desplazan la página hasta el mapa con suavidad. |
| D-08 | Origen, destino y último resultado se conservan al cerrar y volver a abrir. Cobertura y Planear entrega comparten el mismo origen (`useDeliverySelection` en `NetworkPage`). |
| D-09 | `Modal.tsx` se rediseña una sola vez con la cabecera de los bocetos: cuadro con icono, título grande que termina en punto, subtítulo, X arriba a la derecha y «Volver» opcional. **Todos** los diálogos lo heredan (Ayuda, Confirmar, Cargar ejemplo, Vaciar red). |
| D-10 | La columna «Estado» de Tus lugares se calcula respecto al origen seleccionado. Si no hay origen, muestra «—». El buscador filtra solo la pestaña activa, sin distinguir mayúsculas ni tildes. Los contadores de las pestañas muestran el total. |
| D-11 | Por debajo de 640 px el modal ocupa toda la pantalla con desplazamiento interno y los botones del pie se apilan. Las dos tarjetas de resultado siguen en dos columnas hasta 380 px. |
| D-12 | Documentos en `docs/feature-4/`, bitácora en `docs/ia/bitacora-feature-4.md`, trabajo en `feature/4-frontend` con una rama y un PR por tarea. |
| D-13 | Sin conexión: «Cobertura» y «Planear entrega» quedan desactivados con el tooltip «Sin conexión con el servidor.». «Gestionar red» abre en solo lectura (sin botones de agregar). |
| D-14 | Con 0 lugares se desactivan Planear entrega y Cobertura. Con 1 lugar solo se habilita Cobertura. Planear entrega y Agregar trayecto necesitan 2 o más. Cada pestaña vacía tiene su estado vacío con botón. |
| D-15 | «Agregar lugar» desde el mapa vacío abre el formulario como vista raíz: sin «Volver»; al guardar se cierra el diálogo. |
| D-16 | Se reutilizan los componentes: `DeliveryPlannerCard` → cuerpo de Planear entrega, `CoverageCard` → cuerpo de Cobertura, `NetworkTables` → cuerpo de Gestionar red. Los formularios se extraen como `PointForm` y `ConnectionForm`. Solo se borran los contenedores que queden sin uso. |
| D-17 | Cobertura se recalcula sola al cambiar el origen (sin botón). Planear entrega solo calcula con «Encontrar la mejor ruta». Al cambiar el origen o el destino, el resultado anterior se oculta. |
| D-18 | Aviso de cobertura: nombra los lugares fuera de cobertura unidos con «y» (con más de 3: «A, B y N lugares más…»). Si no hay ninguno, recuadro verde «Llegas a todos tus lugares.». |
| D-19 | Tamaños: `sm` ≈ 560 px (formularios, detalle), `md` ≈ 700 px (Planear entrega, Cobertura), `lg` ≈ 960 px (Gestionar red). Altura máxima 90vh con desplazamiento interno. |
| D-20 | Abrir un modal no cambia la URL. |
| D-21 | Cinco tareas en el orden del [`plan.md`](plan.md) §3. La recomposición de la página va al final. |
| D-22 | Validación: `npm run build`, `npm run lint`, escenarios PASÓ/FALLÓ en el navegador (§8), capturas en `docs/feature-4/capturas/` comparadas con los bocetos, y la aceptación de la API sin cambios. |
| D-23 | Al cambiar de vista, el foco va al título. «Volver» devuelve el foco al botón que abrió la vista. Las pestañas usan el patrón ARIA `tablist` con flechas. Esc cierra todo el diálogo. |
| D-24 | Los contadores (StatCards) no cambian. |
| D-25 | Los textos que faltan en los bocetos son los de §7. Los errores de la API se muestran tal como llegan (`InlineError`). |
| D-26 | Iconos de `icons.tsx`: Gestionar red `NetworkIcon`, Agregar lugar `PinIcon`, Agregar trayecto y Planear entrega `RouteIcon`, Cobertura `TargetIcon`, Detalle el icono del tipo. Un icono que falte se crea como SVG propio. |
| D-27 | Se actualizan los textos que hablan del diseño anterior (pista del mapa, Ayuda). |
| D-28 | `docs/frontend/especificacion-mi-red.md` y `plan-mi-red.md` no se borran: se les agrega una nota de reemplazo. |
| D-29 | El detalle del lugar conserva lo que muestra hoy (tipo, identificador y trayectos de salida). Solo cambia la cabecera y entra en la pila. |

> **Tarifa.** El boceto dice «Tarifa de ejemplo: $500 por minuto». El panel muestra la tarifa que
> devuelve la API (`costo_monetario.tarifa_por_minuto`), sin fijar 500 en el código.

## 5. Historias de usuario

| ID | Como... | Quiero... | Para... |
|----|---------|-----------|---------|
| HU-F4-01 | despachador | ver el mapa de mi red a todo el ancho | leer las conexiones sin columnas que lo aprieten |
| HU-F4-02 | despachador | abrir «Gestionar red» y consultar mis lugares y trayectos en pestañas | revisar mi red sin salir del mapa |
| HU-F4-03 | despachador | agregar un lugar o un trayecto desde Gestionar red y volver a la lista | ampliar mi red en un solo flujo |
| HU-F4-04 | despachador | planear una entrega en un modal y ver tiempo, costo y camino | decidir rápido cómo despachar |
| HU-F4-05 | despachador | ver en un modal hasta dónde llego desde un origen | saber qué lugares puedo atender |
| HU-F4-06 | despachador | llevar la ruta o la cobertura del modal al mapa | verla en el contexto de la red |
| HU-F4-07 | evaluador | abrir «Cómo se calculó» | comprobar que Dijkstra y BFS son propios |

## 6. Composición

### 6.1 Página `/app`

```
Header (sin cambios)
┌ Conecta. Planea. Entrega.                                   [◎ Cobertura] [⇄ Planear entrega] ┐
│ Tu operación, conectada.                                                                       │
│ Gestiona tu red, revisa la cobertura y encuentra la mejor ruta en un solo lugar.               │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
[01 Lugares en tu red] [02 Trayectos disponibles] [03 Cobertura desde …]     ← sin cambios
┌ El mapa de tu operación ●                                                   [⊞ Gestionar red] ┐
│ Ver en la red  [Red completa] [Cobertura] [Mejor ruta]                                         │
│ (lienzo SVG a todo el ancho, leyenda, «Ver imagen generada»)                                   │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
Footer (sin cambios)
```

### 6.2 Cabecera común de los modales (todos)

De arriba abajo: «‹ Volver» (solo si hay una vista debajo en la pila) · cuadro redondeado azul claro con
el icono · título (Inter Tight, grande, termina en punto) · subtítulo · X arriba a la derecha.

### 6.3 Gestionar red — `lg` (bocetos `gestionar_red_1/2`)

- Icono `NetworkIcon`. Título «Los detalles de tu red.». Subtítulo «Consulta tus lugares y trayectos. Todo conectado, en un solo espacio.».
- Tarjeta con pestañas «Tus lugares (n)» y «Trayectos (n)», buscador «Buscar en tu red…» y botón azul «+ Agregar lugar» o «+ Agregar trayecto» según la pestaña.
- **Tus lugares:** columnas LUGAR (icono del tipo + nombre), TIPO (insignia de color), SALIDAS («n trayectos»), ESTADO (insignia «Alcanzable», «Sin conexión», «Origen» o «—»), y una flecha «›» que abre el detalle.
- **Trayectos:** columnas ORIGEN, DESTINO, TIEMPO (`n min`, monoespaciada) y COSTO (`$n.nnn`, monoespaciada).

### 6.4 Agregar lugar — `sm` (boceto `agregar_lugar`)

«‹ Volver» · `PinIcon` · «Un nuevo lugar en tu red.» · «Cada destino empieza con un nombre único.» ·
campo «Nombre del lugar» (ejemplo «Ej. Barrio Occidente», con foco) · desplegable «Tipo de lugar» ·
pie con [Cancelar] [+ Agregar lugar].

### 6.5 Agregar trayecto — `sm` (boceto `agregar_trayecto`)

«‹ Volver» · `RouteIcon` · «Conecta dos lugares.» · «Registra un trayecto en un solo sentido.» ·
Origen · Destino · «Tiempo estimado (minutos)» (ejemplo «Ej. 12») · recuadro azul con `InfoIcon`:
«El regreso no se agrega automáticamente. Regístralo como un nuevo trayecto si está disponible.» ·
pie con [Cancelar] [+ Agregar trayecto].

### 6.6 Detalle de lugar — `sm`

«‹ Volver» (si viene de una lista) · icono del tipo · título «<Nombre>.» · subtítulo «Detalle del lugar en tu red.» · contenido actual.

### 6.7 Planear entrega — `md` (bocetos `planear_entrega_1/2`)

- `RouteIcon` · «Planea tu próxima entrega.» · «Elige un origen y un destino para comparar tiempo y costo.».
- «○ Punto de origen» (desplegable), botón ⇅ para intercambiar alineado a la derecha entre los dos campos, «⌖ Destino» (desplegable).
- Botón primario a todo el ancho: «⇄ Encontrar la mejor ruta →».
- Separador punteado. Resultado:
  - «✓ Sí, puedes llegar» (verde) + etiqueta «RUTA ÓPTIMA».
  - Dos tarjetas azul claro: «**8** min · Tiempo total» y «**$4.000** · Costo estimado».
  - Camino tramo a tramo: lugar · «Inicio», tramo `8 min` · `$4.000 · acum. $4.000`, lugar · minutos acumulados.
  - «✓ La ruta de menos tramos también toma 8 min.» (o la diferencia) + tarjeta «MENOS TRAMOS · n» con el camino.
  - «Tarifa de ejemplo: $<tarifa> por minuto.» centrado.
  - Plegable «Cómo se calculó» (traza de Dijkstra), cerrado.
  - Botón secundario a todo el ancho: «⊞ Ver ruta en la red →».

### 6.8 Cobertura — `md` (bocetos `cobertura_1/2`)

- `TargetIcon` · «¿Hasta dónde puedes llegar?» · «Elige un origen y revisa qué lugares puedes atender.».
- «Punto de origen» (desplegable).
- «Desde **<origen>** puedes llegar a **n de m lugares**.» + barra verde y leyenda «● n alcanzables · k sin conexión».
- Aviso naranja (D-18) o verde.
- Lista con borde: icono del tipo · nombre · insignia «Alcanzable» (verde) o «Sin conexión» (rojo) · «›».
- Plegable «Cómo se calculó» (traza de BFS), cerrado.
- Enlace «Ver cobertura en la red →» bajo una línea divisoria.

## 7. Textos sin boceto

| Situación | Texto |
|-----------|-------|
| Botón desactivado sin conexión (tooltip) | «Sin conexión con el servidor.» |
| Planear entrega con menos de 2 lugares (tooltip) | «Necesitas al menos dos lugares.» |
| Tus lugares vacía | «Aún no tienes lugares. Agrega el primero para empezar tu red.» |
| Trayectos vacía | «Aún no hay trayectos. Conecta dos lugares para empezar a entregar.» |
| Búsqueda sin resultados | «No encontramos nada para «texto».» |
| Sin ruta posible | «✕ No hay forma de llegar» + «No existe un trayecto de <origen> a <destino>. Revisa tus trayectos en Gestionar red.» |
| Cobertura completa | «Llegas a todos tus lugares.» |
| Pista del mapa en «Mejor ruta» sin resultado | «Abre «Planear entrega» para ver aquí la mejor ruta.» (enlace que abre el modal) |
| Pista del mapa en «Cobertura» sin origen | «Abre «Cobertura» para elegir un origen.» (enlace que abre el modal) |
| Origen igual al destino, campos vacíos, nombre repetido | Mensaje de la API, sin cambios |

## 8. Criterios de aceptación (verificación manual en el navegador)

Se prueban con `python main.py --ejemplo` y `npm run dev` en `http://localhost:5173/app`. Cada escenario
se registra como **escenario / esperado / obtenido / PASÓ-FALLÓ** en el PR de la tarea.

| ID | Escenario | Esperado |
|----|-----------|----------|
| CA-F4-01 | Abrir `/app` en 1440 px | Encabezado con «Cobertura» y «Planear entrega»; contadores; mapa a todo el ancho con «Gestionar red»; sin columna lateral ni tablas |
| CA-F4-02 | Pulsar «Gestionar red» | Modal «Los detalles de tu red.» en la pestaña Tus lugares con 7 lugares y sus columnas |
| CA-F4-03 | Cambiar a Trayectos con el teclado (flechas) | Pestaña Trayectos activa; columnas Origen, Destino, Tiempo y Costo |
| CA-F4-04 | Escribir «estacion» en el buscador | Solo filas que contienen «Estación»; los contadores de las pestañas no cambian |
| CA-F4-05 | Buscar «zzz» | «No encontramos nada para «zzz».» |
| CA-F4-06 | Tus lugares → «+ Agregar lugar» | Vista «Un nuevo lugar en tu red.» con «Volver» y el foco en Nombre |
| CA-F4-07 | «Volver» desde Agregar lugar | Regresa a Tus lugares, con el foco en «+ Agregar lugar» |
| CA-F4-08 | Guardar un lugar válido | Toast de éxito, regreso a Tus lugares con el lugar nuevo, contador actualizado y lugar visible en el mapa |
| CA-F4-09 | Guardar un nombre repetido | Mensaje de la API debajo del campo; no cambia de vista |
| CA-F4-10 | Trayectos → «+ Agregar trayecto» y guardar uno válido | Toast, regreso a Trayectos con la fila nueva; el mapa dibuja la flecha |
| CA-F4-11 | «›» en un lugar | Detalle del lugar con «Volver»; «Volver» regresa a la lista |
| CA-F4-12 | Esc en cualquier vista de la pila | Se cierra todo el diálogo |
| CA-F4-13 | Planear entrega: Bodega Central → Barrio Sur, «Encontrar la mejor ruta» | «Sí, puedes llegar», tiempo, costo, camino, menos tramos y tarifa de la API |
| CA-F4-14 | Cambiar el destino después del resultado | El resultado se oculta hasta volver a pulsar el botón |
| CA-F4-15 | Botón ⇅ | Intercambia origen y destino |
| CA-F4-16 | Destino sin ruta (La Laguna) | «No hay forma de llegar» con el texto de §7 |
| CA-F4-17 | «Ver ruta en la red» | Se cierra el modal, el mapa queda en «Mejor ruta» con el camino resaltado y la página se desplaza hasta él |
| CA-F4-18 | Cerrar y reabrir Planear entrega | Mantiene origen, destino y resultado |
| CA-F4-19 | Abrir «Cómo se calculó» en Planear entrega y Cobertura | Muestra las trazas de Dijkstra y BFS |
| CA-F4-20 | Cobertura desde Bodega Central | «puedes llegar a n de m lugares», barra, aviso «La Laguna está fuera…», lista con insignias |
| CA-F4-21 | Cambiar el origen en Cobertura | Se recalcula sin botón; el contador 03 de la página también cambia |
| CA-F4-22 | Origen que llega a todos | Recuadro verde «Llegas a todos tus lugares.» |
| CA-F4-23 | «Ver cobertura en la red» | Se cierra el modal y el mapa queda en modo Cobertura con ese origen |
| CA-F4-24 | API detenida | «Cobertura» y «Planear entrega» desactivados con tooltip; «Gestionar red» abre en solo lectura sin botones de agregar |
| CA-F4-25 | Red vacía (Vaciar red) | Planear entrega y Cobertura desactivados; «Agregar lugar» del mapa vacío abre el formulario sin «Volver» y al guardar se cierra |
| CA-F4-26 | Red con 1 lugar | Cobertura habilitada; Planear entrega y «+ Agregar trayecto» desactivados con su tooltip |
| CA-F4-27 | 390 px | Modales a pantalla completa con desplazamiento interno; botones del pie apilados; sin desplazamiento horizontal |
| CA-F4-28 | Ayuda, Confirmar, Cargar ejemplo, Vaciar red | Usan la nueva cabecera |
| CA-F4-29 | `npm run build` y `npm run lint` | Sin errores |
| CA-F4-30 | `pruebas/aceptacion_feature1.py`, `_feature2.py` y `_feature3.py` | Pasan igual que antes (el backend no cambia) |

## 9. Fuera de alcance

Cambios en la API o en la tarifa, nuevas funciones (editar o borrar lugares y trayectos desde el
detalle), estado en la URL, pruebas automáticas del frontend, cambios en la landing o en `frontend/legacy`.
