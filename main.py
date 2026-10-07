"""Punto de entrada: inicia la API REST de RutaPyme.

Uso:
    python main.py              # red vacía en http://127.0.0.1:8000
    python main.py --ejemplo    # arranca con la red sintética de datos/red_ejemplo.json
"""

import argparse
import os
import sys

from backend.api import cargar_red_ejemplo, crear_servidor


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Servidor de RutaPyme (API REST).")
    parser.add_argument("--host", default=os.environ.get("HOST", "127.0.0.1"),
                        help="Dirección de escucha (use 0.0.0.0 al desplegar).")
    parser.add_argument("--puerto", type=int, default=int(os.environ.get("PORT", "8000")),
                        help="Puerto HTTP (por defecto 8000 o la variable PORT).")
    parser.add_argument("--ejemplo", action="store_true",
                        help="Carga la red sintética de datos/red_ejemplo.json al iniciar.")
    argumentos = parser.parse_args()

    servidor = crear_servidor(argumentos.host, argumentos.puerto)
    if argumentos.ejemplo:
        cargar_red_ejemplo(servidor.red)
        print("Red de ejemplo cargada.")

    print(f"RutaPyme escuchando en http://{argumentos.host}:{argumentos.puerto}  (Ctrl+C para detener)")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        servidor.server_close()


if __name__ == "__main__":
    main()