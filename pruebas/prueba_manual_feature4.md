# Prueba manual de la Feature 4 (panel con ventanas modales)

Checklist de aceptación de `docs/feature-4/especificacion.md` §8 (CA-F4-01 a CA-F4-30).
Preparación: `python main.py --ejemplo` y `cd frontend && npm run dev`; abrir `http://localhost:5173/app`.
Ejecutada el 2026-11-16 en el navegador integrado de Claude Code (anchos emulados de 1440, 1024, 768 y 390 px)
contra la API real con la red de ejemplo. Tarifa que devuelve la API: 200 COP por minuto (el boceto dice 500, el
panel muestra la de la API, ver D-tarifa). Capturas en [`docs/feature-4/capturas/`](../docs/feature-4/capturas/).

| ID | Escenario | Esperado | Obtenido | PASÓ / FALLÓ |
|----|-----------|----------|----------|--------------|
| CA-F4-01 | Abrir `/app` en 1440 px | Encabezado con «Cobertura» y «Planear entrega»; contadores; mapa a todo el ancho con «Gestionar red»; sin columna lateral ni tablas | Botones «Cobertura» y «Planear entrega» arriba a la derecha; 3 contadores; el mapa mide 1200 px, igual que la página; sin `<table>` ni «Tu próxima entrega»; botón «Gestionar red» en la tarjeta del mapa (`1440-pagina.jpg`) | PASÓ |
| CA-F4-02 | Pulsar «Gestionar red» | Modal «Los detalles de tu red.» en Tus lugares con 7 lugares y sus columnas | Título correcto; pestañas «Tus lugares 7» y «Trayectos 10»; 7 filas (Bodega Central · Bodega · 3 trayectos · Origen …); columnas Lugar, Tipo, Salidas, Estado (`1440-gestionar-red-lugares.jpg`) | PASÓ |
| CA-F4-03 | Cambiar a Trayectos con flechas | Pestaña Trayectos activa; columnas Origen, Destino, Tiempo, Costo | Con `→` queda activa Trayectos y el foco pasa a la pestaña; `←` regresa a Tus lugares; filas como «Bodega Central · Barrio Norte · 12 min · $2.400» (`1440-gestionar-red-trayectos.jpg`) | PASÓ |
| CA-F4-04 | Buscar «estacion» | Solo filas con «Estación»; contadores sin cambio | 1 fila: «La Estación · Punto de recogida · 0 trayectos · Alcanzable»; pestañas siguen en 7 y 10 | PASÓ |
| CA-F4-05 | Buscar «zzz» | «No encontramos nada para «zzz».» | Texto exacto | PASÓ |
| CA-F4-06 | Tus lugares → «+ Agregar lugar» | «Un nuevo lugar en tu red.» con «Volver» y foco en Nombre | Título, botón «‹ Volver» y foco en el campo de nombre (`1440-agregar-lugar.jpg`) | PASÓ |
| CA-F4-07 | «Volver» desde Agregar lugar | Regresa a Tus lugares con el foco en «+ Agregar lugar» | Vuelve a «Los detalles de tu red.» y el foco queda en «Agregar lugar» | PASÓ |
| CA-F4-08 | Guardar un lugar válido | Toast, regreso a Tus lugares con el lugar nuevo, contador y mapa al día | Guardado `BAR-OCCIDENTE`: toast «Punto BAR-OCCIDENTE registrado.», vuelve a Tus lugares (8 filas, última fila el lugar nuevo) y el mapa lo dibuja | PASÓ |
| CA-F4-09 | Guardar un nombre repetido | Mensaje de la API bajo el campo; no cambia de vista | «✕ El punto 'BOD-CENTRO' ya está registrado.»; la vista sigue siendo «Un nuevo lugar en tu red.» | PASÓ |
| CA-F4-10 | Agregar un trayecto válido | Toast, regreso a Trayectos con la fila nueva; el mapa dibuja la flecha | `BAR-OCCIDENTE → BOD-CENTRO` de 9 min: regresa a la pestaña Trayectos (11 trayectos, fila nueva con `$1.800`) y el mapa dibuja el nodo `BAR-OCCIDENTE` y la flecha de «9 min»; desplegables con nombres amigables, ejemplo «Ej. 12» y recuadro «El regreso no se agrega automáticamente…» (`1440-agregar-trayecto.jpg`) | PASÓ |
| CA-F4-11 | «›» en un lugar | Detalle con «Volver»; «Volver» regresa a la lista | «Bodega Central.» con «Trayectos de salida (3)»; «Volver» regresa y el foco queda en el «›» de esa fila (`1440-detalle-lugar.jpg`) | PASÓ |
| CA-F4-12 | Esc en cualquier vista de la pila | Se cierra todo el diálogo | Con el detalle abierto, Esc deja 0 diálogos abiertos | PASÓ |
| CA-F4-13 | Planear: Bodega Central → Barrio Sur | «Sí, puedes llegar», tiempo, costo, camino, menos tramos y tarifa de la API | «Sí, puedes llegar · RUTA ÓPTIMA», 8 min, $1.600, camino con «Inicio» y acumulados, «La ruta de menos tramos también toma 8 min.», «Tarifa de ejemplo: $200 por minuto.» (`1440-planear-entrega-resultado.jpg`) | PASÓ |
| CA-F4-14 | Cambiar el destino tras el resultado | El resultado se oculta hasta volver a pulsar el botón | Tras elegir El Parque desaparece el bloque del resultado | PASÓ |
| CA-F4-15 | Botón ⇅ | Intercambia origen y destino | `BOD-CENTRO / PR-PARQUE` pasa a `PR-PARQUE / BOD-CENTRO` | PASÓ |
| CA-F4-16 | Destino sin ruta (La Laguna) | «No hay forma de llegar» con el texto de §7 | «No hay forma de llegar» + «No existe un trayecto de Bodega Central a La Laguna. Revisa tus trayectos en Gestionar red.»; sin botón «Ver ruta en la red» | PASÓ |
| CA-F4-17 | «Ver ruta en la red» | Cierra el modal, mapa en «Mejor ruta» y la página se desplaza hasta él | 0 diálogos abiertos, activo el modo «Mejor ruta» y el desplazamiento suave llega a la tarjeta del mapa (`scrollY` pasa de 0 a la posición del mapa) | PASÓ |
| CA-F4-18 | Cerrar y reabrir Planear entrega | Mantiene origen, destino y resultado | Reabierto con `BOD-CENTRO` → `BAR-SUR` y el resultado visible | PASÓ |
| CA-F4-19 | «Cómo se calculó» en Planear entrega y Cobertura | Trazas de Dijkstra y BFS | Dijkstra: «Dijkstra propio con cola de prioridad (heapq)…» con 2 pasos; BFS: «recorrido por capas (BFS) propio…» con capas 0, 1 y 2 (`1440-planear-entrega-como-se-calculo.jpg`) | PASÓ |
| CA-F4-20 | Cobertura desde Bodega Central | «puedes llegar a n de m», barra, aviso, lista con insignias | «5 de 6 lugares», barra verde, «5 alcanzables · 1 sin conexión», aviso naranja «La Laguna está fuera de tu cobertura actual.», lista de 6 lugares con insignias (`1440-cobertura.jpg`) | PASÓ |
| CA-F4-21 | Cambiar el origen en Cobertura | Se recalcula sin botón; el contador 03 también cambia | Origen El Parque: «3 de 6 lugares» y el contador 03 pasa a «Cobertura desde El Parque · 3 de 6» | PASÓ |
| CA-F4-22 | Origen que llega a todos | Recuadro verde «Llegas a todos tus lugares.» | Con una red de 2 lugares (`BOD-A → BAR-B`): «1 de 1 lugar», recuadro verde «Llegas a todos tus lugares.» (la red de ejemplo no tiene un origen así) | PASÓ |
| CA-F4-23 | «Ver cobertura en la red» | Cierra el modal y el mapa queda en Cobertura | 0 diálogos abiertos y modo «Cobertura» activo con el origen elegido | PASÓ |
| CA-F4-24 | API detenida | Botones desactivados con tooltip; «Gestionar red» en solo lectura | Ver nota 1. Con el estado `offline` simulado: «Cobertura» y «Planear entrega» desactivados con el tooltip «Sin conexión con el servidor.»; «Gestionar red» abre sin botones de agregar | PASÓ (con nota) |
| CA-F4-25 | Red vacía (Vaciar red) | Planear y Cobertura desactivados; «Agregar lugar» abre el formulario sin «Volver» y al guardar se cierra | Confirmación con la cabecera nueva; tras vaciar, tooltips «Necesitas al menos un lugar.» / «Necesitas al menos dos lugares.»; mapa vacío; «Agregar lugar» abre el formulario sin «Volver», con el foco en el nombre; al guardar se cierra | PASÓ |
| CA-F4-26 | Red con 1 lugar | Cobertura habilitada; Planear y «+ Agregar trayecto» desactivados con su tooltip | Con `BOD-UNO`: «Cobertura» habilitada, «Planear entrega» desactivada («Necesitas al menos dos lugares.») y «+ Agregar trayecto» desactivado con el mismo tooltip | PASÓ |
| CA-F4-27 | 390 px | Modales a pantalla completa con desplazamiento interno; pie apilado; sin desplazamiento horizontal | Modales de 390×844, `scrollWidth` = `clientWidth` en página y modales; botones del pie apilados; las dos tarjetas del resultado siguen en dos columnas (capturas `390-*.jpg`); también sin desbordes en 768 y 1024 px | PASÓ |
| CA-F4-28 | Ayuda, Confirmar, Cargar ejemplo, Vaciar red | Nueva cabecera | Los cuatro muestran el cuadro de icono, título con punto o interrogación y la X; «Cancelar» arranca enfocado en las confirmaciones | PASÓ |
| CA-F4-29 | `npm run build` y `npm run lint` | Sin errores | `tsc -b && vite build`: 137 módulos, sin errores; `eslint .` sin salida | PASÓ |
| CA-F4-30 | `aceptacion_feature1.py`, `_2.py` y `_3.py` | Pasan igual que antes | Contra una API propia en el puerto 8101: feature 1 = 33/33, feature 2 = 27/27, feature 3 = 39/39. La primera ejecución de la feature 3 se cortó con `ConnectionResetError` tras 36 aprobados; repetida, pasó completa (el backend no cambió: `git diff main -- backend main.py datos` está vacío) | PASÓ (con nota) |

