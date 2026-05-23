# Phase E — Session Handoff

> **Always update this file at the end of every checkpoint** so the
> next chat can pick up cleanly. Edit "What is done" / "What is in
> flight" / "What is next" in the same commit as the work it describes.
> Push to remote in the same step.

Last updated: 2026-05-23 — PR-A Step 2 (back-tagger) shipped on
`feat/phase-e-exam-paper-builder`. Coverage audit is next.

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

- **PR-A · Step 2 — Back-tagger script + first run**. In a single
  commit:
  - `scripts/exam-bank-back-tagger.mjs` (new) — pure-Node script,
    no dependencies. Reads every `questionBank*.ts` and
    `pastPaperQuestions.ts`/`pastPaperQuestionsExpanded.ts` as plain
    text. Algorithm:
    - `indexBracePairs(content)` — string-aware forward walk that
      records every `{`-`}` pair regardless of nesting (the only
      reliable way to handle multi-line + single-line entry styles
      uniformly — bank files mix both).
    - `extractQuestions(content)` — finds every `id: "..."` match,
      looks up the smallest enclosing brace pair, regex-extracts
      `topic`, `subject`, `text`/`question`, `subtopic` fields.
    - `extractSubtopicsMap(content)` — string-aware brace walk to
      load `SUBTOPICS_MAP` from `subtopics-data.ts` as
      `Record<topic, subtopic[]>` (178 topics, 907 subtopics).
    - `buildIdfMap(subtopicsMap)` — IDF weights per stem, so
      generic-named subtopics like "One more and one less" don't
      over-tag (their tokens appear in many other subtopics → low
      IDF → near-zero contribution).
    - `scoreSubtopic(sub, qText, idfMap)` — IDF-weighted score over
      tokens (whole-word stem match = 1.0, substring fallback = 0.4,
      verbatim-substring boost = +0.5×totalIdf), normalised by
      total IDF mass.
    - `pickBestSubtopic(q, ...)` — prefers `SUBTOPICS_MAP[q.topic]`
      candidates; falls back to fuzzy topic-name match, then to
      every subtopic. Requires `bestScore ≥ threshold` AND
      `bestScore - secondBest ≥ 0.08` (margin check kills near-tie
      ambiguous tags).
    - Default threshold: 0.35. CLI override: `--threshold=0.3`.
    - Stem normalisation: simple suffix-strip (`fractions` →
      `fraction`, `adding` → `add`, etc.) so plural/gerund subtopic
      names match singular/imperative question text.
  - `client/src/lib/subtopicTags.ts` (regenerated) — frozen
    `Record<id, subtopic>` map of the back-tagger's output. Sorted
    by id for stable diffs. **2,719 / 6,902 questions tagged
    (39.4%)** with the default threshold. Conservative on purpose:
    we'd rather have an accurate audit signal than a high tag rate
    full of false positives — the audit + gap-fill close the rest.

## What is in flight

_Nothing yet. PR-A Step 3 (coverage audit) starts at the next checkpoint._

## What is next

**PR-A · Step 3 — Coverage audit script + CI guard** (target: ≤ 1
commit for the script + first run + workflow).

Exact actions in order:

1. Create `scripts/exam-bank-coverage.mjs`. Reuses the same brace
   indexer + question extractor approach as the back-tagger (factor
   the shared bits into a small lib if cleaner, otherwise duplicate
   — sandbox has no module bundler for `.mjs`).
   - Load `SUBTOPICS_MAP` and `SUBTOPIC_TAGS` (the back-tagger output).
   - Walk every (topic, subtopic) pair in `SUBTOPICS_MAP`.
   - For each subtopic, count questions where `q.subtopic === subtopic`
     OR `SUBTOPIC_TAGS[q.id] === subtopic`.
   - Emit `docs/exam-bank-coverage.json` with shape:
     ```json
     {
       "generatedAt": "2026-05-23T...",
       "threshold": 10,
       "totals": {
         "questionsScanned": 6902,
         "subtopicsTotal": 907,
         "subtopicsCovered": <n>,
         "subtopicsBelowTen": <n>,
         "subtopicsZero": <n>
       },
       "perSubject": { "mathematics": {...}, ... },
       "belowTen": [{ "topic", "subtopic", "count", "subject" }, ...],
       "zero":     [{ "topic", "subtopic" }, ...]
     }
     ```
     `belowTen` sorted by count ascending then subject — so zero rows
     come first, ordered by subject for review. `zero` is a separate
     array for convenience (it's a strict subset of `belowTen`).
   - Print summary to stdout.
2. Run once. Copy the output to
   `docs/exam-bank-coverage.baseline.json` — the regression-guard
   reference.
3. Add a `--check-against=<baseline.json>` CLI mode that exits 1 if
   any subtopic count regresses below its baseline value. Print the
   list of regressions.
4. Add `.github/workflows/exam-bank-coverage.yml`:
   - Trigger: PR push.
   - Steps: checkout, install pnpm deps, `node scripts/exam-bank-back-tagger.mjs`,
     `node scripts/exam-bank-coverage.mjs --check-against=docs/exam-bank-coverage.baseline.json`.
5. Commit. Push.
6. Update this handoff: move Step 3 to "What is done", set "What
   is next" to PR-A Step 4 (gap-fill wave 1).

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
