// Vista Resumen (/app): contadores, lista de adyacencia e imagen de la red.
import ViewHeader from '../layout/ViewHeader'
import NetworkImageCard from '../shared/NetworkImageCard'
import AdjacencyList from './AdjacencyList'
import NetworkSummary from './NetworkSummary'
import UpdatedAgo from './UpdatedAgo'

function OverviewView() {
  return (
    <>
      <ViewHeader
        title="Resumen de la red"
        description="Estado actual de la red de distribución, puntos registrados y cobertura de entregas."
        meta={<UpdatedAgo />}
      />
      <NetworkSummary />
      <div className="pn-grid">
        <AdjacencyList className="pn-col-5" />
        <NetworkImageCard
          className="pn-col-7"
          title="Imagen de la red"
          subtitle="Generada por la API · GET /api/red/imagen"
        />
      </div>
    </>
  )
}

export default OverviewView
