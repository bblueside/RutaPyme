// Cuerpo de «Planea tu próxima entrega.»: elige origen y destino y pide la ruta más rápida a la API.
// El resultado solo se calcula con «Encontrar la mejor ruta» (D-17) y se oculta si cambia el origen o el destino.
import { useId } from 'react'
import { displayName } from '../../../constants/pointNames'
import type { ApiStatus } from '../../../context/apiHealthContext'
import type { MapMode } from '../../../hooks/useDeliverySelection'
import type { ApiError } from '../../../services/httpClient'
import type { Point } from '../../../types/network'
import type { CheapestRoute } from '../../../types/route'
import { ArrowRightIcon, NetworkIcon, PinIcon, RouteIcon, SwapIcon } from '../shared/icons'
import InlineError from '../shared/InlineError'
import RouteResult from './RouteResult'
import styles from './DeliveryPlannerView.module.css'

interface DeliveryPlannerViewProps {
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
  /** Cierra el modal, cambia el modo del mapa y lleva la página hasta él (D-07). */
  onShowOnMap: (mode: MapMode) => void
}

function DeliveryPlannerView(props: DeliveryPlannerViewProps) {
  const { status, points, origin, destination, pending, error, route } = props
  const fieldId = useId()
  const errorId = useId()
  const ready = status === 'online' && origin !== '' && destination !== '' && origin !== destination

  return (
    <>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault()
          if (ready && !pending) props.onFind()
        }}
        noValidate
      >
        <div className={styles.fields}>
          <div className="pn-field">
            <label className={`pn-label ${styles.label}`} htmlFor={`${fieldId}-origen`}>
              <span className={styles.originMark} aria-hidden="true" /> Punto de origen
            </label>
            <select id={`${fieldId}-origen`} className="pn-select" value={origin} disabled={points.length === 0} onChange={(event) => props.onOriginChange(event.target.value)}>
              {points.length === 0 && <option value="">Sin lugares</option>}
              {points.map((point) => (
                <option key={point.id} value={point.id}>{displayName(point.id)}</option>
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
                <option key={point.id} value={point.id}>{displayName(point.id)}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className={`pn-btn pn-btn--primary ${styles.submit}`} disabled={!ready || pending}>
          <RouteIcon /> {pending ? 'Buscando…' : 'Encontrar la mejor ruta'}
          {!pending && <ArrowRightIcon className={styles.arrow} />}
        </button>
        <InlineError id={errorId} message={error?.message} />
      </form>

      {route && (
        <div className={styles.result}>
          <RouteResult route={route} />
          {route.existe_ruta && (
            <button type="button" className={`pn-btn pn-btn--secondary ${styles.onMap}`} onClick={() => props.onShowOnMap('route')}>
              <NetworkIcon /> Ver ruta en la red
              <ArrowRightIcon className={styles.arrow} />
            </button>
          )}
        </div>
      )}
    </>
  )
}

export default DeliveryPlannerView
