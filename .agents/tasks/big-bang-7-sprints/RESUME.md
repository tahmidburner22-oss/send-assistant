# Big-Bang 7-Sprint Plan — Resume Pointer

> **If you are a fresh chat picking this up, read this file first, then
> `SESSION-HANDOFF.md`, then `PHASE-PLAN.md`. Do NOT re-explore the
> repo from scratch — every file path and line range you need is in
> `SESSION-HANDOFF.md`'s "File pin-points" table.**

## Why this file exists

The user's directive on this work-stream is two-fold:

1. **Least amount of PRs.** Bundle aggressively, but never to the
   point of incomplete shipping.
2. **Complete-when-pushed.** When a PR is opened, every deliverable
   listed for that PR in `PHASE-PLAN.md` is actually present in the
   diff — not stubbed, not "TODO follow-up."

To survive a context-limit hit mid-flight, the work uses the same
checkpointing protocol as `phase-e-exam-paper-builder` and
`big-bang-improvements`: commit + push after every meaningful chunk,
update the handoff in the same commit, keep the next-step pointer
sharp.

## The 4 rules of checkpointed work

1. **Push, don't accumulate.** After every meaningful chunk
   (one new lib file, one validator wired, one corpus seeded, one
   test file passing) — `git add` specific paths + `git commit`
   (conventional-commit style) + `github_push_to_remote` to the
   current PR's branch. Never hold > ~30 minutes of work locally.

2. **Update the handoff in the same commit.** `SESSION-HANDOFF.md`'s
   "What is done" / "What is in flight" / "What is next" sections are
   the source of truth for any subsequent chat. If the next chat
   reads only that file, it must know exactly what to do.

3. **Name the next file and function.** "What is next" must point at
   the exact file path and (where applicable) the exact function or
   line range to edit next. No "continue PR-1" — instead
   `client/src/lib/ai.ts §GENERATE around L1003 — extract
   aiGenerateWorksheetSkeleton, see PHASE-PLAN.md PR-1.S3.1`.

4. **One PR, one branch.** Branch names are `big-bang-7/pr-N-<slug>`.
   Never push to `main`. After a PR is merged, the next PR branches
   from the merged main.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Big-bang 7-sprint plan, 4 PRs.
Resume:  .agents/tasks/big-bang-7-sprints/SESSION-HANDOFF.md
Plan:    .agents/tasks/big-bang-7-sprints/PHASE-PLAN.md
Constraints:
  - Sandbox is INTEGRATIONS_ONLY. No npm install. Tests + tsc run
    in CI on PR push.
  - Do NOT read ai.ts (5,448 lines), worksheetPostValidator.ts
    (2,233 lines), Worksheets.tsx, or WorksheetRenderer.tsx in full.
    Line ranges are pinned in SESSION-HANDOFF.md.
  - Schema additions: optional fields only. Older outputs keep loading.
  - Bank edits: append-only.
  - All new validators must be pure / idempotent (run twice = run once).
  - Push to remote after every meaningful chunk.
Goal: complete the next un-shipped item in "What is next" below.
```

## File map

```
.agents/tasks/big-bang-7-sprints/
├── RESUME.md              ← this file (read first)
├── PHASE-PLAN.md          ← 7 sprints x 4 PRs, sequencing, sizing
├── SESSION-HANDOFF.md     ← what's done / in-flight / next
└── features/              ← per-PR specs (added as each PR starts)
```

## PR roadmap (for orientation only — see PHASE-PLAN.md for detail)

| PR  | Bundles                    | Branch                                    | Effect                                                     |
| --- | -------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| 1   | Sprint 1 + Sprint 3        | `big-bang-7/pr-1-measure-and-prompt-arch` | Measurement foundation + prompt architecture (biggest)     |
| 2   | Sprint 2                   | `big-bang-7/pr-2-taxonomy-expansion`      | 5 spec-point taxonomy datasets + per-dataset eval fixtures |
| 3   | Sprint 4 + Sprint 6        | `big-bang-7/pr-3-cadence-and-send-moat`   | Examiner-voice cadence + SEND moat                         |
| 4   | Sprint 5 + Sprint 7        | `big-bang-7/pr-4-source-and-scorecard`    | Source-driven generation + Diffit-killer + public scorecard|
