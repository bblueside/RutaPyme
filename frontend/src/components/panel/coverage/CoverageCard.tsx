// «¿Hasta dónde puedes llegar?»: cobertura del origen elegido (GET /api/cobertura/{origen}) y,
// en el modo Cobertura, el veredicto para el destino (GET /api/cobertura/{origen}/{destino}).
import { displayName } from '../../../constants/pointNames'
import type { MapMode } from '../../../hooks/useDeliverySelection'
import type { ApiError } from '../../../services/httpClient'
import type { Coverage, Reachability } from '../../../types/coverage'
import RoutePath from '../planner/RoutePath'
import { ArrowRightIcon, CheckCircleIcon, CrossCircleIcon, InfoIcon, TargetIcon, WarningIcon } from '../shared/icons'
import InlineError from '../shared/InlineError'
import BfsTrace from './BfsTrace'
import styles from './CoverageCard.module.css'

const MAX_WARNINGS = 3

interface CoverageCardProps {
  origin: string
  destination: string
  coverage: Coverage | null
  loading: boolean
  error: ApiError | null
  mode: MapMode
  onShowCoverage: () => void
  reachability: Reachability | null
}

function CoverageCard({ origin, destination, coverage, loading, error, mode, onShowCoverage, reachability }: CoverageCardProps) {
  const reachable = coverage?.total_alcanzables ?? 0
  const total = reachable + (coverage?.total_no_alcanzables ?? 0)
  const percent = total === 0 ? 0 : Math.round((reachable / total) * 100)
  const unreachable = coverage?.no_alcanzables ?? []

  return (
    <section className={`pn-card ${styles.card}`} aria-labelledby="coverage-title">
      <h2 id="coverage-title" className={styles.title}>
        <TargetIcon width={20} height={20} /> ¿Hasta dónde puedes llegar?
      </h2>

      {!origin ? (
        <p className={styles.text}>Agrega un lugar para consultar su cobertura.</p>
      ) : error ? (
        <InlineError message={error.message} />
      ) : loading || !coverage ? (
        <div className="pn-skeleton" style={{ height: 72 }} aria-label="Cargando cobertura" />
      ) : (
        <>
          <p className={styles.text}>
            Desde <strong>{displayName(origin)}</strong> puedes llegar a <strong>{reachable} de {total} lugares</strong>.
          </p>
          <div
            className={styles.bar}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={reachable}
            aria-label="Lugares alcanzables"
          >
            <span style={{ width: `${percent}%` }} />
          </div>
          <div className={styles.counts}>
            <span><span className={styles.dot} aria-hidden="true" /> {reachable} alcanzables</span>
            <span>{coverage.total_no_alcanzables} sin conexión</span>
          </div>

          {unreachable.slice(0, MAX_WARNINGS).map((point) => (
            <p key={point.id} className={styles.warning}>
              <WarningIcon width={15} height={15} />
              <span>
                {displayName(point.id)} está fuera de tu cobertura actual.
                <span className={styles.reason}>Motivo: {point.motivo}.</span>
              </span>
            </p>
          ))}
          {unreachable.length > MAX_WARNINGS && (
            <p className={styles.more}>y {unreachable.length - MAX_WARNINGS} lugares más fuera de tu cobertura (mira la tabla).</p>
          )}

          {mode === 'coverage' && destination && <DestinationVerdict origin={origin} destination={destination} reachability={reachability} />}

          <BfsTrace coverage={coverage} />
        </>
      )}

      <button type="button" className={styles.link} onClick={onShowCoverage} disabled={!coverage}>
        Ver cobertura en la red <ArrowRightIcon width={16} height={16} />
      </button>
    </section>
  )
}

function DestinationVerdict({ origin, destination, reachability }: { origin: string; destination: string; reachability: Reachability | null }) {
  if (!reachability) return <div className="pn-skeleton" style={{ height: 48 }} aria-label="Consultando destino" />
  return (
    <div className={styles.verdict} aria-live="polite">
      <p className={`${styles.verdictTitle} ${reachability.alcanzable ? styles.yes : styles.no}`}>
        {reachability.alcanzable ? <CheckCircleIcon width={15} height={15} /> : <CrossCircleIcon width={15} height={15} />}
        {reachability.alcanzable ? 'Sí' : 'No'} llegas a {displayName(destination)} desde {displayName(origin)}
      </p>
      {reachability.alcanzable ? (
        <>
          <RoutePath path={reachability.camino} label="Camino con menos trayectos" />
          <p className={styles.note}><InfoIcon width={13} height={13} /> {reachability.nota}</p>
        </>
      ) : (
        <p className={styles.note}>{reachability.explicacion}</p>
      )}
    </div>
  )
}

export default CoverageCard
