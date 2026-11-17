// Modal «Planea tu próxima entrega.»: la selección (origen, destino) y el último resultado viven en la página,
// así se conservan al cerrar y volver a abrir (D-08).
import Modal from '../shared/Modal'
import { RouteIcon } from '../shared/icons'
import DeliveryPlannerView from './DeliveryPlannerView'

type DeliveryPlannerDialogProps = { open: boolean; onClose: () => void } & Parameters<typeof DeliveryPlannerView>[0]

function DeliveryPlannerDialog({ open, onClose, ...view }: DeliveryPlannerDialogProps) {
  return (
    <Modal
      open={open}
      title="Planea tu próxima entrega."
      subtitle="Elige un origen y un destino para comparar tiempo y costo."
      icon={<RouteIcon />}
      size="md"
      onClose={onClose}
    >
      <DeliveryPlannerView {...view} />
    </Modal>
  )
}

export default DeliveryPlannerDialog
