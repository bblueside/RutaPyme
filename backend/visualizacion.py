"""Dibujo de la red con NetworkX.

NetworkX se usa SOLO en este archivo y SOLO para dibujar. Los puntos y las conexiones ya
fueron construidos y validados por nuestro propio grafo (backend/red.py); aquí únicamente se
copian a un grafo de NetworkX para pintarlos. matplotlib es el motor de dibujo que NetworkX
usa por debajo para generar la imagen PNG.
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


def dibujar_red(red):
    """Devuelve los bytes de un PNG con la red actual."""
    figura = Figure(figsize=(10, 6.5), dpi=110)
    ejes = figura.add_subplot()
    ejes.axis("off")

    puntos = red.listar_puntos()
    if not puntos:
        ejes.text(0.5, 0.5, "La red está vacía\nRegistre puntos para verla aquí",
                  ha="center", va="center", fontsize=14, color="#64748b")
    else:
        _dibujar_grafo(ejes, puntos, red.listar_conexiones())

    buffer = io.BytesIO()
    figura.savefig(buffer, format="png", bbox_inches="tight", facecolor="white")
    return buffer.getvalue()


def _dibujar_grafo(ejes, puntos, conexiones):
    grafo = nx.DiGraph()  # copia de nuestros datos, solo para dibujar
    for punto in puntos:
        grafo.add_node(punto["id"], tipo=punto["tipo"])
    for conexion in conexiones:
        grafo.add_edge(conexion["origen"], conexion["destino"], costo=conexion["costo"])

    posiciones = nx.spring_layout(grafo, seed=7, k=1.6)
    colores = [COLORES_TIPO[grafo.nodes[nodo]["tipo"]] for nodo in grafo.nodes]

    nx.draw_networkx_nodes(grafo, posiciones, ax=ejes, node_color=colores,
                           node_size=TAMANO_NODO, edgecolors="white", linewidths=2)
    nx.draw_networkx_labels(grafo, posiciones, ax=ejes, font_size=7,
                            font_color="white", font_weight="bold")
    nx.draw_networkx_edges(grafo, posiciones, ax=ejes, node_size=TAMANO_NODO,
                           arrows=True, arrowstyle="-|>", arrowsize=16, width=1.5,
                           edge_color="#64748b", connectionstyle=CURVATURA)
    etiquetas = {(origen, destino): f"{datos['costo']:g}" for origen, destino, datos in grafo.edges(data=True)}
    nx.draw_networkx_edge_labels(grafo, posiciones, ax=ejes, edge_labels=etiquetas,
                                 font_size=8, font_color="#0f172a", connectionstyle=CURVATURA,
                                 bbox={"boxstyle": "round,pad=0.2", "fc": "white", "ec": "#cbd5e1"})

    leyenda = [
        Line2D([], [], marker="o", linestyle="", markersize=10, color=color, label=NOMBRES_TIPO[tipo])
        for tipo, color in COLORES_TIPO.items()
    ]
    leyenda.append(Line2D([], [], color="#64748b", label="Trayecto (costo en min)"))
    ejes.legend(handles=leyenda, loc="lower center", bbox_to_anchor=(0.5, -0.08),
                ncol=4, frameon=False, fontsize=8)
    ejes.margins(0.12)
