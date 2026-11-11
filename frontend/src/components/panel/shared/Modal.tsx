// Diálogo modal accesible sobre <dialog>: foco atrapado por el navegador, Esc y clic fuera cierran.
// El contenido solo se monta mientras está abierto, así los formularios empiezan limpios cada vez.
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { CloseIcon } from './icons'
import styles from './Modal.module.css'

interface ModalProps {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

function Modal({ open, title, subtitle, onClose, size = 'md', children }: ModalProps) {
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
      className={`${styles.dialog} ${styles[size]}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
    >
      {open && (
        <>
          <header className={styles.head}>
            <div>
              <h2 id={titleId} className={styles.title}>{title}</h2>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            <button type="button" className={styles.close} aria-label="Cerrar" onClick={onClose}>
              <CloseIcon width={16} height={16} />
            </button>
          </header>
          <div className={styles.body}>{children}</div>
        </>
      )}
    </dialog>
  )
}

export default Modal
