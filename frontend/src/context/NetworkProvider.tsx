// Carga puntos, conexiones y red en paralelo cuando la API está en línea y los recarga en cada refresh().
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useApiHealth } from '../hooks/useApiHealth'
import { toApiError, type ApiError } from '../services/httpClient'
import { listConnections } from '../services/connectionService'
import { getNetwork } from '../services/networkService'
import { listPoints } from '../services/pointService'
import type { Connection, Network, Point } from '../types/network'
import { NetworkContext } from './networkContext'

interface Snapshot {
  points: Point[]
  connections: Connection[]
  network: Network
}

const NO_POINTS: Point[] = []
const NO_CONNECTIONS: Connection[] = []

export function NetworkProvider({ children }: { children: ReactNode }) {
  const { status } = useApiHealth()
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [version, setVersion] = useState(0)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)

  const load = useCallback(
    () =>
      Promise.all([listPoints(), listConnections(), getNetwork()]).then(
        ([points, connections, network]) => {
          setSnapshot({ points: points.puntos, connections: connections.conexiones, network })
          setUpdatedAt(Date.now())
          setError(null)
        },
        (caught) => setError(toApiError(caught)),
      ),
    [],
  )

  const refresh = useCallback(async () => {
    setVersion((current) => current + 1)
    await load()
  }, [load])

  useEffect(() => {
    if (status === 'online') void load()
  }, [status, load])

  const value = useMemo(
    () => ({
      points: snapshot?.points ?? NO_POINTS,
      connections: snapshot?.connections ?? NO_CONNECTIONS,
      network: snapshot?.network ?? null,
      loading: snapshot === null && error === null,
      error,
      version,
      updatedAt,
      refresh,
    }),
    [snapshot, error, version, updatedAt, refresh],
  )
  return <NetworkContext value={value}>{children}</NetworkContext>
}
