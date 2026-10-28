// Recorrido de scroll con video: monta el motor scroll-world y lo desmonta al salir de la ruta.
import { useEffect, useRef, type MouseEvent, type MutableRefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { mountScrollWorld } from '../../lib/scrub-engine.js'
import type { ScrollWorldInstance } from '../../lib/scrub-engine.js'
import { WORLD_CONFIG } from './scrollWorldConfig'

interface ScrollWorldProps {
  /** Recibe el motor montado (para que el Header pueda llamar a jumpTo). */
  worldRef: MutableRefObject<ScrollWorldInstance | null>
  /** Se llama con el índice de la sección más cercana cada vez que cambia. */
  onSectionChange: (index: number) => void
}

function ScrollWorld({ worldRef, onSectionChange }: ScrollWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  // El motor se monta una sola vez: el callback vigente se lee desde una ref.
  const onSectionChangeRef = useRef(onSectionChange)
  useEffect(() => {
    onSectionChangeRef.current = onSectionChange
  }, [onSectionChange])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const world = mountScrollWorld(container, {
      ...WORLD_CONFIG,
      onSectionChange: (index) => onSectionChangeRef.current(index),
    })
    worldRef.current = world
    return () => {
      world.destroy()
      worldRef.current = null
    }
  }, [worldRef])

  // El motor pinta enlaces <a> normales: las rutas internas se pasan al router para no recargar la página.
  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const link = (event.target as HTMLElement).closest('a')
    const href = link?.getAttribute('href')
    const opensNewTab = event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
    if (!href || !href.startsWith('/') || opensNewTab) return
    event.preventDefault()
    navigate(href)
  }

  return <div ref={containerRef} onClick={handleClick} />
}

export default ScrollWorld
