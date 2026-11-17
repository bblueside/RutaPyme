import { useContext } from 'react'
import { DialogStackContext } from '../context/dialogStackContext'

export function useDialogStack() {
  const context = useContext(DialogStackContext)
  if (!context) throw new Error('useDialogStack debe usarse dentro de StackDialog.')
  return context
}
