// Icono del tipo de lugar: caja para la bodega y marcador para barrios y puntos de recogida.
import type { PointType } from '../../../types/network'
import { BoxIcon, PinIcon } from './icons'

function PointTypeIcon({ type, size = 16 }: { type: PointType; size?: number }) {
  const Icon = type === 'bodega' ? BoxIcon : PinIcon
  return <Icon width={size} height={size} />
}

export default PointTypeIcon
