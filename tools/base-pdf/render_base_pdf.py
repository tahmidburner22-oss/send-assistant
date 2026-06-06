#!/usr/bin/env python3
"""
render_base_pdf.py — Render a canonical *base* worksheet JSON to a print-ready PDF.

This is a faithful, dependency-light mirror of the secondary (navy) header and
section cards produced by the live React renderer
(client/src/components/WorksheetRenderer.tsx). It is intended for previewing the
neutral BASE document — i.e. BEFORE any SEND overlay / reading-age / tier change.

It deliberately does NOT apply any SEND adaptation (no cream overlay, no
OpenDyslexic font, no one-question-per-page). Those are layered on at serve time
by the overlay engine. The base document is the single source of truth.

Usage:
    python3 render_base_pdf.py <input.json> <output.pdf> [--logo path] [--view student|teacher]

Header branding (logo + school name):
  - In the live app these come from the teacher's Settings (preferences).
  - For the base-document export they default to the JSON `branding` block,
    falling back to the product logo at client/public/logo.png.
"""
import argparse
import json
import os
from datetime import date

from fpdf import FPDF

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
FONT_DIR = os.path.join(HERE, "fonts")

# ── Palette (mirrors WorksheetRenderer secondary/navy header) ────────────────
NAVY = (27, 42, 74)        # #1B2A4A header block
NAVY_TEXT = (26, 39, 68)   # #1a2744 school name
SUBTLE = (153, 187, 187)   # #99BBBB small caps line on navy
GREY = (107, 114, 128)     # #6b7280
DARK = (31, 41, 55)        # #1f2937 body text
RULE = (209, 213, 219)     # #d1d5db divider

# Per-type accent + label (student-visible card styling)
SECTION_STYLE = {
    "objective":       {"accent": (79, 70, 229),  "label": "LEARNING OBJECTIVE"},
    "vocabulary":      {"accent": (13, 148, 136),  "label": "KEY WORDS"},
    "prior-knowledge": {"accent": (217, 119, 6),   "label": "RECAP"},
    "example":         {"accent": (37, 99, 235),   "label": "WORKED EXAMPLE"},
    "q-mcq":           {"accent": (30, 42, 74),     "label": "QUESTION"},
    "q-gap-fill":      {"accent": (30, 42, 74),     "label": "QUESTION"},
    "q-true-false":    {"accent": (30, 42, 74),     "label": "QUESTION"},
    "q-short-answer":  {"accent": (30, 42, 74),     "label": "QUESTION"},
    "q-extended":      {"accent": (30, 42, 74),     "label": "QUESTION"},
    "q-label-diagram": {"accent": (30, 42, 74),     "label": "QUESTION"},
    "q-data-table":    {"accent": (30, 42, 74),     "label": "QUESTION"},
    "common-mistakes": {"accent": (194, 65, 12),    "label": "COMMON MISTAKES"},
    "self-reflection": {"accent": (22, 163, 74),    "label": "HOW DID I DO?"},
    "section-header":  {"accent": (71, 85, 105),    "label": "SECTION"},
    "diagram":         {"accent": (71, 85, 105),    "label": "DIAGRAM"},
    "mark-scheme":     {"accent": (30, 42, 74),     "label": "TEACHER KEY & MARK SCHEME"},
}
DEFAULT_STYLE = {"accent": (71, 85, 105), "label": "SECTION"}

PAGE_W, PAGE_H = 210, 297
MARGIN = 14
CONTENT_W = PAGE_W - 2 * MARGIN


class BaseWorksheetPDF(FPDF):
    def __init__(self, meta):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.meta = meta
        self.set_auto_page_break(auto=True, margin=MARGIN)
        self.set_margins(MARGIN, MARGIN, MARGIN)
        # Unicode fonts (² ³ √ × − ☐ • ✗ etc.)
        self.add_font("DejaVu", "", os.path.join(FONT_DIR, "DejaVuSans.ttf"))
        self.add_font("DejaVu", "B", os.path.join(FONT_DIR, "DejaVuSans-Bold.ttf"))
        self.add_font("DejaVu", "I", os.path.join(FONT_DIR, "DejaVuSans-Oblique.ttf"))

    # The repeated page footer (small print like the live export)
    def footer(self):
        self.set_y(-12)
        self.set_font("DejaVu", "", 7)
        self.set_text_color(*GREY)
        left = self.meta.get("school_name", "Adaptly")
        self.cell(0, 6, left, align="L")
        self.set_x(MARGIN)
        self.cell(CONTENT_W, 6, f"Page {self.page_no()}", align="R")


