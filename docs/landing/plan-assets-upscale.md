# Landing · Assets upscale (2K) — Plan técnico

> Alcance: reemplazar las escenas y los clips 720p del recorrido de `frontend/landing/` por
> versiones optimizadas de los masters reescalados (`escenas/upscale/`, `videos/upscale/`), con
> **más calidad y menos peso** que hoy. Estado: **implementado (U1–U7); resultados en el §10.**
> Pendientes: U0 (aprobación formal), U8 (bitácora) y las mediciones que requieren el portátil de la presentación o Render.
>
> Las decisiones (D1–D21) salieron de una sesión de preguntas el 2026-10-25; cada una indica su motivo
> y las alternativas descartadas.

## 1. Punto de partida (medido el 2026-10-25)

### 1.1 Lo que hay

| Asset | Hoy (en uso) | Masters upscale |
|-------|--------------|-----------------|
| Escenas (4) | JPEG 1280×720 · 96–118 KB c/u · **432 KB** | JPEG 2560×1440 · 696–769 KB c/u · **2,8 MB** |
| Clips (6) | H.264 1280×720 · 24 fps · GOP 8 · **43,7 MB** | H.264 2560×1440 · 24 fps · **GOP ≈ 60** · **74,9 MB** |

`conector_3_4_2K_upscaled.mp4` (12,9 MB) está por error en `escenas/upscale/`; se mueve a
`videos/upscale/` en la tarea U1.

### 1.2 Hallazgos que condicionan el plan

1. **Los masters no sirven tal cual para el scrub:** 4 keyframes en 240 fotogramas. Cada búsqueda
   (`currentTime`) decodifica desde el keyframe anterior; a 1440p el scrub se trabaría. Hay que
   re-codificar todo.
2. **El motor descarga cada clip completo como Blob** (`loadClip`) antes de mostrar movimiento: el
   peso del archivo es el tiempo de espera.
3. **Al cargar se piden dos clips en paralelo** (escena 1 y 2 caen en la ventana de 1,6 vh).
4. **Todas las escenas usan `loading="lazy"`**, incluida la primera, que es el elemento LCP.
5. **Los masters vienen etiquetados sRGB** (`transfer=iec61966-2-1`); los clips actuales, ≈ bt709.
   El fondo sigue cerca de `#0146C1` (1, 70, 191–196), pero conviene normalizar.
6. **Costuras** (diferencia media 0–255 entre último y primer fotograma, a 640 px):

   | Costura | Actual (720p) | Masters upscale |
   |---------|---------------|-----------------|
   | escena 1 → escena 2 | 2,18 | 1,70 |
   | escena 2 → conector 2-3 | 2,17 | 1,78 |
   | conector 2-3 → escena 3 | 3,33 | 2,99 |
   | escena 3 → conector 3-4 | 6,24 | 6,46 |
   | conector 3-4 → escena 4 | 2,25 | 1,78 |

   La costura escena 3 → conector 3-4 ya era alta en 720p: viene del clip original (ver D13).

### 1.3 Pruebas de codificación (`escena_4`, el clip más pesado; master 13,6 MB)

SSIM contra el master escalado a 1080p (1 = idéntico).

| Variante | Peso | SSIM |
|----------|------|------|
| Clip 720p actual (referencia) | 9,75 MB | 0,953 |
| H.264 1440p crf 25 · 24 fps · GOP 8 | 12,2 MB | — |
| H.264 1080p crf 23 · 24 fps · GOP 8 | 10,4 MB | 0,990 |
| VP9 1080p crf 34 · 24 fps · GOP 8 | 11,8 MB | — |
| AV1 1080p crf 34 · 24 fps · GOP 8 | 6,1 MB | 0,991 |
| AV1 1080p crf 34 · 16 fps · GOP 8 | 4,65 MB | 0,990 |
| **AV1 1080p crf 38 · 16 fps · GOP 8** | **3,62 MB** | **0,988** |
| H.264 1080p crf 23 · 16 fps · GOP 8 | 9,2 MB | 0,990 |
| H.264 720p crf 24 · 16 fps · GOP 4 | 5,9 MB | 0,972 |
| H.264 720p crf 27 · 16 fps · GOP 4 | 4,46 MB | 0,966 |
| `escena_1` · AV1 1080p crf 34 · 16 fps · GOP 8 | 2,2 MB | — |

