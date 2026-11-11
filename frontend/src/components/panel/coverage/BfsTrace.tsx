// «Ver cómo se calculó» de la cobertura: capas y traza del recorrido por anchura (BFS) que devuelve la API.
import { useState } from 'react'
import type { Coverage } from '../../../types/coverage'
import { ChevronDownIcon } from '../shared/icons'
import styles from './BfsTrace.module.css'

const PREVIEW_STEPS = 6

function BfsTrace({ coverage }: { coverage: Coverage }) {
  const [showAll, setShowAll] = useState(false)
  const steps = showAll ? coverage.traza : coverage.traza.slice(0, PREVIEW_STEPS)

  return (
    <details className={styles.details}>
      <summary className={styles.summary}>
        Ver cómo se calculó <ChevronDownIcon className={styles.chevron} width={16} height={16} />
      </summary>
      <p className={styles.algorithm}>{coverage.algoritmo}</p>
      <ol className={styles.layers} aria-label="Capas del recorrido">
        {coverage.capas.map((ids, index) => (
          <li key={index}>
            <span className={styles.layerNumber} aria-label={`Capa ${index}`}>{index}</span>
            <span className="pn-code">{ids.join(' · ')}</span>
          </li>
        ))}
      </ol>
      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step.paso} className={styles.step}>
            <span className={styles.number}>{step.paso}</span>
            <span className={styles.body}>
              <span><span className="pn-code">{step.visita}</span> · capa {step.capa}</span>
              <span className={styles.decision}>{step.decision}</span>
            </span>
          </li>
        ))}
      </ol>
      {coverage.traza.length > PREVIEW_STEPS && (
        <button type="button" className="pn-btn pn-btn--ghost" onClick={() => setShowAll((current) => !current)}>
          {showAll ? 'Ver menos' : `Ver todos (${coverage.traza.length})`}
        </button>
      )}
    </details>
  )
}

export default BfsTrace
