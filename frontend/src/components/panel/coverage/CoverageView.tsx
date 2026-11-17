// Cuerpo de «¿Hasta dónde puedes llegar?»: cobertura del origen elegido (GET /api/cobertura/{origen}).
// Se recalcula sola al cambiar el origen (D-17). Cada lugar de la lista abre su detalle en la pila.
import { useId, type CSSProperties } from 'react'
import { displayName } from '../../../constants/pointNames'
import { POINT_TYPE_COLOR } from '../../../constants/pointTypes'
import type { MapMode } from '../../../hooks/useDeliverySelection'
import { useDialogStack } from '../../../hooks/useDialogStack'
import { describeUnreachable } from '../../../lib/describeUnreachable'
import type { ApiError } from '../../../services/httpClient'
import type { Coverage } from '../../../types/coverage'
import type { Point } from '../../../types/network'
import { pointDetailView } from '../dialogs/stackViews'
import { ArrowRightIcon, ChevronRightIcon, InfoIcon, WarningIcon } from '../shared/icons'
import InlineError from '../shared/InlineError'
import PointTypeIcon from '../shared/PointTypeIcon'
import BfsTrace from './BfsTrace'
import styles from './CoverageView.module.css'

interface CoverageViewProps {
  points: Point[]
  origin: string
  onOriginChange: (id: string) => void
  coverage: Coverage | null
  loading: boolean
  error: ApiError | null
  /** Cierra el modal, cambia el modo del mapa y lleva la página hasta él (D-07). */
  onShowOnMap: (mode: MapMode) => void
}

function CoverageView({ points, origin, onOriginChange, coverage, loading, error, onShowOnMap }: CoverageViewProps) {
  const { push } = useDialogStack()
  const fieldId = useId()

  return (
    <>
      <div className="pn-field">
        <label className={`pn-label ${styles.label}`} htmlFor={`${fieldId}-origen`}>Punto de origen</label>
        <select id={`${fieldId}-origen`} className="pn-select" value={origin} disabled={points.length === 0} onChange={(event) => onOriginChange(event.target.value)}>
          {points.length === 0 && <option value="">Sin lugares</option>}
          {points.map((point) => (
            <option key={point.id} value={point.id}>{displayName(point.id)}</option>
          ))}
        </select>
      </div>

      {error ? (
        <InlineError message={error.message} />
      ) : loading || !coverage ? (
        <div className="pn-skeleton" style={{ height: 160 }} aria-label="Cargando cobertura" />
      ) : (
        <CoverageBody coverage={coverage} points={points} origin={origin} onOpenPoint={(point) => push(pointDetailView(point))} onShowOnMap={onShowOnMap} />
      )}
    </>
  )
}

interface CoverageBodyProps {
  coverage: Coverage
  points: Point[]
  origin: string
  onOpenPoint: (point: Point) => void
  onShowOnMap: (mode: MapMode) => void
}

function CoverageBody({ coverage, points, origin, onOpenPoint, onShowOnMap }: CoverageBodyProps) {
  const reachable = coverage.total_alcanzables
  const unreachable = coverage.total_no_alcanzables
  const total = reachable + unreachable
  const percent = total === 0 ? 0 : Math.round((reachable / total) * 100)
  const notice = describeUnreachable(coverage.no_alcanzables.map((point) => displayName(point.id)))
  const noConnection = new Map(coverage.no_alcanzables.map((point) => [point.id, point.motivo]))
  const places = points.filter((point) => point.id !== origin)

  return (
    <>
      <p className={styles.sentence}>
        Desde <strong>{displayName(origin)}</strong> puedes llegar a <strong>{reachable} de {total} {total === 1 ? 'lugar' : 'lugares'}</strong>.
      </p>
      <div>
        <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={reachable} aria-label="Lugares alcanzables">
          <span style={{ width: `${percent}%` }} />
        </div>
        <div className={styles.counts}>
          <span><span className={styles.dot} aria-hidden="true" /> {reachable} {reachable === 1 ? 'alcanzable' : 'alcanzables'}</span>
          <span>{unreachable} sin conexión</span>
        </div>
      </div>

      <p className={`${styles.notice} ${notice.tone === 'ok' ? styles.ok : styles.warning}`} role="status">
        {notice.tone === 'ok' ? <InfoIcon width={15} height={15} /> : <WarningIcon width={15} height={15} />}
        <span>{notice.text}</span>
      </p>

      {places.length > 0 && (
        <ul className={styles.list} aria-label="Lugares de tu red">
          {places.map((point) => {
            const reason = noConnection.get(point.id)
            return (
              <li key={point.id}>
                <button type="button" className={styles.row} aria-label={`Ver detalle de ${displayName(point.id)}`} onClick={() => onOpenPoint(point)}>
                  <span className={styles.tile} style={{ '--type-color': POINT_TYPE_COLOR[point.tipo] } as CSSProperties}>
                    <PointTypeIcon type={point.tipo} />
                  </span>
                  <span className={styles.name} title={point.id}>{displayName(point.id)}</span>
                  <span className={`${styles.status} ${reason === undefined ? styles.yes : styles.no}`} title={reason}>
                    {reason === undefined ? 'Alcanzable' : 'Sin conexión'}
                  </span>
                  <ChevronRightIcon className={styles.chevron} width={18} height={18} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <BfsTrace coverage={coverage} />

      <button type="button" className={styles.link} onClick={() => onShowOnMap('coverage')}>
        Ver cobertura en la red <ArrowRightIcon width={16} height={16} />
      </button>
    </>
  )
}

export default CoverageView
