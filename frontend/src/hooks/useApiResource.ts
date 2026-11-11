// Lee un recurso de la API cada vez que cambia `key` (null = no consultar). El resultado se guarda junto
// a su clave: si la clave cambia, `data` deja de mostrar el dato anterior al instante. `latest` conserva el
// último dato recibido (de cualquier clave) para dibujar sin parpadeos mientras llega el nuevo.
import { useEffect, useRef, useState } from 'react'
import { toApiError, type ApiError } from '../services/httpClient'

interface Outcome<T> {
  key: string
  data: T | null
  error: ApiError | null
}

export function useApiResource<T>(key: string | null, fetcher: () => Promise<T>) {
  const [outcome, setOutcome] = useState<Outcome<T> | null>(null)
  const [latest, setLatest] = useState<T | null>(null)
  const latestFetcher = useRef(fetcher)

  useEffect(() => {
    latestFetcher.current = fetcher
  })

  useEffect(() => {
    if (key === null) return
    let cancelled = false
    latestFetcher.current().then(
      (data) => {
        if (cancelled) return
        setOutcome({ key, data, error: null })
        setLatest(data)
      },
      (caught) => {
        if (!cancelled) setOutcome({ key, data: null, error: toApiError(caught) })
      },
    )
    return () => {
      cancelled = true
    }
  }, [key])

  const current = key !== null && outcome?.key === key ? outcome : null
  return {
    data: current?.data ?? null,
    latest,
    error: current?.error ?? null,
    loading: key !== null && current === null,
  }
}
