"""Núcleo de la red operativa de RutaPyme.

La red es un grafo DIRIGIDO y PONDERADO guardado como LISTA DE ADYACENCIA:
cada punto guarda un diccionario con sus salidas {destino: costo}.

Este módulo no sabe nada de HTTP: solo guarda la red y aplica las reglas del dominio
descritas en docs/feature-1/especificacion.md (reglas R-01 a R-07).
"""

import math
import re

TIPOS_PUNTO = ("bodega", "barrio", "punto_recogida")
PATRON_ID = re.compile(r"[A-Za-z0-9_-]{1,30}")


# ---------------------------------------------------------------------------
# Errores de negocio. `codigo` es el identificador que la API devuelve al cliente.
# ---------------------------------------------------------------------------

class ErrorRed(Exception):
    codigo = "error_red"

    def __init__(self, mensaje):
        super().__init__(mensaje)
        self.mensaje = mensaje


class FormatoIncorrecto(ErrorRed):
    codigo = "formato_incorrecto"


class DatoInvalido(ErrorRed):
    codigo = "dato_invalido"


class PuntoInexistente(ErrorRed):
    codigo = "punto_inexistente"


class PuntoDuplicado(ErrorRed):
    codigo = "punto_duplicado"


class ConexionDuplicada(ErrorRed):
    codigo = "conexion_duplicada"


# ---------------------------------------------------------------------------
# Validaciones de datos de entrada
# ---------------------------------------------------------------------------

def normalizar_id(valor, campo="id"):
    """R-01: texto de 1 a 30 caracteres [A-Za-z0-9_-], guardado en mayúsculas."""
    if valor is None:
        raise FormatoIncorrecto(f"Falta el campo '{campo}'.")
    if not isinstance(valor, str):
        raise DatoInvalido(f"El campo '{campo}' debe ser texto.")
    identificador = valor.strip()
    if not PATRON_ID.fullmatch(identificador):
        raise DatoInvalido(
            f"El campo '{campo}' debe tener de 1 a 30 caracteres: letras sin tilde, "
            "números, '-' o '_', sin espacios. Ejemplo: BOD-CENTRO."
        )
    return identificador.upper()


def validar_tipo(valor):
    """R-02: el tipo debe ser uno de TIPOS_PUNTO."""
    if valor is None:
        raise FormatoIncorrecto("Falta el campo 'tipo'.")
    tipo = valor.strip().lower() if isinstance(valor, str) else valor
    if tipo not in TIPOS_PUNTO:
        raise DatoInvalido(f"El tipo {valor!r} no es válido. Use uno de: {', '.join(TIPOS_PUNTO)}.")
    return tipo


def validar_costo(valor):
    """R-05: número finito mayor que 0 (tiempo estimado en minutos)."""
    if valor is None:
        raise FormatoIncorrecto("Falta el campo 'costo'.")
    # bool es subclase de int en Python, por eso se descarta explícitamente.
    if isinstance(valor, bool) or not isinstance(valor, (int, float)):
        raise DatoInvalido(f"El costo debe ser un número (por ejemplo 12 o 7.5), no {valor!r}.")
    if not math.isfinite(valor) or valor <= 0:
        raise DatoInvalido(f"El costo debe ser un número mayor que 0 (minutos). Se recibió {valor}.")
    return valor


# ---------------------------------------------------------------------------
# Grafo
# ---------------------------------------------------------------------------

