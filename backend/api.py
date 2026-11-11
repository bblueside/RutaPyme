"""RutaPyme REST API built only with the standard library (http.server).

It also serves the web interface files (frontend/legacy/ folder), so API and interface
live on the same server and the interface consumes the real API.
Endpoint contract: docs/feature-1/especificacion.md, docs/feature-2/especificacion.md and
docs/feature-3/especificacion.md (section 5 of each one).
The URLs, JSON fields, error codes and messages stay in Spanish: they are the contract
the frontend and the client use.
"""

import json
import threading
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

from backend import visualization
from backend.network import POINT_TYPES, BadFormat, NetworkError, OperationalNetwork

ROOT = Path(__file__).resolve().parent.parent
FRONTEND_FOLDER = ROOT / "frontend" / "legacy"
SAMPLE_FILE = ROOT / "datos" / "red_ejemplo.json"
MAX_BODY_SIZE = 10_000  # bytes; a request to this API never needs more

JSON_TYPE = "application/json; charset=utf-8"

HTTP_STATUS_BY_ERROR = {
    "formato_incorrecto": 400,
    "dato_invalido": 400,
    "punto_inexistente": 404,
    "punto_duplicado": 409,
    "conexion_duplicada": 409,
    "red_vacia": 404,
}

STATIC_FILES = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/index.html": ("index.html", "text/html; charset=utf-8"),
    "/estilos.css": ("estilos.css", "text/css; charset=utf-8"),
    "/app.js": ("app.js", "text/javascript; charset=utf-8"),
}

# (method, path pattern, name of the handler method). {name} is a path parameter.
ROUTES = [
    ("GET", "/api/salud", "health"),
    ("GET", "/api/tipos", "list_types"),
    ("GET", "/api/puntos", "list_points"),
    ("POST", "/api/puntos", "create_point"),
    ("GET", "/api/puntos/{identifier}", "get_point"),
    ("GET", "/api/conexiones", "list_connections"),
    ("POST", "/api/conexiones", "create_connection"),
    ("GET", "/api/red", "show_network"),
    ("DELETE", "/api/red", "clear_network"),
    ("GET", "/api/red/imagen", "show_image"),
    ("GET", "/api/red/imagen/cobertura/{origin}", "show_coverage_image"),
    ("GET", "/api/red/imagen/ruta/{origin}/{destination}", "show_route_image"),
    ("POST", "/api/red/ejemplo", "load_sample"),
    ("GET", "/api/cobertura", "coverage_without_origin"),
    ("GET", "/api/cobertura/{origin}", "get_coverage"),
    ("GET", "/api/cobertura/{origin}/{destination}", "check_coverage"),
    ("GET", "/api/ruta", "route_without_parameters"),
    ("GET", "/api/ruta/{origin}", "route_without_destination"),
    ("GET", "/api/ruta/{origin}/{destination}", "get_route"),
]


def load_sample_network(network):
    """Replaces the network with the synthetic network in datos/red_ejemplo.json."""
    network.load(json.loads(SAMPLE_FILE.read_text(encoding="utf-8")))


def _match(pattern, path):
    """Returns the path parameters if the path matches the pattern, or None."""
    pattern_parts = pattern.split("/")
    path_parts = path.split("/")
    if len(pattern_parts) != len(path_parts):
        return None
    parameters = {}
    for pattern_part, path_part in zip(pattern_parts, path_parts):
        if pattern_part.startswith("{"):
            parameters[pattern_part[1:-1]] = unquote(path_part)
        elif pattern_part != path_part:
            return None
    return parameters


