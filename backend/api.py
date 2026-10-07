"""API REST de RutaPyme construida solo con la biblioteca estándar (http.server).

Contrato de endpoints: docs/feature-1/especificacion.md, sección 5.
"""

import json
import threading
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

from backend.red import TIPOS_PUNTO, ErrorRed, FormatoIncorrecto, RedOperativa

RAIZ = Path(__file__).resolve().parent.parent
ARCHIVO_EJEMPLO = RAIZ / "datos" / "red_ejemplo.json"
TAMANO_MAXIMO_CUERPO = 10_000  # bytes; una petición de esta API nunca necesita más

TIPO_JSON = "application/json; charset=utf-8"

ESTADO_HTTP_POR_ERROR = {
    "formato_incorrecto": 400,
    "dato_invalido": 400,
    "punto_inexistente": 404,
    "punto_duplicado": 409,
    "conexion_duplicada": 409,
}

# (método, patrón de ruta, nombre del método que la atiende). {id} es un parámetro.
RUTAS = [
    ("GET", "/api/salud", "salud"),
    ("GET", "/api/tipos", "listar_tipos"),
    ("GET", "/api/puntos", "listar_puntos"),
    ("POST", "/api/puntos", "crear_punto"),
    ("GET", "/api/puntos/{id}", "obtener_punto"),
    ("GET", "/api/conexiones", "listar_conexiones"),
    ("POST", "/api/conexiones", "crear_conexion"),
    ("GET", "/api/red", "ver_red"),
    ("DELETE", "/api/red", "vaciar_red"),
    ("POST", "/api/red/ejemplo", "cargar_ejemplo"),
]


def cargar_red_ejemplo(red):
    """Reemplaza la red por la red sintética de datos/red_ejemplo.json."""
    red.cargar(json.loads(ARCHIVO_EJEMPLO.read_text(encoding="utf-8")))


def _coincidir(patron, ruta):
    """Devuelve los parámetros de la ruta si coincide con el patrón, o None."""
    partes_patron = patron.split("/")
    partes_ruta = ruta.split("/")
    if len(partes_patron) != len(partes_ruta):
        return None
    parametros = {}
    for parte_patron, parte_ruta in zip(partes_patron, partes_ruta):
        if parte_patron.startswith("{"):
            parametros[parte_patron[1:-1]] = unquote(parte_ruta)
        elif parte_patron != parte_ruta:
            return None
    return parametros


