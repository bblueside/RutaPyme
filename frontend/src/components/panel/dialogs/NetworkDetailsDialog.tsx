// «Los detalles de tu red.»: vista raíz de la pila con las pestañas Tus lugares / Trayectos. Desde aquí se apilan
// el formulario de lugar, el de trayecto y el detalle de un lugar.
import { useDialogStack } from '../../../hooks/useDialogStack'
import { useNetwork } from '../../../hooks/useNetwork'
import { useRatePerMinute } from '../../../hooks/useRatePerMinute'
import type { Coverage } from '../../../types/coverage'
import { NetworkIcon } from '../shared/icons'
import StackDialog from '../shared/StackDialog'
import NetworkTables from '../tables/NetworkTables'
import { connectionFormView, pointDetailView, pointFormView } from './stackViews'

interface NetworkDetailsDialogProps {
  open: boolean
  onClose: () => void
  origin: string
  destination: string
  /** Cobertura del origen elegido: de ahí sale la columna Estado. */
  coverage: Coverage | null
  /** Con la API sin conexión la vista queda en solo lectura (D-13). */
  online: boolean
}

type ViewProps = Omit<NetworkDetailsDialogProps, 'open' | 'onClose'>

function NetworkDetailsView({ origin, destination, coverage, online }: ViewProps) {
  const { points, connections, network } = useNetwork()
  const { push } = useDialogStack()
  const ratePerMinute = useRatePerMinute(connections)

  return (
    <NetworkTables
      points={points}
      connections={connections}
      network={network}
      coverage={coverage}
      origin={origin}
      canEdit={online}
      ratePerMinute={ratePerMinute}
      onOpenPoint={(point) => push(pointDetailView(point))}
      onAddPoint={() => push(pointFormView())}
      onAddConnection={() => push(connectionFormView(origin, destination))}
    />
  )
}

function NetworkDetailsDialog({ open, onClose, ...view }: NetworkDetailsDialogProps) {
  return (
    <StackDialog
      open={open}
      onClose={onClose}
      root={{
        id: 'network-details',
        title: 'Los detalles de tu red.',
        subtitle: 'Consulta tus lugares y trayectos. Todo conectado, en un solo espacio.',
        icon: <NetworkIcon />,
        size: 'lg',
        render: () => <NetworkDetailsView {...view} />,
      }}
    />
  )
}

export default NetworkDetailsDialog