class RutaPymeHandler(BaseHTTPRequestHandler):
    server_version = "RutaPyme/1.0"

    # --- Input ------------------------------------------------------------

    def do_GET(self):
        self._dispatch("GET")

    def do_POST(self):
        self._dispatch("POST")

    def do_DELETE(self):
        self._dispatch("DELETE")

    def do_PUT(self):
        self._dispatch("PUT")

    def do_PATCH(self):
        self._dispatch("PATCH")

    def _dispatch(self, method):
        path = urlsplit(self.path).path
        if path != "/":
            path = path.rstrip("/")

        if method == "GET" and path in STATIC_FILES:
            self._send_static(*STATIC_FILES[path])
            return

        allowed_methods = []
        for route_method, pattern, name in ROUTES:
            parameters = _match(pattern, path)
            if parameters is None:
                continue
            if route_method == method:
                self._run(getattr(self, name), parameters)
                return
            allowed_methods.append(route_method)

        if allowed_methods:
            self._send_error(405, "metodo_no_permitido",
                             f"{method} no está permitido en {path}. Use: {', '.join(allowed_methods)}.")
        else:
            self._send_error(404, "ruta_no_encontrada", f"No existe el endpoint {path}.")

    def _run(self, handler, parameters):
        try:
            # The lock prevents two requests from modifying the network at the same time.
            with self.server.lock:
                handler(**parameters)
        except NetworkError as error:
            self._send_error(HTTP_STATUS_BY_ERROR.get(error.code, 400), error.code, error.message)
        except Exception:
            traceback.print_exc()
            self._send_error(500, "error_interno", "Ocurrió un error inesperado en el servidor.")

    def _read_body(self):
        """Reads the body bytes according to Content-Length (it may be empty)."""
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            raise BadFormat("El encabezado Content-Length no es válido.")
        if length > MAX_BODY_SIZE:
            raise BadFormat(f"El cuerpo supera el máximo de {MAX_BODY_SIZE} bytes.")
        return self.rfile.read(length) if length > 0 else b""

    def _read_json(self):
        """Parses the body as a JSON object or raises BadFormat (CA-11)."""
        raw = self._read_body()
        if not raw:
            raise BadFormat("El cuerpo de la petición está vacío. Envíe un objeto JSON.")
        try:
            data = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, ValueError):
            raise BadFormat('El cuerpo no es JSON válido. Ejemplo: {"id": "BOD-CENTRO", "tipo": "bodega"}.')
        if not isinstance(data, dict):
            raise BadFormat("El cuerpo debe ser un objeto JSON (entre llaves { }).")
        return data

    # --- Endpoints --------------------------------------------------------

    @property
    def network(self):
        return self.server.network

    def health(self):
        self._send_json(200, {"estado": "ok", "servicio": "RutaPyme API", "feature": 3})

    def list_types(self):
        self._send_json(200, {"tipos": list(POINT_TYPES)})

    def list_points(self):
        points = self.network.list_points()
        self._send_json(200, {"total": len(points), "puntos": points})

    def create_point(self):
        data = self._read_json()
        point = self.network.add_point(data.get("id"), data.get("tipo"))
        self._send_json(201, {"mensaje": f"Punto {point['id']} registrado.", "punto": point})

    def get_point(self, identifier):
        point = self.network.get_point(identifier)
        outgoing = [{"destino": destination, "costo": cost}
                    for destination, cost in self.network.neighbors(identifier).items()]
        self._send_json(200, {"punto": point, "salidas": outgoing})

    def list_connections(self):
        connections = self.network.list_connections()
        self._send_json(200, {"total": len(connections), "conexiones": connections})

    def create_connection(self):
        data = self._read_json()
        connection = self.network.add_connection(data.get("origen"), data.get("destino"), data.get("costo"))
        self._send_json(201, {
            "mensaje": f"Conexión {connection['origen']} → {connection['destino']} registrada.",
            "conexion": connection,
        })

    def show_network(self):
        self._send_json(200, self.network.representation())

    def clear_network(self):
        self.network.clear()
        self._send_json(200, {"mensaje": "La red quedó vacía."})

    def load_sample(self):
        load_sample_network(self.network)
        self._send_json(201, {
            "mensaje": "Red de ejemplo cargada.",
            "resumen": self.network.representation()["resumen"],
        })

    def coverage_without_origin(self):
        raise BadFormat("Indique el punto de origen en la ruta: /api/cobertura/{origen} "
                        "o /api/cobertura/{origen}/{destino}.")

    def get_coverage(self, origin):
        self._send_json(200, self.network.coverage(origin))

    def check_coverage(self, origin, destination):
        self._send_json(200, self.network.check_coverage(origin, destination))

    def route_without_parameters(self):
        raise BadFormat("Indique el origen y el destino en la ruta: /api/ruta/{origen}/{destino}.")

    def route_without_destination(self, origin):
        raise BadFormat(f"Falta el destino. Use /api/ruta/{origin}/{{destino}}.")

    def get_route(self, origin, destination):
        self._send_json(200, self.network.cheapest_route(origin, destination))

    def show_image(self):
        if not self._visualization_available():
            return
        self._send(200, visualization.draw_network(self.network), "image/png")

    def show_coverage_image(self, origin):
        # Our traversal computes the coverage first (and validates the origin); NetworkX only draws it.
        coverage = self.network.coverage(origin)
        if not self._visualization_available():
            return
        self._send(200, visualization.draw_network(self.network, coverage), "image/png")

    def show_route_image(self, origin, destination):
        # Our Dijkstra computes the route (and validates origin, destination and costs); NetworkX only draws it.
        route = self.network.cheapest_route(origin, destination)
        if not self._visualization_available():
            return
        self._send(200, visualization.draw_network(self.network, route=route), "image/png")

    def _visualization_available(self):
        if not visualization.AVAILABLE:
            self._send_error(503, "visualizacion_no_disponible",
                             "Instale las dependencias con: pip install -r requirements.txt")
        return visualization.AVAILABLE

    # --- Output -----------------------------------------------------------

    def _send(self, status, body, content_type):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self._send(status, body, JSON_TYPE)

    def _send_error(self, status, code, message):
        self._send_json(status, {"error": {"codigo": code, "mensaje": message}})

    def _send_static(self, file_name, content_type):
        self._send(200, (FRONTEND_FOLDER / file_name).read_bytes(), content_type)

    def log_message(self, format, *args):
        print(f"[API] {self.log_date_time_string()} {format % args}", flush=True)


def create_server(host="127.0.0.1", port=8000, network=None):
    """Creates the HTTP server with its own in-memory network."""
    server = ThreadingHTTPServer((host, port), RutaPymeHandler)
    server.network = network if network is not None else OperationalNetwork()
    server.lock = threading.Lock()
    return server
