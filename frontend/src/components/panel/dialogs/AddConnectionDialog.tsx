// Registrar un trayecto dirigido (POST /api/conexiones). La API valida origen, destino y costo.
import { useId, useState, type FormEvent } from 'react'
import { displayName, hasFriendlyName } from '../../../constants/pointNames'
import { useApiHealth } from '../../../hooks/useApiHealth'
import { useNetwork } from '../../../hooks/useNetwork'
import { useSubmit } from '../../../hooks/useSubmit'
import { useToast } from '../../../hooks/useToast'
import { createConnection } from '../../../services/connectionService'
import { InfoIcon, PlusIcon } from '../shared/icons'
import InlineError from '../shared/InlineError'
import Modal from '../shared/Modal'

// Vacío → null (la API responde su propio 400); texto no numérico se envía tal cual para que la API lo rechace.
function parseCost(raw: string): number | string | null {
  const text = raw.trim().replace(',', '.')
  if (text === '') return null
  const number = Number(text)
  return Number.isNaN(number) ? raw.trim() : number
}

function ConnectionForm({ defaultOrigin, defaultDestination, onClose }: { defaultOrigin: string; defaultDestination: string; onClose: () => void }) {
  const { status } = useApiHealth()
  const { points, refresh } = useNetwork()
  const { notify } = useToast()
  const { pending, error, run, clearError } = useSubmit(createConnection)
  const [origin, setOrigin] = useState(defaultOrigin)
  const [destination, setDestination] = useState(defaultDestination)
  const [cost, setCost] = useState('')
  const fieldId = useId()
  const errorId = useId()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = await run(origin, destination, parseCost(cost))
    if (!result) return
    notify(result.mensaje, 'success')
    onClose()
    await refresh()
  }

  const invalid = error ? true : undefined
  const describedBy = error ? errorId : `${fieldId}-hint`
  const label = (id: string) => (hasFriendlyName(id) ? `${displayName(id)} · ${id}` : id)

  return (
    <form className="pn-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
      <div className="pn-field">
        <label className="pn-label" htmlFor={`${fieldId}-origen`}>Origen</label>
        <select id={`${fieldId}-origen`} className="pn-select" value={origin} aria-invalid={invalid} aria-describedby={describedBy}
          onChange={(event) => { setOrigin(event.target.value); clearError() }}>
          {points.map((point) => <option key={point.id} value={point.id}>{label(point.id)}</option>)}
        </select>
      </div>
      <div className="pn-field">
        <label className="pn-label" htmlFor={`${fieldId}-destino`}>Destino</label>
        <select id={`${fieldId}-destino`} className="pn-select" value={destination} aria-invalid={invalid} aria-describedby={describedBy}
          onChange={(event) => { setDestination(event.target.value); clearError() }}>
          {points.map((point) => <option key={point.id} value={point.id}>{label(point.id)}</option>)}
        </select>
      </div>
      <div className="pn-field">
        <label className="pn-label" htmlFor={`${fieldId}-costo`}>Tiempo (minutos)</label>
        <input id={`${fieldId}-costo`} className="pn-input" inputMode="decimal" value={cost} placeholder="12" autoComplete="off"
          autoFocus aria-invalid={invalid} aria-describedby={describedBy}
          onChange={(event) => { setCost(event.target.value); clearError() }} />
        <p id={`${fieldId}-hint`} className="pn-hint"><InfoIcon width={14} height={14} /> El trayecto va en un solo sentido y el tiempo debe ser mayor que 0.</p>
      </div>
      <InlineError id={errorId} message={error?.message} />
      <div className="pn-actions pn-actions--end">
        <button type="button" className="pn-btn pn-btn--secondary" onClick={onClose} disabled={pending}>Cancelar</button>
        <button type="submit" className="pn-btn pn-btn--primary" disabled={pending || status !== 'online'}>
          {pending ? 'Guardando…' : (<><PlusIcon />Registrar trayecto</>)}
        </button>
      </div>
    </form>
  )
}

interface AddConnectionDialogProps {
  open: boolean
  defaultOrigin: string
  defaultDestination: string
  onClose: () => void
}

function AddConnectionDialog({ open, defaultOrigin, defaultDestination, onClose }: AddConnectionDialogProps) {
  return (
    <Modal open={open} title="Agregar trayecto" subtitle="Une dos lugares con un camino de un solo sentido." onClose={onClose}>
      <ConnectionForm defaultOrigin={defaultOrigin} defaultDestination={defaultDestination} onClose={onClose} />
    </Modal>
  )
}

export default AddConnectionDialog
