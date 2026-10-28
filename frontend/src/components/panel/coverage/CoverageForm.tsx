// Origen y destino → parámetros de la URL. Es la única validación propia del cliente: el origen es obligatorio.
import { useId, useState, type FormEvent } from 'react'
import { useApiHealth } from '../../../hooks/useApiHealth'
import Card from '../shared/Card'
import InlineError from '../shared/InlineError'
import PointDatalist from '../shared/PointDatalist'

interface CoverageFormProps {
  initialFrom: string
  initialTo: string
  onSearch: (origin: string, destination: string) => void
  onClear: () => void
}

function CoverageForm({ initialFrom, initialTo, onSearch, onClear }: CoverageFormProps) {
  const { status } = useApiHealth()
  const [origin, setOrigin] = useState(initialFrom)
  const [destination, setDestination] = useState(initialTo)
  const [missing, setMissing] = useState(false)
  const fieldId = useId()
  const errorId = useId()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!origin.trim()) {
      setMissing(true)
      return
    }
    setMissing(false)
    onSearch(origin, destination)
  }

  function handleClear() {
    setOrigin('')
    setDestination('')
    setMissing(false)
    onClear()
  }

  const title = destination.trim() ? 'Origen y destino' : 'Consultar cobertura'
  const path = destination.trim() ? '/api/cobertura/{origen}/{destino}' : '/api/cobertura/{origen}'

  return (
    <Card title={title} endpoint={{ method: 'GET', path }}>
      <form className="pn-form" onSubmit={handleSubmit} noValidate>
        <div className="pn-field">
          <label className="pn-label" htmlFor={`${fieldId}-origen`}>
            Origen <span className="pn-label__tag">obligatorio</span>
          </label>
          <input
            id={`${fieldId}-origen`}
            className="pn-input pn-input--code"
            list={`${fieldId}-lista`}
            value={origin}
            placeholder="BOD-CENTRO"
            autoComplete="off"
            aria-invalid={missing ? true : undefined}
            aria-describedby={missing ? errorId : undefined}
            onChange={(event) => {
              setOrigin(event.target.value)
              setMissing(false)
            }}
          />
        </div>
        <div className="pn-field">
          <label className="pn-label" htmlFor={`${fieldId}-destino`}>
            Destino <span className="pn-label__tag pn-label__tag--muted">(opcional)</span>
          </label>
          <input
            id={`${fieldId}-destino`}
            className="pn-input pn-input--code"
            list={`${fieldId}-lista`}
            value={destination}
            placeholder="BAR-ORIENTE"
            autoComplete="off"
            onChange={(event) => setDestination(event.target.value)}
          />
        </div>
        <PointDatalist id={`${fieldId}-lista`} />
        <InlineError id={errorId} message={missing ? 'Indique el punto de origen' : null} />
        <div className="pn-actions">
          <button type="submit" className="pn-btn pn-btn--primary" disabled={status !== 'online'}>
            Consultar
          </button>
          <button type="button" className="pn-btn pn-btn--secondary" onClick={handleClear}>
            Limpiar
          </button>
        </div>
      </form>
    </Card>
  )
}

export default CoverageForm
