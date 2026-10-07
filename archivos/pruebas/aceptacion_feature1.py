"""Pruebas de aceptación de la Feature 1 (red operativa) contra la API REST local.

Uso:
    python main.py                               # terminal 1: servidor
    python pruebas/aceptacion_feature1.py        # terminal 2: pruebas
    python pruebas/aceptacion_feature1.py http://127.0.0.1:8000   # URL base opcional

Solo usa la biblioteca estándar (urllib). Para cada escenario imprime qué se ejecutó,
qué se esperaba, qué se obtuvo y si pasó o falló. Empieza vaciando la red (DELETE /api/red),
por lo que se puede repetir cuantas veces se quiera.
"""

import json
import socket
import sys
import urllib.error
import urllib.parse
import urllib.request

URL_BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000").rstrip("/")
resultados = []


# ---------------------------------------------------------------------------
# Apoyo
# ---------------------------------------------------------------------------

def llamar(metodo, ruta, cuerpo=None, crudo=None):
    """Hace la petición y devuelve (estado HTTP, cuerpo JSON o bytes, tipo de contenido)."""
    datos = crudo if crudo is not None else (json.dumps(cuerpo).encode("utf-8") if cuerpo is not None else None)
    encabezados = {"Content-Type": "application/json"} if datos is not None else {}
    peticion = urllib.request.Request(URL_BASE + ruta, data=datos, method=metodo, headers=encabezados)
    try:
        with urllib.request.urlopen(peticion, timeout=15) as respuesta:
            estado, tipo, contenido = respuesta.status, respuesta.headers.get("Content-Type", ""), respuesta.read()
    except urllib.error.HTTPError as error:
        estado, tipo, contenido = error.code, error.headers.get("Content-Type", ""), error.read()
    if tipo.startswith("application/json"):
        return estado, json.loads(contenido.decode("utf-8")), tipo
    return estado, contenido, tipo


def codigo_error(cuerpo):
    return cuerpo.get("error", {}).get("codigo") if isinstance(cuerpo, dict) else None


def verificar(nombre, esperado, obtenido, paso):
    resultados.append(paso)
    marca = "PASÓ" if paso else "FALLÓ"
    print(f"[{marca}] {len(resultados):02d}. {nombre}")
    print(f"        Esperado: {esperado}")
    print(f"        Obtenido: {obtenido}")


def esperar_error(nombre, metodo, ruta, cuerpo, estado_esperado, codigo_esperado, crudo=None):
    estado, respuesta, _ = llamar(metodo, ruta, cuerpo, crudo)
    obtenido = f"{estado} {codigo_error(respuesta)}"
    if isinstance(respuesta, dict) and "error" in respuesta:
        obtenido += f" — «{respuesta['error']['mensaje']}»"
    verificar(nombre, f"{estado_esperado} {codigo_esperado}", obtenido,
              estado == estado_esperado and codigo_error(respuesta) == codigo_esperado)
    return respuesta


def resumen_red():
    _, red, _ = llamar("GET", "/api/red")
    return red["resumen"]["puntos"], red["resumen"]["conexiones"]


def seccion(titulo):
    print(f"\n=== {titulo} ===")


# ---------------------------------------------------------------------------
# Escenarios
# ---------------------------------------------------------------------------

def escenarios_red_vacia():
    seccion("Grafo vacío")
    estado, red, _ = llamar("GET", "/api/red")
    verificar("Consultar la red sin datos",
              "200, 0 puntos, 0 conexiones, red dirigida",
              f"{estado}, {red['resumen']['puntos']} puntos, {red['resumen']['conexiones']} conexiones, dirigida={red['dirigida']}",
              estado == 200 and red["resumen"]["puntos"] == 0 and red["resumen"]["conexiones"] == 0 and red["dirigida"] is True)

    estado, puntos, _ = llamar("GET", "/api/puntos")
    verificar("Listar puntos sin datos", "200 con total 0", f"{estado} con total {puntos['total']}",
              estado == 200 and puntos["total"] == 0)


