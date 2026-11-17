// Camino tramo a tramo: cada lugar con su minuto acumulado y, entre lugares, el tiempo y el costo del tramo.
import { displayName } from '../../../constants/pointNames'
import { formatCop, formatMinutes } from '../../../lib/formatCop'
import type { RouteFound } from '../../../types/route'
import styles from './RouteTimeline.module.css'

function RouteTimeline({ route }: { route: RouteFound }) {
  return (
    <ol className={styles.timeline} aria-label="Ruta más rápida, tramo a tramo">
      {route.camino.map((id, index) => {
        const leg = route.tramos[index]
        const previous = route.tramos[index - 1]
        return (
          <li key={`${id}-${index}`}>
            <div className={styles.stop}>
              <span className={styles.node} aria-hidden="true" />
              <strong title={id}>{displayName(id)}</strong>
              <span className={styles.when}>{previous ? `${formatMinutes(previous.acumulado)} min` : 'Inicio'}</span>
            </div>
            {leg && (
              <div className={styles.leg}>
                <span className={styles.figures}>{formatMinutes(leg.costo)} min</span>
                <span className={styles.figures}>{formatCop(leg.costo_cop)} · acum. {formatCop(leg.acumulado_cop)}</span>
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default RouteTimeline
