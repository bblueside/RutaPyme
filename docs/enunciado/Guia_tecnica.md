GUIA COMUN PARA ESTUDIANTES

ENCARGO PROFESIONAL
Actúan como un equipo de consultoría que entrega un microproducto a una pyme. El cliente no compra una interfaz bonita: compra una solución funcional, explicable y confiable. Cada proyecto debe transformar una necesidad en un grafo propio, exponer una API REST y demostrar resultados correctos.

REGLAS NO NEGOCIABLES
El backend se implementa en Python 3.12+ y debe exponer una API REST. Usen un entorno virtual y mantengan un requirements.txt actualizado para reproducir el proyecto.
La representación y los algoritmos de grafos son propios. NetworkX solo puede usarse para visualizar resultados que ya calculó su backend.
El frontend es libre (Streamlit, web u otro), pero debe consumir el backend real. Un diseño sin funcionalidad no recibe puntaje de integración.
Todo el equipo trabaja con Git/GitHub: tareas visibles, ramas por feature, pull requests y README actualizado.
Cada feature es una rebanada vertical que funciona de punta a punta, no una colección de pantallas o funciones aisladas.
Usen datos sintéticos coherentes; no incorporen datos personales reales.

ORGANIZACION DEL EQUIPO
Los grupos son de cuatro y se conforman autónomamente. Todos deben pertenecer a un grupo.
Antes de empezar cada feature, registren quién hará el pitch. Nadie repite hasta que todos hayan expuesto, salvo autorización docente.
No creen silos: durante el semestre cada persona debe participar en una decisión de grafo/algoritmo, una revisión o prueba y una parte funcional integrada.
Al cerrar cada feature entreguen aportes declarados, enlaces a commits/PR/revisiones y una coevaluación confidencial. Si no hay aporte demostrable después de la Feature 1, el docente puede intervenir.

COMO CONSTRUIR UNA FEATURE
Lean el criterio de aceptación y conviértanlo en tareas pequeñas.
Identifiquen entidades, relaciones, dirección, pesos y consultas que necesita el negocio.
Dibujen un ejemplo pequeño y hagan una traza manual de la consulta o algoritmo.
Implementen el núcleo Python antes de la interfaz.
Expongan la capacidad mediante la API REST.
Conecten una interfaz mínima que permita observar valor al usuario.
Escriban y ejecuten el script de aceptación contra la API local.
Actualicen README, bitácora IA y video/pitch.

PRUEBAS DE ACEPTACION SIN FRAMEWORKS ADICIONALES
Cada feature incluye un script ejecutable que consume su API REST con datos de prueba. Debe comprobar respuestas y contenido esperado para, como mínimo:
Un escenario normal de negocio.
Grafo vacío o consulta sin datos, cuando aplique.
Nodo, origen o destino inexistente.
Ruta o relación inexistente.
Datos inválidos: identificadores repetidos, pesos inválidos o formato incorrecto.
Ciclo, si el problema usa dependencias dirigidas.
El script debe imprimir qué escenario se ejecutó, qué esperaba, qué obtuvo y si pasó o falló. No se exige pytest, mocks ni porcentaje de cobertura.

USO RESPONSABLE DE IA
La IA está permitida y se espera que la usen. Pero ustedes son los auditores: código que no puedan explicar, trazar y verificar es código no entregado.
Por cada feature, incluyan una bitácora con las siguientes columnas: Decisión o pieza, Herramienta/objetivo de IA, Propuesta recibida, Acepté o rechacé y por qué, Cómo la verifiqué.
No compartan implementaciones, repositorios ni prompts que entreguen una solución entre equipos. Pueden debatir conceptos y ayudarse a entender teoría.

ENTREGA POR FEATURE
URL del repositorio y tag/release de la feature.
README con propósito, instalación, ejecución, endpoints y decisiones de diseño.
API REST funcional y frontend conectado.
Script y salida de pruebas de aceptación.
Bitácora de IA actualizada.
Video de máximo tres minutos como respaldo de funcionamiento.
Pitch del integrante asignado: 7 minutos de demo y 3 de preguntas.

QUE DEBE EXPLICAR EL PITCH
Problema de negocio y usuario afectado.
Decisión de modelado: nodos, aristas, dirección, pesos y representación.
Algoritmo o recorrido y por qué sirve para esa consulta.
Complejidad aproximada y estructura de datos escogida.
Un caso borde y cómo responde el sistema.
Evidencia del script de aceptación y contribuciones del equipo.

CAMBIO DE REQUISITO
Después de la Feature 2 recibirán una solicitud de cambio controlada. No es un castigo: deberán registrar impacto, ajustar backlog, decidir qué cambia y demostrar la adaptación en la Feature 4. No agreguen funcionalidades fuera del alcance sin justificar costo y valor.