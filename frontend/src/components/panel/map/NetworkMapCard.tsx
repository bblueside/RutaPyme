// Tarjeta «El mapa de tu operación»: modos del mapa, lienzo SVG, leyenda y enlace a la imagen que genera la API.
import type { ApiStatus } from '../../../context/apiHealthContext'
import type { MapMode } from '../../../hooks/useDeliverySelection'
import { coverageImageUrl } from '../../../services/coverageService'
import { networkImageUrl } from '../../../services/networkService'
import { routeImageUrl } from '../../../services/routeService'
import type { Coverage, Reachability } from '../../../types/coverage'
import type { Network, Point } from '../../../types/network'
import type { CheapestRoute } from '../../../types/route'
import { ImageIcon, NetworkIcon, PinIcon, PlusIcon, RouteIcon, TargetIcon } from '../shared/icons'
import LoadSampleButton from '../shared/LoadSampleButton'
import MapLegend from './MapLegend'
import NetworkMap from './NetworkMap'
import styles from './NetworkMapCard.module.css'

const MODES: { id: MapMode; label: string; Icon: typeof NetworkIcon }[] = [
  { id: 'full', label: 'Red completa', Icon: NetworkIcon },
  { id: 'coverage', label: 'Cobertura', Icon: TargetIcon },
  { id: 'route', label: 'Mejor ruta', Icon: RouteIcon },
]

const LIVE_TEXT: Record<ApiStatus, string> = { checking: 'Conectando…', online: 'En vivo', offline: 'Sin conexión' }

interface NetworkMapCardProps {
  status: ApiStatus
  points: Point[]
  network: Network | null
  coverage: Coverage | null
  version: number
  loading: boolean
  mode: MapMode
  onModeChange: (mode: MapMode) => void
  origin: string
  destination: string
  route: CheapestRoute | null
  reachability: Reachability | null
  onAddConnection: () => void
  onAddPoint: () => void
}

function NetworkMapCard(props: NetworkMapCardProps) {
  const { status, points, network, coverage, version, loading, mode, onModeChange, origin, destination, route, reachability } = props

  let primaryPath: string[] = []
  let secondaryPath: string[] = []
  if (mode === 'route' && route?.existe_ruta) {
    primaryPath = route.camino
    const fewest = route.comparacion_menos_saltos.camino
    if (fewest.join('>') !== route.camino.join('>')) secondaryPath = fewest
  }
  if (mode === 'coverage' && reachability?.alcanzable) primaryPath = reachability.camino

  let imageUrl = networkImageUrl(version)
  if (mode === 'coverage' && origin) imageUrl = coverageImageUrl(origin, version)
  if (mode === 'route' && route && origin && destination) imageUrl = routeImageUrl(origin, destination, version)

  return (
    <section className={`pn-card ${styles.card}`} aria-labelledby="map-title">
      <div className={styles.head}>
        <div>
          <h2 id="map-title" className={styles.title}>
            El mapa de tu operación
            <span className={`${styles.live} ${status === 'online' ? '' : styles.liveOff}`} aria-hidden="true" />
          </h2>
          <p className={styles.sub}>Cada conexión es una posibilidad de entrega.</p>
        </div>
        <button type="button" className="pn-btn pn-btn--secondary" disabled={status !== 'online' || points.length < 2} onClick={props.onAddConnection}>
          <PlusIcon /> Agregar trayecto
        </button>
      </div>

      <div className={styles.modes} role="group" aria-label="Ver en la red">
        <span className={styles.modesLabel}>Ver en la red</span>
        {MODES.map(({ id, label, Icon }) => (
          <button key={id} type="button" className={styles.mode} aria-pressed={mode === id} onClick={() => onModeChange(id)}>
            <Icon width={16} height={16} /> {label}
          </button>
        ))}
      </div>

      <div className={styles.canvas}>
        {loading ? (
          <div className="pn-skeleton" style={{ height: 420 }} aria-label="Cargando la red" />
        ) : points.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}><NetworkIcon width={26} height={26} /></span>
            <h3>Tu red está vacía</h3>
            <p>Agrega un lugar o carga los datos de ejemplo para ver tu red de entregas.</p>
            <div className="pn-actions">
              <button type="button" className="pn-btn pn-btn--primary" disabled={status !== 'online'} onClick={props.onAddPoint}>
                <PlusIcon /> Agregar lugar
              </button>
              <LoadSampleButton>Cargar datos de ejemplo</LoadSampleButton>
            </div>
          </div>
        ) : (
          <NetworkMap
            points={points}
            network={network}
            coverage={coverage}
            mode={mode}
            destination={destination}
            primaryPath={primaryPath}
            secondaryPath={secondaryPath}
          />
        )}
        <span className={styles.badge}>
          <span className={`${styles.badgeDot} ${status === 'online' ? '' : styles.liveOff}`} aria-hidden="true" />
          Red de entregas <span className={styles.badgeSep} aria-hidden="true">|</span> {LIVE_TEXT[status]}
        </span>
        <p className={styles.note}>
          <PinIcon width={13} height={13} /> Un esquema de tu red, no un mapa real.
          {points.length > 0 && status === 'online' && (
            <>
              {' '}
              <a className={styles.imageLink} href={imageUrl} target="_blank" rel="noreferrer">
                <ImageIcon width={13} height={13} /> Ver imagen generada
              </a>
            </>
          )}
        </p>
      </div>

      {mode === 'route' && !route && points.length > 0 && (
        <p className={styles.hint} role="status">Elige origen y destino y pulsa «Encontrar la mejor ruta» para verla aquí.</p>
      )}

      <MapLegend mode={mode} showRoute={primaryPath.length > 0 && mode === 'route'} showFewest={secondaryPath.length > 0} />
    </section>
  )
}

export default NetworkMapCard
