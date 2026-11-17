// Diálogo de confirmación sobre Modal (misma cabecera que los demás): el foco empieza en "Cancelar".
import type { ReactNode } from 'react'
import EndpointLabel from './EndpointLabel'
import { WarningIcon } from './icons'
import Modal from './Modal'
import styles from './ConfirmDialog.module.css'

interface ConfirmDialogProps {
  open: boolean
  title: string
  children: ReactNode
  endpoint?: { method: string; path: string }
  confirmLabel: string
  confirmIcon?: ReactNode
  /** "danger" para acciones destructivas; "primary" para las que no pierden datos. */
  tone: 'danger' | 'primary'
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({
  open,
  title,
  children,
  endpoint,
  confirmLabel,
  confirmIcon,
  tone,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      size="sm"
      icon={<WarningIcon />}
      iconTone={tone === 'danger' ? 'warning' : 'accent'}
      onClose={() => {
        if (!pending) onCancel()
      }}
    >
      <div className={styles.text}>{children}</div>
      {endpoint && (
        <div className={styles.endpoint}>
          <EndpointLabel method={endpoint.method} path={endpoint.path} />
        </div>
      )}
      <div className="pn-actions pn-actions--end">
        <button type="button" className="pn-btn pn-btn--secondary" autoFocus data-autofocus onClick={onCancel} disabled={pending}>
          Cancelar
        </button>
        <button
          type="button"
          className={`pn-btn ${tone === 'danger' ? 'pn-btn--danger' : 'pn-btn--primary'}`}
          onClick={onConfirm}
          disabled={pending}
        >
          {pending ? 'Procesando…' : (<>{confirmIcon}{confirmLabel}</>)}
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
