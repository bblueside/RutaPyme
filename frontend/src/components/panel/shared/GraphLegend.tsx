// Leyenda de los tres tipos de punto, con los mismos colores de la imagen de NetworkX.
import { POINT_TYPES } from '../../../constants/pointTypes'
import TypeBadge from './TypeBadge'
import styles from './GraphLegend.module.css'

function GraphLegend() {
  return (
    <ul className={styles.legend} aria-label="Leyenda de tipos de punto">
      {POINT_TYPES.map((type) => (
        <li key={type}>
          <TypeBadge type={type} variant="dot" />
        </li>
      ))}
    </ul>
  )
}

export default GraphLegend