def info_line(meta):
    parts = [meta.get("subject"), meta.get("year_group")]
    board = meta.get("exam_board")
    if board and board.lower() not in ("general", "none", ""):
        parts.append(board.upper())
    return "  ·  ".join([p for p in parts if p])


def draw_header(pdf: BaseWorksheetPDF, meta, logo_path):
    # ── Top info bar: logo + school name (left) | subject·year·board (right) ──
    top_y = pdf.get_y()
    logo_h = 11
    text_x = MARGIN
    if logo_path and os.path.exists(logo_path):
        pdf.image(logo_path, x=MARGIN, y=top_y, h=logo_h)
        text_x = MARGIN + logo_h + 3
    pdf.set_xy(text_x, top_y + 1.5)
    pdf.set_font("DejaVu", "B", 10)
    pdf.set_text_color(*NAVY_TEXT)
    pdf.cell(0, 5, meta.get("school_name", "Adaptly").upper())
    # right-aligned info line
    pdf.set_xy(MARGIN, top_y + 2)
    pdf.set_font("DejaVu", "", 8)
    pdf.set_text_color(*GREY)
    pdf.cell(CONTENT_W, 5, info_line(meta).upper(), align="R")

    pdf.set_y(top_y + logo_h + 2)

    # ── Navy filled title block ──
    block_x, block_y = MARGIN, pdf.get_y()
    title = meta.get("title", "Worksheet")
    subtitle = meta.get("subtitle", "")
    pad = 4
    # measure title height
    pdf.set_font("DejaVu", "B", 18)
    title_lines = pdf.multi_cell(CONTENT_W - 2 * pad, 7.5, title, dry_run=True, output="LINES")
    block_h = pad + 4.5 + 7.5 * len(title_lines) + (5 if subtitle else 0) + pad
    pdf.set_fill_color(*NAVY)
    pdf.rect(block_x, block_y, CONTENT_W, block_h, style="F")
    # small caps line
    pdf.set_xy(block_x + pad, block_y + pad)
    pdf.set_font("DejaVu", "", 7.5)
    pdf.set_text_color(*SUBTLE)
    pdf.cell(0, 4, info_line(meta).upper())
    # title
    pdf.set_xy(block_x + pad, block_y + pad + 4.5)
    pdf.set_font("DejaVu", "B", 18)
    pdf.set_text_color(255, 255, 255)
    pdf.multi_cell(CONTENT_W - 2 * pad, 7.5, title)
    # subtitle
    if subtitle:
        pdf.set_x(block_x + pad)
        pdf.set_font("DejaVu", "", 9.5)
        pdf.set_text_color(220, 224, 230)
        pdf.cell(0, 5, subtitle)
    pdf.set_y(block_y + block_h + 4)

    # ── Name / Date / Class bar ──
    fields = meta.get("header_fields", ["Name", "Date", "Class"])
    bar_y = pdf.get_y()
    pdf.set_font("DejaVu", "B", 8)
    x = MARGIN
    line_widths = {"Name": 46, "Date": 30, "Class": 30, "Teacher": 36}
    for f in fields:
        pdf.set_xy(x, bar_y)
        pdf.set_text_color(*DARK)
        label = f.upper()
        lw = pdf.get_string_width(label) + 2
        pdf.cell(lw, 6, label)
        underline_w = line_widths.get(f, 34)
        ux = x + lw
        pdf.set_draw_color(*DARK)
        pdf.set_line_width(0.4)
        pdf.line(ux, bar_y + 5, ux + underline_w, bar_y + 5)
        if f == "Date":
            pdf.set_xy(ux, bar_y)
            pdf.set_font("DejaVu", "", 8)
            pdf.set_text_color(*GREY)
            pdf.cell(underline_w, 5.5, date.today().strftime("%d/%m/%Y"), align="C")
            pdf.set_font("DejaVu", "B", 8)
        x = ux + underline_w + 8
    pdf.set_y(bar_y + 7)
    pdf.set_draw_color(*RULE)
    pdf.set_line_width(0.5)
    pdf.line(MARGIN, pdf.get_y(), PAGE_W - MARGIN, pdf.get_y())
    pdf.set_y(pdf.get_y() + 5)


