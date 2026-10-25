"""Mosaico 3x2 de 6 fotogramas repartidos: mosaico.py clip.mp4 salida.png"""
import sys, cv2, numpy as np
video = cv2.VideoCapture(sys.argv[1]); total = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
print("fotogramas", total, "fps", video.get(cv2.CAP_PROP_FPS))
cuadros = []
for i in np.linspace(0, total - 1, 6).astype(int):
    video.set(cv2.CAP_PROP_POS_FRAMES, int(i)); ok, c = video.read()
    cuadros.append(cv2.resize(c, (640, 360)))
cv2.imwrite(sys.argv[2], np.vstack([np.hstack(cuadros[:3]), np.hstack(cuadros[3:])]))
