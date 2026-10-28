// Estado de la API: gris "Conectando…", verde "API en línea" o rojo "API sin conexión" + botón "Reintentar".
import { useApiHealth } from '../../../hooks/useApiHealth'
import styles from './HealthIndicator.module.css'

const LABELS = { checking: 'Conectando…', online: 'API en línea', offline: 'API sin conexión' } as const

function HealthIndicator() {
  const { status, retry } = useApiHealth()

  return (
    <div className={styles.wrap}>
      <span className={`${styles.badge} ${styles[status]}`} role="status">
        <span className={styles.dot} aria-hidden="true">●</span>
        <span className={styles.label}>{LABELS[status]}</span>
      </span>
      {status === 'offline' && (
        <button type="button" className="pn-btn pn-btn--danger-soft" onClick={retry}>
          Reintentar
        </button>
      )}
    </div>
  )
}

export default HealthIndicator
