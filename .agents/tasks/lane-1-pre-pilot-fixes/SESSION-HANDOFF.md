# Worksheet Generator Pre-pilot — Session Handoff

This file is the **resume point** for any fresh chat picking up the
worksheet-generator improvement programme. Read this first, then
`PHASE-PLAN.md`, then `LEDGER.md`.

Last updated: 2026-05-29.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Worksheet-generator pre-pilot programme.
         Three lanes: Lane 1 (eight surgical pre-pilot fixes, single
         PR), Lane 2 (USP polish — SEND collapse + fail-closed),
         Lane 3 (full roadmap — primary parity + diagrams + a11y +
         eval gating).
Resume:  .agents/tasks/lane-1-pre-pilot-fixes/SESSION-HANDOFF.md
Plan:    .agents/tasks/lane-1-pre-pilot-fixes/PHASE-PLAN.md
Ledger:  .agents/tasks/lane-1-pre-pilot-fixes/LEDGER.md
Branch:  feat/lane-1-pre-pilot-fixes (off main @ 3d50b97)
Audit:   docs/worksheet-generator-audit.md +
         docs/primary-worksheet-improvement-plan.md (intended output)
Constraint: SEND is the USP — every SEND change must be deterministic
            (fail-closed in the post-validator), not "asked nicely in
            the prompt and hope".
Goal: ship Lane 1 as a single PR; queue Lane 2 + Lane 3 as separate
      task folders once Lane 1 lands.
