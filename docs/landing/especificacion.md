# Landing · Secciones de cierre — Especificación

> Documento de entrada del desarrollo orientado a especificaciones (SDD).
> Alcance: tres secciones que van **debajo** del recorrido con scroll de `frontend/landing/`.
> Estado: **borrador, pendiente de aprobación del equipo.**

## 1. Valor

Hoy la landing termina en la escena "Ruta" y un botón. Quien la visita (docente, jurado, una pyme)
no ve evidencia de que el producto funciona, no ve el beneficio en números y no sabe quién lo hizo.
Estas secciones cierran la página con **prueba**, **argumento** y **autoría**.

## 2. Historias de usuario

| ID    | Como...              | Quiero...                                                   | Para...                                    |
|-------|----------------------|-------------------------------------------------------------|--------------------------------------------|
| HU-L1 | visitante            | ver cifras reales de la red que sirve la API                | confiar en que no es una maqueta           |
| HU-L2 | visitante / jurado   | comparar un envío "a ojo" con uno planeado en la red        | entender el ahorro en minutos              |
| HU-L3 | visitante / docente  | ver equipo, enlaces al repositorio y documentación          | saber quién lo hizo y dónde revisarlo      |

## 3. Secciones

### S1 · Cifras de la red en vivo

Franja con 4 cifras grandes, leídas de la API al entrar la sección en pantalla:

| Cifra                        | Fuente                                    |
|------------------------------|-------------------------------------------|
| Puntos en la red             | `GET /api/red` → `resumen.puntos`         |
| Trayectos registrados        | `GET /api/red` → `resumen.conexiones`     |
| Bodegas · barrios · recogida | `GET /api/red` → `resumen.por_tipo`       |
| Tiempo promedio por trayecto | `GET /api/conexiones` → promedio de `costo` (min) |

Nota de modelo: la red **no** guarda trayectos "cerrados"; un trayecto cerrado es simplemente uno que
no está registrado (R-03/R-04 de la Feature 1). Por eso no se muestra una cifra de cerrados.

### S2 · Antes y después: "a ojo" frente a RutaPyme

Caso fijo con la red de ejemplo (`datos/red_ejemplo.json`): **pedido de `BOD-CENTRO` a `BAR-ORIENTE`**.

| Columna        | Recorrido                                        | Resultado esperado con la red de ejemplo |
|----------------|--------------------------------------------------|------------------------------------------|
| "A ojo"        | intenta `BOD-CENTRO → BAR-ORIENTE` directo       | ✗ trayecto no registrado (cerrado)       |
|                | desvío `BOD-CENTRO → BAR-NORTE → PR-PARQUE → BAR-ORIENTE` | 12 + 7 + 9 = **28 min**         |
| RutaPyme       | `BOD-CENTRO → BAR-SUR → BAR-ORIENTE`             | 8 + 6 = **14 min**                       |
| Ahorro         | —                                                | **14 min (50 %)**                        |

- Cada tramo se valida contra `GET /api/conexiones`: si existe, se muestra su costo; si no, se marca
  como cerrado. Los totales se suman con lo que devuelve la API, no con números escritos en el HTML.
- La ruta "RutaPyme" está elegida a mano mientras no exista la Feature 3. Se rotula
  "ruta válida de menor tiempo en la red de ejemplo". Cuando exista `GET /api/ruta`, se reemplaza
  por su respuesta (sin cambiar el diseño).

### S3 · Equipo y pie de página

- Equipo 7: Emmanuel Cardona, Sebastian Ramirez, Juliana Velandia · Matemáticas para la
  Informática Avanzada · ITM · 2026.
- Enlaces: repositorio (`github.com/bblueside/RutaPyme`), documentación (`docs/`), interfaz en vivo.
- CTA final "Ver la red en vivo" y enlace "Volver al inicio".
- Aviso fijo: **"Todos los datos son sintéticos. RutaPyme no usa información personal real."**

## 4. Reglas

| Regla | Descripción |
|-------|-------------|
| RL-01 | HTML + CSS + JS nativos, sin frameworks ni bibliotecas (regla 4 del arnés). |
| RL-02 | Las cifras de S1 y S2 vienen de la API real; nunca se inventan ni se dejan valores de relleno. |
| RL-03 | Tema blueprint aprobado: fondo `#0146C1`, línea `#E3E5FC`, sin cuadrícula. |
| RL-04 | Las secciones tapan las capas fijas del recorrido (escena, textos, puntos de navegación). |
| RL-05 | Funcionan en celular (ancho 360 px) sin scroll horizontal. |
| RL-06 | Textos en español, sin abreviaturas crípticas. |

## 5. Criterios de aceptación

| ID    | Dado | Cuando | Entonces |
|-------|------|--------|----------|
| CA-L1 | la API encendida con la red de ejemplo | se llega a S1 | muestra 7 puntos, 10 trayectos, 1 · 3 · 3 por tipo y 12,2 min de promedio |
| CA-L2 | la API apagada | se llega a S1 o S2 | muestran "Red sin conexión · enciende el backend" y ninguna cifra |
| CA-L3 | la API encendida con red vacía | se llega a S1 | muestra 0 puntos y 0 trayectos; S2 indica "carga la red de ejemplo para ver la comparación" |
| CA-L4 | la red de ejemplo | se llega a S2 | el tramo directo aparece cerrado, "a ojo" suma 28 min, RutaPyme 14 min y el ahorro 14 min (50 %) |
| CA-L5 | se borra el trayecto `BAR-SUR → BAR-ORIENTE` (red vaciada y recargada sin él) | se llega a S2 | ese tramo aparece cerrado y no se muestra ahorro |
| CA-L6 | cualquier estado | se llega a S3 | se ven los 3 integrantes, los 3 enlaces, el CTA, "Volver al inicio" y el aviso de datos sintéticos |
| CA-L7 | se termina el recorrido | se sigue bajando | las capas fijas del recorrido no quedan encima de las secciones |
| CA-L8 | ancho 360 px | se recorre la página | no hay scroll horizontal y las cifras se apilan |

## 6. Fuera de alcance

- La demo interactiva de origen/destino (idea 3) y la sección técnica/hoja de ruta (idea 4).
- Cálculo de rutas en el navegador: el frontend solo **valida y suma** tramos fijos, no busca caminos.
