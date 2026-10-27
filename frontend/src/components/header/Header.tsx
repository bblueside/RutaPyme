// Encabezado fijo (sticky) de la landing: marca, navegación por secciones del recorrido y acceso al optimizador.
import { Link } from 'react-router-dom'
import logoBlanco from '../../assets/logo_white.png'
import logoAzul from '../../assets/logo_blue.png'
import './Header.css'

export interface HeaderSection {
  id: string
  label: string
}

interface HeaderProps {
  variant: 'dark' | 'light'
  sections: HeaderSection[]
  activeIndex: number
  onSelectSection: (index: number) => void
  ctaLabel: string
  ctaHref: string
  homeHref: string
}

function Header({ variant, sections, activeIndex, onSelectSection, ctaLabel, ctaHref, homeHref }: HeaderProps) {
  return (
    <div className={`site-header site-header--${variant}`}>
      <header className="site-header__bar">
        <a className="site-header__brand" href={homeHref}>
          {/* Dos logos superpuestos: el fundido de opacidad acompaña a la transición de color. */}
          <img className="site-header__logo site-header__logo--white" src={logoBlanco} alt="RutaPyme" />
          <img className="site-header__logo site-header__logo--black" src={logoAzul} alt="" aria-hidden="true" />
        </a>

        <nav className="site-header__nav" aria-label="Secciones del recorrido">
          {sections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              className={`site-header__item${index === activeIndex ? ' is-active' : ''}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => onSelectSection(index)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <Link className="site-header__cta" to={ctaHref}>
          {ctaLabel}
        </Link>
      </header>
    </div>
  )
}

export default Header
