import type { HealthResponse } from '../types/network'
import { request } from './httpClient'

export function getHealth() {
  return request<HealthResponse>('GET', '/api/salud')
}
