// Origen y destino de la "próxima entrega" y modo del mapa. Lo que el usuario no ha elegido se calcula
// con valores por defecto (D-11): la primera bodega y el primer punto de recogida con trayecto directo.
import { useCallback, useMemo, useState } from 'react'
import type { Network, Point } from '../types/network'

export type MapMode = 'full' | 'coverage' | 'route'

function defaultOrigin(points: Point[]): string {
  return (points.find((point) => point.tipo === 'bodega') ?? points[0])?.id ?? ''
}

function defaultDestination(points: Point[], origin: string, network: Network | null): string {
  const others = points.filter((point) => point.id !== origin)
  const direct = new Set((network?.lista_adyacencia[origin] ?? []).map((exit) => exit.destino))
  const pickup = (candidates: Point[]) => candidates.find((point) => point.tipo === 'punto_recogida')
  const withDirectTrip = others.filter((point) => direct.has(point.id))
  return (pickup(withDirectTrip) ?? pickup(others) ?? withDirectTrip[0] ?? others[0])?.id ?? ''
}

export function useDeliverySelection(points: Point[], network: Network | null) {
  const [chosenOrigin, setChosenOrigin] = useState<string | null>(null)
  const [chosenDestination, setChosenDestination] = useState<string | null>(null)
  const [mode, setMode] = useState<MapMode>('full')

  const exists = useCallback((id: string | null) => id !== null && points.some((point) => point.id === id), [points])

  const origin = useMemo(
    () => (exists(chosenOrigin) ? (chosenOrigin as string) : defaultOrigin(points)),
    [chosenOrigin, exists, points],
  )
  const destination = useMemo(
    () => (exists(chosenDestination) && chosenDestination !== origin ? (chosenDestination as string) : defaultDestination(points, origin, network)),
    [chosenDestination, exists, origin, points, network],
  )

  const swap = useCallback(() => {
    setChosenOrigin(destination)
    setChosenDestination(origin)
  }, [origin, destination])

  return { origin, destination, mode, setOrigin: setChosenOrigin, setDestination: setChosenDestination, setMode, swap }
}
