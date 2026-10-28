// Diálogo de confirmación accesible con <dialog>: se cierra con Esc y el foco empieza en "Cancelar".
import { useEffect, useId, useRef, type ReactNode } from 'react'
import EndpointLabel from './EndpointLabel'
import { WarningIcon } from './icons'
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
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        if (!pending) onCancel()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !pending) onCancel()
      }}
    >
      <div className={styles.body}>
        <span className={styles.icon}>
          <WarningIcon width={22} height={22} />
        </span>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <div className={styles.text}>{children}</div>
        {endpoint && (
          <div className={styles.endpoint}>
            <EndpointLabel method={endpoint.method} path={endpoint.path} />
          </div>
        )}
      </div>
      <div className={styles.footer}>
        <button type="button" className="pn-btn pn-btn--secondary" autoFocus onClick={onCancel} disabled={pending}>
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
    </dialog>
  )
}

export default ConfirmDialog
