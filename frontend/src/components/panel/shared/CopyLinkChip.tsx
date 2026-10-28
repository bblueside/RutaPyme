// Chip con la URL de la consulta: al pulsarlo copia el enlace completo y avisa con un toast.
import { useToast } from '../../../hooks/useToast'
import { LinkIcon } from './icons'
import styles from './CopyLinkChip.module.css'

function CopyLinkChip({ path }: { path: string }) {
  const { notify } = useToast()

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`)
      notify('Enlace copiado', 'success')
    } catch {
      notify('No se pudo copiar el enlace.', 'error')
    }
  }

  return (
    <button type="button" className={styles.chip} onClick={() => void copy()} title="Copiar enlace de la consulta">
      <LinkIcon width={14} height={14} />
      <span>{path}</span>
    </button>
  )
}

export default CopyLinkChip
