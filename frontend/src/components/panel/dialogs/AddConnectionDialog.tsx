// Contenedor temporal del formulario de trayecto mientras la página siga usando diálogos sueltos (se borra en T5).
import { RouteIcon } from '../shared/icons'
import Modal from '../shared/Modal'
import ConnectionForm from './ConnectionForm'

interface AddConnectionDialogProps {
  open: boolean
  defaultOrigin: string
  defaultDestination: string
  onClose: () => void
}

function AddConnectionDialog({ open, defaultOrigin, defaultDestination, onClose }: AddConnectionDialogProps) {
  return (
    <Modal open={open} title="Conecta dos lugares." subtitle="Registra un trayecto en un solo sentido." icon={<RouteIcon />} size="sm" onClose={onClose}>
      <ConnectionForm defaultOrigin={defaultOrigin} defaultDestination={defaultDestination} onDone={onClose} onCancel={onClose} />
    </Modal>
  )
}

export default AddConnectionDialog
