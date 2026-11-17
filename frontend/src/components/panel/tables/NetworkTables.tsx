// Cuerpo de «Los detalles de tu red.»: pestañas «Tus lugares» y «Trayectos» con buscador. El filtro se aplica en
// el navegador sobre lo que ya devolvió la API; el estado de cada lugar sale de la cobertura del origen elegido.
import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { displayName } from '../../../constants/pointNames'
import { POINT_TYPE_COLOR, POINT_TYPE_LABEL } from '../../../constants/pointTypes'
import { formatCop, formatMinutes, minutesToCop } from '../../../lib/formatCop'
import type { Coverage } from '../../../types/coverage'
import type { Connection, Network, Point } from '../../../types/network'
import { ChevronRightIcon, PlusIcon, SearchIcon } from '../shared/icons'
import PointTypeIcon from '../shared/PointTypeIcon'
import TypeBadge from '../shared/TypeBadge'
import styles from './NetworkTables.module.css'

type Tab = 'places' | 'trips'
const TABS: Tab[] = ['places', 'trips']

interface NetworkTablesProps {
  points: Point[]
  connections: Connection[]
  network: Network | null
  coverage: Coverage | null
  origin: string
  /** false con la API sin conexión: se ocultan los botones de agregar (D-13). */
  canEdit: boolean
  /** Tarifa por minuto para el COSTO de cada trayecto; null mientras no se conoce. */
  ratePerMinute: number | null
  onOpenPoint: (point: Point) => void
  onAddPoint: () => void
  onAddConnection: () => void
}

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function matches(query: string, ...values: string[]) {
  const needle = normalize(query.trim())
  return needle === '' || values.some((value) => normalize(value).includes(needle))
}

function PlaceStatus({ id, origin, coverage }: { id: string; origin: string; coverage: Coverage | null }) {
  if (id === origin) return <span className={`${styles.status} ${styles.origin}`}>Origen</span>
  if (!origin || !coverage) return <span className={styles.pending}>—</span>
  const unreachable = coverage.no_alcanzables.find((point) => point.id === id)
  if (unreachable) {
    return <span className={`${styles.status} ${styles.no}`} title={unreachable.motivo}>Sin conexión</span>
  }
  return <span className={`${styles.status} ${styles.yes}`}>Alcanzable</span>
}

function TripPlace({ id, type }: { id: string; type: Point['tipo'] | undefined }) {
  return (
    <span className={styles.tripPlace} title={id}>
      {type && <span className={styles.tripDot} style={{ background: POINT_TYPE_COLOR[type] }} aria-hidden="true" />}
      {displayName(id)}
    </span>
  )
}

function EmptyState({ children, action }: { children: ReactNode; action: ReactNode }) {
  return (
    <div className={styles.emptyState}>
      <p>{children}</p>
      {action}
    </div>
  )
}

