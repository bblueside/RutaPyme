// Mensaje de error en línea, sin caja: el texto es el mensaje de la API tal cual.
import styles from './InlineError.module.css'

function InlineError({ message, id }: { message: string | null | undefined; id?: string }) {
  if (!message) return null
  return (
    <p className={styles.error} role="alert" id={id}>
      <span aria-hidden="true">✕</span> {message}
    </p>
  )
}

export default InlineError
