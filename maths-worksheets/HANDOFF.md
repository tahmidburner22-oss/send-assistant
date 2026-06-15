# Maths Worksheets — Session Handoff

> **Purpose:** Anyone (including a fresh chat session) can continue this project from this document alone. Read it top-to-bottom, then run the resume command at the bottom.

---

## 1. What this project is

Generate one **JSON worksheet** + one **PDF worksheet** for every maths subtopic in the SEND Assistant curriculum. The JSON is the SEND-overlay-ready library file; the PDF is the printable rendered output. Total target: **194 worksheets** across **54 topics**.

The full subtopic list with filenames is in [`PLAN.md`](./PLAN.md).

---

## 2. Repository layout

```
send-assistant/maths-worksheets/
├── PLAN.md                                ← full 194-subtopic checklist (status column)
├── HANDOFF.md                             ← THIS FILE
├── scripts/
│   ├── generate_worksheet.py              ← JSON → PDF renderer (WeasyPrint)
│   └── build_batch_1.py                   ← Batch 1 content generator (11 worksheets)
│   └── build_batch_N.py                   ← (future batches add files here)
├── json/                                  ← all generated JSON worksheet files
└── pdf/                                   ← all rendered PDF files
```

---

## 3. The two key fixes already applied

If the rendering ever looks broken, check these are still in place:

1. **Modelled-examples row uses `<table>` layout, not absolute positioning.** Earlier attempt with `position:absolute` + `flex` silently dropped Examples 1 & 2. The current `mod-tbl` table layout (in `scripts/generate_worksheet.py`) is the working pattern.
2. **`&frac{N}{M}` is preprocessed → `<sup>N</sup>⁄<sub>M</sub>`.** That entity is not standard HTML. The `deep_preprocess()` function at the top of `generate_worksheet.py` does the conversion. Always run JSON files through this generator (never edit the PDF directly).

---

## 4. Layout reference (current page-2 measurements)

| Block | Top | Height |
|-------|-----|--------|
| `.prac-wrap` (Your turn) | 0mm | **73mm** ← grew from 65mm |
| `.prac-mixed` (section 5) | inside | **23mm** ← grew from 15mm |
| `.misc-wrap` (Misconceptions) | 75mm | 44mm |
| `.chal-wrap` (Challenge) | 121mm | **38mm** ← shrunk from 47mm |
| `.foot-row` (Footer) | bottom 0 | 36mm |

Page margins: `5mm 6mm` (was `7mm 9mm`). `.page` size: `285mm × 200mm`.

---

## 5. JSON schema (what every worksheet file must contain)

```jsonc
{
  "title": "TOPIC NAME,\n(SUBTOPIC NAME)",
  "objective": "LO: I can ...",
  "send_mode": false,
  "info_boxes": {
    "key_terms":    { "id":"key_terms",    "title":"...", "content": [{"type":"paragraph","text":"..."}, {"type":"paragraph","text":"..."}] },
    "what_we_learn":{ "id":"what_we_learn","title":"...", "examples":[ {"correct":true,"expr":"...","desc":"..."}, ... 5 items ] },
    "key_idea":     { "id":"key_idea",     "title":"Key idea", "text":"...", "equation":"...", "caption":"..." }
  },
  "modelled_examples": [
    {"id":"ex1","card_color":"#1F5FA6","card_bg":"#EEF3FF","label":"Example 1 – ...","question":"...","steps":["...","...","..."],"answer":"...","explanation":"..."},
    /* ex2 also blue, ex3 red #CC0000/#FFF0F0, ex4 green #1E7D2E/#EDFAEE */
  ],
  "practice": [
    /* 5 sections — sections 1&2 blue, 3 red, 4 green, 5 purple */
    {"id":"p1","number":1,"heading":"...","heading_color":"#1F5FA6","bg_color":"#EEF3FF","border_color":"#1F5FA6","instruction":"...","linked_example":"ex1","questions":[{"id":"a","expression":"...","answer":"..."}, /* 4 items */]}
    /* p5 has 5 questions instead of 4 (rendered in the wide bottom row) */
  ],
  "misconceptions": { "items":[ {"id":"a","statement":"...","correct":true|false}, /* 5 items */ ] },
  "challenge":      { "problems":[ {"id":"a","text":"..."}, {"id":"b","text":"..."} ] }
}
```

---

## 6. Progress tracker

