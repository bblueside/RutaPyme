import { useContext } from 'react'
import { NetworkContext } from '../context/networkContext'

export function useNetwork() {
  const context = useContext(NetworkContext)
  if (!context) throw new Error('useNetwork debe usarse dentro de NetworkProvider.')
  return context
}
