// Tarifa por minuto para calcular el COSTO de cada trayecto. /api/red solo trae minutos; la tarifa llega en
// GET /api/ruta, así que se pide la ruta de un trayecto ya registrado (R-2: sin tocar el backend).
import { getRoute } from '../services/routeService'
import type { Connection } from '../types/network'
import { useApiResource } from './useApiResource'

export function useRatePerMinute(connections: Connection[]): number | null {
  const sample = connections[0]
  const { data } = useApiResource(sample ? `rate|${sample.origen}|${sample.destino}` : null, () =>
    getRoute(sample.origen, sample.destino),
  )
  return data?.existe_ruta ? data.costo_monetario.tarifa_por_minuto : null
}
