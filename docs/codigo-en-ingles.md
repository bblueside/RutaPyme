# Código en inglés · Glosario de nombres

Desde este cambio, el **código** del backend (nombres de archivos, clases, funciones, variables,
comentarios y docstrings) está en **inglés**. Lo que **no** cambió, a propósito:

| Se mantiene en español | Por qué |
|------------------------|---------|
| Rutas de la API (`/api/puntos`, `/api/cobertura/...`, `/api/ruta/...`) | Es el contrato que consume el frontend (`frontend/src/services/`) |
| Campos JSON (`origen`, `destino`, `costo`, `alcanzable`, `camino`, `existe_ruta`...) | Mismo contrato: cambiarlos rompería el panel |
| Códigos de error (`punto_inexistente`, `dato_invalido`...) | El frontend y los scripts de aceptación los comparan |
| Mensajes para el usuario y textos de la imagen | El cliente (coordinador y despachador) habla español |
| Carpetas `pruebas/`, `datos/`, `docs/` y opciones `--ejemplo`, `--puerto` de `main.py` | Están referenciadas en README, guías y configuración de despliegue |
| Documentación (`docs/`) | Es para el equipo y el docente |

Los documentos de las Features 1 a 3 se escribieron antes de la traducción y citan los nombres en
español. Esta tabla permite encontrarlos en el código actual.

## Archivos

| Antes | Ahora |
|-------|-------|
| `backend/red.py` | `backend/network.py` |
| `backend/visualizacion.py` | `backend/visualization.py` |
| `backend/api.py` | `backend/api.py` (sin cambio de nombre) |

## `backend/network.py`

| Antes | Ahora |
|-------|-------|
| `RedOperativa` | `OperationalNetwork` |
| `ErrorRed` · `codigo` · `mensaje` | `NetworkError` · `code` · `message` |
| `FormatoIncorrecto` · `DatoInvalido` | `BadFormat` · `InvalidData` |
| `PuntoInexistente` · `PuntoDuplicado` | `PointNotFound` · `DuplicatePoint` |
| `ConexionDuplicada` · `RedVacia` | `DuplicateConnection` · `EmptyNetwork` |
| `TIPOS_PUNTO` · `PATRON_ID` | `POINT_TYPES` · `ID_PATTERN` |
| `normalizar_id` · `validar_tipo` · `validar_costo` | `normalize_id` · `validate_type` · `validate_cost` |
| `_tipos` · `_adyacencia` | `_types` · `_adjacency` |
| `agregar_punto` · `obtener_punto` · `listar_puntos` · `vecinos` | `add_point` · `get_point` · `list_points` · `neighbors` |
| `agregar_conexion` · `listar_conexiones` | `add_connection` · `list_connections` |
| `cantidad_puntos` · `cantidad_conexiones` | `point_count` · `connection_count` |
| `vaciar` · `cargar` · `representacion` | `clear` · `load` · `representation` |
| `cobertura` · `verificar_cobertura` | `coverage` · `check_coverage` |
| `_recorrer_por_capas` (BFS) | `_breadth_first_traversal` |
| `capa` · `llega_desde` · `orden_visita` · `cola` | `layer` · `came_from` · `visit_order` · `queue` |
| `_decision_de_paso` · `_reconstruir_camino` | `_step_decision` · `_rebuild_path` |
| `_puntos_con_entrada` · `_explicar_no_alcanzable` | `_points_with_incoming` · `_explain_unreachable` |
| `ruta_menor_costo` | `cheapest_route` |
| `_buscar_menor_costo` (Dijkstra) | `_dijkstra` |
| `costo_acumulado` · `definitivos` · `orden_definitivos` · `monticulo` | `accumulated_cost` · `settled` · `settled_order` · `heap` |
| `_decision_de_relajacion` · `_tramos_del_camino` | `_relaxation_decision` · `_path_legs` |
| `_comparar_con_menos_saltos` | `_compare_with_fewest_hops` |
| `_exigir_punto` · `_exigir_red_con_puntos` · `_exigir_costos_positivos` | `_require_point` · `_require_non_empty` · `_require_positive_costs` |

## `backend/api.py`

| Antes | Ahora |
|-------|-------|
| `ManejadorRutaPyme` | `RutaPymeHandler` |
| `RUTAS` · `ARCHIVOS_ESTATICOS` · `ESTADO_HTTP_POR_ERROR` | `ROUTES` · `STATIC_FILES` · `HTTP_STATUS_BY_ERROR` |
| `crear_servidor` · `cargar_red_ejemplo` · `_coincidir` | `create_server` · `load_sample_network` · `_match` |
| `servidor.red` · `servidor.candado` | `server.network` · `server.lock` |
| `_atender` · `_ejecutar` · `_leer_json` | `_dispatch` · `_run` · `_read_json` |
| `_enviar` · `_enviar_json` · `_enviar_error` | `_send` · `_send_json` · `_send_error` |
| `consultar_cobertura` · `verificar_cobertura` · `consultar_ruta` | `get_coverage` · `check_coverage` · `get_route` |
| `ver_imagen` · `ver_imagen_cobertura` · `ver_imagen_ruta` | `show_image` · `show_coverage_image` · `show_route_image` |

## `backend/visualization.py`

| Antes | Ahora |
|-------|-------|
| `dibujar_red` · `_dibujar_grafo` · `_resaltado` | `draw_network` · `_draw_graph` · `_highlight` |
| `DISPONIBLE` | `AVAILABLE` |
| `COLORES_TIPO` · `COLOR_RECORRIDO` · `COLOR_RUTA` · `COLOR_APAGADO` | `TYPE_COLORS` · `TRAVERSAL_COLOR` · `ROUTE_COLOR` · `DIMMED_COLOR` |

## Scripts de aceptación (`pruebas/`)

Los nombres de archivo no cambian. Dentro: `llamar` → `call`, `verificar` → `check`,
`esperar_error` → `expect_error`, `resultados` → `results`. La salida en consola es la misma
(escenarios, *Esperado*, *Obtenido*, PASÓ/FALLÓ).
