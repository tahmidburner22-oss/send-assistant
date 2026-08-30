"""
Build script for generating the Collecting Like Terms worksheet PDF.

Uses img2pdf + Pillow to embed source PNG images directly into a
2-page landscape A4 PDF. This produces a pixel-perfect reproduction
of the source images without any re-rendering.

Usage:
    python build.py

Requires:
    pip install img2pdf Pillow
"""

import img2pdf
from PIL import Image
import io
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_DIR = os.path.join(SCRIPT_DIR, "source_images")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "worksheet.pdf")

PAGES = [
    os.path.join(SOURCE_DIR, "p1_full.png"),
    os.path.join(SOURCE_DIR, "p2_full.png"),
]


def rgba_to_rgb_bytes(path):
    """Convert an RGBA PNG to RGB by flattening alpha onto white background."""
    img = Image.open(path).convert("RGBA")
    background = Image.new("RGB", img.size, (255, 255, 255))
    background.paste(img, mask=img.split()[3])
    buf = io.BytesIO()
    background.save(buf, format="PNG", optimize=False)
    buf.seek(0)
    return buf.read()


def main():
    # Verify source images exist
    for page_path in PAGES:
        if not os.path.isfile(page_path):
            raise FileNotFoundError(f"Source image not found: {page_path}")

    # Convert RGBA images to RGB
    page_bytes = [rgba_to_rgb_bytes(p) for p in PAGES]

    # A4 landscape: 297mm x 210mm
    layout = img2pdf.get_layout_fun(
        pagesize=(img2pdf.mm_to_pt(297), img2pdf.mm_to_pt(210)),
        imgsize=None,
        border=None,
        fit=img2pdf.FitMode.into,
        auto_orient=False,
    )

    pdf_bytes = img2pdf.convert(page_bytes, layout_fun=layout)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "wb") as f:
        f.write(pdf_bytes)

    print(f"PDF generated: {OUTPUT_PATH}")
    print(f"  Pages: {len(PAGES)}")
    print(f"  Size: {os.path.getsize(OUTPUT_PATH):,} bytes")


if __name__ == "__main__":
    main()
