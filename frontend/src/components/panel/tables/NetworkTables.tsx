// Pestañas «Tus lugares» y «Trayectos» con buscador. El filtro se aplica en el navegador sobre lo que ya
// devolvió la API; el estado de cada lugar sale de la cobertura del origen elegido.
import { useId, useState, type CSSProperties } from 'react'
import { displayName } from '../../../constants/pointNames'
import { POINT_TYPE_COLOR, POINT_TYPE_LABEL } from '../../../constants/pointTypes'
import { formatMinutes } from '../../../lib/formatCop'
import type { Coverage } from '../../../types/coverage'
import type { Connection, Network, Point } from '../../../types/network'
import { BoxIcon, ChevronRightIcon, PinIcon, PlusIcon, SearchIcon } from '../shared/icons'
import TypeBadge from '../shared/TypeBadge'
import styles from './NetworkTables.module.css'

type Tab = 'places' | 'trips'

interface NetworkTablesProps {
  points: Point[]
  connections: Connection[]
  network: Network | null
  coverage: Coverage | null
  origin: string
  canEdit: boolean
  onOpenPoint: (id: string) => void
  onAddPoint: () => void
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
  if (!coverage) return <span className={styles.pending}>—</span>
  const unreachable = coverage.no_alcanzables.find((point) => point.id === id)
  if (unreachable) {
    return <span className={`${styles.status} ${styles.no}`} title={unreachable.motivo}>✕ Sin conexión</span>
  }
  return <span className={`${styles.status} ${styles.yes}`}>✓ Alcanzable</span>
}

function NetworkTables({ points, connections, network, coverage, origin, canEdit, onOpenPoint, onAddPoint }: NetworkTablesProps) {
  const [tab, setTab] = useState<Tab>('places')
  const [query, setQuery] = useState('')
  const searchId = useId()

  const places = points.filter((point) =>
    matches(query, displayName(point.id), point.id, POINT_TYPE_LABEL[point.tipo]),
  )
  const trips = connections.filter((trip) =>
    matches(query, displayName(trip.origen), trip.origen, displayName(trip.destino), trip.destino),
  )
  const typeOf = new Map(points.map((point) => [point.id, point.tipo]))

  return (
    <section className={`pn-card ${styles.card}`} aria-label="Lugares y trayectos">
      <div className={styles.bar}>
        <div className={styles.tabs} role="tablist" aria-label="Qué mostrar">
          <button type="button" role="tab" id="tab-places" aria-selected={tab === 'places'} aria-controls="panel-tables" onClick={() => setTab('places')}>
            Tus lugares <span className={styles.count}>{points.length}</span>
          </button>
          <button type="button" role="tab" id="tab-trips" aria-selected={tab === 'trips'} aria-controls="panel-tables" onClick={() => setTab('trips')}>
            Trayectos <span className={styles.count}>{connections.length}</span>
          </button>
        </div>
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
      </div>

      <div id="panel-tables" role="tabpanel" aria-labelledby={tab === 'places' ? 'tab-places' : 'tab-trips'} className={styles.wrap}>
        {tab === 'places' ? (
          <table className={styles.table}>
            <thead>
              <tr><th>Lugar</th><th>Tipo</th><th>Salidas</th><th>Estado</th><th><span className="pn-sr-only">Detalle</span></th></tr>
            </thead>
            <tbody>
              {places.map((point) => {
                const exits = network?.lista_adyacencia[point.id]?.length ?? 0
                const Icon = point.tipo === 'bodega' ? BoxIcon : PinIcon
                return (
                  <tr key={point.id}>
                    <td data-label="Lugar">
                      <span className={styles.place} style={{ '--type-color': POINT_TYPE_COLOR[point.tipo] } as CSSProperties}>
                        <span className={styles.tile}><Icon width={16} height={16} /></span>
                        <span className={styles.name} title={point.id}>{displayName(point.id)}</span>
                      </span>
                    </td>
                    <td data-label="Tipo"><TypeBadge type={point.tipo} /></td>
                    <td data-label="Salidas">{exits} {exits === 1 ? 'trayecto' : 'trayectos'}</td>
                    <td data-label="Estado"><PlaceStatus id={point.id} origin={origin} coverage={coverage} /></td>
                    <td className={styles.go}>
                      <button type="button" className={styles.detail} aria-label={`Ver detalle de ${displayName(point.id)}`} onClick={() => onOpenPoint(point.id)}>
                        <ChevronRightIcon width={18} height={18} />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {places.length === 0 && (
                <tr><td colSpan={5} className={styles.empty}>{points.length === 0 ? 'Todavía no hay lugares en tu red.' : 'Ningún lugar coincide con tu búsqueda.'}</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr><th>Origen</th><th>Destino</th><th>Tiempo</th></tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={`${trip.origen}-${trip.destino}`}>
                  <td data-label="Origen"><TripPlace id={trip.origen} type={typeOf.get(trip.origen)} /></td>
                  <td data-label="Destino"><TripPlace id={trip.destino} type={typeOf.get(trip.destino)} /></td>
                  <td data-label="Tiempo" className={styles.minutes}>{formatMinutes(trip.costo)} min</td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr><td colSpan={3} className={styles.empty}>{connections.length === 0 ? 'Todavía no hay trayectos en tu red.' : 'Ningún trayecto coincide con tu búsqueda.'}</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.foot}>
        <span>Tu red se actualiza con cada nuevo trayecto.</span>
        <button type="button" className={styles.add} disabled={!canEdit} onClick={onAddPoint}>
          <PlusIcon width={16} height={16} /> Agregar lugar
        </button>
      </div>
    </section>
  )
}

function TripPlace({ id, type }: { id: string; type: Point['tipo'] | undefined }) {
  return (
    <span className={styles.tripPlace} title={id}>
      {type && <span className={styles.tripDot} style={{ background: POINT_TYPE_COLOR[type] }} aria-hidden="true" />}
      {displayName(id)}
    </span>
  )
}

export default NetworkTables
