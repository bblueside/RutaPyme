// Secciones informativas bajo el recorrido: cifras de la red de ejemplo y comparación "a ojo" vs RutaPyme.
// Todos los datos son sintéticos y fijos (red de ejemplo de la Feature 1).
import { useEffect, useRef } from 'react'
import './InfoSections.css'

type PointType = 'warehouse' | 'neighborhood' | 'pickup'

const POINT_TYPE_LABELS: Record<PointType, string> = {
  warehouse: 'bodega',
  neighborhood: 'barrio',
  pickup: 'recogida',
}

interface RouteStop {
  id: string
  type: PointType
}

interface RouteComparison {
  variant: 'guess' | 'rutapyme'
  title: string
  subtitle: string
  stops: RouteStop[]
  legCosts: number[]
  meterLabel: string
  summary: string
}

// Ítems que el encabezado añade a su navegación; los id coinciden con los de las secciones de abajo.
// eslint-disable-next-line react-refresh/only-export-components -- el plan (Q13) fija esta ubicación
export const INFO_NAV_SECTIONS = [
  { id: 'cifras', label: 'Cifras' },
  { id: 'comparacion', label: 'Comparación' },
]

const NETWORK_STATS = { points: 7, connections: 10, averageCost: '12,2' }

const TYPE_DISTRIBUTION: { type: PointType; count: number; label: string; prefix: string }[] = [
  { type: 'warehouse', count: 1, label: 'bodega', prefix: 'BOD-*' },
  { type: 'neighborhood', count: 3, label: 'barrios', prefix: 'BAR-*' },
  { type: 'pickup', count: 3, label: 'puntos de recogida', prefix: 'PR-*' },
]

const COMPARISONS: RouteComparison[] = [
  {
    variant: 'guess',
    title: '“A ojo”',
    subtitle: 'La ruta que alguien trazaría sin datos',
    stops: [
      { id: 'BOD-CENTRO', type: 'warehouse' },
      { id: 'BAR-NORTE', type: 'neighborhood' },
      { id: 'PR-PARQUE', type: 'pickup' },
      { id: 'BAR-ORIENTE', type: 'neighborhood' },
    ],
    legCosts: [12, 7, 9],
    meterLabel: 'a ojo',
    summary: '3 tramos · desvío por el norte',
  },
  {
    variant: 'rutapyme',
    title: 'Con RutaPyme',
    subtitle: 'La ruta calculada con la red en vivo',
    stops: [
      { id: 'BOD-CENTRO', type: 'warehouse' },
      { id: 'BAR-SUR', type: 'neighborhood' },
      { id: 'BAR-ORIENTE', type: 'neighborhood' },
    ],
    legCosts: [8, 6],
    meterLabel: 'RutaPyme',
    summary: '2 tramos · por el sur',
  },
]

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)
const LONGEST_ROUTE = Math.max(...COMPARISONS.map((route) => sum(route.legCosts)))
const [GUESS_ROUTE, OPTIMAL_ROUTE] = COMPARISONS.map((route) => sum(route.legCosts))
const SAVED_MINUTES = GUESS_ROUTE - OPTIMAL_ROUTE
const SAVED_PERCENT = Math.round((SAVED_MINUTES / GUESS_ROUTE) * 100)

// Rejilla interactiva: resalta las líneas y el área alrededor del cursor. Solo anima variables CSS.
function useInteractiveGrid() {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const grid = gridRef.current
    const section = grid?.parentElement
    if (!grid || !section) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return   // queda solo la capa base

    const SMOOTHING = 0.16   // 0..1: cuánto se acerca la rejilla al cursor en cada cuadro
    const target = { x: 0, y: 0, focus: 0 }
    const current = { x: 0, y: 0, focus: 0 }
    let frame = 0

    function paint() {
      current.x += (target.x - current.x) * SMOOTHING
      current.y += (target.y - current.y) * SMOOTHING
      current.focus += (target.focus - current.focus) * SMOOTHING
      grid!.style.setProperty('--ls-mx', `${current.x}px`)
      grid!.style.setProperty('--ls-my', `${current.y}px`)
      grid!.style.setProperty('--ls-focus', current.focus.toFixed(3))

      const still = Math.abs(target.x - current.x) < 0.3 && Math.abs(target.y - current.y) < 0.3
        && Math.abs(target.focus - current.focus) < 0.01
      frame = still && target.focus === 0 ? 0 : requestAnimationFrame(paint)
    }

    function start() {
      if (!frame) frame = requestAnimationFrame(paint)
    }

    function handlePointerMove(event: PointerEvent) {
      const box = grid!.getBoundingClientRect()
      target.x = event.clientX - box.left
      target.y = event.clientY - box.top
      if (target.focus === 0) { current.x = target.x; current.y = target.y }   // evita el barrido desde (0,0)
      target.focus = 1
      start()
    }

    function handlePointerLeave() {
      target.focus = 0
      start()
    }

    section.addEventListener('pointermove', handlePointerMove)
    section.addEventListener('pointerleave', handlePointerLeave)
    return () => {
      section.removeEventListener('pointermove', handlePointerMove)
      section.removeEventListener('pointerleave', handlePointerLeave)
      cancelAnimationFrame(frame)
    }
  }, [])

  return gridRef
}

