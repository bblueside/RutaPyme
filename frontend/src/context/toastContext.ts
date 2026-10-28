import { createContext } from 'react'

export type ToastKind = 'success' | 'error' | 'warning'

export interface Toast {
  id: number
  message: string
  kind: ToastKind
  leaving: boolean
}

export interface ToastState {
  toasts: Toast[]
  notify: (message: string, kind?: ToastKind) => void
  dismiss: (id: number) => void
}

export const ToastContext = createContext<ToastState | null>(null)
