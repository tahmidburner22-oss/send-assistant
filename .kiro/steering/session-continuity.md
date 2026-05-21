---
title: Session continuity for multi-chat work on Adaptly
inclusion: always
---

# Session continuity

Phased work on Adaptly is split across chats. To pick up cleanly when context
runs out, every active phase keeps its state under `.agents/tasks/<phase>/`.
The pattern is set by the existing phases in this repo (phase-a-class-aware,
phase-b-close-the-loop, phase-c-fit-your-school, phase-d-quality-and-habit)
and now phase-1-curriculum-structure.

## Resume protocol (do this at the start of any chat)

1. Run `git status && git log --oneline -5 && git branch --show-current`.
2. If a `phase-*` branch is checked out, read its files in this order:
   - `.agents/tasks/<phase>/SESSION-HANDOFF.md` — current state, what is
     done, what is next, conventions to honour.
   - `.agents/tasks/<phase>/PHASE-PLAN.md` — overall plan, sizing rules,
     definition-of-done for the phase.
   - `.agents/tasks/<phase>/features/FEAT-*.json` if present — per-PR specs.
3. Do NOT re-read whole large files (`client/src/lib/ai.ts`,
   `client/src/components/WorksheetRenderer.tsx`,
   `client/src/pages/Worksheets.tsx`). Use `grep_search` to find the symbol
   you need, then read narrow ranges only. The handoff doc lists the exact
   line ranges and identifiers from the previous session.
4. Sandbox is `INTEGRATIONS_ONLY` — `npm install` / `tsc` / `vitest` are
   blocked locally. Type-checking and tests run on PR push via CI. Push
   often.

## Updating the handoff doc

At the end of each working session (or any time you complete a logical
chunk), update `.agents/tasks/<phase>/SESSION-HANDOFF.md` with:

- What is done (one line per file modified, with the function/region
  changed).
- What is left in this branch (the next 1–3 concrete tasks).
- Conventions established (decisions the next agent must honour).
- The list of modified files (so commit + push is one glance away).

Then commit it: `git add .agents/tasks/<phase>/ && git commit -m "phase-<x>: handoff update — <line>"`.

## Cross-phase rules locked in

- Counts and the marks→answer-lines ramp live in
  `client/src/lib/worksheetSectionTargets.ts` only. Never inline a
  `qs: 3` literal or a hand-rolled mark ramp.
- `WorksheetSection` (interface in `worksheet-generator.ts`) and
  `WorksheetSectionSchema` (Zod in `shared/aiSchemas.ts`) must stay
  field-for-field aligned. Same goes for the per-question contract block
  in `ai.ts:structuredSystemSections`.
- Maths gets the dot-grid Working-Out box. Sciences do NOT — they use
  standard writing lines sized by tariff. Steering-locked.
- Never invent awarding-body spec codes. `specRef` values come from
  `client/src/lib/specPointTaxonomy.ts` only; the post-validator fills
  empty fields, never fabricates.
- The renderer stays subject-aware: any new per-question content path
  must thread `subject` through `formatContent`'s `subject` option.
- UK English, UK statutory framework, SI units. No US contexts.

## How to check what phase is active

```
ls .agents/tasks/
git branch --show-current
```

A `phase-N-*` branch + an `.agents/tasks/phase-N-*/` directory means that
phase is the active one. If multiple `.agents/tasks/phase-*` directories
exist but no matching branch is checked out, ask the user which phase to
resume before starting.
