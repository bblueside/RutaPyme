# Feature 3 — Ruta de menor costo · Especificación

> Documento de entrada del desarrollo orientado a especificaciones (SDD).
> Primero se acuerda **qué** debe hacer el sistema; después se escribe el código.
> Estado: **aprobada** en su propio Pull Request (PR1), antes de integrar el código de la feature.
> **Adición — costo monetario (COP):** HU-14, reglas R-24 a R-27 y criterios CA-47 a CA-54. Se
> aprueba en el PR de la rama `feature/3-adicion-costo`; esta especificación es su primer commit.

## 1. Valor de negocio

El **despachador** de RutaPyme compara alternativas y obtiene la **ruta de menor costo** (menos
minutos en total) entre dos puntos conectados. Hoy elige "la de menos saltos" por intuición, y a
veces esa ruta es la más cara. El sistema devuelve la secuencia de puntos, el costo acumulado,
**por qué** se eligió esa ruta frente a la de menos trayectos y, si no hay ruta, una explicación.

La Feature 2 responde **"¿puedo llegar?"**. La Feature 3 responde **"¿por dónde me sale más barato?"**.
Son dos necesidades distintas y se resuelven con dos algoritmos distintos (BFS y Dijkstra).

**Adición — costo monetario.** Además de los minutos, el despachador necesita saber **cuánto cuesta
en pesos colombianos (COP)** la ruta para cotizarle al cliente. El backend usa **una sola tarifa
fija por minuto** (`COST_PER_MINUTE_COP = 200` en `backend/network.py`) y convierte los minutos de la
ruta a pesos. La ruta elegida **no cambia**: Dijkstra sigue minimizando minutos y, como la tarifa es
la misma para todos los minutos, la ruta más corta en tiempo también es la más barata en pesos.

## 2. Historias de usuario

| ID    | Como...      | Quiero...                                                              | Para...                                                       |
|-------|--------------|------------------------------------------------------------------------|---------------------------------------------------------------|
| HU-09 | despachador  | pedir la ruta de menor costo entre un origen y un destino              | despachar por el camino que menos minutos toma                |
| HU-10 | despachador  | ver la secuencia de puntos, el costo de cada tramo y el costo total    | explicarle al conductor el recorrido y el tiempo estimado     |
| HU-11 | despachador  | comparar la ruta elegida con la de menos trayectos                     | entender por qué "menos saltos" no siempre es "menos tiempo"  |
| HU-12 | despachador  | recibir una explicación cuando no existe ruta                          | avisar al coordinador qué trayecto falta registrar            |
| HU-13 | equipo       | ver la traza del algoritmo (qué punto se cerró y qué costos mejoró)    | explicar y verificar el algoritmo en el pitch                 |
| HU-14 | despachador  | ver el costo en pesos (COP) de la ruta, de cada tramo y de la alternativa de menos trayectos | cotizarle el despacho al cliente y mostrarle cuánto ahorra |

## 3. Reglas del dominio

Se mantienen las reglas R-01 a R-15 de las Features 1 y 2. Se agregan:

| Regla | Descripción |
|-------|-------------|
| R-16 | El **costo de una ruta** es la **suma** de los costos (minutos) de sus trayectos, recorridos en el **sentido** registrado. |
| R-17 | La ruta de menor costo se calcula con un algoritmo **propio de Dijkstra** con cola de prioridad (`heapq`, biblioteca estándar) sobre la lista de adyacencia de `backend/red.py`. NetworkX no participa. |
| R-18 | Dijkstra solo es correcto con **costos mayores que 0**. R-05 ya lo exige al registrar; además, antes de calcular una ruta se **verifica otra vez** cada costo y, si alguno no cumple, se responde **400** `dato_invalido` sin calcular nada. |
| R-19 | Para reconstruir la ruta se conserva, por cada punto, el **predecesor** (`llega_desde`): el punto desde el que se llegó con el menor costo. |
| R-20 | El origen y el destino deben ser puntos registrados y se normalizan igual que en R-01. |
| R-21 | Que no exista ruta **no es un error**: es una respuesta válida (200) con `existe_ruta: false` y una **explicación** (misma lógica que R-12). |
| R-22 | La respuesta **compara** la ruta de menor costo con el camino de **menos trayectos** (el BFS de la Feature 2) e indica la diferencia de costo. |
| R-23 | Si origen = destino, la ruta es `[origen]` con **costo 0** y 0 trayectos. Consultar una ruta **no modifica** la red. Si dos rutas empatan en costo, se devuelve la que el algoritmo descubre primero (orden de registro de las conexiones). |

