"""Core of the RutaPyme operational network.

The network is a DIRECTED, WEIGHTED graph stored as an ADJACENCY LIST:
each point keeps a dictionary with its outgoing trips {destination: cost}.

This module knows nothing about HTTP: it only stores the network and applies the domain rules
described in docs/feature-1/especificacion.md (rules R-01 to R-07).
Delivery coverage (Feature 2) is our own breadth-first traversal (BFS), described in
docs/feature-2/especificacion.md (rules R-09 to R-14).
The cheapest route (Feature 3) is our own Dijkstra algorithm with a priority queue
(heapq), described in docs/feature-3/especificacion.md (rules R-16 to R-23).
The monetary cost of a route in Colombian pesos is its minutes times one fixed rate,
COST_PER_MINUTE_COP (rules R-24 to R-27 of the same document).

Identifiers and comments are in English; the API contract (JSON fields, error codes) and the
messages shown to the user stay in Spanish because the frontend and the client depend on them.
"""

import heapq
import math
import re
from collections import deque
from decimal import ROUND_HALF_UP, Decimal

POINT_TYPES = ("bodega", "barrio", "punto_recogida")
ID_PATTERN = re.compile(r"[A-Za-z0-9_-]{1,30}")

# R-24: the single monetary variable of the backend. Colombian pesos (COP) charged per minute of route.
COST_PER_MINUTE_COP = 200
CURRENCY = "COP"


# ---------------------------------------------------------------------------
# Business errors. `code` is the identifier the API returns to the client.
# ---------------------------------------------------------------------------

class NetworkError(Exception):
    code = "error_red"

    def __init__(self, message):
        super().__init__(message)
        self.message = message


class BadFormat(NetworkError):
    code = "formato_incorrecto"


class InvalidData(NetworkError):
    code = "dato_invalido"


class PointNotFound(NetworkError):
    code = "punto_inexistente"


class DuplicatePoint(NetworkError):
    code = "punto_duplicado"


class DuplicateConnection(NetworkError):
    code = "conexion_duplicada"


class EmptyNetwork(NetworkError):
    code = "red_vacia"


# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------

def normalize_id(value, field="id"):
    """R-01: text of 1 to 30 characters [A-Za-z0-9_-], stored in uppercase."""
    if value is None:
        raise BadFormat(f"Falta el campo '{field}'.")
    if not isinstance(value, str):
        raise InvalidData(f"El campo '{field}' debe ser texto.")
    identifier = value.strip()
    if not ID_PATTERN.fullmatch(identifier):
        raise InvalidData(
            f"El campo '{field}' debe tener de 1 a 30 caracteres: letras sin tilde, "
            "números, '-' o '_', sin espacios. Ejemplo: BOD-CENTRO."
        )
    return identifier.upper()


def validate_type(value):
    """R-02: the type must be one of POINT_TYPES."""
    if value is None:
        raise BadFormat("Falta el campo 'tipo'.")
    point_type = value.strip().lower() if isinstance(value, str) else value
    if point_type not in POINT_TYPES:
        raise InvalidData(f"El tipo {value!r} no es válido. Use uno de: {', '.join(POINT_TYPES)}.")
    return point_type


def validate_cost(value):
    """R-05: finite number greater than 0 (estimated time in minutes)."""
    if value is None:
        raise BadFormat("Falta el campo 'costo'.")
    # bool is a subclass of int in Python, so it is rejected explicitly.
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise InvalidData(f"El costo debe ser un número (por ejemplo 12 o 7.5), no {value!r}.")
    if not math.isfinite(value) or value <= 0:
        raise InvalidData(f"El costo debe ser un número mayor que 0 (minutos). Se recibió {value}.")
    return value


def validate_cost_per_minute(value):
    """R-26: the rate must be an integer greater than 0 (bool does not count).

    It is a constant of the code, not user input, so a bad value is a configuration error:
    it raises ValueError (not a NetworkError / HTTP 400) and the server does not start.
    """
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise ValueError(
            "COST_PER_MINUTE_COP debe ser un entero mayor que 0 (pesos colombianos por minuto). "
            f"Se encontró {value!r}."
        )
    return value


