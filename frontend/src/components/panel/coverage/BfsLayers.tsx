// Capas del recorrido por anchura: capa 0 es el origen; cada capa N está a N trayectos de él.
import Card from '../shared/Card'
import styles from './BfsLayers.module.css'

function BfsLayers({ layers, className }: { layers: string[][]; className?: string }) {
  return (
    <Card title="Capas del recorrido" className={className}>
      <ol className={styles.list}>
        {layers.map((ids, index) => (
          <li key={index} className={styles.row}>
            <span className={styles.number} aria-label={`Capa ${index}`}>{index}</span>
            <span className="pn-code">{ids.join(' · ')}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

export default BfsLayers
