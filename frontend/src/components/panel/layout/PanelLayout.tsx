// Estructura del panel: providers, encabezado, contenido de la vista activa y avisos.
import { Outlet } from 'react-router-dom'
import HeaderLight, { type HeaderSection } from '../../header/HeaderLight'
import { ApiHealthProvider } from '../../../context/ApiHealthProvider'
import { NetworkProvider } from '../../../context/NetworkProvider'
import { ToastProvider } from '../../../context/ToastProvider'
import { useApiHealth } from '../../../hooks/useApiHealth'
import { useNetwork } from '../../../hooks/useNetwork'
import { PANEL_ROUTES } from '../../../routes'
import ToastViewport from '../shared/ToastViewport'
import OfflineNotice from './OfflineNotice'
import PanelHeaderActions from './PanelHeaderActions'
import '../../../styles/panel-tokens.css'
import '../../../styles/panel-shape.css'
import '../../../styles/panel-controls.css'
import styles from './PanelLayout.module.css'

const SECTIONS: HeaderSection[] = [
  { id: 'overview', label: 'Resumen', to: PANEL_ROUTES.overview },
  { id: 'points', label: 'Puntos y conexiones', to: PANEL_ROUTES.points },
  { id: 'coverage', label: 'Cobertura', to: PANEL_ROUTES.coverage },
]

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
            <HeaderLight sections={SECTIONS} homeHref="/" actions={<PanelHeaderActions />} />
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