function NetworkTables({ points, connections, network, coverage, origin, canEdit, ratePerMinute, onOpenPoint, onAddPoint, onAddConnection }: NetworkTablesProps) {
  const [tab, setTab] = useState<Tab>('places')
  const [query, setQuery] = useState('')
  const baseId = useId()
  const searchId = `${baseId}-search`
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ places: null, trips: null })

  const places = points.filter((point) => matches(query, displayName(point.id), point.id, POINT_TYPE_LABEL[point.tipo]))
  const trips = connections.filter((trip) => matches(query, displayName(trip.origen), trip.origen, displayName(trip.destino), trip.destino))
  const typeOf = new Map(points.map((point) => [point.id, point.tipo]))
  const searching = query.trim() !== ''
  const needsTwoPlaces = points.length < 2

  // Patrón ARIA tablist: flechas, Inicio y Fin mueven la selección y el foco (D-23).
  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = TABS.indexOf(tab)
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = TABS.length - 1
    else return
    event.preventDefault()
    setTab(TABS[next])
    tabRefs.current[TABS[next]]?.focus()
  }

  const addPlaceButton = canEdit ? (
    <button type="button" className="pn-btn pn-btn--primary" onClick={onAddPoint}>
      <PlusIcon /> Agregar lugar
    </button>
  ) : null
  const addTripButton = canEdit ? (
    <span title={needsTwoPlaces ? 'Necesitas al menos dos lugares.' : undefined}>
      <button type="button" className="pn-btn pn-btn--primary" disabled={needsTwoPlaces} onClick={onAddConnection}>
        <PlusIcon /> Agregar trayecto
      </button>
    </span>
  ) : null

  const tabLabel: Record<Tab, string> = { places: 'Tus lugares', trips: 'Trayectos' }
  const tabCount: Record<Tab, number> = { places: points.length, trips: connections.length }

  return (
    <section className={styles.card} aria-label="Lugares y trayectos">
      <div className={styles.tabs} role="tablist" aria-label="Qué mostrar" onKeyDown={onTabKeyDown}>
        {TABS.map((id) => (
          <button
            key={id}
            ref={(element) => { tabRefs.current[id] = element }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`${baseId}-panel`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
          >
            {tabLabel[id]} <span className={styles.count}>{tabCount[id]}</span>
          </button>
        ))}
      </div>

      <div className={styles.tools}>
        <label className={styles.search} htmlFor={searchId}>
          <SearchIcon width={16} height={16} />
          <input
            id={searchId}
            type="search"
            value={query}
            placeholder="Buscar en tu red…"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {tab === 'places' ? addPlaceButton : addTripButton}
      </div>

      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${tab}`} className={styles.wrap}>
        {tab === 'places' ? (
          points.length === 0 ? (
            <EmptyState action={addPlaceButton}>Aún no tienes lugares. Agrega el primero para empezar tu red.</EmptyState>
          ) : places.length === 0 && searching ? (
            <p className={styles.noResults}>No encontramos nada para «{query.trim()}».</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr><th>Lugar</th><th>Tipo</th><th>Salidas</th><th>Estado</th><th><span className="pn-sr-only">Detalle</span></th></tr>
              </thead>
              <tbody>
                {places.map((point) => {
                  const exits = network?.lista_adyacencia[point.id]?.length ?? 0
                  return (
                    <tr key={point.id}>
                      <td data-label="Lugar">
                        <span className={styles.place} style={{ '--type-color': POINT_TYPE_COLOR[point.tipo] } as CSSProperties}>
                          <span className={styles.tile}><PointTypeIcon type={point.tipo} /></span>
                          <span className={styles.name} title={point.id}>{displayName(point.id)}</span>
                        </span>
                      </td>
                      <td data-label="Tipo"><TypeBadge type={point.tipo} /></td>
                      <td data-label="Salidas">{exits} {exits === 1 ? 'trayecto' : 'trayectos'}</td>
                      <td data-label="Estado"><PlaceStatus id={point.id} origin={origin} coverage={coverage} /></td>
                      <td className={styles.go}>
                        <button type="button" className={styles.detail} aria-label={`Ver detalle de ${displayName(point.id)}`} onClick={() => onOpenPoint(point)}>
                          <ChevronRightIcon width={18} height={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        ) : connections.length === 0 ? (
          <EmptyState action={addTripButton}>Aún no hay trayectos. Conecta dos lugares para empezar a entregar.</EmptyState>
        ) : trips.length === 0 && searching ? (
          <p className={styles.noResults}>No encontramos nada para «{query.trim()}».</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr><th>Origen</th><th>Destino</th><th>Tiempo</th><th>Costo</th></tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={`${trip.origen}-${trip.destino}`}>
                  <td data-label="Origen"><TripPlace id={trip.origen} type={typeOf.get(trip.origen)} /></td>
                  <td data-label="Destino"><TripPlace id={trip.destino} type={typeOf.get(trip.destino)} /></td>
                  <td data-label="Tiempo" className={styles.figure}>{formatMinutes(trip.costo)} min</td>
                  <td data-label="Costo" className={styles.figure}>
                    {ratePerMinute === null ? '—' : formatCop(minutesToCop(trip.costo, ratePerMinute))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export default NetworkTables
