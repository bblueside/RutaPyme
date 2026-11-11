// Mapa SVG de la red: dibuja lo que ya calculó el backend (red, capas del BFS y ruta). No ejecuta algoritmos.
// El zoom cambia el ancho del SVG dentro de un contenedor con scroll: en móvil se desplaza con el dedo
// y en escritorio también se puede arrastrar con el ratón.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { POINT_TYPE_COLOR, POINT_TYPE_LABEL } from '../../../constants/pointTypes'
import { displayName } from '../../../constants/pointNames'
import { useElementWidth } from '../../../hooks/useElementWidth'
import type { MapMode } from '../../../hooks/useDeliverySelection'
import { layoutNetwork, NODE_RADIUS, edgeKey, type MapEdge, type MapNode } from '../../../lib/networkLayout'
import type { Coverage } from '../../../types/coverage'
import type { Network, Point } from '../../../types/network'
import { BoxIcon, PinIcon } from '../shared/icons'
import MapControls from './MapControls'
import styles from './NetworkMap.module.css'

const MIN_FIT = 0.8
const MAX_FIT = 1.1
const MIN_ZOOM = 0.6
const MAX_ZOOM = 2.4
const ZOOM_STEP = 0.2

interface NetworkMapProps {
  points: Point[]
  network: Network | null
  coverage: Coverage | null
  mode: MapMode
  destination: string
  /** Camino que se resalta con el color de acción (ruta más rápida, o camino de cobertura). */
  primaryPath: string[]
  /** Camino de menos tramos, en discontinua. */
  secondaryPath: string[]
}

function shorten(text: string, max = 18) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function pathEdges(path: string[]) {
  return new Set(path.slice(1).map((id, index) => edgeKey(path[index], id)))
}

