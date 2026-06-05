# Curated Worksheet Library — Authoring Schema

This folder holds hand-authored, **curated gold-standard** worksheets as structured
JSON. Each file maps 1:1 to a `subtopic` and loads straight into the
`worksheet_library` table (no LLM call, served instantly via `GET /api/library/lookup`).

> **SEND adaptation and reading-age filtering are NOT baked into these files.**
> Each file is the neutral **base** worksheet. The existing overlay engine
> (`sendEnforcer.ts`, `sendFidelityAudit.ts`, `primaryReadingProfile.ts`) applies
> SEND needs and reading age *on top* at serve time — that's why we author one
> base per subtopic, not one per SEND×subtopic combination.

---

## File location & naming

```
worksheet-library/worksheets/<subject-slug>/<topic-slug>__<subtopic-slug>.json
```

- `subject-slug`: `maths` | `chemistry` | `biology` | `physics` | `english` | ...
- slugs are lowercase, spaces→`-`, punctuation stripped.
- Example: `worksheets/chemistry/atomic-structure__isotopes.json`

---

## JSON shape (matches `POST /api/library/auto-save` exactly)

```jsonc
{
  "subject": "Chemistry",                 // free text, used as-is
  "topic": "Atomic Structure",            // MUST match a key in subtopics-data.ts SUBTOPICS_MAP
  "subtopic": "Isotopes",                 // MUST match an entry under that topic (pipeline field)
  "yearGroup": "Year 10",                 // "Year 1".."Year 11" | "KS3" etc.
  "tier": "mixed",                        // mixed | foundation | higher | scaffolded
  "title": "Isotopes",
  "subtitle": "Atomic Structure · GCSE Chemistry",
  "learning_objective": "Explain what isotopes are and calculate ...",
  "key_vocab": [
    { "term": "Isotope", "definition": "Atoms of the same element with ..." }
  ],
  "sections": [ /* WorksheetSection[] — student-visible, in render order */ ],
  "teacher_sections": [ /* WorksheetSection[] — teacherOnly answer key / mark scheme */ ]
}
```

### `WorksheetSection`
```jsonc
{
  "id": "s5",                // REQUIRED — stable, unique within the file. Use s1,s2,… (teacher: ts1,ts2,…)
  "title": "Section A — Multiple Choice",
  "type": "q-mcq",          // see canonical types below
  "content": "1. ...\nA) ...\nB) ...\nC) ...\nD) ...",  // string; \n for line breaks
  "marks": 4,                // optional, number
  "teacherOnly": false       // optional; true only inside teacher_sections
}
```

> **Why `id` is mandatory:** the server overlay engine
> (`server/lib/overlayEngine.ts`) keys structural integrity off `section.id` —
> it is how it proves no base section was removed, reordered or mutated, and how
> diagram assets stay pinned to their section. The `auto-save` endpoint stores
> sections **verbatim** (it does not invent ids), so an id-less section would
> weaken the integrity check. Number them `s1..sN` in render order; teacher
> sections `ts1..tsN`.

## Canonical section `type` values

Use these exact strings (the renderer aliases legacy names to these):

| type | purpose |
|---|---|
| `objective` | Learning objective box (1 section, first) |
| `vocabulary` | Key terms list (mirror of `key_vocab`) |
| `prior-knowledge` | Retrieval / recap starter |
| `example` | Worked example (model answer shown) |
| `q-mcq` | Multiple choice (A–D inline in content) |
| `q-gap-fill` | Cloze / fill-the-blank (use `____`; include a word bank) |
| `q-true-false` | True / false statements |
| `q-short-answer` | Short answer, may have (a)(b)(c) sub-parts |
| `q-extended` | Extended / exam-style question |
| `q-label-diagram` | Label a diagram (`svg` optional) |
| `q-data-table` | Table-completion task |
| `common-mistakes` | Misconception callout |
| `self-reflection` | Pupil self-rating / reflection |
| `section-header` | Divider only |
| `diagram` | Standalone diagram (`svg` + `caption`) |
| `mark-scheme` | **teacher_sections only** — answers + AO/marks |

---

## The spec I need from you per worksheet

To author each one accurately I need a short spec. Minimum is the first 4 lines;
the rest sharpens quality:

```
SUBJECT:   Chemistry
TOPIC:     Atomic Structure          (exact SUBTOPICS_MAP key)
SUBTOPIC:  Isotopes                  (exact entry)
YEARGROUP: Year 10
EXAM BOARD: AQA                      (optional — for spec alignment)
KEY POINTS: same protons diff neutrons; same atomic number diff mass number;
            relative atomic mass = weighted mean; same chemical props
MUST INCLUDE: a relative-atomic-mass calculation; chlorine-35/37 example
DIFFICULTY: mixed | foundation | higher
NOTES: keep numbers small; one worked example before independent practice
```

