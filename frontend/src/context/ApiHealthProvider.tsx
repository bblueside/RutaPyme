// Consulta la salud de la API al iniciar y cuando se pulsa "Reintentar". No hay sondeo.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getHealth } from '../services/healthService'
import { ApiHealthContext, type ApiStatus } from './apiHealthContext'

export function ApiHealthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ApiStatus>('checking')

  const probe = useCallback(
    () => getHealth().then((): ApiStatus => 'online', (): ApiStatus => 'offline'),
    [],
  )

  const retry = useCallback(() => {
    setStatus('checking')
    void probe().then(setStatus)
  }, [probe])

  useEffect(() => {
    let active = true
    void probe().then((next) => {
      if (active) setStatus(next)
    })
    return () => {
      active = false
    }
  }, [probe])

  const value = useMemo(() => ({ status, retry }), [status, retry])
  return <ApiHealthContext value={value}>{children}</ApiHealthContext>
}
