# Bitácora de IA — Landing (recorrido con scroll)

Herramienta: **Claude Code** (modelo Claude Opus) con la skill `scroll-world`. Las imágenes se generaron con
**Nano Banana Pro** y los videos con **Gemini Omni** (`gemini_cli.py`); el color se corrigió con OpenCV
(`corregir_color.py`). Plan de producción: [`scroll-assets/plan-cadena.md`](../../scroll-assets/plan-cadena.md).
Código: [`frontend/landing/`](../../frontend/landing/).

> Cada integrante debe poder explicar cada fila. Si una fila no se entiende, no se entrega.

> **Desviación del SDD:** el recorrido con scroll se implementó a partir de `plan-cadena.md`, sin una
> especificación aprobada en `docs/`. Las secciones de cierre sí tienen especificación y plan
> (`docs/landing/`), todavía pendientes de aprobación.

| # | Decisión o pieza | Herramienta / objetivo de IA | Propuesta recibida | Acepté o rechacé y por qué | Cómo la verifiqué |
|---|------------------|------------------------------|--------------------|----------------------------|-------------------|
| 1 | Estilo visual | Claude Code + Nano Banana Pro · dirección de arte | Plano técnico (blueprint): fondo `#0146C1`, líneas `#E3E5FC`, sin cuadrícula | **Aceptada.** Comunica "planear con datos" y es coherente con el tema del grafo | Inspección de las 4 escenas; `corregir_color.py` reasigna cada píxel a los dos tonos exactos |
| 2 | Narrativa | Claude Code · guion de la landing | 4 escenas: problema (bodega) → modelo (grafo) → red (nodos y trayectos) → resultado (cobertura y ruta) | **Aceptada.** Recorre las features 1 a 3 sin prometer nada que la API no haga | Textos de cada escena en `plan-cadena.md`, sección 1 |
| 3 | Movimiento de cámara | Claude Code · arquitectura del recorrido | Opción B "vuelo por el mundo": clip de entrada por escena + conector aéreo entre escenas; solo escritorio 16:9 | **Aceptada.** El retroceso de cámara en cada costura se lee como "alejarse al mapa" en un mundo de maqueta | Decisiones 1 a 3 de `plan-cadena.md` |
| 4 | Escena 1 | Claude Code · ahorrar un clip | Reusar el conector de prueba 1→2 ya aprobado como clip de la escena 1 y no generar conector aéreo entre 1 y 2 (`connectors[0] = null`) | **Aceptada.** La entrada 2 arranca en el último fotograma real de ese conector, así que el paso es continuo | Diferencia media en la costura: 3,5/255 |
| 5 | Escenas 3 y 4 | Nano Banana Pro · generar imágenes | Generarlas con la escena 2 (y la 3 para la 4) como referencia para conservar losa, ángulo y grosor de línea | **Aceptada con desviación.** La escena 3 dibujó 4 puntos de recogida (no 3) y 2 calles cerradas (no 1); se aceptó porque no contradice el modelo y regenerar cuesta | Revisión visual: las 4 escenas comparten losa y ángulo, y la 4 es el mismo barrio de la 3 |
| 6 | Conector 2→3, primer intento | Gemini Omni · generar video | Conector con fotograma inicial y final reales | **Rechazado.** Arrancaba con otro encuadre: se vería un salto | Diferencia en la costura: 30/255 (una costura buena ronda 4) |
| 7 | Conector 2→3, segundo intento | Gemini Omni + OpenCV · reparar la costura | Prompt que exige quietud al inicio; el modelo mantuvo el encuadre pero redibujó los nodos (16/255) | **Modificada.** En vez de un tercer intento pagado, los 17 primeros fotogramas (cámara quieta) se funden con OpenCV desde el fotograma real de la entrada 2 (`fundir_inicio.py`) | Diferencia en la costura tras el fundido: 2,6/255 |
| 8 | Dónde montar la landing | Claude Code · integración con el proyecto | Página estática aparte en `frontend/landing/`, sin tocar `backend/api.py` | **Aceptada.** El backend sirve una lista cerrada de archivos y cambiarlo exige especificación; el botón "Ver la red en vivo" apunta a `http://127.0.0.1:8000` | Página servida con `python -m http.server 8090 --directory frontend/landing` |
| 9 | Codificación de los clips | Claude Code · scroll que salta a cualquier punto | H.264 `crf 20`, fotograma completo cada 8 (`-g 8`), sin audio; el motor descarga cada clip como Blob | **Aceptada.** El Blob permite saltar a cualquier punto aunque el servidor no soporte rangos | En el navegador, cada video reporta `seekable` = 10 s; total ≈ 44 MB |
| 10 | Verificación de costuras | Claude Code · QA | Capturas de pantalla antes y después de cada costura en el panel del navegador | **Rechazada.** El panel ejecuta `requestAnimationFrame` a 3 fps y las capturas salían reducidas; no servían para juzgar | Reemplazada por medición de píxeles entre el último y el primer fotograma de los clips finales: 3,5 · 2,6 · 4,8 · 6,9 · 3,9 /255 |
| 11 | Fluidez y tiempo de carga | Claude Code · diagnóstico | Causas: descarga completa de cada clip antes de verse, descargas en paralelo, seguimiento del scroll al 18 % por fotograma, `linger` que acelera cerca de las costuras, `-g 8`, recodificación intermedia `mp4v`. Mejoras: seguir el scroll más rápido, bajar `linger`, cargar en orden, `-g 2` con `crf 23`, o secuencia de imágenes en `<canvas>` | **Pendiente.** Solo diagnóstico; no se aplicó ningún cambio. Primero se probará en Chrome normal, fuera del panel | — |

