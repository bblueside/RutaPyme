// Traza paso a paso del recorrido. Muestra los 10 primeros pasos y ofrece "Ver todos" si hay más.
import { useState } from 'react'
import type { TraceStep } from '../../../types/coverage'
import Card from '../shared/Card'
import styles from './TraversalTrace.module.css'

const PREVIEW_STEPS = 10

function TraversalTrace({ steps, className }: { steps: TraceStep[]; className?: string }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? steps : steps.slice(0, PREVIEW_STEPS)

  return (
    <Card title="Traza del recorrido" className={className}>
      <ol className={styles.list}>
        {visible.map((step) => (
          <li key={step.paso} className={styles.step}>
            <span className={styles.number}>{step.paso}</span>
            <span>
              <span className="pn-code">{step.visita}</span>
              <span className={styles.layer}> · capa {step.capa}</span>
              <span className={styles.decision}>{step.decision}</span>
            </span>
          </li>
        ))}
      </ol>
      {steps.length > PREVIEW_STEPS && (
        <button type="button" className="pn-btn pn-btn--ghost" onClick={() => setShowAll((current) => !current)}>
          {showAll ? 'Ver menos' : `Ver todos (${steps.length})`}
        </button>
      )}
    </Card>
  )
}

export default TraversalTrace
