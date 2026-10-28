// Imagen PNG que dibuja NetworkX en la API. Si falla, pide la misma URL para mostrar el mensaje real de la API.
import { useState } from 'react'
import { useNetwork } from '../../../hooks/useNetwork'
import { ApiError, request, toApiError } from '../../../services/httpClient'
import { WarningIcon } from './icons'
import LoadSampleButton from './LoadSampleButton'
import styles from './GraphImage.module.css'

interface GraphImageProps {
  src: string
  alt: string
  /** Red sin puntos: no hay nada que dibujar, se ofrece cargar el ejemplo. */
  empty?: boolean
}

type Outcome = { src: string; error: ApiError | null }

function errorTitle(error: ApiError) {
  if (error.code === 'visualizacion_no_disponible') return 'No se pudo generar la imagen de la red'
  if (error.code === 'sin_conexion') return 'No hay conexión con la API'
  return 'No se pudo cargar la imagen'
}

function GraphImage({ src, alt, empty = false }: GraphImageProps) {
  const { refresh } = useNetwork()
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const status = outcome?.src !== src ? 'loading' : outcome.error ? 'error' : 'loaded'

  function handleError() {
    request('GET', src)
      .then(() => setOutcome({ src, error: new ApiError(0, 'imagen_invalida', 'La API no devolvió una imagen válida.') }))
      .catch((caught) => setOutcome({ src, error: toApiError(caught) }))
  }

  if (empty) {
    return (
      <div className={styles.frame}>
        <div className={styles.state}>
          <h3 className={styles.title}>La red está vacía</h3>
          <p className={styles.message}>Registre puntos y conexiones, o cargue la red de ejemplo para ver el diagrama.</p>
          <LoadSampleButton variant="primary" />
        </div>
      </div>
    )
  }

  if (status === 'error' && outcome?.error) {
    const { error } = outcome
    return (
      <div className={styles.frame}>
        <div className={styles.state} role="alert">
          <span className={styles.iconCircle}>
            <WarningIcon width={22} height={22} />
          </span>
          <h3 className={styles.title}>{errorTitle(error)}</h3>
          <p className={styles.message}>
            {error.message}
            {error.status > 0 && ` (HTTP ${error.status})`}
          </p>
          <code className={styles.code}>{error.code}</code>
          <button type="button" className="pn-btn pn-btn--secondary" onClick={() => void refresh()}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.frame}>
      {status === 'loading' && <div className={`pn-skeleton ${styles.skeleton}`} aria-hidden="true" />}
      <img
        key={src}
        className={`${styles.image} ${status === 'loaded' ? styles.visible : ''}`}
        src={src}
        alt={alt}
        onLoad={() => setOutcome({ src, error: null })}
        onError={handleError}
      />
    </div>
  )
}

export default GraphImage
