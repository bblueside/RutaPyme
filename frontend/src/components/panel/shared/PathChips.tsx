// Secuencia de puntos como chips monoespaciados con marca del color del tipo.
import { POINT_TYPE_COLOR } from '../../../constants/pointTypes'
import { useNetwork } from '../../../hooks/useNetwork'
import styles from './PathChips.module.css'

interface PathChipsProps {
  path: string[]
  /** Símbolo entre chips; "none" los deja sueltos (p. ej. lista de alcanzables). */
  separator?: '→' | '›' | 'none'
  size?: 'large' | 'compact'
  /** Pinta el primero (origen) en azul tenue y el último (destino) en ámbar tenue. */
  highlightEnds?: boolean
  label?: string
}

function PathChips({ path, separator = '→', size = 'compact', highlightEnds = false, label }: PathChipsProps) {
  const { points } = useNetwork()
  const types = new Map(points.map((point) => [point.id, point.tipo]))

  return (
    <ol className={`${styles.chips} ${size === 'large' ? styles.large : ''}`} aria-label={label}>
      {path.map((id, index) => {
        const type = types.get(id)
        const role =
          highlightEnds && index === 0 ? styles.origin : highlightEnds && index === path.length - 1 ? styles.target : ''
        return (
          <li key={`${id}-${index}`} className={styles.item}>
            {index > 0 && separator !== 'none' && (
              <span className={styles.separator} aria-hidden="true">
                {separator}
              </span>
            )}
            <span className={`${styles.chip} ${role}`}>
              {type && <span className={styles.mark} style={{ background: POINT_TYPE_COLOR[type] }} aria-hidden="true" />}
              {id}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export default PathChips