Reglas de la adición (costo monetario):

| Regla | Descripción |
|-------|-------------|
| R-24 | El **costo monetario** de una ruta es `minutos × COST_PER_MINUTE_COP`, con `COST_PER_MINUTE_COP = 200` COP por minuto. Es **una sola constante** del backend (`backend/network.py`): no se cambia por la API ni por variables de entorno. La elección de la ruta **no cambia**: Dijkstra sigue minimizando minutos (R-16). |
| R-25 | Los pesos se redondean al **peso entero** más cercano con `decimal.Decimal` y `ROUND_HALF_UP` (0,5 sube). Los minutos se convierten con `Decimal(str(minutos))` para no arrastrar el valor binario del `float` (`Decimal(2.0025)` vale 2.00249999…). Se redondea **sobre minutos ya sumados**: `costo_cop` de un tramo = redondeo de su costo × tarifa; `acumulado_cop` y `total` = redondeo del acumulado en minutos × tarifa. Por eso `total` puede diferir en a lo sumo 1 peso por tramo de la suma de los `costo_cop`; el valor válido es `total`. |
| R-26 | `COST_PER_MINUTE_COP` debe ser un **entero mayor que 0** (`bool` no cuenta). Se valida **al importar** `backend/network.py`: si no cumple, el módulo no se carga y el servidor **no arranca**, con un mensaje claro. |
| R-27 | Sin ruta (`existe_ruta: false`) **no** se envía `costo_monetario`, igual que no se envía `camino`. Si origen = destino, `costo_monetario.total` es **0**. La `traza`, `orden_definitivos` y `costos_definitivos` siguen **solo en minutos**: describen el algoritmo, y el algoritmo no usa pesos. |

## 4. Criterios de aceptación

| ID    | Dado | Cuando | Entonces |
|-------|------|--------|----------|
| CA-32 | la red de ejemplo | se pide `GET /api/ruta/BOD-CENTRO/PR-ESTACION` | **200**, `existe_ruta: true`, `camino` `BOD-CENTRO → BAR-SUR → PR-ESTACION`, `costo_total: 18`, `saltos: 2` |
| CA-33 | la misma consulta | se leen los `tramos` | cada tramo trae su costo y el `acumulado` (8, 18) |
| CA-34 | un destino con un camino directo caro (1 trayecto, 30 min) y otro más largo y barato (2 trayectos, 18 min) | se pide la ruta | `comparacion_menos_saltos` muestra el camino de 1 trayecto, su costo 30 y la `diferencia` 12, con un mensaje que lo explica |
| CA-35 | la red de ejemplo | se pide una ruta | la respuesta trae `orden_definitivos`, `costos_definitivos` y una `traza` con, por cada paso, el punto que se vuelve definitivo, los costos que mejora y la decisión tomada |
| CA-36 | un destino sin trayectos de entrada (`PR-LAGUNA`), un origen sin salidas o un destino solo alcanzable en sentido contrario | se pide la ruta | **200**, `existe_ruta: false` y una `explicacion` clara; no se devuelve `camino` |
| CA-37 | origen = destino | se pide la ruta | **200**, `camino: [origen]`, `costo_total: 0`, `saltos: 0` |
| CA-38 | una red con ciclos | se pide una ruta | el algoritmo termina, ningún punto se vuelve definitivo dos veces y la ruta es la de menor costo |
| CA-39 | una red vacía | se pide cualquier ruta | **404** `red_vacia` |
| CA-40 | no existe el origen o el destino | se pide la ruta | **404** `punto_inexistente` indicando cuál falta |
| CA-41 | cualquier red | el origen o el destino tienen formato inválido | **400** `dato_invalido` |
| CA-42 | cualquier red | se llama `GET /api/ruta` o `GET /api/ruta/{origen}` | **400** `formato_incorrecto` |
| CA-43 | cualquier red | se intenta registrar un trayecto con costo 0, negativo o no numérico | **400** `dato_invalido` y la ruta calculada no cambia |
| CA-44 | una red en memoria con un costo que no es mayor que 0 | se pide una ruta | **400** `dato_invalido` explicando que Dijkstra exige costos positivos (R-18) |
| CA-45 | una red con puntos | se pide `GET /api/red/imagen/ruta/{origen}/{destino}` | **200** PNG dibujado por NetworkX a partir del resultado de **nuestro** Dijkstra (ruta resaltada; si no hay ruta, solo se marcan origen y destino); **404** si un punto no existe |
| CA-46 | — | se lee la documentación | hay una traza con dos caminos de distinto número de saltos y costo, y se explica qué dato se conserva para reconstruir la ruta (`modelado.md`) |

