// Recuadros con una cifra grande y su etiqueta (Alcanzables, Capas, Trayectos…).
import styles from './StatTiles.module.css'

interface Stat {
  label: string
  value: string | number
}

function StatTiles({ stats }: { stats: Stat[] }) {
  return (
    <dl className={styles.tiles}>
      {stats.map((stat) => (
        <div key={stat.label} className={styles.tile}>
          <dd className={styles.value}>{stat.value}</dd>
          <dt className={styles.label}>{stat.label}</dt>
        </div>
      ))}
    </dl>
  )
}

export default StatTiles
