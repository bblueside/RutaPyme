// Contenedor temporal del formulario de lugar mientras la página siga usando diálogos sueltos (se borra en T5).
import { PinIcon } from '../shared/icons'
import Modal from '../shared/Modal'
import PointForm from './PointForm'

function AddPointDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} title="Un nuevo lugar en tu red." subtitle="Cada destino empieza con un nombre único." icon={<PinIcon />} size="sm" onClose={onClose}>
      <PointForm onDone={onClose} onCancel={onClose} />
    </Modal>
  )
}

export default AddPointDialog
