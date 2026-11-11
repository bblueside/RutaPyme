// Camino como secuencia de nombres con la marca del color de cada tipo de lugar.
import { POINT_TYPE_COLOR } from '../../../constants/pointTypes'
import { displayName } from '../../../constants/pointNames'
import { useNetwork } from '../../../hooks/useNetwork'
import styles from './RoutePath.module.css'

function RoutePath({ path, label }: { path: string[]; label: string }) {
  const { points } = useNetwork()
  const types = new Map(points.map((point) => [point.id, point.tipo]))

  return (
    <ol className={styles.path} aria-label={label}>
      {path.map((id, index) => {
        const type = types.get(id)
        return (
          <li key={`${id}-${index}`} className={styles.item}>
            {index > 0 && <span className={styles.sep} aria-hidden="true">→</span>}
            <span className={styles.chip} title={id}>
              {type && <span className={styles.mark} style={{ background: POINT_TYPE_COLOR[type] }} aria-hidden="true" />}
              {displayName(id)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export default RoutePath
