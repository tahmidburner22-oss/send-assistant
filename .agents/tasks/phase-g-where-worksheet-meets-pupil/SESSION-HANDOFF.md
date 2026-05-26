# Phase G — Session Handoff

This file is the **resume point** for any fresh chat picking up the
Phase G work. Read this first, then `PHASE-PLAN.md`, then
`LEDGER.md`, then the relevant `features/FEAT-G*.json`.

Last updated: 2026-05-26 — Combined PR `feat/phase-g-h-implementation`
shipped functional code for all 12 implementation work units (G1-G6,
G9, G12-G15, G17). The PR also ships the 12 Phase H work units in
the same branch. See Phase H SESSION-HANDOFF for that scope.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Phase G + H implementation shipped on
         a single combined branch `feat/phase-g-h-implementation` (the
         "lowest-PR-count" path the team asked for). Each work unit
         landed as a self-contained pure library + minimal UI scaffold;
         deep wiring into Worksheets.tsx (~7,500 lines) and
         WorksheetRenderer.tsx (~8,500 lines) is intentionally deferred
         to follow-up PRs so reviewers can audit the new surfaces in
         isolation.
Resume:  .agents/tasks/phase-g-where-worksheet-meets-pupil/SESSION-HANDOFF.md
Plan:    .agents/tasks/phase-g-where-worksheet-meets-pupil/PHASE-PLAN.md
Ledger:  .agents/tasks/phase-g-where-worksheet-meets-pupil/LEDGER.md
Constraint: Sandbox is INTEGRATIONS_ONLY — npm install is unavailable.
            CI runs the full type-check + vitest suite on PR push.
            Big-file constraint still applies (do not read ai.ts /
            Worksheets.tsx / WorksheetRenderer.tsx in full from a fresh
            chat).
Goal: review combined-PR work unit by work unit; pick a follow-up
      wiring task from "What is next" below.
