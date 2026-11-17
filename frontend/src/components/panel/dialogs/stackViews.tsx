// Vistas que se apilan dentro de un StackDialog: formulario de lugar, formulario de trayecto y detalle de un lugar.
// Cada función devuelve la vista completa (cabecera + contenido); las pantallas con `back` están en StackScreens.
import { displayName } from '../../../constants/pointNames'
import type { StackView } from '../../../context/dialogStackContext'
import type { Point } from '../../../types/network'
import { PinIcon, RouteIcon } from '../shared/icons'
import PointTypeIcon from '../shared/PointTypeIcon'
import PointDetailView from './PointDetailView'
import { ConnectionFormScreen, PointFormScreen } from './StackScreens'

export function pointFormView(): StackView {
  return {
    id: 'point-form',
    title: 'Un nuevo lugar en tu red.',
    subtitle: 'Cada destino empieza con un nombre único.',
    icon: <PinIcon />,
    size: 'sm',
    render: () => <PointFormScreen />,
  }
}

export function connectionFormView(origin: string, destination: string): StackView {
  return {
    id: 'connection-form',
    title: 'Conecta dos lugares.',
    subtitle: 'Registra un trayecto en un solo sentido.',
    icon: <RouteIcon />,
    size: 'sm',
    render: () => <ConnectionFormScreen origin={origin} destination={destination} />,
  }
}

export function pointDetailView(point: Point): StackView {
  return {
    id: `point-${point.id}`,
    title: `${displayName(point.id)}.`,
    subtitle: 'Detalle del lugar en tu red.',
    icon: <PointTypeIcon type={point.tipo} size={22} />,
    size: 'sm',
    render: () => <PointDetailView id={point.id} />,
  }
}
