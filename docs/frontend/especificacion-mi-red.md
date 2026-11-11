# Panel «Mi red de entregas» · Especificación

> Documento de entrada del desarrollo orientado a especificaciones (SDD) para el rediseño del panel
> React (`/app`). Primero se acuerda **qué** debe hacer y **cómo se ve**; después se escribe el código.
> Estado: **aprobada**. Rama: `feature/3-panel-mi-red` (sale de `feature/3-adicion-costo`).
> Plan técnico: [`plan-mi-red.md`](plan-mi-red.md). Decisiones de IA:
> [`docs/ia/bitacora-frontend.md`](../ia/bitacora-frontend.md) (sección del 2026-11-11).

## 1. Valor

Hoy el panel reparte las funciones en tres pestañas (Resumen, Puntos y conexiones, Cobertura), muestra
la red como un PNG y **no ofrece la ruta de menor costo** (Feature 3), que solo existe en
`frontend/legacy`. El despachador necesita ver su red, su cobertura y la ruta más rápida con su costo
en pesos **en una sola página**: «Mi red de entregas».

## 2. Alcance

**Incluye:** la página única `/app`, su header, el mapa SVG interactivo, el planificador de entregas
(ruta más rápida, costo en COP, comparación con la ruta de menos tramos y explicación de destinos
inalcanzables), la cobertura, las tablas de lugares y trayectos, los diálogos y los estados de carga,
vacío y error, en escritorio y móvil.

**No incluye:** cambios en el backend (`backend/`, `main.py`, `datos/`), en la landing (`/`) ni en
`frontend/legacy`. Ninguna dependencia nueva (ni Tailwind ni librerías de iconos o de pruebas).
Ninguna función que la API no ofrezca.

## 3. Referencias

| Fuente | Qué aporta |
|--------|-----------|
| Capturas del diseño actual (3, escritorio) | Composición, textos e iconos que se conservan |
| `Guias.md` | Página única, header sin menú lateral, tipografías, `#0146C1`, validación |
| `brief-identidad-visual-rutapyme.md` | Paleta, tipos de lugar, estados, jerarquía tipográfica, formas y espaciado |
| `backend/api.py`, `backend/network.py` | Contrato real: endpoints, campos y códigos de error |

## 4. Decisiones cerradas (sesión de preguntas)

| # | Decisión |
|---|----------|
| D-01 | La **tarifa** se muestra tal como la devuelve la API (`costo_monetario.tarifa_por_minuto`, hoy 200 COP/min). `Guias.md` pide 500: cambiarla es una tarea aparte del backend. |
| D-02 | Se mantiene el **CSS propio** (tokens + CSS Modules). No se instala Tailwind. |
| D-03 | La landing (`/`) no cambia. `/app` es una sola página; `/app/points`, `/app/coverage` y cualquier `/app/*` redirigen a `/app`. |
| D-04 | El **mapa** es SVG dibujado en el navegador con los datos de `/api/red`. Las columnas salen de las `capas` que devuelve `/api/cobertura/{origen}`. El frontend no ejecuta algoritmos de grafos. Los PNG de la API quedan como enlace «Ver imagen generada». |
| D-05 | **Nombres amigables** con un diccionario solo para los 7 IDs de la red de ejemplo (§6). Otro ID se muestra tal cual. Los textos de la API no se reescriben. |
| D-06 | Las funciones sin captura se ubican según §8. |
| D-07 | Los estados sin captura (resultado, cobertura, diálogos, errores, móvil) se diseñan con el brief y se aprueban con capturas. |
| D-08 | Línea **discontinua** = ruta de menos tramos, solo en el modo «Mejor ruta». En «Red completa» todo es sólido. |
| D-09 | Leyenda con tres tipos separados (colores del brief), «Sin conexión» y «Trayecto de un sentido». |
| D-10 | Columna «Estado»: «Origen» para el origen elegido, «✓ Alcanzable» o «✕ Sin conexión» para el resto. |
| D-11 | No se carga la red de ejemplo automáticamente. Valores por defecto: primera bodega registrada como origen; como destino, el primer punto de recogida con **trayecto directo** desde ese origen y, si no hay, el primer punto de recogida alcanzable (orden de registro). Con la red de ejemplo da Bodega Central → La Estación, como en la captura. *(Ajuste aprobado: la regla «primer punto de recogida alcanzable» daba El Parque.)* |
| D-12 | El buscador filtra en el navegador. La pestaña «Trayectos» muestra solo minutos (sin pesos por trayecto). |
| D-13 | Se reutilizan servicios, hooks, contextos y componentes de soporte. Las vistas sin uso se borran. |
| D-14 | Se agrega Manrope 800. Los IDs usan la monoespaciada de los tokens. |
| D-15 | Validación: build, lint, aceptación Python, capturas de 1440 y 390 px, y prueba manual de los estados (§11). No se agregan pruebas automáticas del frontend. |

