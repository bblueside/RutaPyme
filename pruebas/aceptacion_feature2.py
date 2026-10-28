"""Pruebas de aceptación de la Feature 2 (cobertura de entregas) contra la API REST local.

Uso:
    python main.py                               # terminal 1: servidor
    python pruebas/aceptacion_feature2.py        # terminal 2: pruebas
    python pruebas/aceptacion_feature2.py http://127.0.0.1:8000   # URL base opcional

Solo usa la biblioteca estándar (urllib). Para cada escenario imprime qué se ejecutó,
qué se esperaba, qué se obtuvo y si pasó o falló. Empieza vaciando la red (DELETE /api/red)
y usa la red sintética de datos/red_ejemplo.json, por lo que se puede repetir cuantas veces se quiera.
"""

import json
import sys
import urllib.error
import urllib.request

URL_BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000").rstrip("/")
resultados = []


# ---------------------------------------------------------------------------
# Apoyo
# ---------------------------------------------------------------------------

def llamar(metodo, ruta, cuerpo=None):
    """Hace la petición y devuelve (estado HTTP, cuerpo JSON). Si no es JSON, devuelve los bytes."""
    datos = json.dumps(cuerpo).encode("utf-8") if cuerpo is not None else None
    encabezados = {"Content-Type": "application/json"} if datos is not None else {}
    peticion = urllib.request.Request(URL_BASE + ruta, data=datos, method=metodo, headers=encabezados)
    try:
        with urllib.request.urlopen(peticion, timeout=30) as respuesta:
            estado, tipo, contenido = respuesta.status, respuesta.headers.get("Content-Type", ""), respuesta.read()
    except urllib.error.HTTPError as error:
        estado, tipo, contenido = error.code, error.headers.get("Content-Type", ""), error.read()
    if tipo.startswith("application/json"):
        return estado, json.loads(contenido.decode("utf-8"))
    return estado, contenido


def codigo_error(cuerpo):
    return cuerpo.get("error", {}).get("codigo") if isinstance(cuerpo, dict) else None


def verificar(nombre, esperado, obtenido, paso):
    resultados.append(paso)
    marca = "PASÓ" if paso else "FALLÓ"
    print(f"[{marca}] {len(resultados):02d}. {nombre}")
    print(f"        Esperado: {esperado}")
    print(f"        Obtenido: {obtenido}")


def esperar_error(nombre, metodo, ruta, estado_esperado, codigo_esperado):
    estado, respuesta = llamar(metodo, ruta)
    obtenido = f"{estado} {codigo_error(respuesta)}"
    if "error" in respuesta:
        obtenido += f" — «{respuesta['error']['mensaje']}»"
    verificar(nombre, f"{estado_esperado} {codigo_esperado}", obtenido,
              estado == estado_esperado and codigo_error(respuesta) == codigo_esperado)


def ids(lista):
    return [elemento["id"] for elemento in lista]


def seccion(titulo):
    print(f"\n=== {titulo} ===")


# ---------------------------------------------------------------------------
# Escenarios
# ---------------------------------------------------------------------------

def escenarios_red_vacia():
    seccion("Red vacía")
    esperar_error("Cobertura desde un origen con la red vacía", "GET", "/api/cobertura/BOD-CENTRO", 404, "red_vacia")
    esperar_error("Origen y destino con la red vacía", "GET", "/api/cobertura/BOD-CENTRO/BAR-SUR", 404, "red_vacia")


