// Encabezado fijo (sticky) variante clara de la landing (secciones S1 y S2): marca, navegación por secciones del recorrido y acceso al optimizador.
import { Link } from 'react-router-dom'
import logoAzul from '../../assets/logo_blue.png'
import './HeaderLight.css'

export interface HeaderSection {
  id: string
  label: string
}

interface HeaderProps {
  logoSrc?: string
  sections: HeaderSection[]
  activeIndex: number
  onSelectSection: (index: number) => void
  ctaLabel: string
  ctaHref: string
  homeHref: string
}

function HeaderLight({ logoSrc = logoAzul, sections, activeIndex, onSelectSection, ctaLabel, ctaHref, homeHref }: HeaderProps) {
  return (
    <div className="site-header-light">
      <header className="site-header-light__bar">
        <a className="site-header-light__brand" href={homeHref}>
          <img className="site-header-light__logo" src={logoSrc} alt="RutaPyme" />
        </a>

        <nav className="site-header-light__nav" aria-label="Secciones del recorrido">
          {sections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              className={`site-header-light__item${index === activeIndex ? ' is-active' : ''}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => onSelectSection(index)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <Link className="site-header-light__cta" to={ctaHref}>
          {ctaLabel}
        </Link>
      </header>
    </div>
  )
}

export default HeaderLight
