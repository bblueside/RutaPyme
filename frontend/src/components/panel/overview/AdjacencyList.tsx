// Lista de adyacencia: una línea por punto con sus salidas `DESTINO (costo)` (red.lista_adyacencia).
import { POINT_TYPE_COLOR } from '../../../constants/pointTypes'
import { useNetwork } from '../../../hooks/useNetwork'
import Card from '../shared/Card'
import styles from './AdjacencyList.module.css'

function AdjacencyList({ className }: { className?: string }) {
  const { network, points, loading } = useNetwork()
  const types = new Map(points.map((point) => [point.id, point.tipo]))
  const entries = Object.entries(network?.lista_adyacencia ?? {})

  return (
    <Card title="Lista de adyacencia" endpoint={{ method: 'GET', path: '/api/red' }} className={className}>
      {loading ? (
        <div className="pn-skeleton" style={{ height: 200 }} aria-hidden="true" />
      ) : entries.length === 0 ? (
        <p className="pn-muted">Aún no hay puntos registrados</p>
      ) : (
        <ul className={styles.list}>
          {entries.map(([id, exits]) => {
            const type = types.get(id)
            return (
              <li key={id} className={styles.line}>
                <span
                  className={styles.dot}
                  style={{ background: type ? POINT_TYPE_COLOR[type] : 'var(--panel-ink-soft)' }}
                  aria-hidden="true"
                />
                <span className={`pn-code ${styles.id}`}>{id}</span>
                <span className={styles.arrow} aria-hidden="true">→</span>
                <span className={styles.exits}>
                  {exits.length === 0
                    ? '(sin salidas)'
                    : exits.map((exit) => `${exit.destino} (${exit.costo})`).join(' · ')}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export default AdjacencyList
