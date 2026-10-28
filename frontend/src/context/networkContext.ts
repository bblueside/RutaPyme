import { createContext } from 'react'
import type { ApiError } from '../services/httpClient'
import type { Connection, Network, Point } from '../types/network'

export interface NetworkState {
  points: Point[]
  connections: Connection[]
  network: Network | null
  loading: boolean
  error: ApiError | null
  /** Sube en cada refresh(): las imágenes y la cobertura se recalculan con él. */
  version: number
  /** Momento (ms) del último refresh() correcto, para "Actualizado hace X". */
  updatedAt: number | null
  refresh: () => Promise<void>
}

export const NetworkContext = createContext<NetworkState | null>(null)
