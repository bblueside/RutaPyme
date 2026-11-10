"""Dibujo de la red con NetworkX.

NetworkX se usa SOLO en este archivo y SOLO para dibujar. Los puntos y las conexiones ya
fueron construidos y validados por nuestro propio grafo (backend/red.py); aquí únicamente se
copian a un grafo de NetworkX para pintarlos. matplotlib es el motor de dibujo que NetworkX
usa por debajo para generar la imagen PNG.

En la Feature 2 también se dibuja el RESULTADO de la cobertura: qué puntos alcanzó nuestro
recorrido por capas (RedOperativa.cobertura) y por qué trayectos los descubrió. NetworkX no
calcula nada de eso: recibe el resultado ya calculado y solo cambia colores y grosores.

En la Feature 3 se dibuja la RUTA DE MENOR COSTO que calculó nuestro Dijkstra
(RedOperativa.ruta_menor_costo): sus puntos y trayectos se resaltan y el resto se apaga.
"""

import io

try:
    import matplotlib
    matplotlib.use("Agg")  # dibuja en memoria, sin abrir ventanas
    import networkx as nx
    from matplotlib.figure import Figure
    from matplotlib.lines import Line2D
    DISPONIBLE = True
except ImportError:
    DISPONIBLE = False

COLORES_TIPO = {
    "bodega": "#E4572E",
    "barrio": "#2E86AB",
    "punto_recogida": "#3BB273",
}
NOMBRES_TIPO = {"bodega": "Bodega", "barrio": "Barrio", "punto_recogida": "Punto de recogida"}
TAMANO_NODO = 3600
CURVATURA = "arc3,rad=0.12"  # separa visualmente A→B de B→A
COLOR_TRAYECTO = "#64748b"
COLOR_APAGADO = "#cbd5e1"       # puntos y trayectos fuera de la cobertura o de la ruta
COLOR_RECORRIDO = "#f59e0b"     # trayectos por los que el recorrido descubrió cada punto
COLOR_RUTA = "#7c3aed"          # trayectos de la ruta de menor costo


def dibujar_red(red, cobertura=None, ruta=None):
    """Devuelve los bytes de un PNG con la red actual.

    Si se pasa `cobertura` (el resultado de RedOperativa.cobertura), se resalta el origen, los
    puntos alcanzables y los trayectos del recorrido; lo no alcanzable se dibuja apagado.
    Si se pasa `ruta` (el resultado de RedOperativa.ruta_menor_costo), se resaltan los puntos y
    trayectos de la ruta; si no existe ruta, solo se marcan el origen y el destino.
    """
    figura = Figure(figsize=(10, 6.5), dpi=110)
    ejes = figura.add_subplot()
    ejes.axis("off")

    puntos = red.listar_puntos()
    if not puntos:
        ejes.text(0.5, 0.5, "La red está vacía\nRegistre puntos para verla aquí",
                  ha="center", va="center", fontsize=14, color="#64748b")
    else:
        _dibujar_grafo(ejes, puntos, red.listar_conexiones(), _resaltado(cobertura, ruta))

    buffer = io.BytesIO()
    figura.savefig(buffer, format="png", bbox_inches="tight", facecolor="white")
    return buffer.getvalue()


def _resaltado(cobertura, ruta):
    """Traduce un resultado ya calculado a qué puntos y trayectos se pintan. None = red normal."""
    if cobertura is not None:
        return {
            "puntos": set(cobertura["orden_visita"]),
            "trayectos": {(p["llega_desde"], p["id"]) for p in cobertura["alcanzables"]},
            "marcados": {cobertura["origen"]["id"]},
            "color": COLOR_RECORRIDO,
            "etiqueta": "Trayecto del recorrido",
            "apagado": "No alcanzable",
            "titulo": (f"Cobertura desde {cobertura['origen']['id']}: "
                       f"{cobertura['total_alcanzables']} punto(s) alcanzable(s)"),
        }
    if ruta is not None:
        origen, destino = ruta["origen"]["id"], ruta["destino"]["id"]
        if ruta["existe_ruta"]:
            camino = ruta["camino"]
            titulo = f"Ruta de menor costo {origen} → {destino}: {ruta['costo_total']:g} min"
        else:
            camino = [origen, destino]
            titulo = f"No existe ruta de {origen} a {destino}"
        return {
            "puntos": set(camino),
            "trayectos": set(zip(camino, camino[1:])) if ruta["existe_ruta"] else set(),
            "marcados": {origen, destino},
            "color": COLOR_RUTA,
            "etiqueta": "Trayecto de la ruta",
            "apagado": "Fuera de la ruta",
            "titulo": titulo,
        }
    return None


