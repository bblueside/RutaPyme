// Posiciones del mapa. No recorre el grafo: usa las capas del BFS que ya calculó la API
// (GET /api/cobertura/{origen}) como columnas, con el origen a la izquierda y los lugares sin
// conexión en una columna aparte arriba a la derecha. Sin cobertura se acomodan en una rejilla.
import type { Coverage } from '../types/coverage'
import type { Network, Point, PointType } from '../types/network'

export const NODE_RADIUS = 32
const COLUMN_WIDTH = 230
const ROW_HEIGHT = 150
const PADDING_X = 120
const PADDING_TOP = 70
const PADDING_BOTTOM = 80
const ARROW_GAP = 5
const PARALLEL_OFFSET = 7
const PARALLEL_LABEL_SHIFT = 14
const SAME_COLUMN_TOLERANCE = 20
const SAME_COLUMN_BULGE = 62

export interface MapNode {
  id: string
  type: PointType
  x: number
  y: number
  /** Capa del BFS (0 = origen); null si no es alcanzable o no hay cobertura. */
  layer: number | null
  unreachable: boolean
  isOrigin: boolean
}

export interface MapEdge {
  key: string
  from: string
  to: string
  minutes: number
  /** Trazo SVG: recta, o curva cuando los dos lugares están en la misma columna. */
  path: string
  labelX: number
  labelY: number
}

export interface MapLayout {
  nodes: MapNode[]
  edges: MapEdge[]
  width: number
  height: number
}

export function edgeKey(from: string, to: string) {
  return `${from}→${to}`
}

function arrange(points: Point[], coverage: Coverage | null) {
  const byId = new Map(points.map((point) => [point.id, point]))
  const columns: string[][] = []
  const unreachable: string[] = []

  if (coverage) {
    const placed = new Set<string>()
    for (const layer of coverage.capas) {
      const column = layer.filter((id) => byId.has(id))
      if (column.length) columns.push(column)
      column.forEach((id) => placed.add(id))
    }
    for (const point of points) if (!placed.has(point.id)) unreachable.push(point.id)
  } else {
    const perColumn = 3
    for (let start = 0; start < points.length; start += perColumn) {
      columns.push(points.slice(start, start + perColumn).map((point) => point.id))
    }
  }
  return { byId, columns, unreachable }
}

export function layoutNetwork(points: Point[], network: Network | null, coverage: Coverage | null): MapLayout {
  const { byId, columns, unreachable } = arrange(points, coverage)
  const columnCount = Math.max(columns.length + (unreachable.length ? 1 : 0), 1)
  const rows = Math.max(1, ...columns.map((column) => column.length), unreachable.length)
  const width = PADDING_X * 2 + (columnCount - 1) * COLUMN_WIDTH
  const height = PADDING_TOP + PADDING_BOTTOM + rows * ROW_HEIGHT

  const nodes: MapNode[] = []
  const origin = coverage?.origen.id ?? null
  const place = (id: string, column: number, row: number, count: number, layer: number | null, isUnreachable: boolean) => {
    const slack = isUnreachable ? 0 : (rows - count) / 2
    nodes.push({
      id,
      type: byId.get(id)!.tipo,
      x: PADDING_X + column * COLUMN_WIDTH,
      y: PADDING_TOP + (slack + row + 0.5) * ROW_HEIGHT - 20,
      layer,
      unreachable: isUnreachable,
      isOrigin: id === origin,
    })
  }
  columns.forEach((column, columnIndex) =>
    column.forEach((id, row) => place(id, columnIndex, row, column.length, coverage ? columnIndex : null, false)),
  )
  unreachable.forEach((id, row) => place(id, columns.length, row, unreachable.length, null, true))

  const position = new Map(nodes.map((node) => [node.id, node]))
  const edges: MapEdge[] = []
  for (const [from, exits] of Object.entries(network?.lista_adyacencia ?? {})) {
    for (const exit of exits) {
      const a = position.get(from)
      const b = position.get(exit.destino)
      if (!a || !b || a === b) continue
      const hasReturn = (network?.lista_adyacencia[exit.destino] ?? []).some((back) => back.destino === from)
      const inset = NODE_RADIUS + ARROW_GAP
      const dx = b.x - a.x
      const dy = b.y - a.y
      const length = Math.hypot(dx, dy) || 1
      const ux = dx / length
      const uy = dy / length
      // Normal fija por par: A→B y B→A quedan a lados opuestos.
      const nx = -uy
      const ny = ux

      if (Math.abs(dx) < SAME_COLUMN_TOLERANCE) {
        // Misma columna: una recta pisaría los nombres de los lugares, así que se curva hacia un lado.
        // Cada sentido se curva hacia el lado contrario (la normal cambia con la dirección).
        const side = hasReturn ? 1 : -1
        const cx = (a.x + b.x) / 2 + nx * side * SAME_COLUMN_BULGE
        const cy = (a.y + b.y) / 2 + ny * side * SAME_COLUMN_BULGE
        const startLength = Math.hypot(cx - a.x, cy - a.y) || 1
        const endLength = Math.hypot(cx - b.x, cy - b.y) || 1
        const x1 = a.x + ((cx - a.x) / startLength) * inset
        const y1 = a.y + ((cy - a.y) / startLength) * inset
        const x2 = b.x + ((cx - b.x) / endLength) * inset
        const y2 = b.y + ((cy - b.y) / endLength) * inset
        edges.push({
          key: edgeKey(from, exit.destino),
          from,
          to: exit.destino,
          minutes: exit.costo,
          path: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`,
          labelX: 0.25 * x1 + 0.5 * cx + 0.25 * x2,
          labelY: 0.25 * y1 + 0.5 * cy + 0.25 * y2,
        })
        continue
      }

      const offset = hasReturn ? PARALLEL_OFFSET : 0
      const x1 = a.x + ux * inset + nx * offset
      const y1 = a.y + uy * inset + ny * offset
      const x2 = b.x - ux * inset + nx * offset
      const y2 = b.y - uy * inset + ny * offset
      const shift = hasReturn ? offset + PARALLEL_LABEL_SHIFT : 0
      edges.push({
        key: edgeKey(from, exit.destino),
        from,
        to: exit.destino,
        minutes: exit.costo,
        path: `M ${x1} ${y1} L ${x2} ${y2}`,
        labelX: (a.x + b.x) / 2 + nx * shift,
        labelY: (a.y + b.y) / 2 + ny * shift,
      })
    }
  }
  return { nodes, edges, width, height }
}
