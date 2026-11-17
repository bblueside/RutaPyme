// Aviso de la cobertura (D-18): nombra los lugares fuera de cobertura unidos con «y». Con más de 3 nombra los dos
// primeros y cuenta el resto («A, B y N lugares más…»). Sin lugares fuera de cobertura, el aviso es positivo.
export interface UnreachableNotice {
  /** «warning» = recuadro naranja; «ok» = recuadro verde. */
  tone: 'warning' | 'ok'
  text: string
}

const MAX_NAMED = 3

export function describeUnreachable(names: string[]): UnreachableNotice {
  if (names.length === 0) return { tone: 'ok', text: 'Llegas a todos tus lugares.' }
  if (names.length === 1) return { tone: 'warning', text: `${names[0]} está fuera de tu cobertura actual.` }

  const fits = names.length <= MAX_NAMED
  const named = fits ? names.slice(0, -1) : names.slice(0, MAX_NAMED - 1)
  const last = fits ? names[names.length - 1] : `${names.length - named.length} lugares más`
  return { tone: 'warning', text: `${named.join(', ')} y ${last} están fuera de tu cobertura actual.` }
}