- AV1 es el único códec que permite cumplir la meta de peso; H.264 casi no se beneficia de bajar fps.
- VP9 pesa más que H.264 con este contenido → descartado.
- `av1_nvenc` no está disponible (la RTX 3050 no codifica AV1); se usa libaom por software,
  ~3–4 min por clip. Las GPU del equipo (Intel UHD 12.ª gen y RTX 3050) **sí decodifican** AV1.

### 1.4 Pruebas de imagen (escenas)

| Ancho | JPEG q82 | **AVIF q60** |
|-------|----------|--------------|
| 2560 | 264–311 KB | 100–132 KB |
| 1920 | 167–196 KB | **65–85 KB** |
| 1280 | 90–106 KB | **40–51 KB** |

## 2. Restricciones y metas

| Tipo | Restricción |
|------|-------------|
| Proyecto | Frontend sin frameworks (`CLAUDE.md`): toda la lógica nueva va a mano en `scrub-engine.js`. |
| Proyecto | La optimización es herramienta de autoría (`scroll-assets/`), no backend: puede usar OpenCV/Pillow e `imageio-ffmpeg`, como los scripts de `costuras/`. |
| Usuario | Mínimo **16 fps**. |
| Técnica | El motor descarga Blobs completos (no depende de `Range`). |

| ID | Meta |
|----|------|
| M1 | Recorrido completo en escritorio con AV1 **≤ 20 MB** (hoy 43,7 MB). |
| M2 | **≤ 2 MB** descargados hasta que la escena 1 se mueve (hoy 3,7 MB). |
| M3 | Ningún clip con SSIM < 0,98 contra su master. |
| M4 | Scrub sin saltos en el portátil de la presentación (Chrome/Edge). |

## 3. Decisiones

| # | Decisión | Descartado | Motivo |
|---|----------|------------|--------|
| D1 | Público: portátil con Chrome/Edge en la presentación; móvil secundario pero funcional | Público general; prioridad móvil | Es donde se evalúa el proyecto; permite apostar por AV1 con respaldo. |
| D2 | Publicación en **Render static site** | GitHub Pages; servir desde el backend | Render permite `Cache-Control: immutable` de 1 año; GitHub Pages fija 10 min sin cabeceras propias; el backend tendría que servir archivos grandes con `Range`. |
| D3 | Metas M1/M2 aceptando pérdida no visible | ≤ 30 MB; sin tope | AV1 a 16 fps lo alcanza con SSIM ≈ 0,988. |
| D4 | **16 fps** | 24 fps; 12 fps | AV1: −24 % frente a 24 fps; el motor interpola la posición. 12 fps queda bajo el mínimo. |
| D5 | Video con scrub (motor actual optimizado) | Secuencia de imágenes en `<canvas>`; *streaming* con MSE | Mejor relación peso/esfuerzo. |
| D6 | Máximo **1080p**; los 1440p solo como fuente | Nivel 1440p; 900p | 1440p cuesta +20–70 % para una mejora que solo se ve en pantallas > 2400 px físicos. |
| D7 | crf **por presupuesto de cada clip** (34→40; `escena_1` ≤ 1,9 MB, resto ≈ 3,3 MB de media), rechazando SSIM < 0,98 | crf fijo | Garantiza M1/M2 y M3. |
| D8 | Escritorio sin AV1 por hardware: **H.264 720p crf ≈ 26 · 16 fps · GOP 8** (~25 MB) | H.264 1080p (~50 MB); AV1 por software | Único caso fuera de M1; AV1 por software puede trabar el scrub. |
| D9 | Móvil: **720p · GOP 4**; AV1 si hay hardware, si no H.264 crf ≈ 27 | Siempre H.264; cadena 9:16 nueva | Sin generar videos nuevos; GOP 4 abarata las búsquedas en teléfonos. |
| D10 | Pósteres **AVIF + respaldo JPEG**, 3 anchos | AVIF + WebP + JPEG | ~95 % de soporte AVIF; un formato menos; `.webp` no lo reconoce el servidor local de Windows. |
| D11 | Precarga: **escritorio** el visible y luego todo el recorrido de a uno; **móvil** solo el visible y el siguiente | Igual en todos | En escritorio cabe en ~20 MB y evita pósteres quietos al saltar; en móvil se protege el plan de datos. |
| D12 | Masters upscale **fuera del repo** (`.gitignore`, copia en Drive) | Git LFS; Git normal | Repositorio liviano; el script regenera todo. |
| D13 | Costura escena 3 → conector 3-4 (6,46) **se deja como está** | Fundirla con `costuras/fundir_inicio.py` | Ya existía en 720p; la cubre el fundido del motor. |
| D14 | Los cambios del motor **no** se llevan a la skill `scroll-world` | Sincronizar la skill | Alcance limitado a la landing. |
| D15 | Escena 1 *eager* + `fetchpriority="high"` + `<link rel="preload">` del AVIF | Mantener `lazy` | Es el elemento LCP. |
| D16 | Re-codificar a bt709; póster = fotograma 0 del clip codificado; verificación con OpenCV (±3 de `#0146C1`) | Pósteres del upscaler | Evita el salto póster → video y bordes contra el fondo. |
| D17 | Los assets 720p actuales **se conservan** en `frontend/landing/` | Borrarlos | Tener a mano la versión que ya funciona. |
| D18 | `scroll-assets/blueprint/` **se queda completo en el repo** (144 MB, ningún archivo > 20 MB) | Sacar crudos y `.png` | Decisión del equipo; no choca con los límites de GitHub. |
| D19 | Escritorio con `saveData` o `effectiveType` 2g/3g **se trata como móvil** | Tratarlo como escritorio | Respeta la preferencia del visitante. |
| D20 | Estas decisiones viven en este plan; la bitácora se actualiza más adelante | Solo documento externo | Forma de trabajo SDD. |
| D21 | Los assets 720p de D17 **solo se guardan**; el motor no los referencia | Usarlos como último respaldo | El H.264 720p nuevo es mejor (SSIM 0,966 vs 0,953) y más liviano (~25 vs 43,7 MB); no hay navegador que reproduzca uno y no el otro. |

