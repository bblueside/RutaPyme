// Etiqueta informativa con el método y la ruta del endpoint que alimenta una tarjeta.
import styles from './EndpointLabel.module.css'

function EndpointLabel({ method, path }: { method: string; path: string }) {
  return (
    <span className={styles.label}>
      {method} {path}
    </span>
  )
}

export default EndpointLabel
