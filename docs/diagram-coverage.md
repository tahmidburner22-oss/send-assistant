# Diagram Library Coverage Audit

This document explains how to audit the `diagram_library` table and identify
sub-topics that are missing Diagram A or Diagram B.

## Why

Previously the worksheet generator fell back to static keyword banks
(`diagramBank.ts`, `diagramBankFull.ts`, `diagramTemplates.ts`) when the DB
library could not serve a match. Those banks contained many incorrect
`key → url` mappings that silently served the wrong diagram (e.g. the animal
cell diagram for a "brain" query). Those banks are now **deleted**. The
`diagram_library` table is the only source, and `GET /api/diagram-library/search`
fails closed (returns `entry: null`) when the best match is weak or when the
subject family is incompatible.

The trade-off is that every sub-topic needs a curated Diagram A and Diagram B
row in the DB. The audit below tells you exactly which rows are missing.

## How to run

### Option 1 — CLI script (recommended)

Run locally, hitting the production database:

```bash
DATABASE_URL=postgres://user:pass@host:5432/db \
  node scripts/diagram-coverage-audit.mjs
```

The script writes the report to `docs/diagram-coverage.md` (this file) so you
can commit the latest snapshot if you want.

### Option 2 — HTTP endpoint

Log in as any teacher/admin and call:

```
GET /api/diagram-library/coverage
```

Response shape:

```json
{
  "totalCurriculumTopics": 119,
  "totalLibraryEntries": 1722,
  "topicsWithDiagramA": 85,
  "topicsWithDiagramB": 47,
  "missing": [
    { "subject": "biology", "topic": "The Ear", "canonicalKey": "the_ear", "missingA": false, "missingB": true },
    ...
  ]
}
```

The `missing` array contains one row per (subject, topic) combination that is
missing at least one of Diagram A or Diagram B.

## Upload workflow

To fill a gap:

1. Prepare the image (PNG or WebP, ideally 1200×800px, white or transparent
   background).
2. Go to **Admin Panel → Diagram Library → Add New**.
3. Fill in:
   - **Title** (e.g. "Human Ear — Labelled")
   - **Subject** (use the family name: `biology`, `chemistry`, `physics`,
     `mathematics`, `english`, `history`, `geography`, `computing`)
   - **Topic** (use the canonical wording shown in the audit report)
   - **Year Group**
   - **Diagram Type**: `diagram_a` (reference/stimulus) or `diagram_b`
     (alternative representation)
   - **Tags**: free-text keywords, comma separated.
4. Save. The worksheet generator will pick it up on the next search.

## Notes

- We deliberately avoid generating SVG diagrams. Every diagram served must
  come from this library. Uploaded images are cached indefinitely via the
  `/diagrams/…` and `/images/…` static paths.
- `subject family` collapses `biology`, `chemistry`, `physics` under `science`
  for the gate. A chemistry diagram will not be served for a physics
  worksheet unless its `topic` also matches.
- The canonical topic key normaliser lives in
  `server/lib/topicNormalizer.ts`. When a new topic phrasing is added to the
  curriculum, add it to that file's `CANONICAL_TOPIC_MAP` so the library
  lookup matches both phrasings to the same key.
