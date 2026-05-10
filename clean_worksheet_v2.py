#!/usr/bin/env python3
"""
Convierte fotos de hojas escolares a escaneos limpios.
Elimina todo lo del alumno (lápiz, lapicero, coloreado).
Deja solo el contenido original impreso/escrito del maestro.
"""
import cv2
import numpy as np
import os

INPUT_DIR  = "/Users/nextaisolutionscr/.openclaw/media/inbound/limpias"
OUTPUT_DIR = "/Users/nextaisolutionscr/.openclaw/media/inbound/limpias/clean2"
os.makedirs(OUTPUT_DIR, exist_ok=True)

files = [f"pagina_{i:02d}.jpg" for i in range(1, 7)]

def clean_worksheet(img):
    H, W = img.shape[:2]

    # 1. Convertir a HSV para filtrar colores
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    s = hsv[:,:,1]
    v = hsv[:,:,2]
    h = hsv[:,:,0]

    # 2. Máscara de "colores a eliminar":
    #    - Lápiz: gris (s<40, v entre 80-230)
    #    - Lapicero azul: h=100-145, s>30
    #    - Coloreado crayón: s>45 (saturado) y no muy oscuro
    mask_erase = np.zeros((H, W), dtype=bool)

    # Lápiz / marcas grises claras
    mask_erase |= (s < 40) & (v > 85) & (v < 235)

    # Lapicero azul
    mask_erase |= ((h >= 95) & (h <= 150)) & (s >= 25) & (v > 40)

    # Coloreado saturado (crayón/lápiz color) - excluye negro
    mask_erase |= (s > 45) & (v > 75)

    # 3. Imagen inicial: reemplazar zonas a eliminar con blanco
    clean = img.copy()
    clean[mask_erase] = [255, 255, 255]

    # 4. Convertir a escala de grises
    gray = cv2.cvtColor(clean, cv2.COLOR_BGR2GRAY)

    # 5. Normalización del fondo: divide por la imagen de fondo estimada
    #    (morfología para extraer fondo local)
    kernel_bg = cv2.getStructuringElement(cv2.MORPH_RECT, (51, 51))
    background = cv2.morphologyEx(gray, cv2.MORPH_DILATE, kernel_bg)
    normalized = cv2.divide(gray, background, scale=255)

    # 6. Umbralización adaptativa — limpia y nítida
    binary = cv2.adaptiveThreshold(
        normalized,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=25,
        C=8
    )

    # 7. Pequeño denoising para quitar ruido de pixel
    binary = cv2.medianBlur(binary, 3)

    # 8. Convertir de vuelta a BGR (JPEG necesita BGR o RGB)
    result = cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)

    return result

for i, fname in enumerate(files, 1):
    path = os.path.join(INPUT_DIR, fname)
    if not os.path.exists(path):
        print(f"[{i}] No encontrado: {fname}")
        continue

    img = cv2.imread(path)
    print(f"[{i}] {fname} {img.shape[1]}x{img.shape[0]}")

    result = clean_worksheet(img)

    out_name = f"clean_{i:02d}.jpg"
    out_path = os.path.join(OUTPUT_DIR, out_name)
    cv2.imwrite(out_path, result, [cv2.IMWRITE_JPEG_QUALITY, 95])
    print(f"    ✅ {out_name} ({os.path.getsize(out_path)//1024} KB)")

print("\nListo.")
