"""
ws_primitives.py
Shared flowables, layout helpers and style constants for all worksheets.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, Flowable, PageBreak
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT

PAGE_W, PAGE_H = A4
MARGIN     = 18 * mm
CONTENT_W  = PAGE_W - 2 * MARGIN   # ≈ 493 pts / 174 mm

# ── Palette ───────────────────────────────────────────────────────────────────
NAVY  = colors.HexColor('#1B2A4A')
TEAL  = colors.HexColor('#2A6F6F')
MID   = colors.HexColor('#4A4A4A')
LIGHT = colors.HexColor('#888888')
WHITE = colors.white
RULE  = colors.HexColor('#CCCCCC')
SOFT  = colors.HexColor('#F5F5F5')


# ─────────────────────────────────────────────────────────────────────────────
# DiagramBox — every subject-specific diagram lives inside this
# ─────────────────────────────────────────────────────────────────────────────
class DiagramBox(Flowable):
    """
    Wraps any drawing function inside a clipped, padded box.
    The drawing function receives (canvas, inner_w, inner_h) and must draw
    within that rectangle — nothing outside will show.

    Parameters
    ----------
    draw_fn   : callable(canvas, w, h)  — draws content at origin (0,0)
    box_w     : outer width  (pts)
    box_h     : outer height (pts)
    pad       : inner padding on each side (pts)
    show_border : draw a faint border (default False — invisible box)
    """
    def __init__(self, draw_fn, box_w, box_h, pad=4, show_border=False):
        super().__init__()
        self.draw_fn     = draw_fn
        self.box_w       = box_w
        self.box_h       = box_h
        self.pad         = pad
        self.show_border = show_border

    def wrap(self, avW, avH):
        return self.box_w, self.box_h

    def draw(self):
        c   = self.canv
        p   = self.pad
        iw  = self.box_w - 2 * p
        ih  = self.box_h - 2 * p

        c.saveState()
        # Clip to inner rectangle
        path = c.beginPath()
        path.rect(p, p, iw, ih)
        c.clipPath(path, stroke=0, fill=0)
        # Translate so draw_fn uses (0,0) = inner bottom-left
        c.translate(p, p)
        self.draw_fn(c, iw, ih)
        c.restoreState()

        if self.show_border:
            c.setStrokeColor(RULE)
            c.setLineWidth(0.5)
            c.rect(0, 0, self.box_w, self.box_h)


# ─────────────────────────────────────────────────────────────────────────────
# Generic flowables
# ─────────────────────────────────────────────────────────────────────────────
class Rule(Flowable):
    def __init__(self, w=None, thickness=0.4, color=RULE,
                 space_before=2, space_after=6):
        super().__init__()
        self.w            = w
        self.thickness    = thickness
        self.color        = color
        self.space_before = space_before
        self.space_after  = space_after

    def wrap(self, avW, avH):
        self.W = self.w or avW
        return self.W, self.space_before + self.thickness + self.space_after

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, self.space_after, self.W, self.space_after)


class AnswerLines(Flowable):
    def __init__(self, n=4, line_h=11 * mm):
        super().__init__()
        self.n      = n
        self.line_h = line_h

    def wrap(self, avW, avH):
        self.W = avW
        self.H = self.n * self.line_h + 4 * mm
        return self.W, self.H

    def draw(self):
        self.canv.setStrokeColor(RULE)
        self.canv.setLineWidth(0.5)
        y = self.H - self.line_h
        for _ in range(self.n):
            self.canv.line(0, y, self.W, y)
            y -= self.line_h


class PillTrueFalse(Flowable):
    def __init__(self, statements, width=None):
        super().__init__()
        self.statements = statements
        self._width     = width

    def wrap(self, avW, avH):
        self.W     = self._width or avW
        self.row_h = 22 * mm
        self.H     = len(self.statements) * self.row_h
        return self.W, self.H

    def draw(self):
        c      = self.canv
        y      = self.H
        pill_w = 28 * mm
        pill_h = 9  * mm
        gap    = 5  * mm

        for stmt in self.statements:
            y -= 3 * mm
            p = Paragraph(stmt, ParagraphStyle(
                'S', fontName='Helvetica', fontSize=10.5,
                textColor=MID, leading=15))
            _, ph = p.wrap(self.W - 2 * pill_w - gap * 3, 40 * mm)
            p.drawOn(c, 0, y - ph - 2 * mm)

            tx = self.W - 2 * pill_w - gap
            ty = y - pill_h - 3 * mm
            c.setStrokeColor(colors.HexColor('#2A6F6F'))
            c.setLineWidth(1.2)
            c.setFillColor(WHITE)
            c.roundRect(tx, ty, pill_w, pill_h, pill_h / 2, stroke=1, fill=1)
            c.setFillColor(colors.HexColor('#2A6F6F'))
            c.setFont('Helvetica-Bold', 9)
            c.drawCentredString(tx + pill_w / 2, ty + 2.5 * mm, 'TRUE')

            fx = self.W - pill_w
            c.setStrokeColor(colors.HexColor('#8B0000'))
            c.setFillColor(WHITE)
            c.roundRect(fx, ty, pill_w, pill_h, pill_h / 2, stroke=1, fill=1)
            c.setFillColor(colors.HexColor('#8B0000'))
            c.setFont('Helvetica-Bold', 9)
            c.drawCentredString(fx + pill_w / 2, ty + 2.5 * mm, 'FALSE')

            y -= self.row_h - 3 * mm


class MCQOptions(Flowable):
    def __init__(self, options):
        super().__init__()
        self.options = options

    def wrap(self, avW, avH):
        self.W = avW
        self.H = 22 * mm
        return self.W, self.H

    def draw(self):
        c      = self.canv
        r      = 3.5 * mm
        col_w  = self.W / 2
        positions = [
            (0,     self.H / 2),
            (col_w, self.H / 2),
            (0,     0),
            (col_w, 0),
        ]
        labels = ['A', 'B', 'C', 'D']
        for i, (opt, (x, y)) in enumerate(zip(self.options, positions)):
            c.setStrokeColor(NAVY)
            c.setLineWidth(0.8)
            c.setFillColor(WHITE)
            c.circle(x + r + 2 * mm, y + 5 * mm, r, stroke=1, fill=1)
            c.setFillColor(NAVY)
            c.setFont('Helvetica-Bold', 8)
            c.drawCentredString(x + r + 2 * mm, y + 3.8 * mm, labels[i])
            c.setFillColor(MID)
            c.setFont('Helvetica', 10.5)
            c.drawString(x + 2 * r + 5 * mm, y + 3.5 * mm, opt)


# ─────────────────────────────────────────────────────────────────────────────
# Layout helpers
# ─────────────────────────────────────────────────────────────────────────────
def section_header(label, title):
    return [
        Spacer(1, 8 * mm),
        Rule(thickness=1.5, color=NAVY, space_before=0, space_after=4),
        Paragraph(f'<b>{label}</b> \u2014 {title}', ParagraphStyle(
            'SH', fontName='Helvetica-Bold', fontSize=8.5,
            textColor=NAVY, leading=12, letterSpacing=1)),
        Rule(thickness=0.4, color=RULE, space_before=2, space_after=4),
        Spacer(1, 2 * mm),
    ]


def question_block(num, text, marks=None):
    badge_p = Paragraph(f'<b>{num}</b>', ParagraphStyle(
        'NB', fontName='Helvetica-Bold', fontSize=10.5,
        textColor=WHITE, leading=14))
    badge = Table([[badge_p]],
                  colWidths=[6.5 * mm], rowHeights=[6.5 * mm])
    badge.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), NAVY),
        ('ALIGN',         (0,0), (-1,-1), 'CENTER'),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
        ('RIGHTPADDING',  (0,0), (-1,-1), 0),
        ('TOPPADDING',    (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    ms = (f'[{marks} mark{"s" if marks and marks > 1 else ""}]'
          if marks else '')
    qp = Paragraph(
        f'{text}  <font color="#888888" size="9"><i>{ms}</i></font>',
        ParagraphStyle('QB', fontName='Helvetica', fontSize=10.5,
                       textColor=MID, leading=17))
    row = Table([[badge, qp]],
                colWidths=[9 * mm, CONTENT_W - 9 * mm])
    row.setStyle(TableStyle([
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
        ('RIGHTPADDING',  (0,0), (-1,-1), 0),
        ('TOPPADDING',    (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    return [row, Spacer(1, 3 * mm)]


def answer_lines(n=4):
    return [AnswerLines(n=n, line_h=11 * mm), Spacer(1, 2 * mm)]


def side_by_side(left_flowable, right_flowable, left_w, valign='TOP'):
    right_w = CONTENT_W - left_w
    t = Table([[left_flowable, right_flowable]],
              colWidths=[left_w, right_w])
    t.setStyle(TableStyle([
        ('VALIGN',        (0,0), (-1,-1), valign),
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
        ('RIGHTPADDING',  (0,0), (-1,-1), 0),
        ('TOPPADDING',    (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    return t


# ─────────────────────────────────────────────────────────────────────────────
# Page header block (subject · year · exam + title)
# ─────────────────────────────────────────────────────────────────────────────
def page_header(subject_line, title_text):
    hdr = Table([
        [Paragraph(subject_line, ParagraphStyle(
            'HS', fontName='Helvetica', fontSize=9,
            textColor=colors.HexColor('#99BBBB'),
            leading=13, letterSpacing=0.8))],
        [Paragraph(title_text, ParagraphStyle(
            'HT', fontName='Helvetica-Bold', fontSize=20,
            textColor=WHITE, leading=25))],
    ], colWidths=[CONTENT_W])
    hdr.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), NAVY),
        ('LEFTPADDING',   (0,0), (-1,-1), 5 * mm),
        ('RIGHTPADDING',  (0,0), (-1,-1), 5 * mm),
        ('TOPPADDING',    (0,0), (0,0),   4 * mm),
        ('BOTTOMPADDING', (0,0), (0,0),   1 * mm),
        ('TOPPADDING',    (0,1), (0,1),   1 * mm),
        ('BOTTOMPADDING', (0,1), (0,1),   5 * mm),
    ]))
    return hdr


def name_date_class_row():
    fields = Table(
        [['NAME', '_'*38, 'DATE', '_'*20, 'CLASS', '_'*20]],
        colWidths=[11*mm, 55*mm, 10*mm, 32*mm, 12*mm, 32*mm])
    fields.setStyle(TableStyle([
        ('FONT',          (0,0), (-1,-1), 'Helvetica',      9),
        ('TEXTCOLOR',     (0,0), (-1,-1), LIGHT),
        ('FONT',          (0,0), (0, 0),  'Helvetica-Bold', 9),
        ('FONT',          (2,0), (2, 0),  'Helvetica-Bold', 9),
        ('FONT',          (4,0), (4, 0),  'Helvetica-Bold', 9),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING',    (0,0), (-1,-1), 1 * mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1 * mm),
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
    ]))
    return fields


def vocab_section(vocab_pairs):
    """vocab_pairs: list of (term, definition) tuples, up to 8."""
    half = len(vocab_pairs) // 2

    def vc(pair):
        k, v = pair
        return Paragraph(f'<b>{k}</b> {v}',
                         ParagraphStyle('VC', fontName='Helvetica',
                                        fontSize=9.5, textColor=MID, leading=15))

    vt = Table([[vc(vocab_pairs[i]), vc(vocab_pairs[i+half])]
                for i in range(half)],
               colWidths=[CONTENT_W*0.5 - 2*mm, CONTENT_W*0.5 - 2*mm])
    vt.setStyle(TableStyle([
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
        ('RIGHTPADDING',  (0,0), (-1,-1), 4*mm),
        ('TOPPADDING',    (0,0), (-1,-1), 2.5*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
    ]))
    return vt


def mistakes_section(mistakes):
    """mistakes: list of (heading, explanation) tuples."""
    items = []
    for head, body in mistakes:
        mt = Table([[
            Paragraph('\u2717', ParagraphStyle(
                'X', fontName='Helvetica-Bold', fontSize=11,
                textColor=colors.HexColor('#CC0000'), leading=15)),
            Paragraph(
                f'<b>{head}</b><br/>'
                f'<font color="#666666">\u2192 {body}</font>',
                ParagraphStyle('MB', fontName='Helvetica', fontSize=9.5,
                               textColor=MID, leading=14)),
        ]], colWidths=[6*mm, CONTENT_W - 6*mm])
        mt.setStyle(TableStyle([
            ('VALIGN',        (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING',   (0,0), (-1,-1), 0),
            ('RIGHTPADDING',  (0,0), (-1,-1), 0),
            ('TOPPADDING',    (0,0), (-1,-1), 1*mm),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2*mm),
        ]))
        items.append(mt)
    return items


def worked_example_section(rows):
    """rows: list of (label, content) tuples."""
    wet = Table([
        [Paragraph(f'<b>{k}</b>', ParagraphStyle(
             'WK', fontName='Helvetica-Bold', fontSize=10,
             textColor=colors.black, leading=16)),
         Paragraph(v, ParagraphStyle(
             'WV', fontName='Helvetica', fontSize=10,
             textColor=MID, leading=16))]
        for k, v in rows
    ], colWidths=[22*mm, CONTENT_W - 22*mm])
    wet.setStyle(TableStyle([
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
        ('RIGHTPADDING',  (0,0), (-1,-1), 0),
        ('TOPPADDING',    (0,0), (-1,-1), 2.5*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
    ]))
    return wet


def word_bank(words, cols=4):
    per_row = cols
    rows = [words[i:i+per_row] for i in range(0, len(words), per_row)]
    col_w = CONTENT_W / per_row
    wb = Table(
        [[Paragraph(f'<b>{w}</b>', ParagraphStyle(
             'WB', fontName='Helvetica-Bold', fontSize=10,
             textColor=colors.black, leading=14))
          for w in row]
         for row in rows],
        colWidths=[col_w] * per_row)
    wb.setStyle(TableStyle([
        ('BOX',           (0,0), (-1,-1), 0.5, RULE),
        ('INNERGRID',     (0,0), (-1,-1), 0.4, RULE),
        ('TOPPADDING',    (0,0), (-1,-1), 3*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3*mm),
        ('ALIGN',         (0,0), (-1,-1), 'CENTER'),
    ]))
    return wb


def section_subhead(text):
    return Paragraph(text, ParagraphStyle(
        'KVH', fontName='Helvetica-Bold', fontSize=8, textColor=TEAL,
        leading=12, letterSpacing=1.2))


def challenge_block(marks, context_text, task_intro, parts):
    items = []
    items.append(Spacer(1, 2*mm))
    items.append(Rule(thickness=1.5, color=NAVY, space_before=0, space_after=4))
    items.append(Paragraph('\u2605  CHALLENGE QUESTION', ParagraphStyle(
        'CH', fontName='Helvetica-Bold', fontSize=9, textColor=NAVY,
        leading=13, letterSpacing=0.8)))
    items.append(Paragraph(f'[{marks} marks]', ParagraphStyle(
        'CHM', fontName='Helvetica-Oblique', fontSize=9,
        textColor=LIGHT, leading=12)))
    items.append(Spacer(1, 2*mm))
    items.append(Paragraph(context_text, ParagraphStyle(
        'CHB', fontName='Helvetica', fontSize=10.5, textColor=MID, leading=17)))
    items.append(Spacer(1, 3*mm))
    items.append(Paragraph(task_intro, ParagraphStyle(
        'CHB2', fontName='Helvetica', fontSize=10.5, textColor=MID, leading=16)))
    for part in parts:
        items.append(Paragraph(f'&nbsp;&nbsp;&nbsp;&nbsp;{part}', ParagraphStyle(
            'CHP', fontName='Helvetica', fontSize=10.5, textColor=MID, leading=17)))
    items.append(Spacer(1, 3*mm))
    return items


def self_reflection_page(topics):
    items = []
    items.append(section_subhead('SELF REFLECTION'))
    items.append(Rule(thickness=1, color=TEAL, space_before=0, space_after=6))
    items.append(Paragraph('Review your understanding before moving on.',
        ParagraphStyle('SRS', fontName='Helvetica-Oblique', fontSize=10,
            textColor=LIGHT, leading=14)))
    items.append(Spacer(1, 4*mm))
    items.append(Paragraph(
        'A  How confident do you feel? Tick the column that best describes you.',
        ParagraphStyle('CQ', fontName='Helvetica', fontSize=10.5,
            textColor=MID, leading=16)))
    items.append(Spacer(1, 3*mm))

    def th(t, align=TA_CENTER):
        return Paragraph(f'<b>{t}</b>', ParagraphStyle(
            'TH', fontName='Helvetica-Bold', fontSize=10,
            textColor=colors.black, leading=14, alignment=align))

    conf_data = (
        [[th('Topic', TA_CENTER), th('Not Yet'), th('Getting There'), th('Confident')]] +
        [[Paragraph(t, ParagraphStyle('TR', fontName='Helvetica', fontSize=10,
              textColor=MID, leading=14)),
          Paragraph('\u25cb', ParagraphStyle('TC', fontName='Helvetica', fontSize=14,
              textColor=LIGHT, leading=14, alignment=TA_CENTER)),
          Paragraph('\u25cb', ParagraphStyle('TC', fontName='Helvetica', fontSize=14,
              textColor=LIGHT, leading=14, alignment=TA_CENTER)),
          Paragraph('\u25cb', ParagraphStyle('TC', fontName='Helvetica', fontSize=14,
              textColor=LIGHT, leading=14, alignment=TA_CENTER))]
         for t in topics]
    )
    ct = Table(conf_data,
               colWidths=[CONTENT_W*0.48, CONTENT_W*0.17,
                          CONTENT_W*0.20,  CONTENT_W*0.15])
    ct.setStyle(TableStyle([
        ('BOX',           (0,0), (-1,-1), 0.5, RULE),
        ('INNERGRID',     (0,0), (-1,-1), 0.4, RULE),
        ('BACKGROUND',    (0,0), (-1, 0), SOFT),
        ('TOPPADDING',    (0,0), (-1,-1), 3*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3*mm),
        ('LEFTPADDING',   (0,0), (-1,-1), 3*mm),
        ('ALIGN',         (1,0), (-1,-1), 'CENTER'),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ]))
    items.append(ct)
    items.append(Spacer(1, 6*mm))
    items.append(Paragraph('B  Written reflection \u2014 complete each prompt below.',
        ParagraphStyle('WR', fontName='Helvetica', fontSize=10.5,
            textColor=MID, leading=16)))
    items.append(Spacer(1, 4*mm))
    for prompt in [
        'One concept I feel confident about is ...',
        'One area I still need to practise is ...',
        'A question I still want to ask my teacher is ...',
    ]:
        items.append(Paragraph(prompt, ParagraphStyle(
            'RP', fontName='Helvetica-Oblique', fontSize=10,
            textColor=LIGHT, leading=15)))
        items.append(AnswerLines(n=2, line_h=10*mm))
        items.append(Spacer(1, 2*mm))

    items.append(Spacer(1, 4*mm))
    items.append(Rule(thickness=1, color=NAVY, space_before=0, space_after=5))
    items.append(Paragraph(
        'Exit Ticket: Write ONE thing you learned today in one sentence:',
        ParagraphStyle('ET', fontName='Helvetica-Bold', fontSize=10.5,
            textColor=colors.black, leading=16)))
    items.append(AnswerLines(n=2, line_h=11*mm))
    return items


def answer_key_header():
    RED = colors.HexColor('#7B0000')
    hd = Table([[
        Paragraph('TEACHER COPY \u2014 ANSWER KEY', ParagraphStyle(
            'AKH', fontName='Helvetica-Bold', fontSize=16,
            textColor=WHITE, leading=22)),
        Paragraph('Not for Student Distribution', ParagraphStyle(
            'AKS', fontName='Helvetica-Oblique', fontSize=10,
            textColor=colors.HexColor('#FFAAAA'), leading=14,
            alignment=TA_RIGHT)),
    ]], colWidths=[CONTENT_W*0.65, CONTENT_W*0.35])
    hd.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), RED),
        ('LEFTPADDING',   (0,0), (-1,-1), 5*mm),
        ('RIGHTPADDING',  (0,0), (-1,-1), 5*mm),
        ('TOPPADDING',    (0,0), (-1,-1), 5*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5*mm),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ]))
    return hd, RED


def ak_section(label, title, RED):
    return [
        Rule(thickness=1, color=RED, space_before=4, space_after=4),
        Paragraph(f'<b>{label}</b> \u2014 {title}', ParagraphStyle(
            'AS', fontName='Helvetica-Bold', fontSize=9,
            textColor=RED, leading=13, letterSpacing=0.8)),
        Spacer(1, 2*mm),
    ]


def ak_question(num, marks, text, RED):
    t = Table([[
        Paragraph(f'<b>Q{num}</b>', ParagraphStyle(
            'AN', fontName='Helvetica-Bold', fontSize=10,
            textColor=colors.black, leading=14)),
        Paragraph(text, ParagraphStyle(
            'AA', fontName='Helvetica', fontSize=10,
            textColor=MID, leading=15)),
        Paragraph(f'<b>{marks}m</b>', ParagraphStyle(
            'AM', fontName='Helvetica-Bold', fontSize=10,
            textColor=RED, leading=14, alignment=TA_RIGHT)),
    ]], colWidths=[10*mm, CONTENT_W - 22*mm, 12*mm])
    t.setStyle(TableStyle([
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
        ('RIGHTPADDING',  (0,0), (-1,-1), 0),
        ('TOPPADDING',    (0,0), (-1,-1), 2*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3*mm),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('LINEBELOW',     (0,0), (-1, 0), 0.3, RULE),
    ]))
    return [t]
