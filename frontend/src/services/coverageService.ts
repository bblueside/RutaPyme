import type { Coverage } from '../types/coverage'
import { request } from './httpClient'

export function getCoverage(origin: string) {
  return request<Coverage>('GET', `/api/cobertura/${encodeURIComponent(origin)}`)
}

export function coverageImageUrl(origin: string, version: number) {
  return `/api/red/imagen/cobertura/${encodeURIComponent(origin)}?v=${version}`
}
