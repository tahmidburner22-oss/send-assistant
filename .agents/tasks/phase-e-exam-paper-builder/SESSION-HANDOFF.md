# Phase E — Session Handoff

> **Always update this file at the end of every checkpoint** so the
> next chat can pick up cleanly. Edit "What is done" / "What is in
> flight" / "What is next" in the same commit as the work it describes.
> Push to remote in the same step.

Last updated: 2026-05-23 — PR-A Step 3 (coverage audit + CI guard)
shipped on `feat/phase-e-exam-paper-builder`. Gap-fill wave 1 is next.

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

- **PR-A · Step 3 — Coverage audit + CI guard**. In a single commit:
  - `scripts/_exam-bank-extract.mjs` (new) — shared lib used by both
    the back-tagger and the audit. Exports `loadAllQuestions`,
    `loadSubtopicsMap`, `loadSubtopicTags`, `buildTopicToSubjectMap`,
    `SECTION_TO_SUBJECT`, `refineScienceSubject`. The leading
    underscore matches the `_gen-eval-fixtures.mjs` convention for
    non-invokable support scripts.
  - `scripts/exam-bank-back-tagger.mjs` — refactored to import from
    `_exam-bank-extract.mjs`. Behaviour-preserving (same 2,719 tags).
  - `scripts/exam-bank-coverage.mjs` (new) — walks every (topic,
    subtopic) pair in `SUBTOPICS_MAP`, counts questions where
    `q.subtopic === subtopic` OR `SUBTOPIC_TAGS[q.id] === subtopic`,
    emits `docs/exam-bank-coverage.json`. Two-tier subject inference
    (bank-derived first, then section-comment-derived) so subtopics
    in MFL / DRAMA / SOCIOLOGY etc. still get a subject. Broad SCIENCE
    section uses keyword matching to split into bio/chem/phys.
  - CLI flags: `--check-against=<baseline.json>` exits 1 on
    regression (CI gate); `--update-baseline` overwrites the baseline
    after a deliberate gap-fill wave.
  - `docs/exam-bank-coverage.json` (generated) +
    `docs/exam-bank-coverage.baseline.json` (frozen first run) both
    committed. First-run totals: 91/907 covered, 816 belowTen,
    548 zero. Per-subject roll-up shows core GCSE subjects
    (mathematics 13/203/162, biology 19/142/83, physics 14/23/6,
    chemistry 11/21/5, english-language 9/159/109,
    english-literature 0/15/10, geography 4/34/13, history 8/31/17,
    computer-science 9/22/6) plus section-derived rows for subjects
    with no bank questions yet (religious-studies, mfl, business,
    psychology, economics).
  - `.github/workflows/exam-bank-coverage.yml` (new) — runs on PR
    push when relevant files change. Re-runs the back-tagger
    (deterministic) then the audit with regression check. Uploads
    the coverage JSON as a build artifact.

## What is in flight

_Nothing yet. PR-A Step 4 (gap-fill wave 1) starts at the next checkpoint._

## What is next

**PR-A · Step 4 — Gap-fill wave 1** (target: 1 commit, ~150 new
hand-authored questions, append-only).

Exact actions in order:

1. Read `docs/exam-bank-coverage.json`. Pick the priority list:
   from the `zero` array, select rows where `subject` is one of
   `mathematics`, `biology`, `chemistry`, `physics`, `english-language`.
   Cap at the first ~30 subtopics per subject so the diff stays
   reviewable (overall ~150 questions for the first wave; subsequent
   sessions grind down the rest).
2. For each selected subtopic, author 3-5 exam-style questions with
   full fields:
   - `id` — unique, prefix `phaseE-` plus a short slug derived from
     subtopic name + sequence number.
   - `subject` — one of the canonical subject IDs.
   - `topic` — must match the topic key from `SUBTOPICS_MAP`.
   - `subtopic` — exact match for the `SUBTOPICS_MAP[topic]` entry
     (this is the explicit field; takes precedence over
     `SUBTOPIC_TAGS[q.id]`).
   - `text`, `marks`, `commandWord`, `markScheme`, `hint`, `tier`
     (Higher / Foundation), `ao` (AO1-AO4), `stage`, `yearGroups`.
   - `board: "Adaptly"` for the new bank.
3. Append to the matching subject's `questionBank*.ts` file, in
   the array literal, just before the closing `];`. Never edit
   existing entries.
4. Run `node scripts/exam-bank-back-tagger.mjs` (it'll see the new
   `subtopic` fields and tag them at score `Infinity`).
5. Run `node scripts/exam-bank-coverage.mjs --update-baseline`
   to refresh both `docs/exam-bank-coverage.json` and
   `docs/exam-bank-coverage.baseline.json` (deliberate gap-fill —
   the new floor is the new state).
6. Commit. Push.
7. Update this handoff: move Step 4 to "What is done", set "What
   is next" to PR-A Step 5 (open the PR).

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