class RedOperativa:
    """Grafo dirigido y ponderado de puntos (nodos) y trayectos (aristas)."""

    def __init__(self):
        self._tipos = {}        # id del punto -> tipo
        self._adyacencia = {}   # id del punto -> {id del destino: costo}

    # --- Puntos -----------------------------------------------------------

    def agregar_punto(self, identificador, tipo):
        """Registra un punto nuevo. O(1) promedio."""
        identificador = normalizar_id(identificador, "id")
        tipo = validar_tipo(tipo)
        if identificador in self._tipos:
            raise PuntoDuplicado(f"El punto '{identificador}' ya está registrado.")
        self._tipos[identificador] = tipo
        self._adyacencia[identificador] = {}
        return {"id": identificador, "tipo": tipo}

    def obtener_punto(self, identificador):
        identificador = normalizar_id(identificador, "id")
        self._exigir_punto(identificador, "El punto")
        return {"id": identificador, "tipo": self._tipos[identificador]}

    def listar_puntos(self):
        """Puntos en orden de registro. O(V)."""
        return [{"id": punto, "tipo": tipo} for punto, tipo in self._tipos.items()]

    def vecinos(self, identificador):
        """Salidas de un punto {destino: costo}. Es la operación principal: O(grado del punto)."""
        identificador = normalizar_id(identificador, "id")
        self._exigir_punto(identificador, "El punto")
        return dict(self._adyacencia[identificador])

    # --- Conexiones -------------------------------------------------------

    def agregar_conexion(self, origen, destino, costo):
        """Registra el trayecto dirigido origen -> destino. O(1) promedio."""
        costo = validar_costo(costo)
        origen = normalizar_id(origen, "origen")
        destino = normalizar_id(destino, "destino")
        self._exigir_punto(origen, "El punto de origen")
        self._exigir_punto(destino, "El punto de destino")
        if origen == destino:
            raise DatoInvalido(f"Un trayecto debe unir dos puntos distintos ('{origen}' → '{origen}' no es válido).")
        if destino in self._adyacencia[origen]:
            costo_actual = self._adyacencia[origen][destino]
            raise ConexionDuplicada(
                f"La conexión {origen} → {destino} ya existe (costo {costo_actual:g}). "
                "Recuerde que el sentido contrario es otra conexión."
            )
        self._adyacencia[origen][destino] = costo
        return {"origen": origen, "destino": destino, "costo": costo}

    def listar_conexiones(self):
        """Todas las conexiones. O(V + E)."""
        return [
            {"origen": origen, "destino": destino, "costo": costo}
            for origen, salidas in self._adyacencia.items()
            for destino, costo in salidas.items()
        ]

    # --- Red completa -----------------------------------------------------

    def cantidad_puntos(self):
        return len(self._tipos)

    def cantidad_conexiones(self):
        return sum(len(salidas) for salidas in self._adyacencia.values())

    def vaciar(self):
        self._tipos = {}
        self._adyacencia = {}

    def cargar(self, datos):
        """Reemplaza la red por la de `datos` ({puntos, conexiones}).

        Se construye primero una red nueva: si algún dato es inválido se lanza el error
        y la red actual queda intacta.
        """
        nueva = RedOperativa()
        for punto in datos.get("puntos", []):
            nueva.agregar_punto(punto.get("id"), punto.get("tipo"))
        for conexion in datos.get("conexiones", []):
            nueva.agregar_conexion(conexion.get("origen"), conexion.get("destino"), conexion.get("costo"))
        self._tipos = nueva._tipos
        self._adyacencia = nueva._adyacencia

    def representacion(self):
        """Vista legible de la red para la API (CA-12). O(V + E)."""
        por_tipo = {tipo: 0 for tipo in TIPOS_PUNTO}
        for tipo in self._tipos.values():
            por_tipo[tipo] += 1

        lista_adyacencia = {}
        texto = []
        for punto, salidas in self._adyacencia.items():
            lista_adyacencia[punto] = [{"destino": destino, "costo": costo} for destino, costo in salidas.items()]
            if salidas:
                detalle = ", ".join(f"{destino} ({costo:g} min)" for destino, costo in salidas.items())
            else:
                detalle = "(sin salidas)"
            texto.append(f"{punto} [{self._tipos[punto]}] → {detalle}")

        return {
            "dirigida": True,
            "ponderada": True,
            "peso": "costo = tiempo estimado del trayecto en minutos (siempre mayor que 0)",
            "estructura": "lista de adyacencia: cada punto guarda sus salidas {destino: costo}",
            "resumen": {
                "puntos": self.cantidad_puntos(),
                "conexiones": self.cantidad_conexiones(),
                "por_tipo": por_tipo,
            },
            "lista_adyacencia": lista_adyacencia,
            "texto": texto,
        }

    # --- Apoyo ------------------------------------------------------------

    def _exigir_punto(self, identificador, descripcion):
        if identificador not in self._tipos:
            raise PuntoInexistente(f"{descripcion} '{identificador}' no existe. Regístrelo primero.")
