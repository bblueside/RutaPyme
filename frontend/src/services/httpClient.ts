// Única puerta de salida hacia la API: ningún componente llama a fetch directamente.
import type { ApiErrorBody } from '../types/apiError'

export const OFFLINE_CODE = 'sin_conexion'

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

const OFFLINE_MESSAGE = 'No hay conexión con la API. Compruebe que el backend esté encendido.'

function readErrorBody(body: unknown): ApiErrorBody['error'] | null {
  if (typeof body !== 'object' || body === null || !('error' in body)) return null
  const { error } = body as ApiErrorBody
  return error && typeof error.mensaje === 'string' ? error : null
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, OFFLINE_CODE, OFFLINE_MESSAGE)
  }

  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = readErrorBody(data)
    if (error) throw new ApiError(response.status, error.codigo, error.mensaje)
    // El proxy de Vite responde 5xx sin cuerpo cuando la API está apagada.
    if (response.status >= 500) throw new ApiError(response.status, OFFLINE_CODE, OFFLINE_MESSAGE)
    throw new ApiError(response.status, 'error_desconocido', `Error ${response.status}`)
  }
  return data as T
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  return new ApiError(0, 'error_desconocido', error instanceof Error ? error.message : 'Error inesperado')
}