If you just give me `SUBJECT / TOPIC / SUBTOPIC / YEARGROUP`, I'll author a
solid, curriculum-accurate worksheet from my own subject knowledge and you can
correct anything afterward. The richer the spec, the less correction needed.

---

## Quality bar (every worksheet)

1. Curriculum-accurate and self-contained.
2. 8–12 student sections following the canonical order (objective → vocab →
   prior-knowledge → example → graded questions → common-mistakes → reflection).
3. Every question that carries marks has a matching answer in `mark-scheme`.
4. Reading level appropriate to `yearGroup` **before** any SEND overlay.
5. Valid JSON, parses cleanly, slugged filename matches `topic`/`subtopic`.


---

## Base worksheet vs. SEND/reading-age overlay (IMPORTANT)

Reference: the maths gold standard `Quadratic-Simultaneous-Equations-Dyslexia-Adapted`
(`dyslexia-adapted-worksheet-demo` branch). That PDF is **already dyslexia-adapted**.
We do **not** store it adapted. We store the neutral base and let the overlay engine
re-apply adaptation per pupil.

| Belongs in the BASE JSON (we author) | Applied by the OVERLAY engine (NOT stored) |
|---|---|
| Questions, marks, difficulty ramp | OpenDyslexic / dyslexia font |
| Method steps, worked example | Cream `#FFF8E7` full-bleed colour overlay |
| Common mistakes, key vocab | One-question-per-page layout |
| Self-reflection, teacher mark scheme | Line-height / letter-spacing / word-spacing |
| Learning objective | Method-reminder strip repeated per page |
| Optional `frame` scaffolds (see below) | Fading-out of frames as difficulty rises |

This is why one base per subtopic covers every SEND need — no combinatorial explosion.

## Maths conventions (learned from the gold standard)

- **Difficulty ramp:** add `"difficulty": 1..5` to each question section; order easy→hard.
- **Per-question marks:** every question section carries `"marks"`.
- **Method first:** an `example` section listing the numbered method steps, then a
  second `example` section with a fully worked example.
- **Surd form / exact answers** where the curriculum expects them (label the question).
- **Real-world finale:** end with a "form and solve" applied problem.
- **Mark scheme** gives both the method-mark guidance and every final answer.

### Optional custom fields (renderer ignores unknown keys; overlay engine may use them)
- `"difficulty"`: 1–5 integer per question — drives the scaffolded/dyslexia frame fade.
- `"frame"`: string[] of "how to start" hints. Author on the **first 1–2 questions only**.
  Left out of the neutral render; the scaffolded/SEND overlay decides whether to show them.


---

## Images & Diagrams

A worksheet image is a section of `type: "diagram"`. The renderer
(`WorksheetRenderer.tsx`) resolves it in this priority order:

1. **`[[DIAGRAM:{...}]]` marker inside `content`** → rendered by `SVGDiagram.tsx`
   (schematic types). *Authored by Kiro, no hosting, print-safe.*
2. **`imageUrl` / `assetRef`** → a real raster `<img>` (photos, maps, micrographs).
3. **`svg` field** → raw inline SVG injected verbatim. *Authored by Kiro — full
   illustration control, e.g. labelled anatomy. Print-safe, no hosting, no copyright.*

> **Placement:** to support a question, put the `diagram` section **immediately
> before** that question section. (For a true side-by-side "label this" task use
> `q-label-diagram`, which needs an `imageUrl` or a non-`labeled` DiagramSpec.)

### Path 1 — DiagramSpec (`[[DIAGRAM:{...}]]`)

Embed a JSON spec in `content`. Must pass `validateDiagramSpec`. Types + bounds:

| `type` | required fields | bounds | use for |
|---|---|---|---|
| `number-line` | `start`, `end`, `marked[]` | — | maths number lines |
| `axes` | `xLabel`, `yLabel` | — | labelled coordinate axes |
| `bar` | `bars[]` `{label,value}` | ≥2 bars | bar charts / abundance |
| `bar-model` | `parts[]` `{label,value}` | 1–6 parts, Σvalue ≤30 | ratio / proportion |
| `fraction-bar` | `numerator`, `denominator` | denom 1–12 | fractions |
| `flow` / `cycle` | `steps[]` | 3–8 steps | processes (digestion, water cycle) |
| `circuit` | `layout` (`series`/`parallel`/…) | — | physics circuits |
| `venn` | `setA`, `setB` (+`overlap`,`onlyA`,`onlyB`) | — | comparison |
| `timeline` | `events[]` `{date,label}` | 2–8 events | history / plot |
| `pyramid` | `levels[]` | 2–7 levels | food chains / hierarchies |
| `labeled` | `labels[]` `{text,x,y}` (x,y 5–95) | 3–8 labels | **needs a real `imageUrl`** |