## 4. Estrategia

```mermaid
graph TD
    M[Masters 2560×1440 · 24 fps<br/>videos/upscale · escenas/upscale] --> P[scroll-assets/blueprint/optimizar_upscale.py]
    P --> A[videos/1080/*.av1.mp4<br/>AV1 · 16 fps · GOP 8 · crf por presupuesto]
    P --> H[videos/720/*.h264.mp4<br/>H.264 crf≈26 · 16 fps · GOP 8]
    P --> MA[videos/720/*.movil.av1.mp4<br/>AV1 · 16 fps · GOP 4]
    P --> MH[videos/720/*.movil.h264.mp4<br/>H.264 crf≈27 · 16 fps · GOP 4]
    P --> I[escenas/opt/escena_N-{1280,1920,2560}.{avif,jpg}<br/>desde el fotograma 0 de cada clip]
    A & H & MA & MH & I --> E[scrub-engine.js<br/>elige variante · cola de descarga]
```

### 4.1 Qué recibe cada visitante

| Perfil | Detección | Video | Precarga | Póster |
|--------|-----------|-------|----------|--------|
| Escritorio con AV1 por hardware | `decodingInfo` → `smooth && powerEfficient` | AV1 1080p GOP 8 | Visible → resto del recorrido, de a uno | AVIF (`srcset` 1920/2560) |
| Escritorio sin AV1 por hardware | `decodingInfo` falla o no existe | H.264 720p GOP 8 | Igual | AVIF/JPEG |
| Móvil o ahorro de datos | `isMobile()`, `saveData`, `effectiveType` 2g/3g | AV1 720p GOP 4 si hay hardware; si no, H.264 720p GOP 4 | Solo visible + siguiente | AVIF (`srcset` 1280) |
| `prefers-reduced-motion` | — | Ninguno (como hoy) | — | AVIF/JPEG |

La consulta a `navigator.mediaCapabilities.decodingInfo()` se hace una vez al montar, con el
`contentType` real de cada variante (`video/mp4; codecs="av01.0.08M.08"` / `"avc1.640028"`), su
resolución, 16 fps y el bitrate medio.