def escenarios_normales():
    seccion("Escenario normal de negocio: cobertura desde la bodega")
    llamar("POST", "/api/red/ejemplo")

    estado, cuerpo = llamar("GET", "/api/cobertura/BOD-CENTRO")
    esperados = {"BAR-NORTE", "BAR-SUR", "PR-ESTACION", "PR-PARQUE", "BAR-ORIENTE"}
    verificar("Destinos alcanzables desde BOD-CENTRO",
              f"200, 5 alcanzables {sorted(esperados)}",
              f"{estado}, {cuerpo['total_alcanzables']} alcanzables {sorted(ids(cuerpo['alcanzables']))}",
              estado == 200 and cuerpo["total_alcanzables"] == 5 and set(ids(cuerpo["alcanzables"])) == esperados)

    no_alcanzables = cuerpo["no_alcanzables"]
    verificar("Punto desconectado listado con su motivo",
              "PR-LAGUNA: no tiene trayectos de entrada",
              "; ".join(f"{p['id']}: {p['motivo']}" for p in no_alcanzables),
              ids(no_alcanzables) == ["PR-LAGUNA"] and "entrada" in no_alcanzables[0]["motivo"])

    orden = ["BOD-CENTRO", "BAR-NORTE", "BAR-SUR", "PR-ESTACION", "PR-PARQUE", "BAR-ORIENTE"]
    verificar("Orden de visita del recorrido por capas (BFS)",
              " → ".join(orden), " → ".join(cuerpo["orden_visita"]), cuerpo["orden_visita"] == orden)

    capas = [["BOD-CENTRO"], ["BAR-NORTE", "BAR-SUR", "PR-ESTACION"], ["PR-PARQUE", "BAR-ORIENTE"]]
    verificar("Capas: puntos agrupados por número de trayectos desde el origen",
              f"{capas}", f"{cuerpo['capas']}", cuerpo["capas"] == capas)

    primer_paso = cuerpo["traza"][0]
    verificar("Traza: el primer paso visita el origen y descubre sus 3 salidas",
              "visita BOD-CENTRO, descubre ['BAR-NORTE', 'BAR-SUR', 'PR-ESTACION']",
              f"visita {primer_paso['visita']}, descubre {primer_paso['descubre']}",
              primer_paso["visita"] == "BOD-CENTRO" and primer_paso["descubre"] == ["BAR-NORTE", "BAR-SUR", "PR-ESTACION"]
              and len(cuerpo["traza"]) == 6)

    estado, cuerpo = llamar("GET", "/api/cobertura/bod-centro")
    verificar("Origen escrito en minúsculas se normaliza",
              "200, origen BOD-CENTRO, 5 alcanzables",
              f"{estado}, origen {cuerpo['origen']['id']}, {cuerpo['total_alcanzables']} alcanzables",
              estado == 200 and cuerpo["origen"]["id"] == "BOD-CENTRO" and cuerpo["total_alcanzables"] == 5)


def escenarios_origen_destino():
    seccion("Origen y destino: verificar cobertura")
    estado, cuerpo = llamar("GET", "/api/cobertura/BOD-CENTRO/BAR-ORIENTE")
    verificar("Destino alcanzable con camino de evidencia",
              "200, alcanzable, camino BOD-CENTRO → BAR-SUR → BAR-ORIENTE, 2 saltos",
              f"{estado}, alcanzable={cuerpo.get('alcanzable')}, camino {' → '.join(cuerpo.get('camino', []))}, "
              f"{cuerpo.get('saltos')} saltos",
              estado == 200 and cuerpo.get("alcanzable") is True
              and cuerpo.get("camino") == ["BOD-CENTRO", "BAR-SUR", "BAR-ORIENTE"] and cuerpo.get("saltos") == 2)

    estado, cuerpo = llamar("GET", "/api/cobertura/BOD-CENTRO/PR-ESTACION")
    verificar("Cobertura no es ruta de menor costo (camino de 1 salto y 30 min, no el de 18 min)",
              "200, camino BOD-CENTRO → PR-ESTACION y una nota que remite a la Feature 3",
              f"{estado}, camino {' → '.join(cuerpo.get('camino', []))}, nota: «{cuerpo.get('nota')}»",
              estado == 200 and cuerpo.get("camino") == ["BOD-CENTRO", "PR-ESTACION"]
              and "Feature 3" in (cuerpo.get("nota") or ""))

    estado, cuerpo = llamar("GET", "/api/cobertura/BAR-SUR/BAR-SUR")
    verificar("Origen igual al destino", "200, alcanzable, 0 saltos",
              f"{estado}, alcanzable={cuerpo.get('alcanzable')}, {cuerpo.get('saltos')} saltos",
              estado == 200 and cuerpo.get("alcanzable") is True and cuerpo.get("saltos") == 0)


