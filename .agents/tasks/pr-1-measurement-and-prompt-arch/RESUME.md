# PR-1 — Resume Pointer

> **Read this file first**, then `SESSION-HANDOFF.md`, then
> `PHASE-PLAN.md`. Do not re-explore the repo from scratch — every
> file path and line range you need is in `SESSION-HANDOFF.md`.

## Status (truthful)

This folder is the **specification** for PR-1, not a recovery doc.
A previous chat session described pushing nine commits' worth of
work to a feature branch, but **no such branch exists on the
remote** — the work either never made it to `git push`, or was
never actually committed. There is no work to recover; there is
only this plan, and code waiting to be written.

The implementation begins on this branch
(`feat/pr-1-measurement-and-prompt-arch`) with Sprint 1.A as the
first real commit.

## The 4 rules of checkpointed work

1. **Push, don't accumulate.** After every meaningful chunk (one
   of: schema change, one new file with passing test, one runner
   edit, one passing rater call) — `git add` + `git commit` +
   `github_push_to_remote` to this branch. Never hold > one logical
   sub-step locally.

2. **Update the handoff in the same commit.** `SESSION-HANDOFF.md`'s
   "What is done" / "What is in flight" / "What is next" sections
   are the source of truth for any subsequent chat. If the next
   chat reads only that file, it must know exactly what to do.

3. **Name the next file and function.** "What is next" must point
   at the exact file path and (where applicable) the exact function
   or line range to edit next. Not "continue Sprint 1" — instead
   `server/tests/worksheet-eval/types.ts:48 — extend EvalFixture
   with humanScores?: { [axis: string]: number } field`.

4. **One PR, one branch.** All sub-steps of PR-1 share one branch
   (`feat/pr-1-measurement-and-prompt-arch`). PR-2 (Sprint 2)
   branches from main in parallel, NOT from this branch. PR-3 +
   PR-4 branch from main after PR-1 merges. Never push directly to
   `main`.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Branch feat/pr-1-measurement-and-prompt-arch
         off main. Working on PR-1 of the four-PR ladder
         (Sprints 1 + 3 — measurement + prompt architecture).
Resume:  .agents/tasks/pr-1-measurement-and-prompt-arch/SESSION-HANDOFF.md
Plan:    .agents/tasks/pr-1-measurement-and-prompt-arch/PHASE-PLAN.md
PR body: .agents/tasks/pr-1-measurement-and-prompt-arch/PR-DESCRIPTION.md
Constraints:
  - Sandbox is INTEGRATIONS_ONLY. No npm install. Type-check + tests
    run in CI on PR push.
  - Do NOT read ai.ts (5,200+), Worksheets.tsx (6,500+),
    WorksheetRenderer.tsx (7,000+) in full from a fresh chat.
    SESSION-HANDOFF names the exact line ranges to read.
  - All extensions to existing eval-harness files MUST be additive.
    Older fixtures + reports must keep parsing.
  - The seven built-in rule names are frozen. Adding a rule = new
    entry in RULE_REGISTRY, never a rename.
  - callAIMessages signature is (messages, maxTokens?, opts?) —
    three positional args, NOT a single options object. The
    Sprint 1.D rater MUST use that exact shape.
  - Push after every sub-step (rule #1).
Goal: complete the next un-shipped sub-step in SESSION-HANDOFF.md's
      "What is next", update the handoff, push.
```

## File map

```
.agents/tasks/pr-1-measurement-and-prompt-arch/
├── RESUME.md              ← this file (read first)
├── PHASE-PLAN.md          ← what we're building, sequencing, sizing
├── SESSION-HANDOFF.md     ← what's done / in-flight / next (UPDATE EVERY CHECKPOINT)
└── PR-DESCRIPTION.md      ← paste-ready PR body for opening / updating PR-1
```

## How a fresh chat picks this up

1. Read this file.
2. Read `SESSION-HANDOFF.md`. Look at "What is in flight" — that's
   the current sub-step. If empty, look at "What is next".
3. Read the file pin-points table in `SESSION-HANDOFF.md` to know
   exactly which lines to edit. Avoid reading the giant files
   (`ai.ts`, `Worksheets.tsx`, `WorksheetRenderer.tsx`) in full —
   `grep` for the named exports first, read narrow ranges.
4. Implement the sub-step. Push. Update `SESSION-HANDOFF.md` "What
   is done" / "What is in flight" / "What is next" in the same
   commit (or a follow-up commit on the same branch).

## Why this folder coexists with `big-bang-improvements/`

The big-bang ledger has its own "PR-1" (audit item #28, shipped as
PR #85). This folder's PR-1 is the **first** PR of a separate
four-PR ladder taking the worksheet generator from "feels right" to
"measurably better". They do not conflict — different folders,
different numbering schemes, different review cadence. Disambiguate
by folder.
