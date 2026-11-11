// Antetítulo, título y acción principal de la página.
import { useApiHealth } from '../../../hooks/useApiHealth'
import { PlusIcon } from '../shared/icons'
import styles from './PageIntro.module.css'

function PageIntro({ onAddPoint }: { onAddPoint: () => void }) {
  const { status } = useApiHealth()

  return (
    <div className={styles.intro}>
      <div>
        <p className={styles.eyebrow}>Conecta. Planea. Entrega.</p>
        <h1 className={styles.title}>Tu operación, conectada.</h1>
        <p className={styles.lead}>Gestiona tu red, revisa la cobertura y encuentra la mejor ruta en un solo lugar.</p>
      </div>
      <button type="button" className={`pn-btn pn-btn--primary ${styles.add}`} disabled={status !== 'online'} onClick={onAddPoint}>
        <PlusIcon /> Agregar lugar
      </button>
    </div>
  )
}

export default PageIntro