Criterios de la adición (costo monetario, tarifa de 200 COP/min):

| ID    | Dado | Cuando | Entonces |
|-------|------|--------|----------|
| CA-47 | la red de ejemplo | se pide `GET /api/ruta/BOD-CENTRO/PR-ESTACION` | **200** y `costo_monetario` = `{ "moneda": "COP", "tarifa_por_minuto": 200, "total": 3600 }` (18 min × 200); el `mensaje` incluye `$3.600 COP` |
| CA-48 | la misma consulta | se leen los `tramos` | `costo_cop` 1600 y 2000; `acumulado_cop` 1600 y 3600 |
| CA-49 | la misma consulta | se lee `comparacion_menos_saltos` | `costo_cop: 6000` (30 min) y `diferencia_cop: 2400`; su `mensaje` incluye los pesos |
| CA-50 | un destino sin ruta (`PR-LAGUNA`) | se pide la ruta | **200**, `existe_ruta: false` y la respuesta **no** trae `costo_monetario` |
| CA-51 | origen = destino | se pide la ruta | **200** y `costo_monetario.total: 0` |
| CA-52 | una red con un único trayecto de 2.0025 min | se pide la ruta | `costo_monetario.total: 401` (400,5 se redondea hacia arriba, R-25) |
| CA-53 | `COST_PER_MINUTE_COP` vale 0, un negativo, un decimal, un texto o `True` | se valida la tarifa | se lanza `ValueError` con un mensaje claro y el servidor no arranca (R-26); se verifica en consola (`plan.md`) |
| CA-54 | cualquier red | se pide una ruta | `camino`, `costo_total`, `tramos[].costo` y la `traza` son los mismos que antes de la adición; los scripts de aceptación de las Features 1 y 2 siguen pasando |

## 5. Contrato de la API REST

Se usan parámetros **en la ruta**, igual que la Feature 2: la consulta es una lectura (`GET`, sin
cuerpo) y se puede repetir sin cambiar la red.

| Método | Ruta | Éxito | Errores |
|--------|------|-------|---------|
| GET | `/api/ruta/{origen}/{destino}` | 200 `existe_ruta: true/false` | 400, 404 |
| GET | `/api/ruta` · `/api/ruta/{origen}` | — | 400 `formato_incorrecto` (faltan datos) |
| GET | `/api/red/imagen/ruta/{origen}/{destino}` | 200 `image/png` con la ruta resaltada | 400, 404, 503 |

### Respuesta cuando existe ruta (`GET /api/ruta/BOD-CENTRO/PR-ESTACION`, resumida)

```json
{
  "origen": { "id": "BOD-CENTRO", "tipo": "bodega" },
  "destino": { "id": "PR-ESTACION", "tipo": "punto_recogida" },
  "algoritmo": "Dijkstra propio con cola de prioridad (heapq) sobre la lista de adyacencia",
  "existe_ruta": true,
  "mensaje": "La ruta de menor costo de BOD-CENTRO a PR-ESTACION cuesta 18 min ($3.600 COP) en 2 trayectos.",
  "camino": ["BOD-CENTRO", "BAR-SUR", "PR-ESTACION"],
  "costo_total": 18,
  "saltos": 2,
  "costo_monetario": { "moneda": "COP", "tarifa_por_minuto": 200, "total": 3600 },
  "tramos": [
    { "origen": "BOD-CENTRO", "destino": "BAR-SUR", "costo": 8, "acumulado": 8, "costo_cop": 1600, "acumulado_cop": 1600 },
    { "origen": "BAR-SUR", "destino": "PR-ESTACION", "costo": 10, "acumulado": 18, "costo_cop": 2000, "acumulado_cop": 3600 }
  ],
  "comparacion_menos_saltos": {
    "camino": ["BOD-CENTRO", "PR-ESTACION"],
    "saltos": 1,
    "costo": 30,
    "diferencia": 12,
    "costo_cop": 6000,
    "diferencia_cop": 2400,
    "mensaje": "El camino con menos trayectos (1) cuesta 30 min ($6.000 COP): 12 min ($2.400 COP) más que la ruta de menor costo (2 trayectos). Menos saltos no significa menor costo."
  },
  "orden_definitivos": ["BOD-CENTRO", "BAR-SUR", "BAR-NORTE", "BAR-ORIENTE", "PR-ESTACION"],
  "costos_definitivos": { "BOD-CENTRO": 0, "BAR-SUR": 8, "BAR-NORTE": 12, "BAR-ORIENTE": 14, "PR-ESTACION": 18 },
  "traza": [
    {
      "paso": 2,
      "definitivo": "BAR-SUR",
      "costo": 8,
      "mejora": [
        { "punto": "PR-ESTACION", "antes": 30, "ahora": 18 },
        { "punto": "BAR-ORIENTE", "antes": null, "ahora": 14 }
      ],
      "descarta": [],
      "pendientes": [
        { "punto": "BAR-NORTE", "costo": 12 },
        { "punto": "BAR-ORIENTE", "costo": 14 },
        { "punto": "PR-ESTACION", "costo": 18 }
      ],
      "decision": "BAR-SUR queda definitivo con 8 min; mejora PR-ESTACION (30 → 18), BAR-ORIENTE (∞ → 14)."
    }
  ]
}
```

