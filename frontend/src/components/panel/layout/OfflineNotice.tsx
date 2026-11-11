// Sustituye a la página cuando no hay conexión con la API (o la red no se pudo cargar).
import { CrossCircleIcon } from '../shared/icons'
import styles from './OfflineNotice.module.css'

interface OfflineNoticeProps {
  title?: string
  message?: string
  onRetry: () => void
}

function OfflineNotice({
  title = 'No hay conexión con la API',
  message = 'Compruebe que el backend esté encendido (python main.py --ejemplo) y vuelva a intentarlo.',
  onRetry,
}: OfflineNoticeProps) {
  return (
    <section className={`pn-card ${styles.card}`} role="alert">
      <span className={styles.icon}>
        <CrossCircleIcon width={26} height={26} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      <button type="button" className="pn-btn pn-btn--primary" onClick={onRetry}>
        Reintentar
      </button>
    </section>
  )
}

export default OfflineNotice
