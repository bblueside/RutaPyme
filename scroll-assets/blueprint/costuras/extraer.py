"""Extrae el primer o el último fotograma REAL de un clip: extraer.py clip.mp4 primero|ultimo salida.png"""
import sys, cv2
clip, cual, salida = sys.argv[1:4]
video = cv2.VideoCapture(clip)
cuadros = []
while True:
    leido, cuadro = video.read()
    if not leido: break
    cuadros.append(cuadro)
    if cual == "primero": break
    cuadros = cuadros[-1:]
cv2.imwrite(salida, cuadros[-1])
print(clip, cual, "->", salida, cuadros[-1].shape)
