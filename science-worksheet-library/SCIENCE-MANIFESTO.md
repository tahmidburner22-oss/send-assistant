# Science Worksheet Library — Manifesto & Build Guide

> **Purpose of this document:** This is the single source of truth for the
> `science-worksheet-library/` standalone system. If a chat hits its context
> limit, a new session can read this file and continue work with full fidelity.
> It captures the design rules, the visual target, the architecture, the schema,
> the ADHD adaptation rules, and the exact workflow for authoring new worksheets.

---

## 1. What this is (and is NOT)

A **standalone** system that turns a single JSON file into a **one-page
A4-landscape** science revision/practice worksheet, rendered to **HTML → PDF + PNG**
via Playwright (headless Chromium).

- It lives at `send-assistant/science-worksheet-library/`.
- It is **NOT** the existing `worksheet-library/` curated-JSON / overlay-engine
  pipeline. Do not import from or depend on that system. Keep it fully separate.
- Each subtopic gets its own **bespoke** layout — panels, diagrams, and questions
  differ per subtopic. There is no single rigid template; instead there are
  reusable **layout modes** and **panel/question types**.

### Core design rules (non-negotiable)
1. **One A4-landscape page** (297mm × 210mm). The generator **fails** if content
   overflows (page scrollHeight must be ≤ 794px + 5px tolerance).
2. **Small header** — a thin band, never a tall hero. Maximise space for content.
3. Every worksheet has, in some form: a small header, **key vocabulary**, **common
   misconceptions**, diagrams, questions, and an optional footer (tip / think prompt).
   - Note: in the bespoke layouts these can be expressed via info panels
     (e.g. a "worked example" panel can carry the misconception-correcting role,
     or explicit `vocab` / `misconceptions` panels can be added).
4. **Diagrams are print-safe inline SVGs** keyed in `src/diagrams.ts` (no external
   refs, no filters that break in PDF). Use radial gradients for 3D spheres — these
   render fine in Chromium PDF.
5. **Standard variant authored first**, then the **ADHD variant** with the SAME grid
   and SAME questions but calmer palette, chunked steps, checkboxes, progress tracker,
   and simplified language. **The ADHD structure must never break** — same layout mode,
   same number of questions, same diagrams.

---

## 2. Visual target (must EXACTLY match the reference images)

Two reference worksheet images define the look. Match them precisely.

### Shared header anatomy (both images)
- **Top-left:** two pill badges side by side:
  - `CHEMISTRY` — **filled** navy badge, white text.
  - `YEAR 10` — **outlined** badge (white fill, navy border, navy text).
- **Top-right:** EITHER
  - a **NAME / DATE box** (rounded rectangle, two ruled lines) — used by *Metallic Bonding*; OR
  - a **`DIAGRAM A`** filled navy badge — used by *Concentration of Solutions*.
- **Centre title:** large, heavy, condensed. Colour depends on sheet:
  - *Metallic Bonding*: **BLACK** title, blue italic subtitle ("Interpretation & Practice").
  - *Concentration*: **BLUE** title, with a **double horizontal rule** underneath, no subtitle.

### Image 1 — "METALLIC BONDING – DIAGRAM B" (layout: `panel-pair`)
- Full-width **definition bar** under the header: rounded navy border, white fill.
  Key terms (`positive metal ions`, `delocalised electrons`) in **blue bold**.
- Two large side-by-side panels (rounded, navy border):
  - **Panel 1 — "LABEL THE STRUCTURE"**
    - Numbered badge **`1`** = navy filled rounded square, white number.
    - Section title = navy **filled banner/pill**, white uppercase text, sits next to the badge.
    - Instruction line.
    - **Word bank** = one **dashed** rounded rectangle containing 3 **solid-bordered** word boxes
      (`delocalised electrons`, `positive metal ions`, `layers can slide`).
    - Diagram = 3 rows of **3D silver spheres** marked `+`, small `−` electrons scattered
      in a faint blue "sea"; **3 cream/yellow empty label boxes** (gold border) connected
      by **leader lines** to points on the diagram.
  - **Panel 2 — "MALLEABILITY"**
    - Explanatory text about layers of metal ions.
    - **BEFORE FORCE** diagram (regular rows of spheres + electrons), a **bracket** to a
      cream label box on the right.
    - A bold **↓ FORCE APPLIED** arrow.
    - **AFTER FORCE** diagram (top rows **shifted right**), with a **dashed arrow** showing slip.
    - "Explain why the layers of ions can slide over each other." + 4 ruled answer lines.
- **Footer:** full-width light bar, two items:
  - left `💡 TIP: …` (lightbulb), right `✓ Think: …` (circled check).

