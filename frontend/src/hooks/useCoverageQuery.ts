// Origen y destino viven en la URL (?from=&to=): la consulta se puede copiar y abrir en otra pestaña.
// Se repite sola cuando cambian from, to o la versión de la red.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { checkReachability, getCoverage } from '../services/coverageService'
import { toApiError, type ApiError } from '../services/httpClient'
import type { Coverage, Reachability } from '../types/coverage'
import { useNetwork } from './useNetwork'
import { useToast } from './useToast'

type Outcome = { key: string; result: Coverage | Reachability | null; error: ApiError | null }

const MISSING_CODES = ['punto_inexistente', 'red_vacia']

export function useCoverageQuery() {
  const [params, setParams] = useSearchParams()
  const { version } = useNetwork()
  const { notify } = useToast()
  const from = params.get('from')?.trim() ?? ''
  const to = params.get('to')?.trim() ?? ''
  const key = `${from}|${to}`

  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const lastRun = useRef<{ key: string; version: number } | null>(null)

  useEffect(() => {
    if (!from) {
      lastRun.current = null
      return
    }
    let cancelled = false
    // Mismo from/to con otra versión de la red = recálculo, no una consulta nueva.
    const isRecalculation = lastRun.current?.key === key && lastRun.current.version !== version
    lastRun.current = { key, version }

    const query = to ? checkReachability(from, to) : getCoverage(from)
    query
      .then((result) => {
        if (!cancelled) setOutcome({ key, result, error: null })
      })
      .catch((caught) => {
        if (cancelled) return
        const error = toApiError(caught)
        if (isRecalculation && error.status === 404 && MISSING_CODES.includes(error.code)) {
          setParams({}, { replace: true })
          notify(`La consulta se limpió: ${error.message}`, 'warning')
          return
        }
        setOutcome({ key, result: null, error })
      })
    return () => {
      cancelled = true
    }
  }, [from, to, key, version, setParams, notify])

  const search = useCallback(
    (origin: string, destination: string) => {
      const next: Record<string, string> = { from: origin.trim() }
      if (destination.trim()) next.to = destination.trim()
      setParams(next)
    },
    [setParams],
  )

  const clear = useCallback(() => setParams({}), [setParams])

  const current = from && outcome?.key === key ? outcome : null
  return {
    from,
    to,
    result: current?.result ?? null,
    error: current?.error ?? null,
    loading: Boolean(from) && current === null,
    search,
    clear,
  }
}
