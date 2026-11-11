// Pie de página del panel.
import styles from './PanelFooter.module.css'

function PanelFooter() {
  return (
    <footer className={styles.footer}>
      <span className={styles.tagline}><span className={styles.dot} aria-hidden="true" /> Hecho para los negocios que mueven su barrio.</span>
      <span>Datos ficticios · Sin mapas ni GPS</span>
      <span>RutaPyme v1.0</span>
    </footer>
  )
}

export default PanelFooter
