// Tarjeta del panel: título, etiqueta de endpoint opcional y contenido.
import type { ReactNode } from 'react'
import EndpointLabel from './EndpointLabel'

interface CardProps {
  title: string
  endpoint?: { method: string; path: string }
  subtitle?: string
  className?: string
  children: ReactNode
}

function Card({ title, endpoint, subtitle, className = '', children }: CardProps) {
  return (
    <section className={`pn-card ${className}`.trim()}>
      <div className="pn-card__head">
        <h2 className="pn-card__title">{title}</h2>
        {endpoint && <EndpointLabel method={endpoint.method} path={endpoint.path} />}
      </div>
      {subtitle && <p className="pn-card__sub">{subtitle}</p>}
      {children}
    </section>
  )
}

export default Card
