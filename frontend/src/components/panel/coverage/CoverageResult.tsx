// Resultado de la cobertura completa desde un origen: veredicto, cifras, imagen y listas.
import type { ReactNode } from 'react'
import type { Coverage } from '../../../types/coverage'
import { CheckCircleIcon, CrossCircleIcon } from '../shared/icons'
import Card from '../shared/Card'
import PathChips from '../shared/PathChips'
import BfsLayers from './BfsLayers'
import ReachableList from './ReachableList'
import StatTiles from './StatTiles'
import TraversalTrace from './TraversalTrace'
import UnreachableList from './UnreachableList'

function CoverageResult({ result, image }: { result: Coverage; image: ReactNode }) {
  const covered = result.total_alcanzables > 0
  const Icon = covered ? CheckCircleIcon : CrossCircleIcon

  return (
    <>
      <Card title="Resultado de la cobertura" endpoint={{ method: 'GET', path: `/api/cobertura/${result.origen.id}` }}>
        <div className={`pn-alert pn-alert--strong pn-alert--${covered ? 'success' : 'error'}`} role="status">
          <Icon width={18} height={18} style={{ flex: 'none', marginTop: 1 }} />
          <span>{result.mensaje}</span>
        </div>
        <StatTiles
          stats={[
            { label: 'Alcanzables', value: result.total_alcanzables },
            { label: 'No alcanzables', value: result.total_no_alcanzables },
            { label: 'Trayectos máx.', value: Math.max(result.capas.length - 1, 0) },
            { label: 'Capas', value: result.capas.length },
          ]}
        />
      </Card>
      {image}
      <div className="pn-grid pn-grid--8">
        <ReachableList className="pn-col-5" points={result.alcanzables} />
        <UnreachableList className="pn-col-3" points={result.no_alcanzables} />
        <BfsLayers className="pn-col-5 pn-only-mobile" layers={result.capas} />
        <Card title="Orden de visita" className="pn-col-4">
          <PathChips path={result.orden_visita} separator="›" label="Orden de visita" />
        </Card>
        <TraversalTrace className="pn-col-4" steps={result.traza} />
      </div>
    </>
  )
}

export default CoverageResult
