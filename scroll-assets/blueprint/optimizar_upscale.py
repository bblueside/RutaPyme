"""Optimiza los masters reescalados (2560x1440) para el recorrido de frontend/landing/.

Plan: docs/landing/plan-assets-upscale.md (decisiones D4-D10, D16).

Entradas (no se versionan, ver .gitignore):
    frontend/landing/videos/upscale/<nombre>_2K_upscaled.mp4

Salidas (versionadas por nombre, el sufijo VERSION invalida la caché de Render):
    frontend/landing/videos/1080/<nombre>.<VERSION>.av1.mp4          AV1  1080p 16 fps GOP 8, crf por presupuesto
    frontend/landing/videos/720/<nombre>.<VERSION>.h264.mp4          H.264 720p 16 fps GOP 8
    frontend/landing/videos/720/<nombre>.<VERSION>.movil.av1.mp4     AV1   720p 16 fps GOP 4
    frontend/landing/videos/720/<nombre>.<VERSION>.movil.h264.mp4    H.264 720p 16 fps GOP 4
    frontend/landing/escenas/opt/escena_N.<VERSION>-{1280,1920,2560}.{avif,jpg}

Los pósteres salen del fotograma 0 del clip codificado (1280 y 1920) para que no haya salto
al pasar del póster al video; el de 2560 sale del fotograma 0 del master, con la misma
conversión de color, porque el clip de 1080p no tiene esa resolución.

Uso (desde la raíz del repositorio):
    python scroll-assets/blueprint/optimizar_upscale.py
    python scroll-assets/blueprint/optimizar_upscale.py --solo escena_1
    python scroll-assets/blueprint/optimizar_upscale.py --forzar
    python scroll-assets/blueprint/optimizar_upscale.py --presupuesto escena_4=4.0

Omite lo ya generado (el crf elegido queda en optimizar_upscale_informe.json).
"""
import argparse
import json
import math
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
LANDING = RAIZ / "frontend" / "landing"
MASTERS = LANDING / "videos" / "upscale"
SALIDA_1080 = LANDING / "videos" / "1080"
SALIDA_720 = LANDING / "videos" / "720"
SALIDA_ESCENAS = LANDING / "escenas" / "opt"
INFORME = Path(__file__).with_name("optimizar_upscale_informe.json")

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
VERSION = "v2"
FPS = 16

CLIPS = ["escena_1", "escena_2", "escena_3", "escena_4", "conector_2_3", "conector_3_4"]
ESCENAS = ["escena_1", "escena_2", "escena_3", "escena_4"]
# Costuras del recorrido: (clip que termina, clip que empieza).
COSTURAS = [("escena_1", "escena_2"), ("escena_2", "conector_2_3"), ("conector_2_3", "escena_3"),
            ("escena_3", "conector_3_4"), ("conector_3_4", "escena_4")]

# D7: presupuesto de peso (MB) de cada clip AV1 1080p. escena_1 ≤ 1,9 MB (M2); el resto ≈ 3,3 MB de media.
PRESUPUESTO_MB = {"escena_1": 1.9, "escena_2": 3.3, "escena_3": 3.3, "escena_4": 3.3,
                  "conector_2_3": 3.3, "conector_3_4": 3.3}
CRF_AV1_INICIAL = 34
CRF_AV1_MAXIMO = 40
CRF_AV1_MOVIL = 36        # D9: AV1 720p, sin presupuesto (se informa el peso)
CRF_H264_ESCRITORIO = 26  # D8
CRF_H264_MOVIL = 27       # D9
SSIM_MINIMO = 0.98        # M3 / CA-U5
ANCHOS_POSTER = [1280, 1920, 2560]
CALIDAD_AVIF = 60
CALIDAD_JPEG = 82
FONDO_RGB = (1, 70, 193)  # #0146C1
TOLERANCIA_FONDO = 3
ANCHO_COSTURA = 640

COLOR_BT709 = ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"]


# ---------------------------------------------------------------- utilidades de ffmpeg

def ejecutar_ffmpeg(argumentos, capturar_error=False):
    comando = [FFMPEG, "-hide_banner", "-y", "-loglevel", "info" if capturar_error else "error", *argumentos]
    resultado = subprocess.run(comando, capture_output=True, text=True)
    if resultado.returncode != 0:
        raise RuntimeError(f"ffmpeg falló:\n{' '.join(comando)}\n{resultado.stderr[-2000:]}")
    return resultado.stderr


def filtro_video(alto):
    return f"fps={FPS},scale=-2:{alto}:flags=lanczos,format=yuv420p"