Example (chlorine abundance):
```json
{ "title": "Chlorine — Isotope Abundance", "type": "diagram",
  "content": "[[DIAGRAM:{\"type\":\"bar\",\"title\":\"Chlorine isotope abundance\",\"xLabel\":\"Isotope\",\"yLabel\":\"Abundance (%)\",\"bars\":[{\"label\":\"Cl-35\",\"value\":75},{\"label\":\"Cl-37\",\"value\":25}]}]]" }
```

### Path 3 — Hand-authored inline SVG (`svg` field) — GCSE textbook diagrams

For anatomy / biology / detailed apparatus the schematic specs can't draw, I
author the illustration by hand as inline SVG:

```json
{ "title": "Animal Cell", "type": "diagram",
  "svg": "<svg viewBox=\"0 0 520 320\" xmlns=\"http://www.w3.org/2000/svg\" width=\"100%\"> ... </svg>" }
```

Authoring rules for inline SVG:
- Always set a `viewBox` (≈ `0 0 520 320`) and `width="100%"`; do **not** hard-code px width/height — it must scale and print.
- **Black/`#1e293b` strokes on transparent background** so the SEND colour overlay (e.g. cream) shows through. No coloured fills behind text.
- Every part **labelled** with a leader line and `font-family="Arial, sans-serif"`, `font-size` 11–13.
- **Anatomical/scientific accuracy to GCSE textbook standard** when the steer calls for it: correct structures, correct relative proportions, conventional orientation (e.g. heart drawn with left/right mirrored from the viewer; label all four chambers, aorta, vena cava, pulmonary artery & vein).
- Keep it self-contained: no external fonts, images, `<script>`, or remote refs.

### Path 2 — Real hosted images (`imageUrl` / `assetRef`)

Only for genuine photos/micrographs/maps. **PDF-export constraint:** the export
proxy (`/api/diagram-proxy`) only allows these hosts — `openstax.org`,
`cdn.kastatic.org`, `khanacademy.org`, `*.amazonaws.com` (S3),
`res.cloudinary.com`, `storage.googleapis.com`, `adaptly.co.uk`,
`*.manuscdn.com`. So a real image must be re-hosted on one of those (your S3 /
Cloudinary / Adaptly bucket / Manus admin diagram library) — a raw
Unsplash/Wikimedia URL will display on screen but **may not export to PDF**.
Source only permissively-licensed images (Wikimedia Commons CC/PD, Bioicons MIT,
Unsplash licence), set `attribution`, and register via `worksheet_library_assets`.

### Wordy vs non-wordy guidance
- **Non-wordy (maths, sciences, geography data):** lead with diagrams — Path 1
  specs and Path 3 hand-drawn SVG; place one next to most questions.
- **Wordy (English lit, history, RE):** mostly text; use a `timeline` (plot/events),
  a `flow`/`cycle` (argument or process), or a single hand-drawn supporting image.
  The aim is variety — not every worksheet should look the same.


---

## How your generator handles these (the overlay contract)

When a teacher requests a worksheet with a SEND need and/or reading age, the flow is:

```
GET /api/library/lookup            → serves the stored BASE verbatim (no LLM)
POST /api/library/resolve          → applyOverlays(baseSections, { sendNeed, readingAge, … })
```

`applyOverlays` (`server/lib/overlayEngine.ts`) is **deterministic** and its
documented design rules are:

- **Never remove or reorder base sections.** It `clone`s the base and only
  *inserts* new sections.
- **Never touch diagram/image references** (`imageUrl`, `assetRef`, `svg`, `caption`).
- **SEND overlays affect formatting/presentation and add support — never academic challenge.**
  Each SEND need (`buildDyslexiaSupport`, `buildAdhdSupport`, `buildAscSupport`,
  …) inserts neutral-titled support boxes (`type: "send-support"`, `isOverlay: true`)
  **after** the relevant question — never inside the question text.
- **Three independent dimensions:** challenge level = tier (Foundation/Higher/Scaffolded);
  access method = SEND overlay; language complexity = reading-age/EAL overlay.

### Integrity is actually asserted in code
- `computeStructuralHash(sections)` hashes `id:type:asset` of every **non-overlay**
  section. It is computed before *and* after overlay; `structurePreserved =
  finalHash === baseHash`.
- `assertBaseSectionsPreserved(base, final)` checks every base section survives
  **verbatim** (`type, content, marks, imageUrl, assetRef, title`). In dev it
  **throws** if an overlay mutated a question; in prod it logs and continues.

### What this means for our authored worksheets
1. The base we author is the **single source of truth**. Tier/SEND/reading-age are
   layered on top at serve time, never baked in.
2. Our images survive untouched: a hand-authored `svg`, a `[[DIAGRAM:]]` spec, or
   an `imageUrl`/`assetRef` is in the protected set — the overlay engine will not
   alter, move, or strip it. Support boxes are inserted *around* the questions, so
   a diagram stays directly beside the question it supports.
3. Because integrity keys off `id`, **every section must carry a stable `id`** (see above).
