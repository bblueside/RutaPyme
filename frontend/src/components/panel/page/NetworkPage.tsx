// Página única «Mi red de entregas»: junta el mapa, el planificador de rutas, la cobertura y las tablas.
// Aquí vive el estado compartido (origen, destino, modo del mapa) y las consultas a la API.
import { useState } from 'react'
import { useApiHealth } from '../../../hooks/useApiHealth'
import { useApiResource } from '../../../hooks/useApiResource'
import { useDeliverySelection } from '../../../hooks/useDeliverySelection'
import { useNetwork } from '../../../hooks/useNetwork'
import { useRouteQuery } from '../../../hooks/useRouteQuery'
import { checkReachability, getCoverage } from '../../../services/coverageService'
import CoverageCard from '../coverage/CoverageCard'
import AddConnectionDialog from '../dialogs/AddConnectionDialog'
import AddPointDialog from '../dialogs/AddPointDialog'
import PointDetailDialog from '../dialogs/PointDetailDialog'
import NetworkMapCard from '../map/NetworkMapCard'
import DeliveryPlannerCard from '../planner/DeliveryPlannerCard'
import NetworkTables from '../tables/NetworkTables'
import { InfoIcon } from '../shared/icons'
import PageIntro from './PageIntro'
import PanelFooter from './PanelFooter'
import StatCards from './StatCards'
import styles from './NetworkPage.module.css'

type Dialog = { kind: 'point' } | { kind: 'connection' } | { kind: 'detail'; id: string } | null

function NetworkPage() {
  const { status } = useApiHealth()
  const { points, connections, network, version, loading } = useNetwork()
  const selection = useDeliverySelection(points, network)
  const { origin, destination, mode } = selection
  const [dialog, setDialog] = useState<Dialog>(null)

  const coverageResource = useApiResource(origin ? `coverage|${origin}|${version}` : null, () => getCoverage(origin))
  const reachabilityResource = useApiResource(
    mode === 'coverage' && origin && destination ? `reach|${origin}|${destination}|${version}` : null,
    () => checkReachability(origin, destination),
  )
  const routeQuery = useRouteQuery(origin, destination, version)

  async function findRoute() {
    const route = await routeQuery.find()
    if (route) selection.setMode('route')
  }

  const online = status === 'online'

  return (
    <div className={styles.page}>
      <PageIntro onAddPoint={() => setDialog({ kind: 'point' })} />
      <StatCards network={network} coverage={origin ? (coverageResource.data ?? coverageResource.latest) : null} origin={origin} />

      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.map}>
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
              reachability={reachabilityResource.data}
              onAddConnection={() => setDialog({ kind: 'connection' })}
              onAddPoint={() => setDialog({ kind: 'point' })}
            />
          </div>
          <div className={styles.tables}>
            <NetworkTables
              points={points}
              connections={connections}
              network={network}
              coverage={coverageResource.data}
              origin={origin}
              canEdit={online}
              onOpenPoint={(id) => setDialog({ kind: 'detail', id })}
              onAddPoint={() => setDialog({ kind: 'point' })}
            />
          </div>
        </div>

        <div className={styles.side}>
          <div className={styles.planner}>
            <DeliveryPlannerCard
              status={status}
              points={points}
              origin={origin}
              destination={destination}
              onOriginChange={selection.setOrigin}
              onDestinationChange={selection.setDestination}
              onSwap={selection.swap}
              onFind={() => void findRoute()}
              pending={routeQuery.pending}
              error={routeQuery.error}
              route={routeQuery.route}
            />
          </div>
          <div className={styles.coverage}>
            <CoverageCard
              origin={origin}
              destination={destination}
              coverage={coverageResource.data}
              loading={coverageResource.loading}
              error={coverageResource.error}
              mode={mode}
              onShowCoverage={() => selection.setMode('coverage')}
              reachability={reachabilityResource.data}
            />
          </div>
          <p className={styles.note}>
            <InfoIcon width={18} height={18} />
            <span><strong>Ir no siempre significa poder volver.</strong> Los trayectos tienen un solo sentido. Cada dirección se registra por separado.</span>
          </p>
        </div>
      </div>

      <PanelFooter />

      <AddPointDialog open={dialog?.kind === 'point'} onClose={() => setDialog(null)} />
      <AddConnectionDialog
        open={dialog?.kind === 'connection'}
        defaultOrigin={origin}
        defaultDestination={destination}
        onClose={() => setDialog(null)}
      />
      <PointDetailDialog id={dialog?.kind === 'detail' ? dialog.id : null} onClose={() => setDialog(null)} />
    </div>
  )
}

export default NetworkPage
