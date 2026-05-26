# Primary (Year 1–6) Worksheet Improvement Plan

> Goal: make every Year 1–6 worksheet feel like a **primary‑school activity sheet** —
> warm, visual, age‑appropriate, full of doing-not-reading — and lift visual quality
> ~10× by giving the AI a curated diagram library it can always reach for.

This plan is split into seven workstreams (W1–W7). Each has a problem statement, the
files we already have, the change required, and the acceptance criteria we can test
against. Workstreams W3 and W6 depend on the diagram catalogue shipped alongside this
doc (`docs/primary-diagram-library.csv`).

---

## Snapshot of what's already in place

These are good — we should build on them, not replace them.

| Capability | Location | Notes |
|---|---|---|
| Primary detector (Reception → Year 6 / KS1 / KS2) | `client/src/components/WorksheetRenderer.tsx` (~L4488) and `client/src/lib/ai.ts` (~L1392) | Uses regex on `yearGroup`. Boundary already correct (Year 6 → primary, Year 7 → secondary). |
| Primary section colour palette | `WorksheetRenderer.tsx` `PRIMARY_SECTION_COLOURS` | Cheerful, accessible. Keep. |
| Primary header (rainbow gradient, 18px radius, bright border) | `WorksheetRenderer.tsx` (~L4678) | Keep, extend to all primary sections (see W2). |
| Primary layout note in AI prompt | `ai.ts` (~L1393, `primaryLayoutNote`) | Already lists "Less reading more doing", activity types, child‑voice tone. Strong base — extend with year‑band granularity (W1). |
| Primary section question targets | `worksheet-generator.ts` `PRIMARY_SECTION_QUESTION_TARGETS` | Keeps Section A short. Keep. |
| Primary slide plan (Presentation Maker) | `pages/tools/PresentationMaker.tsx` | Already activity-based for primary. |
| Diagram library DB table | `server/db/index.ts` (`diagram_library`) | Schema is fine. Data is GCSE-heavy — this plan fills the primary gap. |
| Topic normaliser | `server/lib/topicNormalizer.ts` | **Almost no primary topics** — biggest gap. Fixed in W4. |

---

## W1 — Year-band-granular reading age + tone profiles

**Problem.** Today the prompt branches on three reading-age buckets (Y1–2, Y3–4,
Y5–6). That's already better than treating "primary" as one bucket, but it still
asks Year 1 (5–6 yo, just decoding) and Year 2 (6–7 yo, fluent CVC) for the same
thing. The result: Year 1 sheets read at Year 2/3 level, Year 6 sheets sometimes
slip into KS3 vocabulary.

**Change.**
1. Replace the 3-bucket switch in `ai.ts` `primaryLayoutNote` with a 6-bucket
   profile keyed off `yearNum`:
   - **Year 1** — Phase 5 phonics, max 6 words / instruction, every word in the
     YR/Y1 word list, every instruction has an icon cue.
   - **Year 2** — Phase 5/6 phonics, max 8 words, allow common adjectives.
   - **Year 3** — max 10 words, introduce subject vocabulary with a definition
     in brackets *the first time only* (vocab card already on the page).
   - **Year 4** — max 12 words, two-clause sentences allowed, 80%+ Tier 1 lexicon.
   - **Year 5** — max 14 words, two-clause OK, allow Tier 2 if defined.
   - **Year 6** — max 16 words, may use one Tier 3 word per question if it is the
     curriculum word being taught.
2. Lift the existing "VOCABULARY RULES — NEVER USE" list into a per-year file:
   `client/src/lib/primaryVocabBlocklist.ts`. KS1 list is stricter than KS2.
   Let the validator check generated output and *fail closed* (re-prompt) on any
   blocklisted word in pupil-facing sections.
3. Add a `pedagogicalRegister` parameter to `buildCurriculumAuthorityPrompt`
   so KS1 leans warm-and-precise ("Have a go!"), KS2 leans clear-and-explanatory
   ("Let's work it out together.").

**Acceptance.**
- Snapshot test: same topic generated for Year 1 vs Year 6 produces measurably
  different reading ages (Flesch–Kincaid grade Y1 ≤ 2, Y6 ≤ 6).
