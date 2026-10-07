---
name: prueba-aceptacion
description: Cómo escribir y ejecutar el script de aceptación de una feature de RutaPyme usando solo urllib. Úsala cuando se pida crear, ampliar o ejecutar pruebas de aceptación.
---

# Skill: script de aceptación sin frameworks

## Reglas

- Solo biblioteca estándar: `urllib.request`, `json`, `sys`.
- Nada de pytest, mocks ni `requests`.
- El script consume la **API real** que corre en local (`python main.py`).
- El script empieza con `DELETE /api/red` para partir de una red vacía y ser repetible.

## Escenarios mínimos (Guía técnica)

1. Escenario normal de negocio.
2. Grafo vacío o consulta sin datos.
3. Nodo, origen o destino inexistente.
4. Ruta o relación inexistente.
5. Datos inválidos: identificadores repetidos, pesos inválidos, formato incorrecto.
6. Ciclo, si aplica al problema (en RutaPyme los ciclos son válidos: se comprueba que se acepten).

## Formato de salida obligatorio

Cada escenario imprime una línea como:

```
[PASÓ] 07. Conexión duplicada
       Esperado: 409 elemento_duplicado
       Obtenido: 409 elemento_duplicado
```

Al final imprime el total de escenarios aprobados y termina con código de salida `1` si alguno falla.

## Ejecución

```bash
python main.py            # en una terminal
python pruebas/aceptacion_featureN.py   # en otra terminal
```

Guarda la salida en `pruebas/salidas/aceptacion_featureN.txt` como evidencia.
