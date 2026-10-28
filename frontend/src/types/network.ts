// Tipos del contrato de la Feature 1: las claves están en español, igual que el JSON de la API.
export type PointType = 'bodega' | 'barrio' | 'punto_recogida'

export interface Point {
  id: string
  tipo: PointType
}

export interface Connection {
  origen: string
  destino: string
  costo: number
}

export interface PointExit {
  destino: string
  costo: number
}

export interface NetworkSummary {
  puntos: number
  conexiones: number
  por_tipo: Record<PointType, number>
}

export interface Network {
  resumen: NetworkSummary
  lista_adyacencia: Record<string, PointExit[]>
  texto: string[]
}

export interface HealthResponse {
  estado: string
}

export interface PointTypesResponse {
  tipos: PointType[]
}

export interface PointListResponse {
  total: number
  puntos: Point[]
}

export interface PointCreatedResponse {
  mensaje: string
  punto: Point
}

export interface PointDetailResponse {
  punto: Point
  salidas: PointExit[]
}

export interface ConnectionListResponse {
  total: number
  conexiones: Connection[]
}

export interface ConnectionCreatedResponse {
  mensaje: string
  conexion: Connection
}

export interface MessageResponse {
  mensaje: string
}
