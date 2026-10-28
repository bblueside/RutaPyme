"""Diferencia media absoluta (0-255) entre dos imágenes del mismo tamaño: medir.py a.png b.png"""
import sys, cv2, numpy as np
a, b = (cv2.imread(r).astype(float) for r in sys.argv[1:3])
if a.shape != b.shape: b = cv2.resize(b, (a.shape[1], a.shape[0]))
print(f"{sys.argv[1]} vs {sys.argv[2]}: {np.abs(a-b).mean():.2f}/255")
