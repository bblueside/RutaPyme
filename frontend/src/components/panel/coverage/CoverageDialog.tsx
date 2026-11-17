// Modal «¿Hasta dónde puedes llegar?». Usa la pila para abrir el detalle de un lugar con «Volver».
import StackDialog from '../shared/StackDialog'
import { TargetIcon } from '../shared/icons'
import CoverageView from './CoverageView'

type CoverageDialogProps = { open: boolean; onClose: () => void } & Parameters<typeof CoverageView>[0]

function CoverageDialog({ open, onClose, ...view }: CoverageDialogProps) {
  return (
    <StackDialog
      open={open}
      onClose={onClose}
      root={{
        id: 'coverage',
        title: '¿Hasta dónde puedes llegar?',
        subtitle: 'Elige un origen y revisa qué lugares puedes atender.',
        icon: <TargetIcon />,
        size: 'md',
        render: () => <CoverageView {...view} />,
      }}
    />
  )
}

export default CoverageDialog
