// Registrar un punto (POST /api/puntos). Las reglas las valida la API; aquí solo se muestra su mensaje.
import { useEffect, useId, useState, type FormEvent } from 'react'
import { POINT_TYPES, POINT_TYPE_LABEL } from '../../../constants/pointTypes'
import { useApiHealth } from '../../../hooks/useApiHealth'
import { useNetwork } from '../../../hooks/useNetwork'
import { useSubmit } from '../../../hooks/useSubmit'
import { useToast } from '../../../hooks/useToast'
import { createPoint, getPointTypes } from '../../../services/pointService'
import type { PointType } from '../../../types/network'
import Card from '../shared/Card'
import { PlusIcon } from '../shared/icons'
import InlineError from '../shared/InlineError'

function PointForm({ onCreated }: { onCreated: (id: string) => void }) {
  const { status } = useApiHealth()
  const { refresh } = useNetwork()
  const { notify } = useToast()
  const { pending, error, run, clearError } = useSubmit(createPoint)
  const [id, setId] = useState('')
  const [type, setType] = useState<PointType>('bodega')
  const [types, setTypes] = useState<PointType[]>(POINT_TYPES)
  const fieldId = useId()
  const errorId = useId()

  useEffect(() => {
    getPointTypes()
      .then((response) => setTypes(response.tipos))
      .catch(() => undefined) // sin respuesta se usan los tres tipos conocidos
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = await run(id, type)
    if (!result) return
    notify(result.mensaje, 'success')
    setId('')
    onCreated(result.punto.id)
    await refresh()
  }

  return (
    <Card title="Registrar punto" endpoint={{ method: 'POST', path: '/api/puntos' }}>
      <form className="pn-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className="pn-field">
          <label className="pn-label" htmlFor={`${fieldId}-id`}>Identificador</label>
          <input
            id={`${fieldId}-id`}
            className="pn-input pn-input--code"
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
        </div>
        <div className="pn-field">
          <label className="pn-label" htmlFor={`${fieldId}-tipo`}>Tipo de punto</label>
          <select
            id={`${fieldId}-tipo`}
            className="pn-select"
            value={type}
            onChange={(event) => setType(event.target.value as PointType)}
          >
            {types.map((option) => (
              <option key={option} value={option}>
                {POINT_TYPE_LABEL[option] ?? option}
              </option>
            ))}
          </select>
        </div>
        <InlineError id={errorId} message={error?.message} />
        <div className="pn-actions">
          <button type="submit" className="pn-btn pn-btn--primary" disabled={pending || status !== 'online'}>
            {pending ? 'Guardando…' : (<><PlusIcon />Registrar punto</>)}
          </button>
        </div>
      </form>
    </Card>
  )
}

export default PointForm