def _dibujar_grafo(ejes, puntos, conexiones, resaltado=None):
    grafo = nx.DiGraph()  # copia de nuestros datos, solo para dibujar
    for punto in puntos:
        grafo.add_node(punto["id"], tipo=punto["tipo"])
    for conexion in conexiones:
        grafo.add_edge(conexion["origen"], conexion["destino"], costo=conexion["costo"])

    # Misma semilla que la vista normal: los puntos no cambian de lugar al ver la cobertura.
    posiciones = nx.spring_layout(grafo, seed=7, k=1.6)

    if resaltado is None:
        alcanzados = set(grafo.nodes)
        trayectos_resaltados = set()
        marcados = set()
    else:
        alcanzados = resaltado["puntos"]
        trayectos_resaltados = resaltado["trayectos"]
        marcados = resaltado["marcados"]

    colores = [COLORES_TIPO[grafo.nodes[nodo]["tipo"]] if nodo in alcanzados else COLOR_APAGADO
               for nodo in grafo.nodes]
    bordes = ["#0f172a" if nodo in marcados else "white" for nodo in grafo.nodes]
    grosores = [4 if nodo in marcados else 2 for nodo in grafo.nodes]

    nx.draw_networkx_nodes(grafo, posiciones, ax=ejes, node_color=colores,
                           node_size=TAMANO_NODO, edgecolors=bordes, linewidths=grosores)
    nx.draw_networkx_labels(grafo, posiciones, ax=ejes, font_size=7,
                            font_color="white", font_weight="bold")

    normales = [arista for arista in grafo.edges if arista not in trayectos_resaltados]
    nx.draw_networkx_edges(grafo, posiciones, ax=ejes, edgelist=normales, node_size=TAMANO_NODO,
                           arrows=True, arrowstyle="-|>", arrowsize=16, width=1.5,
                           edge_color=COLOR_TRAYECTO if resaltado is None else COLOR_APAGADO,
                           connectionstyle=CURVATURA)
    if trayectos_resaltados:
        nx.draw_networkx_edges(grafo, posiciones, ax=ejes, edgelist=list(trayectos_resaltados),
                               node_size=TAMANO_NODO, arrows=True, arrowstyle="-|>", arrowsize=20,
                               width=3.2, edge_color=resaltado["color"], connectionstyle=CURVATURA)
    etiquetas = {(origen, destino): f"{datos['costo']:g}" for origen, destino, datos in grafo.edges(data=True)}
    nx.draw_networkx_edge_labels(grafo, posiciones, ax=ejes, edge_labels=etiquetas,
                                 font_size=8, font_color="#0f172a", connectionstyle=CURVATURA,
                                 bbox={"boxstyle": "round,pad=0.2", "fc": "white", "ec": "#cbd5e1"})

    leyenda = [
        Line2D([], [], marker="o", linestyle="", markersize=10, color=color, label=NOMBRES_TIPO[tipo])
        for tipo, color in COLORES_TIPO.items()
    ]
    if resaltado is None:
        leyenda.append(Line2D([], [], color=COLOR_TRAYECTO, label="Trayecto (costo en min)"))
    else:
        leyenda.append(Line2D([], [], marker="o", linestyle="", markersize=10, color=COLOR_APAGADO,
                              label=resaltado["apagado"]))
        leyenda.append(Line2D([], [], color=resaltado["color"], linewidth=3, label=resaltado["etiqueta"]))
        leyenda.append(Line2D([], [], color=COLOR_APAGADO, label="Otro trayecto (costo en min)"))
        ejes.set_title(resaltado["titulo"], fontsize=11, color="#0f172a")
    ejes.legend(handles=leyenda, loc="lower center", bbox_to_anchor=(0.5, -0.08),
                ncol=4 if resaltado is None else 3, frameon=False, fontsize=8)
    ejes.margins(0.12)