### Image 2 — "QUANTITATIVE CHEMISTRY 2 – CONCENTRATION OF SOLUTIONS" (layout: `info-grid`)
- **Three info panels** across the top:
  - **Left — "SOLUTION: A SOLUTE DISSOLVED IN A SOLVENT"**: labelled **beaker** SVG with
    leader lines to `solution (solute + solvent)`, `solvent (e.g. water)`,
    `solute (e.g. sodium chloride)`; two definition lines below with **blue bold** terms.
  - **Centre — "CONCENTRATION FORMULA"**: light-blue panel containing a white inner box with
    the fraction `concentration (g/dm³) = mass of solute (g) / volume of solution (dm³)`;
    below it a separate **yellow "CONVERSION REMINDER"** box: **`1000 cm³ = 1 dm³`**.
  - **Right — "WORKED EXAMPLE"**: worked calculation. Command line "Calculate the concentration."
    in **blue**; final answer `= 16 g/dm³` in **blue bold**.
- **2×2 question grid** below (numbered navy badges):
  - **Q1 CONVERSION**: "Convert 250 cm³ to dm³." + "(Use the conversion reminder above.)" →
    `Answer: ______ dm³`.
  - **Q2 CALCULATE CONCENTRATION**: 5.0 g copper sulfate in 0.50 dm³ → `Answer: ______ g/dm³`.
  - **Q3 CALCULATE MASS**: conc 24 g/dm³, vol 0.40 dm³ → `Answer: ______ g`.
  - **Q4 COMPARE SOLUTIONS**: a **table** (Solution A/B, Mass of solute (g), Volume (dm³)),
    "Which solution is **more concentrated**? Circle your answer."  `A    B`  + "Show your working." + working box.

### Panel section titles
Inside info panels, the title is a **centred uppercase blue heading** with a thin underline rule.
Inside question panels, the title is the **navy filled banner** beside the number badge.

---

## 3. ADHD-adapted variant — what changes

The ADHD variant is a **separate JSON file** (`*.adhd.json`) with `variant: "adhd"`.
It keeps the **same layout mode, same questions, same diagrams, same grid** so the
structure never breaks. The differences are:

| Aspect | Standard | ADHD-adapted |
|---|---|---|
| **Palette** | Strong navy `#1a237e`, white | **Calmer** muted blue `#4a6fa5`, soft green `#e8f4ed`, warm cream `#fdf6e3` for boxes; lower contrast, less "shouty" |
| **Progress tracker** | none | **Row of dots** at top (one per question) so pupils can tick off progress |
| **Language** | Standard exam phrasing | **Simplified** — shorter sentences, plain words, define jargon in-line (e.g. "delocalised electrons (electrons that move freely)") |
| **Chunked steps** | none | Each question gains a **`steps` list** breaking the task into small sequential prompts |
| **Checkboxes** | none | Each step has a **checkbox** so the pupil can tick each micro-step |
| **Footer hints** | concise | Tip/think prompts include a **hint** in brackets and a relatable analogy (e.g. "like balls floating in water") |
| **Spacing/legibility** | standard | Slightly more breathing room where the single-page budget allows |

**What stays identical:** the layout mode (`panel-pair` / `info-grid`), the number and
order of questions, the diagrams used, the section titles, and the answer
mechanisms (lines / boxes / tables). A teacher should be able to lay the standard and
ADHD sheets side by side and see the same skeleton.

---

## 4. Architecture

```
science-worksheet-library/
├── SCIENCE-MANIFESTO.md      # THIS FILE — read first
├── package.json              # type:module; deps: playwright; dev: tsx, typescript
├── tsconfig.json
├── src/
│   ├── types.ts              # v2.0 schema (Worksheet, InfoPanel, Question, etc.)
│   ├── diagrams.ts           # default export: Record<string, string> of inline SVGs
│   ├── render.ts             # renderWorksheet(ws): string  → self-contained HTML
│   └── generate.ts           # CLI: tsx src/generate.ts <file.json> | --all
├── worksheets/
│   └── chemistry/
│       ├── metallic-bonding.json            # standard (panel-pair)
│       ├── metallic-bonding.adhd.json       # ADHD
│       ├── concentration-of-solutions.json  # standard (info-grid)
│       └── concentration-of-solutions.adhd.json
└── output/                   # generated .html/.pdf/.png (mirrors worksheets/ tree)
```

### Pipeline
`JSON` → `renderWorksheet()` builds a fully **self-contained HTML** string (inline CSS,
inline SVG, CSS custom-property palette) → Playwright loads it at A4-landscape viewport
(1123×794 px @96dpi) → **overflow check** (`.page` scrollHeight ≤ 794+5) → emits `.pdf`
(297mm×210mm, printBackground, zero margins) and `.png` (clipped to A4 box). Generator
**exits non-zero** if any sheet overflows.

---

## 5. Schema (v2.0) — quick reference

