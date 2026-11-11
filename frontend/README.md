# Frontend de RutaPyme

React + TypeScript con Vite. Contiene la landing (`/`) y el panel que consume la API real (`/app`).

## Levantar el panel

1. API (desde la raíz del repositorio): `python main.py --ejemplo` (escucha en `http://127.0.0.1:8000`).
2. Panel: `cd frontend && npm install && npm run dev` y abrir `http://localhost:5173/app`.

El servidor de desarrollo reenvía `/api` a `http://127.0.0.1:8000` (proxy de `vite.config.ts`), así que el
backend no necesita CORS.

## Vistas del panel

| Ruta | Vista |
|------|-------|
| `/app` | «Mi red de entregas»: contadores, mapa, ruta más rápida con costo en COP, cobertura, lugares y trayectos |
| `/app/*` | Cualquier otra subruta vuelve a `/app` (el panel es una sola página) |

## Comandos

- `npm run lint` — ESLint.
- `npm run build` — comprobación de tipos y build de producción.

## Documentación

- Plan técnico: [`docs/frontend/plan.md`](../docs/frontend/plan.md)
- Plan de diseño y bocetos: [`docs/frontend/plan-diseno.md`](../docs/frontend/plan-diseno.md)
- Checklist manual: [`pruebas/prueba_manual_panel.md`](../pruebas/prueba_manual_panel.md)

El frontend anterior (`frontend/legacy/`) sigue disponible como respaldo y lo sirve el backend en `:8000`.
