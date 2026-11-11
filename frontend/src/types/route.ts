// Tipos del contrato de la Feature 3 (GET /api/ruta/{origen}/{destino}): claves en español, igual que el JSON.
import type { Point } from './network'

export interface RouteLeg {
  origen: string
  destino: string
  /** Minutos del trayecto. */
  costo: number
  acumulado: number
  costo_cop: number
  acumulado_cop: number
}

export interface MonetaryCost {
  moneda: string
  tarifa_por_minuto: number
  total: number
}

export interface FewestHopsComparison {
  camino: string[]
  saltos: number
  costo: number
  diferencia: number
  costo_cop: number
  diferencia_cop: number
  mensaje: string
}

export interface DijkstraStep {
  paso: number
  definitivo: string
  costo: number
  mejora: { punto: string; antes: number | null; ahora: number }[]
  descarta: { punto: string; motivo: string }[]
  pendientes: { punto: string; costo: number }[]
  decision: string
}

interface RouteBase {
  origen: Point
  destino: Point
  algoritmo: string
  mensaje: string
  orden_definitivos: string[]
  costos_definitivos: Record<string, number>
  traza: DijkstraStep[]
}

export interface RouteFound extends RouteBase {
  existe_ruta: true
  camino: string[]
  costo_total: number
  saltos: number
  costo_monetario: MonetaryCost
  tramos: RouteLeg[]
  comparacion_menos_saltos: FewestHopsComparison
}

export interface RouteNotFound extends RouteBase {
  existe_ruta: false
  explicacion: string
}

export type CheapestRoute = RouteFound | RouteNotFound
