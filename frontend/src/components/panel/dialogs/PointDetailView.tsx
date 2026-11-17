// Detalle de un lugar (GET /api/puntos/{id}): tipo, identificador y trayectos de salida (D-29).
import { displayName } from '../../../constants/pointNames'
import { useApiResource } from '../../../hooks/useApiResource'
import { useNetwork } from '../../../hooks/useNetwork'
import { formatMinutes } from '../../../lib/formatCop'
import { getPoint } from '../../../services/pointService'
import InlineError from '../shared/InlineError'
import TypeBadge from '../shared/TypeBadge'
import styles from './PointDetailView.module.css'

function PointDetailView({ id }: { id: string }) {
  const { version } = useNetwork()
  const { data, error, loading } = useApiResource(`point|${id}|${version}`, () => getPoint(id))

  if (error) return <InlineError message={error.message} />
  if (loading || !data) return <div className="pn-skeleton" style={{ height: 96 }} aria-label="Cargando lugar" />

  return (
    <>
      <div className={styles.summary}>
        <TypeBadge type={data.punto.tipo} />
        <span className="pn-code">{data.punto.id}</span>
      </div>
      <h3 className={styles.heading}>Trayectos de salida ({data.salidas.length})</h3>
      {data.salidas.length === 0 ? (
        <p className="pn-muted">Este lugar no tiene trayectos de salida: desde aquí no se puede llegar a ningún otro lugar.</p>
      ) : (
        <ul className={styles.exits}>
          {data.salidas.map((exit) => (
            <li key={exit.destino}>
              <span><span aria-hidden="true">→ </span><strong>{displayName(exit.destino)}</strong></span>
              <span className={styles.minutes}>{formatMinutes(exit.costo)} min</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default PointDetailView
