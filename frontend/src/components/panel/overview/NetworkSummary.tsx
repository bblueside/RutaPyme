// Cinco contadores: puntos, conexiones y puntos por tipo (valores de red.resumen).
import { POINT_TYPES, POINT_TYPE_COLOR, POINT_TYPE_PLURAL } from '../../../constants/pointTypes'
import { useNetwork } from '../../../hooks/useNetwork'
import styles from './NetworkSummary.module.css'

const SUPPORT: Record<string, string> = {
  puntos: 'Total en la red',
  conexiones: 'Arcos registrados',
  bodega: 'Orígenes de carga',
  barrio: 'Zonas servidas',
  punto_recogida: 'Destinos de entrega',
}

function NetworkSummary() {
  const { network, loading } = useNetwork()

  if (loading || !network) {
    return (
      <div className={styles.row}>
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className={`pn-skeleton ${styles.skeleton}`} aria-hidden="true" />
        ))}
      </div>
    )
  }

  const { resumen } = network
  const tiles = [
    { key: 'puntos', label: 'Puntos', value: resumen.puntos, color: 'var(--panel-accent)' },
    { key: 'conexiones', label: 'Conexiones', value: resumen.conexiones, color: 'var(--panel-ink-soft)' },
    ...POINT_TYPES.map((type) => ({
      key: type,
      label: POINT_TYPE_PLURAL[type],
      value: resumen.por_tipo[type] ?? 0,
      color: POINT_TYPE_COLOR[type],
    })),
  ]

  return (
    <ul className={styles.row} aria-label="Contadores de la red">
      {tiles.map((tile) => (
        <li key={tile.key} className={`pn-card ${styles.tile}`}>
          <div className={styles.top}>
            <span className={styles.label}>{tile.label}</span>
            <span className={styles.dot} style={{ background: tile.color }} aria-hidden="true" />
          </div>
          <span className={styles.value}>{tile.value}</span>
          <span className={styles.support}>{SUPPORT[tile.key]}</span>
        </li>
      ))}
    </ul>
  )
}

export default NetworkSummary
