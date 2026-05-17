# Phase B — "We close the loop"

Goal: turn worksheet generation from a one-shot artefact into a closed
assess→re-teach loop. The teacher marks once; the next worksheet auto-targets
the gaps; every question carries the metadata Ofsted/HOD needs to evidence
coverage.

## Hard sizing rules (apply to every PR in this phase)

- ≤ ~600 net lines changed
- ≤ ~10 files touched
- One coherent concept per PR
- Reads scoped to specific functions, not whole-file
- **Never read `client/src/pages/Worksheets.tsx` or `client/src/lib/ai.ts` in
  full from a fresh chat.** Use `grep_search` for the named exports first,
  then read narrow ranges only. After Phase A · PR-0 these files have
  navigation banners — `grep_search "// §"` to jump.

## Header to paste at the start of any fresh chat picking up this phase

```
Context: send-assistant repo, branch main.
Working on PR-X · <title> from .agents/tasks/phase-b-close-the-loop/PHASE-PLAN.md
Spec: .agents/tasks/phase-b-close-the-loop/features/FEAT-PBX.json
Constraint: do not read Worksheets.tsx or ai.ts in full;
            grep `// §<SECTION>` first and read narrow ranges only.
            Phase A is already shipped — Auto-from-class mode + WeekAheadPanel
            already exist; build on top, do not reimplement.
```

## PRs in this phase

| PR  | Maps to user's #4-#5,#11,#14 | Title                                                  | Spec file        |
| --- | ---------------------------- | ------------------------------------------------------ | ---------------- |
| 1   | #5  AO + spec-point          | Spec-point provenance + AO tag on every question       | FEAT-PB1.json    |
| 2   | #14 symbolic maths           | Symbolic maths verification (CAS round-trip)           | FEAT-PB2.json    |
| 3   | #4  re-teach loop            | Misconception-driven re-teach loop                     | FEAT-PB3.json    |
| 4   | #11 marking ends here        | Bulk scan-and-mark + per-pupil feedback + MIS export   | FEAT-PB4.json    |

## Recommended order

PB1 first — every later phase consumes spec-point + AO metadata.
Then PB2 (deterministic correctness check ahead of human review),
then PB3 (re-teach), then PB4 (the marking-ends-here promise).

## Out-of-scope guardrails (every PR)

- Do not change anything under `client/src/pages/worksheets/` (Phase A territory).
- Do not introduce a new prompt path — extend the existing pipeline.
- Do not regress the existing `metadata.postValidatorWarnings` channel.
- Symbolic verification, AO tagging, and re-teach all flow through the
  existing `runWorksheetPostValidators` chain so a single page-mount runs
  the whole thing.
