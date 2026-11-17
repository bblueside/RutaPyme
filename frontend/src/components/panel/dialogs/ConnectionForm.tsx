// Formulario «Conecta dos lugares.» (POST /api/conexiones). La API valida origen, destino y tiempo; aquí solo se
// muestra su mensaje. Al guardar avisa con un toast, actualiza la red y llama a `onDone`.
import { useId, useState, type FormEvent } from 'react'
import { displayName } from '../../../constants/pointNames'
import { useApiHealth } from '../../../hooks/useApiHealth'
import { useNetwork } from '../../../hooks/useNetwork'
import { useSubmit } from '../../../hooks/useSubmit'
import { useToast } from '../../../hooks/useToast'
import { createConnection } from '../../../services/connectionService'
import { InfoIcon, PlusIcon } from '../shared/icons'
import InlineError from '../shared/InlineError'
import styles from './ConnectionForm.module.css'

// Vacío → null (la API responde su propio 400); texto no numérico se envía tal cual para que la API lo rechace.
function parseCost(raw: string): number | string | null {
  const text = raw.trim().replace(',', '.')
  if (text === '') return null
  const number = Number(text)
  return Number.isNaN(number) ? raw.trim() : number
}

interface ConnectionFormProps {
  defaultOrigin: string
  defaultDestination: string
  onDone: () => void
  onCancel: () => void
}

function ConnectionForm({ defaultOrigin, defaultDestination, onDone, onCancel }: ConnectionFormProps) {
  const { status } = useApiHealth()
  const { points, refresh } = useNetwork()
  const { notify } = useToast()
  const { pending, error, run, clearError } = useSubmit(createConnection)
  const [origin, setOrigin] = useState(defaultOrigin)
  const [destination, setDestination] = useState(defaultDestination)
  const [cost, setCost] = useState('')
  const [saved, setSaved] = useState(false)
  const fieldId = useId()
  const errorId = useId()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = await run(origin, destination, parseCost(cost))
    if (!result) return
    setSaved(true)
    notify(result.mensaje, 'success')
    await refresh()
    onDone()
  }

  const invalid = error ? true : undefined
  const busy = pending || saved
  return (
    <form className="pn-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
      <div className="pn-field">
        <label className="pn-label" htmlFor={`${fieldId}-origen`}>Origen</label>
        <select id={`${fieldId}-origen`} className="pn-select" value={origin} aria-invalid={invalid} aria-describedby={error ? errorId : undefined}
          onChange={(event) => { setOrigin(event.target.value); clearError() }}>
          {points.map((point) => <option key={point.id} value={point.id}>{displayName(point.id)}</option>)}
        </select>
      </div>
      <div className="pn-field">
        <label className="pn-label" htmlFor={`${fieldId}-destino`}>Destino</label>
        <select id={`${fieldId}-destino`} className="pn-select" value={destination} aria-invalid={invalid} aria-describedby={error ? errorId : undefined}
          onChange={(event) => { setDestination(event.target.value); clearError() }}>
          {points.map((point) => <option key={point.id} value={point.id}>{displayName(point.id)}</option>)}
        </select>
      </div>
      <div className="pn-field">
        <label className="pn-label" htmlFor={`${fieldId}-costo`}>Tiempo estimado (minutos)</label>
        <input id={`${fieldId}-costo`} className="pn-input" inputMode="decimal" value={cost} placeholder="Ej. 12" autoComplete="off"
          autoFocus aria-invalid={invalid} aria-describedby={error ? errorId : undefined}
          onChange={(event) => { setCost(event.target.value); clearError() }} />
      </div>
      <p className={styles.info}>
        <InfoIcon width={16} height={16} />
        <span>El regreso no se agrega automáticamente. Regístralo como un nuevo trayecto si está disponible.</span>
      </p>
      <InlineError id={errorId} message={error?.message} />
      <div className="pn-actions pn-actions--end">
        <button type="button" className="pn-btn pn-btn--secondary" onClick={onCancel} disabled={busy}>Cancelar</button>
        <button type="submit" className="pn-btn pn-btn--primary" disabled={busy || status !== 'online'}>
          {pending ? 'Guardando…' : (<><PlusIcon />Agregar trayecto</>)}
        </button>
      </div>
    </form>
  )
}

export default ConnectionForm