### 4.2 Cola de descarga

- Un solo `fetch` activo a la vez. Prioridad: segmento visible → siguiente en la dirección del
  scroll → resto (solo escritorio, D11).
- `fetch(url, { priority: 'high' })` para el visible, `'low'` para la precarga.
- Al saltar con la navegación, la cola se reordena y la descarga de baja prioridad en curso se
  cancela con `AbortController`.

### 4.3 Caché en Render (D2)

- Servicio estático nuevo en el `render.yaml` (hoy solo existe en `archivos/render.yaml`, con el
  backend), publicando `frontend/landing/`.
- Cabeceras: `Cache-Control: public, max-age=31536000, immutable` para `/videos/*` y `/escenas/*`;
  `no-cache` para `index.html` y `scrub-engine.js`.
- Nombres versionados (`escena_1.v2.av1.mp4`) para que un cambio de asset invalide la caché.

## 5. Presupuesto (estimado; U2 lo confirma)

| Perfil | Clips | Pósteres | Hasta mover la escena 1 |
|--------|-------|----------|-------------------------|
| Escritorio AV1 | **≤ 20 MB** | ~0,3 MB | **≤ 2 MB** |
| Escritorio H.264 | ~25 MB | ~0,5 MB | ~2,5 MB |
| Móvil AV1 | ~10–12 MB¹ | ~0,2 MB | ~1,2 MB¹ |
| Móvil H.264 | ~25 MB | ~0,2 MB | ~2,3 MB |

¹ Extrapolado, sin medir. En móvil solo se descarga lo visible + el siguiente (D11).

## 6. Cambios por archivo

| Archivo | Cambio |
|---------|--------|
| `scroll-assets/blueprint/optimizar_upscale.py` (nuevo) | Genera las 4 variantes de video (16 fps, bt709, sin audio, `+faststart`), busca el crf por presupuesto (D7), extrae pósteres del fotograma 0, genera AVIF/JPEG con Pillow, mide SSIM y costuras, e imprime un informe. Omite lo ya generado. |
| `frontend/landing/videos/{1080,720}/`, `escenas/opt/` (nuevos) | Assets optimizados y versionados. |
| `frontend/landing/videos/*.mp4`, `escenas/*.jpg` | Se conservan sin referenciarse (D17, D21). |
| `frontend/landing/scrub-engine.js` | `clip`/`connectors` aceptan `{ av1, h264, movilAv1, movilH264 }`; `still` acepta `{ base, anchos }` y genera `<picture>`; detección de perfil (§4.1); cola (§4.2); escena 1 *eager*. Sigue aceptando cadenas simples. |
| `frontend/landing/index.html` | Nueva configuración de fuentes y `<link rel="preload">` de la escena 1. |
| `render.yaml` | Servicio estático con cabeceras (§4.3). |
| `.gitignore` | `frontend/landing/videos/upscale/` y `frontend/landing/escenas/upscale/` (D12). |

## 7. Criterios de aceptación

Chrome DevTools, red "Fast 4G", caché vacía.

| ID | Criterio |
|----|----------|
| CA-U1 | La escena 1 (póster) se pinta en < 1,5 s (LCP). |
| CA-U2 | Escritorio AV1: el recorrido completo descarga ≤ 20 MB y ≤ 2 MB antes de que la escena 1 se mueva. |
| CA-U3 | Scrub continuo sin fotogramas de `requestAnimationFrame` > 50 ms (panel Performance) en el portátil de la presentación. |
| CA-U4 | Con AV1 desactivado (forzado), se sirve H.264 720p y cumple CA-U3. |
| CA-U5 | Todos los clips tienen SSIM ≥ 0,98 (informe del script). |
| CA-U6 | A 360 px o con ahorro de datos se sirve la variante móvil y solo se descargan el visible y el siguiente (pestaña Network). |
| CA-U7 | Con `prefers-reduced-motion` no se descarga ningún clip. |
| CA-U8 | En Render, una segunda visita sirve videos y pósteres desde caché (sin descarga). |

## 8. Tareas (issues)

