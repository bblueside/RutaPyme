// Estructura del panel: providers, encabezado, la página única «Mi red de entregas» y avisos.
import { Outlet } from 'react-router-dom'
import { ApiHealthProvider } from '../../../context/ApiHealthProvider'
import { NetworkProvider } from '../../../context/NetworkProvider'
import { ToastProvider } from '../../../context/ToastProvider'
import { useApiHealth } from '../../../hooks/useApiHealth'
import { useNetwork } from '../../../hooks/useNetwork'
import ToastViewport from '../shared/ToastViewport'
import OfflineNotice from './OfflineNotice'
import PanelHeader from './PanelHeader'
import '../../../styles/panel-tokens.css'
import '../../../styles/panel-shape.css'
import '../../../styles/panel-controls.css'
import styles from './PanelLayout.module.css'

function PanelContent() {
  const { status, retry } = useApiHealth()
  const { error, network, refresh } = useNetwork()

  if (status === 'offline') return <OfflineNotice onRetry={retry} />
  if (error && !network) {
    return <OfflineNotice title="No se pudo cargar la red" message={error.message} onRetry={() => void refresh()} />
  }
  return <Outlet />
}

function PanelLayout() {
  return (
    <ApiHealthProvider>
      <NetworkProvider>
        <ToastProvider>
          <div className={styles.page}>
            <PanelHeader />
            <main className={styles.content}>
              <PanelContent />
            </main>
            <ToastViewport />
          </div>
        </ToastProvider>
      </NetworkProvider>
    </ApiHealthProvider>
  )
}

export default PanelLayout