- Validator rejects "analyse / evaluate / circumference / quadratic" appearing
  in any KS1 sheet.

---

## W2 — Primary visual identity (a real "house style")

**Problem.** The renderer has cheerful colours but no consistent visual identity.
Every primary sheet should look like it came from the *same* friendly publisher.

**Change.**
1. **Mascot system.** Three rotating mascots (e.g. "Ada the explorer", "Rio the
   robot", "Bea the bookworm") rendered as PNG/SVG cards in 5 emotional states
   (thinking, cheering, asking, helping, celebrating). Use them in:
   - the header banner,
   - the "Have a go!" tip box,
   - the "How did I do?" reflection footer,
   - the Challenge Corner.
   Mascots are seeded into the diagram library under `subject = "branding"` so
   the AI can place them via `[[DIAGRAM:…]]` markers without changing prompt logic.
2. **Section badges.** Each section gets a coloured rounded rectangle with an
   emoji icon and the friendly KS1/KS2 name (already wired in
   `PRIMARY_SECTION_COLOURS`). Add a small badge sprite per section ("warm-up",
   "let's practise", "challenge", "reflection") so the badge is consistent across
   all primary sheets — not just a coloured square.
3. **Typography.** Set `fmt.fontFamily` on primary worksheets to a child-friendly
   stack: `"Andika", "Sassoon Primary", "Open Dyslexic", "Atkinson Hyperlegible",
   sans-serif`. Andika is the gold standard for emerging readers (lowercase
   `a`/`g` letterforms match handwriting).
4. **Spacing.** Increase paragraph spacing 1.4× on primary, double answer-box
   heights on KS1 (children write large), and force every Section title onto its
   own row with a coloured rule underneath.
5. **Page borders.** Add an optional decorative border row (jungle, ocean,
   space, classroom) selectable per topic — these are catalogued under
   `subject = "branding"` in the library.

**Acceptance.**
- A11y audit: contrast ratio ≥ 4.5:1 for body, ≥ 3:1 for badge text on its
  background.
- Side-by-side print of a Y3 maths sheet before/after shows visual identity
  (mascot, badges, font, border) consistent with another Y3 sheet on a different
  topic.

---

## W3 — Diagram-first content (kill text walls)

**Problem.** Many primary sheets currently have a Diagram A on its own page and
then 2 pages of text questions. Children read a diagram, then have to re-imagine
it from words below. We have a diagram library — we should *embed* small,
purpose-built diagrams in the question stems themselves.

**Change.**
1. Promote the existing `q-label-diagram` and `match-pictures` section types
   from "occasional" to "default for Y1–Y4". Target **≥ 60% of pupil-facing
   sections on KS1 sheets contain a visual element** (icon, mini-diagram,
   pictogram, fraction bar, ten-frame, etc.).
2. New prompt-side rule in `ai.ts`:
   - For Y1–Y2: every question stem has either an icon set, a numicon/ten-frame,
     a pictogram, or a story-scene illustration.
   - For Y3–Y4: every question section has at least one inline visual.
   - For Y5–Y6: at least 50% of sections do.
3. Wire `getDiagramForTopic` (already present) to a new
   `getPrimaryInlineDiagram(yearNum, subject, topic, questionType)` helper that
   pulls a small inline diagram from the new catalogue. Falls back to nothing
   (not text) if no match — diagrams are additive, never required for meaning.
4. Replace word-only Common Mistakes with a **misconception card**: a tiny
   diagram with a red cross + the mistake + a green tick + the correction.
   These cards are catalogued (Maths/English/Science) and pulled in by topic.

**Acceptance.**
- Coverage audit (`scripts/diagram-coverage-audit.mjs`) shows ≥ 95% of primary
  curriculum topics have a Diagram A and Diagram B.
- Random-sample audit (10 sheets/year × 6 years = 60 sheets) shows the inline
  visual targets above are met.

---

## W4 — Primary curriculum taxonomy

**Problem.** `server/lib/topicNormalizer.ts` lists ~70 canonical topics, almost
all GCSE. A primary topic like "money" or "phonics" or "habitats" falls through
to the snake-case fallback, which means duplicate library rows, weak diagram
matches, and the gate in `routes/diagramLibrary.ts` over-rejecting.

**Change.**
1. Extend `CANONICAL_TOPIC_MAP` with the full primary curriculum (≈ 180 keys):
   - **Maths**: counting, place_value, addition_subtraction, multiplication_division,
     number_bonds, fractions_primary, decimals_primary, percentages_primary,
     measurement_length, measurement_mass, measurement_capacity, time, money,
     2d_shape, 3d_shape, position_direction, statistics_primary, ratio_primary,
     algebra_primary.
   - **English**: phonics, tricky_words, reading_comprehension_primary,
     spag_punctuation, spag_grammar, word_classes, sentence_types, story_writing,
     poetry_primary, non_fiction_writing, handwriting, spelling_patterns.
   - **Science**: plants_primary, animals_primary, habitats, human_body_primary,
     teeth_digestion, skeleton_muscles, light_primary, sound_primary,
     forces_primary, magnets_primary, materials_primary, states_of_matter_primary,
     electricity_primary, earth_space_primary, classification_primary,
     evolution_primary, weather_seasons.
   - **Geography**: maps_keys_symbols, compass_direction, uk_geography,
     continents_oceans, rivers_primary, mountains_primary, water_cycle_primary,
     volcanoes_primary, settlements, climate_zones, weather_primary,
     local_geography_fieldwork.
   - **History**: stone_age, bronze_iron_age, ancient_egypt, ancient_greece,
     romans, anglo_saxons, vikings, tudors, stuarts, victorians, ww1_primary,
     ww2_primary, local_history.
   - **Computing**: algorithms_primary, debugging, e_safety, scratch_coding,
     hardware_software, networks_primary, data_handling.
   - **Art & DT**, **Music**, **PE**, **RE**, **MFL**, **PSHE/RSE** — see
     full list in `topicNormalizer.ts` patch.
2. Add a `subjectFamily()` table for primary subjects so the gate in
   `routes/diagramLibrary.ts` knows e.g. that "Art" diagrams belong to family
   `art_dt` and shouldn't be served on a Geography sheet.
3. Add a "year band" tag (`KS1` / `LKS2` / `UKS2`) to the canonical map, so the
   library search can prefer band-appropriate entries before falling back to
   any year.

**Acceptance.**
- Lookup test: 200 sample primary topic phrasings (e.g. "money", "tell the time",
  "the human skeleton", "the Tudors") all resolve to a single canonical key
  with no fallbacks.
- Cross-subject gate test: requesting a Geography diagram for "Anglo-Saxons"
  returns `entry: null` (correct fail-closed) instead of an Egyptian pyramid.

---

## W5 — Activity-type variety quotas

**Problem.** Sheets still default to a long string of similar question types.
The primary prompt says "vary after every 3 questions" but doesn't enforce it.

**Change.**
1. Define an `ActivityType` enum (12 types: circle, match-line, fill-blank,
   tick-box, true-false, sort-into-columns, draw-and-label, colour-correct,
   word-search, sequence-cut-and-stick, table-fill, pictogram-read).
2. New validator stage `validatePrimaryVariety` (alongside existing validators):
   - KS1: at least 5 distinct activity types per sheet.
   - LKS2: at least 6 types.
   - UKS2: at least 7 types.
3. Adaptation engine (`adaptationEngine.ts`) gets a "boost variety" repair pass
   that swaps consecutive same-type sections with under-represented types.

**Acceptance.**
- Validator fails an artificial all-MCQ KS1 sheet, repair pass fixes it,
  and the same sheet passes second-pass validation.

---

## W6 — Diagram library: 2,000-entry primary catalogue

**Problem.** Audit (`docs/diagram-coverage.md`) shows 1,722 entries currently
exist; coverage of primary topics is near zero. This is the single biggest
quality lever for primary worksheets.

**Change — shipped with this plan.**
1. New catalogue: **`docs/primary-diagram-library.csv`** — **2,052 rows**
   curated for Y1–Y6 across all primary subjects (KS1: 577, LKS2: 918,
   UKS2: 477, KS1+KS2 branding: 80).
2. Generator: `tools/primary-diagram-catalogue/` (one module per subject, plus
   `generate.mjs`). Re-running the generator produces a deterministic CSV so
   we can diff additions over time.
3. Each row carries: `id, title, subject, topic, year_band, year_group,
   diagram_type, description, style_notes, tags, source, curated`. Columns map
   1:1 to the `diagram_library` DB schema. The `image_url` column is left blank
   — these are *briefs* for the artist/AI image step. As images are produced
   they are uploaded via Admin Panel → Diagram Library, which fills `image_url`
   and `asset_ref` and toggles `curated = 1`.
4. Distribution (engineered to "10× quality" by giving the AI an entry to
   reach for in every common primary lesson):
   - Mathematics: 548
   - English: 324
   - Science: 310
   - Geography: 138
   - History: 140
   - Computing: 82
   - Art & DT: 110
   - Music: 55
   - PE: 50
   - RE: 65
   - MFL (French + Spanish): 80
   - PSHE / RSE: 70
   - Branding / cross-curricular: 80

**Acceptance.**
- `npm run gen:primary-diagrams` produces a CSV identical to the committed one.
- After image upload, `GET /api/diagram-library/coverage` for primary subjects
  returns `topicsWithDiagramA ≥ 90%` and `topicsWithDiagramB ≥ 75%`.

---

## W7 — Print + accessibility

**Problem.** Primary sheets get printed on A4 in classrooms. Today rendering
sometimes pushes a single question over a page break, and there's no
"large-print" or "dyslexia-friendly" toggle in the UI for primary.

**Change.**
1. Promote the existing `accessibility-profiles.ts` "dyslexia friendly" preset
   to a default-on toggle for Y1–Y3.
2. Page-break audit (`diagramPageFitAudit.ts` already exists for diagrams) —
   extend it to flag *question splits* on primary, so the renderer can move
   the whole question onto the next page.
3. Add a "1-page version" mode that hard-caps a primary sheet at one A4 face
   (front-and-back maximum) — children disengage past 2 pages.
4. Voice-over / read-aloud: every pupil-facing instruction gets an `aria-label`
   and the renderer adds an optional 🔊 button per question (for use on
   smartboards / iPad).

**Acceptance.**
- Auto-print test: 30 sample primary sheets render to PDF with zero
  cross-page question splits.
- Lighthouse a11y score ≥ 95 for primary preview pages.

---

## Suggested rollout order

| Phase | Workstream | Time | Why this order |
|---|---|---|---|
| Phase A | W4 (taxonomy) + W6 (catalogue) | 2 weeks | Everything else relies on a clean topic key + diagram availability. Catalogue rows can be drafted in parallel with the topic map work. |
| Phase B | W3 (diagram-first content) + W2 (visual identity) | 2 weeks | Once the library is reachable, the AI prompt can require visuals, and the renderer can apply the house style. |
| Phase C | W1 (year-band reading age) + W5 (variety quotas) | 1 week | Tone and variety are the polish on a sheet that already looks the part. |
| Phase D | W7 (print + a11y) | 1 week | Final pass before announcing. |

---

## Files referenced by this plan

- `client/src/lib/ai.ts` — primary layout note, system prompt branching
- `client/src/lib/worksheet-generator.ts` — primary section targets
- `client/src/lib/worksheetConstraints.ts` — total marks, time estimate
- `client/src/lib/engines/adaptationEngine.ts` — repair passes
- `client/src/components/WorksheetRenderer.tsx` — primary header, section colours
- `client/src/lib/curriculumAuthorityPrompt.ts` — pedagogical register
- `server/lib/topicNormalizer.ts` — canonical topic map (W4 patch site)
- `server/routes/diagramLibrary.ts` — search + family gate
- `server/routes/ai.ts` — diagram lookup at generation time
- `server/db/index.ts` — `diagram_library` schema (no change required)
- `docs/diagram-coverage.md` — coverage audit instructions
- `docs/primary-diagram-library.csv` — **NEW**: 2,000-row primary catalogue
- `tools/primary-diagram-catalogue/` — **NEW**: catalogue generator
