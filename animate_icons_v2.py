#!/usr/bin/env python3
"""
Animación secuencial: cada ícono sube y baja uno por uno, en ciclo continuo.
"""
from PIL import Image, ImageDraw
import math, os

INPUT  = "/Users/nextaisolutionscr/.openclaw/media/inbound/file_4---5679ff67-0e26-49ba-a998-9e61d52f2e4e.jpg"
# fallback path
if not os.path.exists(INPUT):
    INPUT = "/Users/nextaisolutionscr/.openclaw/media/inbound/file_4---5679ff67-0e26-49be-a998-9e61d52f2e4e.jpg"
OUTPUT = "/Users/nextaisolutionscr/.openclaw/media/inbound/animated_seq.gif"

base = Image.open(INPUT).convert("RGBA")
W, H = base.size
print(f"Imagen: {W}x{H}")

# Posiciones de los íconos (centro x, centro y como fracción de la imagen)
# Fila de íconos está alrededor del 12% vertical
icon_coords = [
    (0.130, 0.122),   # Claude
    (0.365, 0.122),   # Copilot
    (0.625, 0.122),   # Perplexity
    (0.878, 0.122),   # OpenClaw
]

# Cada ícono tiene un badge redondeado – necesitamos copiar esa región y moverla
scale = W / 988
badge_r = int(52 * scale)   # radio del área a cortar/mover
BOB_PX  = int(14 * scale)   # cuántos píxeles sube/baja el ícono

FRAMES_PER_ICON = 16   # frames que dura el bob de cada ícono
N_ICONS = len(icon_coords)
TOTAL_FRAMES = FRAMES_PER_ICON * N_ICONS
DURATION_MS = 60       # ms por frame → total ~3.8s por ciclo

frames = []

for f in range(TOTAL_FRAMES):
    # Qué ícono está activo ahora
    active_icon = f // FRAMES_PER_ICON
    local_t     = (f % FRAMES_PER_ICON) / FRAMES_PER_ICON  # 0→1 dentro del bob

    frame = base.copy()

    for idx, (cx_frac, cy_frac) in enumerate(icon_coords):
        cx = int(cx_frac * W)
        cy = int(cy_frac * H)

        if idx != active_icon:
            # Íconos inactivos: quietos, sin cambio
            continue

        # Movimiento: sube suavemente y vuelve (ciclo seno completo)
        # sin(0→π) → sube y baja en una sola pasada
        bob_y = -BOB_PX * math.sin(local_t * math.pi)
        dy = int(bob_y)

        if dy == 0:
            continue

        # --- Recortar el badge original y pegarlo desplazado ---
        pad = badge_r + 6
        left   = max(0, cx - pad)
        top    = max(0, cy - pad)
        right  = min(W, cx + pad)
        bottom = min(H, cy + pad)

        # Parche "limpio" que restaura el fondo debajo del badge original
        patch_clean = base.crop((left, top, right, bottom))
        frame.paste(patch_clean, (left, top))

        # Parche del badge movido
        badge_patch = base.crop((left, top, right, bottom))
        # Destination desplazada
        dst_left = left
        dst_top  = top + dy
        dst_right  = right
        dst_bottom = bottom + dy

        # Clip al canvas
        dst_left   = max(0, dst_left)
        dst_top    = max(0, dst_top)
        dst_right  = min(W, dst_right)
        dst_bottom = min(H, dst_bottom)

        # Ajustar parche si se salió del canvas por arriba
        src_x = 0
        src_y = max(0, -dy) if dy < 0 else 0
        crop_w = dst_right  - dst_left
        crop_h = dst_bottom - dst_top

        badge_sub = badge_patch.crop((src_x, src_y, src_x + crop_w, src_y + crop_h))
        frame.paste(badge_sub, (dst_left, dst_top))

    # Resize 65% para mantener GIF liviano
    fw = int(W * 0.65)
    fh = int(H * 0.65)
    frame_small = frame.convert("RGB").resize((fw, fh), Image.LANCZOS)
    frames.append(frame_small.quantize(colors=200, method=2))

print(f"Guardando {TOTAL_FRAMES} frames ({fw}x{fh}) → {OUTPUT}")
frames[0].save(
    OUTPUT,
    format="GIF",
    save_all=True,
    append_images=frames[1:],
    loop=0,
    duration=DURATION_MS,
    optimize=True,
)
size_mb = os.path.getsize(OUTPUT) / 1024 / 1024
print(f"Listo: {size_mb:.2f} MB")