| Status | Count | List |
|--------|-------|------|
| ✅ Done | **14** | 078, 079, 081 (samples), 088, 089, 090, 091, 092, 093, 094, 095, 096, 099, 100 |
| ⬜ Remaining | **180** | see `PLAN.md` for the numbered list |

### Topics fully complete
- **Multiplication & division foundation** (Topics 26, 27, 28, 29 — all but Long mult/div, Factor pairs/commutativity, Short mult/div)

### Topics partially complete
- **FDP (Topic 22):** 3 of 4 done — only `080-percentage-change.json` remaining

### Topics not yet started
- Topics 1–21 (lower-primary number, fractions, addition/subtraction, counting, place value)
- Topics 23–25 (Functions, Indices, Linear Inequalities)
- Topics 30–54 (Percentages, Place Value, Probability, Proportion, Pythagoras, Quadratics, Ratio, Sequences, Simultaneous Equations, Solving Linear Equations, Statistics, Straight-Line Graphs, Surds, Transformations, Trigonometry, Vectors, Volume & Surface Area)
- A few residual maths/M&D ones: Long mult (098), Long div (097), Factor pairs (101), Short mult (103), Short div (102)

---

## 7. How to resume in a NEW chat

Run this once at the start to make sure the toolchain is ready:

```bash
# 1. Make sure the repo is checked out and on the right branch
cd /projects/sandbox/send-assistant
git fetch origin && git checkout feat/maths-worksheets-plan
git pull --ff-only

# 2. Make sure WeasyPrint (and pango) are installed
which weasyprint || pip install weasyprint
ldconfig -p | grep libpango || dnf install -y pango gdk-pixbuf2

# 3. Sanity-check the renderer with a known-good worksheet
python3 maths-worksheets/scripts/generate_worksheet.py \
  maths-worksheets/json/088-10-times-table.json /tmp/sanity.pdf
```

If `/tmp/sanity.pdf` opens and shows all 4 modelled examples correctly, you're set.

---

## 8. How to add the NEXT batch

1. Pick the next 10–15 subtopics from `PLAN.md` (look at "⬜ Remaining" rows).
2. Create `maths-worksheets/scripts/build_batch_N.py` modeled on `build_batch_1.py`. The helper functions there (`practice()`, `example()`, `write_ws()`) make a worksheet ~80 lines of Python.
3. Run it: `python3 maths-worksheets/scripts/build_batch_N.py`
4. Generate PDFs:
   ```bash
   for j in maths-worksheets/json/<your-prefixes>*.json; do
     python3 maths-worksheets/scripts/generate_worksheet.py \
       "$j" "maths-worksheets/pdf/$(basename ${j%.json}.pdf)"
   done
   ```
5. Spot-check 2-3 PDFs (extract text with pypdfium2 and confirm "Example 1"–"Example 4" all appear; confirm no `&frac{` leaks).
6. Update `HANDOFF.md` Section 6 (Progress tracker) — move completed items into the ✅ row.
7. Commit and push:
   ```bash
   git add maths-worksheets/
   git commit -m "feat(worksheets): batch N — <topic summary> (+N worksheets)"
   # then push via github_push_to_remote tool
   ```

---

## 9. Content-quality checklist (per worksheet)

- [ ] Title is 2 lines: TOPIC NAME (line 1), (SUBTOPIC NAME) in brackets (line 2)
- [ ] Objective starts with `LO: I can ...`
- [ ] Key terms paragraph 1 has `<span class="ul-b">` and `<span class="ul-k">` markup
- [ ] What-we-learn shows **3 correct + 2 incorrect** examples
- [ ] All 4 modelled examples have label, question, exactly 3 steps, answer, explanation
- [ ] Practice section 1 = scaffolded recall, 2 = standard, 3 = harder/negative variant, 4 = applied, 5 = mixed
- [ ] Section 5 has **5** questions (a–e), all others have **4** (a–d)
- [ ] 5 misconceptions, mix of correct & incorrect
- [ ] 2 challenge problems, real-world context, multi-step
- [ ] No literal `&frac{N}{M}` placeholders — ONLY use them in JSON; the renderer converts them
- [ ] After PDF generation, extract text and confirm all 4 example labels present

---

## 10. PR / branch info

- **Branch:** `feat/maths-worksheets-plan`
- **PR #179:** https://github.com/tahmidburner22-oss/send-assistant/pull/179
- All work pushes to this branch. Do not merge until all 194 are done (or split into smaller PRs if preferred).
