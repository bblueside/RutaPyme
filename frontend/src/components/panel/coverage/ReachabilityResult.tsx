// Veredicto origen → destino: camino de evidencia y nota (alcanzable) o explicación (no alcanzable).
import type { ReactNode } from 'react'
import type { Reachability } from '../../../types/coverage'
import { CheckCircleIcon, CrossCircleIcon, InfoIcon } from '../shared/icons'
import Card from '../shared/Card'
import PathChips from '../shared/PathChips'
import StatTiles from './StatTiles'
import TraversalTrace from './TraversalTrace'
import styles from './ReachabilityResult.module.css'

function ReachabilityResult({ result, image }: { result: Reachability; image: ReactNode }) {
  const endpoint = { method: 'GET', path: `/api/cobertura/${result.origen.id}/${result.destino.id}` }

  if (!result.alcanzable) {
    return (
      <>
        <Card title="Veredicto de la ruta" endpoint={endpoint}>
          <div className="pn-alert pn-alert--strong pn-alert--error" role="status">
            <CrossCircleIcon width={18} height={18} style={{ flex: 'none', marginTop: 1 }} />
            <span>{result.mensaje}</span>
          </div>
          <p className={styles.explanation}>{result.explicacion}</p>
          <p className={styles.coverTitle}>Desde {result.origen.id} sí se cubre:</p>
          {result.alcanzables_desde_origen.length === 0 ? (
            <p className="pn-muted">Ningún otro punto.</p>
          ) : (
            <PathChips path={result.alcanzables_desde_origen} separator="none" label={`Alcanzables desde ${result.origen.id}`} />
          )}
        </Card>
        {image}
      </>
    )
  }

  const note: ReactNode = (
    <div className="pn-alert pn-alert--info">
      <InfoIcon width={16} height={16} style={{ flex: 'none', marginTop: 2 }} />
      <p style={{ margin: 0 }}>{result.nota}</p>
    </div>
  )

  return (
    <>
      <Card title="Veredicto de la ruta" endpoint={endpoint}>
        <div className="pn-alert pn-alert--strong pn-alert--success" role="status">
          <CheckCircleIcon width={18} height={18} style={{ flex: 'none', marginTop: 1 }} />
          <span>{result.mensaje}</span>
        </div>
        <p className={styles.coverTitle}>Camino de evidencia</p>
        <PathChips path={result.camino} size="large" highlightEnds label="Camino de evidencia" />
        <StatTiles
          stats={[
            { label: 'Trayectos', value: result.saltos },
            { label: 'Nota', value: 'Ruta con menos trayectos' },
          ]}
        />
      </Card>
      {image}
      <div className="pn-grid pn-grid--8">
        <Card title="Nota de la API" className="pn-col-8">{note}</Card>
        {result.traza && <TraversalTrace className="pn-col-8" steps={result.traza} />}
      </div>
    </>
  )
}

export default ReachabilityResult
