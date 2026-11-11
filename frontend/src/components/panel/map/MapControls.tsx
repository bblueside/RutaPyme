// Controles del mapa: acercar, alejar y recentrar.
import { MinusIcon, PlusIcon, RecenterIcon } from '../shared/icons'
import styles from './MapControls.module.css'

interface MapControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}

function MapControls({ onZoomIn, onZoomOut, onReset }: MapControlsProps) {
  return (
    <div className={styles.controls} role="group" aria-label="Controles del mapa">
      <button type="button" aria-label="Acercar el mapa" onClick={onZoomIn}><PlusIcon width={18} height={18} /></button>
      <button type="button" aria-label="Alejar el mapa" onClick={onZoomOut}><MinusIcon width={18} height={18} /></button>
      <button type="button" aria-label="Recentrar el mapa" onClick={onReset}><RecenterIcon width={18} height={18} /></button>
    </div>
  )
}

export default MapControls
