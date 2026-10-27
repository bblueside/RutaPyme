# Feature 2 — Cobertura de entregas · Especificación

> Documento de entrada del desarrollo orientado a especificaciones (SDD).
> Primero se acuerda **qué** debe hacer el sistema; después se escribe el código.
> Estado: **aprobada** en su propio Pull Request (PR1), antes de integrar el código de la feature.

## 1. Valor de negocio

El **despachador** de RutaPyme puede saber qué destinos son alcanzables desde una bodega (o desde
cualquier punto) y verificar si un destino concreto se puede cubrir. Si no se puede, el sistema
explica por qué, en lugar de que el pedido se envíe "a ojo" por una conexión que no existe.

La cobertura responde **"¿puedo llegar?"**. No responde "¿cuál es la ruta más barata?": eso es la
Feature 3 y se resolverá con otro algoritmo.

## 2. Historias de usuario

| ID    | Como...      | Quiero...                                                     | Para...                                              |
|-------|--------------|---------------------------------------------------------------|------------------------------------------------------|
| HU-05 | despachador  | consultar todos los destinos alcanzables desde una bodega     | saber qué zona puedo cubrir con la red actual        |
| HU-06 | despachador  | preguntar si un destino concreto es alcanzable desde un origen | confirmar un pedido antes de despacharlo             |
| HU-07 | despachador  | recibir una explicación cuando un destino no es alcanzable    | avisar al coordinador qué trayecto falta registrar   |
| HU-08 | equipo       | ver la traza del recorrido (orden de visita y decisiones)     | explicar y verificar el algoritmo en el pitch        |

## 3. Reglas del dominio

Se mantienen las reglas R-01 a R-08 de la Feature 1. Se agregan:

| Regla | Descripción |
|-------|-------------|
| R-09 | Un punto **B es alcanzable** desde A si existe una secuencia de trayectos A→…→B que respeta el **sentido** de cada conexión. |
| R-10 | El recorrido es un algoritmo **propio** (recorrido por capas, BFS) sobre la lista de adyacencia de `backend/red.py`. NetworkX no participa. |
| R-11 | El origen (y el destino, si se envía) deben ser puntos registrados. Se normalizan igual que en R-01 (`bod-centro` = `BOD-CENTRO`). |
| R-12 | Un destino no alcanzable **no es un error**: es una respuesta válida (200) con `alcanzable: false` y una **explicación** (el origen no tiene salidas, el destino no tiene entradas, o sus entradas vienen de puntos que el origen no alcanza). |
| R-13 | El origen no se cuenta entre sus propios destinos alcanzables, aunque un ciclo permita volver a él. Los ciclos no producen visitas repetidas. |
| R-14 | Si origen = destino, el destino está cubierto con **0 trayectos**. |
| R-15 | Consultar la cobertura **no modifica** la red. |

## 4. Criterios de aceptación

| ID    | Dado | Cuando | Entonces |
|-------|------|--------|----------|
| CA-17 | la red de ejemplo | se consulta `GET /api/cobertura/BOD-CENTRO` | **200** con los 5 alcanzables, `PR-LAGUNA` en `no_alcanzables` con su motivo, `orden_visita`, `capas` y `traza` |
| CA-18 | la red de ejemplo | se consulta `GET /api/cobertura/BOD-CENTRO/BAR-ORIENTE` | **200**, `alcanzable: true`, `camino` de evidencia `BOD-CENTRO → BAR-SUR → BAR-ORIENTE` y `saltos: 2` |
| CA-19 | la red de ejemplo | se consulta un destino sin trayectos de entrada (`PR-LAGUNA`) | **200**, `alcanzable: false` y una `explicacion` clara |
| CA-20 | existe BAR-NORTE → … → BAR-SUR pero no el regreso | se consulta BAR-SUR → BAR-NORTE | **200**, `alcanzable: false`; la explicación indica desde qué puntos se entra a BAR-NORTE |
| CA-21 | un origen sin trayectos de salida | se consulta su cobertura | **200**, 0 alcanzables y un mensaje que lo dice |
| CA-22 | una red con ciclos | se consulta la cobertura | el recorrido termina y cada punto aparece **una sola vez** en `orden_visita` |
| CA-23 | una red vacía | se consulta cualquier cobertura | **404** `red_vacia` |
| CA-24 | no existe el origen o el destino | se consulta la cobertura | **404** `punto_inexistente` indicando cuál falta |
| CA-25 | cualquier red | el origen o el destino tienen formato inválido | **400** `dato_invalido` |
| CA-26 | cualquier red | se llama `GET /api/cobertura` sin origen | **400** `formato_incorrecto` |
| CA-27 | un destino alcanzable por un camino directo caro y por otro más largo pero barato | se verifica la cobertura | el `camino` devuelto es el de **menos trayectos** y la respuesta incluye una `nota` que aclara que no es la ruta de menor costo |
| CA-28 | — | se lee la documentación | hay una traza pequeña con el orden de visita y la decisión tomada en cada paso (`modelado.md`) |
| CA-29 | el servidor está encendido | el despachador usa la sección **Cobertura de entregas** de la interfaz | ve el veredicto, los alcanzables y no alcanzables con su motivo, el camino o la explicación y la traza; los errores de la API se muestran en rojo |
| CA-30 | una red con puntos | se pide `GET /api/red/imagen/cobertura/{origen}` | **200** PNG dibujado por NetworkX a partir del resultado de **nuestro** recorrido: origen con borde, alcanzables a color, no alcanzables apagados y trayectos del recorrido resaltados; **404** si el origen no existe |
| CA-31 | se está mostrando una cobertura | el coordinador registra una conexión o vacía la red | la cobertura se recalcula sola; si el origen deja de existir, se limpia |

