#!/usr/bin/env python3
"""
Animate the icon areas in the comparison image with pulsing glow + float effects.
Outputs animated GIF.
"""
from PIL import Image, ImageDraw, ImageFilter
import math, os

INPUT = "/Users/nextaisolutionscr/.openclaw/media/inbound/file_4---5679ff67-0e26-49be-a998-9e61d52f2e4e.jpg"
OUTPUT = "/Users/nextaisolutionscr/.openclaw/media/inbound/animated_icons.gif"

img = Image.open(INPUT).convert("RGBA")
W, H = img.size
print(f"Image size: {W}x{H}")

# Icon center positions (x, y) and approximate radius — tuned to the image
# The icons sit inside rounded-square badges near the top row
# Image is ~988x1280 based on typical LinkedIn infographic proportions
# Let's scale relative to width
# Columns at roughly 12.5%, 37.5%, 62.5%, 87.5% of width
# Icons vertically centered around y ≈ 155px in a ~988px wide image
# Let's detect by fraction:

scale = W / 988  # base reference width

icons = [
    # (cx_frac, cy_frac, color)  — fractions of image dimensions
    (0.130, 0.122, (220, 80,  50,  180)),   # Claude  — orange-red glow
    (0.365, 0.122, (80,  130, 220, 180)),   # Copilot — blue glow
    (0.625, 0.122, (120, 120, 140, 180)),   # Perplexity — gray glow
    (0.878, 0.122, (220, 80,  80,  180)),   # OpenClaw — red-pink glow
]

FRAMES = 24        # frames per loop
DURATION = 80      # ms per frame

frames = []

for f in range(FRAMES):
    t = f / FRAMES  # 0 → 1

    # Create a fresh copy each frame
    frame = img.copy()
    overlay = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    for cx_frac, cy_frac, color in icons:
        cx = int(cx_frac * W)
        cy = int(cy_frac * H)

        # --- Pulsing glow ring ---
        # Phase offset per icon so they're staggered
        icon_idx = icons.index((cx_frac, cy_frac, color))
        phase = t + icon_idx * 0.25  # stagger by 90°
        pulse = 0.5 + 0.5 * math.sin(phase * 2 * math.pi)  # 0→1 oscillation

        base_r = int(48 * scale)
        glow_r = base_r + int(12 * scale * pulse)
        alpha = int(60 + 100 * pulse)

        r, g, b, _ = color
        glow_color = (r, g, b, alpha)

        # Outer glow (soft, large)
        for layer in range(4, 0, -1):
            lr = glow_r + layer * int(5 * scale)
            la = alpha // (layer + 1)
            draw.ellipse(
                [cx - lr, cy - lr, cx + lr, cy + lr],
                fill=(r, g, b, la)
            )

        # --- Float: tiny vertical bob ---
        bob = int(4 * scale * math.sin(phase * 2 * math.pi))

        # Bright inner ring highlight
        ring_r = base_r + int(4 * scale * pulse)
        draw.ellipse(
            [cx - ring_r, cy - ring_r + bob, cx + ring_r, cy + ring_r + bob],
            outline=(255, 255, 255, int(180 * pulse)),
            width=max(1, int(2 * scale))
        )

    # Blur the overlay for soft glow
    overlay_blurred = overlay.filter(ImageFilter.GaussianBlur(radius=int(8 * scale)))

    # Composite
    frame = Image.alpha_composite(frame, overlay_blurred)

    frames.append(frame.convert("RGBA"))

print(f"Saving {FRAMES} frames to {OUTPUT} ...")

# Save as animated GIF
frames[0].save(
    OUTPUT,
    format="GIF",
    save_all=True,
    append_images=frames[1:],
    loop=0,
    duration=DURATION,
    optimize=False,
    disposal=2,
)

size_mb = os.path.getsize(OUTPUT) / 1024 / 1024
print(f"Done! {OUTPUT} ({size_mb:.1f} MB)")
