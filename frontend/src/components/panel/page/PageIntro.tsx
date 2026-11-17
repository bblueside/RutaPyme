// Antetítulo, título y las dos acciones principales: revisar la cobertura y planear una entrega.
// Se desactivan sin conexión (D-13) o sin suficientes lugares (D-14), siempre con el motivo en el tooltip.
import type { ApiStatus } from '../../../context/apiHealthContext'
import { RouteIcon, TargetIcon } from '../shared/icons'
import styles from './PageIntro.module.css'

interface PageIntroProps {
  status: ApiStatus
  placeCount: number
  onCoverage: () => void
  onPlanner: () => void
}

function PageIntro({ status, placeCount, onCoverage, onPlanner }: PageIntroProps) {
  const online = status === 'online'
  const offlineHint = status === 'offline' ? 'Sin conexión con el servidor.' : undefined
  const coverageHint = offlineHint ?? (placeCount < 1 ? 'Necesitas al menos un lugar.' : undefined)
  const plannerHint = offlineHint ?? (placeCount < 2 ? 'Necesitas al menos dos lugares.' : undefined)

  return (
    <div className={styles.intro}>
      <div>
        <p className={styles.eyebrow}>Conecta. Planea. Entrega.</p>
        <h1 className={styles.title}>Tu operación, conectada.</h1>
        <p className={styles.lead}>Gestiona tu red, revisa la cobertura y encuentra la mejor ruta en un solo lugar.</p>
      </div>
      <div className={styles.actions}>
        <span title={coverageHint}>
          <button type="button" className={`pn-btn pn-btn--secondary ${styles.action}`} disabled={!online || placeCount < 1} onClick={onCoverage}>
            <TargetIcon /> Cobertura
          </button>
        </span>
        <span title={plannerHint}>
          <button type="button" className={`pn-btn pn-btn--primary ${styles.action}`} disabled={!online || placeCount < 2} onClick={onPlanner}>
            <RouteIcon /> Planear entrega
          </button>
        </span>
      </div>
    </div>
  )
}

export default PageIntro
