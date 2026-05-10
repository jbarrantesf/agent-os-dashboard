#!/usr/bin/env python3
"""
Animación secuencial HD: cada ícono sube y baja uno por uno.
Resolución completa, optimizado con gifsicle.
"""
from PIL import Image
import math, os, subprocess

INPUT  = "/Users/nextaisolutionscr/.openclaw/media/inbound/file_4---5679ff67-0e26-49be-a998-9e61d52f2e4e.jpg"
OUTPUT_RAW = "/Users/nextaisolutionscr/.openclaw/media/inbound/animated_seq_raw.gif"
OUTPUT     = "/Users/nextaisolutionscr/.openclaw/media/inbound/animated_seq_hd.gif"

base = Image.open(INPUT).convert("RGBA")
W, H = base.size
print(f"Imagen: {W}x{H}")

scale   = W / 988
badge_r = int(58 * scale)
BOB_PX  = int(16 * scale)

icon_coords = [
    (0.130, 0.122),
    (0.365, 0.122),
    (0.625, 0.122),
    (0.878, 0.122),
]

FRAMES_PER_ICON = 18
N_ICONS = len(icon_coords)
TOTAL_FRAMES = FRAMES_PER_ICON * N_ICONS
DURATION_MS = 55

frames = []

for f in range(TOTAL_FRAMES):
    active_icon = f // FRAMES_PER_ICON
    local_t     = (f % FRAMES_PER_ICON) / FRAMES_PER_ICON

    frame = base.copy()

    for idx, (cx_frac, cy_frac) in enumerate(icon_coords):
        if idx != active_icon:
            continue

        cx = int(cx_frac * W)
        cy = int(cy_frac * H)

        bob_y = -BOB_PX * math.sin(local_t * math.pi)
        dy = int(bob_y)
        if dy == 0:
            continue

        pad  = badge_r + 8
        left   = max(0, cx - pad)
        top    = max(0, cy - pad)
        right  = min(W, cx + pad)
        bottom = min(H, cy + pad)

        # Restaurar fondo
        patch_clean = base.crop((left, top, right, bottom))
        frame.paste(patch_clean, (left, top))

        # Pegar badge desplazado
        badge_patch = base.crop((left, top, right, bottom))
        dst_top    = max(0, top + dy)
        dst_bottom = min(H, bottom + dy)
        src_y = max(0, -dy) if dy < 0 else 0
        crop_h = dst_bottom - dst_top
        badge_sub = badge_patch.crop((0, src_y, right - left, src_y + crop_h))
        frame.paste(badge_sub, (left, dst_top))

    # Resize 85% — legible y más liviano que full
    fw = int(W * 0.85)
    fh = int(H * 0.85)
    frame_r = frame.convert("RGB").resize((fw, fh), Image.LANCZOS)
    frames.append(frame_r.quantize(colors=256, method=2, dither=1))

print(f"Guardando {TOTAL_FRAMES} frames ({fw}x{fh}) raw...")
frames[0].save(
    OUTPUT_RAW,
    format="GIF",
    save_all=True,
    append_images=frames[1:],
    loop=0,
    duration=DURATION_MS,
    optimize=True,
    disposal=2,
)
raw_mb = os.path.getsize(OUTPUT_RAW) / 1024 / 1024
print(f"Raw: {raw_mb:.2f} MB → optimizando con gifsicle...")

result = subprocess.run(
    ["gifsicle", "-O3", "--lossy=30", "-o", OUTPUT, OUTPUT_RAW],
    capture_output=True, text=True
)
if result.returncode == 0:
    final_mb = os.path.getsize(OUTPUT) / 1024 / 1024
    print(f"✅ Listo: {OUTPUT} ({final_mb:.2f} MB)")
else:
    print(f"gifsicle error: {result.stderr}")
    # fallback: usar raw
    import shutil
    shutil.copy(OUTPUT_RAW, OUTPUT)
    print(f"Usando raw: {raw_mb:.2f} MB")
