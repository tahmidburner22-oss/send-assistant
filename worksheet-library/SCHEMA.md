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
  "title": "Section A — Multiple Choice",
  "type": "q-mcq",          // see canonical types below
  "content": "1. ...\nA) ...\nB) ...\nC) ...\nD) ...",  // string; \n for line breaks
  "marks": 4,                // optional, number
  "teacherOnly": false       // optional; true only inside teacher_sections
}
```

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
