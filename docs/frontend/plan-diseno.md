# Panel React — Plan de diseño de interfaces

> Complemento de [`plan.md`](plan.md). Aquel plan define la arquitectura, los datos y los
> componentes, y a propósito **no define composición visual**. Este plan cubre solo eso: cómo se ve
> y se organiza cada pantalla. No agrega endpoints, componentes de lógica ni dependencias.
> Se versiona en `feature_2/frontend` junto con los bocetos (paso 1 de la sección 9).

## 1. Alcance

Incluye: lenguaje visual (forma, espaciado, tipografía aplicada), la estructura de la página del
panel, la composición de cada vista, el aspecto y los estados de cada componente, el comportamiento
en pantallas pequeñas y la accesibilidad visual.

No incluye: lógica, llamadas a la API, rutas ni contextos (todo eso está en `plan.md`); modo oscuro;
la landing (`/`), salvo comprobar que no cambia.

Referencia visual: los **bocetos aprobados** de [`bocetos/`](bocetos/) (sección 10), con los
ajustes cerrados de la sección 11. Sustituyen la propuesta en pen.dev.

## 1.1 Contexto del proyecto

**RutaPyme** es un microproducto académico (Matemáticas para la Informática Avanzada, Equipo 7).
Representa a una pyme que coordina entregas entre bodegas, barrios y puntos de recogida, y que hoy
decide "a ojo" y a veces envía pedidos por conexiones cerradas. El sistema modela su red como un
**grafo dirigido y ponderado** propio, lo expone con una API REST en Python y lo muestra en este panel.

| Feature | Qué responde | Vistas del panel |
|---------|--------------|------------------|
| 1 · Red operativa inicial | ¿Qué puntos y trayectos tengo? | Resumen, Puntos, Conexiones |
| 2 · Cobertura de entregas | ¿Qué destinos alcanzo desde una bodega? (recorrido BFS por capas) | Cobertura |
| 3 · Ruta de menor costo | (futura) Ruta más barata entre dos puntos | No se diseña ahora; dejar sitio en la navegación |

**Usuario:** el despachador de la pyme. Trabaja en escritorio (≥ 1280px) la mayor parte del tiempo y
consulta desde el celular en ruta. Conoce los puntos por su identificador, no por coordenadas: el panel
no muestra mapas. **Público secundario:** el jurado del pitch, que ve la vista Cobertura proyectada.

### Glosario (usar estas palabras en la interfaz)

| Término | Significado | Cómo se muestra |
|---------|-------------|-----------------|
| Punto | Nodo de la red | Identificador en monoespaciada + insignia de tipo |
| Tipo de punto | `bodega`, `barrio`, `punto_recogida` | Etiquetas "Bodega", "Barrio", "Punto de recogida"; colores `#E4572E`, `#2E86AB`, `#3BB273` (los mismos de la imagen de NetworkX) |
| Identificador | Mayúsculas, números, `-` o `_`, sin espacios; prefijo según tipo (`BOD-`, `BAR-`, `PR-`) | `BOD-CENTRO` |
| Conexión / trayecto | Arista dirigida origen → destino. A → B **no** crea B → A | `BOD-CENTRO → BAR-NORTE` |
| Costo | Minutos del trayecto (número, admite decimales) | `12 min`, alineado a la derecha |
| Salidas | Conexiones que parten de un punto | Contador en tabla y chips en la consulta |
| Alcanzable | Hay al menos un camino desde el origen | Verde + `✓` |
| Capa | Distancia en número de trayectos desde el origen (capa 0 = origen) | "Capa N" |
| Camino de evidencia | Camino con menos trayectos hasta el destino. **No** es la ruta más barata | Chips grandes unidos por `→` + nota |

### Datos de ejemplo para los bocetos

Usar la red sintética real de `datos/red_ejemplo.json` (7 puntos, 10 conexiones), que es la que carga
"Cargar ejemplo". Nunca nombres de personas ni direcciones reales.

| Punto | Tipo | Salidas |
|-------|------|---------|
| BOD-CENTRO | Bodega | → BAR-NORTE 12 · → BAR-SUR 8 · → PR-ESTACION 30 |
| BAR-NORTE | Barrio | → BOD-CENTRO 15 · → PR-PARQUE 7 |
| BAR-SUR | Barrio | → PR-ESTACION 10 · → BAR-ORIENTE 6 |
| BAR-ORIENTE | Barrio | → BAR-SUR 11 |
| PR-PARQUE | Punto de recogida | → BAR-ORIENTE 9 |
| PR-ESTACION | Punto de recogida | (ninguna) |
| PR-LAGUNA | Punto de recogida | → BAR-ORIENTE 14 |

Contadores: 7 puntos · 10 conexiones · 1 bodega · 3 barrios · 3 puntos de recogida.

Cobertura desde **BOD-CENTRO** (lo que devuelve la API):

| Capa | Puntos | Llega desde |
|------|--------|-------------|
| 0 | BOD-CENTRO | — |
| 1 | BAR-NORTE, BAR-SUR, PR-ESTACION | BOD-CENTRO |
| 2 | PR-PARQUE, BAR-ORIENTE | BAR-NORTE, BAR-SUR |

