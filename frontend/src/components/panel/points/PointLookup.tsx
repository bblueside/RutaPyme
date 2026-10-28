// Consultar las salidas de un punto (GET /api/puntos/{id}).
import { useId, useState, type FormEvent } from 'react'
import { POINT_TYPE_COLOR } from '../../../constants/pointTypes'
import { useApiHealth } from '../../../hooks/useApiHealth'
import { useSubmit } from '../../../hooks/useSubmit'
import { getPoint } from '../../../services/pointService'
import type { PointDetailResponse } from '../../../types/network'
import Card from '../shared/Card'
import InlineError from '../shared/InlineError'
import PointDatalist from '../shared/PointDatalist'
import TypeBadge from '../shared/TypeBadge'
import styles from './PointLookup.module.css'

function PointLookup({ className }: { className?: string }) {
  const { status } = useApiHealth()
  const { pending, error, run, clearError } = useSubmit(getPoint)
  const [id, setId] = useState('')
  const [detail, setDetail] = useState<PointDetailResponse | null>(null)
  const fieldId = useId()
  const errorId = useId()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setDetail(null)
    setDetail((await run(id)) ?? null)
  }

  return (
    <Card title="Consultar punto" endpoint={{ method: 'GET', path: '/api/puntos/{id}' }} className={className}>
      <form className="pn-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className="pn-field">
          <label className="pn-label" htmlFor={fieldId}>Identificador</label>
          <input
            id={fieldId}
            className="pn-input pn-input--code"
            list={`${fieldId}-lista`}
            value={id}
            placeholder="BOD-CENTRO"
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => {
              setId(event.target.value)
              clearError()
            }}
          />
          <PointDatalist id={`${fieldId}-lista`} />
        </div>
        <InlineError id={errorId} message={error?.message} />
        <div className="pn-actions">
          <button type="submit" className="pn-btn pn-btn--secondary" disabled={pending || status !== 'online'}>
            {pending ? 'Consultando…' : 'Consultar'}
          </button>
        </div>
      </form>

      {detail && (
        <div className={styles.result} aria-live="polite">
          <p className={styles.head}>
            <span className="pn-code">{detail.punto.id}</span>
            <span aria-hidden="true">·</span>
            <TypeBadge type={detail.punto.tipo} />
          </p>
          {detail.salidas.length === 0 ? (
            <p className="pn-muted">No tiene salidas registradas</p>
          ) : (
            <>
              <ul className={styles.exits}>
                {detail.salidas.map((exit) => (
                  <li key={exit.destino}>
                    <span className={styles.dot} style={{ background: POINT_TYPE_COLOR[detail.punto.tipo] }} aria-hidden="true" />
                    <span className="pn-code">{exit.destino}</span>
                    <span className={styles.cost}>costo {exit.costo}</span>
                  </li>
                ))}
              </ul>
              <p className={styles.foot}>
                {detail.salidas.length} {detail.salidas.length === 1 ? 'salida registrada' : 'salidas registradas'}
              </p>
            </>
          )}
        </div>
      )}
    </Card>
  )
}

export default PointLookup
