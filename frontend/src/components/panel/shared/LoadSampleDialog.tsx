// Confirmación para cargar la red de ejemplo (POST /api/red/ejemplo). Reemplaza la red actual.
import { useApiHealth } from '../../../hooks/useApiHealth'
import { useNetwork } from '../../../hooks/useNetwork'
import { useSubmit } from '../../../hooks/useSubmit'
import { useToast } from '../../../hooks/useToast'
import { loadSampleNetwork } from '../../../services/networkService'
import ConfirmDialog from './ConfirmDialog'
import { DownloadIcon } from './icons'

function LoadSampleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { status } = useApiHealth()
  const { network, refresh } = useNetwork()
  const { notify } = useToast()
  const { pending, run } = useSubmit(loadSampleNetwork)

  async function confirm() {
    const result = await run()
    onClose()
    if (result) {
      notify(result.mensaje, 'success')
      await refresh()
    } else {
      notify('No se pudo cargar la red de ejemplo.', 'error')
    }
  }

  const hasData = (network?.resumen.puntos ?? 0) > 0
  return (
    <ConfirmDialog
      open={open && status === 'online'}
      title="¿Cargar los datos de ejemplo?"
      tone="primary"
      confirmLabel="Cargar ejemplo"
      confirmIcon={<DownloadIcon />}
      endpoint={{ method: 'POST', path: '/api/red/ejemplo' }}
      pending={pending}
      onConfirm={() => void confirm()}
      onCancel={onClose}
    >
      <p>
        {hasData
          ? 'Se reemplazará la red actual por la red sintética de ejemplo (7 lugares y 10 trayectos).'
          : 'Se cargará la red sintética de ejemplo (7 lugares y 10 trayectos).'}
      </p>
    </ConfirmDialog>
  )
}

export default LoadSampleDialog
