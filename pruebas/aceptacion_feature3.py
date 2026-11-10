"""Pruebas de aceptación de la Feature 3 (ruta de menor costo) contra la API REST local.

Uso:
    python main.py                               # terminal 1: servidor
    python pruebas/aceptacion_feature3.py        # terminal 2: pruebas
    python pruebas/aceptacion_feature3.py http://127.0.0.1:8000   # URL base opcional

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


def esperar_error(nombre, metodo, ruta, estado_esperado, codigo_esperado, cuerpo=None):
    estado, respuesta = llamar(metodo, ruta, cuerpo)
    obtenido = f"{estado} {codigo_error(respuesta)}"
    if isinstance(respuesta, dict) and "error" in respuesta:
        obtenido += f" — «{respuesta['error']['mensaje']}»"
    verificar(nombre, f"{estado_esperado} {codigo_esperado}", obtenido,
              estado == estado_esperado and codigo_error(respuesta) == codigo_esperado)


def flechas(camino):
    return " → ".join(camino or [])


def seccion(titulo):
    print(f"\n=== {titulo} ===")


# ---------------------------------------------------------------------------
# Escenarios
# ---------------------------------------------------------------------------

def escenarios_red_vacia():
    seccion("Red vacía")
    esperar_error("Ruta con la red vacía", "GET", "/api/ruta/BOD-CENTRO/PR-ESTACION", 404, "red_vacia")


def escenarios_normales():
    seccion("Escenario normal de negocio: ruta de menor costo")
    llamar("POST", "/api/red/ejemplo")

    estado, cuerpo = llamar("GET", "/api/ruta/BOD-CENTRO/PR-ESTACION")
    verificar("Ruta de menor costo de la bodega a PR-ESTACION",
              "200, existe_ruta, BOD-CENTRO → BAR-SUR → PR-ESTACION, costo 18, 2 saltos",
              f"{estado}, existe_ruta={cuerpo.get('existe_ruta')}, {flechas(cuerpo.get('camino'))}, "
              f"costo {cuerpo.get('costo_total')}, {cuerpo.get('saltos')} saltos",
              estado == 200 and cuerpo.get("existe_ruta") is True
              and cuerpo.get("camino") == ["BOD-CENTRO", "BAR-SUR", "PR-ESTACION"]
              and cuerpo.get("costo_total") == 18 and cuerpo.get("saltos") == 2)

    acumulados = [tramo["acumulado"] for tramo in cuerpo.get("tramos", [])]
    verificar("Tramos con costo acumulado", "[8, 18]", f"{acumulados}", acumulados == [8, 18])

    comparacion = cuerpo.get("comparacion_menos_saltos", {})
    verificar("Menos saltos no es menor costo: el directo tiene 1 salto pero cuesta 30 (12 más)",
              "camino BOD-CENTRO → PR-ESTACION, 1 salto, costo 30, diferencia 12",
              f"camino {flechas(comparacion.get('camino'))}, {comparacion.get('saltos')} salto(s), "
              f"costo {comparacion.get('costo')}, diferencia {comparacion.get('diferencia')}",
              comparacion.get("camino") == ["BOD-CENTRO", "PR-ESTACION"] and comparacion.get("saltos") == 1
              and comparacion.get("costo") == 30 and comparacion.get("diferencia") == 12)

    _, cobertura = llamar("GET", "/api/cobertura/BOD-CENTRO/PR-ESTACION")
    verificar("La cobertura (Feature 2) sigue respondiendo con el camino de menos trayectos",
              "camino BOD-CENTRO → PR-ESTACION (BFS no se modificó)",
              f"camino {flechas(cobertura.get('camino'))}",
              cobertura.get("camino") == ["BOD-CENTRO", "PR-ESTACION"])

    orden = ["BOD-CENTRO", "BAR-SUR", "BAR-NORTE", "BAR-ORIENTE", "PR-ESTACION"]
    verificar("Orden en que Dijkstra vuelve definitivos los puntos (de menor a mayor costo)",
              flechas(orden), flechas(cuerpo.get("orden_definitivos")), cuerpo.get("orden_definitivos") == orden)

    paso_2 = cuerpo["traza"][1]
    mejora = {m["punto"]: (m["antes"], m["ahora"]) for m in paso_2["mejora"]}
    verificar("Traza: al cerrar BAR-SUR se mejora PR-ESTACION de 30 a 18 (relajación)",
              "paso 2 definitivo BAR-SUR (8), PR-ESTACION: 30 → 18",
              f"paso 2 definitivo {paso_2['definitivo']} ({paso_2['costo']}), PR-ESTACION: {mejora.get('PR-ESTACION')}",
              paso_2["definitivo"] == "BAR-SUR" and paso_2["costo"] == 8 and mejora.get("PR-ESTACION") == (30, 18))

    estado, cuerpo = llamar("GET", "/api/ruta/BOD-CENTRO/BAR-ORIENTE")
    verificar("Cuando la de menos saltos también es la más barata, se informa",
              "200, BOD-CENTRO → BAR-SUR → BAR-ORIENTE, costo 14, diferencia 0",
              f"{estado}, {flechas(cuerpo.get('camino'))}, costo {cuerpo.get('costo_total')}, "
              f"diferencia {cuerpo.get('comparacion_menos_saltos', {}).get('diferencia')}",
              estado == 200 and cuerpo.get("camino") == ["BOD-CENTRO", "BAR-SUR", "BAR-ORIENTE"]
              and cuerpo.get("costo_total") == 14 and cuerpo["comparacion_menos_saltos"]["diferencia"] == 0)

    estado, cuerpo = llamar("GET", "/api/ruta/BOD-CENTRO/PR-PARQUE")
    verificar("Ruta de 2 trayectos por BAR-NORTE", "200, BOD-CENTRO → BAR-NORTE → PR-PARQUE, costo 19",
              f"{estado}, {flechas(cuerpo.get('camino'))}, costo {cuerpo.get('costo_total')}",
              estado == 200 and cuerpo.get("camino") == ["BOD-CENTRO", "BAR-NORTE", "PR-PARQUE"]
              and cuerpo.get("costo_total") == 19)

    estado, cuerpo = llamar("GET", "/api/ruta/bod-centro/pr-estacion")
    verificar("Origen y destino en minúsculas se normalizan", "200, BOD-CENTRO → PR-ESTACION con costo 18",
              f"{estado}, {cuerpo.get('origen', {}).get('id')} → {cuerpo.get('destino', {}).get('id')} "
              f"con costo {cuerpo.get('costo_total')}",
              estado == 200 and cuerpo["origen"]["id"] == "BOD-CENTRO" and cuerpo.get("costo_total") == 18)

    estado, cuerpo = llamar("GET", "/api/ruta/BAR-SUR/BAR-SUR")
    verificar("Origen igual al destino", "200, existe_ruta, camino [BAR-SUR], costo 0, 0 saltos",
              f"{estado}, existe_ruta={cuerpo.get('existe_ruta')}, camino {cuerpo.get('camino')}, "
              f"costo {cuerpo.get('costo_total')}, {cuerpo.get('saltos')} saltos",
              estado == 200 and cuerpo.get("existe_ruta") is True and cuerpo.get("camino") == ["BAR-SUR"]
              and cuerpo.get("costo_total") == 0 and cuerpo.get("saltos") == 0)


def escenarios_ciclos():
    seccion("Ciclos")
    estado, cuerpo = llamar("GET", "/api/ruta/BAR-NORTE/BAR-SUR")
    verificar("Ruta que pasa por el ciclo BAR-NORTE ⇄ BOD-CENTRO (15 + 8 = 23, no 7 + 9 + 11 = 27)",
              "200, BAR-NORTE → BOD-CENTRO → BAR-SUR, costo 23",
              f"{estado}, {flechas(cuerpo.get('camino'))}, costo {cuerpo.get('costo_total')}",
              estado == 200 and cuerpo.get("camino") == ["BAR-NORTE", "BOD-CENTRO", "BAR-SUR"]
              and cuerpo.get("costo_total") == 23)

    orden = cuerpo.get("orden_definitivos", [])
    verificar("Los ciclos no repiten puntos definitivos", "cada punto aparece una sola vez",
              flechas(orden), len(orden) == len(set(orden)))


def escenarios_sin_ruta():
    seccion("Ruta inexistente")
    estado, cuerpo = llamar("GET", "/api/ruta/BOD-CENTRO/PR-LAGUNA")
    verificar("Destino sin trayectos de entrada",
              "200, existe_ruta=False y explicación sobre la falta de entradas",
              f"{estado}, existe_ruta={cuerpo.get('existe_ruta')}, «{cuerpo.get('explicacion')}»",
              estado == 200 and cuerpo.get("existe_ruta") is False and "entrada" in (cuerpo.get("explicacion") or "")
              and "camino" not in cuerpo)

    estado, cuerpo = llamar("GET", "/api/ruta/BAR-SUR/BAR-NORTE")
    verificar("Dirección: de BAR-SUR no se puede llegar a BAR-NORTE",
              "200, existe_ruta=False explicando que a BAR-NORTE solo se llega desde BOD-CENTRO",
              f"{estado}, existe_ruta={cuerpo.get('existe_ruta')}, «{cuerpo.get('explicacion')}»",
              estado == 200 and cuerpo.get("existe_ruta") is False and "BOD-CENTRO" in (cuerpo.get("explicacion") or ""))

    estado, cuerpo = llamar("GET", "/api/ruta/PR-ESTACION/BAR-SUR")
    verificar("Origen sin trayectos de salida", "200, existe_ruta=False explicando que no tiene salidas",
              f"{estado}, existe_ruta={cuerpo.get('existe_ruta')}, «{cuerpo.get('explicacion')}»",
              estado == 200 and cuerpo.get("existe_ruta") is False and "salida" in (cuerpo.get("explicacion") or ""))


def escenarios_inexistentes_e_invalidos():
    seccion("Nodo inexistente y formato incorrecto")
    esperar_error("Origen inexistente", "GET", "/api/ruta/BOD-NORTE/PR-ESTACION", 404, "punto_inexistente")
    esperar_error("Destino inexistente", "GET", "/api/ruta/BOD-CENTRO/BAR-OESTE", 404, "punto_inexistente")
    esperar_error("Origen con formato inválido (espacio interno)", "GET", "/api/ruta/BAR%20NORTE/BAR-SUR",
                  400, "dato_invalido")
    esperar_error("Consulta sin origen ni destino", "GET", "/api/ruta", 400, "formato_incorrecto")
    esperar_error("Consulta sin destino", "GET", "/api/ruta/BOD-CENTRO", 400, "formato_incorrecto")
    esperar_error("Método no permitido en la ruta", "POST", "/api/ruta/BOD-CENTRO/PR-ESTACION",
                  405, "metodo_no_permitido")


def escenarios_costos_invalidos():
    seccion("Costo inválido: condición de Dijkstra (costos mayores que 0)")
    trayecto = {"origen": "BAR-SUR", "destino": "PR-PARQUE"}
    esperar_error("Costo negativo que abarataría una ruta (-20) se rechaza", "POST", "/api/conexiones",
                  400, "dato_invalido", {**trayecto, "costo": -20})
    esperar_error("Costo cero se rechaza", "POST", "/api/conexiones", 400, "dato_invalido", {**trayecto, "costo": 0})
    esperar_error("Costo que no es número se rechaza", "POST", "/api/conexiones", 400, "dato_invalido",
                  {**trayecto, "costo": "doce"})

    estado, cuerpo = llamar("GET", "/api/ruta/BOD-CENTRO/PR-PARQUE")
    verificar("Los costos rechazados no cambiaron la ruta", "200, costo 19 por BAR-NORTE",
              f"{estado}, costo {cuerpo.get('costo_total')} por {flechas(cuerpo.get('camino'))}",
              estado == 200 and cuerpo.get("costo_total") == 19)

    _, red = llamar("GET", "/api/red")
    resumen = red["resumen"]
    verificar("Las consultas de ruta no modificaron la red", "7 puntos y 10 conexiones",
              f"{resumen['puntos']} puntos y {resumen['conexiones']} conexiones",
              (resumen["puntos"], resumen["conexiones"]) == (7, 10))


def escenarios_red_cambia():
    seccion("La ruta se recalcula cuando cambia la red")
    llamar("POST", "/api/conexiones", {"origen": "BAR-SUR", "destino": "PR-LAGUNA", "costo": 4})
    estado, cuerpo = llamar("GET", "/api/ruta/BOD-CENTRO/PR-LAGUNA")
    verificar("Al registrar BAR-SUR → PR-LAGUNA aparece la ruta que antes no existía",
              "200, existe_ruta, BOD-CENTRO → BAR-SUR → PR-LAGUNA, costo 12",
              f"{estado}, existe_ruta={cuerpo.get('existe_ruta')}, {flechas(cuerpo.get('camino'))}, "
              f"costo {cuerpo.get('costo_total')}",
              estado == 200 and cuerpo.get("existe_ruta") is True
              and cuerpo.get("camino") == ["BOD-CENTRO", "BAR-SUR", "PR-LAGUNA"] and cuerpo.get("costo_total") == 12)

    llamar("DELETE", "/api/red")
    for identificador, tipo in [("BOD-A", "bodega"), ("BAR-X", "barrio"), ("PR-Y", "punto_recogida")]:
        llamar("POST", "/api/puntos", {"id": identificador, "tipo": tipo})
    llamar("POST", "/api/conexiones", {"origen": "BOD-A", "destino": "PR-Y", "costo": 7.5})
    llamar("POST", "/api/conexiones", {"origen": "BOD-A", "destino": "BAR-X", "costo": 2.5})
    llamar("POST", "/api/conexiones", {"origen": "BAR-X", "destino": "PR-Y", "costo": 2.5})
    estado, cuerpo = llamar("GET", "/api/ruta/BOD-A/PR-Y")
    verificar("Costos decimales: 2.5 + 2.5 = 5 gana a 7.5 directo",
              "200, BOD-A → BAR-X → PR-Y, costo 5",
              f"{estado}, {flechas(cuerpo.get('camino'))}, costo {cuerpo.get('costo_total')}",
              estado == 200 and cuerpo.get("camino") == ["BOD-A", "BAR-X", "PR-Y"] and cuerpo.get("costo_total") == 5)
    llamar("POST", "/api/red/ejemplo")


def escenarios_visualizacion():
    seccion("Visualización del resultado")
    estado, contenido = llamar("GET", "/api/red/imagen/ruta/BOD-CENTRO/PR-ESTACION")
    es_png = isinstance(contenido, bytes) and contenido.startswith(b"\x89PNG")
    verificar("Imagen de la ruta dibujada con NetworkX a partir de nuestro Dijkstra",
              "200 con firma PNG", f"{estado} con firma PNG={es_png}", estado == 200 and es_png)

    estado, contenido = llamar("GET", "/api/red/imagen/ruta/BOD-CENTRO/PR-LAGUNA")
    es_png = isinstance(contenido, bytes) and contenido.startswith(b"\x89PNG")
    verificar("Imagen cuando no existe ruta (solo marca origen y destino)",
              "200 con firma PNG", f"{estado} con firma PNG={es_png}", estado == 200 and es_png)

    esperar_error("Imagen de ruta con destino inexistente", "GET", "/api/red/imagen/ruta/BOD-CENTRO/NO-EXISTE",
                  404, "punto_inexistente")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    print(f"Pruebas de aceptación · Feature 3 · RutaPyme\nAPI: {URL_BASE}")
    try:
        llamar("GET", "/api/salud")
    except urllib.error.URLError:
        print("\nNo se pudo conectar con la API. Inicie el servidor con: python main.py")
        sys.exit(2)

    llamar("DELETE", "/api/red")  # punto de partida conocido
    escenarios_red_vacia()
    escenarios_normales()
    escenarios_ciclos()
    escenarios_sin_ruta()
    escenarios_inexistentes_e_invalidos()
    escenarios_costos_invalidos()
    escenarios_red_cambia()
    escenarios_visualizacion()
    llamar("DELETE", "/api/red")

    aprobados = sum(resultados)
    print(f"\nResultado: {aprobados}/{len(resultados)} escenarios aprobados.")
    sys.exit(0 if aprobados == len(resultados) else 1)


if __name__ == "__main__":
    main()
