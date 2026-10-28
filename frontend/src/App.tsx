// Composición de la aplicación: la landing en "/" y el acceso a la interfaz en "/app".
import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/header/Header'
import ScrollWorld from './components/landing/ScrollWorld'
import InfoSections, { INFO_NAV_SECTIONS } from './components/landing/InfoSections'
import LandingClosing from './components/landing/LandingClosing'
import { HOME_HREF, WORLD_CONFIG } from './components/landing/scrollWorldConfig'
import type { ScrollWorldInstance } from './lib/scrub-engine.js'
import { INTERFACE_ROUTE, PANEL_ROUTES, TOP_ANCHOR } from './routes'
import { useZonaLanding } from './hooks/useZonaLanding'
import PanelLayout from './components/panel/layout/PanelLayout'
import OverviewView from './components/panel/overview/OverviewView'
import PointsView from './components/panel/points/PointsView'
import CoverageView from './components/panel/coverage/CoverageView'

const SECTIONS = [...WORLD_CONFIG.sections, ...INFO_NAV_SECTIONS]
const WORLD_SECTION_COUNT = WORLD_CONFIG.sections.length
const INFO_IDS = INFO_NAV_SECTIONS.map((section) => section.id)

function Landing() {
  const worldRef = useRef<ScrollWorldInstance | null>(null)
  const infoRef = useRef<HTMLElement>(null)
  const [activeSection, setActiveSection] = useState(0)
  const { modo, indiceInfo } = useZonaLanding(infoRef, INFO_IDS)

  // Modo oscuro: sigue el motor. Modo claro: solo las secciones informativas (ninguna dentro del cierre).
  const activeIndex = modo === 'claro' ? (indiceInfo === null ? -1 : WORLD_SECTION_COUNT + indiceInfo) : activeSection

  function selectSection(index: number) {
    if (index < WORLD_SECTION_COUNT) {
      worldRef.current?.jumpTo(index)
      return
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(SECTIONS[index].id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  return (
    <>
      <Header
        variant={modo === 'claro' ? 'light' : 'dark'}
        sections={SECTIONS}
        activeIndex={activeIndex}
        onSelectSection={selectSection}
        ctaLabel="Probar el optimizador"
        ctaHref={INTERFACE_ROUTE}
        homeHref={HOME_HREF}
      />
      <div id={TOP_ANCHOR} />
      <ScrollWorld worldRef={worldRef} onSectionChange={setActiveSection} />
      <main className="landing-sections" ref={infoRef}>
        <InfoSections />
        <LandingClosing />
      </main>
    </>
  )
}

function App() {
  const { pathname } = useLocation()

  // Al cambiar de ruta se empieza arriba: la landing deja el scroll muy abajo.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path={INTERFACE_ROUTE} element={<PanelLayout />}>
        <Route index element={<OverviewView />} />
        <Route path={PANEL_ROUTES.points} element={<PointsView />} />
        <Route path={PANEL_ROUTES.connections} element={<Navigate to={PANEL_ROUTES.points} replace />} />
        <Route path={PANEL_ROUTES.coverage} element={<CoverageView />} />
      </Route>
    </Routes>
  )
}

export default App
