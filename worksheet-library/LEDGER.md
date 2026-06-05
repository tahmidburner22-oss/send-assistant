# Curated Worksheet Library — Build Ledger

Tracks progress authoring curated **base** worksheets for every subtopic in
`client/src/lib/subtopics-data.ts`.

- **Topics:** 178
- **Subtopics (target worksheets):** 907 (canonical: `docs/exam-bank-coverage.json → subtopicsTotal: 907`)
- **Authored:** 2
- **Approved by user:** 0 (awaiting sign-off on exemplars)
- **Loaded into worksheet_library:** 0

## Status legend
`[ ]` not started · `[~]` authored, awaiting approval · `[x]` approved · `[L]` loaded into DB

## How we work through it
1. User supplies a spec (see `SCHEMA.md → "The spec I need from you"`), or a batch of subtopics.
2. I author the base JSON → `worksheets/<subject>/<topic>__<subtopic>.json`.
3. User reviews; on approval status → `[x]`.
4. Bulk-load approved files into `worksheet_library` (loader script — built once format is signed off).

## Recommended batch order
Start with one full **topic** end-to-end (≈4–5 subtopics) per turn so each PR is reviewable.
Suggested batch size: **5–10 subtopics per session.**

---

## Progress

### Maths
- [~] Simultaneous Equations → Non-linear simultaneous equations  *(exemplar; derived from dyslexia-demo gold standard, base/neutral)*

### Chemistry
- [~] Atomic Structure → Isotopes  *(exemplar)*

### (remaining 905 subtopics across 176 topics — added per batch as we go)
