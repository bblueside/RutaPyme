"""Funde los primeros N fotogramas de un clip desde un fotograma de costura real (OpenCV).
Uso: fundir_inicio.py clip.mp4 costura.png N salida.mp4
El fotograma 0 queda idéntico a la costura y en N pasa por completo al clip."""
import sys, cv2, numpy as np
clip, costura, n, salida = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
inicio = cv2.imread(costura).astype(float)
video = cv2.VideoCapture(clip)
escritor = cv2.VideoWriter(salida, cv2.VideoWriter_fourcc(*"mp4v"), video.get(cv2.CAP_PROP_FPS),
                           (int(video.get(cv2.CAP_PROP_FRAME_WIDTH)), int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))))
indice = 0
while True:
    leido, cuadro = video.read()
    if not leido: break
    if indice < n:
        peso = 0.5 - 0.5 * np.cos(np.pi * indice / n)  # entrada y salida suaves
        cuadro = ((1 - peso) * inicio + peso * cuadro).round().astype(np.uint8)
    escritor.write(cuadro); indice += 1
escritor.release(); print(f"{salida}: {indice} fotogramas, fundido en {n}")
