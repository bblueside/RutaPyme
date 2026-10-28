// Pinta los avisos apilados abajo a la derecha; la región es aria-live para lectores de pantalla.
import { useToast } from '../../../hooks/useToast'
import type { ToastKind } from '../../../context/toastContext'
import { CheckCircleIcon, CloseIcon, CrossCircleIcon, WarningIcon } from './icons'
import styles from './ToastViewport.module.css'

const ICONS: Record<ToastKind, typeof CheckCircleIcon> = {
  success: CheckCircleIcon,
  error: CrossCircleIcon,
  warning: WarningIcon,
}

function ToastViewport() {
  const { toasts, dismiss } = useToast()

  return (
    <div className={styles.viewport} aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.kind]
        return (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.kind]} ${toast.leaving ? styles.leaving : ''}`}
            role={toast.kind === 'error' ? 'alert' : 'status'}
          >
            <span className={styles.icon}>
              <Icon width={18} height={18} />
            </span>
            <p className={styles.text}>{toast.message}</p>
            <button type="button" className={styles.close} aria-label="Cerrar aviso" onClick={() => dismiss(toast.id)}>
              <CloseIcon width={14} height={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default ToastViewport
