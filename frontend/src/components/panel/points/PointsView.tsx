// Vista Puntos y conexiones (/app/points): formularios e imagen en vivo arriba; las dos tablas, lado a lado, abajo.
import { useState } from 'react'
import { useNetwork } from '../../../hooks/useNetwork'
import ConnectionForm from '../connections/ConnectionForm'
import ConnectionsTable from '../connections/ConnectionsTable'
import ViewHeader from '../layout/ViewHeader'
import { InfoIcon } from '../shared/icons'
import NetworkImageCard from '../shared/NetworkImageCard'
import PointForm from './PointForm'
import PointLookup from './PointLookup'
import PointsTable from './PointsTable'

function PointsView() {
  const { network } = useNetwork()
  const [newPointId, setNewPointId] = useState<string | null>(null)
  const [newConnectionKey, setNewConnectionKey] = useState<string | null>(null)

  return (
    <>
      <ViewHeader
        title="Puntos y conexiones"
        description="Registra puntos, enlázalos con un costo de transporte y consulta sus salidas."
        meta={network ? `${network.resumen.puntos} puntos · ${network.resumen.conexiones} conexiones` : undefined}
      />
      <div className="pn-grid">
        <div className="pn-stack pn-col-5">
          <PointForm onCreated={setNewPointId} />
          <ConnectionForm onCreated={setNewConnectionKey} />
          <div className="pn-alert pn-alert--info">
            <InfoIcon width={16} height={16} style={{ flex: 'none', marginTop: 2 }} />
            <p style={{ margin: 0 }}>
              <strong>Sugerencia.</strong> Los identificadores se autocompletan con los puntos de la red. ¿Red vacía?
              Usa «Cargar red de ejemplo».
            </p>
          </div>
          <PointLookup />
        </div>
        <NetworkImageCard
          className="pn-col-7"
          title="Imagen de la red en vivo"
          subtitle="GET /api/red/imagen · se redibuja con cada punto o conexión que registras"
        />
      </div>
      <div className="pn-grid">
        <PointsTable className="pn-col-6" highlightId={newPointId} />
        <ConnectionsTable className="pn-col-6" highlightKey={newConnectionKey} />
      </div>
    </>
  )
}

export default PointsView
