# Phase A — "We know your class"

Goal: turn the worksheet generator from a form-driven tool into a class-aware
daily companion, **without removing the existing form**. Every PR in this
phase is sized so a single fresh chat can execute it without exhausting
context.

## Hard sizing rules (apply to every PR in this phase)

- ≤ ~600 net lines changed
- ≤ ~10 files touched
- One coherent concept per PR
- Reads scoped to specific functions, not whole-file
- **Never read `client/src/pages/Worksheets.tsx` or `client/src/lib/ai.ts` in
  full from a fresh chat.** They are 6,531 and 4,568 lines respectively.
  Use `grep_search` to locate the named exports/functions, then read narrow
  ranges only.

## Header to paste at the start of any fresh chat picking up this phase

```
Context: send-assistant repo, branch main.
Working on PR-X · <title> from .agents/tasks/phase-a-class-aware/PHASE-PLAN.md
Spec: .agents/tasks/phase-a-class-aware/features/FEAT-PRX.json
Constraint: do not read Worksheets.tsx or ai.ts in full;
            grep for the named exports first and read narrow ranges only.
```

## PRs in this phase

| PR  | Title                                                         | Spec file        |
| --- | ------------------------------------------------------------- | ---------------- |
| 0   | Carve up Worksheets.tsx and ai.ts                             | FEAT-PR0.json    |
| 1   | Schema + helpers for "Auto-from-class" generation (no UI)     | FEAT-PR1.json    |
| 2   | "Auto-from-class" mode toggle in the form                     | FEAT-PR2.json    |
| 3   | Class Pack as default for class-scoped generations            | FEAT-PR3.json    |
| 4   | Home screen "Your week, ready to print" panel                 | FEAT-PR4.json    |
| 5   | Eval harness (internal, no UI)                                | FEAT-PR5.json    |

## Recommended order

PR-0 first (mandatory — otherwise every later PR over-spends context).
Then PR-1 → PR-2 (the headline pupil-aware-but-optional change), then PR-4
(home screen), then PR-3 (class-pack default), then PR-5 (eval harness)
whenever convenient.
