# Phase 1 — Session Handoff

> **Status: SHIPPED.** Merged to `main` as PR #73 / commit `64b794d` on
> 2026-05-21. This file is kept for the historical record so subsequent
> phases can see exactly which conventions were locked in. Do not edit
> the conventions block — Phase 2+ inherits it verbatim.

## Quick-resume header (for the historical record)

```
Context: send-assistant repo, branch phase-1-curriculum-structure.
Resume: .agents/tasks/phase-1-curriculum-structure/SESSION-HANDOFF.md
Plan:   .agents/tasks/phase-1-curriculum-structure/PHASE-PLAN.md
Constraint: do not read ai.ts or WorksheetRenderer.tsx in full;
            grep for the named exports first and read narrow ranges only.
            Sandbox is INTEGRATIONS_ONLY — do not run npm install.
Goal: complete Phase 1 (counts 7-7-5+1, per-Q answer lines, maths working-out
      box, curriculum + GCSE spec lock) and open / update the PR.
```

## What shipped

- `client/src/lib/worksheetSectionTargets.ts` — single source of truth for
  `SECTION_QUESTION_TARGETS` (recall 6/7/8, understanding 6/7/8, application
  5/5/5, challenge 1/1/1), `TOTAL_QUESTIONS_TARGET = 20`,
  `TOTAL_QUESTIONS_HARD_CAP = 25`, `getSectionQuestionRange()`,
  `linesForMarks()` (1m=2, 2m=3, 3m=4, 4m=6, 5–6m=8, 7–8m=12, 9+m=14),
  `WORKING_OUT_TRIGGER_RE`, `shouldRenderWorkingOutBox()` **maths-only**,
  `workingOutRowsForMarks()`, `EAL_L1_LANGUAGES` (11 entries — top 10 DfE
  School Census + Mirpuri/Pahari-Pothwari).
- `shared/aiSchemas.ts` `WorksheetSectionSchema` extended with
  `questionNumber`, `answerLines`, `commandWord`, `ncRef`, `workingOutBox`.
- `client/src/lib/worksheet-generator.ts` `WorksheetSection` interface
  mirrored. Plan-builder `qs: 3` literals replaced with target-driven counts.
- `client/src/lib/worksheetConstraints.ts` — `buildWorksheetPlan` now
  consumes `SECTION_QUESTION_TARGETS` / `PRIMARY_SECTION_QUESTION_TARGETS`,
  challenge `questionRange` lands on Q20 dynamically, cap lifted from `>10`
  to `> TOTAL_QUESTIONS_HARD_CAP`.
- `client/src/components/WorksheetRenderer.tsx`:
  * Imports `linesForMarks`, `shouldRenderWorkingOutBox`, `workingOutRowsForMarks`.
  * Per-question `[N marks]` branch now uses the new ramp.
  * Renders dot-grid Working-Out box (maths only — gated by parent subject)
    above the writing lines and a capped `Final answer:` row below.
  * `formatContent` accepts an optional `subject` option; threaded down via
    `PrimarySection` props and the four secondary-path call sites that
    parent-component `worksheet.metadata.subject` reaches.
  * Inline `[WORKING_OUT]` marker after a marks tag forces a box on a
    per-question basis even on non-maths sheets (rare).
- `client/src/lib/ai.ts`:
  * Imports `SECTION_QUESTION_TARGETS`, `TOTAL_QUESTIONS_TARGET` from
    `worksheetSectionTargets`, plus `getSpecPoints`, `getSpecPointsAcrossBoards`,
    `ExamBoard` from `specPointTaxonomy`.
  * New `specPointAnchorBlock` built per-request from the published
    awarding-body taxonomy. Filters to topic-matching rows where possible;
    falls back to a 12-row union across boards. Tells the AI: "these are
    the only valid `specRef` values; never invent a code".
  * `structuredSystemSections` now includes the SECTION QUESTION COUNTS
    block, the PER-QUESTION CONTRACT block (lines ramp + commandWord +
    workingOutBox **maths only** + specRef + ncRef + AO + bloomLevel +
    expectedReadingAge), and the QUALITY STANDARD line was upgraded with
    a curriculum-traceability clause.
  * Both `runWorksheetPostValidators(...)` callsites (structured + legacy)
    now pass `examBoard` so the spec-anchor validator can resolve the
    matching awarding-body taxonomy.