## 5. Historias de usuario

| ID | Como... | Quiero... | Para... |
|----|---------|-----------|---------|
| HU-P01 | despachador | ver mi red en un mapa con tiempos y sentidos | entender de un vistazo cómo se conectan mis lugares |
| HU-P02 | despachador | registrar lugares y trayectos desde la misma página | mantener la red al día sin cambiar de vista |
| HU-P03 | despachador | saber hasta dónde llego desde un origen | no prometer entregas imposibles |
| HU-P04 | despachador | obtener la ruta más rápida y su costo en pesos | despachar y cotizar con datos |
| HU-P05 | despachador | compararla con la ruta de menos tramos | entender por qué menos saltos no es menos tiempo |
| HU-P06 | despachador | recibir una explicación cuando no puedo llegar | saber qué trayecto falta registrar |
| HU-P07 | equipo | ver cómo se calculó (BFS y Dijkstra) | explicar los algoritmos en el pitch |
| HU-P08 | equipo | cargar la red de ejemplo o vaciar la red | preparar la demostración |

## 6. Glosario y nombres

Términos de la interfaz: **lugar** (punto), **trayecto** (conexión dirigida), **tramo** (trayecto
dentro de una ruta), **cobertura**, **ruta más rápida**, **ruta de menos tramos**.

| ID | Nombre amigable | Tipo |
|----|-----------------|------|
| `BOD-CENTRO` | Bodega Central | Bodega |
| `BAR-NORTE` | Barrio Norte | Barrio |
| `BAR-SUR` | Barrio Sur | Barrio |
| `BAR-ORIENTE` | Barrio Oriente | Barrio |
| `PR-ESTACION` | La Estación | Punto de recogida |
| `PR-LAGUNA` | La Laguna | Punto de recogida |
| `PR-PARQUE` | El Parque | Punto de recogida |

Reglas: el nombre amigable va en **Manrope 800**. El ID va en monoespaciada 600 en formularios,
selectores (como texto secundario), detalle del lugar y mensajes de la API. Un ID fuera del
diccionario se muestra igual en los dos lugares.

## 7. Composición de la página

Ancho máximo 1200 px centrado; escala de espacio 4 · 8 · 12 · 16 · 24 · 40 px; tarjetas blancas de
radio 14 px con borde `#E2E5F0` y sombra azulada mínima; fondo `#F6F7FE`.

### 7.1 Header (sticky, sin menú lateral)

- Izquierda: logo azul (`logo_blue.png`) y la pastilla activa **«Mi red de entregas»** (icono de red,
  fondo `#E3E5FC`, punto azul).
- Derecha: **«Ayuda y cómo funciona»** (icono ?) y el bloque **«Modo de demostración»**: avatar «RP»,
  título y subtítulo «• Datos de ejemplo». Abre el menú de demostración (§8).
- Móvil: logo + pastilla compacta (solo icono) + botón de ayuda (solo icono) + avatar.

### 7.2 Encabezado de la página

