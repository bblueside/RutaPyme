// Registrar una conexión dirigida (POST /api/conexiones). La API valida origen, destino y costo.
import { useId, useState, type FormEvent } from 'react'
import { useApiHealth } from '../../../hooks/useApiHealth'
import { useNetwork } from '../../../hooks/useNetwork'
import { useSubmit } from '../../../hooks/useSubmit'
import { useToast } from '../../../hooks/useToast'
import { createConnection } from '../../../services/connectionService'
import Card from '../shared/Card'
import { InfoIcon, PlusIcon } from '../shared/icons'
import InlineError from '../shared/InlineError'
import PointDatalist from '../shared/PointDatalist'
import styles from './ConnectionForm.module.css'

// Vacío → null (la API responde su propio 400); texto no numérico se envía tal cual para que la API lo rechace.
function parseCost(raw: string): number | string | null {
  const text = raw.trim().replace(',', '.')
  if (text === '') return null
  const number = Number(text)
  return Number.isNaN(number) ? raw.trim() : number
}

function ConnectionForm({ onCreated }: { onCreated: (key: string) => void }) {
  const { status } = useApiHealth()
  const { refresh } = useNetwork()
  const { notify } = useToast()
  const { pending, error, run, clearError } = useSubmit(createConnection)
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [cost, setCost] = useState('')
  const fieldId = useId()
  const errorId = useId()
  const listId = `${fieldId}-lista`

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = await run(origin, destination, parseCost(cost))
    if (!result) return
    notify(result.mensaje, 'success')
    setCost('')
    onCreated(`${result.conexion.origen}→${result.conexion.destino}`)
    await refresh()
  }

  function bind(setter: (value: string) => void) {
    return (event: { target: { value: string } }) => {
      setter(event.target.value)
      clearError()
    }
  }

  const invalid = error ? true : undefined
  const describedBy = error ? errorId : undefined

  return (
    <Card title="Registrar conexión" endpoint={{ method: 'POST', path: '/api/conexiones' }}>
      <form className="pn-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className="pn-field">
          <label className="pn-label" htmlFor={`${fieldId}-origen`}>Origen</label>
          <input id={`${fieldId}-origen`} className="pn-input pn-input--code" list={listId} value={origin}
            placeholder="BOD-CENTRO" autoComplete="off" aria-invalid={invalid} aria-describedby={describedBy}
            onChange={bind(setOrigin)} />
        </div>
        <div className="pn-field">
          <label className="pn-label" htmlFor={`${fieldId}-destino`}>Destino</label>
          <input id={`${fieldId}-destino`} className="pn-input pn-input--code" list={listId} value={destination}
            placeholder="BAR-NORTE" autoComplete="off" aria-invalid={invalid} aria-describedby={describedBy}
            onChange={bind(setDestination)} />
        </div>
        <div className="pn-field">
          <label className="pn-label" htmlFor={`${fieldId}-costo`}>Costo (minutos)</label>
          <input id={`${fieldId}-costo`} className="pn-input" inputMode="decimal" value={cost}
            placeholder="12" autoComplete="off" aria-invalid={invalid} aria-describedby={describedBy}
            onChange={bind(setCost)} />
        </div>
        <PointDatalist id={listId} />
        <p className={styles.hint}>
          <InfoIcon width={14} height={14} /> El costo debe ser mayor que 0.
        </p>
        <InlineError id={errorId} message={error?.message} />
        <div className="pn-actions">
          <button type="submit" className="pn-btn pn-btn--primary" disabled={pending || status !== 'online'}>
            {pending ? 'Guardando…' : (<><PlusIcon />Registrar conexión</>)}
          </button>
        </div>
      </form>
    </Card>
  )
}

export default ConnectionForm
