# Phase E — Session Handoff

> **Always update this file at the end of every checkpoint** so the
> next chat can pick up cleanly. Edit "What is done" / "What is in
> flight" / "What is next" in the same commit as the work it describes.
> Push to remote in the same step.

Last updated: 2026-05-23 — PR-A Step 1 (schema + helpers) shipped on
`feat/phase-e-exam-paper-builder`. Back-tagger script is next.

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

- **Phase E scaffolding** (commit `37f5351`). Created the phase folder
  with `RESUME.md`, `PHASE-PLAN.md`, this handoff file, and the two
  per-PR specs (`FEAT-PE-A.json`, `FEAT-PE-B.json`). Branch
  `feat/phase-e-exam-paper-builder` cut from `main` and pushed so
  any subsequent session can resume even if this one ends.

- **PR-A · Step 1 — Schema + helpers**. In a single commit:
  - `client/src/lib/pastPaperQuestions.ts`:
    - Added `subtopic?: string` to the `PastPaperQuestion` interface
      (after `markBreakdown`) with a JSDoc explaining the lookup
      contract (`q.subtopic ?? SUBTOPIC_TAGS[q.id] ?? null`).
    - Added imports for `SUBTOPICS_MAP` (from `subtopics-data.ts`)
      and `SUBTOPIC_TAGS` (from the new `subtopicTags.ts`).
    - Extended `getExamQuestions` with an optional `subtopic?: string`
      param and a `matchesSubtopic` predicate that resolves the
      effective subtopic via the lookup chain and substring-matches
      case-insensitively.
    - Added `getSubtopicsForTopic(topic): string[]` (reads
      `SUBTOPICS_MAP`, case-insensitive key lookup as a fallback).
    - Added `getCandidatePoolForTopics({ subject, topics[], tier?, yearGroup?, board? }): PastPaperQuestion[]` —
      returns every question whose `topic` OR effective subtopic
      matches any entry in `topics[]`. Reuses the same year-group
      filtering rules as `getExamQuestions` but does NOT shuffle or
      limit (assembly engine in PR-B owns sampling + determinism).
  - `client/src/lib/subtopicTags.ts` (new) — placeholder
    `Object.freeze({})` of type `Readonly<Record<string, string>>`.
    The back-tagger script will overwrite this file in PR-A Step 2.

## What is in flight

_Nothing yet. PR-A Step 2 (back-tagger) starts at the next checkpoint._

## What is next

**PR-A · Step 2 — Back-tagger script** (target: ≤ 1 commit for the
script + the regenerated `subtopicTags.ts`).

Exact actions in order:

1. Create `scripts/exam-bank-back-tagger.mjs`. Pure-Node script (no
   TS compile step — sandbox is `INTEGRATIONS_ONLY`). Algorithm:
   - Read all `client/src/lib/questionBank*.ts` files plus
     `client/src/lib/pastPaperQuestionsExpanded.ts` as plain text.
   - Regex-extract `id: "..."`, `topic: "..."`, `text: "..."` /
     `question: "..."`, `marks: <n>`, `subject: "..."` from each
     question literal. Skip entries without an id.
   - Read `client/src/lib/subtopics-data.ts` and regex-extract the
     `SUBTOPICS_MAP` object as `Record<topic, subtopic[]>`.
   - For each question, score each subtopic candidate in
     `SUBTOPICS_MAP[q.topic]` (or every subtopic when `q.topic` is
     missing) by:
     - Tokenise the subtopic name into lowercase words minus stop
       words (`a`, `the`, `of`, `and`, `to`, `in`, `for`, `with`,
       `on`, `from`, `or`).
     - For each token of length ≥ 3, +1.0 score if it appears as a
       whole word in `q.text`, +0.4 if it appears as a substring.
     - +0.3 boost if the full subtopic name (lowercased) appears as
       a verbatim substring of `q.text`.
     - Normalise by token count so longer subtopic names don't win
       by default.
   - Accept the highest-scoring subtopic if normalised score ≥ 0.6.
     Otherwise leave the question untagged.
2. Emit `client/src/lib/subtopicTags.ts` with the canonical header +
   the `Object.freeze({...})` literal of `id → subtopic` pairs,
   sorted by id for stable diffs.
3. Print summary: total questions scanned, total tagged, percent
   tagged, and the top 10 most-tagged subtopics + 10 untagged-topic
   counts.
4. Run `node scripts/exam-bank-back-tagger.mjs`. Inspect the output.
5. Commit both the script and the regenerated `subtopicTags.ts`.
   Push.
6. Update this handoff: move Step 2 to "What is done", set "What
   is next" to PR-A Step 3.

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
