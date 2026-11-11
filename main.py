"""Entry point: starts the RutaPyme REST API and web interface.

Usage:
    python main.py              # empty network at http://127.0.0.1:8000
    python main.py --ejemplo    # starts with the synthetic network from datos/red_ejemplo.json
"""

import argparse
import os
import sys

from backend.api import create_server, load_sample_network


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Servidor de RutaPyme (API REST + interfaz web).")
    parser.add_argument("--host", default=os.environ.get("HOST", "127.0.0.1"),
                        help="Dirección de escucha (use 0.0.0.0 al desplegar).")
    parser.add_argument("--puerto", dest="port", type=int, default=int(os.environ.get("PORT", "8000")),
                        help="Puerto HTTP (por defecto 8000 o la variable PORT).")
    parser.add_argument("--ejemplo", dest="sample", action="store_true",
                        help="Carga la red sintética de datos/red_ejemplo.json al iniciar.")
    args = parser.parse_args()

    server = create_server(args.host, args.port)
    if args.sample:
        load_sample_network(server.network)
        print("Red de ejemplo cargada.")

    print(f"RutaPyme escuchando en http://{args.host}:{args.port}  (Ctrl+C para detener)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
