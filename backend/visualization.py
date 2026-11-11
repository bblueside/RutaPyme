"""Drawing of the network with NetworkX.

NetworkX is used ONLY in this file and ONLY to draw. Points and connections were already
built and validated by our own graph (backend/network.py); here they are only copied into
a NetworkX graph to paint them. matplotlib is the drawing engine NetworkX uses under the
hood to produce the PNG image.

In Feature 2 the coverage RESULT is drawn too: which points our breadth-first traversal
(OperationalNetwork.coverage) reached and through which trips it discovered them. NetworkX
computes none of that: it receives the result already computed and only changes colors and widths.

In Feature 3 the CHEAPEST ROUTE computed by our Dijkstra is drawn
(OperationalNetwork.cheapest_route): its points and trips are highlighted and the rest is dimmed.

Labels inside the image stay in Spanish because the client reads them.
"""

import io

try:
    import matplotlib
    matplotlib.use("Agg")  # draws in memory, without opening windows
    import networkx as nx
    from matplotlib.figure import Figure
    from matplotlib.lines import Line2D
    AVAILABLE = True
except ImportError:
    AVAILABLE = False

TYPE_COLORS = {
    "bodega": "#E4572E",
    "barrio": "#2E86AB",
    "punto_recogida": "#3BB273",
}
TYPE_NAMES = {"bodega": "Bodega", "barrio": "Barrio", "punto_recogida": "Punto de recogida"}
NODE_SIZE = 3600
CURVATURE = "arc3,rad=0.12"  # visually separates A→B from B→A
TRIP_COLOR = "#64748b"
DIMMED_COLOR = "#cbd5e1"        # points and trips outside the coverage or the route
TRAVERSAL_COLOR = "#f59e0b"     # trips through which the traversal discovered each point
ROUTE_COLOR = "#7c3aed"         # trips of the cheapest route


def draw_network(network, coverage=None, route=None):
    """Returns the bytes of a PNG with the current network.

    If `coverage` is given (the result of OperationalNetwork.coverage), the origin, the
    reachable points and the traversal trips are highlighted; unreachable ones are dimmed.
    If `route` is given (the result of OperationalNetwork.cheapest_route), the points and
    trips of the route are highlighted; if there is no route, only origin and destination are marked.
    """
    figure = Figure(figsize=(10, 6.5), dpi=110)
    axes = figure.add_subplot()
    axes.axis("off")

    points = network.list_points()
    if not points:
        axes.text(0.5, 0.5, "La red está vacía\nRegistre puntos para verla aquí",
                  ha="center", va="center", fontsize=14, color="#64748b")
    else:
        _draw_graph(axes, points, network.list_connections(), _highlight(coverage, route))

    buffer = io.BytesIO()
    figure.savefig(buffer, format="png", bbox_inches="tight", facecolor="white")
    return buffer.getvalue()


def _highlight(coverage, route):
    """Turns an already computed result into which points and trips get painted. None = plain network."""
    if coverage is not None:
        return {
            "points": set(coverage["orden_visita"]),
            "trips": {(p["llega_desde"], p["id"]) for p in coverage["alcanzables"]},
            "marked": {coverage["origen"]["id"]},
            "color": TRAVERSAL_COLOR,
            "label": "Trayecto del recorrido",
            "dimmed_label": "No alcanzable",
            "title": (f"Cobertura desde {coverage['origen']['id']}: "
                      f"{coverage['total_alcanzables']} punto(s) alcanzable(s)"),
        }
    if route is not None:
        origin, destination = route["origen"]["id"], route["destino"]["id"]
        if route["existe_ruta"]:
            path = route["camino"]
            title = f"Ruta de menor costo {origin} → {destination}: {route['costo_total']:g} min"
        else:
            path = [origin, destination]
            title = f"No existe ruta de {origin} a {destination}"
        return {
            "points": set(path),
            "trips": set(zip(path, path[1:])) if route["existe_ruta"] else set(),
            "marked": {origin, destination},
            "color": ROUTE_COLOR,
            "label": "Trayecto de la ruta",
            "dimmed_label": "Fuera de la ruta",
            "title": title,
        }
    return None


def _draw_graph(axes, points, connections, highlight=None):
    graph = nx.DiGraph()  # copy of our data, only for drawing
    for point in points:
        graph.add_node(point["id"], tipo=point["tipo"])
    for connection in connections:
        graph.add_edge(connection["origen"], connection["destino"], costo=connection["costo"])

    # Same seed as the plain view: points do not move when the coverage or route is shown.
    positions = nx.spring_layout(graph, seed=7, k=1.6)

    if highlight is None:
        reached = set(graph.nodes)
        highlighted_trips = set()
        marked = set()
    else:
        reached = highlight["points"]
        highlighted_trips = highlight["trips"]
        marked = highlight["marked"]

    colors = [TYPE_COLORS[graph.nodes[node]["tipo"]] if node in reached else DIMMED_COLOR
              for node in graph.nodes]
    borders = ["#0f172a" if node in marked else "white" for node in graph.nodes]
    widths = [4 if node in marked else 2 for node in graph.nodes]

    nx.draw_networkx_nodes(graph, positions, ax=axes, node_color=colors,
                           node_size=NODE_SIZE, edgecolors=borders, linewidths=widths)
    nx.draw_networkx_labels(graph, positions, ax=axes, font_size=7,
                            font_color="white", font_weight="bold")

    regular = [edge for edge in graph.edges if edge not in highlighted_trips]
    nx.draw_networkx_edges(graph, positions, ax=axes, edgelist=regular, node_size=NODE_SIZE,
                           arrows=True, arrowstyle="-|>", arrowsize=16, width=1.5,
                           edge_color=TRIP_COLOR if highlight is None else DIMMED_COLOR,
                           connectionstyle=CURVATURE)
    if highlighted_trips:
        nx.draw_networkx_edges(graph, positions, ax=axes, edgelist=list(highlighted_trips),
                               node_size=NODE_SIZE, arrows=True, arrowstyle="-|>", arrowsize=20,
                               width=3.2, edge_color=highlight["color"], connectionstyle=CURVATURE)
    labels = {(origin, destination): f"{data['costo']:g}" for origin, destination, data in graph.edges(data=True)}
    nx.draw_networkx_edge_labels(graph, positions, ax=axes, edge_labels=labels,
                                 font_size=8, font_color="#0f172a", connectionstyle=CURVATURE,
                                 bbox={"boxstyle": "round,pad=0.2", "fc": "white", "ec": "#cbd5e1"})

    legend = [
        Line2D([], [], marker="o", linestyle="", markersize=10, color=color, label=TYPE_NAMES[point_type])
        for point_type, color in TYPE_COLORS.items()
    ]
    if highlight is None:
        legend.append(Line2D([], [], color=TRIP_COLOR, label="Trayecto (costo en min)"))
    else:
        legend.append(Line2D([], [], marker="o", linestyle="", markersize=10, color=DIMMED_COLOR,
                             label=highlight["dimmed_label"]))
        legend.append(Line2D([], [], color=highlight["color"], linewidth=3, label=highlight["label"]))
        legend.append(Line2D([], [], color=DIMMED_COLOR, label="Otro trayecto (costo en min)"))
        axes.set_title(highlight["title"], fontsize=11, color="#0f172a")
    axes.legend(handles=legend, loc="lower center", bbox_to_anchor=(0.5, -0.08),
                ncol=4 if highlight is None else 3, frameon=False, fontsize=8)
    axes.margins(0.12)