Antetítulo **«CONECTA. PLANEA. ENTREGA.»** (Inter Tight 700, mayúsculas espaciadas, azul); título
**«Tu operación, conectada.»** (Inter Tight 700, −2 %, tamaño adaptable); frase «Gestiona tu red,
revisa la cobertura y encuentra la mejor ruta en un solo lugar.»; botón primario **«+ Agregar lugar»**.

### 7.3 Contadores (3 tarjetas, numeradas 01 · 02 · 03)

| Tarjeta | Cifra | Texto |
|---------|-------|-------|
| 01 Lugares en tu red | `resumen.puntos` | puntos conectados |
| 02 Trayectos disponibles | `resumen.conexiones` | en un solo sentido |
| 03 Cobertura desde **{origen}** | `total_alcanzables` de la API (no cuenta al origen) | de {total} lugares alcanzables (`total_alcanzables` + `total_no_alcanzables`) |

Cifras en Inter Tight 700 con números tabulares. En móvil se apilan.

### 7.4 Columna principal: «El mapa de tu operación»

- Título con punto verde, frase «Cada conexión es una posibilidad de entrega.», botón secundario
  **«+ Agregar trayecto»**.
- Selector «Ver en la red»: **Red completa · Cobertura · Mejor ruta** (pestaña activa en `#E3E5FC`).
- Lienzo con fondo de puntos, insignia «● Red de entregas | En vivo» (refleja `/api/salud`), controles
  **+ / − / recentrar**, nota «Un esquema de tu red, no un mapa real.» y enlace «Ver imagen generada».
- Nodos: círculo con icono (caja para bodega, pin para barrio y recogida), aro del color del tipo;
  el origen va relleno en naranja con halo. Debajo, nombre (Manrope 800) y rol («Punto de origen» o
  el tipo). Sin conexión: aro discontinuo y «Sin conexión».
- Aristas: flecha de un sentido con la etiqueta «N min» (monoespaciada). Dos sentidos entre el mismo
  par se dibujan como dos líneas paralelas separadas.
- Leyenda (D-09) debajo del lienzo.

**Modos del mapa**

| Modo | Qué resalta | Datos |
|------|-------------|-------|
| Red completa | Todos los lugares y trayectos, en sólido | `/api/red` |
| Cobertura | Alcanzables en color, no alcanzables atenuados con «✕», número de capa en cada nodo; si hay destino, su veredicto | `/api/cobertura/{o}` y `/api/cobertura/{o}/{d}` |
| Mejor ruta | Ruta más rápida en azul `#0146C1` y gruesa; ruta de menos tramos discontinua si es distinta; el resto atenuado | `/api/ruta/{o}/{d}` |

### 7.5 Columna lateral

1. **«Tu próxima entrega»** — «Una buena decisión empieza aquí.» Selectores **Punto de origen** y
   **Destino** (cada opción muestra «nombre · ID»; el destino no ofrece el origen), botón ⇅ para intercambiar y botón primario **«Encontrar la
   mejor ruta →»**. Sin consulta: ilustración «De la duda a la ruta.» con «✓ Menos tiempo ✓ Costo claro».
   Con resultado: ver §9.
2. **«¿Hasta dónde puedes llegar?»** (fondo `#EAF0FD`) — «Desde **{origen}** puedes llegar a **N de M
   lugares**.», barra de progreso verde, «● N alcanzables · K sin conexión», un aviso de advertencia
   por cada lugar fuera de cobertura («{lugar} está fuera de tu cobertura actual.») y el enlace
   **«Ver cobertura en la red →»** que cambia el mapa al modo Cobertura.
3. Nota informativa: «**Ir no siempre significa poder volver.** Los trayectos tienen un solo sentido.
   Cada dirección se registra por separado.»

### 7.6 Tablas

Pestañas **«Tus lugares N»** y **«Trayectos N»**, buscador «Buscar en tu red…».

- Lugares: Lugar (icono + nombre) · Tipo (chip de color) · Salidas («N trayectos», singular si es 1) ·
  Estado (D-10) · «›» que abre el detalle. Pie: «Tu red se actualiza con cada nuevo trayecto.» y
  **«+ Agregar lugar»**.
