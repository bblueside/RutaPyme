---
name: sdd-feature
description: Guía paso a paso para construir una feature de RutaPyme con desarrollo orientado a especificaciones (SDD). Úsala al iniciar cualquier feature nueva o cuando se pida "planear", "especificar" o "implementar la feature N".
---

# Skill: construir una feature con SDD

Sigue las fases **en orden**. No pases a la siguiente sin cerrar la anterior.

## Fase 1 — Especificar (qué y por qué)

1. Lee la feature en `docs/enunciado/Guia_proyecto.md` y las reglas en `CLAUDE.md`.
2. Escribe `docs/feature-N/especificacion.md` con:
   - Historias de usuario (rol, necesidad, valor).
   - Criterios de aceptación numerados `CA-01, CA-02...` en formato *Dado / Cuando / Entonces*.
   - Reglas de validación y respuesta esperada (código HTTP y mensaje).
   - Contrato de la API (método, ruta, cuerpo, respuesta).
   - Lo que queda **fuera de alcance**.
3. Pide revisión humana de la especificación antes de seguir.

## Fase 2 — Modelar y trazar

1. En `docs/feature-N/modelado.md` define nodos, aristas, dirección, peso y estructura de datos.
2. Justifica la estructura con la operación más frecuente y su complejidad.
3. Dibuja un ejemplo pequeño (Mermaid) y haz una **traza manual** de la operación.

## Fase 3 — Planear

1. En `docs/feature-N/plan.md` divide el trabajo en tareas pequeñas (una por issue).
2. Asigna responsable y rama a cada tarea.

## Fase 4 — Implementar (siempre en este orden)

1. Núcleo Python puro (`backend/`), sin HTTP.
2. API REST con `http.server`.
3. Interfaz mínima en `frontend/` que consume la API.
4. Script de aceptación (usa la skill `prueba-aceptacion`).

## Fase 5 — Verificar y cerrar

1. Ejecuta el script de aceptación contra la API local y guarda la salida en `pruebas/salidas/`.
2. Pide al agente `revisor-reglas` que audite el cambio.
3. Actualiza README y `docs/ia/bitacora-feature-N.md`.
4. Abre el PR con la plantilla; otro integrante lo revisa.

## Prohibiciones que nunca se negocian

- Bibliotecas externas en el backend.
- Usar NetworkX para calcular (solo dibuja).
- Datos personales reales.