## Encabezado que cambia de color según el scroll (2026-10-27)

Plan: `plan-transicion-header.md` (decisiones Q1 a Q14). Código: `frontend/src/components/header/Header.*`,
`frontend/src/hooks/useZonaLanding.ts`, `frontend/src/App.tsx`, `frontend/src/components/landing/InfoSections.*`.

| # | Decisión o pieza | Herramienta / objetivo de IA | Propuesta recibida | Acepté o rechacé y por qué | Cómo la verifiqué |
|---|------------------|------------------------------|--------------------|----------------------------|-------------------|
| 12 | Forma de la transición | Claude Code · diseño del componente | Un solo `Header` con prop `variant` (`dark`/`light`), colores en variables CSS y transición de 300 ms; `HeaderLight` queda intacto para otras funciones | **Aceptada.** Evita dos encabezados que se desincronicen y deja evolucionar cada modo por separado | `npm run build` y `npm run lint` sin errores |
| 13 | Cambio de logo | Claude Code · diseño del componente | Dos `<img>` superpuestos (blanco y negro) con fundido de opacidad | **Aceptada.** Cambiar el `src` produciría un parpadeo y no permitiría fundido | Capturas de ambos modos: [oscuro](capturas-header/modo-oscuro.jpg), [claro](capturas-header/modo-claro.jpg) |
| 14 | Punto de cambio y estado activo | Claude Code · hook `useZonaLanding` | `IntersectionObserver` sobre una franja de 1 px bajo la barra; devuelve `modo` e `indiceInfo` | **Aceptada con ajuste.** En el borde entre `Cifras` y `Comparación` ambas tocan la franja y se activaba la primera; ahora gana la de abajo (`findLastIndex`). El alto de la barra se mide y se publica como `--site-header-height` | En el navegador: al bajar pasa a claro, al subir vuelve a oscuro, `Cifras` y `Comparación` navegan y quedan resaltadas, y dentro del cierre ningún ítem queda activo |
| 15 | Ítems nuevos del nav | Claude Code · integración | `INFO_NAV_SECTIONS` exportado desde `InfoSections.tsx` | **Aceptada con una excepción de lint.** `react-refresh/only-export-components` no admite la exportación; se silenció en esa línea porque el plan fija la ubicación | `npm run lint` limpio |
| 16 | Movimiento reducido | Claude Code · accesibilidad | Transiciones a `0s` con `prefers-reduced-motion` y `scrollIntoView` con `behavior: 'auto'` | **Aceptada.** Coherente con el motor, `InfoSections` y `LandingClosing` | **No verificada en el navegador** (no se emuló el movimiento reducido); solo revisión del código |

Limitación de la prueba: el panel del navegador tiene ancho móvil (nav oculto por debajo de 860 px), así que los
ítems se probaron por código (`click()`), no con el ratón. El supuesto de que dentro de `LandingClosing` la barra
sigue clara sin ítem activo quedó implementado y verificado, pero sigue pendiente de confirmar con el equipo.

## Costo

≈ $6,3 en la API de Gemini: 2 imágenes y 6 videos (incluido el conector descartado de la fila 6), dentro de los
≈ $7 presupuestados en `plan-cadena.md`.
