// Página única «Mi red de entregas»: encabezado, contadores y el mapa a todo el ancho. Cada tarea (gestionar la
// red, planear una entrega, revisar la cobertura) se abre en un modal. Aquí vive el estado compartido (origen,
// destino, modo del mapa), las consultas a la API y cuál modal está abierto.
import { useRef, useState } from 'react'
import { useApiHealth } from '../../../hooks/useApiHealth'
import { useApiResource } from '../../../hooks/useApiResource'
import { useDeliverySelection, type MapMode } from '../../../hooks/useDeliverySelection'
import { useNetwork } from '../../../hooks/useNetwork'
import { useRouteQuery } from '../../../hooks/useRouteQuery'
import { getCoverage } from '../../../services/coverageService'
import CoverageDialog from '../coverage/CoverageDialog'
import AddPointRootDialog from '../dialogs/AddPointRootDialog'
import NetworkDetailsDialog from '../dialogs/NetworkDetailsDialog'
import NetworkMapCard from '../map/NetworkMapCard'
import DeliveryPlannerDialog from '../planner/DeliveryPlannerDialog'
import PageIntro from './PageIntro'
import PanelFooter from './PanelFooter'
import StatCards from './StatCards'
import styles from './NetworkPage.module.css'

type OpenDialog = 'network' | 'planner' | 'coverage' | 'add-point-root' | null

function NetworkPage() {
  const { status } = useApiHealth()
  const { points, network, version, loading } = useNetwork()
  const selection = useDeliverySelection(points, network)
  const { origin, destination, mode } = selection
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  const coverageResource = useApiResource(origin ? `coverage|${origin}|${version}` : null, () => getCoverage(origin))
  const routeQuery = useRouteQuery(origin, destination, version)

  const online = status === 'online'
  const canCover = online && points.length >= 1
  const canPlan = online && points.length >= 2
  const close = () => setOpenDialog(null)

  // D-07: cierra el modal, pone el mapa en el modo pedido y desplaza la página hasta él.
  function showOnMap(next: MapMode) {
    selection.setMode(next)
    setOpenDialog(null)
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => mapRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' }))
  }

  return (
    <div className={styles.page}>
      <PageIntro status={status} placeCount={points.length} onCoverage={() => setOpenDialog('coverage')} onPlanner={() => setOpenDialog('planner')} />
      <StatCards network={network} coverage={origin ? (coverageResource.data ?? coverageResource.latest) : null} origin={origin} />

      <div className={styles.map} ref={mapRef}>
        <NetworkMapCard
          status={status}
          points={points}
          network={network}
          coverage={origin ? coverageResource.latest : null}
          version={version}
          loading={loading}
          mode={mode}
          onModeChange={selection.setMode}
          origin={origin}
          destination={destination}
          route={routeQuery.route}
          onManage={() => setOpenDialog('network')}
          onAddPoint={() => setOpenDialog('add-point-root')}
          onOpenPlanner={() => setOpenDialog('planner')}
          onOpenCoverage={() => setOpenDialog('coverage')}
          canPlan={canPlan}
          canCover={canCover}
        />
      </div>

      <PanelFooter />

      <NetworkDetailsDialog
        open={openDialog === 'network'}
        onClose={close}
        origin={origin}
        destination={destination}
        coverage={coverageResource.data}
        online={online}
      />
      <AddPointRootDialog open={openDialog === 'add-point-root'} onClose={close} />
      <DeliveryPlannerDialog
        open={openDialog === 'planner'}
        onClose={close}
        status={status}
        points={points}
        origin={origin}
        destination={destination}
        onOriginChange={selection.setOrigin}
        onDestinationChange={selection.setDestination}
        onSwap={selection.swap}
        onFind={() => void routeQuery.find()}
        pending={routeQuery.pending}
        error={routeQuery.error}
        route={routeQuery.route}
        onShowOnMap={showOnMap}
      />
      <CoverageDialog
        open={openDialog === 'coverage'}
        onClose={close}
        points={points}
        origin={origin}
        onOriginChange={selection.setOrigin}
        coverage={coverageResource.data}
        loading={coverageResource.loading}
        error={coverageResource.error}
        onShowOnMap={showOnMap}
      />
    </div>
  )
}

export default NetworkPage
