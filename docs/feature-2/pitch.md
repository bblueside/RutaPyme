# Feature 2 — Guía del pitch: Cobertura de entregas

> Formato exigido: **7 minutos de demo + 3 de preguntas**. La guía sigue los seis puntos que
> pide `Guia_tecnica.md` ("Qué debe explicar el pitch"). Todo lo que se dice sale de
> `especificacion.md`, `modelado.md` y `plan.md` de esta carpeta.

## Mapa de tiempos

| Min | Bloque | Qué se cubre del enunciado |
|-----|--------|----------------------------|
| 0:00–0:45 | 1. Problema y usuario | Problema de negocio y usuario afectado |
| 0:45–1:45 | 2. Modelado | Nodos, aristas, dirección, pesos, representación |
| 1:45–3:15 | 3. Algoritmo y estructura | Recorrido, por qué sirve, complejidad |
| 3:15–5:30 | 4. Demo en vivo | Valor visible para el usuario |
| 5:30–6:15 | 5. Caso borde | Un caso borde y cómo responde el sistema |
| 6:15–7:00 | 6. Evidencia y equipo | Script de aceptación, aportes del equipo |
| 7:00–10:00 | Preguntas | Ver banco de preguntas al final |

---

## 1. Problema y usuario (45 s)

**Frase de apertura:** *"Hoy un despachador acepta un pedido a un barrio y recién después descubre
que no existe una conexión que llegue hasta allá."*

- **Usuario:** el despachador de RutaPyme.
- **Dolor:** enviar "a ojo" por un trayecto que no existe.
- **Lo que entrega la Feature 2:** responder **"¿puedo llegar?"** y, si no, **explicar por qué**
  para que el coordinador sepa qué trayecto falta registrar.
- **Límite claro (decirlo en voz alta):** no responde "¿cuál es la ruta más barata?". Eso es la
  Feature 3, con otro algoritmo.

Historias que se resuelven: HU-05 (alcanzables desde una bodega), HU-06 (¿este destino sí?),
HU-07 (explicación si no), HU-08 (traza para explicar el algoritmo).

## 2. Decisión de modelado (1 min)

Mostrar el grafo de ejemplo (`docs/img/cobertura-bod-centro.png`) y decir:

| Elemento | Decisión |
|----------|----------|
| **Nodos** | Puntos de la red: bodegas, barrios, puntos de recogida |
| **Aristas** | Trayectos entre puntos |
| **Dirección** | **Dirigido**: A→B no implica B→A (regla R-09) |
| **Pesos** | Existen (minutos), pero la cobertura **los ignora**: solo usa las flechas |
| **Representación** | **Lista de adyacencia** `{punto: {destino: costo}}`, la misma de la Feature 1 |

**Por qué lista y no matriz:** recorrer los vecinos de un punto cuesta O(grado) y no O(V). Con
matriz el recorrido completo sería O(V²).

**Dato para el mensaje:** la Feature 2 no cambió el grafo, agregó una capacidad sobre él.

## 3. Algoritmo: recorrido por capas (BFS) propio (1 min 30 s)

**Idea en una frase:** *"Primero lo que está a 1 trayecto, luego a 2, luego a 3…"*

Pseudocódigo para tener en pantalla (de `backend/red.py`, `_recorrer_por_capas`):

```text
capa = {origen: 0}; cola = [origen]
mientras la cola no esté vacía:
    actual = sacar el primero            # FIFO → por capas
    para cada vecino de actual:
        si ya es conocido → ignorar      # corta ciclos
        si no → capa[vecino] = capa[actual] + 1; meter a la cola
```

**Por qué BFS y no DFS** (ambos O(V + E)):
- BFS da gratis los `saltos` de cada punto y un camino de evidencia con **menos trayectos**.
- La traza es más fácil de leer para el despachador.
- DFS recursivo puede topar con el límite de recursión en redes grandes.

**Por qué NO Dijkstra:** necesitaría cola de prioridad y costos para responder otra pregunta.

**Complejidad:** tiempo **O(V + E)**, memoria extra **O(V)**. Cada punto entra una vez a la cola y
cada conexión se revisa una vez. Estructura: `collections.deque` (biblioteca estándar).

**Dos detalles que suelen preguntar:**
1. **Se marca al descubrir, no al visitar.** Si no, un punto con dos entradas entraría dos veces a la cola.
2. **Los ciclos no son problema:** volver a un punto conocido se ignora.

> Regla del arnés: el algoritmo es **propio**. NetworkX solo dibuja lo que nuestro código ya calculó.

## 4. Demo en vivo (2 min 15 s)

**Preparación (antes de empezar, no durante):**

```bash
python main.py --ejemplo          # backend
cd frontend && npm run dev        # interfaz
```

Tener abierta la sección **Cobertura de entregas** y, de respaldo, el video de 3 minutos.