def escenarios_no_alcanzables():
    seccion("Relación inexistente: destinos no alcanzables")
    estado, cuerpo = llamar("GET", "/api/cobertura/BOD-CENTRO/PR-LAGUNA")
    verificar("Destino desconectado (sin trayectos de entrada)",
              "200, alcanzable=False y explicación sobre la falta de entradas",
              f"{estado}, alcanzable={cuerpo.get('alcanzable')}, «{cuerpo.get('explicacion')}»",
              estado == 200 and cuerpo.get("alcanzable") is False and "entrada" in (cuerpo.get("explicacion") or ""))

    estado, ida = llamar("GET", "/api/cobertura/BAR-NORTE/BAR-SUR")
    _, vuelta = llamar("GET", "/api/cobertura/BAR-SUR/BAR-NORTE")
    verificar("Dirección: BAR-NORTE alcanza BAR-SUR, pero BAR-SUR no alcanza BAR-NORTE",
              "ida alcanzable=True, vuelta alcanzable=False explicando que a BAR-NORTE solo se llega desde BOD-CENTRO",
              f"ida alcanzable={ida.get('alcanzable')}, vuelta alcanzable={vuelta.get('alcanzable')}, "
              f"«{vuelta.get('explicacion')}»",
              estado == 200 and ida.get("alcanzable") is True and vuelta.get("alcanzable") is False
              and "BOD-CENTRO" in (vuelta.get("explicacion") or ""))

    estado, cuerpo = llamar("GET", "/api/cobertura/PR-ESTACION")
    verificar("Origen sin trayectos de salida", "200, 0 alcanzables y mensaje 'no tiene trayectos de salida'",
              f"{estado}, {cuerpo['total_alcanzables']} alcanzables, «{cuerpo['mensaje']}»",
              estado == 200 and cuerpo["total_alcanzables"] == 0 and "salida" in cuerpo["mensaje"])

    estado, cuerpo = llamar("GET", "/api/cobertura/PR-ESTACION/BAR-SUR")
    verificar("Verificar destino desde un origen sin salidas", "200, alcanzable=False explicando que no tiene salidas",
              f"{estado}, alcanzable={cuerpo.get('alcanzable')}, «{cuerpo.get('explicacion')}»",
              estado == 200 and cuerpo.get("alcanzable") is False and "salida" in (cuerpo.get("explicacion") or ""))


def escenarios_ciclos():
    seccion("Ciclos")
    estado, cuerpo = llamar("GET", "/api/cobertura/BAR-ORIENTE")
    orden = cuerpo["orden_visita"]
    verificar("El ciclo BAR-SUR ⇄ BAR-ORIENTE no genera vueltas infinitas ni visitas repetidas",
              "200, orden BAR-ORIENTE → BAR-SUR → PR-ESTACION sin repetidos",
              f"{estado}, orden {' → '.join(orden)}",
              estado == 200 and orden == ["BAR-ORIENTE", "BAR-SUR", "PR-ESTACION"] and len(orden) == len(set(orden)))

    estado, cuerpo = llamar("GET", "/api/cobertura/BAR-NORTE")
    verificar("Ida y vuelta BOD-CENTRO ⇄ BAR-NORTE: el regreso al origen no se cuenta como destino",
              "200, 5 alcanzables y BAR-NORTE no aparece entre ellos",
              f"{estado}, {cuerpo['total_alcanzables']} alcanzables {ids(cuerpo['alcanzables'])}",
              estado == 200 and cuerpo["total_alcanzables"] == 5 and "BAR-NORTE" not in ids(cuerpo["alcanzables"]))


