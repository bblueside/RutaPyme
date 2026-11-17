// Un solo <dialog> con una pila de vistas (D-03): cada vista aporta su cabecera y su contenido, «Volver» regresa a
// la anterior y Esc cierra todo. Las vistas de abajo siguen montadas (ocultas) para conservar su estado, por
// ejemplo la pestaña elegida, y el foco vuelve al botón que abrió la vista cuando esta se cierra.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DialogStackContext, type DialogStackApi, type StackView } from '../../../context/dialogStackContext'
import Modal from './Modal'
import styles from './StackDialog.module.css'

interface Entry {
  view: StackView
  /** Elemento que tenía el foco al abrir la vista: a él se vuelve con «Volver». */
  trigger: HTMLElement | null
}

interface StackDialogProps {
  open: boolean
  /** Vista de abajo de la pila; se vuelve a dibujar con cada render del padre para mostrar datos al día. */
  root: StackView
  onClose: () => void
}

function activeElement(): HTMLElement | null {
  return document.activeElement instanceof HTMLElement ? document.activeElement : null
}

function StackDialog({ open, root, onClose }: StackDialogProps) {
  const [overlay, setOverlay] = useState<Entry[]>([])
  const [wasOpen, setWasOpen] = useState(open)
  const focusAfterPop = useRef<HTMLElement | null>(null)

  // Al cerrarse el diálogo la pila vuelve a la raíz (ajuste durante el render, sin efecto).
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) setOverlay([])
  }

  const push = useCallback((view: StackView) => {
    const trigger = activeElement()
    setOverlay((current) => [...current, { view, trigger }])
  }, [])

  const pop = useCallback(() => {
    const top = overlay.at(-1)
    if (!top) return
    focusAfterPop.current = top.trigger
    setOverlay(overlay.slice(0, -1))
  }, [overlay])

  const replace = useCallback((view: StackView) => {
    setOverlay((current) => {
      if (current.length === 0) return [{ view, trigger: activeElement() }]
      return [...current.slice(0, -1), { view, trigger: current[current.length - 1].trigger }]
    })
  }, [])

  const depth = overlay.length
  const back = useCallback(() => (depth > 0 ? pop() : onClose()), [depth, pop, onClose])

  // Después de un pop, el foco vuelve al disparador (si sigue en pantalla); si no, queda en el título.
  useEffect(() => {
    const target = focusAfterPop.current
    focusAfterPop.current = null
    if (target?.isConnected) target.focus()
  }, [overlay])

  const api = useMemo<DialogStackApi>(
    () => ({ push, pop, replace, close: onClose, depth, back }),
    [push, pop, replace, onClose, depth, back],
  )

  const views = [root, ...overlay.map((entry) => entry.view)]
  const top = views[views.length - 1]

  return (
    <DialogStackContext value={api}>
      <Modal
        open={open}
        title={top.title}
        subtitle={top.subtitle}
        icon={top.icon}
        size={top.size}
        viewKey={`${depth}:${top.id}`}
        onBack={depth > 0 ? pop : undefined}
        onClose={onClose}
      >
        {views.map((view, index) => (
          <div key={`${index}:${view.id}`} className={styles.view} hidden={index !== views.length - 1}>
            {view.render()}
          </div>
        ))}
      </Modal>
    </DialogStackContext>
  )
}

export default StackDialog
