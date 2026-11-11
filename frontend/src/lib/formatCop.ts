const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/** Pesos colombianos con separador de miles: 3600 → "$ 3.600". */
export function formatCop(pesos: number): string {
  return copFormatter.format(pesos).replaceAll(' ', ' ')
}

/** Minutos sin ceros sobrantes: 18 → "18", 7.5 → "7,5". */
export function formatMinutes(minutes: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(minutes)
}
