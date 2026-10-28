// Rutas internas de la aplicación. Todos los botones de acceso a la interfaz apuntan aquí.
export const INTERFACE_ROUTE = '/app'
export const TOP_ANCHOR = 'top'

// Vistas del panel (subrutas anidadas de INTERFACE_ROUTE).
export const PANEL_ROUTES = {
  overview: INTERFACE_ROUTE,
  points: `${INTERFACE_ROUTE}/points`,
  connections: `${INTERFACE_ROUTE}/connections`,
  coverage: `${INTERFACE_ROUTE}/coverage`,
}
