// Encabezado fijo (sticky) variante clara: marca, navegación y acceso al optimizador.
// En la landing navega por secciones del recorrido (botones); en el panel navega por rutas (NavLink)
// y deja un hueco `actions` para el estado de la API y las acciones globales.
import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import logoAzul from '../../assets/logo_blue.png'
import './HeaderLight.css'

export interface HeaderSection {
  id: string
  label: string
  /** Si existe, el ítem es un enlace de ruta y toma su estado activo del router. */
  to?: string
}

interface HeaderProps {
  logoSrc?: string
  sections: HeaderSection[]
  activeIndex?: number
  onSelectSection?: (index: number) => void
  ctaLabel?: string
  ctaHref?: string
  actions?: ReactNode
  homeHref: string
}

function HeaderLight({
  logoSrc = logoAzul,
  sections,
  activeIndex = -1,
  onSelectSection,
  ctaLabel,
  ctaHref,
  actions,
  homeHref,
}: HeaderProps) {
  const routed = sections.some((section) => section.to)

  const items = sections.map((section, index) =>
    section.to ? (
      <NavLink
        key={section.id}
        to={section.to}
        end
        className={({ isActive }) => `site-header-light__item${isActive ? ' is-active' : ''}`}
      >
        {section.label}
      </NavLink>
    ) : (
      <button
        key={section.id}
        type="button"
        className={`site-header-light__item${index === activeIndex ? ' is-active' : ''}`}
        aria-current={index === activeIndex ? 'true' : undefined}
        onClick={() => onSelectSection?.(index)}
      >
        {section.label}
      </button>
    ),
  )

  return (
    <div className={`site-header-light${routed ? ' site-header-light--panel' : ''}`}>
      <header className="site-header-light__bar">
        <a className="site-header-light__brand" href={homeHref}>
          <img className="site-header-light__logo" src={logoSrc} alt="RutaPyme" />
        </a>

        <nav className="site-header-light__nav" aria-label="Secciones del recorrido">
          {items}
        </nav>

        {ctaLabel && ctaHref && (
          <Link className="site-header-light__cta" to={ctaHref}>
            {ctaLabel}
          </Link>
        )}

        {actions && <div className="site-header-light__actions">{actions}</div>}

        {routed && (
          <nav className="site-header-light__subnav" aria-label="Vistas del panel">
            {items}
          </nav>
        )}
      </header>
    </div>
  )
}

export default HeaderLight
