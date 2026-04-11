# Worksheet Library + Dynamic SEND Adaptation Strategy

## Problem diagnosis (what is going wrong now)

Your current `worksheet_library` stores full worksheet structures as JSON text (`sections`, `teacher_sections`) but does not have a first-class asset model.

That causes image/diagram instability because:
1. Diagram/image references are likely embedded as ad-hoc URLs inside JSON blobs.
2. There is no canonical asset manifest per worksheet version.
3. There is no deterministic rewrite step when content is cloned/adapted.
4. SEND adaptations regenerate or mutate content without preserving a reliable asset map.

## Target behavior

- **No SEND need selected**: instant cache hit from library, no LLM call.
- **SEND need selected**: reuse the same base worksheet structure and asset manifest, adapt text/instructions only, and keep diagram references stable.

---

## Recommended architecture (high impact, minimal risk)

## 1) Split worksheet content into **Base + Variant**

Use two logical layers:

- **Base worksheet (library canonical)**
  - Subject/topic/year/tier
  - Structural sections
  - Diagram & image assets with stable IDs
  - Versioned and curated

- **Variant worksheet (runtime)**
  - References base worksheet ID + base version
  - SEND need and adaptation metadata
  - Text-level modifications only
  - Optional additional support blocks

This avoids re-generating diagrams and prevents “missing image after adaptation” failures.

## 2) Add an explicit asset table (critical)

Add a table like:

- `worksheet_library_assets`
  - `id`
  - `library_entry_id`
  - `section_key`
  - `asset_type` (`diagram_svg`, `image_url`, `image_s3`, `latex`, etc.)
  - `content_hash` (sha256)
  - `storage_key` (S3/object key)
  - `public_url` (or signed-url strategy)
  - `width`, `height`, `alt_text`
  - `created_at`, `updated_at`

Then in section JSON store only stable references, e.g. `assetRef: "asset_abc123"`, never transient URLs.

## 3) Canonical section schema + deterministic IDs

Each section should include:
- `sectionId` (stable, e.g. `intro`, `q1`, `diagram_2`)
- `type`
- `content`
- `assetRefs[]`

When adapting for SEND, keep `sectionId` and `assetRefs` unchanged by default.

## 4) Adaptation pipeline should be “text-only by default”

Flow:
1. Fetch base worksheet + asset manifest.
2. Build a lightweight adaptation prompt with strict JSON schema.
3. Ask model to modify **only allowed fields** (`content`, hints, scaffolds, vocabulary support).
4. Server-side validator rejects responses that remove required sections or orphan `assetRefs`.
5. Persist variant with `base_entry_id`, `base_version`, `send_need`.

## 5) Add fallback rendering logic for asset reliability

At render time:
- Resolve `assetRef -> storage URL` via API.
- If primary URL fails, fallback to:
  1. cached local copy,
  2. signed URL refresh endpoint,
  3. inline SVG backup (for diagrams).

For diagrams specifically, storing canonical SVG content (or compressed SVG) is usually more robust than external image links.

---

## Query strategy to save AI tokens

## Fast path (no SEND)

1. Lookup by `(subject, topic, year_group, tier='standard', send_need IS NULL)`.
2. Return canonical base worksheet directly.
3. Track cache hit metrics.

## SEND path (with SEND)

1. Lookup base canonical worksheet first.
2. Check if a matching variant already exists for `(base_entry_id, send_need, version)`.
3. If variant exists, return it immediately.
4. Else generate adaptation once, store variant, and return.

This gives you repeated SEND requests with near-zero new token cost.

---

## API changes I recommend

- `GET /api/library/resolve?subject=&topic=&yearGroup=&tier=&sendNeed=`
  - returns base or variant with resolved assets

- `POST /api/library/adapt`
  - body: `{ baseEntryId, sendNeed, adaptationLevel }`
  - returns cached variant if exists, else creates one

- `GET /api/library/assets/:assetId`
  - resolves to current usable URL/inline SVG payload

- `POST /api/library/assets/verify`
  - background integrity check for stale/broken assets

---

## Migration plan from current JSON model

1. Add `worksheet_library_assets` table.
2. Backfill: parse existing `sections` JSON and extract image/svg references.
3. Replace raw references in sections with `assetRef` IDs.
4. Add `base_entry_id` and `base_version` fields for variant rows.
5. Add unique index for variants: `(base_entry_id, send_need, tier, version)`.
6. Add a nightly asset health job that checks broken links and refreshes signed URLs.

---

## Why this will fix your current image issues

- No more brittle per-response URLs embedded in generated JSON.
- SEND adaptations stop rewriting diagram/image link fields.
- Assets become first-class, versioned entities with integrity checks.
- Render path can recover gracefully when one URL fails.

---

## Practical implementation order (next sprint)

1. Add asset table + assetRef schema.
2. Update library lookup endpoint to return resolved assets.
3. Implement text-only SEND adaptation endpoint with strict schema validation.
4. Add variant caching keyed by `(base_entry_id, send_need)`.
5. Add asset verification cron.

If you want, I can implement this in your codebase next as:
- DB migration SQL,
- server route changes in `server/routes/worksheetLibrary.ts`,
- and a safe renderer contract for `client/src/components/WorksheetRenderer.tsx`.
