// <datalist> con los identificadores de la red, para autocompletar origen y destino.
import { useNetwork } from '../../../hooks/useNetwork'

function PointDatalist({ id }: { id: string }) {
  const { points } = useNetwork()
  return (
    <datalist id={id}>
      {points.map((point) => (
        <option key={point.id} value={point.id} />
      ))}
    </datalist>
  )
}

export default PointDatalist
