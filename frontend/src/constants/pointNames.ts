// Nombres amigables de la red de ejemplo. La API solo guarda identificadores (BOD-CENTRO): cualquier
// otro identificador se muestra tal cual. Los textos que devuelve la API no se reescriben.
const FRIENDLY_NAMES: Record<string, string> = {
  'BOD-CENTRO': 'Bodega Central',
  'BAR-NORTE': 'Barrio Norte',
  'BAR-SUR': 'Barrio Sur',
  'BAR-ORIENTE': 'Barrio Oriente',
  'PR-ESTACION': 'La Estación',
  'PR-LAGUNA': 'La Laguna',
  'PR-PARQUE': 'El Parque',
}

export function displayName(id: string): string {
  return FRIENDLY_NAMES[id] ?? id
}

/** True si el identificador tiene nombre amigable (entonces conviene mostrar también el ID en letra técnica). */
export function hasFriendlyName(id: string): boolean {
  return id in FRIENDLY_NAMES
}