- Veredicto: "Desde BOD-CENTRO se pueden cubrir 5 de 6 puntos".
- No alcanzable: PR-LAGUNA, motivo "sin entradas" (ninguna conexión termina en él).
- Orden de visita: BOD-CENTRO → BAR-NORTE → BAR-SUR → PR-ESTACION → PR-PARQUE → BAR-ORIENTE (6 pasos de traza).
- BOD-CENTRO → BAR-ORIENTE: alcanzable, camino BOD-CENTRO → BAR-SUR → BAR-ORIENTE (2 trayectos).
- BOD-CENTRO → PR-LAGUNA: no alcanzable, con explicación y la lista de lo que sí se cubre.

### Mensajes reales de la API (para estados de error)

Los errores llegan como `{"error": {"codigo", "mensaje"}}` y el panel muestra el `mensaje` tal cual:

| Situación | Ejemplo de mensaje |
|-----------|--------------------|
| Identificador mal escrito (400) | "…números, '-' o '_', sin espacios. Ejemplo: BOD-CENTRO." |
| Costo no numérico (400) | "El costo debe ser un número (por ejemplo 12 o 7.5), no 'doce'." |
| Punto o conexión repetida (409) | El punto ya existe |
| Punto inexistente (404) | El punto no existe en la red |
| Red vacía al dibujar o calcular (503) | "La red está vacía: registre puntos y conexiones (o cargue la red de ejemplo)…" |
| Acción correcta | "Red de ejemplo cargada." (toast) |

## 2. Principios

1. **Herramienta de trabajo, no landing.** El despachador consulta y registra datos: densidad media,
   sin escenas, sin videos, sin animaciones decorativas. La marca se nota en color y tipografía.
2. **Continuidad con la landing.** Mismo `HeaderLight`, mismos azules, mismas fuentes y la misma
   forma de tarjeta (`.ls-card`: radio grande, borde suave, sombra azulada).
3. **El grafo es el protagonista.** En Resumen y en Cobertura la imagen de NetworkX ocupa la mayor
   superficie; los datos la rodean.
4. **El veredicto primero.** En cobertura, lo primero que se lee es "Sí / No" con el mensaje de la
   API; el detalle (capas, traza) va después y la traza está plegada.
5. **Color con significado.** El color de tipo de punto (bodega, barrio, recogida) es el mismo en
   insignias, contadores e imagen; verde = alcanzable / éxito; rojo = no alcanzable / error.
6. **Una pantalla, una tarea.** Cada vista resuelve una tarea; las acciones globales (ejemplo,
   vaciar) viven solo en el encabezado.

## 3. Lenguaje visual

### 3.1 Tokens de forma y espacio

Los colores y fuentes ya están en `styles/panel-tokens.css` (paso 4 de `plan.md`). Este plan agrega
un archivo hermano, **`styles/panel-shape.css`**, con una sola responsabilidad: forma y espacio.

| Token | Valor | Uso |
|-------|-------|-----|
| `--panel-space-1` … `--panel-space-6` | 4, 8, 12, 16, 24, 40 px | Escala única de márgenes y separaciones |
| `--panel-radius` | 14px | Tarjetas |
| `--panel-radius-sm` | 8px | Campos, botones, pestañas, tablas, avisos |
| `--panel-radius-xs` | 6px | Insignias y chips |
| `--panel-control-height` | 36px | Alto de botones y campos (40px de área táctil en móvil) |
| `--panel-border` | `#E2E5F0` | Borde de tarjetas, tablas y separadores |
| `--panel-input` | `#D9DDEB` | Borde de campos y botón secundario |
| `--panel-muted` | `#F3F4FA` | Fondo de pestañas, bloques internos y esqueleto |
| `--panel-shadow` | `0 1px 2px rgb(11 22 64 / .05)` | Tarjetas, botones y campos (sombra mínima) |
| `--panel-shadow-raised` | sombra más profunda | Diálogo y toasts |
| `--panel-content-width` | 1200px | Ancho máximo del contenido |
| `--panel-header-height` | 66px | Compensa que `HeaderLight` mide 0 de alto |

### 3.2 Tipografía aplicada

| Rol | Fuente | Peso / tamaño |
|-----|--------|---------------|
| Título de vista | Inter Tight | 700 · `clamp(1.5rem, 2.4vw, 2rem)` · `letter-spacing: -0.02em` |
| Eyebrow de vista (p. ej. "FEATURE 2") | Inter Tight | 700 · .74rem · mayúsculas · `letter-spacing: .16em` · color acento |
| Título de tarjeta | Inter Tight | 600 · 1.05rem |
| Texto | Manrope | 400–500 · .95rem · `line-height: 1.55` |
| Etiqueta de campo | Manrope | 600 · .82rem |
| Cifra de contador | Inter Tight | 700 · `clamp(1.8rem, 3vw, 2.4rem)` · `tabular-nums` |
| Identificador de punto | Monoespaciada | 600 · .85rem (siempre que aparezca un id) |
| Cabecera de tabla | Manrope | 500 · .8rem · sin mayúsculas · color tinta suave |
| Botón, pestaña | Manrope | 500 · .875rem |

### 3.1.1 Estilo de los controles

Controles compactos de borde fino y sombra mínima: superficies blancas sobre fondo
blanco, separadas por borde `--panel-border` más que por sombra. El azul `#0146C1` es el único color de
acción; los colores de tipo y el verde / rojo solo comunican significado. La marca de la landing se
conserva en el logo, las fuentes y el azul.