| # | Acción | Resultado esperado | Qué decir |
|---|--------|--------------------|-----------|
| 1 | Origen `BOD-CENTRO`, sin destino | "5 de 6 puntos" cubiertos; `PR-LAGUNA` en no alcanzables con motivo; imagen con origen con borde, alcanzables a color, no alcanzables apagados | "Esta es la zona que puedo cubrir hoy" |
| 2 | Abrir la traza | Orden: BOD-CENTRO → BAR-NORTE → BAR-SUR → PR-ESTACION → PR-PARQUE → BAR-ORIENTE | "Cada fila es una decisión del algoritmo, no una caja negra" (HU-08) |
| 3 | Destino `BAR-ORIENTE` | Sí, 2 trayectos: `BOD-CENTRO → BAR-SUR → BAR-ORIENTE` | "Confirmo el pedido antes de despacharlo" |
| 4 | Destino `PR-LAGUNA` | No, con explicación | Pasa al caso borde (bloque 5) |
| 5 | Registrar una conexión nueva hacia `PR-LAGUNA` | La cobertura se recalcula sola | "El coordinador arregla la red y el despachador lo ve al instante" (CA-31) |

**Si algo falla:** mostrar el video y la salida del script (guardarla antes en `pruebas/salidas/aceptacion_feature2.txt`: hoy ese archivo no existe).
No depurar en vivo.

## 5. Caso borde: la dirección importa (45 s)

Elegir **uno** y contarlo bien. Recomendado: `BAR-SUR → BAR-NORTE`.

- Existe `BAR-NORTE → BOD-CENTRO → BAR-SUR`, pero **no** el regreso.
- Respuesta del sistema: **200** con `alcanzable: false` (no es un error) y una explicación:
  *"A BAR-NORTE solo llegan trayectos desde BOD-CENTRO, y ninguno de esos puntos es alcanzable
  desde BAR-SUR. Recuerde que la red es dirigida."*
- Mensaje: **la cobertura en un grafo dirigido no es simétrica.**

Alternativas si el tiempo sobra: red con ciclos (cada punto aparece una sola vez), origen sin
salidas (`PR-ESTACION`), red vacía (404 `red_vacia`).

**Trampa a mencionar con honestidad (CA-27):** el `camino` que devuelve el BFS es el de menos
trayectos, no el más barato. A `PR-ESTACION`: directo = 1 trayecto/30 min; por `BAR-SUR` =
2 trayectos/18 min. Por eso la respuesta lleva una `nota` que lo aclara y no devuelve costo acumulado.

## 6. Evidencia y equipo (45 s)

- **Script de aceptación:** `pruebas/aceptacion_feature2.py` con `urllib`, sin pytest ni mocks.
  **27 escenarios** (el plan dice 28; el script tiene 27), cada uno imprime escenario, esperado,
  obtenido y PASÓ/FALLÓ. Mostrar el `27/27` de la salida real.
- **Regresión:** la Feature 1 sigue en **33/33**.
- **Errores cubiertos:** 400 `dato_invalido`, 400 `formato_incorrecto`, 404 `punto_inexistente`,
  404 `red_vacia`.
- **SDD:** primero especificación aprobada (PR1), después el código.
- **Aportes (PR por tarea, revisión cruzada):**

| PR | Tarea |
|----|-------|
| PR1 | Especificación y modelado |
| PR2 | Núcleo: BFS y explicación de no alcanzable |
| PR3 | API REST y script de aceptación |
| PR4 | Imagen con cobertura resaltada |
| PR5 | Interfaz |
| PR6 | README y bitácora de IA |

> Completar con los nombres reales de cada integrante y los enlaces a los PR antes de exponer.

---

## Banco de preguntas probables (3 min)

| Pregunta | Respuesta corta |
|----------|-----------------|
| ¿Por qué no usaron Dijkstra? | Pide otra cosa: cobertura es "¿existe camino?", no "¿cuál es el más barato?". Dijkstra necesita costos y cola de prioridad. Es la Feature 3. |
| ¿Por qué BFS y no DFS? | Mismo O(V + E), pero BFS da `saltos` y camino con menos trayectos, y la traza es más legible. |
| ¿Qué pasa con los ciclos? | Se marca al descubrir; un punto conocido se ignora. Cada punto sale una vez en `orden_visita` (CA-22). |
| ¿Por qué un destino no alcanzable devuelve 200 y no error? | No es un fallo del cliente ni del servidor: es una respuesta válida (R-12), con explicación. |
| ¿Qué complejidad tiene? | Tiempo O(V + E), memoria O(V). Con matriz sería O(V²). |
| ¿Por qué lista de adyacencia? | Red dispersa: se recorren solo las salidas reales de cada punto. |
| ¿El camino devuelto es el más corto? | Es el de menos trayectos, no el de menor costo. Lo aclara la `nota` (CA-27). |
| ¿La consulta modifica la red? | No (R-15). Es un `GET` repetible. |
| ¿Usan NetworkX? | Solo en `visualizacion.py`, para dibujar el resultado que ya calculó nuestro BFS. |
| ¿Qué pasa si el origen no es bodega? | Se permite; se informa el tipo del origen en la respuesta. |
| ¿Qué quedó fuera? | Ruta de menor costo y costo acumulado (Feature 3); cerrar o abrir trayectos temporalmente. |
| ¿Cómo usaron IA? | Ver `docs/ia/` y completar con propuestas aceptadas y rechazadas de esta feature. |

## Checklist previo

- [ ] Registrado quién expone (nadie repite hasta que todos hayan expuesto).
- [ ] Backend con `--ejemplo` y frontend levantados; imagen de cobertura carga.
- [ ] `aceptacion_feature2.py` ejecutado y salida guardada a mano (27/27).
- [ ] Video de respaldo de máximo 3 min listo.
- [ ] Nombres y enlaces de PR en el bloque 6.
- [ ] Ensayo cronometrado: no pasar de 7 minutos.
