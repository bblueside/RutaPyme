// Pantallas de la pila que necesitan `back` (volver a la vista anterior o cerrar si son la raíz).
import { useDialogStack } from '../../../hooks/useDialogStack'
import ConnectionForm from './ConnectionForm'
import PointForm from './PointForm'

export function PointFormScreen() {
  const { back } = useDialogStack()
  return <PointForm onDone={back} onCancel={back} />
}

export function ConnectionFormScreen({ origin, destination }: { origin: string; destination: string }) {
  const { back } = useDialogStack()
  return <ConnectionForm defaultOrigin={origin} defaultDestination={destination} onDone={back} onCancel={back} />
}