### 3.3 Iconografía

Sin biblioteca de íconos. Solo símbolos tipográficos o SVG en línea de un trazo (como el logo de la
landing): `→` para trayectos, `●` para estado de la API, `✓` / `✕` en el veredicto, `▸` en la traza
plegable. Cada símbolo decorativo lleva `aria-hidden="true"`.

## 4. Estructura de la página

El panel aparece al pulsar **"Probar el optimizador"** en la landing (`INTERFACE_ROUTE = '/app'`).
Boceto de referencia: [`bocetos/resumen.png`](bocetos/resumen.png).

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [logo]  ( Resumen · Puntos · Conexiones · Cobertura )   ● API en línea  [Cargar red de ejemplo] [Vaciar red] │  ← HeaderLight
├──────────────────────────────────────────────────────────────────────────────────┤
│  Título de la vista                                       dato de la vista (meta) │  ← ViewHeader
│  frase de apoyo corta                                                             │
│                                                                                   │
│  ┌──── contenido de la vista (tarjetas) ───────────────────────────────────────┐  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
                                                              [ toasts apilados ]  ← abajo a la derecha
```

- Fondo de página `#F6F7FE`; tarjetas blancas con borde `--panel-border`.
- Contenido centrado, `width: min(100% - 32px, var(--panel-content-width))`, con
  `padding-top: calc(var(--panel-header-height) + var(--panel-space-5))`.
- **Encabezado (`HeaderLight`)**: se mantiene el logo (`logo_blue.png`, enlaza a `/`) y **no** se
  agrega ninguna etiqueta junto a él. La navegación son cuatro pestañas por ruta (`NavLink`); la
  activa lleva fondo `#E3E5FC` y texto `#0146C1`. No hay ítem para la Feature 3 ni CTA. En `actions`:
  indicador de salud ("API en línea" verde / "API sin conexión" rojo + botón "Reintentar"),
  "Cargar red de ejemplo" (secundario) y "Vaciar red" (peligro, texto rojo con borde rojo tenue).
  Con la API caída, los dos botones se ven deshabilitados ([`bocetos/api-caida.png`](bocetos/api-caida.png)).
- **Cabecera de vista (`ViewHeader`)**: título + frase a la izquierda y un dato `meta` a la derecha,
  sin eyebrow. El dato se calcula en el cliente:

  | Vista | Título | Frase | Meta |
  |-------|--------|-------|------|
  | Resumen | Resumen de la red | Estado actual de la red de distribución, puntos registrados y cobertura de entregas. | "Actualizado hace X" (tiempo desde el último `refresh()`) |
  | Puntos | Puntos | Registra puntos de la red y consulta sus salidas. | "N puntos en la red" |
  | Conexiones | Conexiones | Enlaza dos puntos de la red con un costo de transporte. | "N conexiones registradas" |
  | Cobertura (solo origen) | Cobertura de entregas | Qué puntos quedan cubiertos desde un origen y cuáles no. | Chip copiable con la URL de la consulta |
  | Cobertura (origen y destino) | Verificar una ruta | Comprueba si un destino es alcanzable desde un origen y con qué camino. | Chip copiable con la URL de la consulta |

- **Etiqueta de endpoint**: cada tarjeta que consume la API muestra en su esquina superior derecha
  (o bajo el título) el endpoint en monoespaciada suave, p. ej. `GET /api/red`. Es texto
  informativo, no interactivo.
- **Chip de URL (Cobertura)**: botón con ícono de enlace y la ruta `/app/coverage?from=…&to=…`; al
  pulsarlo copia la URL completa al portapapeles y muestra el toast "Enlace copiado" (apoya CA-P10).

### 4.1 Imagen de la red "en vivo"

La imagen siempre es el PNG que dibuja NetworkX en la API (`GraphImage`); los bocetos solo la
representan. Funciona igual que hoy en `frontend/legacy/app.js`: después de **cada** acción hecha en
el panel (registrar punto, registrar conexión, cargar ejemplo, vaciar) `NetworkProvider.refresh()`
sube `version` y `GraphImage` vuelve a pedir `/api/red/imagen?v=<version>`. Un punto nuevo aparece en
el diagrama aunque todavía no tenga conexiones, y una conexión nueva aparece como arista apenas la API
responde 201. No hay sondeo: los cambios hechos fuera del panel (otra pestaña, `curl`) se ven al
pulsar cualquier acción o al recargar.

La imagen no resalta la última arista ni el destino de una ruta (la API no lo permite).

## 5. Composición de cada vista

Rejilla base de las vistas: 12 columnas con separación `--panel-space-4`. Debajo de 960px todo
pasa a una columna (sección 7). Los bocetos de [`bocetos/`](bocetos/) son la referencia aprobada,
con los ajustes de la sección 11.

Todos los datos y textos salen de la API real (red de ejemplo con `BOD-CENTRO`, `BAR-NORTE`…). Los
identificadores y cifras de los bocetos (`BO-01`, 12 puntos, 18 conexiones) son ilustrativos.
En la interfaz se dice **"trayectos"**, no "saltos" (glosario de la sección 1.1).

### 5.1 Resumen (`/app`) — [`bocetos/resumen.png`](bocetos/resumen.png)