- `client/src/lib/worksheetPostValidator.ts`:
  * `PostValidatorOptions` extended with `examBoard?: string`.
  * New `inferSectionGroup()` helper — maps a question section to recall /
    understanding / application / challenge using `questionNumber` (Phase 1
    schema field) > `Q\d+` title heuristic > section type.
  * New `enforceSectionQuestionCounts(ws, opts)` — pure / idempotent.
    Counts question sections per group; warns when outside
    `SECTION_QUESTION_TARGETS[group].{min,max}`. Never mutates content.
  * New `enforceSpecAnchorPresence(ws, opts)` — pure / idempotent. Fills
    missing `specRef` from `matchSpecPoint()` against the taxonomy. Warns
    on invented codes (does NOT silently overwrite). Falls back to
    `getSpecPointsAcrossBoards()` union when the per-board dataset is
    missing. Warns once at worksheet level when no taxonomy at all.
  * Both new validators plumbed into `runWorksheetPostValidators` chain
    after the existing FEAT-PB7 misconception-link extractor.
- `server/tests/worksheetScrutiny.test.ts` — new Phase 1 test suites:
  * `linesForMarks` ramp (zero for MCQ/T-F/etc., scales 1m→2..9m+→14).
  * `shouldRenderWorkingOutBox` maths-only steering check.
  * `EAL_L1_LANGUAGES` includes Mirpuri.
  * `buildWorksheetPlan` 7-7-5+1 = 20 secondary, 3-3-3 primary.
  * `validateWorksheetPlan` accepts 20, rejects 26+.
  * `enforceSectionQuestionCounts` happy path + below-min + above-max +
    no-mutation invariant + empty-worksheet no-op.
  * `enforceSpecAnchorPresence` fills missing AQA Maths Y10 codes,
    warns on invented codes without overwriting, leaves valid codes
    untouched, falls back to cross-board union, never invents on
    unhinted questions, warns when no taxonomy bundled.

## What is left in this branch

Nothing. PR #73 is merged. Phase 2 picks up the next slice (Topic-specific
Self-Reflection) on a fresh branch off `main` — see
`.agents/tasks/phase-2-self-reflection/`.

## Conventions established (Phase 2+ MUST honour these)

- The **single source of truth** for question counts and the marks→lines
  ramp is `client/src/lib/worksheetSectionTargets.ts`. Never inline a
  literal like `qs: 3` or `markCount<=1?1:…` again.
- The **renderer stays subject-aware** through `formatContent`'s `subject`
  option. Any new content render path that emits per-question affordances
  must pass `subject: worksheet.metadata?.subject || ""`.
- The **prompt and the validator must stay in lockstep** with the schema
  fields. If you add a new per-question field, update all three:
  `aiSchemas.ts` (Zod), `worksheet-generator.ts` (interface),
  the per-question contract block in `ai.ts:structuredSystemSections`.
- **Sciences do NOT get the dot-grid Working-Out box.** Only maths.
  Steering-locked. Sciences use standard writing lines sized by tariff.
- **Never invent spec codes.** The post-validator must fail loudly on
  unmatched `specRef` rather than silently filling an ID-shaped string.

## Files modified in the merged PR

```
client/src/lib/worksheetSectionTargets.ts        (new file)
client/src/lib/worksheet-generator.ts            (interface + plan builder)
client/src/lib/worksheetConstraints.ts           (plan + cap)
client/src/components/WorksheetRenderer.tsx      (renderer + subject plumb)
client/src/lib/ai.ts                             (prompt + spec-anchor block)
client/src/lib/worksheetPostValidator.ts         (+ 2 validators + helper)
shared/aiSchemas.ts                              (Zod schema)
server/tests/worksheetScrutiny.test.ts           (Phase 1 test suites)
.agents/tasks/phase-1-curriculum-structure/PHASE-PLAN.md
.agents/tasks/phase-1-curriculum-structure/SESSION-HANDOFF.md   (this file)
.kiro/steering/session-continuity.md             (auto-include resume hint)
```
