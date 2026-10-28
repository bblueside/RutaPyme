// Acciones globales del encabezado: estado de la API, cargar el ejemplo y vaciar la red (ambas con confirmación).
import { useState } from 'react'
import { useApiHealth } from '../../../hooks/useApiHealth'
import { useNetwork } from '../../../hooks/useNetwork'
import { useSubmit } from '../../../hooks/useSubmit'
import { useToast } from '../../../hooks/useToast'
import { clearNetwork } from '../../../services/networkService'
import ConfirmDialog from '../shared/ConfirmDialog'
import { DownloadIcon, TrashIcon } from '../shared/icons'
import LoadSampleButton from '../shared/LoadSampleButton'
import HealthIndicator from './HealthIndicator'
import styles from './PanelHeaderActions.module.css'

function PanelHeaderActions() {
  const { status } = useApiHealth()
  const { network, refresh } = useNetwork()
  const { notify } = useToast()
  const [open, setOpen] = useState(false)
  const { pending, run } = useSubmit(clearNetwork)

  async function confirmClear() {
    const result = await run()
    setOpen(false)
    if (result) {
      notify(result.mensaje, 'success')
      await refresh()
    } else {
      notify('No se pudo vaciar la red.', 'error')
    }
  }

  const points = network?.resumen.puntos ?? 0
  const connections = network?.resumen.conexiones ?? 0

  return (
    <>
      <HealthIndicator />
      <LoadSampleButton>
        <DownloadIcon className={styles.symbol} />
        <span className={styles.label}>Cargar red de ejemplo</span>
      </LoadSampleButton>
      <button
        type="button"
        className="pn-btn pn-btn--danger-soft"
        disabled={status !== 'online'}
        aria-label="Vaciar red"
        onClick={() => setOpen(true)}
      >
        <TrashIcon className={styles.symbol} />
        <span className={styles.label}>Vaciar red</span>
      </button>
      <ConfirmDialog
        open={open}
        title="¿Vaciar la red?"
        tone="danger"
        confirmLabel="Vaciar red"
        confirmIcon={<TrashIcon />}
        endpoint={{ method: 'DELETE', path: '/api/red' }}
        pending={pending}
        onConfirm={() => void confirmClear()}
        onCancel={() => setOpen(false)}
      >
        <p>
          Se eliminarán los {points} puntos y las {connections} conexiones registradas. Esta acción no se puede
          deshacer.
        </p>
      </ConfirmDialog>
    </>
  )
}

export default PanelHeaderActions
