// Tipo de lugar: chip con el color del tipo (variante "badge") o punto de color + etiqueta (variante "dot").
import type { CSSProperties } from 'react'
import { POINT_TYPE_COLOR, POINT_TYPE_LABEL } from '../../../constants/pointTypes'
import type { PointType } from '../../../types/network'
import styles from './TypeBadge.module.css'

interface TypeBadgeProps {
  type: PointType
  variant?: 'badge' | 'dot'
}

function TypeBadge({ type, variant = 'badge' }: TypeBadgeProps) {
  const style = { '--type-color': POINT_TYPE_COLOR[type] } as CSSProperties
  if (variant === 'dot') {
    return (
      <span className={styles.dotWrap} style={style}>
        <span className={styles.dot} aria-hidden="true" />
        {POINT_TYPE_LABEL[type]}
      </span>
    )
  }
  return (
    <span className={styles.badge} style={style}>
      {POINT_TYPE_LABEL[type]}
    </span>
  )
}

export default TypeBadge
