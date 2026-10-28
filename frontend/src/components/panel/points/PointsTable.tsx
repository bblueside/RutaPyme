// Tabla de puntos: identificador, tipo y número de salidas (de red.lista_adyacencia).
import { useNetwork } from '../../../hooks/useNetwork'
import Card from '../shared/Card'
import TypeBadge from '../shared/TypeBadge'

function PointsTable({ highlightId, className }: { highlightId: string | null; className?: string }) {
  const { points, network, loading } = useNetwork()

  return (
    <Card title="Puntos registrados" endpoint={{ method: 'GET', path: '/api/puntos' }} className={className}>
      {loading ? (
        <div className="pn-skeleton" style={{ height: 180 }} aria-hidden="true" />
      ) : (
        <div className="pn-table-wrap" tabIndex={0} role="region" aria-label="Puntos registrados">
          <table className="pn-table">
            <thead>
              <tr>
                <th scope="col">Identificador</th>
                <th scope="col">Tipo</th>
                <th scope="col" className="pn-num">Salidas</th>
              </tr>
            </thead>
            <tbody>
              {points.length === 0 ? (
                <tr>
                  <td className="pn-empty" colSpan={3}>Aún no hay puntos registrados</td>
                </tr>
              ) : (
                points.map((point) => (
                  <tr key={point.id} className={point.id === highlightId ? 'is-new' : undefined}>
                    <td className="pn-code">{point.id}</td>
                    <td><TypeBadge type={point.tipo} variant="dot" /></td>
                    <td className="pn-num">{network?.lista_adyacencia[point.id]?.length ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default PointsTable
