# Prueba manual de «Mi red de entregas»

Checklist de aceptación de `docs/frontend/especificacion-mi-red.md` (CA-M01 a CA-M20).
Preparación: `python main.py --ejemplo` y `cd frontend && npm run dev`; abrir `http://localhost:5173/app`.
Ejecutada el 2026-11-11 en el navegador integrado contra una API propia (puerto 8101) con la red de ejemplo.
Tarifa mostrada: la que devuelve la API (200 COP por minuto).

| ID | Escenario | Esperado | Obtenido | PASÓ / FALLÓ |
|----|-----------|----------|----------|--------------|
| CA-M01 | Abrir `/app` | Header, encabezado, contadores, mapa, planificador, cobertura, tablas y pie; `/app/points` vuelve a `/app` | Composición de la especificación §7; las subrutas redirigen por `<Navigate>` | PASÓ |
| CA-M02 | Contadores con la red de ejemplo | 7 lugares, 10 trayectos y cobertura del origen | 7 · 10 · «5 de 6 lugares alcanzables» desde Bodega Central | PASÓ |
| CA-M03 | Valores por defecto | Bodega Central → La Estación | Origen `BOD-CENTRO`, destino `PR-ESTACION` | PASÓ |
| CA-M04 | Dibujo del mapa | 7 lugares, 10 trayectos con minutos; 12 y 15 min como dos flechas | Todo dibujado; las dos flechas BOD-CENTRO ↔ BAR-NORTE separadas | PASÓ |
| CA-M05 | Zoom, arrastre y recentrar | + / − cambian el tamaño, el arrastre mueve, recentrar restablece | Ancho 744 → 1042 (+) → 446 (−) → 744 (recentrar); arrastre de 80 px desplazó el lienzo 80 px | PASÓ |
| CA-M06 | Bodega Central → La Estación | 18 min, COP, 2 tramos por Barrio Sur y comparación con el directo de 30 min | 18 min · $ 3.600 · 2 tramos; directo 30 min · $ 6.000 (+12 min · +$ 2.400) en discontinua | PASÓ |
| CA-M07 | Bodega Central → La Laguna | «✕ No se puede llegar» con la explicación de la API | Mensaje y explicación de la API tal cual | PASÓ |
| CA-M08 | Modo Cobertura | La Laguna atenuada con ✕; tabla con «Sin conexión» y «Origen» | Capas numeradas, La Laguna atenuada; tabla correcta | PASÓ |
| CA-M09 | Agregar lugar `BAR-NUEVO` | Aparece sin recargar en mapa, tabla, selectores y contadores | Contadores 7 → 8; toast «Punto BAR-NUEVO registrado.» | PASÓ |
| CA-M10 | Agregar trayecto con tiempo `0` y luego válido | 400 en el formulario; el válido aparece | Error 400 con el mensaje de la API; el válido subió los trayectos a 11 | PASÓ |
| CA-M11 | Agregar lugar duplicado `BOD-CENTRO` | Error 409 de la API | «El punto 'BOD-CENTRO' ya está registrado.» | PASÓ |
| CA-M12 | Vaciar red y cargar ejemplo desde «Modo de demostración» | Confirmación; estado vacío con «Cargar datos de ejemplo» | Confirmación con el conteo; estado vacío y recarga correctos | PASÓ |
| CA-M13 | «›» de Bodega Central | Detalle con las 3 salidas | Barrio Norte 12 · Barrio Sur 8 · La Estación 30 | PASÓ |
| CA-M14 | «Ver imagen generada» | PNG de la API del modo activo | `/api/red/imagen?v=0` → 200 `image/png` | PASÓ |
| CA-M15 | «Ver cómo se calculó» | Traza de Dijkstra (ruta) y BFS (cobertura) | Capas y pasos del BFS; traza de Dijkstra en el resultado de la ruta | PASÓ |
| CA-M16 | Apagar la API y abrir `/app` | Aviso con «Reintentar»; la insignia deja de decir «Datos de ejemplo» | Aviso de API caída; el header dice «API sin conexión»; «Reintentar» recupera la página | PASÓ |
| CA-M17 | 390 px | Sin scroll horizontal; orden de §7.8; controles de 40 px | `scrollWidth` 390; planificador → mapa → cobertura → tablas; controles de 40 px; filas apiladas | PASÓ |
| CA-M18 | Buscador | Filtra por nombre, ID o tipo | «barrio» → 4 filas; «laguna» → 1 fila | PASÓ |
| CA-M19 | Recargar | No se recupera nada del navegador | `localStorage` y `sessionStorage` vacíos | PASÓ |
| CA-M20 | `npm run build`, `npm run lint` y aceptación Python | Sin errores; 33/33, 27/27 y 39/39 | Build y lint sin errores; los tres scripts pasan (el de la Feature 3 falló una vez por un reinicio de conexión y pasó al repetirlo) | PASÓ |

## Pendiente de revisión humana

- Comparación visual fina con las capturas de referencia a 1440 px (las capturas del navegador integrado salen reducidas a 800 px de ancho).
- Teclado (Tab) y lector de pantalla: foco visible y diálogos con Esc se comprobaron en el código, no con una persona.
- En móvil, el orden visual (planificador antes que el mapa) se logra con CSS `order`; el orden del DOM y del foco sigue siendo mapa → planificador.
