import { createContext } from 'react'

export type ApiStatus = 'checking' | 'online' | 'offline'

export interface ApiHealthState {
  status: ApiStatus
  retry: () => void
}

export const ApiHealthContext = createContext<ApiHealthState | null>(null)
