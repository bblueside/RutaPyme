// Forma del cuerpo de error de la API: {"error": {"codigo", "mensaje"}}.
export interface ApiErrorBody {
  error: {
    codigo: string
    mensaje: string
  }
}