```
┌ Puntos ┐┌ Conexiones ┐┌ Bodegas ┐┌ Barrios ┐┌ Puntos de recogida ┐   ← 5 contadores en fila
┌─ Lista de adyacencia (5 col) ─┐┌──────────── Imagen de la red (7 col) ────────────┐
│ ● BOD-CENTRO → BAR-NORTE (12) ││ Generada por la API · GET /api/red/imagen         │
│ ● BAR-NORTE  → …              ││ ● Bodega ● Barrio ● Punto de recogida             │
│ …                             ││                imagen NetworkX                    │
└───────────────────────────────┘└───────────────────────────────────────────────────┘
```

- Contadores: tarjeta baja con etiqueta arriba a la izquierda, punto de color arriba a la derecha
  (acento en puntos, tinta suave en conexiones, color del tipo en el resto), cifra grande y una
  línea de apoyo debajo ("Total en la red", "Arcos registrados", "Orígenes de carga",
  "Zonas servidas", "Destinos de entrega").
- Lista de adyacencia: una línea por punto con su punto de color, el id en monoespaciada 600 y sus
  salidas `DESTINO (costo)` separadas por `·`. Desplazamiento vertical propio si es larga.
- Imagen: subtítulo "Generada por la API · GET /api/red/imagen" y leyenda de los tres tipos.
- **Imagen no disponible (503)** — [`bocetos/resumen-503.png`](bocetos/resumen-503.png): el marco de
  la imagen muestra un ícono en círculo ámbar tenue, el título "No se pudo generar la imagen de la
  red", el `mensaje` de la API con el código HTTP y el `codigo` en monoespaciada.
- **Red vacía**: los contadores en 0, la lista con "Aún no hay puntos registrados" y la tarjeta de la
  imagen con el estado vacío "La red está vacía" + botón "Cargar red de ejemplo".

### 5.2 Puntos (`/app/points`) — [`bocetos/puntos.png`](bocetos/puntos.png)

```
┌──────────────── Imagen de la red (12 col) · se redibuja con cada punto ───────────────┐
└───────────────────────────────────────────────────────────────────────────────────────┘
┌─ Registrar punto (5 col) ─┐┌──────────── Puntos registrados (7 col) ─────────────┐
│ POST /api/puntos           ││ GET /api/puntos                                      │
│ Identificador [        ]   ││ Identificador   Tipo                 Salidas         │
│ Tipo de punto [▾       ]   ││ BOD-CENTRO      ● Bodega                  3          │
│ [+ Registrar punto]        ││ …                                                    │
│ error en línea (409/400)   │└──────────────────────────────────────────────────────┘
└────────────────────────────┘
┌─ Consultar punto (5 col) ─┐
│ GET /api/puntos/{id}       │
│ Identificador [        ]   │
│ [Consultar]  (secundario)  │
│ resultado                  │
└────────────────────────────┘
```

- **Imagen en vivo arriba** (no está en el boceto; decisión Q17): la misma tarjeta que en
  Conexiones (5.3), a todo el ancho, para que el punto recién registrado se vea en el diagrama.
- La tabla tiene tres columnas: Identificador, Tipo (punto de color + etiqueta) y Salidas. **Sin**
  columna "Estado".
- Fila recién creada: fondo `--panel-accent-soft` durante 2s.
- Resultado de la consulta: recuadro interno con `ID · Tipo` en monoespaciada 600, una línea por
  salida `● DESTINO  costo N` y el pie "N salidas registradas"; sin salidas, texto suave "No tiene
  salidas registradas". Errores 404/400 en línea.

### 5.3 Conexiones (`/app/connections`) — [`bocetos/conexiones.png`](bocetos/conexiones.png)

```
┌──────────────── Imagen de la red en vivo (12 col) ────────────────────────────────────┐
│ GET /api/red/imagen · se redibuja con cada conexión que registras                      │
│                               imagen NetworkX                                          │
│ ● Bodega ● Barrio ● Punto de recogida                                                  │
└───────────────────────────────────────────────────────────────────────────────────────┘
┌─ Registrar conexión (5 col) ─┐┌──────────── Conexiones registradas (7 col) ─────────┐
│ POST /api/conexiones          ││ GET /api/conexiones                                  │
│ Origen [      ]               ││ Origen      →   Destino       Costo                  │
│ Destino [     ]               ││ BOD-CENTRO  →   BAR-NORTE       12                   │
│ Costo (minutos) [    ]        ││ …                                                    │
│ ⓘ El costo debe ser mayor que 0.                                                     │
│ [Registrar conexión]          │└──────────────────────────────────────────────────────┘
└───────────────────────────────┘
┌─ Sugerencia (5 col) ─────────┐
└──────────────────────────────┘
```

- Imagen a todo el ancho con el subtítulo del boceto. **Sin** etiqueta "En vivo" y **sin** leyenda
  ni resaltado de "Última conexión registrada"; la arista nueva aparece al redibujar (sección 4.1).
- Origen y destino con `PointDatalist` (autocompletado con los ids de la red).
- La tabla tiene tres columnas: Origen → Destino y Costo (alineado a la derecha, `tabular-nums`).
  **Sin** columna "Tipo de arco".
- **Sugerencia**: aviso azul tenue con texto fijo que se ajusta al ancho: "Los identificadores se
  autocompletan con los puntos de la red. ¿Red vacía? Usa «Cargar red de ejemplo»."

