# Phase 1 — Curriculum-aligned worksheet structure

Goal: lift Adaptly worksheets to **CGP-grade** quality and make every question
**provably traceable to the UK National Curriculum + the named exam-board
specification**. This phase delivers the structural foundation (counts,
per-question writing affordances, spec lock); Phases 2–5 deliver the rest
of the pedagogical overhaul (topic-specific Self-Reflection, Revision Tips,
content-level SEND adaptations, the new curriculum-authority system prompt).

## Why this matters (read before any change)

- The user-facing problem: worksheets are too thin (3-3-3 questions),
  per-question writing space is uneven, Self-Reflection is generic, SEND
  overlays are cosmetic, and the AI can invent spec codes that don't exist.
- Pedagogical north star: **"Used by classrooms across the UK and on the
  same level as CGP revision guides."**
- Non-negotiables: UK English, UK statutory framework, SI units, no US
  contexts, no copyrighted past-paper text verbatim.

## Hard sizing rules (apply to every PR in this phase)

- ≤ ~700 net lines changed (slightly wider than Phase A because schema +
  prompt + renderer + validator have to ship together to avoid drift).
- ≤ ~12 files touched.
- One coherent concept per PR.
- Reads scoped to specific functions, not whole-file.
- **Never read `client/src/lib/ai.ts` or `client/src/components/WorksheetRenderer.tsx`
  in full from a fresh chat.** They are 4,568 and 5,200+ lines respectively.
  Use `grep_search` to locate the named exports/functions, then read narrow
  ranges only.
- Sandbox is `INTEGRATIONS_ONLY` — npm install is blocked. Type-check and
  test runs happen on PR push via CI; do not try to run `npm install` /
  `tsc` / `vitest` locally.

## Header to paste at the start of any fresh chat picking up this phase

```
Context: send-assistant repo, branch phase-1-curriculum-structure
         (or a sibling branch checked out from main).
Working on Phase 1 — Curriculum-aligned worksheet structure.
Live state: .agents/tasks/phase-1-curriculum-structure/SESSION-HANDOFF.md
Plan:      .agents/tasks/phase-1-curriculum-structure/PHASE-PLAN.md
Constraint: do not read ai.ts or WorksheetRenderer.tsx in full;
            grep for the named exports first and read narrow ranges only.
            Sandbox is INTEGRATIONS_ONLY — do not run npm install.
```

## PRs in this phase

| PR    | Title                                                                   | Status        |
| ----- | ----------------------------------------------------------------------- | ------------- |
| PH1-A | Counts (7-7-5 + 1) + per-question answer-line ramp + working-out box   | in progress   |
| PH1-B | Spec-lock prompt block + per-question contract (commandWord/specRef…)  | in progress   |
| PH1-C | Post-validators: section counts + spec-anchor presence                 | not started   |
| PH1-D | Tests: counts, ramp, working-out box, spec anchor                      | not started   |

PH1-A through PH1-D are bundled into ONE branch (`phase-1-curriculum-structure`)
because the schema field, prompt rule, renderer behaviour and validator must
ship together — otherwise the field exists but nothing uses it. If the PR
gets too large to land in one go, split at the PH1-C / PH1-D boundary.

## Definition-of-done

- [ ] `client/src/lib/worksheetSectionTargets.ts` is the single source of
      truth for question counts and the marks→lines ramp; both
      `worksheetConstraints.ts:buildWorksheetPlan` and
      `worksheet-generator.ts` plan stage import from it.
- [ ] `WorksheetSection` type + `WorksheetSectionSchema` (Zod) carry
      `answerLines`, `commandWord`, `ncRef`, `workingOutBox`, `questionNumber`.
- [ ] `WorksheetRenderer.tsx` per-question render path uses
      `linesForMarks` + `shouldRenderWorkingOutBox` — old `markCount<=1?1:…`
      ramp deleted.
- [ ] `validateWorksheetPlan` cap lifted from 10 → `TOTAL_QUESTIONS_HARD_CAP`.
- [ ] System prompt in `ai.ts:structuredSystemSections` includes:
      * SECTION QUESTION COUNTS block (7-7-5 + 1)
      * PER-QUESTION CONTRACT block (lines ramp + commandWord + workingOutBox)
      * CURRICULUM + SPEC LOCK block built from `specPointTaxonomy.ts`
- [ ] Two new post-validators in `worksheetPostValidator.ts`:
      `enforceSectionQuestionCounts`, `enforceSpecAnchorPresence`.
- [ ] Tests in `server/tests/worksheetScrutiny.test.ts` covering counts,
      ramp, working-out box, spec anchor.
- [ ] CI passes (`npm test` + `tsc --noEmit`) on the PR.

## What lives in subsequent phases (do NOT scope-creep into Phase 1)

- Phase 2 — Topic-specific Self-Reflection (replace the generic
  `topics.push("I can apply what I have learned today")` fallback in
  `WorksheetRenderer.tsx:3247` and the hard-coded `reflectionTopics` array
  in `worksheet-generator.ts`).
- Phase 3 — New `revision-tips` section type with examiner-voice 5-tip
  panel.
- Phase 4 — SEND content rules (the 21 profiles in
  `sendPromptFragments.ts:SEND_ADAPTATION_SPECS` get a second
  `worksheetRulesContent[]` array — non-cosmetic pedagogy).
- Phase 5 — Full curriculum-authority system prompt rewrite (the bigger
  CGP-grade prompt; this Phase ships only the structural rules).
