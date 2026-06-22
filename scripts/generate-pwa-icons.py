"""Generate PWA icons for CodeRoute Guinée.

Outputs to /home/z/my-project/public/icons/:
  - icon-192.png     (192x192, "any" purpose)
  - icon-512.png     (512x512, "any" purpose)
  - icon-maskable-512.png  (512x512, with safe padding for maskable)
  - apple-touch-icon.png   (180x180)
  - favicon-32.png          (32x32)
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path("/home/z/my-project/public/icons")
OUT.mkdir(parents=True, exist_ok=True)

# Guinea tricolor: red / yellow / green
RED = (206, 17, 38)        # #CE1126
YELLOW = (252, 209, 22)    # #FCD116
GREEN = (0, 148, 96)       # #009460
WHITE = (255, 255, 255)
DARK = (26, 35, 50)        # #1A2332

def draw_icon(size: int, maskable: bool = False) -> Image.Image:
    """Render a square icon with green background, white "CR" monogram, and tricolor stripe."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # For "any" purpose: rounded square fill with green.
    # For "maskable": full-bleed green (no rounding, no transparent margins).
    if maskable:
        d.rectangle([0, 0, size, size], fill=GREEN + (255,))
        # Inner content scale: keep within ~80% safe zone.
        margin = int(size * 0.10)
    else:
        # Rounded-square background (full bleed, no transparent corners).
        radius = int(size * 0.18)
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=GREEN + (255,))
        margin = int(size * 0.10)

    # Top tricolor stripe (very subtle, near top edge).
    stripe_h = max(2, int(size * 0.04))
    if maskable:
        stripe_y = margin // 2
    else:
        stripe_y = max(2, int(size * 0.08))
    third_w = size // 3
    d.rectangle([0, stripe_y, third_w, stripe_y + stripe_h], fill=RED + (255,))
    d.rectangle([third_w, stripe_y, 2 * third_w, stripe_y + stripe_h], fill=YELLOW + (255,))
    d.rectangle([2 * third_w, stripe_y, size, stripe_y + stripe_h], fill=GREEN + (255,))

    # Centered "CR" monogram in white.
    # Try DejaVu Sans Bold (always available on the system), then fall back to default.
    font = None
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                font = ImageFont.truetype(path, int(size * 0.40))
                break
            except Exception:
                continue
    if font is None:
        font = ImageFont.load_default()

    text = "CR"
    bbox = d.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    tx = (size - text_w) // 2 - bbox[0]
    ty = (size - text_h) // 2 - bbox[1] + int(size * 0.04)  # slight downward nudge
    # Subtle shadow for legibility.
    shadow_offset = max(1, int(size * 0.012))
    d.text((tx + shadow_offset, ty + shadow_offset), text, font=font, fill=DARK + (80,))
    d.text((tx, ty), text, font=font, fill=WHITE + (255,))

    return img


def main():
    sizes_any = [32, 180, 192, 512]
    for s in sizes_any:
        img = draw_icon(s, maskable=False)
        if s == 32:
            img.save(OUT / "favicon-32.png", format="PNG")
            # Also save as favicon.ico
            img.save(OUT.parent / "favicon.ico", format="ICO", sizes=[(32, 32)])
        elif s == 180:
            img.save(OUT / "apple-touch-icon.png", format="PNG")
        else:
            img.save(OUT / f"icon-{s}.png", format="PNG")
        print(f"  ✓ icon-{s}.png ({s}x{s})")

    img = draw_icon(512, maskable=True)
    img.save(OUT / "icon-maskable-512.png", format="PNG")
    print(f"  ✓ icon-maskable-512.png (512x512, maskable)")

    print("\nAll PWA icons generated in", OUT)


if __name__ == "__main__":
    main()
