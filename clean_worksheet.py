#!/usr/bin/env python3
"""
Limpia hojas de ejercicios: elimina lápiz, lapicero y coloreado del alumno.
Deja solo el contenido impreso original.
"""
import cv2
import numpy as np
import os

INPUT_DIR  = "/Users/nextaisolutionscr/.openclaw/media/inbound/limpias"
OUTPUT_DIR = "/Users/nextaisolutionscr/.openclaw/media/inbound/limpias/clean"
os.makedirs(OUTPUT_DIR, exist_ok=True)

files = [f"pagina_{i:02d}.jpg" for i in range(1, 7)]

def remove_handwriting(img):
    """
    Elimina:
    - Lápiz: gris (baja saturación, brillo medio)
    - Lapicero azul: azul-violeta (H 100-140)
    - Coloreado de crayón: colores saturados que no son negro impreso
    Conserva: negro puro del texto/dibujos impresos
    """
    result = img.copy()
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[:,:,0], hsv[:,:,1], hsv[:,:,2]

    # --- 1. Lápiz (gris): baja saturación, brillo medio ---
    mask_pencil = (s < 35) & (v > 90) & (v < 230)

    # --- 2. Lapicero azul/violeta (chulitos del prof) ---
    mask_pen_blue = (
        ((h >= 95) & (h <= 145)) & (s >= 40) & (v > 60)
    )
    # También azul más oscuro
    mask_pen_dark = (
        ((h >= 95) & (h <= 145)) & (s >= 20) & (v > 40) & (v < 130)
    )

    # --- 3. Coloreado de crayón: colores saturados no-negro ---
    # Verde, amarillo, rojo, morado, azul claro con saturación alta
    mask_crayon = (s > 50) & (v > 80)
    # Excluir negro impreso: muy oscuro
    mask_black_printed = (v < 60)
    mask_crayon = mask_crayon & ~mask_black_printed

    # --- Combinar todas las máscaras ---
    mask_remove = mask_pencil | mask_pen_blue | mask_pen_dark | mask_crayon

    # Dilatar ligeramente para cubrir bordes
    kernel = np.ones((3,3), np.uint8)
    mask_remove_dilated = cv2.dilate(mask_remove.astype(np.uint8)*255, kernel, iterations=1)

    # Aplicar: reemplazar con blanco
    result[mask_remove_dilated == 255] = [255, 255, 255]

    # --- Reforzar negro del texto impreso ---
    # Lo que queda muy oscuro -> hacerlo más negro
    gray_result = cv2.cvtColor(result, cv2.COLOR_BGR2GRAY)
    _, text_mask = cv2.threshold(gray_result, 80, 255, cv2.THRESH_BINARY_INV)
    result[text_mask == 255] = [20, 20, 20]

    # --- Blanquear fondo (zonas casi blancas) ---
    gray2 = cv2.cvtColor(result, cv2.COLOR_BGR2GRAY)
    bright_mask = gray2 > 200
    result[bright_mask] = [255, 255, 255]

    return result

for i, fname in enumerate(files, 1):
    path = os.path.join(INPUT_DIR, fname)
    if not os.path.exists(path):
        print(f"[{i}] No encontrado: {fname}")
        continue

    img = cv2.imread(path)
    print(f"[{i}] Procesando {fname}...")
    clean = remove_handwriting(img)

    out_name = f"clean_{i:02d}.jpg"
    out_path = os.path.join(OUTPUT_DIR, out_name)
    cv2.imwrite(out_path, clean, [cv2.IMWRITE_JPEG_QUALITY, 93])
    print(f"    ✅ {out_name} ({os.path.getsize(out_path)//1024} KB)")

print("\nListo.")
