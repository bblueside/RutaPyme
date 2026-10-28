import type { Coverage, Reachability } from '../types/coverage'
import { request } from './httpClient'

export function getCoverage(origin: string) {
  return request<Coverage>('GET', `/api/cobertura/${encodeURIComponent(origin)}`)
}

export function checkReachability(origin: string, destination: string) {
  return request<Reachability>(
    'GET',
    `/api/cobertura/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`,
  )
}

export function coverageImageUrl(origin: string, version: number) {
  return `/api/red/imagen/cobertura/${encodeURIComponent(origin)}?v=${version}`
}
