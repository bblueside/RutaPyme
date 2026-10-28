// Sustituye a la vista cuando no hay conexión con la API (o la red no se pudo cargar).
import { CrossCircleIcon } from '../shared/icons'
import ViewHeader from './ViewHeader'
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
    <>
      <ViewHeader title="Panel de la red" description="No se pudo cargar la red." />
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
    </>
  )
}

export default OfflineNotice
