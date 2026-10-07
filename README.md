# RutaPyme — Red operativa de entregas

Microproducto para la materia **Matemáticas para la Informática Avanzada** · Equipo 7
**Integrantes:** [Nombre Miembro 1] · [Nombre Miembro 2] · [Nombre Miembro 3] · [Nombre Miembro 4]

RutaPyme coordina entregas entre una bodega, barrios y puntos de recogida. Hoy decide "a ojo" y a
veces envía pedidos por conexiones cerradas. Esta herramienta modela su red como un
**grafo dirigido y ponderado propio**, lo expone con una **API REST en Python** y lo muestra en una
**interfaz web** conectada a esa API.

| Feature | Estado | Descripción |
|---------|--------|-------------|
| 1 · Red operativa inicial | 🚧 En construcción | Registrar y consultar puntos y trayectos |
| 2 · Cobertura de entregas | ⏳ Pendiente | ¿Qué destinos alcanzo desde una bodega? |
| 3 · Ruta de menor costo | ⏳ Pendiente | Ruta más barata entre dos puntos |
| 4 · Operación demostrable | ⏳ Pendiente | Integración, cambio de requisito y demo |

---

## 1. Instalación

Requisitos: **Python 3.12 o superior** y Git.

```bash
git clone <URL-del-repositorio>
cd <nombre-del-repositorio>
python -m venv .venv
```

Activar el entorno virtual:

```bash
# Windows (PowerShell)
.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate
```

Por ahora el backend usa **solo la biblioteca estándar** de Python: no hay dependencias que instalar.

## 2. Ejecución

```bash
python main.py              # red vacía
python main.py --ejemplo    # red sintética de datos/red_ejemplo.json
```

La API queda en **http://127.0.0.1:8000**. Prueba rápida: abrir http://127.0.0.1:8000/api/salud.

Opciones: `--puerto 8080`, `--host 0.0.0.0`. También se leen las variables de entorno `PORT` y `HOST`.

## 3. Pruebas de aceptación

Con el servidor encendido, en otra terminal:

```bash
python pruebas/aceptacion_feature1.py
```

El script usa solo `urllib`, vacía la red al empezar (se puede repetir) y ejecuta **32 escenarios**:
red vacía, flujo normal, dirección y ciclos, puntos inexistentes, datos inválidos, errores de la API
y datos de ejemplo. Por cada uno imprime *esperado*, *obtenido* y **PASÓ/FALLÓ**.
Última salida: [`pruebas/salidas/aceptacion_feature1.txt`](pruebas/salidas/aceptacion_feature1.txt) → **32/32 aprobados**.

## 4. Endpoints de la API REST

| Método | Ruta | Cuerpo | Respuesta |
|--------|------|--------|-----------|
| GET | `/api/salud` | — | 200 estado del servicio |
| GET | `/api/tipos` | — | 200 tipos de punto permitidos |
| GET | `/api/puntos` | — | 200 `{total, puntos}` |
| POST | `/api/puntos` | `{"id": "BOD-CENTRO", "tipo": "bodega"}` | 201 · 400 · 409 |
| GET | `/api/puntos/{id}` | — | 200 `{punto, salidas}` · 404 |
| GET | `/api/conexiones` | — | 200 `{total, conexiones}` |
| POST | `/api/conexiones` | `{"origen": "BOD-CENTRO", "destino": "BAR-NORTE", "costo": 12}` | 201 · 400 · 404 · 409 |
| GET | `/api/red` | — | 200 representación legible (lista de adyacencia + texto) |
| POST | `/api/red/ejemplo` | — | 201 carga la red sintética |
| DELETE | `/api/red` | — | 200 vacía la red |

Todos los errores tienen la misma forma:

```json
{ "error": { "codigo": "conexion_duplicada", "mensaje": "La conexión BOD-CENTRO → BAR-NORTE ya existe (costo 12)..." } }
```

| HTTP | `codigo` | Cuándo |
|------|----------|--------|
| 400 | `formato_incorrecto` | JSON inválido, cuerpo que no es objeto, campo faltante |
| 400 | `dato_invalido` | id, tipo o costo inválido; lazo A→A |
| 404 | `punto_inexistente` · `ruta_no_encontrada` | punto no registrado · endpoint que no existe |
| 405 | `metodo_no_permitido` | método incorrecto para la ruta |
| 409 | `punto_duplicado` · `conexion_duplicada` | el elemento ya existe |

Ejemplo rápido desde PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/puntos -ContentType "application/json" -Body '{"id":"BOD-CENTRO","tipo":"bodega"}'
```

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [Especificación F1](docs/feature-1/especificacion.md) | Historias, reglas, criterios de aceptación y contrato de la API |
| [Modelado F1](docs/feature-1/modelado.md) | Dirección, peso, estructura, complejidad y traza manual |
| [Plan F1](docs/feature-1/plan.md) | Local vs despliegue, arquitectura, tareas y flujo en GitHub |
| [Bitácora de IA F1](docs/ia/bitacora-feature-1.md) | Propuestas de la IA, decisión y verificación |

## Flujo de trabajo en GitHub

Ramas por feature o tarea, Pull Requests con plantilla y revisión cruzada. Detalle en [`CONTRIBUTING.md`](CONTRIBUTING.md).
