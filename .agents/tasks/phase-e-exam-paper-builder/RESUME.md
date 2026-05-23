# Phase E — Resume Pointer

> **If you are a fresh chat picking this up, read this file first, then
> `SESSION-HANDOFF.md`, then `PHASE-PLAN.md`. Do NOT re-explore the
> repo from scratch — every file path and line range you need is in
> `SESSION-HANDOFF.md`.**

## Why this file exists

A previous session of this work was lost when the chat connection dropped
mid-write — every file the assistant had built was held in working memory
and nothing reached the remote. This phase therefore enforces a strict
**checkpointing protocol** so the work survives any session ending.

## The 4 rules of checkpointed work

1. **Push, don't accumulate.** After every meaningful chunk
   (one of: schema change, one new script, one passing audit run, one
   batch of authored questions, one passing test file) — `git add` +
   `git commit` + `github_push_to_remote` to `feat/phase-e-exam-paper-builder`.
   Never hold > ~30 minutes of work locally.

2. **Update the handoff in the same commit.** `SESSION-HANDOFF.md`'s
   "What is done" / "What is in flight" / "What is next" sections are
   the source of truth for any subsequent chat. If the next chat reads
   only that file, it must know exactly what to do.

3. **Name the next file and function.** "What is next" must point at
   the exact file path and (where applicable) the exact function or
   line range to edit next. Do not leave instructions like "continue
   PR-A" — leave instructions like
   `client/src/lib/pastPaperQuestions.ts:58-100 — add subtopic?: string field to PastPaperQuestion interface`.

4. **One PR, one branch.** Both PRs in this phase share the branch
   `feat/phase-e-exam-paper-builder` until PR-A is opened. After PR-A
   ships, PR-B branches from it. Never push directly to `main`.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Branch feat/phase-e-exam-paper-builder.
         Two PRs to deliver:
         PR-A — exam-bank subtopic schema + back-tagger + audit + gap-fill.
         PR-B — Create-an-Exam-Paper assembly engine + tool surface.
Resume:  .agents/tasks/phase-e-exam-paper-builder/SESSION-HANDOFF.md
Plan:    .agents/tasks/phase-e-exam-paper-builder/PHASE-PLAN.md
Specs:   .agents/tasks/phase-e-exam-paper-builder/features/FEAT-PE-A.json
         .agents/tasks/phase-e-exam-paper-builder/features/FEAT-PE-B.json
Constraints:
  - Sandbox is INTEGRATIONS_ONLY. No npm install. Type-check + tests
    run in CI on PR push.
  - Do NOT read pastPaperQuestions.ts (2,200 lines) or any of the
    questionBank*.ts files in full from a fresh chat. SESSION-HANDOFF
    names the exact line ranges.
  - Schema additions are optional fields only. Older bank entries
    without the new fields must continue to load.
  - Bank edits are append-only — never edit existing question entries.
  - Push to remote after every meaningful chunk (see RESUME.md rule 1).
Goal: complete the next un-shipped item in SESSION-HANDOFF.md's
      "What is next" section, update the handoff, push.
```

## File map

```
.agents/tasks/phase-e-exam-paper-builder/
├── RESUME.md              ← this file (read first)
├── PHASE-PLAN.md          ← what we're building, sequencing, sizing
├── SESSION-HANDOFF.md     ← what's done / in-flight / next (UPDATE EVERY CHECKPOINT)
└── features/
    ├── FEAT-PE-A.json     ← PR-A spec — schema + back-tagger + audit + gap-fill
    └── FEAT-PE-B.json     ← PR-B spec — assembly engine + tool surface
```