## Notas

1. **CA-F4-24.** `ApiHealthProvider` consulta `/api/salud` solo al cargar y al pulsar «Reintentar», y
   `PanelContent` reemplaza la página por `OfflineNotice` cuando el estado es `offline`. Por eso, con la API
   detenida de verdad, el usuario ve el aviso y no la página. Las reglas de la especificación (botones
   desactivados con tooltip, solo lectura) están en los componentes y se comprobaron simulando el estado
   `offline` con un parche temporal que **no se entregó**. Si se quiere ver la página degradada con la API
   caída, hace falta un cambio en el proveedor de salud, fuera del alcance de esta feature.
2. **CA-F4-30.** El fallo único de la feature 3 fue de conexión del servidor local (Windows), no de un escenario;
   no se repitió en la segunda ejecución.
3. **Capturas.** Salen del panel del navegador integrado (emulando 1440 px se reducen a 800 px de ancho). Se
   compararon visualmente con los bocetos de `docs/feature-4/bocetos/`.
4. **Tarifa.** El boceto muestra «$500 por minuto»; el panel muestra la que devuelve la API (200), como pide la
   especificación.
5. **Nombre del lugar.** El ejemplo del campo es «Ej. Barrio-Occidente» porque la API no admite espacios en el
   identificador (bitácora, fila 10).
