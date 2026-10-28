// Decide qué zona de la landing queda justo debajo del encabezado: el recorrido (oscuro) o las secciones
// informativas (claro), y cuál sección informativa está activa. Observa una franja de 1 px bajo la barra.
import { useEffect, useState, type RefObject } from 'react'

export interface ZonaLanding {
  modo: 'oscuro' | 'claro'
  indiceInfo: number | null
}

const ALTO_BARRA_POR_DEFECTO = 64

export function useZonaLanding(contenedorRef: RefObject<HTMLElement | null>, idsSecciones: string[]): ZonaLanding {
  const [zona, setZona] = useState<ZonaLanding>({ modo: 'oscuro', indiceInfo: null })
  const clave = idsSecciones.join('|')

  useEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor) return
    const ids = clave.split('|')
    let observador: IntersectionObserver | null = null

    function observar() {
      observador?.disconnect()
      const alto = Math.round(document.querySelector('.site-header__bar')?.getBoundingClientRect().height ?? ALTO_BARRA_POR_DEFECTO)
      document.documentElement.style.setProperty('--site-header-height', `${alto}px`)

      const dentro = new Set<Element>()
      const secciones = ids.map((id) => document.getElementById(id))
      const actualizar = () => {
        // En el borde entre dos secciones ambas tocan la franja: gana la de abajo, la que acaba de empezar.
        const indice = secciones.findLastIndex((seccion) => seccion && dentro.has(seccion))
        setZona({
          modo: dentro.has(contenedor!) ? 'claro' : 'oscuro',
          indiceInfo: indice === -1 ? null : indice,
        })
      }

      // Franja de 1 px que empieza justo debajo de la barra.
      const abajo = window.innerHeight - alto - 1
      observador = new IntersectionObserver(
        (entradas) => {
          for (const entrada of entradas) {
            if (entrada.isIntersecting) dentro.add(entrada.target)
            else dentro.delete(entrada.target)
          }
          actualizar()
        },
        { rootMargin: `-${alto}px 0px -${Math.max(abajo, 0)}px 0px` },
      )
      observador.observe(contenedor!)
      secciones.forEach((seccion) => seccion && observador!.observe(seccion))
    }

    observar()
    window.addEventListener('resize', observar)
    return () => {
      window.removeEventListener('resize', observar)
      observador?.disconnect()
    }
  }, [contenedorRef, clave])

  return zona
}
