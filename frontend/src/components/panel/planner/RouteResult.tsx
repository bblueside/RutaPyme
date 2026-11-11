// Resultado de GET /api/ruta: veredicto, minutos, pesos, tramos, comparación y explicación si no hay ruta.
import { displayName } from '../../../constants/pointNames'
import { formatCop, formatMinutes } from '../../../lib/formatCop'
import type { CheapestRoute, RouteFound } from '../../../types/route'
import { CheckCircleIcon, CrossCircleIcon, InfoIcon } from '../shared/icons'
import DijkstraTrace from './DijkstraTrace'
import RoutePath from './RoutePath'
import styles from './RouteResult.module.css'

function FoundRoute({ route }: { route: RouteFound }) {
  const comparison = route.comparacion_menos_saltos
  const samePath = comparison.camino.join('>') === route.camino.join('>')
  const hops = (count: number) => `${count} ${count === 1 ? 'tramo' : 'tramos'}`

  return (
    <>
      <p className={`${styles.verdict} ${styles.ok}`}>
        <CheckCircleIcon width={16} height={16} /> Sí se puede llegar
      </p>
      <p className={styles.message}>{route.mensaje}</p>

      <dl className={styles.figures}>
        <div>
          <dt>Tiempo</dt>
          <dd>{formatMinutes(route.costo_total)}<small> min</small></dd>
        </div>
        <div>
          <dt>Costo</dt>
          <dd>{formatCop(route.costo_monetario.total)}</dd>
        </div>
        <div>
          <dt>Recorrido</dt>
          <dd>{route.saltos}<small> {route.saltos === 1 ? 'tramo' : 'tramos'}</small></dd>
        </div>
      </dl>
      <p className={styles.rate}>Tarifa: {formatCop(route.costo_monetario.tarifa_por_minuto)} por minuto.</p>

      <h3 className={styles.heading}>Ruta más rápida</h3>
      <RoutePath path={route.camino} label="Ruta más rápida" />
      {route.tramos.length > 0 && (
        <ol className={styles.legs}>
          {route.tramos.map((leg) => (
            <li key={`${leg.origen}-${leg.destino}`}>
              <span className={styles.legName}>{displayName(leg.origen)} → {displayName(leg.destino)}</span>
              <span className={styles.legFigures}>{formatMinutes(leg.costo)} min · {formatCop(leg.costo_cop)}</span>
            </li>
          ))}
        </ol>
      )}

      <div className={styles.compare}>
        <h3 className={styles.heading}>Ruta de menos tramos</h3>
        {samePath ? (
          <p className={styles.compareText}><InfoIcon width={14} height={14} /> {comparison.mensaje}</p>
        ) : (
          <>
            <RoutePath path={comparison.camino} label="Ruta de menos tramos" />
            <p className={styles.compareFigures}>
              {hops(comparison.saltos)} · {formatMinutes(comparison.costo)} min · {formatCop(comparison.costo_cop)}
              {comparison.diferencia > 0 && (
                <strong> (+{formatMinutes(comparison.diferencia)} min · +{formatCop(comparison.diferencia_cop)})</strong>
              )}
            </p>
            <p className={styles.compareText}>{comparison.mensaje}</p>
          </>
        )}
      </div>
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
            <CrossCircleIcon width={16} height={16} /> No se puede llegar
          </p>
          <p className={styles.message}>{route.mensaje}</p>
          <p className={styles.explanation}>{route.explicacion}</p>
        </>
      )}
      <DijkstraTrace route={route} />
    </div>
  )
}

export default RouteResult