validate_cost_per_minute(COST_PER_MINUTE_COP)  # R-26: checked when the module is imported


def minutes_to_cop(minutes):
    """R-24 and R-25: whole pesos for `minutes`, rounded half up. O(1).

    Decimal(str(minutes)) keeps the decimal value the user wrote; Decimal(float) would copy the
    binary error (2.0025 is stored as 2.00249999...) and round 400.5 pesos down to 400.
    """
    pesos = Decimal(str(minutes)) * COST_PER_MINUTE_COP
    return int(pesos.quantize(Decimal(1), rounding=ROUND_HALF_UP))


def format_cop(pesos):
    """Pesos as shown in messages: thousands separated by a dot, e.g. 3600 -> '$3.600 COP'."""
    return f"${pesos:,}".replace(",", ".") + f" {CURRENCY}"


# ---------------------------------------------------------------------------
# Graph
# ---------------------------------------------------------------------------

class OperationalNetwork:
    """Directed, weighted graph of points (nodes) and trips (edges)."""

    def __init__(self):
        self._types = {}        # point id -> type
        self._adjacency = {}    # point id -> {destination id: cost}

    # --- Points -----------------------------------------------------------

    def add_point(self, identifier, point_type):
        """Registers a new point. O(1) on average."""
        identifier = normalize_id(identifier, "id")
        point_type = validate_type(point_type)
        if identifier in self._types:
            raise DuplicatePoint(f"El punto '{identifier}' ya está registrado.")
        self._types[identifier] = point_type
        self._adjacency[identifier] = {}
        return {"id": identifier, "tipo": point_type}

    def get_point(self, identifier):
        identifier = normalize_id(identifier, "id")
        self._require_point(identifier, "El punto")
        return {"id": identifier, "tipo": self._types[identifier]}

    def list_points(self):
        """Points in registration order. O(V)."""
        return [{"id": point, "tipo": point_type} for point, point_type in self._types.items()]

    def neighbors(self, identifier):
        """Outgoing trips of a point {destination: cost}. This is the main operation: O(degree of the point)."""
        identifier = normalize_id(identifier, "id")
        self._require_point(identifier, "El punto")
        return dict(self._adjacency[identifier])

    # --- Connections ------------------------------------------------------

    def add_connection(self, origin, destination, cost):
        """Registers the directed trip origin -> destination. O(1) on average."""
        cost = validate_cost(cost)
        origin = normalize_id(origin, "origen")
        destination = normalize_id(destination, "destino")
        self._require_point(origin, "El punto de origen")
        self._require_point(destination, "El punto de destino")
        if origin == destination:
            raise InvalidData(f"Un trayecto debe unir dos puntos distintos ('{origin}' → '{origin}' no es válido).")
        if destination in self._adjacency[origin]:
            current_cost = self._adjacency[origin][destination]
            raise DuplicateConnection(
                f"La conexión {origin} → {destination} ya existe (costo {current_cost:g}). "
                "Recuerde que el sentido contrario es otra conexión."
            )
        self._adjacency[origin][destination] = cost
        return {"origen": origin, "destino": destination, "costo": cost}

    def list_connections(self):
        """All connections. O(V + E)."""
        return [
            {"origen": origin, "destino": destination, "costo": cost}
            for origin, outgoing in self._adjacency.items()
            for destination, cost in outgoing.items()
        ]

    # --- Whole network ----------------------------------------------------

    def point_count(self):
        return len(self._types)

    def connection_count(self):
        return sum(len(outgoing) for outgoing in self._adjacency.values())

    def clear(self):
        self._types = {}
        self._adjacency = {}

    def load(self, data):
        """Replaces the network with the one in `data` ({puntos, conexiones}).

        A new network is built first: if any value is invalid the error is raised
        and the current network stays untouched.
        """
        new_network = OperationalNetwork()
        for point in data.get("puntos", []):
            new_network.add_point(point.get("id"), point.get("tipo"))
        for connection in data.get("conexiones", []):
            new_network.add_connection(connection.get("origen"), connection.get("destino"), connection.get("costo"))
        self._types = new_network._types
        self._adjacency = new_network._adjacency

    def representation(self):
        """Readable view of the network for the API (CA-12). O(V + E)."""
        by_type = {point_type: 0 for point_type in POINT_TYPES}
        for point_type in self._types.values():
            by_type[point_type] += 1

        adjacency_list = {}
        text = []
        for point, outgoing in self._adjacency.items():
            adjacency_list[point] = [{"destino": destination, "costo": cost} for destination, cost in outgoing.items()]
            if outgoing:
                detail = ", ".join(f"{destination} ({cost:g} min)" for destination, cost in outgoing.items())
            else:
                detail = "(sin salidas)"
            text.append(f"{point} [{self._types[point]}] → {detail}")

        return {
            "dirigida": True,
            "ponderada": True,
            "peso": "costo = tiempo estimado del trayecto en minutos (siempre mayor que 0)",
            "estructura": "lista de adyacencia: cada punto guarda sus salidas {destino: costo}",
            "resumen": {
                "puntos": self.point_count(),
                "conexiones": self.connection_count(),
                "por_tipo": by_type,
            },
            "lista_adyacencia": adjacency_list,
            "texto": text,
        }

    # --- Delivery coverage (Feature 2) ------------------------------------

    def coverage(self, origin):
        """R-09 to R-13: points reachable from `origin` following the direction of the trips."""
        origin = normalize_id(origin, "origen")
        self._require_non_empty()
        self._require_point(origin, "El punto de origen")

        traversal = self._breadth_first_traversal(origin)
        layer = traversal["layer"]
        with_incoming = self._points_with_incoming()

        reachable = [
            {"id": point, "tipo": self._types[point], "saltos": layer[point],
             "llega_desde": traversal["came_from"][point]}
            for point in traversal["visit_order"][1:]
        ]
        unreachable = [
            {"id": point, "tipo": point_type,
             "motivo": ("no tiene trayectos de entrada" if point not in with_incoming
                        else f"sus trayectos de entrada vienen de puntos que {origin} no alcanza")}
            for point, point_type in self._types.items() if point not in layer
        ]

        if not self._adjacency[origin]:
            message = f"{origin} no tiene trayectos de salida registrados: no puede cubrir ningún otro punto."
        else:
            message = (f"Desde {origin} se pueden cubrir {len(reachable)} de "
                       f"{self.point_count() - 1} puntos de la red.")

        return {
            "origen": {"id": origin, "tipo": self._types[origin]},
            "algoritmo": "recorrido por capas (BFS) propio sobre la lista de adyacencia",
            "mensaje": message,
            "total_alcanzables": len(reachable),
            "alcanzables": reachable,
            "total_no_alcanzables": len(unreachable),
            "no_alcanzables": unreachable,
            "capas": traversal["layers"],
            "orden_visita": traversal["visit_order"],
            "traza": traversal["trace"],
        }

    def check_coverage(self, origin, destination):
        """R-09 to R-14: can `destination` be reached from `origin`? If not, explains why."""
        origin = normalize_id(origin, "origen")
        destination = normalize_id(destination, "destino")
        self._require_non_empty()
        self._require_point(origin, "El punto de origen")
        self._require_point(destination, "El punto de destino")

        traversal = self._breadth_first_traversal(origin)
        response = {
            "origen": {"id": origin, "tipo": self._types[origin]},
            "destino": {"id": destination, "tipo": self._types[destination]},
            "algoritmo": "recorrido por capas (BFS) propio sobre la lista de adyacencia",
        }

        if destination in traversal["layer"]:
            path = self._rebuild_path(traversal["came_from"], destination)
            hops = len(path) - 1
            if hops == 0:
                message = f"{destination} es el mismo punto de origen: está cubierto sin hacer ningún trayecto."
            else:
                message = (f"Sí: {destination} es alcanzable desde {origin} en {hops} "
                           f"{'trayecto' if hops == 1 else 'trayectos'}.")
            response.update({
                "alcanzable": True,
                "mensaje": message,
                "saltos": hops,
                "camino": path,
                "nota": ("El camino es la evidencia de cobertura con menos trayectos (capas del BFS). "
                         "No es necesariamente el de menor costo: eso es la Feature 3."),
            })
        else:
            response.update({
                "alcanzable": False,
                "mensaje": f"No: {destination} no es alcanzable desde {origin}.",
                "explicacion": self._explain_unreachable(origin, destination, traversal["visit_order"]),
                "alcanzables_desde_origen": traversal["visit_order"][1:],
            })

        response.update({
            "orden_visita": traversal["visit_order"],
            "traza": traversal["trace"],
        })
        return response

    def _breadth_first_traversal(self, origin):
        """Our own breadth-first traversal (BFS). O(V + E) time and O(V) extra memory.

        A point is marked as known when it is DISCOVERED (pushed to the queue), not when visited:
        this way it never enters the queue twice and cycles (A→B→A) do not loop forever.
        Neighbors are checked in the order their connections were registered.
        """
        layer = {origin: 0}           # point -> number of trips from the origin
        came_from = {origin: None}    # point -> point it was discovered from (to rebuild the path)
        queue = deque([origin])
        visit_order = []
        layers = []
        trace = []

        while queue:
            current = queue.popleft()
            visit_order.append(current)
            if layer[current] == len(layers):
                layers.append([])
            layers[layer[current]].append(current)

            discovered, already_known = [], []
            for neighbor in self._adjacency[current]:   # O(degree(current)) thanks to the adjacency list
                if neighbor in layer:
                    already_known.append(neighbor)
                else:
                    layer[neighbor] = layer[current] + 1
                    came_from[neighbor] = current
                    queue.append(neighbor)
                    discovered.append(neighbor)

            trace.append({
                "paso": len(trace) + 1,
                "visita": current,
                "capa": layer[current],
                "descubre": discovered,
                "ya_conocidos": already_known,
                "cola": list(queue),
                "decision": self._step_decision(current, discovered, already_known),
            })

        return {"layer": layer, "came_from": came_from, "visit_order": visit_order,
                "layers": layers, "trace": trace}

    @staticmethod
    def _step_decision(current, discovered, already_known):
        if not discovered and not already_known:
            return f"{current} no tiene salidas: no agrega puntos a la cola."
        parts = []
        if discovered:
            parts.append(f"se agregan a la cola {', '.join(discovered)}")
        if already_known:
            parts.append(f"se ignoran {', '.join(already_known)} (ya conocidos)")
        text = "; ".join(parts)
        return text[0].upper() + text[1:] + "."

    @staticmethod
    def _rebuild_path(came_from, destination):
        """Follows the predecessors from the destination back to the origin. O(path length)."""
        path = []
        point = destination
        while point is not None:
            path.append(point)
            point = came_from[point]
        path.reverse()
        return path

    def _points_with_incoming(self):
        """Points reached by at least one trip. O(V + E)."""
        return {destination for outgoing in self._adjacency.values() for destination in outgoing}

    def _explain_unreachable(self, origin, destination, reached):
        """Readable explanation of why the destination cannot be covered (R-12). O(V + E)."""
        if not self._adjacency[origin]:
            return f"{origin} no tiene trayectos de salida registrados, así que no puede llegar a ningún punto."
        entries = [point for point, outgoing in self._adjacency.items() if destination in outgoing]
        if not entries:
            return (f"Ningún trayecto llega a {destination} (no tiene conexiones de entrada): "
                    "no se puede alcanzar desde ningún punto de la red.")
        covered = ", ".join(reached[1:]) or "ningún otro punto"
        return (f"A {destination} solo llegan trayectos desde {', '.join(entries)}, y ninguno de esos puntos "
                f"es alcanzable desde {origin}. Desde {origin} solo se cubre: {covered}. "
                "Recuerde que la red es dirigida: A→B no permite B→A.")

    # --- Cheapest route (Feature 3) ---------------------------------------

    def cheapest_route(self, origin, destination):
        """R-16 to R-23: lowest total cost route from `origin` to `destination` compared with the fewest-hops one."""
        origin = normalize_id(origin, "origen")
        destination = normalize_id(destination, "destino")
        self._require_non_empty()
        self._require_point(origin, "El punto de origen")
        self._require_point(destination, "El punto de destino")
        self._require_positive_costs()

        search = self._dijkstra(origin, destination)
        response = {
            "origen": {"id": origin, "tipo": self._types[origin]},
            "destino": {"id": destination, "tipo": self._types[destination]},
            "algoritmo": "Dijkstra propio con cola de prioridad (heapq) sobre la lista de adyacencia",
        }

        if destination in search["accumulated_cost"]:
            path = self._rebuild_path(search["came_from"], destination)
            total_cost = search["accumulated_cost"][destination]
            hops = len(path) - 1
            total_pesos = minutes_to_cop(total_cost)
            if hops == 0:
                message = (f"{destination} es el mismo punto de origen: costo 0 min ({format_cop(total_pesos)}), "
                           "sin hacer ningún trayecto.")
            else:
                message = (f"La ruta de menor costo de {origin} a {destination} cuesta {total_cost:g} min "
                           f"({format_cop(total_pesos)}) en {hops} {'trayecto' if hops == 1 else 'trayectos'}.")
            response.update({
                "existe_ruta": True,
                "mensaje": message,
                "camino": path,
                "costo_total": total_cost,
                "saltos": hops,
                "costo_monetario": {"moneda": CURRENCY, "tarifa_por_minuto": COST_PER_MINUTE_COP,
                                    "total": total_pesos},
                "tramos": self._path_legs(path),
                "comparacion_menos_saltos": self._compare_with_fewest_hops(origin, destination, path, total_cost),
            })
        else:
            response.update({
                "existe_ruta": False,
                "mensaje": f"No existe ruta de {origin} a {destination}.",
                "explicacion": self._explain_unreachable(origin, destination, search["settled_order"]),
            })

        response.update({
            "orden_definitivos": search["settled_order"],
            "costos_definitivos": search["accumulated_cost"],
            "traza": search["trace"],
        })
        return response

    def _dijkstra(self, origin, destination):
        """Our own Dijkstra algorithm. O((V + E) log V) time and O(V + E) extra memory.

        accumulated_cost[p] is the lowest known cost to reach p from the origin.
        came_from[p] is the previous point on that path: it is the value kept to
        rebuild the route (predecessor).
        A point becomes SETTLED when it leaves the heap: since every cost is greater
        than 0, no path through pending points can make it cheaper later.
        When a cost improves, the old heap entry is not removed; it is skipped when it
        comes out because the point is already settled (lazy deletion).
        """
        accumulated_cost = {origin: 0}
        came_from = {origin: None}
        settled = set()
        settled_order = []
        # (accumulated cost, arrival order, point). The arrival order breaks cost ties
        # reproducibly, just as the BFS follows the registration order.
        heap = [(0, 0, origin)]
        arrivals = 1
        trace = []

        while heap:
            cost, _, current = heapq.heappop(heap)   # O(log V)
            if current in settled:
                continue  # stale entry: a cheaper cost was already found for this point
            settled.add(current)
            settled_order.append(current)

            improved, discarded = [], []
            if current != destination:
                for neighbor, trip_cost in self._adjacency[current].items():  # O(degree(current))
                    if neighbor in settled:
                        discarded.append({"punto": neighbor, "motivo": "ya es definitivo"})
                        continue
                    new_cost = cost + trip_cost
                    previous = accumulated_cost.get(neighbor)
                    if previous is None or new_cost < previous:   # relaxation of the trip current → neighbor
                        accumulated_cost[neighbor] = new_cost
                        came_from[neighbor] = current
                        heapq.heappush(heap, (new_cost, arrivals, neighbor))
                        arrivals += 1
                        improved.append({"punto": neighbor, "antes": previous, "ahora": new_cost})
                    else:
                        discarded.append({"punto": neighbor,
                                          "motivo": f"{cost:g} + {trip_cost:g} = {new_cost:g} no mejora {previous:g}"})

            trace.append({
                "paso": len(trace) + 1,
                "definitivo": current,
                "costo": cost,
                "mejora": improved,
                "descarta": discarded,
                "pendientes": [{"punto": point, "costo": pending_cost}
                               for pending_cost, _, point in sorted(heap)
                               if point not in settled and accumulated_cost[point] == pending_cost],
                "decision": self._relaxation_decision(current, cost, destination, improved, discarded),
            })
            if current == destination:
                break

        # Only settled costs are safe answers; tentative costs stay internal.
        return {"accumulated_cost": {point: accumulated_cost[point] for point in settled_order},
                "came_from": came_from, "settled_order": settled_order, "trace": trace}

    @staticmethod
    def _relaxation_decision(current, cost, destination, improved, discarded):
        if current == destination:
            return f"{current} es el destino y su costo ({cost:g} min) ya es definitivo: fin de la búsqueda."
        if not improved and not discarded:
            return f"{current} queda definitivo con {cost:g} min; no tiene salidas: no mejora ningún costo."
        parts = []
        if improved:
            changes = ", ".join(
                f"{item['punto']} ({'∞' if item['antes'] is None else format(item['antes'], 'g')} → {item['ahora']:g})"
                for item in improved)
            parts.append(f"mejora {changes}")
        if discarded:
            parts.append(f"no cambia {', '.join(item['punto'] for item in discarded)}")
        return f"{current} queda definitivo con {cost:g} min; " + "; ".join(parts) + "."

    def _path_legs(self, path):
        """Each trip of the path with its cost and the accumulated cost up to that point. O(path length)."""
        legs = []
        accumulated = 0
        for origin, destination in zip(path, path[1:]):
            cost = self._adjacency[origin][destination]
            accumulated += cost
            legs.append({"origen": origin, "destino": destination, "costo": cost, "acumulado": accumulated,
                         "costo_cop": minutes_to_cop(cost), "acumulado_cop": minutes_to_cop(accumulated)})
        return legs

    def _compare_with_fewest_hops(self, origin, destination, path, total_cost):
        """R-22: compares the cheapest route with the fewest-trips path (Feature 2 BFS). O(V + E)."""
        bfs_path = self._rebuild_path(self._breadth_first_traversal(origin)["came_from"], destination)
        bfs_legs = self._path_legs(bfs_path)
        bfs_cost = bfs_legs[-1]["acumulado"] if bfs_legs else 0
        bfs_hops = len(bfs_path) - 1
        difference = bfs_cost - total_cost
        bfs_pesos = minutes_to_cop(bfs_cost)
        difference_pesos = bfs_pesos - minutes_to_cop(total_cost)

        if bfs_path == path:
            message = "La ruta de menor costo también es la de menos trayectos."
        elif math.isclose(bfs_cost, total_cost):
            message = (f"El camino con menos trayectos ({bfs_hops}) cuesta lo mismo "
                       f"({bfs_cost:g} min, {format_cop(bfs_pesos)}): las dos opciones empatan en costo.")
        else:
            message = (f"El camino con menos trayectos ({bfs_hops}) cuesta {bfs_cost:g} min "
                       f"({format_cop(bfs_pesos)}): {difference:g} min ({format_cop(difference_pesos)}) más "
                       f"que la ruta de menor costo ({len(path) - 1} trayectos). "
                       "Menos saltos no significa menor costo.")
        return {"camino": bfs_path, "saltos": bfs_hops, "costo": bfs_cost,
                "diferencia": difference, "costo_cop": bfs_pesos, "diferencia_cop": difference_pesos,
                "mensaje": message}

    # --- Helpers ----------------------------------------------------------

    def _require_point(self, identifier, description):
        if identifier not in self._types:
            raise PointNotFound(f"{description} '{identifier}' no existe. Regístrelo primero.")

    def _require_non_empty(self):
        if not self._types:
            raise EmptyNetwork("La red está vacía: registre puntos y conexiones (o cargue la red de ejemplo) "
                               "antes de consultar la cobertura o una ruta.")

    def _require_positive_costs(self):
        """R-18: Dijkstra only gives the right answer if every cost is greater than 0. O(E).

        add_connection already guarantees it when registering; it is checked again here because
        it is the condition the correctness of the algorithm depends on.
        """
        for origin, outgoing in self._adjacency.items():
            for destination, cost in outgoing.items():
                try:
                    validate_cost(cost)
                except NetworkError:
                    raise InvalidData(
                        f"El trayecto {origin} → {destination} tiene un costo inválido ({cost!r}). "
                        "La ruta de menor costo usa Dijkstra, que solo funciona con costos mayores que 0: "
                        "corrija la conexión antes de pedir una ruta."
                    ) from None
