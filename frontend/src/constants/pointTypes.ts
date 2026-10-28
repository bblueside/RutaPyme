// Etiquetas en español de cada tipo de punto (glosario de la interfaz).
import type { PointType } from '../types/network'

export const POINT_TYPES: PointType[] = ['bodega', 'barrio', 'punto_recogida']

export const POINT_TYPE_LABEL: Record<PointType, string> = {
  bodega: 'Bodega',
  barrio: 'Barrio',
  punto_recogida: 'Punto de recogida',
}

export const POINT_TYPE_PLURAL: Record<PointType, string> = {
  bodega: 'Bodegas',
  barrio: 'Barrios',
  punto_recogida: 'Puntos de recogida',
}

// Variable CSS con el color del tipo (definida en styles/panel-tokens.css).
export const POINT_TYPE_COLOR: Record<PointType, string> = {
  bodega: 'var(--panel-type-bodega)',
  barrio: 'var(--panel-type-barrio)',
  punto_recogida: 'var(--panel-type-recogida)',
}
