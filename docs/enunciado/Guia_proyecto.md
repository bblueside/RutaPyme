# Brief de cliente — RutaPyme

## Cliente y problema

RutaPyme es una empresa local que coordina entregas entre una bodega, barrios y puntos de recogida. Hoy sus decisiones se toman por intuición; a veces envían un pedido por una conexión cerrada o eligen una ruta de pocos saltos pero alto costo. Necesitan una herramienta para registrar su red operativa y tomar decisiones de cobertura y ruta.

## Usuarios

- *Coordinador logístico:* configura puntos y trayectos disponibles.
- *Despachador:* consulta si puede cubrir un destino y qué ruta conviene.

## Alcance

Trabajarán con datos sintéticos: puntos, tipo de punto y conexiones dirigidas con un costo positivo (por ejemplo, distancia o tiempo). La solución no requiere mapa real, GPS, vehículos múltiples, tráfico en tiempo real ni autenticación.

## Feature 1 — Red operativa inicial

### Valor de negocio
El coordinador puede registrar y consultar la red de puntos y trayectos disponibles.

### Debe permitir

- crear/listar puntos con identificador único y tipo;
- crear/listar conexiones entre puntos existentes con costo positivo;
- rechazar conexiones duplicadas, puntos inexistentes y costos inválidos;
- consultar una representación legible de la red mediante la API y una interfaz mínima;
- documentar por qué la red es dirigida, qué representa el peso y cuál es su representación principal.

### Pistas, no receta

Pregunten si una conexión A→B siempre permite B→A. Piensen qué operación harán más: ¿consultar todos los vecinos de un punto o revisar cualquier posible pareja? La respuesta justifica la estructura.

## Feature 2 — Cobertura de entregas

### Valor de negocio
El despachador puede saber qué destinos son alcanzables desde una bodega y verificar la posibilidad de cobertura.

### Debe permitir

- recibir origen y destino o un origen para consultar alcance;
- recorrer la red con un algoritmo propio apropiado;
- devolver destinos alcanzables o una explicación clara de no alcanzabilidad;
- manejar origen/destino inexistente, red vacía y destinos desconectados;
- presentar una traza pequeña en la documentación: orden de visita y decisión tomada.

### Pistas, no receta

Comparen recorrido por capas y exploración profunda. El cliente no pide todavía la ruta más barata: pide cobertura. No mezclen dos necesidades distintas porque el algoritmo “ya estaba ahí”.

## Feature 3 — Ruta de menor costo

### Valor de negocio
El despachador compara alternativas y obtiene una ruta de menor costo entre dos puntos conectados.

### Debe permitir

- recibir origen y destino;
- devolver secuencia de puntos y costo acumulado;
- explicar cuando no existe ruta;
- validar que los costos cumplan las condiciones del algoritmo escogido;
- evidenciar por qué “menos saltos” no necesariamente significa “menor costo”.

### Pistas, no receta

Elijan un algoritmo que funcione con pesos positivos y expliquen qué dato deben conservar para reconstruir la ruta. Hagan una traza con dos caminos que tengan distinto número de saltos y costo.

## Feature 4 — Operación demostrable

### Valor de negocio
RutaPyme puede demostrar una decisión de despacho completa y entendible.

### Debe permitir

- integrar configuración, alcance y ruta en una interfaz conectada al backend;
- visualizar red y resultado de la consulta; NetworkX solo puede dibujar datos/resultados propios;
- implementar el cambio de requisito comunicado por el docente;
- ejecutar un script de aceptación con escenario normal, ruta inexistente, nodo inexistente y costo inválido;
- cerrar README, bitácora IA, video y pitch.

## Criterio de éxito del cliente

En una demo, el despachador registra una red pequeña, verifica cobertura, solicita una ruta, entiende por qué se seleccionó y ve una respuesta correcta ante datos inválidos o falta de conexión.