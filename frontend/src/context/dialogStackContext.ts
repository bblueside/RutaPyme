// Contrato de la pila de vistas de un diálogo: cada vista tiene su cabecera y su contenido.
import { createContext, type ReactNode } from 'react'

export interface StackView {
  /** Identifica la vista (cambia el foco al título cuando cambia). */
  id: string
  title: string
  subtitle?: string
  icon?: ReactNode
  size: 'sm' | 'md' | 'lg'
  render: () => ReactNode
}

export interface DialogStackApi {
  /** Abre una vista encima de la actual; «Volver» regresa a la anterior. */
  push: (view: StackView) => void
  /** Quita la vista de arriba y devuelve el foco al botón que la abrió. */
  pop: () => void
  /** Cambia la vista de arriba por otra (sin dejar la anterior en la pila). */
  replace: (view: StackView) => void
  /** Cierra todo el diálogo. */
  close: () => void
  /** Cuántas vistas hay debajo de la actual: 0 = la raíz, sin «Volver». */
  depth: number
  /** Termina una vista: vuelve a la anterior o, si es la raíz, cierra el diálogo (D-15). */
  back: () => void
}

export const DialogStackContext = createContext<DialogStackApi | null>(null)
