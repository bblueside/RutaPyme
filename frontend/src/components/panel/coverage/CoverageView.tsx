// Vista Cobertura (/app/coverage): formulario, resultado e imagen resaltada. La consulta vive en la URL.
import { useCoverageQuery } from '../../../hooks/useCoverageQuery'
import { useNetwork } from '../../../hooks/useNetwork'
import { coverageImageUrl } from '../../../services/coverageService'
import { isReachability } from '../../../types/coverage'
import { PANEL_ROUTES } from '../../../routes'
import ViewHeader from '../layout/ViewHeader'
import Card from '../shared/Card'
import CopyLinkChip from '../shared/CopyLinkChip'
import GraphImage from '../shared/GraphImage'
import BfsLayers from './BfsLayers'
import CoverageForm from './CoverageForm'
import CoverageResult from './CoverageResult'
import ReachabilityResult from './ReachabilityResult'
import styles from './CoverageView.module.css'

const EXAMPLES = [
  { label: 'BOD-CENTRO', from: 'BOD-CENTRO', to: '' },
  { label: 'BOD-CENTRO → PR-LAGUNA', from: 'BOD-CENTRO', to: 'PR-LAGUNA' },
]

function CoverageView() {
  const { from, to, result, error, loading, search, clear } = useCoverageQuery()
  const { version } = useNetwork()

  const isRoute = Boolean(to)
  const query = new URLSearchParams({ from, ...(to ? { to } : {}) }).toString()
  const link = `${PANEL_ROUTES.coverage}?${query}`

  const image = result && (
    <Card
      title={isRoute ? 'Imagen de la ruta' : 'Imagen resaltada desde el origen'}
      endpoint={{ method: 'GET', path: `/api/red/imagen/cobertura/${result.origen.id}` }}
    >
      <GraphImage
        src={coverageImageUrl(result.origen.id, version)}
        alt={
          isReachability(result)
            ? `Cobertura desde ${result.origen.id}`
            : `Cobertura desde ${result.origen.id}: ${result.total_alcanzables} alcanzables`
        }
      />
    </Card>
  )

  return (
    <>
      <ViewHeader
        title={isRoute ? 'Verificar una ruta' : 'Cobertura de entregas'}
        description={
          isRoute
            ? 'Comprueba si un destino es alcanzable desde un origen y con qué camino.'
            : 'Qué puntos quedan cubiertos desde un origen y cuáles no.'
        }
        meta={from ? <CopyLinkChip path={link} /> : undefined}
      />
      <div className="pn-grid">
        <div className="pn-stack pn-col-4">
          <CoverageForm key={`${from}|${to}`} initialFrom={from} initialTo={to} onSearch={search} onClear={clear} />
          {result && !isReachability(result) && (
            <BfsLayers className="pn-only-desktop" layers={result.capas} />
          )}
        </div>

        <div className="pn-stack pn-col-8">
          {!from && (
            <Card title="Elija un origen para ver qué puntos puede cubrir">
              <p className="pn-muted">Escriba un origen en el formulario o pruebe uno de estos ejemplos:</p>
              <div className={styles.examples}>
                {EXAMPLES.map((example) => (
                  <button
                    key={example.label}
                    type="button"
                    className="pn-btn pn-btn--secondary"
                    onClick={() => search(example.from, example.to)}
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </Card>
          )}
          {loading && <div className="pn-skeleton" style={{ height: 220 }} aria-hidden="true" />}
          {error && (
            <Card title="Resultado de la cobertura">
              <div className="pn-alert pn-alert--error" role="alert">
                <span aria-hidden="true">✕</span> {error.message}
              </div>
            </Card>
          )}
          {result &&
            (isReachability(result) ? (
              <ReachabilityResult result={result} image={image} />
            ) : (
              <CoverageResult result={result} image={image} />
            ))}
        </div>
      </div>
    </>
  )
}

export default CoverageView
