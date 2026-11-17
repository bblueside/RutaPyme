// Resultado de GET /api/ruta: veredicto, tiempo y costo, camino tramo a tramo, comparación con la ruta de
// menos tramos, tarifa de la API y la traza de Dijkstra («Cómo se calculó»). Sin ruta: el caso de §7.
import { displayName } from '../../../constants/pointNames'
import { formatCop, formatMinutes } from '../../../lib/formatCop'
import type { CheapestRoute, RouteFound } from '../../../types/route'
import { CheckCircleIcon, CrossCircleIcon } from '../shared/icons'
import DijkstraTrace from './DijkstraTrace'
import RouteTimeline from './RouteTimeline'
import styles from './RouteResult.module.css'

function FoundRoute({ route }: { route: RouteFound }) {
  const comparison = route.comparacion_menos_saltos
  const sameTime = comparison.diferencia <= 0
  const hops = comparison.saltos

  return (
    <>
      <div className={styles.verdictRow}>
        <p className={`${styles.verdict} ${styles.ok}`}>
          <CheckCircleIcon width={16} height={16} /> Sí, puedes llegar
        </p>
        <span className={styles.tag}>Ruta óptima</span>
      </div>

      <dl className={styles.figures}>
        <div>
          <dt>Tiempo total</dt>
          <dd>{formatMinutes(route.costo_total)}<small> min</small></dd>
        </div>
        <div>
          <dt>Costo estimado</dt>
          <dd>{formatCop(route.costo_monetario.total)}</dd>
        </div>
      </dl>

      <RouteTimeline route={route} />

      {sameTime ? (
        <p className={`${styles.compare} ${styles.same}`}>
          <CheckCircleIcon width={14} height={14} /> La ruta de menos tramos también toma {formatMinutes(comparison.costo)} min.
        </p>
      ) : (
        <p className={styles.compare}>
          La ruta de menos tramos toma {formatMinutes(comparison.costo)} min:
          {' '}<strong>{formatMinutes(comparison.diferencia)} min más · {formatCop(comparison.diferencia_cop)} más</strong>.
        </p>
      )}
      <div className={styles.fewest}>
        <span className={styles.fewestLabel}>Menos tramos · {hops}</span>
        <strong>{comparison.camino.map(displayName).join(' → ')}</strong>
      </div>

      <p className={styles.rate}>Tarifa de ejemplo: {formatCop(route.costo_monetario.tarifa_por_minuto)} por minuto.</p>
    </>
  )
}

function RouteResult({ route }: { route: CheapestRoute }) {
  return (
    <div className={styles.result} aria-live="polite">
      {route.existe_ruta ? (
        <FoundRoute route={route} />
      ) : (
        <>
          <p className={`${styles.verdict} ${styles.no}`}>
            <CrossCircleIcon width={16} height={16} /> No hay forma de llegar
          </p>
          <p className={styles.explanation}>
            No existe un trayecto de {displayName(route.origen.id)} a {displayName(route.destino.id)}. Revisa tus trayectos en Gestionar red.
          </p>
        </>
      )}
      <DijkstraTrace route={route} />
    </div>
  )
}

export default RouteResult
