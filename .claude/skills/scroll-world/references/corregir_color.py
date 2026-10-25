#!/usr/bin/env python3
"""Corrección de color de dos tonos con OpenCV (estilo blueprint de RutaPyme).

Cada píxel se proyecta entre el color de fondo y el color de línea que trae la imagen o
el video generado, y se reasigna a los dos tonos exactos de marca. Conserva el
antialiasing porque es una interpolación, no un umbral.

En video la calibración (fondo y línea de origen) se calcula UNA vez con fotogramas
muestreados de todo el clip y se aplica igual a todos, para que no parpadee y para que
las costuras entre clips queden en los mismos tonos.

Uso:
  corregir_color.py entrada.png salida.png
  corregir_color.py entrada.mp4 salida.mp4
  opciones: --fondo 0146C1 --linea E3E5FC
"""
import argparse
import sys
from pathlib import Path

import cv2
import numpy as np

FONDO = "0146C1"
LINEA = "E3E5FC"


def hex_a_rgb(codigo):
    codigo = codigo.lstrip("#")
    return np.array([int(codigo[i:i + 2], 16) for i in (0, 2, 4)], float)


def a_hex(color):
    return "#" + "".join(f"{int(round(valor)):02X}" for valor in color)


def calibrar(imagenes_rgb):
    """Fondo = mediana de los bordes; línea = mediana del 0.5 % más claro."""
    bordes, claros = [], []
    for imagen in imagenes_rgb:
        margen = max(8, min(imagen.shape[:2]) // 25)
        bordes.append(np.concatenate([
            imagen[:margen].reshape(-1, 3), imagen[-margen:].reshape(-1, 3),
            imagen[:, :margen].reshape(-1, 3), imagen[:, -margen:].reshape(-1, 3),
        ]))
        luminancia = imagen.sum(2)
        claros.append(imagen[luminancia >= np.percentile(luminancia, 99.5)])
    return np.median(np.concatenate(bordes), 0), np.median(np.concatenate(claros), 0)


def remapear(imagen_rgb, fondo_origen, linea_origen, fondo_destino, linea_destino):
    direccion = linea_origen - fondo_origen
    t = np.clip(((imagen_rgb - fondo_origen) @ direccion) / (direccion @ direccion), 0, 1)[..., None]
    return (fondo_destino + t * (linea_destino - fondo_destino)).round().astype(np.uint8)


def corregir_imagen(entrada, salida, fondo, linea):
    imagen = cv2.imread(str(entrada))[:, :, ::-1].astype(float)
    fondo_origen, linea_origen = calibrar([imagen])
    cv2.imwrite(str(salida), remapear(imagen, fondo_origen, linea_origen, fondo, linea)[:, :, ::-1])
    print(f"imagen: origen fondo {a_hex(fondo_origen)} línea {a_hex(linea_origen)} -> {salida}")


def corregir_video(entrada, salida, fondo, linea):
    video = cv2.VideoCapture(str(entrada))
    total = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
    muestras = []
    for indice in np.linspace(0, total - 1, min(12, total)).astype(int):
        video.set(cv2.CAP_PROP_POS_FRAMES, int(indice))
        leido, cuadro = video.read()
        if leido:
            muestras.append(cuadro[:, :, ::-1].astype(float))
    fondo_origen, linea_origen = calibrar(muestras)
    video.set(cv2.CAP_PROP_POS_FRAMES, 0)
    fps = video.get(cv2.CAP_PROP_FPS)
    ancho, alto = int(video.get(cv2.CAP_PROP_FRAME_WIDTH)), int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
    escritor = cv2.VideoWriter(str(salida), cv2.VideoWriter_fourcc(*"mp4v"), fps, (ancho, alto))
    while True:
        leido, cuadro = video.read()
        if not leido:
            break
        corregido = remapear(cuadro[:, :, ::-1].astype(float), fondo_origen, linea_origen, fondo, linea)
        escritor.write(corregido[:, :, ::-1])
    escritor.release()
    print(f"video: origen fondo {a_hex(fondo_origen)} línea {a_hex(linea_origen)} -> {salida}")


def main():
    analizador = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    analizador.add_argument("entrada")
    analizador.add_argument("salida")
    analizador.add_argument("--fondo", default=FONDO)
    analizador.add_argument("--linea", default=LINEA)
    args = analizador.parse_args()
    fondo, linea = hex_a_rgb(args.fondo), hex_a_rgb(args.linea)
    if Path(args.entrada).suffix.lower() in (".mp4", ".mov", ".webm", ".mkv"):
        corregir_video(args.entrada, args.salida, fondo, linea)
    elif Path(args.entrada).is_file():
        corregir_imagen(args.entrada, args.salida, fondo, linea)
    else:
        sys.exit(f"No existe: {args.entrada}")


if __name__ == "__main__":
    main()