class ManejadorRutaPyme(BaseHTTPRequestHandler):
    server_version = "RutaPyme/1.0"

    # --- Entrada ----------------------------------------------------------

    def do_GET(self):
        self._atender("GET")

    def do_POST(self):
        self._atender("POST")

    def do_DELETE(self):
        self._atender("DELETE")

    def do_PUT(self):
        self._atender("PUT")

    def do_PATCH(self):
        self._atender("PATCH")

    def _atender(self, metodo):
        ruta = urlsplit(self.path).path
        if ruta != "/":
            ruta = ruta.rstrip("/")

        metodos_permitidos = []
        for metodo_ruta, patron, nombre in RUTAS:
            parametros = _coincidir(patron, ruta)
            if parametros is None:
                continue
            if metodo_ruta == metodo:
                self._ejecutar(getattr(self, nombre), parametros)
                return
            metodos_permitidos.append(metodo_ruta)

        if metodos_permitidos:
            self._enviar_error(405, "metodo_no_permitido",
                               f"{metodo} no está permitido en {ruta}. Use: {', '.join(metodos_permitidos)}.")
        else:
            self._enviar_error(404, "ruta_no_encontrada", f"No existe el endpoint {ruta}.")

    def _ejecutar(self, manejador, parametros):
        try:
            # El candado evita que dos peticiones modifiquen la red al mismo tiempo.
            with self.server.candado:
                manejador(**parametros)
        except ErrorRed as error:
            self._enviar_error(ESTADO_HTTP_POR_ERROR.get(error.codigo, 400), error.codigo, error.mensaje)
        except Exception:
            traceback.print_exc()
            self._enviar_error(500, "error_interno", "Ocurrió un error inesperado en el servidor.")

    def _leer_cuerpo(self):
        """Lee los bytes del cuerpo según Content-Length (puede estar vacío)."""
        try:
            longitud = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            raise FormatoIncorrecto("El encabezado Content-Length no es válido.")
        if longitud > TAMANO_MAXIMO_CUERPO:
            raise FormatoIncorrecto(f"El cuerpo supera el máximo de {TAMANO_MAXIMO_CUERPO} bytes.")
        return self.rfile.read(longitud) if longitud > 0 else b""

    def _leer_json(self):
        """Interpreta el cuerpo como objeto JSON o lanza FormatoIncorrecto (CA-11)."""
        crudo = self._leer_cuerpo()
        if not crudo:
            raise FormatoIncorrecto("El cuerpo de la petición está vacío. Envíe un objeto JSON.")
        try:
            datos = json.loads(crudo.decode("utf-8"))
        except (UnicodeDecodeError, ValueError):
            raise FormatoIncorrecto('El cuerpo no es JSON válido. Ejemplo: {"id": "BOD-CENTRO", "tipo": "bodega"}.')
        if not isinstance(datos, dict):
            raise FormatoIncorrecto("El cuerpo debe ser un objeto JSON (entre llaves { }).")
        return datos

    # --- Endpoints --------------------------------------------------------

    @property
    def red(self):
        return self.server.red

    def salud(self):
        self._enviar_json(200, {"estado": "ok", "servicio": "RutaPyme API", "feature": 1})

    def listar_tipos(self):
        self._enviar_json(200, {"tipos": list(TIPOS_PUNTO)})

    def listar_puntos(self):
        puntos = self.red.listar_puntos()
        self._enviar_json(200, {"total": len(puntos), "puntos": puntos})

    def crear_punto(self):
        datos = self._leer_json()
        punto = self.red.agregar_punto(datos.get("id"), datos.get("tipo"))
        self._enviar_json(201, {"mensaje": f"Punto {punto['id']} registrado.", "punto": punto})

    def obtener_punto(self, id):
        punto = self.red.obtener_punto(id)
        salidas = [{"destino": destino, "costo": costo} for destino, costo in self.red.vecinos(id).items()]
        self._enviar_json(200, {"punto": punto, "salidas": salidas})

    def listar_conexiones(self):
        conexiones = self.red.listar_conexiones()
        self._enviar_json(200, {"total": len(conexiones), "conexiones": conexiones})

    def crear_conexion(self):
        datos = self._leer_json()
        conexion = self.red.agregar_conexion(datos.get("origen"), datos.get("destino"), datos.get("costo"))
        self._enviar_json(201, {
            "mensaje": f"Conexión {conexion['origen']} → {conexion['destino']} registrada.",
            "conexion": conexion,
        })

    def ver_red(self):
        self._enviar_json(200, self.red.representacion())

    def vaciar_red(self):
        self.red.vaciar()
        self._enviar_json(200, {"mensaje": "La red quedó vacía."})

    def cargar_ejemplo(self):
        cargar_red_ejemplo(self.red)
        self._enviar_json(201, {
            "mensaje": "Red de ejemplo cargada.",
            "resumen": self.red.representacion()["resumen"],
        })

    # --- Salida -----------------------------------------------------------

    def _enviar(self, estado, cuerpo, tipo_contenido):
        self.send_response(estado)
        self.send_header("Content-Type", tipo_contenido)
        self.send_header("Content-Length", str(len(cuerpo)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(cuerpo)

    def _enviar_json(self, estado, datos):
        cuerpo = json.dumps(datos, ensure_ascii=False, indent=2).encode("utf-8")
        self._enviar(estado, cuerpo, TIPO_JSON)

    def _enviar_error(self, estado, codigo, mensaje):
        self._enviar_json(estado, {"error": {"codigo": codigo, "mensaje": mensaje}})

    def log_message(self, formato, *argumentos):
        print(f"[API] {self.log_date_time_string()} {formato % argumentos}", flush=True)


def crear_servidor(host="127.0.0.1", puerto=8000, red=None):
    """Crea el servidor HTTP con su propia red en memoria."""
    servidor = ThreadingHTTPServer((host, puerto), ManejadorRutaPyme)
    servidor.red = red if red is not None else RedOperativa()
    servidor.candado = threading.Lock()
    return servidor