function InfoSections() {
  const networkGridRef = useInteractiveGrid()
  const comparisonGridRef = useInteractiveGrid()

  return (
    <>
      {/* S1 · Cifras de la red */}
      <section id="cifras" className="ls-section ls-section--grid" aria-labelledby="ls-network-title">
        <div className="ls-grid" ref={networkGridRef} aria-hidden="true">
          <div className="ls-grid__focus" />
        </div>
        <div className="ls-container">
          <div className="ls-header">
            <div>
              <p className="ls-eyebrow">La red, ahora mismo</p>
              <h2 className="ls-title" id="ls-network-title">Lo que la API sabe de la red, contado en grande.</h2>
            </div>
            <span className="ls-pill ls-pill--sample">Red de ejemplo</span>
          </div>

          <div className="ls-bento">
            <article className="ls-card ls-stat ls-stat--main">
              <span className="ls-stat__source">puntos</span>
              <svg className="ls-watermark" aria-hidden="true"><use href="#graph-logo" /></svg>
              <span className="ls-figure">{NETWORK_STATS.points}</span>
              <span className="ls-label">puntos en la red</span>
            </article>
            <article className="ls-card ls-stat">
              <span className="ls-stat__source">conexiones</span>
              <span className="ls-figure">{NETWORK_STATS.connections}</span>
              <span className="ls-label">trayectos activos</span>
            </article>
            <article className="ls-card ls-stat">
              <span className="ls-stat__source">costo medio</span>
              <span className="ls-figure">{NETWORK_STATS.averageCost}<small>min</small></span>
              <span className="ls-label">promedio por trayecto</span>
            </article>

            <article className="ls-card ls-distribution">
              <div className="ls-distribution__header">
                Distribución por tipo de punto
                <span className="ls-code">
                  {NETWORK_STATS.points} puntos · {TYPE_DISTRIBUTION.map((item) => item.count).join(' : ')}
                </span>
              </div>
              <div
                className="ls-bar"
                role="img"
                aria-label={TYPE_DISTRIBUTION.map((item) => `${item.count} ${item.label}`).join(', ')}
              >
                {TYPE_DISTRIBUTION.map((item) => (
                  <i key={item.type} className={`ls-bar__${item.type}`} style={{ flex: item.count }} />
                ))}
              </div>
              <ul className="ls-legend">
                {TYPE_DISTRIBUTION.map((item) => (
                  <li key={item.type}>
                    <span className={`ls-dot ls-dot--${item.type}`} />
                    {item.count} {item.label} <code>{item.prefix}</code>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* S2 · Antes y después */}
      <section id="comparacion" className="ls-section ls-section--grid" aria-labelledby="ls-comparison-title">
        <div className="ls-grid" ref={comparisonGridRef} aria-hidden="true">
          <div className="ls-grid__focus" />
        </div>
        <div className="ls-container">
          <p className="ls-eyebrow">Antes y después</p>
          <h2 className="ls-title" id="ls-comparison-title">El mismo encargo, la mitad del tiempo.</h2>
          <p className="ls-text">
            De la bodega del centro al barrio oriente. Hoy el trayecto directo está cerrado: quien planea a ojo da la
            vuelta larga; RutaPyme lee la red y encuentra el camino corto.
          </p>

          <div className="ls-comparison">
            {COMPARISONS.map((route) => {
              const total = sum(route.legCosts)
              return (
                <article key={route.variant} className={`ls-card ls-route ls-route--${route.variant}`}>
                  <h3 className="ls-route__title">{route.title}</h3>
                  <p className="ls-route__subtitle">{route.subtitle}</p>
                  {route.variant === 'guess' ? (
                    <div className="ls-notice ls-notice--closed">
                      <span className="ls-code">BOD-CENTRO</span><span className="ls-dash" />✕<span className="ls-dash" />
                      <span className="ls-code">BAR-ORIENTE</span>
                      <span>cerrado</span>
                    </div>
                  ) : (
                    <div className="ls-notice ls-notice--success">✓ Evita el tramo cerrado: va por el sur</div>
                  )}
                  <ol className="ls-legs">
                    {/* Cada parada va seguida del costo del tramo que sale de ella (la última no tiene tramo). */}
                    {route.stops.flatMap((stop, index) => [
                      <li key={stop.id}>
                        <span className="ls-chip">
                          <span className={`ls-dot ls-dot--${stop.type}`} />
                          {stop.id} <small>{POINT_TYPE_LABELS[stop.type]}</small>
                        </span>
                      </li>,
                      index < route.legCosts.length && (
                        <li key={`${stop.id}-cost`} className="ls-leg-cost">{route.legCosts[index]} min</li>
                      ),
                    ])}
                  </ol>
                  <div className="ls-meter" aria-hidden="true">
                    <div><span>{route.meterLabel}</span><span>{total} min</span></div>
                    <span className="ls-meter__track"><i style={{ width: `${(total / LONGEST_ROUTE) * 100}%` }} /></span>
                  </div>
                  <div className="ls-total">
                    <span>{route.summary}</span>
                    <span className="ls-figure">{total}<small>min</small></span>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="ls-savings">
            <span className="ls-savings__pill">Ahorro: {SAVED_MINUTES} min · {SAVED_PERCENT} %</span>
            <p>Cada tramo se valida contra GET /api/conexiones; si falta, se marca como cerrado.</p>
          </div>
        </div>
      </section>
    </>
  )
}

export default InfoSections
