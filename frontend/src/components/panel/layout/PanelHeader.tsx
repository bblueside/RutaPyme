// Encabezado del panel: marca, pastilla "Mi red de entregas", ayuda y menú de demostración. Sin menú lateral.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import logoAzul from '../../../assets/logo_blue.png'
import { INTERFACE_ROUTE } from '../../../routes'
import HelpDialog from '../dialogs/HelpDialog'
import { HelpIcon, NetworkIcon } from '../shared/icons'
import DemoMenu from './DemoMenu'
import styles from './PanelHeader.module.css'

function PanelHeader() {
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a className={styles.brand} href="/">
          <img className={styles.logo} src={logoAzul} alt="RutaPyme" />
        </a>
        <Link className={styles.pill} to={INTERFACE_ROUTE} aria-current="page">
          <NetworkIcon width={18} height={18} />
          <span className={styles.pillLabel}>Mi red de entregas</span>
          <span className={styles.pillDot} aria-hidden="true" />
        </Link>
        <div className={styles.actions}>
          <button type="button" className={styles.help} onClick={() => setHelpOpen(true)}>
            <HelpIcon width={18} height={18} />
            <span className={styles.helpLabel}>Ayuda y cómo funciona</span>
          </button>
          <DemoMenu />
        </div>
      </div>
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  )
}

export default PanelHeader
