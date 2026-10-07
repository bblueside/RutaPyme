# Feature 1 — Red operativa inicial · Especificación

> Documento de entrada del desarrollo orientado a especificaciones (SDD).
> Primero se acuerda **qué** debe hacer el sistema; después se escribe el código.

## 1. Valor de negocio

El **coordinador logístico** de RutaPyme puede registrar y consultar los puntos de su red
(bodegas, barrios y puntos de recogida) y los trayectos disponibles entre ellos, con su costo.
Esta red es la base que usarán el cálculo de cobertura (Feature 2) y de ruta (Feature 3).

## 2. Historias de usuario

| ID    | Como...                 | Quiero...                                              | Para...                                          |
|-------|-------------------------|--------------------------------------------------------|--------------------------------------------------|
| HU-01 | coordinador logístico   | registrar un punto con identificador único y tipo      | tener todos mis lugares de operación en el sistema |
| HU-02 | coordinador logístico   | registrar un trayecto de un punto a otro con su costo  | saber por dónde puedo mover pedidos y cuánto cuesta |
| HU-03 | coordinador logístico   | que el sistema rechace datos incorrectos               | no enviar pedidos por conexiones que no existen  |
| HU-04 | coordinador / despachador | ver la red de forma legible (lista y dibujo)         | entender rápidamente qué puntos están conectados |

## 3. Reglas del dominio

| Regla | Descripción |
|-------|-------------|
| R-01 | El **identificador** de un punto tiene de 1 a 30 caracteres: letras sin tilde, números, `-` o `_`. Se ignoran los espacios al inicio y al final y se guarda en **MAYÚSCULAS** (`bod-centro` y `BOD-CENTRO` son el mismo punto). |
| R-02 | El **tipo** de punto es uno de: `bodega`, `barrio`, `punto_recogida`. |
| R-03 | Una **conexión** va de un `origen` a un `destino` (es **dirigida**). Registrar A→B **no** crea B→A. |
| R-04 | El origen y el destino deben ser puntos **ya registrados** y **distintos** entre sí. |
| R-05 | El **costo** es un número (entero o decimal) **mayor que 0**. Representa el **tiempo estimado en minutos** del trayecto. No se aceptan textos, booleanos, cero ni negativos. |
| R-06 | No puede haber dos conexiones con el mismo par `origen → destino`. B→A sí se permite aunque ya exista A→B (puede tener otro costo). |
| R-07 | Los ciclos (A→B→C→A) son válidos: en una red de calles es normal poder volver. |
| R-08 | La red vive en memoria mientras el servidor está encendido. Se puede cargar una red de ejemplo sintética o vaciarla. |

## 4. Criterios de aceptación

Formato: **Dado** (situación) · **Cuando** (acción) · **Entonces** (resultado esperado).

