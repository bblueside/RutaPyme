// Consulta de la ruta más rápida (GET /api/ruta/{origen}/{destino}). El resultado se guarda con su clave
// (origen, destino y versión de la red): al cambiar cualquiera de los tres deja de mostrarse (RI-06).
import { useCallback, useState } from 'react'
import { getRoute } from '../services/routeService'
import { toApiError, type ApiError } from '../services/httpClient'
import type { CheapestRoute } from '../types/route'

interface Outcome {
  key: string
  route: CheapestRoute | null
  error: ApiError | null
}

export function useRouteQuery(origin: string, destination: string, version: number) {
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [pending, setPending] = useState(false)
  const key = `${origin}|${destination}|${version}`

  const find = useCallback(async () => {
    setPending(true)
    try {
      const route = await getRoute(origin, destination)
      setOutcome({ key, route, error: null })
      return route
    } catch (caught) {
      setOutcome({ key, route: null, error: toApiError(caught) })
      return undefined
    } finally {
      setPending(false)
    }
  }, [origin, destination, key])

  const current = outcome?.key === key ? outcome : null
  return { route: current?.route ?? null, error: current?.error ?? null, pending, find }
}
