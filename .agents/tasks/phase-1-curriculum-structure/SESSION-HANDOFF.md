# Phase 1 — Session Handoff

This file is the **resume point** for any fresh chat picking up Phase 1.
Read it first, then `PHASE-PLAN.md`, then proceed.

Last updated: see `git log -1 --format=%cI -- .agents/tasks/phase-1-curriculum-structure/SESSION-HANDOFF.md`

## Quick-resume header (paste into a fresh chat)

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

## What is done

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

## What is left (in this branch)

- **Task 7 — Post-validators.** Two pure idempotent functions added to
  `client/src/lib/worksheetPostValidator.ts` and plumbed into
  `runWorksheetPostValidators`:
  * `enforceSectionQuestionCounts(ws, opts)` — counts question sections
    per section group via title heuristics + `[N marks]` markers; warns when
    outside `SECTION_QUESTION_TARGETS[section].{min,max}`. No mutation
    beyond appending `metadata.postValidatorWarnings`.
  * `enforceSpecAnchorPresence(ws, opts)` — for every question section
    whose type starts with `q-` / `challenge` / `extended-answer` /
    `lor` / `exam-question`, fills missing `specRef` via
    `matchSpecPoint(rawRef, dataset)` against `getSpecPoints(board, subject,
    yearGroup)`. Warns (doesn't fail) when no taxonomy is bundled for the
    request. Never invents codes.

- **Task 8 — Tests.** Add to `server/tests/worksheetScrutiny.test.ts`:
  * `linesForMarks` ramp sanity (1m=2, 4m=6, 8m=12, 9m=14; MCQ→0).
  * `shouldRenderWorkingOutBox` maths-only behaviour: returns true for
    "Calculate" + maths, false for "Calculate" + Physics/Chemistry.
  * `buildWorksheetPlan` produces 7-7-5+1 = 20 secondary, 3-3-3 primary.
  * `validateWorksheetPlan` accepts up to 25, rejects 26+.
  * `enforceSectionQuestionCounts` warns when a section has < min or > max.
  * `enforceSpecAnchorPresence` fills `specRef` for AQA Maths Y10 topic
    matches and never fabricates for unknown subjects.

- **Task 9 — Run CI.** `npm test` + `tsc --noEmit` will run on the PR push;
  fix anything it raises.

- **Task 10 — Open the PR.** Title:
  `Phase 1 — Curriculum-aligned structure (7-7-5 counts, per-Q answer lines, maths working-out, spec anchor)`

## Conventions established (do not break)

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

## Files modified so far (commit before context dies)

```
client/src/lib/worksheetSectionTargets.ts        (new file)
client/src/lib/worksheet-generator.ts            (interface + plan builder)
client/src/lib/worksheetConstraints.ts           (plan + cap)
client/src/components/WorksheetRenderer.tsx      (renderer + subject plumb)
client/src/lib/ai.ts                             (prompt + spec-anchor block)
shared/aiSchemas.ts                              (Zod schema)
.agents/tasks/phase-1-curriculum-structure/PHASE-PLAN.md
.agents/tasks/phase-1-curriculum-structure/SESSION-HANDOFF.md   (this file)
.kiro/steering/session-continuity.md             (auto-include resume hint)
```
