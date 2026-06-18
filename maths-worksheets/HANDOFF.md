# Maths Worksheets — Session Handoff

> **Purpose:** Anyone (including a fresh chat session) can continue this project from this document alone. Read it top-to-bottom, then run the resume command at the bottom.

---

## 1. What this project is

Generate one **JSON worksheet** + one **PDF worksheet** for every maths subtopic in the SEND Assistant curriculum. The JSON is the SEND-overlay-ready library file; the PDF is the printable rendered output. Total target: **194 worksheets** across **54 topics**.

The full subtopic list with filenames is in [`PLAN.md`](./PLAN.md).

---

## 1a. Scope (KS3 / KS4 ONLY)

**This project targets KS3 and KS4 (GCSE) maths only.** KS1 and KS2 (primary) topics are out of scope going forward.

### Topics IN SCOPE (KS3 / KS4)
Topics 6, 7, 8, 9, 12, 13, 14, 15, 19, 20, 22, 23, 24, 25, 28, 29, 30, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54.

### Topics OUT OF SCOPE (KS1 / KS2)
Topics 1, 2, 3, 4, 5, 10, 11, 16, 17, 18, 21, 26, 27, 31, 32, 33, 34, 35, 36, 37.

**Past batches that already shipped KS2 content** (Batch 1's single times tables 088–100 and Batch 2's long/short ×÷ 097/098/102/103) are kept as bonus content — no need to remove them. But future batches must be KS3 / KS4 only.

### KS3/KS4 progress
- KS3/KS4 subtopics already done: **107** (57 from batches 1-3 + 50 new from batch 4)
- KS3/KS4 subtopics remaining: **~5** (190, 191, 192, 193, 194)
- Plus KS1/KS2 bonus already shipped: 15 (single times tables, long/short x÷)

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
| ✅ Done | **123** | 021, 022, 023, 024, 025, 026, 027, 028, 029, 030, 031, 032, 039, 040, 041, 042, 043, 044, 045, 046, 047, 048, 049, 050, 051, 052, 053, 066, 067, 068, 069, 070, 071, 072, 073, 078, 079, 080, 081, 082, 083, 084, 085, 086, 087, 088, 089, 090, 091, 092, 093, 094, 095, 096, 097, 098, 099, 100, 102, 103, 104, 105, 106, 107, 108, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189 |
| ⬜ Remaining | **71** | see `PLAN.md` for the numbered list |

### Topics fully complete
- **Algebra -- Simple Formulae and Sequences** (Topic 6 -- all 2 subtopics)
- **Algebraic Expressions** (Topic 7 -- all 3 subtopics)
- **Angles** (Topic 8 -- all 4 subtopics)
- **Area and Perimeter** (Topic 9 -- all 3 subtopics)
- **Decimals and Percentages** (Topic 12 -- all 4 subtopics)
- **Decimals -- All Operations** (Topic 13 -- all 4 subtopics)
- **Four Operations and Order of Operations** (Topic 14 -- all 3 subtopics)
- **Fractions** (Topic 15 -- all 4 subtopics)
- **Fractions -- Secondary** (Topic 20 -- all 4 subtopics)
- **Fractions -- All Operations** (Topic 19 -- all 4 subtopics)
- **Fractions, Decimals and Percentages** (Topic 22 -- all 4 subtopics)
- **Functions and Graphs** (Topic 23 -- all 2 subtopics)
- **Indices and Standard Form** (Topic 24 -- all 1 subtopic)
- **Linear Inequalities** (Topic 25 -- all 3 subtopics)
- **Multiplication & division foundation** (Topics 26, 27, 28, 29 -- all but Factor pairs/commutativity)
- **Percentages** (Topic 30 -- all 3 subtopics)
- **Percentages of Amounts** (Topic 31 -- all 2 subtopics)
- **Place Value and Ordering Integers** (Topic 38 -- all 4 subtopics)
- **Probability** (Topic 39 -- all 4 subtopics)
- **Proportion** (Topic 40 -- all 4 subtopics)
- **Pythagoras' Theorem** (Topic 41 -- all 4 subtopics)
- **Quadratic Equations** (Topic 42 -- all 3 subtopics)
- **Ratio** (Topic 43 -- all 4 subtopics)
- **Ratio and Proportion** (Topic 44 -- all 2 subtopics)
- **Sequences** (Topic 45 -- all 3 subtopics)
- **Simultaneous Equations** (Topic 46 -- all 3 subtopics)
- **Solving Linear Equations** (Topic 47 -- all 4 subtopics)
- **Statistics** (Topic 48 -- all 4 subtopics)
- **Straight-Line Graphs** (Topic 49 -- all 4 subtopics)
- **Surds** (Topic 50 -- all 4 subtopics)
- **Transformations** (Topic 51 -- all 4 subtopics)
- **Trigonometry** (Topic 52 -- all 4 subtopics)

### Topics partially complete
- **Vectors** (Topic 53): 3 of 4 -- adding/subtracting ✅, multiplying by scalar ✅, geometry proofs ✅; writing and representing vectors (190) remaining

### Topics not yet started
- Topics 1-5 (lower-primary addition/subtraction)
- Topics 10-11 (Counting, Number Recognition)
- Topics 16-18 (Primary fractions)
- Topic 21 (Fractions -- Unit and Non-Unit)
- Topics 26-29 Factor pairs (101) only
- Topics 32-37 (Place Value primary)
- Topic 54 (Volume and Surface Area)

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
