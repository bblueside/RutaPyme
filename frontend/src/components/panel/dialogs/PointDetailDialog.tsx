// Contenedor temporal del detalle de un lugar mientras la página siga usando diálogos sueltos (se borra en T5).
import { displayName } from '../../../constants/pointNames'
import Modal from '../shared/Modal'
import PointTypeIcon from '../shared/PointTypeIcon'
import { useNetwork } from '../../../hooks/useNetwork'
import PointDetailView from './PointDetailView'

function PointDetailDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { points } = useNetwork()
  const type = points.find((point) => point.id === id)?.tipo
  return (
    <Modal
      open={id !== null}
      title={id ? `${displayName(id)}.` : 'Lugar.'}
      subtitle="Detalle del lugar en tu red."
      icon={type && <PointTypeIcon type={type} size={22} />}
      size="sm"
      onClose={onClose}
    >
      {id && <PointDetailView id={id} />}
    </Modal>
  )
}

export default PointDetailDialog
