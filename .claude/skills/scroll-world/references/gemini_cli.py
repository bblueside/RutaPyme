#!/usr/bin/env python3
"""Cliente mínimo de la API de Gemini para la skill scroll-world.

Reemplaza a `higgsfield generate create` y al backend de Monid:
  - imagen: Nano Banana Pro (gemini-3-pro-image-preview) para las escenas.
  - video : Gemini Omni (Interactions API, sucesor de Veo 3.1 en Flow) con fotograma inicial y final para las costuras.

Solo biblioteca estándar. La clave se lee de GEMINI_API_KEY (entorno o archivo .env
subiendo carpetas desde este script) y nunca se imprime.

Uso:
  gemini_cli.py modelos
  gemini_cli.py imagen --prompt-file p.txt --aspect 3:2 --size 2K --out escena_1.png [--ref a.png ...]
  gemini_cli.py video  --prompt-file p.txt --first-frame a.png [--last-frame b.png]
                       --resolution 720p --aspect 16:9 --out dive_1.mp4
"""
import argparse
import base64
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = "https://generativelanguage.googleapis.com/v1beta"
MODELO_IMAGEN = "gemini-3-pro-image-preview"
MODELO_VIDEO = "gemini-omni-1.1-flash"


def cargar_clave():
    clave = os.environ.get("GEMINI_API_KEY")
    if not clave:
        for carpeta in [Path(__file__).resolve().parent, *Path(__file__).resolve().parents]:
            env = carpeta / ".env"
            if env.is_file():
                for linea in env.read_text(encoding="utf-8").splitlines():
                    nombre, _, valor = linea.partition("=")
                    if nombre.strip() == "GEMINI_API_KEY":
                        clave = valor.strip().strip('"').strip("'")
                break
    if not clave:
        sys.exit("Falta GEMINI_API_KEY (variable de entorno o .env en el proyecto).")
    return clave


def llamar(metodo, url, cuerpo=None, binario=False, espera=300):
    peticion = urllib.request.Request(
        url,
        data=json.dumps(cuerpo).encode() if cuerpo is not None else None,
        method=metodo,
        headers={"x-goog-api-key": cargar_clave(), "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(peticion, timeout=espera) as respuesta:
            datos = respuesta.read()
    except urllib.error.HTTPError as error:
        sys.exit(f"HTTP {error.code}: {error.read().decode(errors='replace')[:1500]}")
    return datos if binario else json.loads(datos)


def codificar(ruta):
    tipo = mimetypes.guess_type(ruta)[0] or "image/png"
    return {"mimeType": tipo, "data": base64.b64encode(Path(ruta).read_bytes()).decode()}


def leer_prompt(args):
    return Path(args.prompt_file).read_text(encoding="utf-8") if args.prompt_file else args.prompt


def comando_modelos(_):
    for modelo in llamar("GET", f"{BASE}/models?pageSize=200")["models"]:
        nombre = modelo["name"].removeprefix("models/")
        if any(clave in nombre for clave in ("image", "omni")):
            print(nombre, modelo.get("supportedGenerationMethods"))


def comando_imagen(args):
    partes = [{"inlineData": codificar(ruta)} for ruta in args.ref or []]
    partes.append({"text": leer_prompt(args)})
    cuerpo = {
        "contents": [{"parts": partes}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": args.aspect, "imageSize": args.size},
        },
    }
    respuesta = llamar("POST", f"{BASE}/models/{MODELO_IMAGEN}:generateContent", cuerpo)
    for parte in respuesta["candidates"][0]["content"]["parts"]:
        datos = parte.get("inlineData")
        if datos:
            Path(args.out).write_bytes(base64.b64decode(datos["data"]))
            print(f"imagen ok -> {args.out}")
            return
    sys.exit("La respuesta no trajo imagen: " + json.dumps(respuesta)[:800])


def comando_video(args):
    """Video con Gemini Omni (Interactions API). Los fotogramas van en orden: primero el inicial, luego el final."""
    entrada = []
    for ruta in [args.first_frame] + ([args.last_frame] if args.last_frame else []):
        imagen = codificar(ruta)
        entrada.append({"type": "image", "data": imagen["data"], "mime_type": imagen["mimeType"]})
    entrada.append({"type": "text", "text": leer_prompt(args)})
    cuerpo = {
        "model": args.modelo,
        "input": entrada,
        "response_format": {"type": "video", "aspect_ratio": args.aspect, "resolution": args.resolution},
    }
    inicio = time.time()
    respuesta = llamar("POST", f"{BASE}/interactions", cuerpo, espera=args.espera * 60)
    for paso in respuesta.get("steps", []):
        for pieza in paso.get("content", []):
            if pieza.get("type") == "video" and pieza.get("data"):
                Path(args.out).write_bytes(base64.b64decode(pieza["data"]))
                print(f"video ok -> {args.out} ({time.time() - inicio:.0f} s)")
                return
    sys.exit("Sin video (posible filtro de seguridad): " + json.dumps(respuesta)[:800])


def main():
    analizador = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    sub = analizador.add_subparsers(dest="comando", required=True)
    sub.add_parser("modelos").set_defaults(accion=comando_modelos)

    imagen = sub.add_parser("imagen")
    imagen.add_argument("--prompt")
    imagen.add_argument("--prompt-file")
    imagen.add_argument("--aspect", default="3:2")
    imagen.add_argument("--size", default="2K", choices=["1K", "2K", "4K"])
    imagen.add_argument("--ref", action="append", help="imagen de referencia de estilo (repetible)")
    imagen.add_argument("--out", required=True)
    imagen.set_defaults(accion=comando_imagen)

    video = sub.add_parser("video")
    video.add_argument("--prompt")
    video.add_argument("--prompt-file")
    video.add_argument("--first-frame", required=True)
    video.add_argument("--last-frame")
    video.add_argument("--resolution", default="720p", choices=["360p", "720p", "1080p", "4k"])
    video.add_argument("--aspect", default="16:9", choices=["16:9", "9:16"])
    video.add_argument("--modelo", default=MODELO_VIDEO)
    video.add_argument("--espera", type=int, default=15, help="minutos máximos de espera")
    video.add_argument("--out", required=True)
    video.set_defaults(accion=comando_video)

    args = analizador.parse_args()
    if args.comando in ("imagen", "video") and not (args.prompt or args.prompt_file):
        analizador.error("indica --prompt o --prompt-file")
    args.accion(args)


if __name__ == "__main__":
    main()