def codificar_av1(maestro, destino, alto, crf, gop):
    ejecutar_ffmpeg([
        "-i", str(maestro), "-vf", filtro_video(alto), "-fps_mode", "cfr", "-an",
        "-c:v", "libaom-av1", "-crf", str(crf), "-b:v", "0", "-cpu-used", "4", "-row-mt", "1",
        "-g", str(gop), "-keyint_min", str(gop), *COLOR_BT709,
        "-movflags", "+faststart", str(destino)])


def codificar_h264(maestro, destino, alto, crf, gop):
    ejecutar_ffmpeg([
        "-i", str(maestro), "-vf", filtro_video(alto), "-fps_mode", "cfr", "-an",
        "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-profile:v", "high",
        "-g", str(gop), "-keyint_min", str(gop), "-sc_threshold", "0", *COLOR_BT709,
        "-movflags", "+faststart", str(destino)])


def medir_ssim(codificado, maestro, alto):
    """SSIM del clip codificado contra el master escalado y reducido a los mismos fps (1 = idéntico)."""
    filtro = (f"[0:v]setpts=PTS-STARTPTS[a];[1:v]{filtro_video(alto)},setpts=PTS-STARTPTS[b];[a][b]ssim")
    salida = ejecutar_ffmpeg(["-i", str(codificado), "-i", str(maestro), "-lavfi", filtro, "-f", "null", "-"],
                             capturar_error=True)
    coincidencias = re.findall(r"All:([0-9.]+)", salida)
    if not coincidencias:
        raise RuntimeError("ffmpeg no informó el SSIM")
    return float(coincidencias[-1])


def extraer_fotograma(clip, destino_png, ancho=None, ultimo=False):
    """Guarda un fotograma como PNG RGB completo (rango tv bt709 -> pc)."""
    tamano = f"{ancho}:-2" if ancho else "iw:ih"
    filtro = f"scale={tamano}:flags=lanczos:in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24"
    entrada = ["-sseof", "-1"] if ultimo else []
    final = ["-update", "1"] if ultimo else ["-frames:v", "1"]
    ejecutar_ffmpeg([*entrada, "-i", str(clip), "-vf", filtro, *final, str(destino_png)])


def megabytes(ruta):
    return ruta.stat().st_size / 1_000_000


# ---------------------------------------------------------------- informe persistente

def cargar_informe():
    if INFORME.exists():
        return json.loads(INFORME.read_text(encoding="utf-8"))
    return {"videos": {}}


def guardar_informe(informe):
    INFORME.write_text(json.dumps(informe, indent=2, ensure_ascii=False), encoding="utf-8")


# ---------------------------------------------------------------- generación de videos

def generar_av1_1080(nombre, maestro, presupuesto, informe, forzar):
    destino = SALIDA_1080 / f"{nombre}.{VERSION}.av1.mp4"
    clave = f"{nombre}.av1"
    if destino.exists() and not forzar and clave in informe["videos"]:
        print(f"  [omitido] {destino.name}")
        return destino
    crf, intentos = CRF_AV1_INICIAL, []
    temporal = destino.with_suffix(".tmp.mp4")
    while True:
        inicio = time.time()
        codificar_av1(maestro, temporal, 1080, crf, 8)
        peso = megabytes(temporal)
        intentos.append((crf, peso))
        print(f"  {nombre} AV1 1080p crf {crf}: {peso:.2f} MB (presupuesto {presupuesto:.2f}) "
              f"en {time.time() - inicio:.0f} s")
        if peso <= presupuesto or crf >= CRF_AV1_MAXIMO:
            break
        # El peso baja ~6 % por punto de crf; con dos intentos se usa la pendiente medida.
        if len(intentos) >= 2 and intentos[-1][0] != intentos[-2][0]:
            (crf_a, peso_a), (crf_b, peso_b) = intentos[-2], intentos[-1]
            pendiente = math.log(peso_b / peso_a) / (crf_b - crf_a)
        else:
            pendiente = math.log(0.94)
        paso = math.ceil(math.log(presupuesto / peso) / pendiente) if pendiente < 0 else 1
        crf = min(CRF_AV1_MAXIMO, crf + max(1, paso))
    temporal.replace(destino)
    informe["videos"][clave] = {"crf": crf, "presupuesto_mb": presupuesto}
    return destino


