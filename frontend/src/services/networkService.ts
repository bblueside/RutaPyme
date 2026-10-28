import type { MessageResponse, Network } from '../types/network'
import { request } from './httpClient'

export function getNetwork() {
  return request<Network>('GET', '/api/red')
}

export function clearNetwork() {
  return request<MessageResponse>('DELETE', '/api/red')
}

export function loadSampleNetwork() {
  return request<MessageResponse>('POST', '/api/red/ejemplo')
}

// La versión evita que el navegador muestre una imagen vieja tras un cambio en la red.
export function networkImageUrl(version: number) {
  return `/api/red/imagen?v=${version}`
}