| # | Tarea | Criterios | Depende de | Rama |
|---|-------|-----------|------------|------|
| U0 | Aprobar este plan (PR de docs) | — | — | `docs/landing-upscale` |
| U1 | Mover `conector_3_4` a `videos/upscale/`; `.gitignore` de masters; copia de masters en Drive | — | U0 | `feature/landing-upscale` |
| U2 | `optimizar_upscale.py` y generación de todas las variantes | CA-U2, CA-U5 | U1 | ″ |
| U3 | Motor: fuentes múltiples, `<picture>`, escena 1 *eager* + preload | CA-U1 | U2 | ″ |
| U4 | Motor: detección de perfil con `mediaCapabilities`, `saveData` y `effectiveType` | CA-U4, CA-U6 | U3 | ″ |
| U5 | Motor: cola de descarga con prioridad y `AbortController` | CA-U2, CA-U3, CA-U6 | U3 | ″ |
| U6 | Verificación en navegador: escritorio AV1 y H.264 forzado, 360 px, ahorro de datos, *reduced motion*; capturas y tabla de pesos en `docs/img/` | CA-U1 a CA-U7 | U4, U5 | ″ |
| U7 | Servicio estático en `render.yaml` con cabeceras de caché y verificación | CA-U8 | U6 | ″ |
| U8 | Registrar propuestas aceptadas y rechazadas en `docs/ia/bitacora-landing.md` | — | cuando el equipo lo indique (D20) | ″ |

U4 y U5 se pueden hacer en paralelo cuando esté U3.

## 9. Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Algún clip no cumple su presupuesto con SSIM ≥ 0,98 | El script lo informa; se redistribuye el presupuesto entre clips antes de subir el crf. |
| AV1 por software en equipos sin hardware | `decodingInfo` exige `powerEfficient`; si no, H.264 (D8). |
| Muchos `<video>` abiertos agotan decodificadores en móvil | Liberar (`removeAttribute('src')` + `revokeObjectURL`) segmentos a más de 2 de distancia en móvil; medir en U6 antes de implementarlo. |
| Codificar AV1 es lento (~3–4 min/clip, 12 archivos AV1) | Costo único; el script omite lo ya generado. |
| Los botones de la landing apuntan a `http://127.0.0.1:8000` | Fuera de este alcance; al desplegar en Render hay que apuntar `URL_INTERFAZ` a la URL pública del backend. |
| Repositorio pesado por `scroll-assets/` (144 MB) y assets 720p conservados | Aceptado (D17, D18); ningún archivo supera los límites de GitHub. |

## 10. Resultados de la implementación (2026-10-25)

Generado con `scroll-assets/blueprint/optimizar_upscale.py` (informe completo en
`scroll-assets/blueprint/optimizar_upscale_informe.json`).

### 10.1 Pesos y calidad (SSIM contra el master reducido a los mismos fps y resolución)

| Clip | AV1 1080p (MB · crf · SSIM) | H.264 720p | Móvil AV1 | Móvil H.264 |
|------|-----------------------------|------------|-----------|-------------|
| escena_1 | 1,81 · 38 · 0,997 | 1,59 · 0,995 | 1,78 · 0,996 | 2,45 · 0,993 |
| escena_2 | 3,27 · 35 · 0,993 | 3,02 · 0,988 | 2,19 · 0,992 | 3,58 · 0,987 |
| conector_2_3 | 3,24 · 34 · 0,993 | 3,01 · 0,986 | 2,07 · 0,990 | 3,54 · 0,985 |
| escena_3 | 3,19 · 35 · 0,994 | 3,28 · 0,988 | 2,15 · 0,992 | 3,86 · 0,987 |
| conector_3_4 | 3,20 · 36 · 0,993 | 3,27 · 0,987 | 2,45 · 0,991 | 4,04 · 0,985 |
| escena_4 | 3,15 · **40** · 0,989 | 3,87 · 0,983 | 2,97 · 0,988 | 4,67 · 0,981 |
| **Total** | **17,9 MB** | **18,0 MB** | **13,6 MB** | **22,1 MB** |

