"""Acceptance tests for Feature 3 (lowest-cost route) against the local REST API.

Usage:
    python main.py                               # terminal 1: server
    python pruebas/aceptacion_feature3.py        # terminal 2: tests
    python pruebas/aceptacion_feature3.py http://127.0.0.1:8000   # optional base URL

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


def expect_error(name, method, path, expected_status, expected_code, body=None):
    status, response = call(method, path, body)
    obtained = f"{status} {error_code(response)}"
    if isinstance(response, dict) and "error" in response:
        obtained += f" — «{response['error']['mensaje']}»"
    check(name, f"{expected_status} {expected_code}", obtained,
          status == expected_status and error_code(response) == expected_code)


def arrows(path):
    return " → ".join(path or [])


def section(title):
    print(f"\n=== {title} ===")


# ---------------------------------------------------------------------------
# Scenarios
# ---------------------------------------------------------------------------

def empty_network_scenarios():
    section("Red vacía")
    expect_error("Ruta con la red vacía", "GET", "/api/ruta/BOD-CENTRO/PR-ESTACION", 404, "red_vacia")


def normal_scenarios():
    section("Escenario normal de negocio: ruta de menor costo")
    call("POST", "/api/red/ejemplo")

    status, body = call("GET", "/api/ruta/BOD-CENTRO/PR-ESTACION")
    check("Ruta de menor costo de la bodega a PR-ESTACION",
          "200, existe_ruta, BOD-CENTRO → BAR-SUR → PR-ESTACION, costo 18, 2 saltos",
          f"{status}, existe_ruta={body.get('existe_ruta')}, {arrows(body.get('camino'))}, "
          f"costo {body.get('costo_total')}, {body.get('saltos')} saltos",
          status == 200 and body.get("existe_ruta") is True
          and body.get("camino") == ["BOD-CENTRO", "BAR-SUR", "PR-ESTACION"]
          and body.get("costo_total") == 18 and body.get("saltos") == 2)

    cumulative = [leg["acumulado"] for leg in body.get("tramos", [])]
    check("Tramos con costo acumulado", "[8, 18]", f"{cumulative}", cumulative == [8, 18])

    comparison = body.get("comparacion_menos_saltos", {})
    check("Menos saltos no es menor costo: el directo tiene 1 salto pero cuesta 30 (12 más)",
          "camino BOD-CENTRO → PR-ESTACION, 1 salto, costo 30, diferencia 12",
          f"camino {arrows(comparison.get('camino'))}, {comparison.get('saltos')} salto(s), "
          f"costo {comparison.get('costo')}, diferencia {comparison.get('diferencia')}",
          comparison.get("camino") == ["BOD-CENTRO", "PR-ESTACION"] and comparison.get("saltos") == 1
          and comparison.get("costo") == 30 and comparison.get("diferencia") == 12)

    _, coverage = call("GET", "/api/cobertura/BOD-CENTRO/PR-ESTACION")
    check("La cobertura (Feature 2) sigue respondiendo con el camino de menos trayectos",
          "camino BOD-CENTRO → PR-ESTACION (BFS no se modificó)",
          f"camino {arrows(coverage.get('camino'))}",
          coverage.get("camino") == ["BOD-CENTRO", "PR-ESTACION"])

    order = ["BOD-CENTRO", "BAR-SUR", "BAR-NORTE", "BAR-ORIENTE", "PR-ESTACION"]
    check("Orden en que Dijkstra vuelve definitivos los puntos (de menor a mayor costo)",
          arrows(order), arrows(body.get("orden_definitivos")), body.get("orden_definitivos") == order)

    step_2 = body["traza"][1]
    improvement = {m["punto"]: (m["antes"], m["ahora"]) for m in step_2["mejora"]}
    check("Traza: al cerrar BAR-SUR se mejora PR-ESTACION de 30 a 18 (relajación)",
          "paso 2 definitivo BAR-SUR (8), PR-ESTACION: 30 → 18",
          f"paso 2 definitivo {step_2['definitivo']} ({step_2['costo']}), PR-ESTACION: {improvement.get('PR-ESTACION')}",
          step_2["definitivo"] == "BAR-SUR" and step_2["costo"] == 8 and improvement.get("PR-ESTACION") == (30, 18))

    status, body = call("GET", "/api/ruta/BOD-CENTRO/BAR-ORIENTE")
    check("Cuando la de menos saltos también es la más barata, se informa",
          "200, BOD-CENTRO → BAR-SUR → BAR-ORIENTE, costo 14, diferencia 0",
          f"{status}, {arrows(body.get('camino'))}, costo {body.get('costo_total')}, "
          f"diferencia {body.get('comparacion_menos_saltos', {}).get('diferencia')}",
          status == 200 and body.get("camino") == ["BOD-CENTRO", "BAR-SUR", "BAR-ORIENTE"]
          and body.get("costo_total") == 14 and body["comparacion_menos_saltos"]["diferencia"] == 0)

    status, body = call("GET", "/api/ruta/BOD-CENTRO/PR-PARQUE")
    check("Ruta de 2 trayectos por BAR-NORTE", "200, BOD-CENTRO → BAR-NORTE → PR-PARQUE, costo 19",
          f"{status}, {arrows(body.get('camino'))}, costo {body.get('costo_total')}",
          status == 200 and body.get("camino") == ["BOD-CENTRO", "BAR-NORTE", "PR-PARQUE"]
          and body.get("costo_total") == 19)

    status, body = call("GET", "/api/ruta/bod-centro/pr-estacion")
    check("Origen y destino en minúsculas se normalizan", "200, BOD-CENTRO → PR-ESTACION con costo 18",
          f"{status}, {body.get('origen', {}).get('id')} → {body.get('destino', {}).get('id')} "
          f"con costo {body.get('costo_total')}",
          status == 200 and body["origen"]["id"] == "BOD-CENTRO" and body.get("costo_total") == 18)

    status, body = call("GET", "/api/ruta/BAR-SUR/BAR-SUR")
    check("Origen igual al destino", "200, existe_ruta, camino [BAR-SUR], costo 0, 0 saltos",
          f"{status}, existe_ruta={body.get('existe_ruta')}, camino {body.get('camino')}, "
          f"costo {body.get('costo_total')}, {body.get('saltos')} saltos",
          status == 200 and body.get("existe_ruta") is True and body.get("camino") == ["BAR-SUR"]
          and body.get("costo_total") == 0 and body.get("saltos") == 0)


def cycle_scenarios():
    section("Ciclos")
    status, body = call("GET", "/api/ruta/BAR-NORTE/BAR-SUR")
    check("Ruta que pasa por el ciclo BAR-NORTE ⇄ BOD-CENTRO (15 + 8 = 23, no 7 + 9 + 11 = 27)",
          "200, BAR-NORTE → BOD-CENTRO → BAR-SUR, costo 23",
          f"{status}, {arrows(body.get('camino'))}, costo {body.get('costo_total')}",
          status == 200 and body.get("camino") == ["BAR-NORTE", "BOD-CENTRO", "BAR-SUR"]
          and body.get("costo_total") == 23)

    order = body.get("orden_definitivos", [])
    check("Los ciclos no repiten puntos definitivos", "cada punto aparece una sola vez",
          arrows(order), len(order) == len(set(order)))


def no_route_scenarios():
    section("Ruta inexistente")
    status, body = call("GET", "/api/ruta/BOD-CENTRO/PR-LAGUNA")
    check("Destino sin trayectos de entrada",
          "200, existe_ruta=False y explicación sobre la falta de entradas",
          f"{status}, existe_ruta={body.get('existe_ruta')}, «{body.get('explicacion')}»",
          status == 200 and body.get("existe_ruta") is False and "entrada" in (body.get("explicacion") or "")
          and "camino" not in body)

    status, body = call("GET", "/api/ruta/BAR-SUR/BAR-NORTE")
    check("Dirección: de BAR-SUR no se puede llegar a BAR-NORTE",
          "200, existe_ruta=False explicando que a BAR-NORTE solo se llega desde BOD-CENTRO",
          f"{status}, existe_ruta={body.get('existe_ruta')}, «{body.get('explicacion')}»",
          status == 200 and body.get("existe_ruta") is False and "BOD-CENTRO" in (body.get("explicacion") or ""))

    status, body = call("GET", "/api/ruta/PR-ESTACION/BAR-SUR")
    check("Origen sin trayectos de salida", "200, existe_ruta=False explicando que no tiene salidas",
          f"{status}, existe_ruta={body.get('existe_ruta')}, «{body.get('explicacion')}»",
          status == 200 and body.get("existe_ruta") is False and "salida" in (body.get("explicacion") or ""))


def nonexistent_and_invalid_scenarios():
    section("Nodo inexistente y formato incorrecto")
    expect_error("Origen inexistente", "GET", "/api/ruta/BOD-NORTE/PR-ESTACION", 404, "punto_inexistente")
    expect_error("Destino inexistente", "GET", "/api/ruta/BOD-CENTRO/BAR-OESTE", 404, "punto_inexistente")
    expect_error("Origen con formato inválido (espacio interno)", "GET", "/api/ruta/BAR%20NORTE/BAR-SUR",
                 400, "dato_invalido")
    expect_error("Consulta sin origen ni destino", "GET", "/api/ruta", 400, "formato_incorrecto")
    expect_error("Consulta sin destino", "GET", "/api/ruta/BOD-CENTRO", 400, "formato_incorrecto")
    expect_error("Método no permitido en la ruta", "POST", "/api/ruta/BOD-CENTRO/PR-ESTACION",
                 405, "metodo_no_permitido")


def invalid_cost_scenarios():
    section("Costo inválido: condición de Dijkstra (costos mayores que 0)")
    edge = {"origen": "BAR-SUR", "destino": "PR-PARQUE"}
    expect_error("Costo negativo que abarataría una ruta (-20) se rechaza", "POST", "/api/conexiones",
                 400, "dato_invalido", {**edge, "costo": -20})
    expect_error("Costo cero se rechaza", "POST", "/api/conexiones", 400, "dato_invalido", {**edge, "costo": 0})
    expect_error("Costo que no es número se rechaza", "POST", "/api/conexiones", 400, "dato_invalido",
                 {**edge, "costo": "doce"})

    status, body = call("GET", "/api/ruta/BOD-CENTRO/PR-PARQUE")
    check("Los costos rechazados no cambiaron la ruta", "200, costo 19 por BAR-NORTE",
          f"{status}, costo {body.get('costo_total')} por {arrows(body.get('camino'))}",
          status == 200 and body.get("costo_total") == 19)

    _, network = call("GET", "/api/red")
    summary = network["resumen"]
    check("Las consultas de ruta no modificaron la red", "7 puntos y 10 conexiones",
          f"{summary['puntos']} puntos y {summary['conexiones']} conexiones",
          (summary["puntos"], summary["conexiones"]) == (7, 10))


def network_change_scenarios():
    section("La ruta se recalcula cuando cambia la red")
    call("POST", "/api/conexiones", {"origen": "BAR-SUR", "destino": "PR-LAGUNA", "costo": 4})
    status, body = call("GET", "/api/ruta/BOD-CENTRO/PR-LAGUNA")
    check("Al registrar BAR-SUR → PR-LAGUNA aparece la ruta que antes no existía",
          "200, existe_ruta, BOD-CENTRO → BAR-SUR → PR-LAGUNA, costo 12",
          f"{status}, existe_ruta={body.get('existe_ruta')}, {arrows(body.get('camino'))}, "
          f"costo {body.get('costo_total')}",
          status == 200 and body.get("existe_ruta") is True
          and body.get("camino") == ["BOD-CENTRO", "BAR-SUR", "PR-LAGUNA"] and body.get("costo_total") == 12)

    call("DELETE", "/api/red")
    for identifier, point_type in [("BOD-A", "bodega"), ("BAR-X", "barrio"), ("PR-Y", "punto_recogida")]:
        call("POST", "/api/puntos", {"id": identifier, "tipo": point_type})
    call("POST", "/api/conexiones", {"origen": "BOD-A", "destino": "PR-Y", "costo": 7.5})
    call("POST", "/api/conexiones", {"origen": "BOD-A", "destino": "BAR-X", "costo": 2.5})
    call("POST", "/api/conexiones", {"origen": "BAR-X", "destino": "PR-Y", "costo": 2.5})
    status, body = call("GET", "/api/ruta/BOD-A/PR-Y")
    check("Costos decimales: 2.5 + 2.5 = 5 gana a 7.5 directo",
          "200, BOD-A → BAR-X → PR-Y, costo 5",
          f"{status}, {arrows(body.get('camino'))}, costo {body.get('costo_total')}",
          status == 200 and body.get("camino") == ["BOD-A", "BAR-X", "PR-Y"] and body.get("costo_total") == 5)
    call("POST", "/api/red/ejemplo")


def visualization_scenarios():
    section("Visualización del resultado")
    status, content = call("GET", "/api/red/imagen/ruta/BOD-CENTRO/PR-ESTACION")
    is_png = isinstance(content, bytes) and content.startswith(b"\x89PNG")
    check("Imagen de la ruta dibujada con NetworkX a partir de nuestro Dijkstra",
          "200 con firma PNG", f"{status} con firma PNG={is_png}", status == 200 and is_png)

    status, content = call("GET", "/api/red/imagen/ruta/BOD-CENTRO/PR-LAGUNA")
    is_png = isinstance(content, bytes) and content.startswith(b"\x89PNG")
    check("Imagen cuando no existe ruta (solo marca origen y destino)",
          "200 con firma PNG", f"{status} con firma PNG={is_png}", status == 200 and is_png)

    expect_error("Imagen de ruta con destino inexistente", "GET", "/api/red/imagen/ruta/BOD-CENTRO/NO-EXISTE",
                 404, "punto_inexistente")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    print(f"Pruebas de aceptación · Feature 3 · RutaPyme\nAPI: {BASE_URL}")
    try:
        call("GET", "/api/salud")
    except urllib.error.URLError:
        print("\nNo se pudo conectar con la API. Inicie el servidor con: python main.py")
        sys.exit(2)

    call("DELETE", "/api/red")  # known starting point
    empty_network_scenarios()
    normal_scenarios()
    cycle_scenarios()
    no_route_scenarios()
    nonexistent_and_invalid_scenarios()
    invalid_cost_scenarios()
    network_change_scenarios()
    visualization_scenarios()
    call("DELETE", "/api/red")

    passed = sum(results)
    print(f"\nResultado: {passed}/{len(results)} escenarios aprobados.")
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    main()