```

## What is done

### G1 — Pupil-facing auto-marking (Tier 1, M)

- `client/src/lib/answerVerifier.ts` — pure deterministic verifier
  for numeric / short-text / mcq / structured / open answer formats.
  Uses Levenshtein ≤1 for words >6 chars; expands a built-in
  synonym bag and respects metadata.markSchemeSynonyms. Surfaces a
  diagnosed-misconception message when the wrong MCQ letter matches
  a `metadata.misconceptionLinks` distractor.
- `client/src/lib/companion-answer-log.ts` — per-token-keyed
  localStorage log + summarizer. Idempotent on
  `(sectionIndex, attemptedAt)`. Capped at 200 attempts (matches
  schema cap). Falls back to in-memory storage in node tests.
- `client/src/components/AnswerEntryPanel.tsx` — input/radio/textarea
  per mode + tick/cross result card + collapsible hint-ladder
  disclosure.
- Schema additions: `section.answerSpec`, `metadata.companionAttempts`.

### G2 — Another-one-like-this (Tier 1, S)

- `client/src/lib/anotherOneLikeThis.ts` — pure dispatcher;
  consumes `curriculumBank.lookupBySpecRef` and falls back to a
  caller-supplied LLM regenerator when the bank is exhausted.
  Honours `excludeExemplarIds`. Stamps
  `metadata.questionProvenance.via = 'bank' | 'llm-fallback'`.
- `client/src/components/AnotherOneButton.tsx` — teacher-only
  one-click button; `.no-print`.

### G3 — Lesson archetypes (Tier 1, M)

- `client/src/lib/lessonArchetypes.ts` — five frozen
  ArchetypeDefinition objects + `buildArchetypeBrief` helper.
- `client/src/lib/promptSections/archetypeDirectives.ts` — prompt
  block to inject into `structuredSystemSections`.
- `client/src/components/ArchetypePickerDialog.tsx` — modal.
- Schema additions: `metadata.lessonArchetype`,
  `metadata.sectionTargetsOverride`.

### G4 — Procedural activities (Tier 1, M)

- `client/src/lib/proceduralActivities/seededRandom.ts` — mulberry32
  PRNG.
- `client/src/lib/proceduralActivities/wordsearch.ts` — N×N grid +
  placements; size escalation if words don't fit.
- `client/src/lib/proceduralActivities/crossword.ts` — greedy
  interlocking; 50 seeded restarts; emits `skipped[]` warnings.
- `client/src/lib/proceduralActivities/matching.ts` — seeded shuffle
  with at-least-one-displacement guarantee.
- `client/src/lib/proceduralActivities/cloze.ts` — accepts both
  `__BLANK:answer__` and bare `__BLANK__` paired with `blanks[]`;
  optional shuffled wordBank.
- `client/src/lib/promptSections/proceduralActivityDirectives.ts` —
  LLM directive instructing the right `procedural` payload shape.
- Schema addition: `section.procedural`.

### G5 — 5-a-day daily-drill builder (Tier 1, S)

- `client/src/lib/fiveADayBuilder.ts` — pure deterministic builder.
  Default mark distribution `[1, 2, 3, 3, 5]`; weekday on/off
  toggle; seed-deterministic. Tracks usedQuestionIds and warns on
  high repeat rate.

### G6 — Predicted-paper builder (Tier 1, S)

- `client/src/lib/predictedPaperBuilder.ts` — wraps PR-19's
  `pastPaperFrequencyAnchor`; bias `[0..1]` linearly blends neutral
  weighting with full-inversion of top-quartile-frequency topics.
  Falls back gracefully on empty corpus.

### G9 — Three-tier ability differentiation (Tier 2, S)

- `client/src/lib/threeTierDifferentiation.ts` — `runThreeTierDifferentiation`
  uses `Promise.allSettled` so a single failure doesn't block the
  others. `stampGroupMetadata` annotates each saved tier worksheet
  with `metadata.differentiationGroup = { groupId, tier }`.
- `client/src/components/ThreeTierButton.tsx` — toolbar button +
  tabbed preview + "Save all to library" action.

### G12 — Teacher-only answer-key separate page (Tier 3, XS)

- `client/src/lib/answerKeySheet.ts` — `buildAnswerKeyPage` pure
  helper. Excludes non-question sections; emits procedural-answer
  rows for G4 sections; surfaces misconception links per question.

### G13 — Per-question timer (Tier 3, S)

- `client/src/lib/questionTimer.ts` — pure reducer-based state
  machine (`idle`/`running`/`paused`/`finished`).
- `client/src/components/QuestionTimer.tsx` — display + tick handler;
  auto-start optional (mock-exam mode).
- Schema additions: `metadata.mockExamMode`, `metadata.timeAllocations`.

### G14 — Parent letter / homework cover note (Tier 3, S)

- `client/src/lib/parentLetter.ts` — `buildParentLetter` pure helper.
  Three tones (`supportive` / `firm` / `informative`) produce
  distinguishable outputs (Levenshtein ≥40% across tone pairs in
  fixtures). Optional companion-app self-practice link.
- Schema additions: `metadata.parentLetterAttached`,
  `metadata.parentTone`.

### G15 — Drag-handle section reorder (Tier 3, S)

- `client/src/lib/worksheet-renumber.ts` — pure renumberer over
  `q-*` sections; clears `questionNumber` on non-question sections.
  Drag-handle component itself wires through `@dnd-kit` in a
  follow-up; the renumber helper is the deterministic core.

### G17 — Worksheet favourites speed-dial (Tier 3, S)

- `client/src/lib/worksheetFavourites.ts` — localStorage helpers
  (`loadFavourites`, `toggleFavourite`, `recentFavourites`,
  `isStale`). Cap 50.
- `client/src/components/StarToggle.tsx` — reusable star affordance.
- `server/routes/worksheetLibrary.ts` — extended with
  `GET/POST/DELETE /favourites` endpoints (in-memory store v1; DB
  migration ships when feature is enabled in production).

## What is in flight

(None — all 12 implementation work units have shipped functional
code on the combined PR.)

## What is next

The combined PR delivers each work unit's deterministic core and a
minimal UI scaffold per component. Remaining wiring tasks (each is
its own narrow follow-up):

1. **Wire G1's `<AnswerEntryPanel>`** into the companion app at
   `client/src/pages/companion/[token].tsx` next to each question.
2. **Wire G2's `<AnotherOneButton>`** into `WorksheetRenderer.tsx`
   on every question card (teacher view).
3. ~~**Wire G3's `<ArchetypePickerDialog>`** into the Worksheets form
   header + inject `archetypeDirectives.buildArchetypeDirective` in
   `ai.ts:structuredSystemSections`.~~ Wired in PR #127 (W5).
4. **Wire G4's `procedural` render branches** in
   `WorksheetRenderer.tsx` (one switch case per kind). The ai.ts
   directive injection (`buildProceduralActivityDirective`) shipped
   in PR #127 (W6); the renderer branches remain for PR-C.
5. **Hook G5's `fiveADayBuilder`** into a self-contained tool page
   (`client/src/pages/tools/FiveADayBuilder.tsx`) registered via
   `tool-registry.ts`.
6. **Hook G6's `predictedPaperBuilder`** into a self-contained tool
   page following the same pattern.
7. ~~**Wire G9's `<ThreeTierButton>`** into the Worksheets toolbar +
   `aiDifferentiateExistingWorksheet` as the differentiate
   function.~~ Wired in PR #127 (W8).
8. ~~**Wire G12's `buildAnswerKeyPage`** into `pdf-generator-v2.ts`
   behind a new `PrintOptionsDialog` checkbox.~~ Wired in PR #127 (W9).
9. **Wire G13's `<QuestionTimer>`** into the companion app on each
   question (depends on G1's wiring).
10. **Wire G14's `buildParentLetter`** into a `<ParentLetterDialog>`
    triggered from the SendToMenu. (W11 — deferred to a follow-up;
    `SendToMenu` is not currently rendered from `Worksheets.tsx`,
    so the trigger location needs further design.)
11. **Wire G15's `renumberSections`** behind a `<DragHandleColumn>`
    on the worksheet preview using `@dnd-kit`.
12. ~~**Wire G17's `<StarToggle>`** into the worksheet library row +
    a "Recently favourited" sidebar in the Worksheets generator.~~
    Wired in PR #127 (W4) — star toggle on each library row + a
    recent-favourites chip strip above the bank list. The full
    "sidebar" treatment is deferred to a follow-up polish PR.

## Definition-of-done (per work unit)

- [x] Schema additions are **additive** — older worksheets continue
      to validate against `shared/aiSchemas.ts`.
- [x] Validators / builders / helpers are **pure / idempotent /
      conservative**.
- [x] Targeted vitest cases for the deterministic-core surfaces.
      (See `client/src/lib/__tests__/phase-g-h.test.ts`.)
- [ ] CI passes (`npm run check` + `npm test`) — runs on PR push.
- [x] LEDGER.md updated.
- [x] SESSION-HANDOFF.md updated.

## Files-of-interest map (for the next chat)

Same anchors as before; new files added in this PR are all
self-contained under `client/src/lib/` and `client/src/components/`.

## Notes (transient, per-session scratchpad)

### Why one combined PR instead of 6+12 separate PRs

The user asked for the lowest possible PR count for both phases.
The plans recommend one PR per phase as the realistic minimum given
review-burden tolerance, but the team explicitly opted for one
combined PR. Each work unit's library is independently testable and
self-contained, so reviewing the combined PR can still proceed work
unit by work unit (the LEDGER's "Files" column maps each ID to
specific file paths).

### Estimated diff size

~25 new files in `client/src/lib/`, `client/src/components/`,
`client/src/pages/`, `server/lib/`, `server/data/`, plus extensions
to `shared/aiSchemas.ts`, `server/routes/telemetry.ts`, and
`server/routes/worksheetLibrary.ts`. Tests in
`client/src/lib/__tests__/phase-g-h.test.ts`.
