# Arnés del proyecto RutaPyme (instrucciones para agentes de IA)

Este archivo lo lee Claude Code al trabajar en el repositorio. Resume las reglas de
`docs/enunciado/Guia_tecnica.md` para que cualquier agente las respete.

## Reglas no negociables

1. Backend en **Python 3.12+** con API REST construida con la biblioteca estándar (`http.server`, `json`).
2. **Prohibido** instalar o importar bibliotecas externas en el backend (Flask, FastAPI, pydantic, pytest, requests...).
3. El grafo y sus algoritmos son **propios** (`backend/red.py`). NetworkX **solo** se importa en
   `backend/visualizacion.py` para dibujar datos que ya calculó nuestro código.
4. El frontend (`frontend/`) es HTML + CSS + JavaScript sin frameworks y **consume la API real**.
5. Solo datos sintéticos. Nunca datos personales reales.
6. Pruebas de aceptación con `urllib` (sin pytest ni mocks). Cada escenario imprime:
   escenario, esperado, obtenido y PASÓ/FALLÓ.

## Forma de trabajo (SDD: desarrollo orientado a especificaciones)

1. No se escribe código sin una especificación aprobada en `docs/feature-N/especificacion.md`.
2. El plan técnico (`docs/feature-N/plan.md`) divide la especificación en tareas pequeñas (issues).
3. Orden de implementación: núcleo Python → API REST → interfaz → script de aceptación → documentación.
4. Toda propuesta de IA aceptada o rechazada se registra en `docs/ia/bitacora-feature-N.md`.
5. Una rama por feature o tarea, Pull Request con plantilla y revisión de otro integrante.

## Convenciones

- Código, nombres y mensajes en español, sin abreviaturas crípticas.
- Commits con prefijo: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`.
- Ramas: `feature/<n>-<nombre>`, `docs/<tema>`, `fix/<tema>`.