def generar_variante(nombre, maestro, etiqueta, destino, alto, codificador, crf, gop, informe, forzar):
    clave = f"{nombre}.{etiqueta}"
    if destino.exists() and not forzar and clave in informe["videos"]:
        print(f"  [omitido] {destino.name}")
        return destino
    inicio = time.time()
    temporal = destino.with_suffix(".tmp.mp4")
    codificador(maestro, temporal, alto, crf, gop)
    temporal.replace(destino)
    informe["videos"][clave] = {"crf": crf}
    print(f"  {nombre} {etiqueta} crf {crf} GOP {gop}: {megabytes(destino):.2f} MB en {time.time() - inicio:.0f} s")
    return destino


def generar_videos(nombres, presupuestos, informe, forzar):
    archivos = {}
    for nombre in nombres:
        maestro = MASTERS / f"{nombre}_2K_upscaled.mp4"
        if not maestro.exists():
            sys.exit(f"Falta el master {maestro}")
        print(f"\n== {nombre}")
        base720 = SALIDA_720 / f"{nombre}.{VERSION}"
        archivos[nombre] = {
            "av1": generar_av1_1080(nombre, maestro, presupuestos[nombre], informe, forzar),
            "h264": generar_variante(nombre, maestro, "h264", Path(f"{base720}.h264.mp4"), 720,
                                     codificar_h264, CRF_H264_ESCRITORIO, 8, informe, forzar),
            "movil.av1": generar_variante(nombre, maestro, "movil.av1", Path(f"{base720}.movil.av1.mp4"), 720,
                                          codificar_av1, CRF_AV1_MOVIL, 4, informe, forzar),
            "movil.h264": generar_variante(nombre, maestro, "movil.h264", Path(f"{base720}.movil.h264.mp4"), 720,
                                           codificar_h264, CRF_H264_MOVIL, 4, informe, forzar),
        }
        guardar_informe(informe)
    return archivos


# ---------------------------------------------------------------- pósteres

def color_de_esquinas(imagen_bgr):
    """Mediana por canal (RGB) de los cuatro bordes de 24 px: el fondo que rodea la escena."""
    alto, ancho = imagen_bgr.shape[:2]
    lado = 24
    parches = [imagen_bgr[:lado, :lado], imagen_bgr[:lado, -lado:], imagen_bgr[-lado:, :lado], imagen_bgr[-lado:, -lado:]]
    mediana = np.median(np.concatenate([p.reshape(-1, 3) for p in parches]), axis=0)
    return tuple(int(v) for v in mediana[::-1])


def generar_posters(nombres, forzar):
    resultados = {}
    for nombre in nombres:
        clip = SALIDA_1080 / f"{nombre}.{VERSION}.av1.mp4"
        maestro = MASTERS / f"{nombre}_2K_upscaled.mp4"
        resultados[nombre] = {}
        for ancho in ANCHOS_POSTER:
            avif = SALIDA_ESCENAS / f"{nombre}.{VERSION}-{ancho}.avif"
            jpeg = SALIDA_ESCENAS / f"{nombre}.{VERSION}-{ancho}.jpg"
            if avif.exists() and jpeg.exists() and not forzar:
                imagen = cv2.imread(str(jpeg))
            else:
                with tempfile.TemporaryDirectory() as carpeta:
                    png = Path(carpeta) / "fotograma.png"
                    # 1080p no alcanza para el póster de 2560: ese sale del master.
                    fuente = maestro if ancho > 1920 else clip
                    extraer_fotograma(fuente, png, ancho=ancho)
                    pil = Image.open(png).convert("RGB")
                pil.save(avif, "AVIF", quality=CALIDAD_AVIF, speed=4)
                pil.save(jpeg, "JPEG", quality=CALIDAD_JPEG, optimize=True, progressive=True, subsampling="4:2:0")
                imagen = cv2.imread(str(jpeg))
            resultados[nombre][ancho] = {"avif_kb": avif.stat().st_size / 1000, "jpg_kb": jpeg.stat().st_size / 1000,
                                         "fondo_rgb": color_de_esquinas(imagen)}
        print(f"  pósteres {nombre}: " + ", ".join(
            f"{a}px AVIF {resultados[nombre][a]['avif_kb']:.0f} KB" for a in ANCHOS_POSTER))
    return resultados


# ---------------------------------------------------------------- costuras

def diferencia_costura(clip_final, clip_inicial):
    with tempfile.TemporaryDirectory() as carpeta:
        ultimo, primero = Path(carpeta) / "ultimo.png", Path(carpeta) / "primero.png"
        extraer_fotograma(clip_final, ultimo, ancho=ANCHO_COSTURA, ultimo=True)
        extraer_fotograma(clip_inicial, primero, ancho=ANCHO_COSTURA)
        a, b = cv2.imread(str(ultimo)).astype(float), cv2.imread(str(primero)).astype(float)
    if a.shape != b.shape:
        b = cv2.resize(b, (a.shape[1], a.shape[0]))
    return float(np.abs(a - b).mean())


