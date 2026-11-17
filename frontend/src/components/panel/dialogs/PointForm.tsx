// Formulario «Un nuevo lugar en tu red.» (POST /api/puntos). Las reglas las valida la API; aquí solo se muestra
// su mensaje. Al guardar avisa con un toast, actualiza la red y llama a `onDone`.
import { useEffect, useId, useState, type FormEvent } from 'react'
import { POINT_TYPES, POINT_TYPE_LABEL } from '../../../constants/pointTypes'
import { useApiHealth } from '../../../hooks/useApiHealth'
import { useNetwork } from '../../../hooks/useNetwork'
import { useSubmit } from '../../../hooks/useSubmit'
import { useToast } from '../../../hooks/useToast'
import { createPoint, getPointTypes } from '../../../services/pointService'
import type { PointType } from '../../../types/network'
import { InfoIcon, PlusIcon } from '../shared/icons'
import InlineError from '../shared/InlineError'

interface PointFormProps {
  onDone: () => void
  onCancel: () => void
}

function PointForm({ onDone, onCancel }: PointFormProps) {
  const { status } = useApiHealth()
  const { refresh } = useNetwork()
  const { notify } = useToast()
  const { pending, error, run, clearError } = useSubmit(createPoint)
  const [id, setId] = useState('')
  const [type, setType] = useState<PointType>('bodega')
  const [types, setTypes] = useState<PointType[]>(POINT_TYPES)
  const [saved, setSaved] = useState(false)
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
    setSaved(true)
    notify(result.mensaje, 'success')
    await refresh()
    onDone()
  }

  const busy = pending || saved
  return (
    <form className="pn-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
      <div className="pn-field">
        <label className="pn-label" htmlFor={`${fieldId}-id`}>Nombre del lugar</label>
        <input
          id={`${fieldId}-id`}
          className="pn-input"
          value={id}
          placeholder="Ej. Barrio-Occidente"
          autoComplete="off"
          autoFocus
          data-autofocus
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : `${fieldId}-hint`}
          onChange={(event) => {
            setId(event.target.value)
            clearError()
          }}
        />
        <p id={`${fieldId}-hint`} className="pn-hint"><InfoIcon width={14} height={14} /> De 1 a 30 caracteres: letras sin tilde, números, «-» o «_».</p>
      </div>
      <div className="pn-field">
        <label className="pn-label" htmlFor={`${fieldId}-tipo`}>Tipo de lugar</label>
        <select id={`${fieldId}-tipo`} className="pn-select" value={type} onChange={(event) => setType(event.target.value as PointType)}>
          {types.map((option) => (
            <option key={option} value={option}>{POINT_TYPE_LABEL[option] ?? option}</option>
          ))}
        </select>
      </div>
      <InlineError id={errorId} message={error?.message} />
      <div className="pn-actions pn-actions--end">
        <button type="button" className="pn-btn pn-btn--secondary" onClick={onCancel} disabled={busy}>Cancelar</button>
        <button type="submit" className="pn-btn pn-btn--primary" disabled={busy || status !== 'online'}>
          {pending ? 'Guardando…' : (<><PlusIcon />Agregar lugar</>)}
        </button>
      </div>
    </form>
  )
}

export default PointForm
