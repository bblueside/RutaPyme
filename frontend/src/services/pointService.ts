import type {
  PointCreatedResponse,
  PointDetailResponse,
  PointListResponse,
  PointType,
  PointTypesResponse,
} from '../types/network'
import { request } from './httpClient'

export function getPointTypes() {
  return request<PointTypesResponse>('GET', '/api/tipos')
}

export function listPoints() {
  return request<PointListResponse>('GET', '/api/puntos')
}

export function createPoint(id: string, tipo: PointType) {
  return request<PointCreatedResponse>('POST', '/api/puntos', { id, tipo })
}

export function getPoint(id: string) {
  return request<PointDetailResponse>('GET', `/api/puntos/${encodeURIComponent(id)}`)
}