`antes: null` significa que el punto todavía no tenía costo conocido (∞).

Campos de la adición (costo monetario). Los campos en minutos **no cambian de nombre ni de valor**:
`costo`, `costo_total`, `acumulado` y `diferencia` siguen siendo minutos.

| Campo | Tipo | Significado |
|-------|------|-------------|
| `costo_monetario.moneda` | texto | Siempre `"COP"` |
| `costo_monetario.tarifa_por_minuto` | entero | Valor de `COST_PER_MINUTE_COP` (200) |
| `costo_monetario.total` | entero | `costo_total` × tarifa, redondeado (R-25) |
| `tramos[].costo_cop` | entero | Costo del tramo en pesos |
| `tramos[].acumulado_cop` | entero | Acumulado hasta ese tramo en pesos; el último es igual a `total` |
| `comparacion_menos_saltos.costo_cop` | entero | Costo en pesos del camino de menos trayectos |
| `comparacion_menos_saltos.diferencia_cop` | entero | `costo_cop` de la comparación − `total` |

En los mensajes, los pesos se escriben con punto de miles (`$3.600 COP`). Si las dos opciones
empatan, el mensaje de la comparación también muestra los pesos: *"…cuesta lo mismo (14 min,
$2.800 COP)…"*. Si origen = destino: *"… es el mismo punto de origen: costo 0 min ($0 COP), sin
hacer ningún trayecto."*

### Respuesta cuando no existe ruta (`GET /api/ruta/BOD-CENTRO/PR-LAGUNA`)

No trae `camino` ni `costo_monetario` (R-27).

```json
{
  "existe_ruta": false,
  "mensaje": "No existe ruta de BOD-CENTRO a PR-LAGUNA.",
  "explicacion": "Ningún trayecto llega a PR-LAGUNA (no tiene conexiones de entrada): no se puede alcanzar desde ningún punto de la red.",
  "orden_definitivos": ["BOD-CENTRO", "BAR-SUR", "BAR-NORTE", "BAR-ORIENTE", "PR-ESTACION", "PR-PARQUE"],
  "costos_definitivos": { "BOD-CENTRO": 0, "BAR-SUR": 8, "...": "..." },
  "traza": ["..."]
}
```

### Errores

| Código HTTP | `codigo` | Cuándo |
|-------------|----------|--------|
| 404 | `red_vacia` | la red no tiene puntos |
| 404 | `punto_inexistente` | el origen o el destino no están registrados |
| 400 | `dato_invalido` | id con formato inválido, o un costo de la red que no es mayor que 0 (R-18) |
| 400 | `formato_incorrecto` | falta el origen o el destino en la ruta |
| 405 | `metodo_no_permitido` | se usa un método distinto de `GET` |

## 6. Fuera de alcance de la Feature 3

- Interfaz web de la ruta en el panel React (`frontend/src`): la construye el equipo de frontend sobre
  este contrato. La adición del costo monetario **sí** actualiza la vista de ruta de `frontend/legacy`.
- Cambiar la tarifa por la API o por variables de entorno, tarifas distintas por trayecto o por tipo
  de punto, y elegir la ruta por pesos en vez de por minutos.
- Mostrar los pesos en `/api/salud` o en la imagen PNG de la ruta.
- Varias rutas alternativas ordenadas (k caminos más cortos) o restricciones de paso por un punto.
- Costos negativos (necesitarían Bellman-Ford) y costos que cambian con la hora o el tráfico.
- Varios vehículos, capacidad de carga o ventanas de tiempo.