```

---

## Audit summary — why each lane exists

The audit pass uncovered a gap between what the source-of-truth specs
promise and what the code actually emits. Twelve major divergences,
ranked by classroom-impact severity.

### Headline classroom-impact bugs (Lane 1 fixes them)

1. **Section-3 mark badges silently broken.** Audit doc says use
   `(N marks)`; renderer regex at
   `client/src/components/WorksheetRenderer.tsx:1791` only matches
   `[N marks]`. Round-bracket marks lose badge + answer lines +
   working-out box.
2. **Primary worksheets still 3-3-3.** Audit doc says 5-4-5;
   `client/src/lib/worksheetSectionTargets.ts:42` still on 3-3-3 with
   no Section 3.
3. **HI Topic Summary not enforced.** `sendPromptFragments.ts:644`
   asks the AI; no validator checks. Deaf pupils can ship without it.
4. **EAL ships only Romanian + Spanish.** Top six UK pupil L1s are
   Urdu, Polish, Bengali, Punjabi, Arabic, Romanian (DfE Census).
5. **Anxiety "OPTIONAL BONUS" wording not enforced.** Prompt asks;
   nothing rewrites if the AI emits "Challenge".
6. **Placeholder leakage:** `[specific skill/concept N from Topic]`
   can land verbatim on pupil page if AI returns the template.
7. **Toolbar:** ~18 buttons in one row above a generated worksheet
   (`client/src/pages/Worksheets.tsx:5969–6198`). Cluttered.
8. **No teacher/pupil view consistency check** between edits and
   prints.

### USP-critical bugs (Lane 2 fixes them)

9. **Three SEND systems disagree.** `sendPromptFragments.ts`,
   `worksheetConstraints.ts:SEND_OVERLAYS`, `server/lib/overlayEngine.ts`
   — no test asserts they match. Phase 4 PR was supposed to retire the
   cosmetic-only table; it's still there.
10. **All ~30 post-validators are warn-only.** Nothing re-prompts or
    repairs. SEND markers, command-word fidelity, reading-age budget,
    bias — all advisory.
11. **No stacked-need test fixtures** (HI+EAL, ADHD+Dyslexia, etc.).

### Roadmap items (Lane 3 fixes them)

12. **Primary roadmap unimplemented.** 6-bucket reading age, vocab
    blocklist, mascots/badges/Andika, ~180 primary topic keys, variety
    quotas, inline diagrams, 1-page mode — all promised in W1–W7, none
    shipped.

Full evidence pack:
[docs/worksheet-generator-audit.md] (intended output) and the
detailed-finding table inside this folder's `PHASE-PLAN.md`.

---

## LANE 1 — Pre-pilot fixes (single PR — IN FLIGHT on this branch)

Branch: `feat/lane-1-pre-pilot-fixes` off `main@3d50b97`.

| # | Item | Files | Status |
|---|---|---|---|
| 1.1 | Renderer accepts both `[N marks]` and `(N marks)` | `client/src/components/WorksheetRenderer.tsx:1791` | ☐ todo |
| 1.2 | Prompt uses `(N marks)` on Section 3 only; remove stale "Q7, Q8, Q9" line | `client/src/lib/ai.ts:1416` | ☐ todo |
| 1.3 | Toolbar declutter: 10 primary buttons + More… menu | `client/src/pages/Worksheets.tsx:5969–6198` | ☐ todo |
| 1.4 | Teacher/pupil view consistency banner before print/PDF | `client/src/pages/Worksheets.tsx` | ☐ todo |
| 1.5 | Extend EAL `TERM_TRANSLATIONS` to Urdu, Polish, Bengali, Punjabi, Arabic, Romanian | `server/lib/overlayEngine.ts:121` | ☐ todo |
| 1.6 | Deterministic HI Topic Summary block (post-validator, fail-closed) | `client/src/lib/worksheetPostValidator.ts` + registry | ☐ todo |
| 1.7 | Deterministic Anxiety "OPTIONAL BONUS" rename (same post-validator) | `client/src/lib/worksheetPostValidator.ts` + registry | ☐ todo |
| 1.8 | Strengthen placeholder scrubber: catch `[skill 1 from Topic]` patterns | `client/src/lib/worksheetPostValidator.ts:749` | ☐ todo |

### Detailed change spec per item

#### 1.1 — Mark-badge regex

`WorksheetRenderer.tsx`:
```ts
// FROM:
const markMatch = trimmed.match(/^(.+?)(\[(\d+) marks?\])(.*)$/i);
// TO:
const markMatch = trimmed.match(/^(.+?)([\[\(](\d+)\s*marks?[\]\)])(.*)$/i);
```
Acceptance: a question stem ending in `(4 marks)` renders identically
to one ending in `[4 marks]` — same badge, same answer-line ramp, same
working-out logic.

#### 1.2 — Section-3 brackets + stale Q7-Q9 line

In `client/src/lib/ai.ts`:
1. Line 1416 — replace `Q7, Q8, Q9` with the dynamic Q-range expression
   already used elsewhere (`Q${sec1+sec2+1}–Q${sec1+sec2+sec3}`) and
   change the example mark format to `(N marks)`.
2. Add to the secondary system prompt a single sentence telling the AI
   to format Section 3 marks as `(N marks)` only — other sections stay
   `[N marks]`. Insert near line 2767 (the SECTION QUESTION COUNTS
   block) so the rule is co-located with the section contract.

#### 1.3 — Toolbar declutter (10 + More)

**Keep visible (10 primary actions):** Teacher/Student toggle,
text-size pill, Print Preview, Edit (with AI), Edit Manually, PDF,
Print, Save, Differentiate, ThreeTier (LA/MA/HA).

**Move into a single `More…` dropdown menu** (using
`@/components/ui/dropdown-menu`): Overlay, Typography, Pupil mode
(QR), Class pack, Lesson bundle, Scan & mark, Sections, QTI,
Translate, A11y audit, Braille, Read Aloud, Scenario Swap, Assign.

**Implementation note:** keep all existing `onClick` handlers
unchanged — only relocate the JSX. The Differentiate button at L6168
+ ThreeTier button at L6177 stay visible because they are the actual
differentiation USP.

#### 1.4 — View-consistency banner

After an edit (manual or AI), compute a hash of the pupil-facing
section content. If it differs from the last-printed snapshot, render
a yellow banner above the toolbar saying "You've edited this since
the last print — preview to confirm." Cleared on next Print or PDF.

```ts
const [lastPrintedHash, setLastPrintedHash] = useState<string | null>(null);
const currentPupilHash = useMemo(() => hashPupilSections(ws), [ws]);
// inside handlePrint() and handleDownloadPdf() after success:
setLastPrintedHash(currentPupilHash);
```

`hashPupilSections` is a small new helper (DJB2 over titles + content
of non-`teacherOnly` sections — keep it stable across renders).

#### 1.5 — EAL languages

In `server/lib/overlayEngine.ts:121`:
- Add 5 new top-level keys to `TERM_TRANSLATIONS`: `ur` (Urdu), `pl`
  (Polish), `bn` (Bengali), `pa` (Punjabi), `ar` (Arabic). Keep `ro`
  and `es` (don't delete existing data).
- Update `parseRequestedLanguage` to detect each language by English
  name and native script.
- Update `languageLabel` map.
- Each language gets the same ~30 STEM keywords as `ro` for v1 — same
  set of physics/maths terms (current/voltage/resistance/etc.) plus
  the maths terms (equation/fraction/numerator/denominator). Source:
  hand-curated from the canonical L1 list at
  `client/src/lib/worksheetSectionTargets.ts:206-216`. Densification
  to a wider per-subject vocabulary is a Lane 3 follow-up.

#### 1.6 + 1.7 — Deterministic SEND markers (one validator)

New function in `client/src/lib/worksheetPostValidator.ts`:
```ts
export function enforceSendOverlayMarkers(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult { … }
```

**HI** (`hi` / `hearing-impairment` / `deaf`): ensure a section with
type `"topic-summary"` titled `"Topic Summary — read first"` exists
immediately before the first question section. If absent, INSERT one
synthesised from the worksheet's Key Vocabulary + Learning Objective
sections. Stamp warning:
`"[Phase 4 — HI] Topic Summary block was missing; inserted deterministically."`

**Anxiety** (`anxiety` / `semh` / `mental-health`): rename any
`"Challenge"` / `"Challenge Question"` titled section to
`"OPTIONAL BONUS — only if you want to!"`; rename any section title
starting `"Section 1"` / `"Section A"` to begin with `"WARM-UP"`.
Idempotent — a second run is a no-op.

Register in `worksheetPostValidatorRegistry.ts` BEFORE
`enforceSelfReflectionTopicAnchor` (so reflection sees the final
section titles). New name: `"send-overlay-markers"`.

**Hard constraint:** do NOT mutate any existing section's `id`,
`type`, `imageUrl`, `assetRef`, or `marks` — only `title` for
Anxiety, and only INSERT a fresh section for HI. The overlay engine's
`assertBaseSectionsPreserved` runs later and checks `title` too —
which is fine because the post-validator runs before the overlay
engine sees the worksheet.

#### 1.8 — Stronger placeholder scrubber

Extend `PLACEHOLDER_RE` in `worksheetPostValidator.ts:751` to also
catch:
- `[specific skill/concept N from <topic>]` and variants
- `[learning objective]` literal
- `[5 specific skills/concepts from <topic>]`
- `[<topic>]` standalone (when the AI didn't substitute)
- `[CONFIDENCE_TABLE]`, `[WRITTEN_PROMPTS]`, `[EXIT_TICKET]` markers
  if they leak verbatim instead of being filled.

Pure regex extension. Already idempotent.

### Lane 1 test plan

1. `npm run check` — TypeScript clean across all touched files.
2. `npm test -- worksheetPostValidator` — unit tests for the new
   `enforceSendOverlayMarkers` validator + extended placeholder
   scrubber.
3. `npm test -- worksheetScrutiny` — full scrutiny suite must still
   pass.
4. Smoke render in dev: generate AQA Y10 Biology / Respiration sheets
   with these SEND profiles and confirm acceptance:
   - HI → Topic Summary block present at top
   - ADHD → tick-boxes + brain break (regression check, no change)
   - Anxiety → "OPTIONAL BONUS" wording, "WARM-UP" title
   - EAL with pupil L1 = Urdu → Urdu glossary lines on key terms
   - All four print without truncating questions
   - Toolbar shows ≤ 10 primary buttons + More menu
   - Banner appears after editing and before printing

### Lane 1 rollback

Single PR — single revert. No DB migrations, no env-var changes, no
external service contract changes.

---

## LANE 2 — USP polish (separate PR — QUEUED)

Goal: turn the SEND USP from "asked nicely" into "deterministically
guaranteed", and collapse the three SEND systems into one source of
truth so they cannot drift apart again.

| # | Item | Files | Status |
|---|---|---|---|
| 2.1 | Collapse three SEND systems into one source of truth | `sendPromptFragments.ts` + `overlayEngine.ts` + `worksheetConstraints.ts:SEND_OVERLAYS` | ☐ queued |
| 2.2 | Fail-closed SEND-marker checklist for ALL needs | `worksheetPostValidator.ts` + registry | ☐ queued |
| 2.3 | Stacked-needs test fixtures (HI+EAL, ADHD+Dyslexia, Anxiety+MLD, Dyscalculia+EAL) | `server/tests/worksheet-eval/fixtures/` | ☐ queued |
| 2.4 | Primary 5/4/5 layout (replace 3/3/3 + add primary Section 3) | `worksheetSectionTargets.ts` + `ai.ts` primary path + `engines/planner.ts` | ☐ queued |
| 2.5 | Single marks→lines mapping shared by worksheet and revision-mat | `worksheetSectionTargets.ts:linesForMarks` + `WorksheetRenderer.tsx:5174` | ☐ queued |
| 2.6 | Curriculum-authority preamble bound to primary AND revision-mat paths | `ai.ts:1452` (primary opener) + `ai.ts:1062` (revision-mat opener) | ☐ queued |
| 2.7 | Six revision-tip categories matching the audit-doc names | `revisionTipsBuilder.ts` + `ai.ts:2515` + `worksheet-generator-audit.md` | ☐ queued |
| 2.8 | aria-labels on every pupil-facing element | `WorksheetRenderer.tsx` | ☐ queued |

### Lane 2 detailed specs

#### 2.1 — Collapse SEND systems

Pick `sendPromptFragments.ts` as the single source of truth (it has
the richest content rules). Auto-generate the cosmetic settings table
in `worksheetConstraints.ts:SEND_OVERLAYS` and the post-gen overlay
hints in `overlayEngine.ts` from the same data structure. Add a build
test that fails if any of the three drift.

Acceptance: a single TS interface `SendNeedSpec` per need, with
`promptRules` / `cosmetics` / `overlayBoxes` fields. Existing
behaviour preserved exactly.

#### 2.2 — Fail-closed SEND markers

Extend `enforceSendOverlayMarkers` (built in Lane 1.6/1.7) with the
remaining needs:

- **ADHD:** every question section content starts with `"[ ] "`;
  brain-break line present after middle of Section B; reflection ends
  with focus-rating row.
- **Dyslexia:** Step-by-step method box present before Section A;
  every key subject term bolded on first use (markdown `**term**`).
- **MLD:** topic-context block at top of each section; calculation
  questions have a Key Facts / formula reference.
- **Dyscalculia:** Number Steps box on every calculation question
  (already in overlay engine; promote to fail-closed enforcement).
- **EAL:** Key Vocabulary box at the start of every section; every
  written response has a sentence frame.
- **VI:** every diagram referenced has a text description
  immediately alongside.
- **Dyspraxia:** Section A uses MCQ/matching/circle for ≥ 3
  questions; Challenge uses tick/circle/label, never extended writing.

Each missing marker → repair (insert / rename / annotate) +
warning. Idempotent.

#### 2.3 — Stacked-needs fixtures

Add 10 fixtures under `server/tests/worksheet-eval/fixtures/stacked/`
covering common dual-need pupil profiles. Run them on every PR via the
existing `worksheet-eval.yml` workflow. The eval gate goes
PR-blocking only after Lane 3.10 (baseline settled).

#### 2.4 — Primary 5/4/5

`PRIMARY_SECTION_QUESTION_TARGETS` → `{ recall: {target:5}, understanding: {target:4}, application: {target:5} }`.
`worksheetConstraints.ts` primary `sectionDefs` gets a third entry —
"SECTION C — SHOW WHAT YOU KNOW" — with Bloom-aware spec. `engines/
planner.ts:165` 3-3-3 hard-coded primary plan replaced with the
shared targets module so there is one source of truth.

#### 2.5 — Single marks→lines mapping

The revision-mat grid at `WorksheetRenderer.tsx:5174` defines its own
`getNumLines(marks)` function. Replace with a call to
`linesForMarks()` from `worksheetSectionTargets.ts`. Optionally
collapse `linesForMarks` to the audit-doc numbers (1m→2, 2m→3, 3m→4,
4m→5) — but this is a behaviour change, so flag it for the audit doc
update too.

#### 2.6 — Authority preamble everywhere

`ai.ts:1452` (primary opener) and `ai.ts:1062` (revision-mat opener)
both bypass `buildCurriculumAuthorityPreamble`. Wire both paths
through it, with an additional `register: "primary" | "revision-mat"`
option that scales the manifesto's tone (warm-and-precise for
primary; coursework-prep for revision mat). Acceptance: every
generated worksheet's system prompt opens with the authority chain.

#### 2.7 — Six revision tips

Replace the five-category builder
(`command-word/watch-out/method/mark-scheme/time`) with the audit-
doc-named six (`vocabulary/worked-example/common-mistake/past-papers/
retrieval/learning-objective`). Update the prompt at `ai.ts:2515`,
the builder at `revisionTipsBuilder.ts`, and the audit doc to match.
Acceptance: every revision tip pulled from real topic data
(vocabulary list, worked example on the sheet, common-mistakes
section, past-paper reference for the year/board, retrieval prompt,
LO statement).

#### 2.8 — aria-labels

Every pupil-facing element gets a screen-reader label:
- Question stem: `aria-label="Question {qNum}, {marks} marks: {stem}"`
- Mark badge: `aria-hidden="true"` (already announced via question)
- Section heading: `aria-label="Section {n}, {label}"`
- Answer block: `<fieldset><legend>` per question
- Toolbar buttons (after Lane 1.3 declutter): every button + dropdown
  item gets a real label.

Run Lighthouse a11y audit; target ≥ 95 on the rendered worksheet
preview page.

---

## LANE 3 — Roadmap polish (multiple separate PRs — QUEUED)

Goal: deliver the W1–W7 primary roadmap and the Phase F2 backlog (KS3
/ Y11 / A-Level / OCR), pull the diagram catalogue into the live DB,
and make the eval gate PR-blocking.

| # | Item | Files | Status |
|---|---|---|---|
| 3.1 | Six-bucket primary reading age (per-year) | `ai.ts:1455` primary path | ☐ queued |
| 3.2 | Per-year vocabulary blocklist with re-prompt loop | NEW `client/src/lib/primaryVocabBlocklist.ts` + post-validator | ☐ queued |
| 3.3 | ~180 primary topic keys in `CANONICAL_TOPIC_MAP` | `server/lib/topicNormalizer.ts` | ☐ queued |
| 3.4 | Pull diagram catalogue (5,975 briefs) into live DB | `tools/diagram-catalogue/` + image pipeline + `diagram_library` table | ☐ queued |
| 3.5 | Inline diagram per question for KS1/KS2 (W3) | NEW `getPrimaryInlineDiagram()` + prompt | ☐ queued |
| 3.6 | Y11, KS3, A-Level, OCR exemplars + scaffolds | `client/src/data/exemplars/` + `client/src/data/scaffolds/` | ☐ queued |
| 3.7 | Page-break audit for question splits on primary | NEW validator in `worksheetPostValidator.ts` | ☐ queued |
| 3.8 | Mascots, section badges, Andika font for primary | `WorksheetRenderer.tsx` + branding section of diagram catalogue | ☐ queued |
| 3.9 | Single-page mode for KS1 sheets | `WorksheetRenderer.tsx` + new render-time flag | ☐ queued |
| 3.10 | Make `worksheet-eval.yml` block PRs on regression | `.github/workflows/worksheet-eval.yml` + baseline JSON | ☐ queued |

### Lane 3 detailed specs

#### 3.1 — Six-bucket reading age

Replace the 3-bucket switch in `ai.ts:1455` with a 6-entry table
keyed off `yearNum` exactly as W1 specifies (Y1 max 6 words / Phase 5
phonics through Y6 max 16 words / one Tier-3 word allowed if it's the
curriculum word).

#### 3.2 — Per-year vocab blocklist

New file `client/src/lib/primaryVocabBlocklist.ts`:
```ts
export const KS1_BLOCKED = [...];        // strict: no analyse / evaluate / etc.
export const LKS2_BLOCKED = [...];       // moderate
export const UKS2_BLOCKED = [...];       // light
```
Post-validator scans pupil-facing sections for blocked words; if
found, regenerates that section (re-prompt loop, not warn-only).
Acceptance: KS1 sheet on any topic contains zero blocked words.

#### 3.3 — Primary topic keys

Extend `server/lib/topicNormalizer.ts:CANONICAL_TOPIC_MAP` with the
~180 primary keys from the W4 patch list (maths, English, science,
geography, history, computing, art/DT, music, PE, RE, MFL, PSHE).
Add `subjectFamily()` table and `KS1` / `LKS2` / `UKS2` band tags.
Lookup test fixture: 200 primary phrasings → all match cleanly.

#### 3.4 — Diagram catalogue → live DB

`docs/diagram-library-catalogue.csv` has 5,975 briefs with empty
`image_url`. Build (or hire) the image pipeline that turns briefs
into rendered SVG/PNG, populates `image_url` and `asset_ref`, flips
`curated=1`. Coverage acceptance: ≥ 95% of canonical keys have
Diagram A; ≥ 75% have Diagram B.

#### 3.5 — Inline diagrams (W3)

New helper `getPrimaryInlineDiagram(yearNum, subject, topic, qType)`
pulls a small diagram brief from the catalogue scoped to the
year-band. New prompt rule: Y1–Y2 every question has an inline
visual; Y3–Y4 every section does; Y5–Y6 ≥ 50% of sections do.

#### 3.6 — Bank densification

Add exemplars + scaffolds for:
- AQA / Edexcel / OCR Y11 — three sciences + maths + English
- AQA / Edexcel / OCR KS3 — three sciences + maths + English
- A-Level (priority: maths, sciences, English Lit/Lang)
- OCR Y10 (currently the bank has spec-points only, no exemplars).
- Geography, History, MFL once architecture is ready.

#### 3.7 — Question-split audit

Pre-render check that every question's stem and answer block fall on
the same page. If not, force a page break before the question.
Existing diagram-fit audit (`diagramPageFitAudit.ts`) is the
template.

#### 3.8 — Mascots / badges / Andika

- `fmt.fontFamily` on primary paths becomes
  `"Andika", "Sassoon Primary", "Atkinson Hyperlegible", sans-serif`.
- Three rotating mascots seeded under `subject="branding"` in the
  diagram library; AI places them via `[[DIAGRAM:…]]` markers.
- Section badges: small SVG sprite per section name ("warm-up",
  "let's practise", "challenge", "reflection").

#### 3.9 — 1-page mode

New render-time flag `compactMode: "single-page" | "default"`. When
single-page is on, page hard-cap is one A4 face front/back. Used by
KS1 by default after a brief settling period (or via a teacher
toggle). Existing W7 spec.

#### 3.10 — PR-blocking eval gate

`.github/workflows/worksheet-eval.yml` is currently
non-blocking and the YAML even acknowledges this. Once the SEND
fixtures from 2.3 + the question-split audit from 3.7 are stable for
two consecutive runs, flip the workflow to a required PR check.
Baseline pinned to a JSON in `server/tests/worksheet-eval/baseline/`;
PRs may bump the baseline only with a documented justification.

---

## Backlog ordering note

The lanes can run in parallel after Lane 1 lands. Recommended
ordering once Lane 1 is merged:

- Start Lane 2 immediately (USP polish — biggest classroom-impact
  bang for buck).
- Lane 3.10 (eval gate) blocks until 2.3 (stacked-needs fixtures) is
  in.
- Lane 3.4 (diagrams DB) can start any time — no dependency.
- Lane 3.3 (primary topic keys) blocks Lane 3.5 (inline diagrams).

---

## Files in this folder

- `SESSION-HANDOFF.md` (this file) — high-level resume + all 3 lanes.
- `PHASE-PLAN.md` — Lane 1 specifics (acceptance / risk / order).
- `LEDGER.md` — append-only progress log.
- `RESUME.md` — (to be created when Lane 1 is mid-implementation) —
  the precise next file/line to edit so a fresh chat can pick up
  without re-reading the audit.