`Worksheet`:
- `version: "2.0"`, `variant: "standard" | "adhd"`
- `header`: `{ subject, yearGroup, title, diagramLabel?, subtitle?, nameDateBox?, titleColor? }`
- `layout`: `{ mode: "info-grid" | "panel-pair", infoCols?, questionCols?, questionRows? }`
- `infoPanels: InfoPanel[]`
- `questions: Question[]`
- `footer?: { tip?, thinkPrompt? }`
- `adhd?: { palette?, progressTracker?, simplifiedLanguage?, chunkedSteps? }`

`InfoPanel.type`: `diagram | formula | worked-example | definition | conversion | vocab | misconceptions`
- common: `title`, `content?`, `secondaryContent?`, `fullWidth?`
- `diagram?: { id, caption?, width?, height? }`
- `formulaLines?: string[]`, `workedSteps?: string[]` (prefix a line with `!` to highlight blue)
- `vocab?: VocabTerm[]`, `misconceptions?: Misconception[]`

`Question.type`: `short-answer | calculation | fill-blank | label-diagram | explain | compare | conversion`
- `number`, `sectionTitle`, `text`, `secondaryText?`
- `answerUnit?` (renders `Answer: ____ <unit>`), `answerLines?`, `workingBox?`
- `wordBank?: string[]`, `table?: { headers, rows }`, `circleOptions?: string[]`
- `diagram?: DiagramRef`
- ADHD only: `steps?: string[]`, `checkboxes?: boolean`

Markup allowed in text fields: `<strong>`, `<span class="command">…</span>` (blue command word),
and inline fraction markup via `formula-fraction/num/den` spans.

---

## 6. Diagram library (`src/diagrams.ts`) keys

Current keys:
- `metal-lattice-label` — 3×3 grid of 3D `+` spheres + `−` electron sea + 3 cream label boxes & leader lines.
- `metal-lattice-malleability` — BEFORE/AFTER force diagram with shift + dashed slip arrow + bracket label box.
- `beaker-solution-labelled` — labelled beaker (solution/solvent/solute) + definition lines.

**Adding a diagram:** add a new key returning a self-contained `<svg …>…</svg>` string.
Use `viewBox`, no external fonts (use Arial/sans-serif), no `<filter>` that breaks PDF.
For metal ions use a `<radialGradient>` for a silver 3D look. Reference it from JSON via
`diagram: { id: "your-key", width: "100%" }`.

---

## 7. Workflow to author a NEW subtopic worksheet

1. **Study the reference image.** Decide the layout mode:
   - 3 info panels + 2×2 questions → `info-grid`.
   - definition bar + 2 big panels → `panel-pair`.
2. **Add any new SVG diagrams** to `src/diagrams.ts`.
3. **Author the standard JSON** in `worksheets/<subject>/<topic>.json`
   (`variant: "standard"`). Match header style, titles, panels, questions exactly.
4. **Author the ADHD JSON** `worksheets/<subject>/<topic>.adhd.json`
   (`variant: "adhd"`): copy the standard, then apply the §3 ADHD changes (calmer
   palette, `progressTracker: true`, simplified text, `steps` + `checkboxes` per question).
5. **Generate & verify single-page fit:**
   ```bash
   cd science-worksheet-library
   npx tsx src/generate.ts worksheets/<subject>/<topic>.json
   npx tsx src/generate.ts worksheets/<subject>/<topic>.adhd.json
   # or everything:
   npx tsx src/generate.ts --all
   ```
   Generator must print `✅ OK … (≤794px)` for every sheet. If `❌ OVERFLOW`, trim content
   (shorter text, fewer answer lines, smaller diagram width) until it fits.
6. **Preview** the PNGs in `output/<subject>/`.
7. **Commit & push** to a branch; share PDF/branch link.

### Commands
```bash
cd /projects/sandbox/send-assistant/science-worksheet-library
npm install                       # first time (installs playwright, tsx, typescript)
npx playwright install chromium   # if browser not present
npx tsc --noEmit                  # typecheck
npx tsx src/generate.ts --all     # build all PDFs+PNGs
```

> Sandbox note: Chromium needs `libnss3.so`. On Amazon Linux it may be missing;
> extract from the `nss` rpm into `/usr/lib64/` if Playwright reports it missing.

---

## 8. Status log

- ✅ System scaffolded (types/diagrams/render/generate, package.json, tsconfig).
- ✅ Metallic Bonding standard + ADHD — generate & fit on one page.
- ✅ Concentration of Solutions standard + ADHD — generate & fit on one page.
- 🔄 **In progress:** tightening visual fidelity to EXACTLY match reference images
  (header badges + NAME/DATE box, black-vs-blue title, double rule, navy section-title
  banners, dashed word bank with inner boxes, 3D silver spheres, cream label boxes).
- ⏭️ Next subtopics: TBD (await reference images).

> When resuming: read §2 (visual target) and §3 (ADHD rules), check `output/*.png`
> against the reference images, and continue from the "In progress" item above.
