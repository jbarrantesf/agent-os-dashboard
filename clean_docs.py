#!/usr/bin/env python3
"""
Limpia el fondo (granito/mesa) de fotos de hojas y las deja como escaneos limpios.
"""
import cv2
import numpy as np
from PIL import Image
import os

INPUT_DIR  = "/Users/nextaisolutionscr/.openclaw/media/inbound"
OUTPUT_DIR = "/Users/nextaisolutionscr/.openclaw/media/inbound/limpias"
os.makedirs(OUTPUT_DIR, exist_ok=True)

files = [
    "file_5---6fc71fb1-2676-4784-88d3-8a0e5fbd7916.jpg",
    "file_6---c66f58d8-b3b7-4b9a-82f7-4bdaf5b8dc51.jpg",
    "file_7---9be937c6-a4d2-498d-a136-ef0594761688.jpg",
    "file_8---c4d6bfdb-2d0b-4588-b94c-e2ffff04bac6.jpg",
    "file_9---d33a5021-dd9f-42fa-a942-d2485192ed37.jpg",
    "file_10---4e741a82-301b-44e0-bf7b-5d3b54305eac.jpg",
]

def order_points(pts):
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect

def four_point_transform(image, pts):
    rect = order_points(pts)
    tl, tr, br, bl = rect
    widthA  = np.linalg.norm(br - bl)
    widthB  = np.linalg.norm(tr - tl)
    maxW    = max(int(widthA), int(widthB))
    heightA = np.linalg.norm(tr - br)
    heightB = np.linalg.norm(tl - bl)
    maxH    = max(int(heightA), int(heightB))
    dst = np.array([[0,0],[maxW-1,0],[maxW-1,maxH-1],[0,maxH-1]], dtype="float32")
    M   = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(image, M, (maxW, maxH))

def enhance_document(img):
    """Blanquea el fondo y satura el texto/colores."""
    # Convertir a Lab para separar luminancia de color
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2Lab)
    l, a, b = cv2.split(lab)

    # CLAHE en el canal L
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    l_clahe = clahe.apply(l)

    # Blanquear fondo: subir brillo de zonas ya claras
    _, mask_bright = cv2.threshold(l_clahe, 200, 255, cv2.THRESH_BINARY)
    l_clean = l_clahe.copy()
    l_clean[mask_bright == 255] = np.minimum(
        l_clean[mask_bright == 255].astype(int) + 30, 255
    ).astype(np.uint8)

    lab_clean = cv2.merge([l_clean, a, b])
    result = cv2.cvtColor(lab_clean, cv2.COLOR_Lab2BGR)

    # Aumentar saturación para que los dibujos/colores se vean bien
    hsv = cv2.cvtColor(result, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:,:,1] = np.clip(hsv[:,:,1] * 1.3, 0, 255)
    hsv[:,:,2] = np.clip(hsv[:,:,2] * 1.05, 0, 255)
    result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

    return result

def find_paper_contour(img):
    """Detecta el contorno de la hoja."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5,5), 0)
    edged = cv2.Canny(blurred, 30, 100)
    edged = cv2.dilate(edged, np.ones((3,3), np.uint8), iterations=2)

    contours, _ = cv2.findContours(edged, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]

    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        area = cv2.contourArea(c)
        img_area = img.shape[0] * img.shape[1]
        if len(approx) == 4 and area > img_area * 0.2:
            return approx.reshape(4, 2).astype("float32")
    return None

for i, fname in enumerate(files, 1):
    path = os.path.join(INPUT_DIR, fname)
    if not os.path.exists(path):
        print(f"[{i}] No encontrado: {fname}")
        continue

    img = cv2.imread(path)
    H, W = img.shape[:2]
    print(f"[{i}] {fname} — {W}x{H}")

    pts = find_paper_contour(img)

    if pts is not None:
        print(f"    ✅ Papel detectado, aplicando perspectiva")
        warped = four_point_transform(img, pts)
        # Si quedó horizontal pero era vertical, rotar
        wH, wW = warped.shape[:2]
        if wW > wH and H > W:
            warped = cv2.rotate(warped, cv2.ROTATE_90_CLOCKWISE)
        enhanced = enhance_document(warped)
    else:
        print(f"    ⚠️  Sin detección de papel, solo mejorando imagen")
        enhanced = enhance_document(img)

    out_name = f"pagina_{i:02d}.jpg"
    out_path = os.path.join(OUTPUT_DIR, out_name)
    cv2.imwrite(out_path, enhanced, [cv2.IMWRITE_JPEG_QUALITY, 92])
    size_kb = os.path.getsize(out_path) // 1024
    print(f"    💾 {out_name} ({size_kb} KB)")

print("\nListo.")
