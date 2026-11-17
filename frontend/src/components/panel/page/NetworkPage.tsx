// Página única «Mi red de entregas»: junta el mapa, el planificador de rutas, la cobertura y las tablas.
// Aquí vive el estado compartido (origen, destino, modo del mapa) y las consultas a la API.
import { useRef, useState } from 'react'
import { useApiHealth } from '../../../hooks/useApiHealth'
import { useApiResource } from '../../../hooks/useApiResource'
import { useDeliverySelection, type MapMode } from '../../../hooks/useDeliverySelection'
import { useNetwork } from '../../../hooks/useNetwork'
import { useRatePerMinute } from '../../../hooks/useRatePerMinute'
import { useRouteQuery } from '../../../hooks/useRouteQuery'
import { getCoverage } from '../../../services/coverageService'
import CoverageDialog from '../coverage/CoverageDialog'
import AddConnectionDialog from '../dialogs/AddConnectionDialog'
import AddPointDialog from '../dialogs/AddPointDialog'
import NetworkDetailsDialog from '../dialogs/NetworkDetailsDialog'
import PointDetailDialog from '../dialogs/PointDetailDialog'
import NetworkMapCard from '../map/NetworkMapCard'
import DeliveryPlannerDialog from '../planner/DeliveryPlannerDialog'
import NetworkTables from '../tables/NetworkTables'
import { InfoIcon } from '../shared/icons'
import PageIntro from './PageIntro'
import PanelFooter from './PanelFooter'
import StatCards from './StatCards'
import styles from './NetworkPage.module.css'

type Dialog = { kind: 'point' } | { kind: 'connection' } | { kind: 'detail'; id: string } | { kind: 'network' } | { kind: 'planner' } | { kind: 'coverage' } | null

function NetworkPage() {
  const { status } = useApiHealth()
  const { points, connections, network, version, loading } = useNetwork()
  const selection = useDeliverySelection(points, network)
  const { origin, destination, mode } = selection
  const [dialog, setDialog] = useState<Dialog>(null)

  const coverageResource = useApiResource(origin ? `coverage|${origin}|${version}` : null, () => getCoverage(origin))
  const routeQuery = useRouteQuery(origin, destination, version)

  const online = status === 'online'
  const ratePerMinute = useRatePerMinute(connections)
  const mapRef = useRef<HTMLDivElement>(null)

  // D-07: cierra el modal, pone el mapa en el modo pedido y desplaza la página hasta él.
  function showOnMap(next: MapMode) {
    selection.setMode(next)
    setDialog(null)
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => mapRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' }))
  }

  return (
    <div className={styles.page}>
      <PageIntro onAddPoint={() => setDialog({ kind: 'point' })} />
      {/* TEMPORAL (T2 a T4): botones para probar los modales; T5 los reemplaza por los definitivos. */}
      <div className="pn-actions">
        <button type="button" className="pn-btn pn-btn--secondary" disabled={!online} onClick={() => setDialog({ kind: 'network' })}>
          Gestionar red
        </button>
        <button type="button" className="pn-btn pn-btn--secondary" disabled={!online || points.length < 1} onClick={() => setDialog({ kind: 'coverage' })}>
          Cobertura
        </button>
        <button type="button" className="pn-btn pn-btn--primary" disabled={!online || points.length < 2} onClick={() => setDialog({ kind: 'planner' })}>
          Planear entrega
        </button>
      </div>
      <StatCards network={network} coverage={origin ? (coverageResource.data ?? coverageResource.latest) : null} origin={origin} />

      <div className={styles.layout}>
        <div className={styles.main}>
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
              ratePerMinute={ratePerMinute}
              onOpenPoint={(point) => setDialog({ kind: 'detail', id: point.id })}
              onAddPoint={() => setDialog({ kind: 'point' })}
              onAddConnection={() => setDialog({ kind: 'connection' })}
            />
          </div>
        </div>

        <div className={styles.side}>
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
      <NetworkDetailsDialog
        open={dialog?.kind === 'network'}
        onClose={() => setDialog(null)}
        origin={origin}
        destination={destination}
        coverage={coverageResource.data}
        online={online}
      />
      <DeliveryPlannerDialog
        open={dialog?.kind === 'planner'}
        onClose={() => setDialog(null)}
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
        open={dialog?.kind === 'coverage'}
        onClose={() => setDialog(null)}
        points={points}
        origin={origin}
        onOriginChange={selection.setOrigin}
        coverage={coverageResource.data}
        loading={coverageResource.loading}
        error={coverageResource.error}
        onShowOnMap={showOnMap}
      />
      <PointDetailDialog id={dialog?.kind === 'detail' ? dialog.id : null} onClose={() => setDialog(null)} />
    </div>
  )
}

export default NetworkPage
