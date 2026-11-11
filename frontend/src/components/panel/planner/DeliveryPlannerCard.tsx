// «Tu próxima entrega»: elige origen y destino y pide la ruta más rápida a la API.
import { useId } from 'react'
import { displayName, hasFriendlyName } from '../../../constants/pointNames'
import type { ApiStatus } from '../../../context/apiHealthContext'
import type { ApiError } from '../../../services/httpClient'
import type { Point } from '../../../types/network'
import type { CheapestRoute } from '../../../types/route'
import { ArrowRightIcon, CheckCircleIcon, PinIcon, RouteIcon, SwapIcon } from '../shared/icons'
import InlineError from '../shared/InlineError'
import RouteResult from './RouteResult'
import styles from './DeliveryPlannerCard.module.css'

interface DeliveryPlannerCardProps {
  status: ApiStatus
  points: Point[]
  origin: string
  destination: string
  onOriginChange: (id: string) => void
  onDestinationChange: (id: string) => void
  onSwap: () => void
  onFind: () => void
  pending: boolean
  error: ApiError | null
  route: CheapestRoute | null
}

function optionLabel(point: Point) {
  return hasFriendlyName(point.id) ? `${displayName(point.id)} · ${point.id}` : point.id
}

function DeliveryPlannerCard(props: DeliveryPlannerCardProps) {
  const { status, points, origin, destination, pending, error, route } = props
  const fieldId = useId()
  const errorId = useId()
  const ready = status === 'online' && origin !== '' && destination !== '' && origin !== destination

  return (
    <section className={`pn-card ${styles.card}`} aria-labelledby={`${fieldId}-title`}>
      <div className={styles.head}>
        <span className={styles.headIcon}><RouteIcon width={22} height={22} /></span>
        <div>
          <h2 id={`${fieldId}-title`} className={styles.title}>Tu próxima entrega</h2>
          <p className={styles.sub}>Una buena decisión empieza aquí.</p>
        </div>
      </div>

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault()
          if (ready && !pending) props.onFind()
        }}
        noValidate
      >
        <div className="pn-field">
          <label className={`pn-label ${styles.label}`} htmlFor={`${fieldId}-origen`}>
            <span className={styles.originMark} aria-hidden="true" /> Punto de origen
          </label>
          <select id={`${fieldId}-origen`} className="pn-select" value={origin} disabled={points.length === 0} onChange={(event) => props.onOriginChange(event.target.value)}>
            {points.length === 0 && <option value="">Sin lugares</option>}
            {points.map((point) => (
              <option key={point.id} value={point.id}>{optionLabel(point)}</option>
            ))}
          </select>
        </div>

        <button type="button" className={styles.swap} aria-label="Intercambiar origen y destino" disabled={points.length < 2} onClick={props.onSwap}>
          <SwapIcon width={16} height={16} />
        </button>

        <div className="pn-field">
          <label className={`pn-label ${styles.label}`} htmlFor={`${fieldId}-destino`}>
            <PinIcon width={14} height={14} /> Destino
          </label>
          <select
            id={`${fieldId}-destino`}
            className="pn-select"
            value={destination}
            disabled={points.length < 2}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => props.onDestinationChange(event.target.value)}
          >
            {points.length < 2 && <option value="">Agrega otro lugar</option>}
            {points.filter((point) => point.id !== origin).map((point) => (
              <option key={point.id} value={point.id}>{optionLabel(point)}</option>
            ))}
          </select>
        </div>

        <button type="submit" className={`pn-btn pn-btn--primary ${styles.submit}`} disabled={!ready || pending}>
          <RouteIcon /> {pending ? 'Buscando…' : 'Encontrar la mejor ruta'}
          {!pending && <ArrowRightIcon className={styles.arrow} />}
        </button>
        <InlineError id={errorId} message={error?.message} />
      </form>

      {route ? (
        <RouteResult route={route} />
      ) : (
        <div className={styles.intro}>
          <span className={styles.illustration} aria-hidden="true"><RouteIcon width={28} height={28} /></span>
          <h3 className={styles.introTitle}>De la duda a la ruta.</h3>
          <p className={styles.introText}>Elige dónde empiezas y a dónde vas. Nosotros encontramos el mejor camino.</p>
          <ul className={styles.checks}>
            <li><CheckCircleIcon width={13} height={13} /> Menos tiempo</li>
            <li><CheckCircleIcon width={13} height={13} /> Costo claro</li>
          </ul>
        </div>
      )}
    </section>
  )
}

export default DeliveryPlannerCard
