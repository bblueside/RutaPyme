# Plan de la cadena completa — landing scroll-world de RutaPyme

Estado: **implementado** · 2026-10-24 · página en `frontend/landing/`
Método: skill `scroll-world` (sin cambios), backend Gemini (`gemini_cli.py`), color con OpenCV (`corregir_color.py`).

## 1. Historia (4 escenas)

La idea es la misma de siempre: **una pyme que decide "a ojo" pasa a modelar su red como un grafo
y obtiene cobertura y rutas de menor costo**. Se cuenta en cuatro tiempos: problema → modelo → red → resultado.
Las escenas 1 y 2 ya existen y están aprobadas (`scroll-assets/blueprint/`).

| # | Escena (lo que se dibuja) | Feature | Eyebrow | Titular | Cuerpo (1 línea) | Etiquetas | Estado |
|---|---|---|---|---|---|---|---|
| 1 | Bodega con puerta enrollable, camioneta y cajas; ruta punteada hasta la puerta | — (problema) | Red operativa de entregas | Todo empieza en la bodega. | Hoy los pedidos salen "a ojo" y a veces por conexiones cerradas. | Bodega · Pedidos | ✅ hecha |
| 2 | Oficina de planificación en corte: mapa-grafo en la pared con la ruta más corta resaltada | — (modelo) | Del instinto al modelo | Planear con datos, no a ojo. | RutaPyme modela la operación como un grafo propio, servido por una API REST. | Grafo · API REST | ✅ hecha |
| 3 | Barrio isométrico: bodega y puntos de recogida como nodos; calles como aristas con flechas de un solo sentido, grosor según costo y una calle cerrada con barrera y X | 1 · Red operativa | Puntos y trayectos | Cada lugar es un nodo; cada calle, un trayecto con dirección y costo. | Los trayectos cerrados quedan fuera de la red. | Dirigido · Ponderado | ✅ hecha |
| 4 | Mismo barrio: ondas desde la bodega marcan los nodos alcanzables; la ruta de menor costo resaltada en trazo grueso hasta un punto de recogida, donde la camioneta entrega la caja | 2 · Cobertura + 3 · Ruta de menor costo | Cobertura y ruta | Hasta dónde llego, y por dónde me cuesta menos. | Desde una bodega, RutaPyme muestra los destinos alcanzables y la ruta más barata. | Alcance · Menor costo | ✅ hecha |

CTA de la escena 4: **"Ver la red en vivo"** → abre la interfaz real (`http://127.0.0.1:8000`).
La feature 4 (operación demostrable) es justamente esa demo en vivo, así que el CTA la representa.

## 2. Cámara — **B · Vuelo por el mundo** desde la escena 2 · solo escritorio 16:9

**Arranque:** la escena 1 **no tiene clip de entrada**. Su clip es el **conector de prueba 1→2 ya aprobado**
(`blueprint/conector_1_2.mp4`): cámara fija, la bodega se redibuja trazo a trazo en la oficina.
Funciona como plano de presentación antes del vuelo.

Desde la escena 2, cada escena tiene un **clip de entrada** (la cámara baja desde la vista completa hasta el
detalle clave y la estructura se abre trazo a trazo) y un **conector aéreo** que sube, sobrevuela el mundo
blueprint y llega a la siguiente escena.

| Escena | Clip de la escena: foco del movimiento |
|---|---|
| 1 Bodega | ✅ conector de prueba: la bodega se redibuja en la oficina (cámara fija) |
| 2 Oficina | se acerca al mapa-grafo de la pared y a la ruta resaltada |
| 3 Red | recorre una flecha de un solo sentido hasta la calle cerrada con la X |
| 4 Cobertura y ruta | las ondas se expanden desde la bodega y la cámara sigue la ruta gruesa hasta la entrega (CTA) |

### Cadena (6 clips: 1 hecho + 5 nuevos)

```
clip escena 1 : conector_1_2.mp4  (escena_1.png → escena_2.png)              ✅ hecho
entrada_2     : inicio = ÚLTIMO fotograma real de conector_1_2   (no la imagen escena_2.png)
entrada_3     : inicio = escena_3.png (imagen corregida)
entrada_4     : inicio = escena_4.png (imagen corregida)
conector_2_3  : inicio = ÚLTIMO fotograma real de entrada_2   fin = PRIMER fotograma real de entrada_3
conector_3_4  : inicio = ÚLTIMO fotograma real de entrada_3   fin = PRIMER fotograma real de entrada_4
```

- **Costura 1→2:** `entrada_2` arranca en el último fotograma real del conector de prueba, así que el paso es
  idéntico sin conector aéreo. En el motor: `connectors[0] = null` (admitido; hace un fundido directo).
- Ambos extremos de cada conector aéreo son fotogramas **reales** de las entradas vecinas, nunca las imágenes.
- Las escenas 3 y 4 comparten el mismo barrio: el conector 3→4 es corto en distancia y se lee como
  "la misma red, ahora calculada".
- Cada clip pasa por `corregir_color.py` **antes** de extraer fotogramas de costura.
- Riesgo propio de B: el acercamiento puede engrosar o desenfocar las líneas finas. Se revisa la entrada 2
  antes de lanzar las demás.

