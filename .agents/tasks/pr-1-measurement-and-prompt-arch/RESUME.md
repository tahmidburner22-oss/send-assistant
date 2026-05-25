# PR-1 — Resume Pointer

> **If you are a fresh chat picking this up, read this file first,
> then `SESSION-HANDOFF.md`, then `PHASE-PLAN.md`. Do NOT re-explore
> the repo from scratch — every file path and line range you need is
> in `SESSION-HANDOFF.md`.**

## Why this file exists

A previous session of this work was lost when the chat connection
dropped while updating the tracker and opening the PR. Every commit
the assistant had pushed during the session is on a remote feature
branch — but the **branch name was not captured in the narrative**,
and a fresh sandbox container cannot enumerate remote branches via
`git fetch` (the auth gateway blocks it).

This phase therefore enforces a strict **checkpointing protocol** so
the work survives any session ending — and a **recoverability
bundle** (this folder) that any subsequent chat can read from `main`
without needing the work-branch.

## The 4 rules of checkpointed work

1. **Push, don't accumulate.** After every meaningful chunk (one of:
   schema change, one new file with passing test, one runner edit,
   one passing rater call) — `git add` + `git commit` +
   `github_push_to_remote` to the work-branch. Never hold > one
   logical sub-step locally. **Capture the branch name in this
   file's "Quick-resume header" before the first push** so a future
   session can find it.

2. **Update the handoff in the same commit.** `SESSION-HANDOFF.md`'s
   "What is done" / "What is in flight" / "What is next" sections
   are the source of truth for any subsequent chat. If the next chat
   reads only that file, it must know exactly what to do.

3. **Name the next file and function.** "What is next" must point at
   the exact file path and (where applicable) the exact function or
   line range to edit next. Not "continue Sprint 1" — instead
   `server/tests/worksheet-eval/types.ts:48 — extend EvalFixture
   with humanScores?: { [axis]: number } field`.

4. **One PR, one branch.** All sub-steps of PR-1 share one branch.
   PR-2 (Sprint 2) branches from main in parallel, NOT from this
   branch. PR-3 + PR-4 branch from main after PR-1 merges. Never
   push directly to `main`.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Working on PR-1 of the four-PR ladder
         (Sprints 1 + 3 — measurement + prompt architecture).
         Recovery folder: .agents/tasks/pr-1-measurement-and-prompt-arch/
         Branch: feat/pr-1-measurement-and-prompt-arch  (or recover
         the original work-branch if you can find it — see
         SESSION-HANDOFF.md "Status of this folder").
Resume:  .agents/tasks/pr-1-measurement-and-prompt-arch/SESSION-HANDOFF.md
Plan:    .agents/tasks/pr-1-measurement-and-prompt-arch/PHASE-PLAN.md
PR body: .agents/tasks/pr-1-measurement-and-prompt-arch/PR-DESCRIPTION.md
Constraints:
  - Sandbox is INTEGRATIONS_ONLY. No npm install. Type-check + tests
    run in CI on PR push.
  - Do NOT read ai.ts (5,200+), Worksheets.tsx (6,500+),
    WorksheetRenderer.tsx (7,000+) in full. SESSION-HANDOFF names
    the exact line ranges.
  - All extensions to existing eval-harness files MUST be additive.
    Older fixtures + reports must keep parsing.
  - The seven built-in rule names are frozen. Adding a rule = new
    entry, never a rename.
  - callAIMessages signature is (messages, maxTokens?, opts?) — three
    positional args, NOT a single options object. The Sprint 1.D
    rater MUST use that exact shape.
  - Push to remote after every meaningful chunk (rule #1).
Goal: complete the next un-shipped sub-step in SESSION-HANDOFF.md's
      "What is next", update the handoff, push.
```

## File map

```
.agents/tasks/pr-1-measurement-and-prompt-arch/
├── RESUME.md              ← this file (read first)
├── PHASE-PLAN.md          ← what we're building, sequencing, sizing
├── SESSION-HANDOFF.md     ← what's done / in-flight / next (UPDATE EVERY CHECKPOINT)
└── PR-DESCRIPTION.md      ← paste-ready PR body for opening PR-1
```

## How to verify recovery

If the original PR-1 work-branch can be located on the remote:

1. Diff the work-branch against `main`. The expected file set is
   listed in `PHASE-PLAN.md` "Files expected to change in this
   phase".
2. For each sub-step in `SESSION-HANDOFF.md` "What is done", confirm
   the file exists + the public surface matches the description.
3. If everything checks out, the only remaining work is opening the
   PR — paste `PR-DESCRIPTION.md` as the body.
4. If a sub-step is missing or mis-shaped, re-implement it from the
   pin-points in `SESSION-HANDOFF.md`. The rubric axes, the corpus
   distribution, the rater call shape, and the runner contract are
   all fully specified there.

If the original work-branch cannot be located:

1. Branch `feat/pr-1-measurement-and-prompt-arch` from main.
2. Work through the 10 sub-steps in `PHASE-PLAN.md` order (1.A →
   1.F → 3.A → 3.B → 3.C → 3.D), pushing after each.
3. Update this folder's `SESSION-HANDOFF.md` after each push.
4. Open the PR with the body in `PR-DESCRIPTION.md`.

Either path lands the same PR. The recovery bundle is designed to
make both feasible.

## Why this folder coexists with `big-bang-improvements/`

The big-bang ledger has its own "PR-1" (audit item #28, shipped as
PR #85). This folder's PR-1 is the **first** PR of a separate
four-PR ladder. They do not conflict — different folders, different
numbering schemes, different review cadence.
