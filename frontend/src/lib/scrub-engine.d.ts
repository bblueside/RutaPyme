// Tipos del motor scroll-world (scrub-engine.js). Solo describe la configuración que usa la landing.

export type PosterSource = string | { base: string; anchos: number[] }

export type ClipSource =
  | string
  | { av1?: string; h264?: string; movilAv1?: string; movilH264?: string }

export interface ScrollWorldLink {
  label: string
  href: string
}

export interface ScrollWorldSection {
  id: string
  label: string
  still: PosterSource
  stillMobile?: PosterSource
  clip: ClipSource
  clipMobile?: string
  accent?: string
  scroll?: number
  linger?: number
  eyebrow?: string
  title?: string
  body?: string
  tags?: string[]
  cta?: { primary?: ScrollWorldLink; secondary?: ScrollWorldLink }
}

export interface ScrollWorldConfig {
  brand?: { name: string; href?: string; logo?: string }
  cta?: ScrollWorldLink
  hint?: string
  nav?: boolean
  /** false: el motor no pinta la barra superior (la pinta la aplicación). */
  topbar?: boolean
  /** Se llama con el índice de la sección más cercana cada vez que cambia. */
  onSectionChange?: (index: number) => void
  atmosphere?: boolean
  diveScroll?: number
  connScroll?: number
  crossfade?: number
  sections: ScrollWorldSection[]
  connectors?: (ClipSource | null)[]
  connectorsMobile?: (string | null)[]
}

export interface ScrollWorldInstance {
  destroy(): void
  /** Desplaza la página al centro de la sección `index`. */
  jumpTo(index: number): void
}

export function mountScrollWorld(
  container: HTMLElement,
  config: ScrollWorldConfig,
): ScrollWorldInstance
