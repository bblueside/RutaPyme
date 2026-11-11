// Botón "Cargar datos de ejemplo" con su confirmación (se usa en los estados vacíos).
import { useState, type ReactNode } from 'react'
import { useApiHealth } from '../../../hooks/useApiHealth'
import LoadSampleDialog from './LoadSampleDialog'

interface LoadSampleButtonProps {
  variant?: 'primary' | 'secondary'
  children?: ReactNode
}

function LoadSampleButton({ variant = 'secondary', children = 'Cargar datos de ejemplo' }: LoadSampleButtonProps) {
  const { status } = useApiHealth()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className={`pn-btn pn-btn--${variant}`} disabled={status !== 'online'} onClick={() => setOpen(true)}>
        {children}
      </button>
      <LoadSampleDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default LoadSampleButton
