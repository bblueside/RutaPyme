const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/** Pesos colombianos con separador de miles y sin espacio, como en los bocetos: 3600 → "$3.600". */
export function formatCop(pesos: number): string {
  return copFormatter.format(pesos).replace(/\s/g, '')
}

/** Pesos de un tiempo en minutos con la tarifa por minuto, redondeado hacia arriba en .5 (igual que la API). */
export function minutesToCop(minutes: number, ratePerMinute: number): number {
  return Math.round(Number((minutes * ratePerMinute).toFixed(6)))
}

/** Minutos sin ceros sobrantes: 18 → "18", 7.5 → "7,5". */
export function formatMinutes(minutes: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(minutes)
}
