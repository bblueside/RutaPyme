import { useContext } from 'react'
import { ApiHealthContext } from '../context/apiHealthContext'

export function useApiHealth() {
  const context = useContext(ApiHealthContext)
  if (!context) throw new Error('useApiHealth debe usarse dentro de ApiHealthProvider.')
  return context
}
