import type { ConnectionCreatedResponse, ConnectionListResponse } from '../types/network'
import { request } from './httpClient'

export function listConnections() {
  return request<ConnectionListResponse>('GET', '/api/conexiones')
}

// El costo se envía tal cual (número, texto o null): la API es quien valida y responde su propio 400.
export function createConnection(origen: string, destino: string, costo: number | string | null) {
  return request<ConnectionCreatedResponse>('POST', '/api/conexiones', { origen, destino, costo })
}
