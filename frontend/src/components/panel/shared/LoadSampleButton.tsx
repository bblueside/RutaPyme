// Botón "Cargar red de ejemplo" con su diálogo de confirmación (se usa en el encabezado y en los estados vacíos).
import { useState, type ReactNode } from 'react'
import { useApiHealth } from '../../../hooks/useApiHealth'
import { useNetwork } from '../../../hooks/useNetwork'
import { useSubmit } from '../../../hooks/useSubmit'
import { useToast } from '../../../hooks/useToast'
import { loadSampleNetwork } from '../../../services/networkService'
import ConfirmDialog from './ConfirmDialog'
import { DownloadIcon } from './icons'

interface LoadSampleButtonProps {
  variant?: 'primary' | 'secondary'
  children?: ReactNode
}

function LoadSampleButton({ variant = 'secondary', children = 'Cargar red de ejemplo' }: LoadSampleButtonProps) {
  const { status } = useApiHealth()
  const { network, refresh } = useNetwork()
  const { notify } = useToast()
  const [open, setOpen] = useState(false)
  const { pending, run } = useSubmit(loadSampleNetwork)

  async function confirm() {
    const result = await run()
    setOpen(false)
    if (result) {
      notify(result.mensaje, 'success')
      await refresh()
    } else {
      notify('No se pudo cargar la red de ejemplo.', 'error')
    }
  }

  const hasData = (network?.resumen.puntos ?? 0) > 0

  return (
    <>
      <button
        type="button"
        className={`pn-btn pn-btn--${variant}`}
        disabled={status !== 'online'}
        aria-label="Cargar red de ejemplo"
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      <ConfirmDialog
        open={open}
        title="¿Cargar la red de ejemplo?"
        tone="primary"
        confirmLabel="Cargar ejemplo"
        confirmIcon={<DownloadIcon />}
        endpoint={{ method: 'POST', path: '/api/red/ejemplo' }}
        pending={pending}
        onConfirm={() => void confirm()}
        onCancel={() => setOpen(false)}
      >
        <p>
          {hasData
            ? 'Se reemplazará la red actual por la red sintética de ejemplo (7 puntos y 10 conexiones).'
            : 'Se cargará la red sintética de ejemplo (7 puntos y 10 conexiones).'}
        </p>
      </ConfirmDialog>
    </>
  )
}

export default LoadSampleButton