### 5.4 Cobertura (`/app/coverage`)

Dos variantes según la URL: solo `from` (alcance) o `from` y `to` (ruta). El formulario es el mismo.

#### 5.4.1 Alcance desde un origen — [`bocetos/cobertura-alcance.png`](bocetos/cobertura-alcance.png)

```
┌─ Consultar cobertura (4 col) ─┐┌──────── Resultado de la cobertura (8 col) ─────────────┐
│ GET /api/cobertura/{origen}    ││ ✓ mensaje de la API                                    │
│ Origen  obligatorio [      ]   ││ [N Alcanzables] [N No alcanzables] [N Trayectos máx.] [N Capas] │
│ Destino (opcional) [      ]    │└────────────────────────────────────────────────────────┘
│ [Consultar] [Limpiar]          │┌──────── Imagen resaltada desde el origen (8 col) ──────┐
└────────────────────────────────┘│ GET /api/red/imagen/cobertura/{origen}                 │
┌─ Capas del recorrido (4 col) ─┐│                 imagen NetworkX                         │
│ [0] BOD-CENTRO                 │└────────────────────────────────────────────────────────┘
│ [1] BAR-NORTE · BAR-SUR · …    │┌─ Alcanzables (5 col) ──────────┐┌─ No alcanzables (3 col) ─┐
│ [2] …                          ││ ● BAR-NORTE 1 trayecto  llega desde BOD-CENTRO ││ PR-LAGUNA  motivo │
└────────────────────────────────┘└────────────────────────────────┘└──────────────────────────┘
                                  ┌─ Orden de visita (4 col) ──────┐┌─ Traza del recorrido (4 col) ┐
                                  │ chips unidos por ›             ││ 1  paso de la traza          │
                                  └────────────────────────────────┘└──────────────────────────────┘
```

- **Veredicto**: aviso de ancho completo con fondo verde tenue y `✓` (hay cobertura) o rojo tenue y
  `✕` (cero alcanzables); el texto es el `mensaje` de la API.
- **Cifras**: cuatro recuadros (Alcanzables, No alcanzables, Trayectos máx. = capa más alta,
  Capas = número de capas), calculados a partir de la respuesta.
- **Capas**: una fila por capa con el número en una insignia azul tenue y los ids unidos por `·`.
- **No alcanzables**: id en monoespaciada y debajo su motivo tal como lo devuelve la API.
- **Traza**: **abierta**, en un recuadro con pasos numerados. Si hay más de 10 pasos se muestran los
  10 primeros y un botón "Ver todos".
- `InlineError` "Indique el punto de origen" **solo** cuando se envía el formulario con el origen
  vacío (CA-P12); el boceto lo muestra con el campo lleno por error.

#### 5.4.2 Ruta origen → destino — [`bocetos/cobertura-ruta.png`](bocetos/cobertura-ruta.png)

```
┌─ Origen y destino (4 col) ─┐┌──────── Veredicto de la ruta (8 col) ───────────────────────┐
│ GET /api/cobertura/{o}/{d}  ││ ✓ mensaje de la API                                         │
│ Origen  obligatorio [    ]  ││ Camino de evidencia: [BOD-CENTRO] › [BAR-SUR] › [BAR-ORIENTE] │
│ Destino obligatorio [    ]  ││ [Trayectos N]  [Nota: Ruta con menos trayectos]             │
│ [Consultar] [Limpiar]       │└─────────────────────────────────────────────────────────────┘
└─────────────────────────────┘┌──────── Imagen de la ruta (8 col) ──────────────────────────┐
                               │ imagen de cobertura desde el origen                          │
                               └─────────────────────────────────────────────────────────────┘
                               ┌─ Alcanzables desde ORIGEN (5 col) ─┐┌─ Nota de la API (3 col) ─┐
                               └────────────────────────────────────┘└──────────────────────────┘
```

