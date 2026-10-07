# Cómo trabajamos en el repositorio

Equipo 7: **Emmanuel Cardona**, **Sebastian Ramirez**, **Juliana Velandia**, **Melany Herrera**.

## Flujo de trabajo
1. Se crea una rama desde `main`:
   - `feature/<n>-<nombre>` para una feature (ej. `feature/1-red-operativa`).
   - `docs/<tema>` para documentación, `fix/<tema>` para correcciones.
2. Commits pequeños con prefijo convencional:

   | Prefijo     | Uso                                   |
   |-------------|---------------------------------------|
   | `feat:`     | Nueva funcionalidad                    |
   | `fix:`      | Corrección de un error                 |
   | `docs:`     | Documentación                          |
   | `test:`     | Scripts de aceptación                  |
   | `chore:`    | Configuración, estructura, dependencias|
   | `refactor:` | Cambio interno sin cambiar el resultado |

3. Se abre un *Pull Request* hacia `main` usando la plantilla. El PR enlaza sus issues con `Closes #N`.
4. Al cerrar una feature se crea un tag y un release: `v1.0.0` (Feature 1), `v2.0.0` (Feature 2)...

## Antes de hacer merge

- [ ] El servidor arranca con `python main.py`.
- [ ] `python pruebas/aceptacion_feature1.py` termina con todos los escenarios en PASÓ.
- [ ] No hay bibliotecas nuevas fuera de `requirements.txt`.
- [ ] README y bitácora de IA actualizados.
