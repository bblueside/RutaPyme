// Puntos que no se cubren desde el origen, con el motivo tal como lo devuelve la API.
import type { UnreachablePoint } from '../../../types/coverage'
import Card from '../shared/Card'
import styles from './UnreachableList.module.css'

function UnreachableList({ points, className }: { points: UnreachablePoint[]; className?: string }) {
  return (
    <Card title="No alcanzables" className={className}>
      {points.length === 0 ? (
        <p className="pn-muted">Todos los puntos de la red se cubren desde este origen.</p>
      ) : (
        <ul className={styles.list}>
          {points.map((point) => (
            <li key={point.id} className={styles.row}>
              <span className="pn-code">{point.id}</span>
              <span className={styles.reason}>{point.motivo}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default UnreachableList