| ID    | Dado | Cuando | Entonces |
|-------|------|--------|----------|
| CA-01 | una red vacía | se registra el punto `BOD-CENTRO` tipo `bodega` | responde **201** con el punto creado |
| CA-02 | puntos registrados | se listan los puntos | responde **200** con todos los puntos en orden de registro y su total |
| CA-03 | existe `BOD-CENTRO` | se registra `bod-centro` otra vez | responde **409** `punto_duplicado` |
| CA-04 | cualquier red | se registra un punto con id vacío, con espacios internos o con tipo `hospital` | responde **400** `dato_invalido` con un mensaje claro |
| CA-05 | existen A y B | se registra A→B con costo 12 | responde **201** con la conexión creada |
| CA-06 | existe A→B | se consulta la red | A tiene a B como salida, pero B **no** tiene a A; luego B→A con costo 15 se acepta (**201**) |
| CA-07 | no existe el punto `X` | se registra A→X o X→A | responde **404** `punto_inexistente` indicando cuál punto falta |
| CA-08 | existe A→B | se registra A→B otra vez (aunque con otro costo) | responde **409** `conexion_duplicada` |
| CA-09 | existen A y B | se registra A→B con costo `0`, `-5`, `"diez"`, `true` o sin costo | responde **400** (`dato_invalido` o `formato_incorrecto`) |
| CA-10 | existe A | se registra A→A | responde **400** `dato_invalido` (un trayecto une dos puntos distintos) |
| CA-11 | cualquier red | se envía un cuerpo que no es JSON válido o no es un objeto | responde **400** `formato_incorrecto` |
| CA-12 | una red (vacía o no) | se consulta `GET /api/red` | responde **200** con: dirección, significado del peso, estructura, resumen, lista de adyacencia y una versión en texto legible |
| CA-13 | existe A | se consulta `GET /api/puntos/A` | responde **200** con el punto y sus salidas; si no existe, **404** `punto_inexistente`; si el id tiene formato inválido, **400** `dato_invalido` |
| CA-14 | el servidor está encendido | el coordinador usa la interfaz web | puede registrar puntos y conexiones, ver tablas, la lista de adyacencia y los mensajes de error de la API |
| CA-15 | una red con puntos | se pide `GET /api/red/imagen` | responde **200** con una imagen PNG dibujada por NetworkX a partir de **nuestra** red |
| CA-16 | — | se lee la documentación | explica por qué la red es dirigida, qué representa el peso y cuál es la representación principal |

## 5. Contrato de la API REST

Base: `http://127.0.0.1:8000`. Todas las respuestas son JSON (`UTF-8`), excepto la imagen.

| Método | Ruta | Cuerpo | Éxito | Errores |
|--------|------|--------|-------|---------|
| GET    | `/api/salud` | — | 200 `{estado}` | — |
| GET    | `/api/tipos` | — | 200 `{tipos}` | — |
| GET    | `/api/puntos` | — | 200 `{total, puntos}` | — |
| POST   | `/api/puntos` | `{id, tipo}` | 201 `{mensaje, punto}` | 400, 409 |
| GET    | `/api/puntos/{id}` | — | 200 `{punto, salidas}` | 400 (id con formato inválido), 404 |
| GET    | `/api/conexiones` | — | 200 `{total, conexiones}` | — |
| POST   | `/api/conexiones` | `{origen, destino, costo}` | 201 `{mensaje, conexion}` | 400, 404, 409 |
| GET    | `/api/red` | — | 200 representación legible | — |
| GET    | `/api/red/imagen` | — | 200 `image/png` | 503 si NetworkX no está instalado |
| POST   | `/api/red/ejemplo` | — | 201 carga la red sintética de `datos/red_ejemplo.json` | — |
| DELETE | `/api/red` | — | 200 red vaciada | — |

### Formato de error (igual en todos los endpoints)

```json
{ "error": { "codigo": "punto_inexistente", "mensaje": "El punto de destino 'X' no existe. Regístrelo primero." } }
```

| Código HTTP | `codigo` | Cuándo |
|-------------|----------|--------|
| 400 | `formato_incorrecto` | JSON inválido, cuerpo que no es objeto o campo obligatorio ausente |
| 400 | `dato_invalido` | identificador, tipo o costo que no cumplen las reglas (incluye números enormes); lazo A→A |
| 404 | `punto_inexistente` | se usa un punto que no está registrado |
| 404 | `ruta_no_encontrada` | el endpoint no existe |
| 405 | `metodo_no_permitido` | el endpoint existe pero no con ese método |
| 409 | `punto_duplicado` / `conexion_duplicada` | el elemento ya estaba registrado |

## 6. Fuera de alcance de la Feature 1

- Editar o eliminar un punto o una conexión individual (el brief no lo pide).
- Base de datos o persistencia en disco (la red vive en memoria, R-08).
- Recorridos de cobertura (Feature 2) y rutas de menor costo (Feature 3).
- Mapas reales, GPS, vehículos, tráfico o autenticación (excluidos por el cliente).
