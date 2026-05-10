#!/usr/bin/env python3
"""
Solo el logo/badge se mueve. Fondo estático. Full resolution + gifsicle.
"""
from PIL import Image, ImageDraw
import math, os, subprocess

INPUT      = "/Users/nextaisolutionscr/.openclaw/media/inbound/file_4---5679ff67-0e26-49be-a998-9e61d52f2e4e.jpg"
OUTPUT_RAW = "/Users/nextaisolutionscr/.openclaw/media/inbound/seq_v4_raw.gif"
OUTPUT     = "/Users/nextaisolutionscr/.openclaw/media/inbound/seq_v4_hd.gif"

base = Image.open(INPUT).convert("RGBA")
W, H = base.size
print(f"Imagen: {W}x{H}")

scale = W / 1071  # calibrado a la imagen real

# Centros de los badges (en píxeles, ajustados al tamaño real 1071x1280)
# Medidos visualmente: fila de íconos ~y=157, columnas en x = 140, 392, 668, 940
icon_centers = [
    (140, 157),   # Claude
    (392, 157),   # Copilot
    (668, 157),   # Perplexity
    (940, 157),   # OpenClaw
]

BADGE_RADIUS = 54   # radio del círculo que encierra el badge (px en imagen 1071)
BOB_PX       = 18   # píxeles de desplazamiento vertical máximo
FRAMES_PER_ICON = 20
DURATION_MS     = 50

# Pre-computar: para cada ícono, extraer su badge circular y el color de fondo
# El color de fondo es el de la esquina del área (fuera del círculo del badge)

def get_bg_color(img, cx, cy, r):
    """Samplea el color de fondo justo fuera del badge."""
    # Toma un punto a la derecha del badge
    x = min(cx + r + 10, img.width - 1)
    y = cy
    return img.getpixel((x, y))

def make_circle_mask(r):
    """Máscara circular suave."""
    size = r * 2 + 4
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse([2, 2, size - 2, size - 2], fill=255)
    return mask

# Crear máscara una sola vez
mask = make_circle_mask(BADGE_RADIUS)
ms = mask.size[0]

TOTAL_FRAMES = FRAMES_PER_ICON * len(icon_centers)
frames = []

for f in range(TOTAL_FRAMES):
    active = f // FRAMES_PER_ICON
    local_t = (f % FRAMES_PER_ICON) / FRAMES_PER_ICON

    # Movimiento suave: sube y baja (seno de 0→π)
    bob_y = -BOB_PX * math.sin(local_t * math.pi)
    dy = int(round(bob_y))

    # Empezamos desde la imagen base (fondo estático)
    frame = base.copy()

    cx, cy = icon_centers[active]
    if dy != 0:
        # 1) Obtener color de fondo de ese ícono
        bg = get_bg_color(base, cx, cy, BADGE_RADIUS)

        # 2) Borrar el badge original (rellenar con color de fondo)
        pad = BADGE_RADIUS + 2
        erase_area = Image.new("RGBA", (ms, ms), bg[:3] + (255,))
        left = cx - ms // 2
        top  = cy - ms // 2
        frame.paste(erase_area, (left, top), mask)

        # 3) Recortar el badge del BASE (no del frame modificado)
        badge_crop = base.crop((left, top, left + ms, top + ms))

        # 4) Pegar el badge en la posición desplazada
        new_top = top + dy
        frame.paste(badge_crop, (left, new_top), mask)

    frames.append(frame)

# Resize 95% → casi full res, texto legible
fw = int(W * 0.95)
fh = int(H * 0.95)
print(f"Resize a {fw}x{fh}")

quantized = []
for fr in frames:
    r = fr.convert("RGB").resize((fw, fh), Image.LANCZOS)
    quantized.append(r.quantize(colors=256, method=2, dither=1))

print(f"Guardando {TOTAL_FRAMES} frames → raw...")
quantized[0].save(
    OUTPUT_RAW,
    format="GIF",
    save_all=True,
    append_images=quantized[1:],
    loop=0,
    duration=DURATION_MS,
    optimize=True,
    disposal=2,
)
raw_mb = os.path.getsize(OUTPUT_RAW) / 1024 / 1024
print(f"Raw: {raw_mb:.2f} MB → gifsicle -O3...")

res = subprocess.run(
    ["gifsicle", "-O3", "--lossy=20", "-o", OUTPUT, OUTPUT_RAW],
    capture_output=True, text=True
)
if res.returncode == 0:
    mb = os.path.getsize(OUTPUT) / 1024 / 1024
    print(f"✅ {OUTPUT} ({mb:.2f} MB)")
else:
    import shutil; shutil.copy(OUTPUT_RAW, OUTPUT)
    print(f"gifsicle falló, usando raw ({raw_mb:.2f} MB)")