- **Alcanzable**: camino como chips (origen en azul tenue, destino en ámbar tenue, intermedios
  neutros) unidos por `›`; dos recuadros: "Trayectos" (`saltos`) y "Nota" ("Ruta con menos
  trayectos"). **Sin** recuadro de costo total: eso es la Feature 3 y contradice la nota.
- **No alcanzable**: aviso rojo tenue con `✕` y el `mensaje`; debajo, la `explicacion` de la API y
  "Desde ORIGEN sí se cubre:" con chips de `alcanzables_desde_origen`. Reemplaza la tarjeta fija
  "Si no hay ruta" del boceto.
- **Imagen**: la de cobertura desde el origen (`/api/red/imagen/cobertura/{origen}`); el destino no
  se resalta en la imagen, solo en los chips. La leyenda "Origen / Destino" se quita.
- **Nota de la API**: aviso azul tenue con el campo `nota` tal cual; el texto se ajusta al ancho.

#### 5.4.3 Sin consulta

Formulario a la izquierda y, a la derecha, una tarjeta con "Elija un origen para ver qué puntos
puede cubrir" y dos ejemplos clicables que llenan la URL: "BOD-CENTRO" y "BOD-CENTRO → PR-LAGUNA".

### 5.5 Estados globales

| Estado | Boceto | Composición |
|--------|--------|-------------|
| API sin conexión | [`api-caida.png`](bocetos/api-caida.png) | Cabecera de vista con la frase "No se pudo cargar la red."; tarjeta con ícono en círculo rojo tenue, "No hay conexión con la API", explicación y botón principal "Reintentar" |
| Confirmar acción | [`dialogo.png`](bocetos/dialogo.png) | Ícono de advertencia ámbar, "¿Vaciar la red?", texto con las cifras reales ("Se eliminarán los N puntos y las N conexiones registradas. Esta acción no se puede deshacer."), el endpoint (`DELETE /api/red`) en recuadro mono, "Cancelar" y "Vaciar red" (peligro, con ícono). "Cargar red de ejemplo" usa el mismo diálogo con botón principal |
| Avisos | [`avisos.png`](bocetos/avisos.png) | Toasts apilados abajo a la derecha, borde del color del tipo (verde éxito, rojo error, ámbar aviso), ícono en círculo, texto 600 y botón `×`. **Sin** hora; se cierran solos a los 4 s |
| Cargando | — | Esqueleto (bloques `--panel-muted` animados) en contadores, tablas e imagen |

## 6. Componentes y estados

| Componente | Aspecto | Estados que debe dibujar |
|------------|---------|--------------------------|
| Botón principal | radio `sm`, 36px de alto, relleno `#0146C1`, texto blanco 500 | hover (azul al 90%), foco (anillo 2px), `disabled` (opacidad .5), `pending` (texto "Guardando…") |
| Botón secundario | Fondo blanco, borde `--panel-input`, texto tinta; hover fondo `--panel-muted` | mismos estados |
| Botón de peligro | Relleno rojo `#DC2626`, texto blanco | mismos estados |
| Botón fantasma | Sin borde ni fondo; hover `--panel-muted` ("Limpiar", "Reintentar") | mismos estados |
| Pestañas (navegación) | Texto tinta suave sin fondo; activa con fondo `#E3E5FC` y texto `#0146C1` | hover (texto tinta), foco |
| Campo de texto / select | 36px, radio `sm`, borde `--panel-input`, fondo blanco; select con chevron propio | foco (borde y anillo acento 3px), error (borde y anillo rojos + `InlineError`), `disabled` (opacidad .5, fondo muted) |
| `InlineError` | Texto rojo .8rem con `✕` al inicio, sin caja | — |
| Tarjeta | Fondo blanco, radio 14px, borde `--panel-border`, sombra mínima; título 600 1rem y etiqueta lateral opcional | carga (esqueleto), vacía, error |
| Tabla | Dentro de un recuadro con borde y radio `sm`; separador fino entre filas; cabecera fija | fila hover (fondo tenue), fila nueva resaltada, tabla vacía (fila única centrada) |
| `TypeBadge` | Rectangular radio `xs`, relleno del color del tipo, texto blanco 600 .72rem | — |
| `PathChips` | Chips monoespaciados con borde fino y marca cuadrada del color del tipo, unidos por `→` | variante grande (camino de evidencia) y compacta (orden de visita, capas) |
| Aviso | Borde fino, fondo tenue y texto oscuro del mismo matiz: verde, rojo o ámbar | veredicto, nota, explicación |
| `GraphImage` | Marco blanco con borde, alto mínimo 320px | cargando (esqueleto), error (mensaje centrado de la API + "Reintentar"), red vacía |
| `HealthIndicator` | Insignia de fondo tenue y punto de color: gris "Conectando…", verde "API en línea", rojo "API sin conexión" + botón "Reintentar" con borde rojo | los tres |
| `OfflineNotice` | Tarjeta con borde rojo tenue, ícono en círculo, "No hay conexión con la API", explicación y "Reintentar" (sección 5.5) | — |
| `EndpointLabel` | Monoespaciada .72rem, tinta suave, p. ej. `GET /api/red` | — |
| `CopyLinkChip` | Chip azul tenue con ícono de enlace y la ruta en monoespaciada | normal, copiado (toast "Enlace copiado") |
| `ConfirmDialog` | Tarjeta centrada, ancho máx. 420px, fondo oscurecido `rgb(0 0 0 / .5)` | acción destructiva con botón de peligro; foco inicial en "Cancelar" |
| Toast | Abajo a la derecha, apilados, ancho máx. 420px, fondo blanco con borde del color del tipo; ícono en círculo y `×` | éxito (verde), error (rojo), aviso (ámbar); entra subiendo 10px con opacidad (200ms); sale igual |
| Esqueleto | Bloques `--panel-muted` con radio `sm` y opacidad animada | — |

Estados vacíos (siempre con una acción para salir de ellos):

| Dónde | Mensaje | Acción |
|-------|---------|--------|
| Red vacía (Resumen) | "La red está vacía" | "Cargar red de ejemplo" |
| Tabla de puntos | "Aún no hay puntos registrados" | ninguna (el formulario está al lado) |
| Tabla de conexiones | "Aún no hay conexiones" | ninguna |
| Cobertura sin consulta | "Elija un origen para ver qué puntos puede cubrir" | ejemplos clicables |

## 7. Pantallas pequeñas

| Ancho | Cambio |
|-------|--------|
| ≥ 1200px | Composición de la sección 5 |
| 960–1199px | Mismas columnas, separaciones con `--panel-space-3` |
| < 960px | Una columna. Resumen: contadores → imagen → adyacencia. Puntos y Conexiones: formulario → imagen → tabla (→ consulta / sugerencia). Cobertura: consulta → veredicto → imagen → listas → capas → orden → traza |
| < 860px | `HeaderLight` oculta la píldora de navegación (comportamiento actual); se agrega una segunda barra fija debajo con los cuatro destinos desplazable en horizontal, para no perder la navegación |
| < 560px | Contadores en 2 columnas; tablas con desplazamiento horizontal propio (nunca la página); acciones del encabezado como botones solo-símbolo con `aria-label` |

Gutter lateral mínimo de 16px; ninguna vista provoca desplazamiento horizontal de la página.

## 8. Accesibilidad visual

- Contraste AA: texto sobre blanco con `#0B1640` / `#5B6385`; texto blanco sobre `#0146C1` y sobre
  los colores de tipo se verifica. Blanco sobre `#3BB273` da 2.6:1, así que la insignia de punto de
  recogida usa texto `#0B1640`.
- El estado nunca depende solo del color: el veredicto lleva `✓`/`✕` y texto; las insignias, el
  nombre del tipo.
- Foco visible en todo elemento interactivo (anillo 2px acento con `outline-offset: 3px`, igual que la landing).
- Objetivo táctil mínimo 40×40px en botones y chips clicables.
- `prefers-reduced-motion: reduce` desactiva el esqueleto animado, el resaltado de fila y la entrada de toasts.
- La imagen del grafo lleva `alt` descriptivo ("Red con 7 puntos y 10 trayectos" / "Cobertura desde BOD-CENTRO: 5 alcanzables").

## 9. Pasos

Cada paso se hace junto a su paso equivalente de `plan.md` (columna "Va con") o justo después, en
`feature_2/frontend`, con un commit `feat:` o `docs:`. Los estilos van en el `*.module.css` de cada
componente; ningún archivo supera 500 líneas.

| # | Paso | Va con | Hecho cuando |
|---|------|--------|--------------|
| 1 | **Referencias de diseño.** Bocetos aprobados en `docs/frontend/bocetos/` (sección 10), este plan actualizado y `docs/ia/bitacora-frontend.md`. Commit `docs: plan de diseño del panel según los bocetos` | antes del paso 1 de `plan.md` | El commit está en `feature_2/frontend` |
| 2 | **Tokens de forma.** Crear `styles/panel-shape.css` (sección 3.1) e importarlo en `PanelLayout` junto a `panel-tokens.css` | paso 4 | Las variables existen y la landing no cambia |
| 3 | **Estructura de página.** Fondo, ancho máximo, compensación del encabezado y `ViewHeader` (`title`, `description`, `meta`) según la sección 4 | paso 7 | Las 4 rutas muestran su cabecera bajo el encabezado sin quedar tapadas |
| 4 | **Encabezado.** Pestañas por ruta con el activo `#E3E5FC`, logo sin etiqueta y estilo de `actions` en `HeaderLight.css`; barra de navegación secundaria para < 860px | paso 7 | CA-P1, CA-P2 y CA-P13 en escritorio y móvil; coincide con `bocetos/resumen.png` y `bocetos/api-caida.png` |
| 5 | **Piezas base.** Botones, campos, tarjeta con etiqueta de endpoint, tabla y esqueleto en `styles/panel-controls.css`; `InlineError`, `TypeBadge`, `PathChips`, `HealthIndicator`, `OfflineNotice`, `GraphImage` (con el estado 503 de `bocetos/resumen-503.png`) | paso 6 | Una página de prueba temporal (no se commitea) muestra cada estado |
| 6 | **Diálogo y toasts.** Según `bocetos/dialogo.png` y `bocetos/avisos.png` (sección 5.5) | paso 6 | Se abre, se cierra con Esc y respeta `prefers-reduced-motion` |
| 7 | **Resumen.** Sección 5.1 y estado de red vacía | paso 8 | Coincide con `bocetos/resumen.png` con los ajustes de la sección 11 |
| 8 | **Puntos.** Sección 5.2 con la imagen en vivo arriba y el resaltado de fila nueva | paso 9 | Coincide con `bocetos/puntos.png` + imagen; al registrar un punto aparece en el diagrama |
| 9 | **Conexiones.** Sección 5.3 | paso 10 | Coincide con `bocetos/conexiones.png`; al registrar una conexión aparece en el diagrama |
| 10 | **Cobertura.** Sección 5.4: alcance, ruta alcanzable y no alcanzable, sin consulta y chip copiable | paso 11 | Coincide con `bocetos/cobertura-alcance.png` y `bocetos/cobertura-ruta.png` |
| 11 | **Pantallas pequeñas.** Aplicar la sección 7 en cada módulo y revisar a 1280, 960, 768, 390px | después del 10 | Sin desplazamiento horizontal en ningún ancho |
| 12 | **Accesibilidad.** Revisar contraste de cada par texto/fondo, foco con teclado en las 4 vistas, `alt` de imágenes y movimiento reducido (sección 8) | después del 11 | Lista de la sección 8 completa; se agrega como escenarios a `pruebas/prueba_manual_panel.md` |
| 13 | **Capturas y bitácora.** Capturas finales de cada vista en `docs/img/panel-*.png` y registro de propuestas de IA de diseño en `docs/ia/bitacora-frontend.md` | paso 13 | Capturas enlazadas desde `frontend/README.md` |

Archivos nuevos que agrega este plan (además de los de `plan.md`):

| Archivo | Responsabilidad única | Presupuesto |
|---------|-----------------------|-------------|
| `src/styles/panel-shape.css` | Tokens de forma y espacio | 40 |
| `src/styles/panel-controls.css` | Clases de botones, campos, tarjeta, tabla y esqueleto | 250 |
| `src/components/panel/layout/ViewHeader.tsx` (+ css) | Título, frase y dato `meta` de cada vista | 45 |
| `src/components/panel/shared/CopyLinkChip.tsx` (+ css) | Chip con la URL de la consulta que la copia al portapapeles | 45 |
| `src/components/panel/shared/EndpointLabel.tsx` (+ css) | Etiqueta monoespaciada con el método y la ruta del endpoint | 20 |
| `docs/frontend/bocetos/*.png` | Bocetos aprobados (no es código) | — |

## 10. Bocetos aprobados

Reemplazan la propuesta en pen.dev. Son la referencia visual de la implementación, con los ajustes
de la sección 11.

| Archivo | Muestra |
|---------|---------|
| [`resumen.png`](bocetos/resumen.png) | Resumen con contadores, lista de adyacencia e imagen |
| [`resumen-503.png`](bocetos/resumen-503.png) | Resumen con la imagen no disponible (503) |
| [`avisos.png`](bocetos/avisos.png) | Toasts de éxito, error y aviso |
| [`dialogo.png`](bocetos/dialogo.png) | Diálogo "¿Vaciar la red?" |
| [`api-caida.png`](bocetos/api-caida.png) | API sin conexión |
| [`puntos.png`](bocetos/puntos.png) | Puntos: registro con error 409, tabla y consulta |
| [`conexiones.png`](bocetos/conexiones.png) | Conexiones: imagen, registro y tabla |
| [`cobertura-alcance.png`](bocetos/cobertura-alcance.png) | Cobertura desde un origen |
| [`cobertura-ruta.png`](bocetos/cobertura-ruta.png) | Verificación origen → destino alcanzable |

No hay bocetos de móvil: se aplica la sección 7.

## 11. Ajustes a los bocetos (decisiones cerradas)

Tomadas en una sesión de preguntas con IA (ver `docs/ia/bitacora-frontend.md`).

| Elemento del boceto | Decisión | Motivo |
|---------------------|----------|--------|
| Marca "RutaPyme · Panel de rutas" | Se mantiene el logo de `HeaderLight`, sin etiqueta | Misma marca que la landing; CA-P13 |
| Ítem de navegación para la Feature 3 | No se agrega | Un botón sin función confunde en el pitch |
| "Costo total" en la ruta | Se quita | La API no lo calcula y la nota aclara que no es la ruta de menor costo (Feature 3) |
| Columna "Estado" en Puntos | Se quita | Los puntos no tienen estado |
| Columna "Tipo de arco" en Conexiones | Se quita | Las conexiones no tienen tipo |
| "red v12" | Se quita | No viene de la API |
| "Actualizado hace 2 min" | Se mantiene, calculado en el cliente desde el último `refresh()` | Dato útil sin cambiar el backend |
| Arista "Última conexión registrada" y etiqueta "En vivo" | Se quitan | La imagen de la API no resalta aristas |
| Destino resaltado en la imagen de la ruta | Se quita; se usa la imagen de cobertura del origen | Solo existe `/api/red/imagen/cobertura/{origen}` |
| Grafo vectorial | Es el PNG de NetworkX de la API | Regla 3 de `CLAUDE.md`; el panel consume la API |
| Ids `BO-01`, cifras y "saltos" | Datos y mensajes reales de la API; se dice "trayectos" | Glosario y contrato |
| Imagen de la red en Puntos | Se agrega, igual que en Conexiones | Que el punto registrado se vea en el diagrama al instante |
| Actualización de la imagen | Tras cada acción del panel (`?v=<version>`), sin sondeo | Igual que `frontend/legacy/app.js` |
| Eyebrow de la cabecera | No se usa; título, frase y dato `meta` | Así lo muestran los bocetos |
| Traza del recorrido | Abierta; más de 10 pasos → "Ver todos" | Así lo muestra el boceto |
| Chip de URL de cobertura | Copia el enlace y avisa "Enlace copiado" | Apoya CA-P10 |
| "Indique el punto de origen" con el origen lleno | Solo aparece con el origen vacío | Error del boceto |
| Tarjeta fija "Si no hay ruta" | Se reemplaza por la variante no alcanzable del veredicto | Muestra `explicacion` y `alcanzables_desde_origen` |
| Textos que se salen de la tarjeta ("Sugerencia", "Nota de la API") | Se ajustan al ancho | Error del boceto |
| Hora en los toasts ("hace 2 s") | Se quita; cierre automático a los 4 s | `plan.md`, paso 5 |
| Red vacía, carga, cobertura sin consulta | Estado vacío con acción, esqueleto y ejemplos clicables | No tenían boceto |
| Lista de adyacencia | A la izquierda de la imagen | Así lo muestra el boceto |
| Navegación en móvil | Segunda barra fija desplazable (sección 7) | Se mantiene el diseño móvil |
