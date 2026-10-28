// Tabla de conexiones: origen → destino y costo en minutos.
import { useNetwork } from '../../../hooks/useNetwork'
import Card from '../shared/Card'

function ConnectionsTable({ highlightKey, className }: { highlightKey: string | null; className?: string }) {
  const { connections, loading } = useNetwork()

  return (
    <Card title="Conexiones registradas" endpoint={{ method: 'GET', path: '/api/conexiones' }} className={className}>
      {loading ? (
        <div className="pn-skeleton" style={{ height: 180 }} aria-hidden="true" />
      ) : (
        <div className="pn-table-wrap" tabIndex={0} role="region" aria-label="Conexiones registradas">
          <table className="pn-table">
            <thead>
              <tr>
                <th scope="col">Origen</th>
                <th scope="col" aria-hidden="true"></th>
                <th scope="col">Destino</th>
                <th scope="col" className="pn-num">Costo</th>
              </tr>
            </thead>
            <tbody>
              {connections.length === 0 ? (
                <tr>
                  <td className="pn-empty" colSpan={4}>Aún no hay conexiones</td>
                </tr>
              ) : (
                connections.map((connection) => {
                  const key = `${connection.origen}→${connection.destino}`
                  return (
                    <tr key={key} className={key === highlightKey ? 'is-new' : undefined}>
                      <td className="pn-code">{connection.origen}</td>
                      <td aria-hidden="true">→</td>
                      <td className="pn-code">{connection.destino}</td>
                      <td className="pn-num">{connection.costo} min</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default ConnectionsTable