def draw_section(pdf: BaseWorksheetPDF, section, index=None):
    stype = section.get("type", "")
    style = SECTION_STYLE.get(stype, DEFAULT_STYLE)
    accent = style["accent"]
    title = section.get("title") or style["label"]
    marks = section.get("marks")

    # Title bar
    bar_h = 7.5

    # ── Keep title bar + content together: if the whole card won't fit in the
    # remaining space on this page, start a fresh page first. ──
    content_preview = section.get("content", "") or ""
    pdf.set_font("DejaVu", "", 9.5)
    est_lines = pdf.multi_cell(CONTENT_W - 5, 5.2, content_preview,
                               dry_run=True, output="LINES")
    est_h = bar_h + 5 + 5.2 * max(1, len(est_lines)) + 4
    remaining = PAGE_H - MARGIN - pdf.get_y()
    if est_h > remaining and est_h < (PAGE_H - 2 * MARGIN):
        pdf.add_page()
    pdf.set_fill_color(*accent)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("DejaVu", "B", 10)
    x0, y0 = MARGIN, pdf.get_y()
    pdf.rect(x0, y0, CONTENT_W, bar_h, style="F")
    pdf.set_xy(x0 + 3, y0)
    pdf.cell(CONTENT_W - 30, bar_h, title)
    if marks is not None:
        pdf.set_xy(x0 + CONTENT_W - 33, y0 + 1.25)
        pdf.set_fill_color(255, 255, 255)
        pdf.set_text_color(*accent)
        pdf.set_font("DejaVu", "B", 8)
        badge = f"{marks} mark" + ("" if marks == 1 else "s")
        pdf.cell(30, 5, badge, align="C", fill=True, border=0)
    pdf.set_y(y0 + bar_h)

    # Content box
    content = section.get("content", "") or ""
    pdf.set_font("DejaVu", "", 9.5)
    pdf.set_text_color(*DARK)
    pdf.set_draw_color(*RULE)
    pdf.set_line_width(0.3)
    pdf.set_x(MARGIN)
    pdf.multi_cell(CONTENT_W, 5.2, content, border="LRB", padding=2.5)
    pdf.set_y(pdf.get_y() + 4)


def render(input_json, output_pdf, logo_path, view):
    with open(input_json, "r", encoding="utf-8") as f:
        data = json.load(f)

    branding = data.get("branding", {}) or {}
    meta = {
        "subject": data.get("subject", ""),
        "year_group": data.get("yearGroup", ""),
        "exam_board": data.get("examBoard", ""),
        "title": data.get("title", "Worksheet"),
        "subtitle": data.get("subtitle", ""),
        "school_name": branding.get("schoolName", "Adaptly"),
        "header_fields": branding.get("headerFields", ["Name", "Date", "Class"]),
    }

    pdf = BaseWorksheetPDF(meta)
    pdf.set_title(meta["title"])
    pdf.add_page()
    draw_header(pdf, meta, logo_path)

    for i, section in enumerate(data.get("sections", [])):
        draw_section(pdf, section, i)

    if view == "teacher":
        teacher = data.get("teacher_sections", [])
        if teacher:
            pdf.add_page()
            pdf.set_font("DejaVu", "B", 9)
            pdf.set_text_color(*GREY)
            pdf.cell(0, 6, "TEACHER COPY — not for pupil distribution", align="C")
            pdf.ln(8)
            for section in teacher:
                draw_section(pdf, section)

    os.makedirs(os.path.dirname(os.path.abspath(output_pdf)), exist_ok=True)
    pdf.output(output_pdf)
    return output_pdf


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input_json")
    ap.add_argument("output_pdf")
    ap.add_argument("--logo", default=os.path.join(REPO, "client", "public", "logo.png"))
    ap.add_argument("--view", choices=["student", "teacher"], default="teacher")
    args = ap.parse_args()
    out = render(args.input_json, args.output_pdf, args.logo, args.view)
    print(f"Wrote {out} ({os.path.getsize(out)} bytes)")


if __name__ == "__main__":
    main()
