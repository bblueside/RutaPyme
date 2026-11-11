// «Ver cómo se calculó»: traza de Dijkstra tal como la devuelve la API (en minutos, con identificadores).
import { useState } from 'react'
import { formatMinutes } from '../../../lib/formatCop'
import type { CheapestRoute } from '../../../types/route'
import { ChevronDownIcon } from '../shared/icons'
import styles from './DijkstraTrace.module.css'

const PREVIEW_STEPS = 6

function DijkstraTrace({ route }: { route: CheapestRoute }) {
  const [showAll, setShowAll] = useState(false)
  const steps = showAll ? route.traza : route.traza.slice(0, PREVIEW_STEPS)

  return (
    <details className={styles.details}>
      <summary className={styles.summary}>
        Ver cómo se calculó <ChevronDownIcon className={styles.chevron} width={16} height={16} />
      </summary>
      <p className={styles.algorithm}>{route.algoritmo}</p>
      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step.paso} className={styles.step}>
            <span className={styles.number}>{step.paso}</span>
            <span className={styles.body}>
              <span><span className="pn-code">{step.definitivo}</span> queda definitivo a {formatMinutes(step.costo)} min</span>
              {step.mejora.map((improved) => (
                <span key={improved.punto} className={styles.detail}>
                  mejora <span className="pn-code">{improved.punto}</span>: {improved.antes === null ? 'nuevo' : `${formatMinutes(improved.antes)} min`} → {formatMinutes(improved.ahora)} min
                </span>
              ))}
              <span className={styles.decision}>{step.decision}</span>
            </span>
          </li>
        ))}
      </ol>
      {route.traza.length > PREVIEW_STEPS && (
        <button type="button" className="pn-btn pn-btn--ghost" onClick={() => setShowAll((current) => !current)}>
          {showAll ? 'Ver menos' : `Ver todos (${route.traza.length})`}
        </button>
      )}
    </details>
  )
}

export default DijkstraTrace
