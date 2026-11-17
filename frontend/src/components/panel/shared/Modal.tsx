// Diálogo modal accesible sobre <dialog>: foco atrapado por el navegador, Esc y clic fuera cierran.
// Cabecera común de todos los modales (boceto): «‹ Volver» opcional, cuadro con icono, título, subtítulo y X.
// El contenido solo se monta mientras está abierto, así los formularios empiezan limpios cada vez.
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { ChevronLeftIcon, CloseIcon } from './icons'
import styles from './Modal.module.css'

interface ModalProps {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  size?: 'sm' | 'md' | 'lg'
  /** Icono dentro del cuadro redondeado de la cabecera. */
  icon?: ReactNode
  /** Color del cuadro del icono. */
  iconTone?: 'accent' | 'warning'
  /** Si existe, se muestra «‹ Volver» sobre el icono. */
  onBack?: () => void
  /** Cambia cuando el modal muestra otra vista: el foco pasa al título si ningún campo lo tomó. */
  viewKey?: string
  children: ReactNode
}

function Modal({ open, title, subtitle, onClose, size = 'md', icon, iconTone = 'accent', onBack, viewKey, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const previousViewKey = useRef(viewKey)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Al cambiar de vista el foco va al título (D-23), salvo que un campo con autoFocus ya lo haya tomado.
  useEffect(() => {
    if (previousViewKey.current === viewKey) return
    previousViewKey.current = viewKey
    if (!open) return
    if (!bodyRef.current?.contains(document.activeElement)) titleRef.current?.focus()
  }, [viewKey, open])

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
          <button type="button" className={styles.close} aria-label="Cerrar" onClick={onClose}>
            <CloseIcon width={18} height={18} />
          </button>
          <div className={styles.scroll}>
            <header className={styles.head}>
              {onBack && (
                <button type="button" className={styles.back} onClick={onBack}>
                  <ChevronLeftIcon width={16} height={16} /> Volver
                </button>
              )}
              {icon && <span className={`${styles.icon} ${iconTone === 'warning' ? styles.iconWarning : ''}`}>{icon}</span>}
              <h2 id={titleId} ref={titleRef} className={styles.title} tabIndex={-1}>{title}</h2>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </header>
            <div ref={bodyRef} className={styles.body}>{children}</div>
          </div>
        </>
      )}
    </dialog>
  )
}

export default Modal