- Trayectos: Origen → Destino · Tiempo («N min»).

### 7.7 Pie de página

«• Hecho para los negocios que mueven su barrio.» · «Datos ficticios · Sin mapas ni GPS» · «RutaPyme v1.0».

### 7.8 Móvil (< 768 px)

Una columna en este orden: header, encabezado, contadores, «Tu próxima entrega», mapa, cobertura,
nota, tablas, pie. Controles de 40 px de alto. El mapa conserva zoom y arrastre; las tablas pasan a
filas apiladas (sin scroll horizontal de la página).

## 8. Cobertura de la API (todas las funciones del backend)

| Endpoint | Dónde se usa |
|----------|--------------|
| `GET /api/salud` | Insignia «En vivo» y aviso de API caída (`OfflineNotice`) |
| `GET /api/tipos` | Selector de tipo en «Agregar lugar» |
| `GET /api/puntos` | Tabla «Tus lugares», selectores |
| `POST /api/puntos` | Diálogo «Agregar lugar» |
| `GET /api/puntos/{id}` | Detalle del lugar (botón «›»): tipo, ID y salidas |
| `GET /api/conexiones` | Tabla «Trayectos» |
| `POST /api/conexiones` | Diálogo «Agregar trayecto» |
| `GET /api/red` | Mapa, contadores y salidas por lugar |
| `DELETE /api/red` | Menú de demostración → «Vaciar red» (con confirmación) |
| `POST /api/red/ejemplo` | Menú de demostración y estado vacío → «Cargar datos de ejemplo» |
| `GET /api/red/imagen` | «Ver imagen generada» en Red completa |
| `GET /api/red/imagen/cobertura/{o}` | «Ver imagen generada» en Cobertura |
| `GET /api/red/imagen/ruta/{o}/{d}` | «Ver imagen generada» en Mejor ruta |
| `GET /api/cobertura/{o}` | Tarjeta de cobertura, contador 03, columna Estado, capas del mapa, traza BFS |
| `GET /api/cobertura/{o}/{d}` | Modo Cobertura con destino: veredicto, camino de menos tramos y traza |
| `GET /api/ruta/{o}/{d}` | «Encontrar la mejor ruta» |
| `GET /api/cobertura`, `/api/ruta`, `/api/ruta/{o}` | Solo responden errores de URL incompleta; el formulario siempre envía origen y destino, así que no se llaman |

«Ayuda y cómo funciona» abre un diálogo con textos fijos: qué es un lugar y un trayecto, que los
trayectos tienen un sentido, cómo se calculan la cobertura (BFS) y la ruta (Dijkstra) y que la tarifa
la fija el backend.

## 9. Resultado de la ruta («Tu próxima entrega»)

**Con ruta (`existe_ruta: true`)**

- Veredicto de éxito «✓ Sí se puede llegar» y el `mensaje` de la API.
- Cifras: **{costo_total} min**, **{costo_monetario.total} COP** (formato `$ 3.600`), **{saltos}
  tramos**, y «Tarifa: $ {tarifa_por_minuto} por minuto».
- Recorrido: chips con el camino y la lista de `tramos` (origen → destino, minutos, COP, acumulado).
- Comparación «Ruta de menos tramos»: su camino, minutos, COP y diferencia, con el `mensaje` de
  `comparacion_menos_saltos`. Si es la misma ruta, una nota de información.
- Desplegable «Ver cómo se calculó»: `traza` de Dijkstra (paso, definitivo, mejora, descarta,
  decisión) y `orden_definitivos`.

**Sin ruta (`existe_ruta: false`)** — veredicto de error «✕ No se puede llegar», `mensaje` y
`explicacion` de la API, y el mismo desplegable con la traza.

**Errores** (`400`, `404`, `red_vacia`, API caída): error en línea bajo el formulario con el
`mensaje` de la API; el resultado anterior se descarta.

Cambiar el origen o el destino invalida el resultado anterior. El mapa pasa a «Mejor ruta» al
obtener un resultado.