### Configuración prevista del motor

```js
sections:   [ {clip:'conector_1_2.mp4'}, {clip:'entrada_2.mp4'}, {clip:'entrada_3.mp4'}, {clip:'entrada_4.mp4', cta:…} ],
connectors: [ null, 'conector_2_3.mp4', 'conector_3_4.mp4' ],
```

## 3. Pasos de producción

1. Generar escenas 3 y 4 con `--ref escena_2.png` (misma losa, ángulo y grosor de línea). La escena 4 usa
   además `--ref escena_3.png` para que sea el mismo barrio. Corregirlas con OpenCV.
2. Revisar las 4 juntas como un mundo coherente; regenerar la que desentone.
3. Extraer el último fotograma real de `conector_1_2.mp4` y generar **entrada_2** sola desde él; corregirla y
   revisarla (líneas nítidas, estructura abierta). Si pasa, generar entradas 3 y 4 en paralelo y corregirlas.
4. Extraer último y primer fotograma de cada entrada y generar los 2 conectores aéreos; corregirlos y medir costuras.
5. Recodificar los 6 clips a H.264 (`-g 8`, `crf 20`, sin audio, `faststart`) con el ffmpeg de `imageio_ffmpeg`.
6. Montar la página con `scrub-engine.js` dentro de `frontend/` (HTML + CSS + JS sin frameworks), `--sw-bg: #0146C1`.
7. QA de costuras en el navegador: capturas antes y después de cada costura, consola sin errores, `seekable` > 0.

## 4. Presupuesto (precios verificados 2026-10-24)

| Concepto | Cantidad | Precio | Subtotal |
|---|---|---|---|
| Escenas nuevas (Nano Banana Pro 2K) | 2 | $0.134 | $0.27 |
| Conector de prueba 1→2 (reutilizado) | 1 | ya pagado | $0 |
| Clips de entrada 2–4 (Gemini Omni 720p, 10 s) | 3 | ~$1.00 | ~$3.00 |
| Conectores aéreos 2→3 y 3→4 (Gemini Omni 720p, 10 s) | 2 | ~$1.00 | ~$2.00 |
| Margen de repeticiones (~30 %) | — | — | ~$1.50 |
| **Total, solo escritorio** | | | **≈ $7** |

Ya gastado en pruebas: ≈ $3.30.
Omni solo publica precio para 720p; 1080p y 4k son reescalados sin precio confirmado, así que el plan usa 720p.

## 5. Decisiones

1. ✅ Cámara: **B · Vuelo por el mundo** desde la escena 2; la escena 1 usa el **conector de prueba** aprobado.
2. ✅ **Solo escritorio** (16:9). El motor sigue funcionando en celulares con el video horizontal.
3. ✅ Narrativa en **4 escenas**.
4. ✅ Escenas 3 y 4 generadas con los textos del plan.
5. ✅ Gasto aprobado al pedir la implementación (real ≈ $6.3: 2 imágenes + 6 videos, 1 reintento).

## 6. Prompts de escenas 3 y 4 (preámbulo idéntico en ambas)

Preámbulo: *"Use the reference image as the exact STYLE: technical blueprint line drawing, one flat solid
royal-blue background (#0146C1) with NO grid, NO border, NO texture, NO gradient, and every line drawn only
in pale lavender-white (#E3E5FC), thin crisp uniform linework, dashed hidden edges, hatching for shadows,
dimension lines with arrows, leader lines ending in empty callout circles. Same isometric camera angle and
same square base slab size and position as the reference. Absolutely no text, no letters, no numbers, no people."*

- **3:** isometric neighborhood blocks on the slab; the warehouse and three pickup points drawn as small
  buildings topped by empty node circles; streets between them drawn as clean edges joining the nodes, with
  one-way arrowheads along each street, line thickness varying by cost, and one street blocked by a barrier
  with a large X and a dashed outline.
- **4 (refs: escena 3 + escena 2):** the SAME neighborhood and streets as the first reference; concentric
  dashed rings expanding from the warehouse node, reachable nodes drawn solid with a filled dot, unreachable
  nodes dashed and hollow; one path from the warehouse to a pickup point drawn as a thick solid line with node
  dots; the delivery van arriving at that pickup point and a parcel handed over at its counter.

## 7. Resultado (2026-10-24)

- Costuras medidas en los clips finales (diferencia media, /255): 1→2 3.5 · 2→conector 2.6 · conector→3 4.8 ·
  3→conector 6.9 · conector→4 3.9.
- `conector_2_3` se generó dos veces: la 1.ª arrancaba desencuadrada (30/255). La 2.ª arranca con el mismo encuadre,
  pero redibuja los nodos (16/255), así que sus 17 primeros fotogramas (cámara quieta) se funden con OpenCV
  desde el último fotograma real de `entrada_2` (`costuras/fundir_inicio.py`).
- Página: `frontend/landing/` (motor `scrub-engine.js`, 6 clips H.264 ≈ 44 MB, pósters = primer fotograma real).
  Servir con `python -m http.server 8090 --directory frontend/landing`; el CTA abre `http://127.0.0.1:8000`.
