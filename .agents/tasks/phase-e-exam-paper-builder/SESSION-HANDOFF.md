# Phase E — Session Handoff

> **Always update this file at the end of every checkpoint** so the
> next chat can pick up cleanly. Edit "What is done" / "What is in
> flight" / "What is next" in the same commit as the work it describes.
> Push to remote in the same step.

Last updated: 2026-05-23 — initial scaffolding only. No code changes
shipped yet on `feat/phase-e-exam-paper-builder`.

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
  - Do NOT read pastPaperQuestions.ts or any questionBank*.ts in
    full. Line ranges are listed in this file.
  - Schema additions: optional fields only.
  - Bank edits: append-only. Never modify existing entries.
  - Push to remote after every meaningful chunk.
Goal: complete the next un-shipped item in "What is next" below.
```

## File pin-points (so the next chat doesn't re-explore)

| File                                                  | Line range  | Why                                                   |
| ----------------------------------------------------- | ----------- | ----------------------------------------------------- |
| `client/src/lib/pastPaperQuestions.ts`                | 58-100      | `PastPaperQuestion` interface — add `subtopic?` here  |
| `client/src/lib/pastPaperQuestions.ts`                | 1861-1937   | `getExamQuestions` — extend with subtopic filter      |
| `client/src/lib/pastPaperQuestions.ts`                | 1938-1955   | `getTopicsForSubject` — add `getSubtopicsForTopic` after |
| `client/src/lib/pastPaperQuestions.ts`                | 1-10        | Imports — add `subtopicTags.ts` import here           |
| `client/src/lib/subtopics-data.ts`                    | 10          | `SUBTOPICS_MAP` — read-only reference                 |
| `client/src/lib/tool-registry.ts`                     | 51-410      | `TOOLS[]` — append Create-an-Exam-Paper entry         |
| `client/src/lib/examPaperBuilder.ts`                  | 123-200     | `ExamPaperWorksheet` interface — output shape         |

Bank file sizes (for sizing diff impact, do NOT read in full):

```
questionBankMaths.ts          612 lines
questionBankBiology.ts        768 lines
questionBankChemistry.ts      684 lines
questionBankPhysics.ts        710 lines
questionBankEnglish.ts      1,522 lines
questionBankOtherSubjects.ts 2,202 lines
questionBankExpanded.ts     3,170 lines
pastPaperQuestionsExpanded.ts 944 lines
pastPaperQuestions.ts       2,203 lines
```

## What is done

- **Phase E scaffolding** (this commit). Created the phase folder
  with `RESUME.md`, `PHASE-PLAN.md`, this handoff file, and the two
  per-PR specs (`FEAT-PE-A.json`, `FEAT-PE-B.json`). Branch
  `feat/phase-e-exam-paper-builder` cut from `main` and pushed so
  any subsequent session can resume even if this one ends.

## What is in flight

_Nothing yet. PR-A starts at the next checkpoint._

## What is next

**PR-A · Step 1 — Schema additions** (target: ≤ 1 commit, ≤ 80 lines).

Exact actions in order:

1. Edit `client/src/lib/pastPaperQuestions.ts` line 100 (end of
   `PastPaperQuestion` interface): add `  subtopic?: string;` plus a
   one-line JSDoc explaining it must match a value in
   `SUBTOPICS_MAP[topic]` when present.
2. Create `client/src/lib/subtopicTags.ts` — placeholder shape
   `export const SUBTOPIC_TAGS: Readonly<Record<string, string>> = Object.freeze({});`.
   The back-tagger script will overwrite this file later.
3. Edit `client/src/lib/pastPaperQuestions.ts` line 1 (top imports):
   add `import { SUBTOPIC_TAGS } from "./subtopicTags";`.
4. Extend `getExamQuestions` (line 1861): add optional `subtopic?: string`
   to the options type. Inside `filtered = ...filter(q => …)`, after
   the `matchesTopic` check, add a `matchesSubtopic` check that
   prefers `q.subtopic` when present, falls back to
   `SUBTOPIC_TAGS[q.id]`, and substring-matches against the requested
   subtopic.
5. After `getTopicsForSubject` (line 1955), add two new exports:
   `getSubtopicsForTopic(topic: string): string[]` (reads
   `SUBTOPICS_MAP`) and `getCandidatePoolForTopics(opts: { subject; topics: string[]; tier?; yearGroup? }): PastPaperQuestion[]`
   that returns every question whose `topic` OR (`subtopic` |
   `SUBTOPIC_TAGS[q.id]`) matches any item in the user's `topics[]`
   list.
6. Run `npx tsc --noEmit` to verify. Commit + push.
7. Update this handoff: move PR-A Step 1 from "What is next" to
   "What is done", set "What is next" to PR-A Step 2 (back-tagger
   script).

After Step 1 lands, "What is next" becomes:

> **PR-A · Step 2 — Back-tagger.** Write `scripts/exam-bank-back-tagger.mjs`.
> See `features/FEAT-PE-A.json` step 2 for the algorithm spec.

Subsequent steps for PR-A:

- **Step 3** — Coverage audit (`scripts/exam-bank-coverage.mjs` →
  `docs/exam-bank-coverage.json`). Adds CI guard against regression.
- **Step 4** — Gap-fill wave 1: append questions for the highest-
  priority zero-question subtopics in core GCSE subjects. Re-run
  audit. Update coverage JSON.
- **Step 5** — Open PR-A. PR description must reference this folder
  and link to `docs/exam-bank-coverage.json` so the residual gap is
  visible to reviewers.

PR-B steps (after PR-A is open or merged):

- **Step 6** — `client/src/lib/createExamPaperBuilder.ts` with the
  knapsack assembly algorithm + unit tests. See FEAT-PE-B step 1.
- **Step 7** — `client/src/pages/tools/CreateExamPaper.tsx` + tool
  registry entry + App.tsx route + Revision Hub card.
- **Step 8** — Open PR-B. Update this handoff.

## Checkpoint protocol

After every step above:

1. `git status` to confirm only the intended files changed.
2. `git add <files>` (specific paths, never `git add .`).
3. `git commit -m "<scope>: <what changed>"` using the repo's
   conventional-commit style.
4. `github_push_to_remote` with branch
   `feat/phase-e-exam-paper-builder`.
5. Update this file's "What is done" and "What is next" sections in a
   follow-up commit (or in the same commit if it's only a handoff
   tweak).

## Notes (transient scratchpad)

### Why the previous session lost everything

Per the user's recap, the previous session held the entire PR-A
implementation in working memory and was attempting a single large
file write when the connection dropped. The branch was never pushed.
Working tree on `main` was clean when this session started — no
recoverable state.

This phase therefore enforces the rule: **commit + push after every
step**, never accumulate > one logical chunk locally. The scaffolding
itself (this commit) is the first checkpoint.

### Sizing reality

The full Goal-1 ambition (≥10 questions per subtopic across ~700
subtopics) implies authoring on the order of 2,000–4,000 fresh
questions to fully close the gap. That cannot be completed in one
session at a quality bar that survives a teacher's review. PR-A
therefore ships:

- Complete schema + back-tagger + audit infrastructure.
- A focused first wave of hand-authored gap-fill (prioritising
  zero-question subtopics in core GCSE subjects — Maths, Biology,
  Chemistry, Physics, English).
- A coverage JSON that turns the residual gap into a transparent,
  ordered task list.

Subsequent sessions resume from `docs/exam-bank-coverage.json` —
they read the JSON's `belowTen` array, pick the next priority
subtopics, append questions, re-run the audit, push.

### Conventions inherited from existing phases

- New libs in `client/src/lib/` (one concept per file).
- Scripts in `scripts/*.mjs` (Node, no compile step).
- Per-PR specs in `.agents/tasks/<phase>/features/FEAT-*.json`.
- Tests in `server/tests/*.test.ts` (vitest, runs in CI).
- Schema/prompt/validator alignment kept in single sources of truth.