def escenarios_normales():
    seccion("Escenario normal de negocio")
    puntos = [("BOD-CENTRO", "bodega"), ("bar-norte", "barrio"), ("BAR-SUR", "barrio"), ("PR-ESTACION", "punto_recogida")]
    respuestas = [llamar("POST", "/api/puntos", {"id": identificador, "tipo": tipo}) for identificador, tipo in puntos]
    estados = [estado for estado, _, _ in respuestas]
    ids = [cuerpo["punto"]["id"] for estado, cuerpo, _ in respuestas if estado == 201]
    verificar("Registrar 4 puntos (uno escrito en minúsculas)",
              "4 × 201 e ids ['BOD-CENTRO', 'BAR-NORTE', 'BAR-SUR', 'PR-ESTACION']",
              f"{estados} e ids {ids}",
              estados == [201] * 4 and ids == ["BOD-CENTRO", "BAR-NORTE", "BAR-SUR", "PR-ESTACION"])

    conexiones = [("BOD-CENTRO", "BAR-NORTE", 12), ("BOD-CENTRO", "BAR-SUR", 8), ("BAR-SUR", "PR-ESTACION", 10.5)]
    estados = [llamar("POST", "/api/conexiones", {"origen": o, "destino": d, "costo": c})[0] for o, d, c in conexiones]
    verificar("Registrar 3 conexiones (una con costo decimal)", "3 × 201", f"{estados}", estados == [201] * 3)

    estado, cuerpo, _ = llamar("GET", "/api/puntos")
    orden = [p["id"] for p in cuerpo["puntos"]]
    verificar("Listar puntos en orden de registro",
              "200, total 4, orden BOD-CENTRO, BAR-NORTE, BAR-SUR, PR-ESTACION",
              f"{estado}, total {cuerpo['total']}, orden {', '.join(orden)}",
              estado == 200 and cuerpo["total"] == 4 and orden == ["BOD-CENTRO", "BAR-NORTE", "BAR-SUR", "PR-ESTACION"])

    estado, cuerpo, _ = llamar("GET", "/api/conexiones")
    verificar("Listar conexiones", "200 con total 3", f"{estado} con total {cuerpo['total']}",
              estado == 200 and cuerpo["total"] == 3)

    estado, red, _ = llamar("GET", "/api/red")
    salidas = {s["destino"]: s["costo"] for s in red["lista_adyacencia"]["BOD-CENTRO"]}
    linea = red["texto"][0]
    verificar("Representación legible (lista de adyacencia y texto)",
              "BOD-CENTRO → {BAR-NORTE: 12, BAR-SUR: 8} y texto 'BOD-CENTRO [bodega] → BAR-NORTE (12 min), BAR-SUR (8 min)'",
              f"BOD-CENTRO → {salidas} y texto '{linea}'",
              estado == 200 and salidas == {"BAR-NORTE": 12, "BAR-SUR": 8}
              and linea == "BOD-CENTRO [bodega] → BAR-NORTE (12 min), BAR-SUR (8 min)")

    estado, cuerpo, _ = llamar("GET", "/api/puntos/bod-centro")
    verificar("Consultar un punto y sus salidas", "200, tipo bodega, 2 salidas",
              f"{estado}, tipo {cuerpo['punto']['tipo']}, {len(cuerpo['salidas'])} salidas",
              estado == 200 and cuerpo["punto"]["tipo"] == "bodega" and len(cuerpo["salidas"]) == 2)


def escenarios_direccion():
    seccion("Relación inexistente y dirección")
    estado, cuerpo, _ = llamar("GET", "/api/puntos/BAR-NORTE")
    verificar("A→B no crea B→A (BAR-NORTE no tiene salida a BOD-CENTRO)",
              "200 y salidas []", f"{estado} y salidas {cuerpo['salidas']}",
              estado == 200 and cuerpo["salidas"] == [])

    estado, cuerpo, _ = llamar("POST", "/api/conexiones", {"origen": "BAR-NORTE", "destino": "BOD-CENTRO", "costo": 15})
    _, red, _ = llamar("GET", "/api/red")
    regreso = red["lista_adyacencia"]["BAR-NORTE"]
    verificar("Ciclo permitido: registrar el sentido contrario con otro costo",
              "201 y BAR-NORTE → [BOD-CENTRO 15]", f"{estado} y BAR-NORTE → {regreso}",
              estado == 201 and regreso == [{"destino": "BOD-CENTRO", "costo": 15}])


def escenarios_inexistentes():
    seccion("Nodo inexistente")
    esperar_error("Conexión hacia un destino inexistente", "POST", "/api/conexiones",
                  {"origen": "BOD-CENTRO", "destino": "BAR-OESTE", "costo": 5}, 404, "punto_inexistente")
    esperar_error("Conexión desde un origen inexistente", "POST", "/api/conexiones",
                  {"origen": "BOD-NORTE", "destino": "BAR-SUR", "costo": 5}, 404, "punto_inexistente")
    esperar_error("Consultar un punto inexistente", "GET", "/api/puntos/NO-EXISTE", None, 404, "punto_inexistente")


