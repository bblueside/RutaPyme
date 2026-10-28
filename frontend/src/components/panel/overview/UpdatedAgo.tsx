// "Actualizado hace X": tiempo transcurrido desde la última carga correcta de la red (calculado en el cliente).
import { useEffect, useState } from 'react'
import { useNetwork } from '../../../hooks/useNetwork'

function formatElapsed(ms: number) {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 10) return 'ahora mismo'
  if (seconds < 60) return `hace ${seconds} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  return `hace ${Math.floor(minutes / 60)} h`
}

function UpdatedAgo() {
  const { updatedAt } = useNetwork()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000)
    return () => window.clearInterval(timer)
  }, [])

  if (updatedAt === null) return null
  const elapsed = formatElapsed(Math.max(0, now - updatedAt))
  return <span>{elapsed === 'ahora mismo' ? 'Actualizado ahora mismo' : `Actualizado ${elapsed}`}</span>
}

export default UpdatedAgo
