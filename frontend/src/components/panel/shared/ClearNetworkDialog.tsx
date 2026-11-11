// Confirmación para vaciar la red (DELETE /api/red). Acción destructiva: pide confirmar.
import { useApiHealth } from '../../../hooks/useApiHealth'
import { useNetwork } from '../../../hooks/useNetwork'
import { useSubmit } from '../../../hooks/useSubmit'
import { useToast } from '../../../hooks/useToast'
import { clearNetwork } from '../../../services/networkService'
import ConfirmDialog from './ConfirmDialog'
import { TrashIcon } from './icons'

function ClearNetworkDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { status } = useApiHealth()
  const { network, refresh } = useNetwork()
  const { notify } = useToast()
  const { pending, run } = useSubmit(clearNetwork)

  async function confirm() {
    const result = await run()
    onClose()
    if (result) {
      notify(result.mensaje, 'success')
      await refresh()
    } else {
      notify('No se pudo vaciar la red.', 'error')
    }
  }

  return (
    <ConfirmDialog
      open={open && status === 'online'}
      title="¿Vaciar la red?"
      tone="danger"
      confirmLabel="Vaciar red"
      confirmIcon={<TrashIcon />}
      endpoint={{ method: 'DELETE', path: '/api/red' }}
      pending={pending}
      onConfirm={() => void confirm()}
      onCancel={onClose}
    >
      <p>
        Se eliminarán los {network?.resumen.puntos ?? 0} lugares y los {network?.resumen.conexiones ?? 0} trayectos
        registrados. Esta acción no se puede deshacer.
      </p>
    </ConfirmDialog>
  )
}

export default ClearNetworkDialog
