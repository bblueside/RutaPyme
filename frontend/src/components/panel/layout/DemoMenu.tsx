// "Modo de demostración": avatar, estado de la API y un menú con las acciones sobre toda la red
// (cargar el ejemplo y vaciar la red, ambas con confirmación).
import { useEffect, useId, useRef, useState } from 'react'
import { useApiHealth } from '../../../hooks/useApiHealth'
import ClearNetworkDialog from '../shared/ClearNetworkDialog'
import { ChevronDownIcon, DownloadIcon, TrashIcon } from '../shared/icons'
import LoadSampleDialog from '../shared/LoadSampleDialog'
import styles from './DemoMenu.module.css'

const STATUS_TEXT = { checking: 'Conectando…', online: 'Datos de ejemplo', offline: 'API sin conexión' } as const

function DemoMenu() {
  const { status } = useApiHealth()
  const [open, setOpen] = useState(false)
  const [dialog, setDialog] = useState<'sample' | 'clear' | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onMouseDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function choose(next: 'sample' | 'clear') {
    setOpen(false)
    setDialog(next)
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.avatar} aria-hidden="true">RP</span>
        <span className={styles.text}>
          <span className={styles.title}>Modo de demostración</span>
          <span className={`${styles.subtitle} ${status === 'offline' ? styles.offline : ''}`} role="status">
            <span className={styles.dot} aria-hidden="true" />
            {STATUS_TEXT[status]}
          </span>
        </span>
        <ChevronDownIcon className={styles.chevron} width={16} height={16} />
      </button>

      {open && (
        <div className={styles.menu} id={menuId} role="menu">
          <button type="button" role="menuitem" className={styles.item} disabled={status !== 'online'} onClick={() => choose('sample')}>
            <DownloadIcon /> Cargar datos de ejemplo
          </button>
          <button type="button" role="menuitem" className={`${styles.item} ${styles.danger}`} disabled={status !== 'online'} onClick={() => choose('clear')}>
            <TrashIcon /> Vaciar red
          </button>
        </div>
      )}

      <LoadSampleDialog open={dialog === 'sample'} onClose={() => setDialog(null)} />
      <ClearNetworkDialog open={dialog === 'clear'} onClose={() => setDialog(null)} />
    </div>
  )
}

export default DemoMenu
