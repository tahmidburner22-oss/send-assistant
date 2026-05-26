# Phase G — Resume pointer

**Quick-resume header — paste into a fresh chat:**

```
Context: send-assistant repo. Phase G = competitor-derived improvements
         (Twinkl + MathsGenie + Dr Frost + Save My Exams + Corbettmaths
         + TpT + Liveworksheets + Kahoot research). Branch off main per
         work unit OR a single combined branch
         `feat/phase-g-where-worksheet-meets-pupil`.
Resume:  .agents/tasks/phase-g-where-worksheet-meets-pupil/SESSION-HANDOFF.md
Plan:    .agents/tasks/phase-g-where-worksheet-meets-pupil/PHASE-PLAN.md
Ledger:  .agents/tasks/phase-g-where-worksheet-meets-pupil/LEDGER.md
Feats:   .agents/tasks/phase-g-where-worksheet-meets-pupil/features/FEAT-G*.json
Constraint: do not read ai.ts (~5,200 lines), Worksheets.tsx (~7,500
            lines) or WorksheetRenderer.tsx (~8,500 lines) in full from a
            fresh chat — grep `// §` first, read narrow ranges. Sandbox
            is INTEGRATIONS_ONLY — do not run npm install. CI runs the
            full type-check + vitest suite on PR push.
            scripts/check-no-bigfile-reads.mjs enforces this.
Goal: complete the next un-shipped work unit in the SESSION-HANDOFF
      "What is next" section, update LEDGER.md and SESSION-HANDOFF.md,
      open / extend the combined PR.
```

## What Phase G is

Twelve worksheet-generator improvements distilled from a competitor
review of the major UK + international worksheet platforms. The
codebase already wins on rigour (curriculum bank, 30-validator chain,
SEND fidelity, fact-checker, maths verifier). Phase G closes the gap
on **interactivity** (pupil auto-marking, same-skill regeneration) and
**ergonomic templates** (lesson archetypes, daily drill, predicted
papers, ability tiers, parent letters, drag-reorder, favourites).

Three Tier-4 bug fixes (semh resolver, fidelity warning dedupe,
.bak file cleanup) are already shipped on this same planning PR as
prework — see G18 / G19 / G20 in `LEDGER.md`.

## How to ship Phase G

The codebase has a strong precedent of **combined PRs** (PR #102
shipped PR-10..18, PR-19..27 shipped as one PR). Phase G follows the
same pattern: single branch
`feat/phase-g-where-worksheet-meets-pupil`, one commit per work unit,
combined PR off `main`. Reviewers cherry-pick / revert individual
commits if anything breaks.

The resume contract supports the alternative — split into 12 PRs —
without rewrites: each `FEAT-G*.json` has its own scope, file list and
acceptance criteria, so a fresh chat can pick up unit-by-unit if the
team prefers.
