"""Acceptance tests for Feature 2 (delivery coverage) against the local REST API.

Usage:
    python main.py                               # terminal 1: server
    python pruebas/aceptacion_feature2.py        # terminal 2: tests
    python pruebas/aceptacion_feature2.py http://127.0.0.1:8000   # optional base URL

Uses only the standard library (urllib). For each scenario it prints what was run,
what was expected, what was obtained and whether it passed or failed. It starts by clearing
the network (DELETE /api/red) and uses the synthetic network from datos/red_ejemplo.json, so it
can be repeated as many times as desired.
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

def call(method, path, body=None):
    """Sends the request and returns (HTTP status, JSON body). If it is not JSON, returns the bytes."""
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Content-Type": "application/json"} if data is not None else {}
    request = urllib.request.Request(BASE_URL + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            status, content_type, content = response.status, response.headers.get("Content-Type", ""), response.read()
    except urllib.error.HTTPError as error:
        status, content_type, content = error.code, error.headers.get("Content-Type", ""), error.read()
    if content_type.startswith("application/json"):
        return status, json.loads(content.decode("utf-8"))
    return status, content


def error_code(body):
    return body.get("error", {}).get("codigo") if isinstance(body, dict) else None


def check(name, expected, obtained, passed):
    results.append(passed)
    mark = "PASÓ" if passed else "FALLÓ"
    print(f"[{mark}] {len(results):02d}. {name}")
    print(f"        Esperado: {expected}")
    print(f"        Obtenido: {obtained}")


def expect_error(name, method, path, expected_status, expected_code):
    status, response = call(method, path)
    obtained = f"{status} {error_code(response)}"
    if "error" in response:
        obtained += f" — «{response['error']['mensaje']}»"
    check(name, f"{expected_status} {expected_code}", obtained,
          status == expected_status and error_code(response) == expected_code)


def ids(items):
    return [item["id"] for item in items]


def section(title):
    print(f"\n=== {title} ===")


# ---------------------------------------------------------------------------
# Scenarios
# ---------------------------------------------------------------------------

def empty_network_scenarios():
    section("Red vacía")
    expect_error("Cobertura desde un origen con la red vacía", "GET", "/api/cobertura/BOD-CENTRO", 404, "red_vacia")
    expect_error("Origen y destino con la red vacía", "GET", "/api/cobertura/BOD-CENTRO/BAR-SUR", 404, "red_vacia")


def normal_scenarios():
    section("Escenario normal de negocio: cobertura desde la bodega")
    call("POST", "/api/red/ejemplo")

    status, body = call("GET", "/api/cobertura/BOD-CENTRO")
    expected = {"BAR-NORTE", "BAR-SUR", "PR-ESTACION", "PR-PARQUE", "BAR-ORIENTE"}
    check("Destinos alcanzables desde BOD-CENTRO",
          f"200, 5 alcanzables {sorted(expected)}",
          f"{status}, {body['total_alcanzables']} alcanzables {sorted(ids(body['alcanzables']))}",
          status == 200 and body["total_alcanzables"] == 5 and set(ids(body["alcanzables"])) == expected)

    unreachable = body["no_alcanzables"]
    check("Punto desconectado listado con su motivo",
          "PR-LAGUNA: no tiene trayectos de entrada",
          "; ".join(f"{p['id']}: {p['motivo']}" for p in unreachable),
          ids(unreachable) == ["PR-LAGUNA"] and "entrada" in unreachable[0]["motivo"])

    order = ["BOD-CENTRO", "BAR-NORTE", "BAR-SUR", "PR-ESTACION", "PR-PARQUE", "BAR-ORIENTE"]
    check("Orden de visita del recorrido por capas (BFS)",
          " → ".join(order), " → ".join(body["orden_visita"]), body["orden_visita"] == order)

    layers = [["BOD-CENTRO"], ["BAR-NORTE", "BAR-SUR", "PR-ESTACION"], ["PR-PARQUE", "BAR-ORIENTE"]]
    check("Capas: puntos agrupados por número de trayectos desde el origen",
          f"{layers}", f"{body['capas']}", body["capas"] == layers)

    first_step = body["traza"][0]
    check("Traza: el primer paso visita el origen y descubre sus 3 salidas",
          "visita BOD-CENTRO, descubre ['BAR-NORTE', 'BAR-SUR', 'PR-ESTACION']",
          f"visita {first_step['visita']}, descubre {first_step['descubre']}",
          first_step["visita"] == "BOD-CENTRO" and first_step["descubre"] == ["BAR-NORTE", "BAR-SUR", "PR-ESTACION"]
          and len(body["traza"]) == 6)

    status, body = call("GET", "/api/cobertura/bod-centro")
    check("Origen escrito en minúsculas se normaliza",
          "200, origen BOD-CENTRO, 5 alcanzables",
          f"{status}, origen {body['origen']['id']}, {body['total_alcanzables']} alcanzables",
          status == 200 and body["origen"]["id"] == "BOD-CENTRO" and body["total_alcanzables"] == 5)


def origin_destination_scenarios():
    section("Origen y destino: verificar cobertura")
    status, body = call("GET", "/api/cobertura/BOD-CENTRO/BAR-ORIENTE")
    check("Destino alcanzable con camino de evidencia",
          "200, alcanzable, camino BOD-CENTRO → BAR-SUR → BAR-ORIENTE, 2 saltos",
          f"{status}, alcanzable={body.get('alcanzable')}, camino {' → '.join(body.get('camino', []))}, "
          f"{body.get('saltos')} saltos",
          status == 200 and body.get("alcanzable") is True
          and body.get("camino") == ["BOD-CENTRO", "BAR-SUR", "BAR-ORIENTE"] and body.get("saltos") == 2)

    status, body = call("GET", "/api/cobertura/BOD-CENTRO/PR-ESTACION")
    check("Cobertura no es ruta de menor costo (camino de 1 salto y 30 min, no el de 18 min)",
          "200, camino BOD-CENTRO → PR-ESTACION y una nota que remite a la Feature 3",
          f"{status}, camino {' → '.join(body.get('camino', []))}, nota: «{body.get('nota')}»",
          status == 200 and body.get("camino") == ["BOD-CENTRO", "PR-ESTACION"]
          and "Feature 3" in (body.get("nota") or ""))

    status, body = call("GET", "/api/cobertura/BAR-SUR/BAR-SUR")
    check("Origen igual al destino", "200, alcanzable, 0 saltos",
          f"{status}, alcanzable={body.get('alcanzable')}, {body.get('saltos')} saltos",
          status == 200 and body.get("alcanzable") is True and body.get("saltos") == 0)


def unreachable_scenarios():
    section("Relación inexistente: destinos no alcanzables")
    status, body = call("GET", "/api/cobertura/BOD-CENTRO/PR-LAGUNA")
    check("Destino desconectado (sin trayectos de entrada)",
          "200, alcanzable=False y explicación sobre la falta de entradas",
          f"{status}, alcanzable={body.get('alcanzable')}, «{body.get('explicacion')}»",
          status == 200 and body.get("alcanzable") is False and "entrada" in (body.get("explicacion") or ""))

    status, outbound = call("GET", "/api/cobertura/BAR-NORTE/BAR-SUR")
    _, inbound = call("GET", "/api/cobertura/BAR-SUR/BAR-NORTE")
    check("Dirección: BAR-NORTE alcanza BAR-SUR, pero BAR-SUR no alcanza BAR-NORTE",
          "ida alcanzable=True, vuelta alcanzable=False explicando que a BAR-NORTE solo se llega desde BOD-CENTRO",
          f"ida alcanzable={outbound.get('alcanzable')}, vuelta alcanzable={inbound.get('alcanzable')}, "
          f"«{inbound.get('explicacion')}»",
          status == 200 and outbound.get("alcanzable") is True and inbound.get("alcanzable") is False
          and "BOD-CENTRO" in (inbound.get("explicacion") or ""))

    status, body = call("GET", "/api/cobertura/PR-ESTACION")
    check("Origen sin trayectos de salida", "200, 0 alcanzables y mensaje 'no tiene trayectos de salida'",
          f"{status}, {body['total_alcanzables']} alcanzables, «{body['mensaje']}»",
          status == 200 and body["total_alcanzables"] == 0 and "salida" in body["mensaje"])

    status, body = call("GET", "/api/cobertura/PR-ESTACION/BAR-SUR")
    check("Verificar destino desde un origen sin salidas", "200, alcanzable=False explicando que no tiene salidas",
          f"{status}, alcanzable={body.get('alcanzable')}, «{body.get('explicacion')}»",
          status == 200 and body.get("alcanzable") is False and "salida" in (body.get("explicacion") or ""))


def cycle_scenarios():
    section("Ciclos")
    status, body = call("GET", "/api/cobertura/BAR-ORIENTE")
    order = body["orden_visita"]
    check("El ciclo BAR-SUR ⇄ BAR-ORIENTE no genera vueltas infinitas ni visitas repetidas",
          "200, orden BAR-ORIENTE → BAR-SUR → PR-ESTACION sin repetidos",
          f"{status}, orden {' → '.join(order)}",
          status == 200 and order == ["BAR-ORIENTE", "BAR-SUR", "PR-ESTACION"] and len(order) == len(set(order)))

    status, body = call("GET", "/api/cobertura/BAR-NORTE")
    check("Ida y vuelta BOD-CENTRO ⇄ BAR-NORTE: el regreso al origen no se cuenta como destino",
          "200, 5 alcanzables y BAR-NORTE no aparece entre ellos",
          f"{status}, {body['total_alcanzables']} alcanzables {ids(body['alcanzables'])}",
          status == 200 and body["total_alcanzables"] == 5 and "BAR-NORTE" not in ids(body["alcanzables"]))


def nonexistent_and_invalid_scenarios():
    section("Nodo inexistente y datos inválidos")
    expect_error("Origen inexistente", "GET", "/api/cobertura/BOD-NORTE", 404, "punto_inexistente")
    expect_error("Destino inexistente", "GET", "/api/cobertura/BOD-CENTRO/BAR-OESTE", 404, "punto_inexistente")
    expect_error("Origen con formato inválido (espacio interno)", "GET", "/api/cobertura/BAR%20NORTE", 400, "dato_invalido")
    expect_error("Consulta sin origen", "GET", "/api/cobertura", 400, "formato_incorrecto")
    expect_error("Método no permitido en la cobertura", "POST", "/api/cobertura/BOD-CENTRO", 405, "metodo_no_permitido")

    _, network = call("GET", "/api/red")
    summary = network["resumen"]
    check("Las consultas de cobertura no modificaron la red", "7 puntos y 10 conexiones",
          f"{summary['puntos']} puntos y {summary['conexiones']} conexiones",
          (summary["puntos"], summary["conexiones"]) == (7, 10))


def visualization_scenarios():
    section("Visualización del resultado")
    status, content = call("GET", "/api/red/imagen/cobertura/BOD-CENTRO")
    is_png = isinstance(content, bytes) and content.startswith(b"\x89PNG")
    check("Imagen de la cobertura dibujada con NetworkX a partir de nuestro BFS",
          "200 con firma PNG", f"{status} con firma PNG={is_png}", status == 200 and is_png)

    expect_error("Imagen de cobertura con origen inexistente", "GET", "/api/red/imagen/cobertura/NO-EXISTE",
                 404, "punto_inexistente")


def small_network_scenarios():
    section("Red con un solo punto y componente aislado")
    call("DELETE", "/api/red")
    call("POST", "/api/puntos", {"id": "BOD-SOLA", "tipo": "bodega"})
    status, body = call("GET", "/api/cobertura/BOD-SOLA")
    check("Red con un solo punto", "200, 0 alcanzables, 0 no alcanzables",
          f"{status}, {body['total_alcanzables']} alcanzables, {body['total_no_alcanzables']} no alcanzables",
          status == 200 and body["total_alcanzables"] == 0 and body["total_no_alcanzables"] == 0)

    for identifier, point_type in [("PR-CERCA", "punto_recogida"), ("BAR-A", "barrio"), ("BAR-B", "barrio")]:
        call("POST", "/api/puntos", {"id": identifier, "tipo": point_type})
    call("POST", "/api/conexiones", {"origen": "BOD-SOLA", "destino": "PR-CERCA", "costo": 5})
    call("POST", "/api/conexiones", {"origen": "BAR-A", "destino": "BAR-B", "costo": 4})
    call("POST", "/api/conexiones", {"origen": "BAR-B", "destino": "BAR-A", "costo": 4})
    status, body = call("GET", "/api/cobertura/BOD-SOLA/BAR-A")
    check("Destino en un componente aislado (BAR-A ⇄ BAR-B no se conecta con la bodega)",
          "200, alcanzable=False explicando que a BAR-A solo se llega desde BAR-B",
          f"{status}, alcanzable={body.get('alcanzable')}, «{body.get('explicacion')}»",
          status == 200 and body.get("alcanzable") is False and "BAR-B" in (body.get("explicacion") or ""))
    call("DELETE", "/api/red")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    print(f"Pruebas de aceptación · Feature 2 · RutaPyme\nAPI: {BASE_URL}")
    try:
        call("GET", "/api/salud")
    except urllib.error.URLError:
        print("\nNo se pudo conectar con la API. Inicie el servidor con: python main.py")
        sys.exit(2)

    call("DELETE", "/api/red")  # known starting point
    empty_network_scenarios()
    normal_scenarios()
    origin_destination_scenarios()
    unreachable_scenarios()
    cycle_scenarios()
    nonexistent_and_invalid_scenarios()
    visualization_scenarios()
    small_network_scenarios()

    passed = sum(results)
    print(f"\nResultado: {passed}/{len(results)} escenarios aprobados.")
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    main()
