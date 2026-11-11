import type { CheapestRoute } from '../types/route'
import { request } from './httpClient'

export function getRoute(origin: string, destination: string) {
  return request<CheapestRoute>('GET', `/api/ruta/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`)
}

export function routeImageUrl(origin: string, destination: string, version: number) {
  return `/api/red/imagen/ruta/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}?v=${version}`
}
