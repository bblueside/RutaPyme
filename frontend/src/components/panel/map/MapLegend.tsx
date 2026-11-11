// Leyenda del mapa: tipos de lugar (colores del brief), lugares sin conexión y sentido de los trayectos.
import { POINT_TYPES, POINT_TYPE_COLOR, POINT_TYPE_LABEL } from '../../../constants/pointTypes'
import type { MapMode } from '../../../hooks/useDeliverySelection'
import styles from './MapLegend.module.css'

interface MapLegendProps {
  mode: MapMode
  /** Hay una ruta más rápida resaltada. */
  showRoute: boolean
  /** Hay una ruta de menos tramos distinta, dibujada en discontinua. */
  showFewest: boolean
}

function MapLegend({ mode, showRoute, showFewest }: MapLegendProps) {
  return (
    <div className={styles.legend}>
      <ul className={styles.list} aria-label="Leyenda del mapa">
        {POINT_TYPES.map((type) => (
          <li key={type} className={styles.item}>
            <span className={styles.dot} style={{ background: POINT_TYPE_COLOR[type] }} aria-hidden="true" />
            {POINT_TYPE_LABEL[type]}
          </li>
        ))}
        <li className={styles.item}>
          <span className={styles.dashedDot} aria-hidden="true" />
          Sin conexión
        </li>
        {mode === 'coverage' && (
          <li className={styles.item}>
            <span className={styles.layer} aria-hidden="true">1</span>
            Trayectos desde el origen
          </li>
        )}
        {showRoute && (
          <li className={styles.item}>
            <span className={styles.lineSolid} aria-hidden="true" />
            Ruta más rápida
          </li>
        )}
        {showFewest && (
          <li className={styles.item}>
            <span className={styles.lineDashed} aria-hidden="true" />
            Ruta de menos tramos
          </li>
        )}
      </ul>
      <span className={styles.direction}>
        <span aria-hidden="true">→</span> Trayecto de un sentido
      </span>
    </div>
  )
}

export default MapLegend
