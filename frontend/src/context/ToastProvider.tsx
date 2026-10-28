// Cola de avisos: cada uno se cierra solo a los 4 s (con 200 ms de salida) o con el botón ×.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type Toast, type ToastKind } from './toastContext'

const VISIBLE_MS = 4000
const LEAVING_MS = 200

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Set<number>())

  const schedule = useCallback((action: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer)
      action()
    }, delay)
    timers.current.add(timer)
  }, [])

  const dismiss = useCallback(
    (id: number) => {
      setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)))
      schedule(() => setToasts((current) => current.filter((toast) => toast.id !== id)), LEAVING_MS)
    },
    [schedule],
  )

  const notify = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, message, kind, leaving: false }])
      schedule(() => dismiss(id), VISIBLE_MS)
    },
    [schedule, dismiss],
  )

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const value = useMemo(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss])
  return <ToastContext value={value}>{children}</ToastContext>
}
