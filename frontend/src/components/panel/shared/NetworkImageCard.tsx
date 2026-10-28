// Tarjeta con la imagen de la red que dibuja la API; se redibuja con cada acción hecha en el panel.
import { useNetwork } from '../../../hooks/useNetwork'
import { networkImageUrl } from '../../../services/networkService'
import Card from './Card'
import GraphImage from './GraphImage'
import GraphLegend from './GraphLegend'

interface NetworkImageCardProps {
  title: string
  subtitle: string
  className?: string
}

function NetworkImageCard({ title, subtitle, className }: NetworkImageCardProps) {
  const { network, version, loading } = useNetwork()
  const total = network?.resumen.puntos ?? 0
  const alt = `Red con ${total} puntos y ${network?.resumen.conexiones ?? 0} trayectos`

  return (
    <Card title={title} subtitle={subtitle} className={className}>
      {loading ? (
        <div className="pn-skeleton" style={{ height: 320 }} aria-hidden="true" />
      ) : (
        <GraphImage src={networkImageUrl(version)} alt={alt} empty={total === 0} />
      )}
      <GraphLegend />
    </Card>
  )
}

export default NetworkImageCard