Pósteres: AVIF q60 de 43–56 KB (1280), 70–89 KB (1920) y 113–128 KB (2560); JPEG de respaldo q82.
Costuras medidas sobre los clips AV1: 1,80 · 1,50 · 3,15 · 6,63 · 1,90 (la de escena 3 → conector 3-4 sigue siendo la alta, D13).

### 10.2 Metas y criterios

| ID | Resultado | Cómo se comprobó |
|----|-----------|------------------|
| M1 | **Cumple**: 17,9 MB (meta ≤ 20) | Suma del informe y `resource timing` en el navegador (17 867 KB). |
| M2 | **Cumple**: 1,81 MB de clip + 43 KB de póster antes de mover la escena 1 | Pestaña de red: un solo clip en vuelo al cargar. |
| M3 / CA-U5 | **Cumple**: SSIM mínimo 0,981 (cualquier variante) y 0,989 en AV1 | Informe del script. |
| CA-U2 | **Cumple** (AV1, escritorio): ≤ 20 MB, descarga secuencial de un clip a la vez | `resource timing`: cada clip empieza al terminar el anterior. |
| CA-U4 | **Cumple** en funcionalidad: con `?av1=0` se sirve H.264 720p (18,0 MB) | Navegador (Chromium del escritorio de Claude). El scrub continuo no se midió. |
| CA-U6 | **Cumple** a 375 px y con `?ahorro=1`: variante móvil AV1, póster de 1280 y solo escena 1 + 2; al saltar al final se pide solo la escena 4 | Pestaña de red. |
| CA-U7 | **Cumple**: con `prefers-reduced-motion` (emulado) no se pide ningún clip | Navegador. |
| Cola (§4.2) | **Cumple**: una descarga baja prioridad en vuelo se cancela con `AbortController` al saltar a otra escena y la visible va con `priority: high` | Prueba con `fetch` instrumentado. |
| CA-U1 | **No medido bajo "Fast 4G"**: el elemento LCP es el póster AVIF de la escena 1 (43 KB en 1280), con `preload` y `fetchpriority="high"`; en local se pinta a los 96 ms | No hay estrangulamiento de red en el navegador de pruebas. |
| CA-U3 | **Pendiente**: la ventana de pruebas estaba oculta (rAF a 1 fps) y no se pudo medir el scrub | Hay que correr el panel Performance en el portátil de la presentación (M4). |
| CA-U8 | **Pendiente**: hace falta desplegar en Render. En local, con las mismas cabeceras, la segunda visita sirvió clips y pósteres desde caché | Servidor de prueba con `Cache-Control: immutable`. |

### 10.3 Desviaciones y observaciones

1. **Color de fondo (D16):** el fondo de los pósteres sale ≈ (1, 70, 199), 6 de azul sobre `#0146C1` (193), fuera del
   ±3 pedido. No lo introduce la re-codificación: los masters ya decodifican a ≈ 198 (el JPEG que entregó el
   reescalador mide 192), y el clip 720p anterior da ≈ 197 en un navegador. En el navegador el póster (≈ 194) y el
   primer fotograma del video (≈ 196–198) quedan a 2–4 unidades, sin salto visible. Si el equipo exige ±3, hay que
   corregir los masters con OpenCV antes de codificar (decisión pendiente).
2. **escena_4** llegó al tope de crf (40) para entrar en su presupuesto de 3,3 MB; es el clip con menos margen (SSIM 0,989).
3. **Póster de 2560:** sale del fotograma 0 del master (con la misma conversión de color), no del clip de 1080p, que no
   tiene esa resolución.
4. **Los clips móviles H.264 (GOP 4)** pesan más que los de escritorio (22,1 vs 18,0 MB); en móvil solo se descargan
   dos, y el AV1 móvil (13,6 MB en total) es la variante preferida.
5. **Reintentos:** el motor reintenta hasta 3 veces un clip que falla por red (antes quedaba perdido toda la sesión).
6. **Servidor local:** `python -m http.server` responde en HTTP/1.0 y cierra la conexión con un RST que en Chromium
   corta las descargas grandes (`ERR_CONNECTION_RESET`). Con clips de varios MB conviene un servidor HTTP/1.1 (Render lo es).
7. **No implementado** (el plan lo dejaba para medir antes): liberar segmentos lejanos en móvil.