## 10. Reglas de la interfaz

| Regla | Descripción |
|-------|-------------|
| RI-01 | Todo dato sale de la API real (por el proxy `/api` de Vite). No se usan datos simulados. |
| RI-02 | Los datos solo viven en memoria mientras la página está abierta. No se usa `localStorage`, `sessionStorage` ni IndexedDB. |
| RI-03 | El color nunca va solo: cada estado lleva símbolo (✓ / ✕ / !) o texto. |
| RI-04 | Colores de tipo iguales en chips, contadores, mapa y leyenda: bodega `#E4572E`, barrio `#2E86AB`, recogida `#3BB273`. |
| RI-05 | `#0146C1` es el único color de acción. |
| RI-06 | Tras crear un lugar o trayecto, cargar el ejemplo o vaciar la red, se recargan red, cobertura y tablas, y se descarta la ruta calculada. |
| RI-07 | Los mensajes de la API se muestran sin modificar. |
| RI-08 | Accesible: foco visible, diálogos con foco atrapado y `Esc`, `aria-live` en resultados, contraste AA, `prefers-reduced-motion`. |

## 11. Criterios de aceptación

| ID | Criterio |
|----|----------|
| CA-M01 | `/app` muestra header, encabezado, contadores, mapa, planificador, cobertura, tablas y pie con la composición de §7; `/app/points` redirige a `/app`. |
| CA-M02 | Con la red de ejemplo, los contadores muestran 7 lugares, 10 trayectos y «5 de 6 lugares alcanzables» desde Bodega Central (cifras de la API, que no cuenta al origen). |
| CA-M03 | El origen por defecto es Bodega Central y el destino La Estación. |
| CA-M04 | El mapa dibuja los 7 lugares y los 10 trayectos con su tiempo; BOD-CENTRO ↔ BAR-NORTE aparece como dos flechas separadas (12 y 15 min). |
| CA-M05 | + / − cambian el zoom, el arrastre mueve el lienzo y recentrar restablece la vista. |
| CA-M06 | Bodega Central → La Estación: 18 min, costo en COP según la tarifa de la API, 2 tramos por Barrio Sur, y comparación con el directo de 30 min (discontinuo en el mapa). |
| CA-M07 | Bodega Central → La Laguna: «✕ No se puede llegar» con la `explicacion` de la API. |
| CA-M08 | El modo Cobertura atenúa La Laguna con una «✕» y numera cada lugar con sus trayectos desde el origen; la tabla marca «✕ Sin conexión» y el origen aparece como «Origen». |
| CA-M09 | «Agregar lugar» registra un lugar nuevo; aparece en mapa, tabla, selectores y contadores sin recargar la página. |
| CA-M10 | «Agregar trayecto» con costo `0` o texto muestra el error 400 de la API en el formulario; con datos válidos aparece en el mapa y en «Trayectos». |
| CA-M11 | Un lugar o trayecto duplicado muestra el error 409 de la API. |
| CA-M12 | «Vaciar red» pide confirmación, deja la red vacía y muestra el estado vacío con «Cargar datos de ejemplo». |
| CA-M13 | El «›» de una fila abre el detalle con las salidas de `/api/puntos/{id}`. |
| CA-M14 | «Ver imagen generada» abre el PNG de la API del modo activo. |
| CA-M15 | «Ver cómo se calculó» muestra la traza de Dijkstra (ruta) y la del BFS (cobertura). |
| CA-M16 | Con la API apagada aparece el aviso de API caída con «Reintentar» y la insignia deja de decir «En vivo». |
| CA-M17 | A 390 px no hay scroll horizontal de página, el orden es el de §7.8 y los controles miden 40 px. |
| CA-M18 | El buscador filtra las filas de la pestaña activa por nombre, ID o tipo. |
| CA-M19 | Al recargar la página no se recupera nada desde el navegador (solo lo que tenga la API en memoria). |
| CA-M20 | `npm run build` y `npm run lint` terminan sin errores, y las tres pruebas de aceptación de Python siguen pasando. |
