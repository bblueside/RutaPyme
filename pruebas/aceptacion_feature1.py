"""Acceptance tests for Feature 1 (operational network) against the local REST API.

Usage:
    python main.py                               # terminal 1: server
    python pruebas/aceptacion_feature1.py        # terminal 2: tests
    python pruebas/aceptacion_feature1.py http://127.0.0.1:8000   # optional base URL

Uses only the standard library (urllib). For each scenario it prints what was run,
what was expected, what was obtained and whether it passed or failed. It starts by clearing
the network (DELETE /api/red), so it can be repeated as many times as desired.
"""

import json
import sys
import urllib.error
import urllib.request

BASE_URL = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000").rstrip("/")
results = []


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def call(method, path, body=None, raw=None):
    """Sends the request and returns (HTTP status, JSON body or bytes, content type)."""
    data = raw if raw is not None else (json.dumps(body).encode("utf-8") if body is not None else None)
    headers = {"Content-Type": "application/json"} if data is not None else {}
    request = urllib.request.Request(BASE_URL + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            status, content_type, content = response.status, response.headers.get("Content-Type", ""), response.read()
    except urllib.error.HTTPError as error:
        status, content_type, content = error.code, error.headers.get("Content-Type", ""), error.read()
    if content_type.startswith("application/json"):
        return status, json.loads(content.decode("utf-8")), content_type
    return status, content, content_type


def error_code(body):
    return body.get("error", {}).get("codigo") if isinstance(body, dict) else None


def check(name, expected, obtained, passed):
    results.append(passed)
    mark = "PASÓ" if passed else "FALLÓ"
    print(f"[{mark}] {len(results):02d}. {name}")
    print(f"        Esperado: {expected}")
    print(f"        Obtenido: {obtained}")


def expect_error(name, method, path, body, expected_status, expected_code, raw=None):
    status, response, _ = call(method, path, body, raw)
    obtained = f"{status} {error_code(response)}"
    if isinstance(response, dict) and "error" in response:
        obtained += f" — «{response['error']['mensaje']}»"
    check(name, f"{expected_status} {expected_code}", obtained,
          status == expected_status and error_code(response) == expected_code)
    return response


def network_summary():
    _, network, _ = call("GET", "/api/red")
    return network["resumen"]["puntos"], network["resumen"]["conexiones"]


def section(title):
    print(f"\n=== {title} ===")


# ---------------------------------------------------------------------------
# Scenarios
# ---------------------------------------------------------------------------

def empty_network_scenarios():
    section("Grafo vacío")
    status, network, _ = call("GET", "/api/red")
    check("Consultar la red sin datos",
          "200, 0 puntos, 0 conexiones, red dirigida",
          f"{status}, {network['resumen']['puntos']} puntos, {network['resumen']['conexiones']} conexiones, dirigida={network['dirigida']}",
          status == 200 and network["resumen"]["puntos"] == 0 and network["resumen"]["conexiones"] == 0 and network["dirigida"] is True)

    status, points, _ = call("GET", "/api/puntos")
    check("Listar puntos sin datos", "200 con total 0", f"{status} con total {points['total']}",
          status == 200 and points["total"] == 0)


def normal_scenarios():
    section("Escenario normal de negocio")
    points = [("BOD-CENTRO", "bodega"), ("bar-norte", "barrio"), ("BAR-SUR", "barrio"), ("PR-ESTACION", "punto_recogida")]
    responses = [call("POST", "/api/puntos", {"id": identifier, "tipo": point_type}) for identifier, point_type in points]
    statuses = [status for status, _, _ in responses]
    ids = [body["punto"]["id"] for status, body, _ in responses if status == 201]
    check("Registrar 4 puntos (uno escrito en minúsculas)",
          "4 × 201 e ids ['BOD-CENTRO', 'BAR-NORTE', 'BAR-SUR', 'PR-ESTACION']",
          f"{statuses} e ids {ids}",
          statuses == [201] * 4 and ids == ["BOD-CENTRO", "BAR-NORTE", "BAR-SUR", "PR-ESTACION"])

    connections = [("BOD-CENTRO", "BAR-NORTE", 12), ("BOD-CENTRO", "BAR-SUR", 8), ("BAR-SUR", "PR-ESTACION", 10.5)]
    statuses = [call("POST", "/api/conexiones", {"origen": o, "destino": d, "costo": c})[0] for o, d, c in connections]
    check("Registrar 3 conexiones (una con costo decimal)", "3 × 201", f"{statuses}", statuses == [201] * 3)

    status, body, _ = call("GET", "/api/puntos")
    order = [p["id"] for p in body["puntos"]]
    check("Listar puntos en orden de registro",
          "200, total 4, orden BOD-CENTRO, BAR-NORTE, BAR-SUR, PR-ESTACION",
          f"{status}, total {body['total']}, orden {', '.join(order)}",
          status == 200 and body["total"] == 4 and order == ["BOD-CENTRO", "BAR-NORTE", "BAR-SUR", "PR-ESTACION"])

    status, body, _ = call("GET", "/api/conexiones")
    check("Listar conexiones", "200 con total 3", f"{status} con total {body['total']}",
          status == 200 and body["total"] == 3)

    status, network, _ = call("GET", "/api/red")
    outgoing = {s["destino"]: s["costo"] for s in network["lista_adyacencia"]["BOD-CENTRO"]}
    line = network["texto"][0]
    check("Representación legible (lista de adyacencia y texto)",
          "BOD-CENTRO → {BAR-NORTE: 12, BAR-SUR: 8} y texto 'BOD-CENTRO [bodega] → BAR-NORTE (12 min), BAR-SUR (8 min)'",
          f"BOD-CENTRO → {outgoing} y texto '{line}'",
          status == 200 and outgoing == {"BAR-NORTE": 12, "BAR-SUR": 8}
          and line == "BOD-CENTRO [bodega] → BAR-NORTE (12 min), BAR-SUR (8 min)")

    status, body, _ = call("GET", "/api/puntos/bod-centro")
    check("Consultar un punto y sus salidas", "200, tipo bodega, 2 salidas",
          f"{status}, tipo {body['punto']['tipo']}, {len(body['salidas'])} salidas",
          status == 200 and body["punto"]["tipo"] == "bodega" and len(body["salidas"]) == 2)


def direction_scenarios():
    section("Relación inexistente y dirección")
    status, body, _ = call("GET", "/api/puntos/BAR-NORTE")
    check("A→B no crea B→A (BAR-NORTE no tiene salida a BOD-CENTRO)",
          "200 y salidas []", f"{status} y salidas {body['salidas']}",
          status == 200 and body["salidas"] == [])

    status, body, _ = call("POST", "/api/conexiones", {"origen": "BAR-NORTE", "destino": "BOD-CENTRO", "costo": 15})
    _, network, _ = call("GET", "/api/red")
    return_trip = network["lista_adyacencia"]["BAR-NORTE"]
    check("Ciclo permitido: registrar el sentido contrario con otro costo",
          "201 y BAR-NORTE → [BOD-CENTRO 15]", f"{status} y BAR-NORTE → {return_trip}",
          status == 201 and return_trip == [{"destino": "BOD-CENTRO", "costo": 15}])


def nonexistent_scenarios():
    section("Nodo inexistente")
    expect_error("Conexión hacia un destino inexistente", "POST", "/api/conexiones",
                 {"origen": "BOD-CENTRO", "destino": "BAR-OESTE", "costo": 5}, 404, "punto_inexistente")
    expect_error("Conexión desde un origen inexistente", "POST", "/api/conexiones",
                 {"origen": "BOD-NORTE", "destino": "BAR-SUR", "costo": 5}, 404, "punto_inexistente")
    expect_error("Consultar un punto inexistente", "GET", "/api/puntos/NO-EXISTE", None, 404, "punto_inexistente")


def invalid_scenarios():
    section("Datos inválidos")
    expect_error("Punto duplicado (mismo id en minúsculas)", "POST", "/api/puntos",
                 {"id": "bod-centro", "tipo": "bodega"}, 409, "punto_duplicado")
    expect_error("Tipo de punto inválido", "POST", "/api/puntos", {"id": "HOSP-1", "tipo": "hospital"}, 400, "dato_invalido")
    expect_error("Identificador con espacios internos", "POST", "/api/puntos", {"id": "BAR NORTE", "tipo": "barrio"}, 400, "dato_invalido")
    expect_error("Identificador vacío", "POST", "/api/puntos", {"id": "   ", "tipo": "barrio"}, 400, "dato_invalido")
    expect_error("Punto sin tipo", "POST", "/api/puntos", {"id": "BAR-ESTE"}, 400, "formato_incorrecto")
    expect_error("Conexión duplicada (aunque con otro costo)", "POST", "/api/conexiones",
                 {"origen": "BOD-CENTRO", "destino": "BAR-NORTE", "costo": 20}, 409, "conexion_duplicada")

    base = {"origen": "BAR-SUR", "destino": "BAR-NORTE"}
    expect_error("Costo igual a 0", "POST", "/api/conexiones", {**base, "costo": 0}, 400, "dato_invalido")
    expect_error("Costo negativo", "POST", "/api/conexiones", {**base, "costo": -5}, 400, "dato_invalido")
    expect_error("Costo como texto", "POST", "/api/conexiones", {**base, "costo": "diez"}, 400, "dato_invalido")
    expect_error("Costo booleano", "POST", "/api/conexiones", {**base, "costo": True}, 400, "dato_invalido")
    expect_error("Conexión sin costo", "POST", "/api/conexiones", base, 400, "formato_incorrecto")
    expect_error("Lazo: un punto conectado consigo mismo", "POST", "/api/conexiones",
                 {"origen": "BAR-SUR", "destino": "bar-sur", "costo": 3}, 400, "dato_invalido")
    expect_error("JSON mal formado", "POST", "/api/puntos", None, 400, "formato_incorrecto", raw=b'{"id": "X", "tipo": ')
    expect_error("Cuerpo que no es un objeto", "POST", "/api/puntos", ["BOD-2", "bodega"], 400, "formato_incorrecto")

    points, connections = network_summary()
    check("Los rechazos no modificaron la red", "4 puntos y 4 conexiones",
          f"{points} puntos y {connections} conexiones", (points, connections) == (4, 4))


def api_and_visualization_scenarios():
    section("API, visualización y datos de ejemplo")
    expect_error("Endpoint inexistente", "GET", "/api/rutas", None, 404, "ruta_no_encontrada")
    expect_error("Método no permitido", "PUT", "/api/puntos", {"id": "X", "tipo": "barrio"}, 405, "metodo_no_permitido")

    status, content, content_type = call("GET", "/api/red/imagen")
    is_png = isinstance(content, bytes) and content.startswith(b"\x89PNG")
    check("Imagen de la red dibujada con NetworkX", "200 image/png con firma PNG",
          f"{status} {content_type} con firma PNG={is_png}", status == 200 and content_type == "image/png" and is_png)

    status, body, _ = call("POST", "/api/red/ejemplo")
    check("Cargar la red sintética de ejemplo", "201 con 7 puntos y 10 conexiones",
          f"{status} con {body['resumen']['puntos']} puntos y {body['resumen']['conexiones']} conexiones",
          status == 201 and (body["resumen"]["puntos"], body["resumen"]["conexiones"]) == (7, 10))

    status, _, _ = call("DELETE", "/api/red")
    points, connections = network_summary()
    check("Vaciar la red", "200 y luego 0 puntos, 0 conexiones",
          f"{status} y luego {points} puntos, {connections} conexiones", status == 200 and (points, connections) == (0, 0))


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    print(f"Pruebas de aceptación · Feature 1 · RutaPyme\nAPI: {BASE_URL}")
    try:
        call("GET", "/api/salud")
    except urllib.error.URLError:
        print("\nNo se pudo conectar con la API. Inicie el servidor con: python main.py")
        sys.exit(2)

    call("DELETE", "/api/red")  # known starting point
    empty_network_scenarios()
    normal_scenarios()
    direction_scenarios()
    nonexistent_scenarios()
    invalid_scenarios()
    api_and_visualization_scenarios()

    passed = sum(results)
    print(f"\nResultado: {passed}/{len(results)} escenarios aprobados.")
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    main()