def escenarios_inexistentes_e_invalidos():
    seccion("Nodo inexistente y datos inválidos")
    esperar_error("Origen inexistente", "GET", "/api/cobertura/BOD-NORTE", 404, "punto_inexistente")
    esperar_error("Destino inexistente", "GET", "/api/cobertura/BOD-CENTRO/BAR-OESTE", 404, "punto_inexistente")
    esperar_error("Origen con formato inválido (espacio interno)", "GET", "/api/cobertura/BAR%20NORTE", 400, "dato_invalido")
    esperar_error("Consulta sin origen", "GET", "/api/cobertura", 400, "formato_incorrecto")
    esperar_error("Método no permitido en la cobertura", "POST", "/api/cobertura/BOD-CENTRO", 405, "metodo_no_permitido")

    _, red = llamar("GET", "/api/red")
    resumen = red["resumen"]
    verificar("Las consultas de cobertura no modificaron la red", "7 puntos y 10 conexiones",
              f"{resumen['puntos']} puntos y {resumen['conexiones']} conexiones",
              (resumen["puntos"], resumen["conexiones"]) == (7, 10))


def escenarios_red_pequena():
    seccion("Red con un solo punto y componente aislado")
    llamar("DELETE", "/api/red")
    llamar("POST", "/api/puntos", {"id": "BOD-SOLA", "tipo": "bodega"})
    estado, cuerpo = llamar("GET", "/api/cobertura/BOD-SOLA")
    verificar("Red con un solo punto", "200, 0 alcanzables, 0 no alcanzables",
              f"{estado}, {cuerpo['total_alcanzables']} alcanzables, {cuerpo['total_no_alcanzables']} no alcanzables",
              estado == 200 and cuerpo["total_alcanzables"] == 0 and cuerpo["total_no_alcanzables"] == 0)

    for identificador, tipo in [("PR-CERCA", "punto_recogida"), ("BAR-A", "barrio"), ("BAR-B", "barrio")]:
        llamar("POST", "/api/puntos", {"id": identificador, "tipo": tipo})
    llamar("POST", "/api/conexiones", {"origen": "BOD-SOLA", "destino": "PR-CERCA", "costo": 5})
    llamar("POST", "/api/conexiones", {"origen": "BAR-A", "destino": "BAR-B", "costo": 4})
    llamar("POST", "/api/conexiones", {"origen": "BAR-B", "destino": "BAR-A", "costo": 4})
    estado, cuerpo = llamar("GET", "/api/cobertura/BOD-SOLA/BAR-A")
    verificar("Destino en un componente aislado (BAR-A ⇄ BAR-B no se conecta con la bodega)",
              "200, alcanzable=False explicando que a BAR-A solo se llega desde BAR-B",
              f"{estado}, alcanzable={cuerpo.get('alcanzable')}, «{cuerpo.get('explicacion')}»",
              estado == 200 and cuerpo.get("alcanzable") is False and "BAR-B" in (cuerpo.get("explicacion") or ""))
    llamar("DELETE", "/api/red")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    print(f"Pruebas de aceptación · Feature 2 · RutaPyme\nAPI: {URL_BASE}")
    try:
        llamar("GET", "/api/salud")
    except urllib.error.URLError:
        print("\nNo se pudo conectar con la API. Inicie el servidor con: python main.py")
        sys.exit(2)

    llamar("DELETE", "/api/red")  # punto de partida conocido
    escenarios_red_vacia()
    escenarios_normales()
    escenarios_origen_destino()
    escenarios_no_alcanzables()
    escenarios_ciclos()
    escenarios_inexistentes_e_invalidos()
    escenarios_red_pequena()

    aprobados = sum(resultados)
    print(f"\nResultado: {aprobados}/{len(resultados)} escenarios aprobados.")
    sys.exit(0 if aprobados == len(resultados) else 1)


if __name__ == "__main__":
    main()
