# Lane 2 — USP Polish — Session Handoff

This file is the **resume point** for any fresh chat picking up Lane 2
work. Read this first, then `PHASE-PLAN.md`, then `LEDGER.md`.

Last updated: 2026-05-29 — Branch `feat/lane-2-usp-polish` created off
`feat/lane-1-pre-pilot-fixes`. Work in progress.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Worksheet-generator pre-pilot programme.
         Lane 1 (eight surgical pre-pilot fixes) shipped as PR #144.
         Lane 2 = USP polish — turn the SEND USP from "asked nicely
         in the prompt" into "deterministically guaranteed", and
         collapse the three SEND systems into one source of truth.
Resume:  .agents/tasks/lane-2-usp-polish/SESSION-HANDOFF.md
Plan:    .agents/tasks/lane-2-usp-polish/PHASE-PLAN.md
Ledger:  .agents/tasks/lane-2-usp-polish/LEDGER.md
Branch:  feat/lane-2-usp-polish (off feat/lane-1-pre-pilot-fixes —
         rebase onto main once PR #144 lands)
Audit:   docs/worksheet-generator-audit.md
         docs/primary-worksheet-improvement-plan.md
         (intended output)
Constraint: SEND IS THE USP. Every change must be deterministic
            (fail-closed in the post-validator), not "asked nicely
            in the prompt and hope".
```

## Lane 2 items

| # | Item | Files | Status |
|---|---|---|---|
| 2.2 | Fail-closed SEND-marker checklist for ALL needs (ADHD, Dyslexia, MLD, Dyscalculia, EAL, VI, Dyspraxia, on top of HI/Anxiety from Lane 1) | `worksheetPostValidator.ts` + registry | ☐ todo |
| 2.7 | Six revision-tip categories matching the audit-doc names | `revisionTipsBuilder.ts` + `ai.ts:2515` + audit doc | ☐ todo |
| 2.5 | Single marks→lines mapping shared by worksheet and revision-mat | `worksheetSectionTargets.ts:linesForMarks` + `WorksheetRenderer.tsx:5174` | ☐ todo |
| 2.6 | Curriculum-authority preamble bound to primary AND revision-mat paths | `ai.ts:1452` (primary opener) + `ai.ts:1062` (revision-mat opener) | ☐ todo |
| 2.4 | Primary 5/4/5 layout (replace 3/3/3 + add primary Section 3) | `worksheetSectionTargets.ts` + `ai.ts` primary path + `engines/planner.ts` | ☐ todo |
| 2.8 | aria-labels on every pupil-facing element | `WorksheetRenderer.tsx` | ☐ todo |
| 2.3 | Stacked-needs test fixtures (HI+EAL, ADHD+Dyslexia, Anxiety+MLD, Dyscalculia+EAL) | `server/tests/worksheet-eval/fixtures/` | ☐ todo |
| 2.1 | Collapse three SEND systems into one source of truth | `sendPromptFragments.ts` + `overlayEngine.ts` + `worksheetConstraints.ts:SEND_OVERLAYS` | ☐ todo |

**Order rationale:** 2.2 first because it has the largest direct USP
impact (more SEND needs guaranteed-correct on every worksheet). 2.7,
2.5, 2.6 are small surgical wins. 2.4 is medium (primary parity).
2.8 is breadth UI work. 2.3 is the test scaffold for the rest. 2.1
is the biggest refactor and lands last so it doesn't churn the
shipping work above it.

## Detailed change spec per item

### 2.2 — Fail-closed SEND markers for ALL needs

Lane 1.6/1.7 added `enforceSendOverlayMarkers` covering HI + Anxiety.
Extend it (or split into per-need helpers) to cover the remaining
needs the audit doc / `sendPromptFragments.ts` specifies:

- **ADHD** (`adhd`):
  - Every pupil-facing question content starts with `"[ ] "` (open
    square-bracket, space, close square-bracket, space) — the visible
    tick box. If absent, prepend.
  - Brain-break line present after the middle question of Section B
    (i.e. mid-sheet for the 6–8-question understanding section). If
    absent, insert a section with type `"send-support"` and content
    `"🧠 BRAIN BREAK — stand up and stretch for 30 seconds before
    continuing!"`.
  - Reflection ends with focus-rating row (`"How focused were you
    today? 1 / 2 / 3 / 4 / 5"`). If absent, append.
  - Challenge labelled `"BONUS — only if you want to!"` (note: ADHD
    uses "BONUS", Anxiety uses "OPTIONAL BONUS — only if you want
    to!". Different by design.)

- **Dyslexia** (`dyslexia`):
  - Step-by-step method box present immediately before Section A. If
    absent, insert one synthesised from the worked example or
    learning objective.
  - Every key subject term **bolded on first use** (markdown
    `**term**`). Detection: first occurrence of any vocabulary-section
    term within pupil-facing content. Idempotent: if already bold,
    skip.
  - Word Bank section present at the start of each section (4–6 terms
    + plain-English definitions). If a top-level Key Vocabulary
    section exists, re-emit a slim copy at the top of each question
    section.

- **MLD** (`mld`):
  - Topic-context block at top of each section (similar to HI Topic
    Summary but worded for working-memory support: "Remember: in
    this section we are working on …").
  - Calculation questions have a Key Facts / formula reference box
    inline.

- **Dyscalculia** (`dyscalculia`):
  - Number Steps box on every calculation question (Lane 1 had this
    in `overlayEngine.ts` — promote to fail-closed enforcement so the
    post-validator stamps it even if the overlay engine wasn't run).
  - Key Facts box at top of Section B.

- **EAL** (`eal` / `esl`):
  - Key Vocabulary box at the start of every section (max 8 terms,
    plain-English defs). The bilingual glossary from Lane 1.5 is
    additive — this is the English-only baseline.
  - Every written-response question has a sentence frame (e.g. "The
    answer is ___ because ___" or "This shows that ___"). If absent,
    append a frame to the question.

- **VI** (`vi` / `visual-impairment`):
  - Every diagram referenced in question content has a text
    description immediately alongside. Detection: section type
    contains "diagram" + sibling/child has no `caption` or
    `altText`. Fix: synthesise an alt-text fallback from the
    diagram title + label list.
  - No diagram-only questions: if a question stem contains
    "[diagram]" / "see image" with no text equivalent, warn loudly.

- **Dyspraxia** (`dyspraxia` / `dcd`):
  - Section A (recall) uses MCQ / matching / circle for at least 3
    of the questions. If <3, warn (don't auto-rewrite — that's an
    LLM job).
  - Challenge uses tick / circle / label, never extended writing. If
    extended, rewrite the prompt prefix to "circle / tick / label"
    and warn.

**Implementation note:** Lane 1's `enforceSendOverlayMarkers`
signature already supports this. Either add new branches to that
function or split it into one helper per need with a shared
dispatcher. Idempotency is mandatory.

### 2.7 — Six revision-tip categories matching audit-doc names

The audit doc names six categories (vocabulary / worked-example /
common-mistake / past-papers / retrieval / learning-objective). The
code currently ships five different categories (command-word /
watch-out / method / mark-scheme / time).

- File: `client/src/lib/revisionTipsBuilder.ts`
- File: `client/src/lib/ai.ts:2515` (the per-section instruction)
- File: `client/src/lib/ai.ts:1575-1582` (the structured-prompt block)
- File: `docs/worksheet-generator-audit.md` Phase 3 (update if the
  rewrite picks a different set than the audit doc names)

Pick **one** set of six categories. The audit-doc set is more
pedagogically sound (each tip is anchored to a concrete piece of
worksheet content) so I'd lean towards keeping that and updating the
code. But "command word" + "watch out" + "mark scheme" + "time" are
also useful examiner-voice signals that don't map cleanly to the
audit-doc list.

**Recommended target list (lifts the strengths of both):**
1. **VOCABULARY** — names actual vocabulary terms from the topic
2. **WORKED EXAMPLE** — references the worked example on this sheet
3. **COMMON MISTAKE** — names a real misconception from the topic
4. **MARK SCHEME** — how marks are awarded for the section's tariff
5. **PAST PAPERS** — directs to a real past-paper reference for this
   subject + topic + board
6. **RETRIEVAL** — retrieval-practice instruction naming the topic

Update audit doc if this differs from the original list.

### 2.5 — Single marks→lines mapping

Two mappings exist:
- `linesForMarks(marks)` in `client/src/lib/worksheetSectionTargets.ts:117`
  — used by the worksheet renderer.
- Inline `getNumLines(marks)` in `client/src/components/WorksheetRenderer.tsx:5174`
  — used by the revision-mat grid (`>= 4 marks → 6 lines`, else → 3
  lines).

Replace the inline `getNumLines` with a call to `linesForMarks`.
Optionally, also re-align `linesForMarks` to the audit-doc numbers
(1m→2, 2m→3, 3m→4, 4m→5) — but this is a behaviour change that may
make 4+m questions feel cramped. Either:
(a) Update `linesForMarks` + audit doc together (preferred),
(b) Or document the deliberate divergence in the function comment
    (a 5-line answer space is too tight for a 4-mark GCSE Q in
    practice; the current 6 lines is correct).

### 2.6 — Curriculum-authority preamble for primary + revision-mat

The Phase 5 preamble (`buildCurriculumAuthorityPreamble`) is currently
only injected on the secondary system prompt at `ai.ts`. The primary
system prompt at `ai.ts:1452` and the revision-mat opener at
`ai.ts:1062` use weaker, separate openers.

Wire both paths through `buildCurriculumAuthorityPreamble`. Primary
needs an extra `register: "primary"` parameter so the manifesto's
tone scales: "warm-and-precise teacher, not a generic tutor". The
existing `keyStage` switch in `buildCurriculumAuthorityPreamble`
already produces the KS1/KS2 anchor clauses; this is a wiring fix
not a content change.

### 2.4 — Primary 5/4/5

`PRIMARY_SECTION_QUESTION_TARGETS` in
`client/src/lib/worksheetSectionTargets.ts:42`:
```ts
// FROM:
export const PRIMARY_SECTION_QUESTION_TARGETS = {
  recall:        { min: 3, target: 3, max: 4 },
  understanding: { min: 3, target: 3, max: 4 },
  application:   { min: 3, target: 3, max: 4 },
} as const;
// TO:
export const PRIMARY_SECTION_QUESTION_TARGETS = {
  recall:        { min: 5, target: 5, max: 6 },
  understanding: { min: 4, target: 4, max: 5 },
  application:   { min: 5, target: 5, max: 6 },
} as const;
```

Then:
- `worksheetConstraints.ts:285-296` primary `sectionDefs` keeps three
  entries but the third one's heading should be "SECTION C — SHOW
  WHAT YOU KNOW" or similar age-appropriate exam-lite name.
- `client/src/lib/engines/planner.ts:165-167` 3-3-3 hard-coded
  primary plan should be replaced with a call to
  `PRIMARY_SECTION_QUESTION_TARGETS` so there is one source of truth.
- `ai.ts` primary path generates 5/4/5 questions with appropriate
  scaffolding for KS1 / LKS2 / UKS2.

### 2.8 — aria-labels

Every pupil-facing element gets a screen-reader label. Audit pass on
`client/src/components/WorksheetRenderer.tsx`:

- Question stems wrapped in a `role="group" aria-label="Question {n},
  {marks} marks"`.
- Mark badges: `aria-hidden="true"` (announced via the question
  group label).
- Section headings: `aria-label="Section {n}, {bloomLevel} questions"`.
- Answer block: `<fieldset><legend>` per question.
- Toolbar buttons (after Lane 1.3 declutter): every button gets an
  `aria-label` matching its visible text (Tailwind's icon-only
  buttons don't have one today).
- Dropdown menu items: `<DropdownMenuItem>` already supports
  aria-label; add for icon-only items.

Target: Lighthouse a11y score ≥ 95 on the rendered worksheet preview
page.

### 2.3 — Stacked-needs test fixtures

Add fixtures under `server/tests/worksheet-eval/fixtures/stacked/`
covering common dual-need pupil profiles:

1. HI + EAL (Urdu) — Y10 Biology Respiration
2. HI + EAL (Polish) — Y10 Maths Quadratics
3. ADHD + Dyslexia — Y10 English Macbeth
4. Anxiety + MLD — Y9 Maths Fractions
5. Dyscalculia + EAL (Bengali) — Y10 Maths Algebra
6. ASC + Anxiety — Y10 Chemistry Bonding
7. VI + Dyslexia — Y10 Physics Forces
8. Dyspraxia + ADHD — Y9 English Creative Writing
9. SLCN + EAL (Punjabi) — Y10 Geography Rivers
10. Working memory + ADHD — Y9 History WW1

Each fixture asserts:
- Both needs' markers are present (e.g. HI Topic Summary AND EAL
  glossary AND Urdu translation block).
- Neither overlay erases the other's marker.
- Section structure preserved (5/4/5 primary or 7/7/5+1 secondary).

Run on every PR via the existing `worksheet-eval.yml` workflow.

### 2.1 — Collapse three SEND systems into one source of truth

Pick `sendPromptFragments.ts` as the single source of truth (it has
the richest content rules). Auto-generate (or remove) the cosmetic
settings table in `worksheetConstraints.ts:SEND_OVERLAYS` and the
post-gen overlay hints in `overlayEngine.ts` from the same data
structure.

New shape:
```ts
interface SendNeedSpec {
  id: string;
  name: string;
  promptRules: string[];          // for the AI
  cosmetics: {
    fontSize?: string;
    lineHeight?: number;
    letterSpacing?: string;
    // ... renderer-only settings
  };
  postGenMarkers: {
    // ID literal markers the deterministic post-validator must enforce
    sectionTitleRewrites?: Array<{ from: RegExp; to: string }>;
    insertedSections?: Array<{ type: string; title: string; build: (ws: …) => string }>;
    perQuestionPrefix?: string;
  };
  overlayBoxes?: Array<{ heading: string; lines: string[] }>;
}
```

Add a build test that fails if any of the three legacy locations
(`worksheetConstraints.SEND_OVERLAYS`, `overlayEngine.build*Support`,
`sendPromptFragments.SEND_ADAPTATION_SPECS`) drift from the unified
spec.

## Test plan (run before each push)

1. `npm run check` — TypeScript clean (acceptable: only the four
   pre-existing tsconfig env errors).
2. `npx vitest run server/tests/worksheetScrutiny.test.ts` — pre-existing
   failure count must not increase (Lane 1 baseline: 32 failed / 699
   passed).
3. Targeted unit tests for each new validator (added under
   `client/src/lib/__tests__/`).
4. Smoke render in dev: each acceptance criterion above verified
   manually for at least one worksheet per SEND need.

## Rollback plan

Each item is its own commit on this branch. Lane 2.2 is the largest
single commit; a revert of that commit restores Lane 1 behaviour. The
SEND system collapse (2.1) is the only commit that mutates main code
paths beyond adding a validator — keep it last so a partial revert
leaves the rest of Lane 2 intact.

## What is NOT in this PR (Lane 3 / backlog)

See `../lane-1-pre-pilot-fixes/SESSION-HANDOFF.md` Lane 3 section. The
big rocks:

- Six-bucket per-year primary reading age
- Per-year vocabulary blocklist with re-prompt loop
- ~180 primary topic keys
- Pull diagram catalogue (5,975 briefs) into live DB
- Inline diagram per question for KS1/KS2
- Y11/KS3/A-Level/OCR exemplars + scaffolds
- Page-break audit for question splits
- Mascots / Andika / section badges
- 1-page mode for KS1
- PR-blocking eval gate