function NetworkMap({ points, network, coverage, mode, destination, primaryPath, secondaryPath }: NetworkMapProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerWidth = useElementWidth(scrollRef)
  const [zoom, setZoom] = useState(1)
  const [recenterTick, setRecenterTick] = useState(0)
  const keepCenter = useRef<{ x: number; y: number } | null>(null)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const layout = layoutNetwork(points, network, coverage)
  const fitWidth = Math.min(Math.max(containerWidth, layout.width * MIN_FIT), layout.width * MAX_FIT)
  const svgWidth = Math.round(fitWidth * zoom)
  const svgHeight = Math.round((svgWidth * layout.height) / layout.width)

  const primaryEdges = pathEdges(primaryPath)
  const secondaryEdges = pathEdges(secondaryPath)
  const primaryNodes = new Set(primaryPath)
  const secondaryNodes = new Set(secondaryPath)
  // Solo la ruta atenúa el resto; en Cobertura se resaltan los alcanzables y se atenúan los que no lo son.
  const emphasis = mode === 'route' && primaryPath.length > 0

  // Tras cambiar el zoom, conserva el punto que estaba en el centro del contenedor.
  useLayoutEffect(() => {
    const element = scrollRef.current
    const center = keepCenter.current
    if (!element || !center) return
    element.scrollLeft = center.x * element.scrollWidth - element.clientWidth / 2
    element.scrollTop = center.y * element.scrollHeight - element.clientHeight / 2
    keepCenter.current = null
  }, [zoom])

  useEffect(() => {
    const element = scrollRef.current
    if (!element || recenterTick === 0) return
    element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2
    element.scrollTop = (element.scrollHeight - element.clientHeight) / 2
  }, [recenterTick])

  const changeZoom = useCallback((delta: number) => {
    const element = scrollRef.current
    if (element) {
      keepCenter.current = {
        x: (element.scrollLeft + element.clientWidth / 2) / element.scrollWidth,
        y: (element.scrollTop + element.clientHeight / 2) / element.scrollHeight,
      }
    }
    setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((current + delta) * 10) / 10)))
  }, [])

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch' || event.button !== 0 || !scrollRef.current) return
    drag.current = { x: event.clientX, y: event.clientY, left: scrollRef.current.scrollLeft, top: scrollRef.current.scrollTop }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (!start || !scrollRef.current) return
    scrollRef.current.scrollLeft = start.left - (event.clientX - start.x)
    scrollRef.current.scrollTop = start.top - (event.clientY - start.y)
  }
  function endDrag() {
    drag.current = null
    setDragging(false)
  }

  const summary = `Esquema de la red: ${points.length} lugares y ${layout.edges.length} trayectos de un solo sentido.`

  return (
    <div className={styles.frame}>
      <div
        ref={scrollRef}
        className={`${styles.scroller} ${dragging ? styles.dragging : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        tabIndex={0}
        aria-label="Mapa de la red: se puede desplazar con el teclado"
      >
        <svg
          className={styles.svg}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={svgWidth}
          height={svgHeight}
          role="img"
          aria-label={summary}
        >
          <defs>
            <Marker id="arrow-base" className={styles.arrowBase} />
            <Marker id="arrow-primary" className={styles.arrowPrimary} />
            <Marker id="arrow-secondary" className={styles.arrowSecondary} />
          </defs>

          <g>
            {layout.edges.map((edge) => {
              const kind = primaryEdges.has(edge.key) ? 'primary' : secondaryEdges.has(edge.key) ? 'secondary' : 'base'
              return <Edge key={edge.key} edge={edge} kind={kind} dimmed={emphasis && kind === 'base'} />
            })}
          </g>
          <g>
            {layout.nodes.map((node) => (
              <Node
                key={node.id}
                node={node}
                mode={mode}
                isDestination={mode !== 'full' && node.id === destination}
                dimmed={emphasis && !primaryNodes.has(node.id) && !secondaryNodes.has(node.id)}
              />
            ))}
          </g>
        </svg>
      </div>
      <MapControls onZoomIn={() => changeZoom(ZOOM_STEP)} onZoomOut={() => changeZoom(-ZOOM_STEP)} onReset={() => { setZoom(1); setRecenterTick((tick) => tick + 1) }} />
    </div>
  )
}

function Marker({ id, className }: { id: string; className: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse">
      <path d="M1 1.5 9 5 1 8.5" className={className} />
    </marker>
  )
}

function Edge({ edge, kind, dimmed }: { edge: MapEdge; kind: 'base' | 'primary' | 'secondary'; dimmed: boolean }) {
  const label = `${edge.minutes} min`
  return (
    <g className={`${styles.edge} ${styles[kind]} ${dimmed ? styles.dimmed : ''}`}>
      <title>{`${edge.from} → ${edge.to}: ${label}`}</title>
      <path d={edge.path} markerEnd={`url(#arrow-${kind})`} />
      <text x={edge.labelX} y={edge.labelY} textAnchor="middle" dominantBaseline="central" className={styles.edgeLabel}>
        {label}
      </text>
    </g>
  )
}

function Node({ node, mode, isDestination, dimmed }: { node: MapNode; mode: MapMode; isDestination: boolean; dimmed: boolean }) {
  const style = { '--type-color': POINT_TYPE_COLOR[node.type] } as CSSProperties
  const Icon = node.type === 'bodega' ? BoxIcon : PinIcon
  const role = node.isOrigin ? 'Punto de origen' : node.unreachable ? 'Sin conexión' : isDestination ? 'Destino' : POINT_TYPE_LABEL[node.type]
  const showLayer = mode === 'coverage' && node.layer !== null && node.layer > 0
  const showCross = mode === 'coverage' && node.unreachable
  const classes = [
    styles.node,
    node.isOrigin ? styles.origin : '',
    node.unreachable ? styles.unreachable : '',
    isDestination ? styles.destination : '',
    dimmed || (showCross && mode === 'coverage') ? styles.dimmed : '',
  ].join(' ')

  return (
    <g className={classes} style={style} transform={`translate(${node.x} ${node.y})`}>
      <title>{`${displayName(node.id)} (${node.id}) · ${role}`}</title>
      {node.isOrigin && <circle r={NODE_RADIUS + 16} className={styles.halo} />}
      <circle r={NODE_RADIUS} className={styles.disc} />
      <Icon x={-11} y={-11} width={22} height={22} className={styles.icon} />
      {showLayer && (
        <g transform={`translate(${NODE_RADIUS * 0.75} ${-NODE_RADIUS * 0.75})`}>
          <circle r={10} className={styles.badge} />
          <text className={styles.badgeText} textAnchor="middle" dominantBaseline="central">{node.layer}</text>
        </g>
      )}
      {showCross && (
        <g transform={`translate(${NODE_RADIUS * 0.75} ${-NODE_RADIUS * 0.75})`}>
          <circle r={10} className={styles.crossBadge} />
          <text className={styles.badgeText} textAnchor="middle" dominantBaseline="central" fill="#fff">✕</text>
        </g>
      )}
      <text y={NODE_RADIUS + 24} textAnchor="middle" className={styles.name}>{shorten(displayName(node.id))}</text>
      <text y={NODE_RADIUS + 42} textAnchor="middle" className={styles.role}>{role}</text>
    </g>
  )
}

export default NetworkMap
