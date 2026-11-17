// «Agregar lugar» desde el mapa vacío: el formulario es la vista raíz, sin «Volver»; al guardar se cierra (D-15).
import StackDialog from '../shared/StackDialog'
import { pointFormView } from './stackViews'

function AddPointRootDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <StackDialog open={open} onClose={onClose} root={pointFormView()} />
}

export default AddPointRootDialog
