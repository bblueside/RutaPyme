# Prueba manual de la interfaz (CA-14)

El script automático cubre la API. La interfaz se prueba con estos pasos en
`http://127.0.0.1:8000` (servidor con `python main.py --ejemplo`).

| # | Paso | Resultado esperado | Resultado |
|---|------|--------------------|-----------|
| 1 | Abrir la página | Indicador "API conectada"; tarjetas con 7 puntos y 10 conexiones; imagen del grafo | ✅ |
| 2 | Registrar conexión `bod-centro → BAR-OESTE`, costo 5 | Aviso rojo: "El punto de destino 'BAR-OESTE' no existe. Regístrelo primero." | ✅ |
| 3 | Consultar salidas de `bar-norte` | `BAR-NORTE · Barrio → BOD-CENTRO (15 min), PR-PARQUE (7 min)` | ✅ |
| 4 | Pulsar "Consultar" con el campo vacío | Mensaje: "Escriba el identificador de un punto para consultar sus salidas." (sin llamar a la API) | ✅ |
| 5 | Registrar punto `BAR-ESTE` (barrio) | Aviso verde, aparece en la tabla y en la imagen | ✅ |
| 6 | Registrar `BAR-ESTE` otra vez | Aviso rojo: "El punto 'BAR-ESTE' ya está registrado." | ✅ |
| 7 | Vista en celular (375 px) y modo oscuro | Todo se reacomoda en una columna y se lee bien | ✅ |
| 8 | "Vaciar red" y luego "Cargar red de ejemplo" | Pide confirmación; la red queda vacía y luego vuelve a 7 puntos | ✅ |

Probado con el navegador integrado de Claude Code el 2026-09-29. Los integrantes deben repetirla
antes de aprobar el PR.