def escenarios_invalidos():
    seccion("Datos inválidos")
    esperar_error("Punto duplicado (mismo id en minúsculas)", "POST", "/api/puntos",
                  {"id": "bod-centro", "tipo": "bodega"}, 409, "punto_duplicado")
    esperar_error("Tipo de punto inválido", "POST", "/api/puntos", {"id": "HOSP-1", "tipo": "hospital"}, 400, "dato_invalido")
    esperar_error("Identificador con espacios internos", "POST", "/api/puntos", {"id": "BAR NORTE", "tipo": "barrio"}, 400, "dato_invalido")
    esperar_error("Identificador vacío", "POST", "/api/puntos", {"id": "   ", "tipo": "barrio"}, 400, "dato_invalido")
    esperar_error("Punto sin tipo", "POST", "/api/puntos", {"id": "BAR-ESTE"}, 400, "formato_incorrecto")
    esperar_error("Conexión duplicada (aunque con otro costo)", "POST", "/api/conexiones",
                  {"origen": "BOD-CENTRO", "destino": "BAR-NORTE", "costo": 20}, 409, "conexion_duplicada")

    base = {"origen": "BAR-SUR", "destino": "BAR-NORTE"}
    esperar_error("Costo igual a 0", "POST", "/api/conexiones", {**base, "costo": 0}, 400, "dato_invalido")
    esperar_error("Costo negativo", "POST", "/api/conexiones", {**base, "costo": -5}, 400, "dato_invalido")
    esperar_error("Costo como texto", "POST", "/api/conexiones", {**base, "costo": "diez"}, 400, "dato_invalido")
    esperar_error("Costo booleano", "POST", "/api/conexiones", {**base, "costo": True}, 400, "dato_invalido")
    esperar_error("Costo entero enorme (400 dígitos)", "POST", "/api/conexiones", {**base, "costo": 10 ** 400}, 400, "dato_invalido")
    esperar_error("Conexión sin costo", "POST", "/api/conexiones", base, 400, "formato_incorrecto")
    esperar_error("Costo NaN en el JSON", "POST", "/api/conexiones", None, 400, "formato_incorrecto",
                  crudo=b'{"origen": "BAR-SUR", "destino": "BAR-NORTE", "costo": NaN}')
    esperar_error("Lazo: un punto conectado consigo mismo", "POST", "/api/conexiones",
                  {"origen": "BAR-SUR", "destino": "bar-sur", "costo": 3}, 400, "dato_invalido")
    esperar_error("JSON mal formado", "POST", "/api/puntos", None, 400, "formato_incorrecto", crudo=b'{"id": "X", "tipo": ')
    esperar_error("Cuerpo que no es un objeto", "POST", "/api/puntos", ["BOD-2", "bodega"], 400, "formato_incorrecto")
    esperar_error("Consultar un punto con id de formato inválido", "GET", "/api/puntos/BAR%20NORTE", None, 400, "dato_invalido")

    puntos, conexiones = resumen_red()
    verificar("Los rechazos no modificaron la red", "4 puntos y 4 conexiones",
              f"{puntos} puntos y {conexiones} conexiones", (puntos, conexiones) == (4, 4))


def escenarios_api_y_visualizacion():
    seccion("API, visualización y datos de ejemplo")
    esperar_error("Endpoint inexistente", "GET", "/api/rutas", None, 404, "ruta_no_encontrada")
    esperar_error("Método no permitido", "PUT", "/api/puntos", {"id": "X", "tipo": "barrio"}, 405, "metodo_no_permitido")

    # Un cliente anuncia 100 bytes pero envía solo 5 y se queda esperando.
    host, puerto = urllib.parse.urlsplit(URL_BASE).hostname, urllib.parse.urlsplit(URL_BASE).port or 80
    with socket.create_connection((host, puerto), timeout=5) as cliente_lento:
        cliente_lento.sendall(b"POST /api/puntos HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\n"
                              b"Content-Length: 100\r\n\r\n{\"id\"")
        try:
            estado, _, _ = llamar("GET", "/api/salud")
        except OSError as error:
            estado = f"sin respuesta ({error})"
    verificar("Un cliente con una petición incompleta no bloquea la API",
              "200 en /api/salud mientras el otro cliente espera", f"{estado}", estado == 200)

    estado, contenido, tipo = llamar("GET", "/api/red/imagen")
    es_png = isinstance(contenido, bytes) and contenido.startswith(b"\x89PNG")
    verificar("Imagen de la red dibujada con NetworkX", "200 image/png con firma PNG",
              f"{estado} {tipo} con firma PNG={es_png}", estado == 200 and tipo == "image/png" and es_png)

    estado, cuerpo, _ = llamar("POST", "/api/red/ejemplo")
    verificar("Cargar la red sintética de ejemplo", "201 con 7 puntos y 10 conexiones",
              f"{estado} con {cuerpo['resumen']['puntos']} puntos y {cuerpo['resumen']['conexiones']} conexiones",
              estado == 201 and (cuerpo["resumen"]["puntos"], cuerpo["resumen"]["conexiones"]) == (7, 10))

    estado, _, _ = llamar("DELETE", "/api/red")
    puntos, conexiones = resumen_red()
    verificar("Vaciar la red", "200 y luego 0 puntos, 0 conexiones",
              f"{estado} y luego {puntos} puntos, {conexiones} conexiones", estado == 200 and (puntos, conexiones) == (0, 0))


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    print(f"Pruebas de aceptación · Feature 1 · RutaPyme\nAPI: {URL_BASE}")
    try:
        llamar("GET", "/api/salud")
    except urllib.error.URLError:
        print("\nNo se pudo conectar con la API. Inicie el servidor con: python main.py")
        sys.exit(2)

    llamar("DELETE", "/api/red")  # punto de partida conocido
    escenarios_red_vacia()
    escenarios_normales()
    escenarios_direccion()
    escenarios_inexistentes()
    escenarios_invalidos()
    escenarios_api_y_visualizacion()

    aprobados = sum(resultados)
    print(f"\nResultado: {aprobados}/{len(resultados)} escenarios aprobados.")
    sys.exit(0 if aprobados == len(resultados) else 1)


if __name__ == "__main__":
    main()
