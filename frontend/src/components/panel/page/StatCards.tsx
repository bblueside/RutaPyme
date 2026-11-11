// Tres contadores: lugares, trayectos y cobertura del origen elegido. Todo viene de la API.
import type { ReactNode } from 'react'
import { displayName } from '../../../constants/pointNames'
import type { Coverage } from '../../../types/coverage'
import type { Network } from '../../../types/network'
import { RouteIcon, PinIcon, TargetIcon } from '../shared/icons'
import styles from './StatCards.module.css'

interface StatCardsProps {
  network: Network | null
  coverage: Coverage | null
  origin: string
}

function Stat({ index, icon, tone, label, value, caption }: { index: string; icon: ReactNode; tone: 'blue' | 'green'; label: ReactNode; value: ReactNode; caption: string }) {
  return (
    <article className={`pn-card ${styles.card}`}>
      <span className={styles.index} aria-hidden="true">{index}</span>
      <span className={`${styles.icon} ${tone === 'green' ? styles.green : ''}`}>{icon}</span>
      <div>
        <p className={styles.label}>{label}</p>
        <p className={styles.value}><strong>{value}</strong> <span>{caption}</span></p>
      </div>
    </article>
  )
}

function StatCards({ network, coverage, origin }: StatCardsProps) {
  const reachable = coverage?.total_alcanzables
  const total = coverage ? coverage.total_alcanzables + coverage.total_no_alcanzables : 0

  return (
    <section className={styles.row} aria-label="Resumen de tu red">
      <Stat index="01" tone="blue" icon={<PinIcon width={22} height={22} />} label="Lugares en tu red"
        value={network ? network.resumen.puntos : '–'} caption="puntos conectados" />
      <Stat index="02" tone="blue" icon={<RouteIcon width={22} height={22} />} label="Trayectos disponibles"
        value={network ? network.resumen.conexiones : '–'} caption="en un solo sentido" />
      <Stat index="03" tone="green" icon={<TargetIcon width={22} height={22} />}
        label={origin ? <>Cobertura desde <strong>{displayName(origin)}</strong></> : 'Cobertura'}
        value={reachable ?? '–'} caption={coverage ? `de ${total} lugares alcanzables` : 'sin origen elegido'} />
    </section>
  )
}

export default StatCards
