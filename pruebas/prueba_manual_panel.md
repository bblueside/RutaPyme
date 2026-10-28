# Prueba manual del panel React

Checklist de aceptación del panel (`docs/frontend/plan.md`, criterios CA-P1 a CA-P15).
Cada escenario se ejecuta con la red de ejemplo y se anota lo **obtenido** y **PASÓ / FALLÓ**.

Preparación: terminal 1 `python main.py --ejemplo`; terminal 2 `cd frontend && npm run dev`; abrir
`http://localhost:5173/app`.

| ID | Escenario | Esperado | Obtenido | PASÓ / FALLÓ |
|----|-----------|----------|----------|--------------|
| CA-P1 | Abrir `/app` con la API encendida | Encabezado con Resumen · Puntos · Conexiones · Cobertura y el ítem activo marcado | | |
| CA-P2 | Apagar la API y abrir `/app` | Indicador rojo "API sin conexión", botón "Reintentar" y acciones deshabilitadas | | |
| CA-P3 | Pulsar "Vaciar red" y "Cargar red de ejemplo" | Diálogo de confirmación (foco en "Cancelar", Esc lo cierra); al confirmar: toast y todas las vistas se actualizan | | |
| CA-P4 | Puntos: registrar `BAR-NUEVO` (barrio), repetir `BOD-CENTRO` y escribir `bar nuevo` | 201 → toast y fila resaltada; 409 y 400 → mensaje de la API junto al formulario | | |
| CA-P5 | Puntos: consultar `BOD-CENTRO` y `NO-EXISTE` | Salidas con costo / mensaje 404 en línea | | |
| CA-P6 | Conexiones: registrar válida, duplicada, a un punto inexistente y con costo `doce` | 201 → toast y fila nueva; 409, 404 y 400 → mensaje en línea | | |
| CA-P7 | Abrir Resumen (y con la imagen no disponible) | Contadores, lista de adyacencia e imagen; si hay 503 se muestra el mensaje de la API | | |
| CA-P8 | Cobertura: `?from=BOD-CENTRO` | Veredicto, cifras, alcanzables, no alcanzables con motivo, capas, orden de visita, traza e imagen resaltada | | |
| CA-P9 | Cobertura: `BOD-CENTRO → BAR-ORIENTE` y `BOD-CENTRO → PR-LAGUNA` | Camino de evidencia + trayectos + nota / explicación y `alcanzables_desde_origen` | | |
| CA-P10 | Copiar el enlace con el chip y abrirlo en otra pestaña | Toast "Enlace copiado"; la otra pestaña muestra la misma consulta | | |
| CA-P11 | Con una cobertura en pantalla, registrar una conexión; luego vaciar la red | Se recalcula; al vaciar, la URL se limpia y aparece un toast de aviso | | |
| CA-P12 | Cobertura: enviar el formulario sin origen | No se llama a la API; "Indique el punto de origen" en línea | | |
| CA-P13 | Landing `/`: navegar por secciones y pulsar "Probar el optimizador" | Funciona igual que antes; el CTA lleva a `/app` | | |
| CA-P14 | `npm run lint`, `npm run build` y control de líneas | Sin errores; ningún archivo de `src/` pasa de 500 líneas | | |
| CA-P15 | Puntos y Conexiones: registrar un punto y una conexión válidos | La imagen se redibuja sin recargar y muestra el punto / la arista nuevos | | |

## Revisión visual (`docs/frontend/plan-diseno.md`, secciones 7 y 8)

| Escenario | Esperado | Obtenido | PASÓ / FALLÓ |
|-----------|----------|----------|--------------|
| Anchos 1280, 960, 768 y 390 px | Sin desplazamiento horizontal de la página; por debajo de 860 px aparece la barra de navegación secundaria | | |
| Teclado (Tab) en las 4 vistas | Foco visible en todo elemento interactivo | | |
| `prefers-reduced-motion: reduce` | Sin esqueleto animado, resaltado de fila ni animación de toasts | | |
| `alt` de las imágenes | "Red con N puntos y M trayectos" / "Cobertura desde X: N alcanzables" | | |
