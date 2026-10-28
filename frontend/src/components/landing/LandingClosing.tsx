// Cierre de la landing: llamado a la acción y pie de página.
import { Link } from 'react-router-dom'
import { INTERFACE_ROUTE } from '../../routes'
import './LandingClosing.css'

const REPOSITORY_URL = 'https://github.com/bblueside/RutaPyme'

const FOOTER_LINKS = [
  { label: 'Repositorio', href: REPOSITORY_URL },
  { label: 'Documentación', href: `${REPOSITORY_URL}/tree/main/docs` },
]

const COURSE_INFO = ['Matemáticas para informática', 'Trabajo integrador', 'ITM · 2026']

function LandingClosing() {
  return (
    <section className="ls-section ls-closing" aria-labelledby="ls-closing-title">
      <div className="ls-container">
        <p className="ls-eyebrow">Empieza ahora</p>
        <h2 className="ls-title" id="ls-closing-title">Planea con datos, no a ojo.</h2>
        <p className="ls-text">
          Abre la interfaz, carga la red de ejemplo y pídele a RutaPyme el camino más corto entre dos puntos.
        </p>
        <div className="ls-buttons">
          <Link className="ls-button ls-button--primary" to={INTERFACE_ROUTE}>Abrir la interfaz →</Link>
          <a className="ls-button" href={REPOSITORY_URL}>Ver el repositorio</a>
        </div>

        <footer className="ls-footer">
          <div className="ls-footer__columns">
            <div>
              <div className="ls-footer__brand">
                <svg className="ls-logo" aria-hidden="true"><use href="#graph-logo" /></svg>RutaPyme
              </div>
              <p>Rutas de reparto para pequeñas empresas, calculadas sobre un grafo propio.</p>
            </div>
            <nav aria-label="Enlaces">
              <h3>Enlaces</h3>
              <ul>
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}><a href={link.href}>{link.label}</a></li>
                ))}
                <li><Link to={INTERFACE_ROUTE}>Interfaz</Link></li>
              </ul>
            </nav>
            <div>
              <h3>Materia</h3>
              <ul>
                {COURSE_INFO.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
          <div className="ls-data-notice">
            <span>Todos los datos de esta página son sintéticos. Ningún punto, ruta o persona es real.</span>
          </div>
        </footer>
      </div>
    </section>
  )
}

export default LandingClosing