## 5. Contrato de la API REST

Se usan parámetros **en la ruta** (igual que `GET /api/puntos/{id}`) porque la consulta es una
lectura: `GET`, sin cuerpo, y se puede repetir sin cambiar la red.

| Método | Ruta | Éxito | Errores |
|--------|------|-------|---------|
| GET | `/api/cobertura/{origen}` | 200 cobertura completa desde el origen | 400, 404 |
| GET | `/api/cobertura/{origen}/{destino}` | 200 `alcanzable: true/false` | 400, 404 |
| GET | `/api/cobertura` | — | 400 `formato_incorrecto` (falta el origen) |
| GET | `/api/red/imagen/cobertura/{origen}` | 200 `image/png` con la cobertura resaltada | 400, 404, 503 |

### Respuesta de `GET /api/cobertura/{origen}` (resumida)

```json
{
  "origen": { "id": "BOD-CENTRO", "tipo": "bodega" },
  "algoritmo": "recorrido por capas (BFS) propio sobre la lista de adyacencia",
  "mensaje": "Desde BOD-CENTRO se pueden cubrir 5 de 6 puntos de la red.",
  "total_alcanzables": 5,
  "alcanzables": [
    { "id": "BAR-NORTE", "tipo": "barrio", "saltos": 1, "llega_desde": "BOD-CENTRO" },
    { "id": "PR-PARQUE", "tipo": "punto_recogida", "saltos": 2, "llega_desde": "BAR-NORTE" }
  ],
  "total_no_alcanzables": 1,
  "no_alcanzables": [ { "id": "PR-LAGUNA", "tipo": "punto_recogida", "motivo": "no tiene trayectos de entrada" } ],
  "capas": [["BOD-CENTRO"], ["BAR-NORTE", "BAR-SUR", "PR-ESTACION"], ["PR-PARQUE", "BAR-ORIENTE"]],
  "orden_visita": ["BOD-CENTRO", "BAR-NORTE", "BAR-SUR", "PR-ESTACION", "PR-PARQUE", "BAR-ORIENTE"],
  "traza": [
    { "paso": 1, "visita": "BOD-CENTRO", "capa": 0, "descubre": ["BAR-NORTE", "BAR-SUR", "PR-ESTACION"],
      "ya_conocidos": [], "cola": ["BAR-NORTE", "BAR-SUR", "PR-ESTACION"],
      "decision": "Se agregan a la cola BAR-NORTE, BAR-SUR, PR-ESTACION." }
  ]
}
```

### Respuesta de `GET /api/cobertura/{origen}/{destino}`

Alcanzable:

```json
{
  "origen": { "id": "BOD-CENTRO", "tipo": "bodega" },
  "destino": { "id": "BAR-ORIENTE", "tipo": "barrio" },
  "alcanzable": true,
  "mensaje": "Sí: BAR-ORIENTE es alcanzable desde BOD-CENTRO en 2 trayectos.",
  "saltos": 2,
  "camino": ["BOD-CENTRO", "BAR-SUR", "BAR-ORIENTE"],
  "nota": "El camino es la evidencia de cobertura con menos trayectos (capas del BFS). No es necesariamente el de menor costo: eso es la Feature 3.",
  "orden_visita": ["..."],
  "traza": ["..."]
}
```

No alcanzable:

```json
{
  "alcanzable": false,
  "mensaje": "No: BAR-NORTE no es alcanzable desde BAR-SUR.",
  "explicacion": "A BAR-NORTE solo llegan trayectos desde BOD-CENTRO, y ninguno de esos puntos es alcanzable desde BAR-SUR. Desde BAR-SUR solo se cubre: PR-ESTACION, BAR-ORIENTE. Recuerde que la red es dirigida: A→B no permite B→A.",
  "alcanzables_desde_origen": ["PR-ESTACION", "BAR-ORIENTE"]
}
```

### Errores nuevos

| Código HTTP | `codigo` | Cuándo |
|-------------|----------|--------|
| 404 | `red_vacia` | la red no tiene puntos: no hay nada que recorrer |
| 400 | `formato_incorrecto` | falta el origen en la ruta |

Los demás (`dato_invalido`, `punto_inexistente`, `metodo_no_permitido`) se comportan como en la Feature 1.

## 6. Fuera de alcance de la Feature 2

- **Ruta de menor costo** y costo acumulado (Feature 3). El `camino` que se devuelve solo demuestra cobertura.
- Restringir el origen a puntos de tipo `bodega`: el brief habla de bodegas, pero el despachador
  también puede preguntar desde un barrio; se informa el tipo del origen en la respuesta.
- Cerrar o abrir trayectos temporalmente (posible cambio de requisito).
