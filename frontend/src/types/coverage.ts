// Tipos del contrato de la Feature 2 (cobertura de entregas).
import type { Point } from './network'

export interface ReachablePoint extends Point {
  saltos: number
  llega_desde: string
}

export interface UnreachablePoint extends Point {
  motivo: string
}

export interface TraceStep {
  paso: number
  visita: string
  capa: number
  descubre: string[]
  ya_conocidos: string[]
  cola: string[]
  decision: string
}

export interface Coverage {
  origen: Point
  algoritmo: string
  mensaje: string
  total_alcanzables: number
  alcanzables: ReachablePoint[]
  total_no_alcanzables: number
  no_alcanzables: UnreachablePoint[]
  capas: string[][]
  orden_visita: string[]
  traza: TraceStep[]
}

export interface ReachableRoute {
  origen: Point
  destino: Point
  alcanzable: true
  mensaje: string
  saltos: number
  camino: string[]
  nota: string
  orden_visita?: string[]
  traza?: TraceStep[]
}

export interface UnreachableRoute {
  origen: Point
  destino: Point
  alcanzable: false
  mensaje: string
  explicacion: string
  alcanzables_desde_origen: string[]
}

export type Reachability = ReachableRoute | UnreachableRoute

export function isReachability(result: Coverage | Reachability): result is Reachability {
  return 'alcanzable' in result
}
