// Puntos alcanzables con sus trayectos y el punto desde el que se llega a ellos.
import { POINT_TYPE_COLOR } from '../../../constants/pointTypes'
import type { ReachablePoint } from '../../../types/coverage'
import Card from '../shared/Card'
import styles from './ReachableList.module.css'

function ReachableList({ points, className }: { points: ReachablePoint[]; className?: string }) {
  return (
    <Card title="Alcanzables" className={className}>
      {points.length === 0 ? (
        <p className="pn-muted">Ningún punto es alcanzable desde este origen.</p>
      ) : (
        <ul className={styles.list}>
          {points.map((point) => (
            <li key={point.id} className={styles.row}>
              <span className={styles.dot} style={{ background: POINT_TYPE_COLOR[point.tipo] }} aria-hidden="true" />
              <span className="pn-code">{point.id}</span>
              <span className={styles.hops}>
                {point.saltos} {point.saltos === 1 ? 'trayecto' : 'trayectos'}
              </span>
              <span className={styles.from}>llega desde {point.llega_desde}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default ReachableList