# ---------------------------------------------------------------- informe

def imprimir_informe(nombres, archivos, informe, posters, forzar_ssim):
    print("\n" + "=" * 78 + "\nINFORME\n" + "=" * 78)
    totales = {"av1": 0.0, "h264": 0.0, "movil.av1": 0.0, "movil.h264": 0.0}
    incumplen = []
    print(f"{'clip':<14}{'variante':<12}{'MB':>7}{'crf':>5}{'SSIM':>9}")
    for nombre in nombres:
        for variante, ruta in archivos[nombre].items():
            peso = megabytes(ruta)
            totales[variante] += peso
            clave = f"{nombre}.{variante}"
            registro = informe["videos"][clave]
            if "ssim" not in registro or forzar_ssim:
                alto = 1080 if variante == "av1" else 720
                registro["ssim"] = medir_ssim(ruta, MASTERS / f"{nombre}_2K_upscaled.mp4", alto)
            marca = ""
            if variante == "av1" and registro["ssim"] < SSIM_MINIMO:
                marca = "  < SSIM mínimo"
                incumplen.append(f"{clave}: SSIM {registro['ssim']:.3f}")
            if variante == "av1" and peso > registro.get("presupuesto_mb", math.inf):
                marca += "  > presupuesto"
                incumplen.append(f"{clave}: {peso:.2f} MB sobre el presupuesto")
            print(f"{nombre:<14}{variante:<12}{peso:>7.2f}{registro['crf']:>5}{registro['ssim']:>9.3f}{marca}")
        guardar_informe(informe)

    print("\nTotales por perfil (MB, solo clips):")
    for variante, total in totales.items():
        print(f"  {variante:<12}{total:>7.1f}")
    if "escena_1" in nombres:
        peso_primero = megabytes(archivos["escena_1"]["av1"])
        print(f"\nHasta mover la escena 1 (AV1): {peso_primero:.2f} MB de clip "
              f"+ {posters['escena_1'][1920]['avif_kb'] / 1000:.2f} MB de póster")

    if posters:
        print("\nColor de fondo de los pósteres (objetivo #0146C1 = 1, 70, 193, ±3):")
        for nombre, anchos in posters.items():
            for ancho, datos in anchos.items():
                fondo = datos["fondo_rgb"]
                bien = all(abs(c - o) <= TOLERANCIA_FONDO for c, o in zip(fondo, FONDO_RGB))
                print(f"  {nombre}-{ancho}: {fondo} {'OK' if bien else 'FUERA DE TOLERANCIA'}")
                if not bien:
                    incumplen.append(f"póster {nombre}-{ancho}: fondo {fondo}")

    print("\nCosturas (diferencia media 0-255, clips AV1 1080p; masters en el plan §1.2):")
    for final, inicial in COSTURAS:
        if final in archivos and inicial in archivos:
            print(f"  {final} -> {inicial}: "
                  f"{diferencia_costura(archivos[final]['av1'], archivos[inicial]['av1']):.2f}")

    print("\nResultado:", "CUMPLE todo" if not incumplen else "REVISAR")
    for linea in incumplen:
        print("  -", linea)


def main():
    analizador = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    analizador.add_argument("--solo", nargs="+", choices=CLIPS, help="procesar solo estos clips")
    analizador.add_argument("--forzar", action="store_true", help="regenerar aunque ya exista")
    analizador.add_argument("--presupuesto", nargs="+", default=[], metavar="CLIP=MB",
                            help="cambia el presupuesto AV1 1080p de un clip")
    argumentos = analizador.parse_args()

    presupuestos = dict(PRESUPUESTO_MB)
    for par in argumentos.presupuesto:
        nombre, _, valor = par.partition("=")
        presupuestos[nombre] = float(valor)
    nombres = argumentos.solo or CLIPS

    for carpeta in (SALIDA_1080, SALIDA_720, SALIDA_ESCENAS):
        carpeta.mkdir(parents=True, exist_ok=True)

    informe = cargar_informe()
    archivos = generar_videos(nombres, presupuestos, informe, argumentos.forzar)
    print("\n== Pósteres")
    posters = generar_posters([n for n in nombres if n in ESCENAS], argumentos.forzar)
    imprimir_informe(nombres, archivos, informe, posters, argumentos.forzar)


if __name__ == "__main__":
    main()
