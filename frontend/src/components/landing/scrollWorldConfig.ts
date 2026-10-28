// Contenido y assets del recorrido de scroll. Lo comparten el motor (ScrollWorld) y el encabezado (Header).
import type { ClipSource, PosterSource, ScrollWorldConfig } from '../../lib/scrub-engine.js'
import { INTERFACE_ROUTE, TOP_ANCHOR } from '../../routes'

// Assets optimizados por scroll-assets/blueprint/optimizar_upscale.py (plan: docs/landing/plan-assets-upscale.md).
// El motor elige la variante de cada clip según el equipo: AV1 1080p, H.264 720p o sus versiones móviles.
const ASSETS_BASE = '/landing'
const ASSETS_VERSION = 'v2'

export const LOGO_SRC = `${ASSETS_BASE}/assets/logo_black.png`
export const HOME_HREF = `#${TOP_ANCHOR}`

const poster = (name: string): PosterSource => ({
  base: `${ASSETS_BASE}/escenas/opt/${name}.${ASSETS_VERSION}`,
  anchos: [1280, 1920, 2560],
})

const clip = (name: string): ClipSource => ({
  av1: `${ASSETS_BASE}/videos/1080/${name}.${ASSETS_VERSION}.av1.mp4`,
  h264: `${ASSETS_BASE}/videos/720/${name}.${ASSETS_VERSION}.h264.mp4`,
  movilAv1: `${ASSETS_BASE}/videos/720/${name}.${ASSETS_VERSION}.movil.av1.mp4`,
  movilH264: `${ASSETS_BASE}/videos/720/${name}.${ASSETS_VERSION}.movil.h264.mp4`,
})

// El encabezado (marca, navegación y botón de acceso) lo pinta el componente Header, no el motor.
export const WORLD_CONFIG: ScrollWorldConfig = {
  topbar: false,
  hint: 'desplázate y mira cómo optimizamos tu ruta',
  diveScroll: 1.3,
  connScroll: 0.9,
  sections: [
    {
      id: 'bodega', label: 'Bodega',
      still: poster('escena_1'),
      clip: clip('escena_1'),
      eyebrow: 'Optimización de rutas para pymes',
      title: 'Cada kilómetro de más es plata que se va.',
      body: 'Los pedidos salen "a ojo" y las rutas se improvisan. Con RutaPyme, tu bodega deja de adivinar y empieza a calcular.',
    },
    {
      id: 'modelo', label: 'Modelo',
      still: poster('escena_2'),
      clip: clip('escena_2'),
      scroll: 1.5, linger: 0.35,
      eyebrow: 'Del instinto a los grafos',
      title: 'Tu operación, convertida en un grafo.',
      body: 'Modelamos bodegas, clientes y calles como una red matemática y la consultamos al instante por API. Sin hojas de cálculo ni suposiciones.',
    },
    {
      id: 'red', label: 'Red',
      still: poster('escena_3'),
      clip: clip('escena_3'),
      scroll: 1.5, linger: 0.35,
      eyebrow: 'Nodos, aristas y costos',
      title: 'Cada punto es un nodo. Cada calle, una arista con costo.',
      body: 'Calles cerradas, vías de un solo sentido y distancias reales entran al modelo. Los trayectos bloqueados salen del cálculo antes de que te cuesten un viaje perdido.',
    },
    {
      id: 'ruta', label: 'Ruta',
      still: poster('escena_4'),
      clip: clip('escena_4'),
      scroll: 1.7, linger: 0.4,
      eyebrow: 'Alcance y ruta óptima',
      title: 'Sabe hasta dónde llegas y por dónde te sale más barato.',
      body: 'Desde cualquier bodega, RutaPyme calcula todos los destinos alcanzables y traza la ruta de menor costo. Más entregas por jornada con el mismo vehículo.',
      cta: {
        primary: { label: 'Optimizar mi primera ruta', href: INTERFACE_ROUTE },
        secondary: { label: 'Volver al inicio', href: HOME_HREF },
      },
    },
  ],
  // escena_1 es el conector de prueba 1→2 y entrada_2 arranca en su último fotograma real:
  // no hace falta conector aéreo entre ellas (null = fundido directo).
  connectors: [null, clip('conector_2_3'), clip('conector_3_4')],
}
