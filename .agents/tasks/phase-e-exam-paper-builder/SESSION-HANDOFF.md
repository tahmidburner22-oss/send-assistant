# Phase E — Session Handoff

> **Always update this file at the end of every checkpoint** so the
> next chat can pick up cleanly. Edit "What is done" / "What is in
> flight" / "What is next" in the same commit as the work it describes.
> Push to remote in the same step.

Last updated: 2026-05-23 — Phase E COMPLETE. PR-A is **PR #109**
(`feat/phase-e-pr-a-bank-coverage` → main); PR-B is **PR #108**
(`feat/phase-e-pr-b-create-exam-paper` → `feat/phase-e-pr-a-bank-coverage`,
stacked).

> **Housekeeping:** PR #107 was opened earlier against the shared branch
> `feat/phase-e-exam-paper-builder` and ended up containing both PR-A
> and PR-B commits (continuous push during development). Close PR #107
> in favour of PR #109 (PR-A) and PR #108 (PR-B).

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

- **PR-A · Step 4 — Gap-fill wave 1**. In a single commit, appended
  160 hand-authored exam-style questions across 32 zero-coverage
  subtopics in 5 core GCSE subjects, with full fields (id, board,
  subject, year, series, paper, tier, marks, topic, **subtopic**
  — the explicit field which the back-tagger picks up at score
  Infinity, text, commandWord, answerLines, markScheme, hint, ao,
  stage, yearGroups). Append-only — never edited an existing entry.
  Plus one parser bug-fix:
  - `scripts/_exam-bank-extract.mjs` — `indexBracePairs` now skips
    `// line` and `/* block */` comments. Without this, an
    apostrophe inside a comment (e.g. `// Ohm's Law`) opened a
    string-quote state and broke parsing of the 25 questions
    after that comment.
  - `client/src/lib/questionBank{Maths,Biology,Chemistry,Physics,English}.ts` —
    appended 40+40+25+30+25 = 160 questions before the closing
    `];` of each array. Marker comment block at the top of each
    insertion identifies them as Phase E gap-fill wave 1.
  - `client/src/lib/subtopicTags.ts` — regenerated. Now
    2,879 / 7,062 questions tagged (40.8%): 2,719 back-tagged from
    text + 160 explicit-field (the new gap-fill).
  - `docs/exam-bank-coverage.json` and
    `docs/exam-bank-coverage.baseline.json` — regenerated.
    Wave-1 effect:
    - Total questions: 6,902 → 7,062 (+160).
    - Zero subtopics: 548 → 514 (−34: every targeted subtopic
      closed, plus 2 indirect via back-tagger seeing more text).
    - Per-subject zero closures:
      mathematics 162→153, biology 83→75, english-language 109→103,
      **physics 6→0 (all closed)**, **chemistry 5→0 (all closed)**.
    - Subtopics covered (≥10): unchanged at 91, because each
      gap-filled subtopic only got 5 questions — they moved from
      `zero` to `belowTen`, which is what wave 1 sets up. Wave 2
      bumps them to ≥10.

- **PR-A · Step 5 — Open the PR**. Opened as PR
  [#107](https://github.com/tahmidburner22-oss/send-assistant/pull/107)
  with title "Phase E PR-A: Exam Bank subtopic schema + back-tagger
  + coverage audit + gap-fill wave 1". PR body links the phase
  folder, lists per-subject coverage roll-up, and notes that PR-B
  does not depend on the gap-fill being complete.

- **PR-B · Step 7 — Assembly engine + unit tests**. In a single
  commit:
  - `client/src/lib/createExamPaperBuilder.ts` (new) — pure-function
    `buildCreatedExamPaper(params): CreatedExamPaperResult`.
    Algorithm: pulls candidate pool via `getCandidatePoolForTopics`
    (PR-A surface) → splits into mark bands (warmup 1-3, core 4-6,
    stretch 7+) → computes 30/50/20 budget for real-exam paperStyle
    or 100% core for single-section → enforces per-topic floor (every
    requested topic contributes ≥ 1 question or warns) → greedy
    deterministic-shuffle knapsack within each band with AO +
    command-word diversity tie-breaks → sorts ascending by marks
    within sections → emits the same `ExamPaperWorksheet` shape as
    `examPaperBuilder.ts` so it slots into the existing renderer +
    PDF + Class-Pack pipeline. Determinism via djb2 + LCG seeded
    from explicit `seed` or hashed params. Pure function — no I/O,
    no LLM. Accepts `poolOverride` for testability so tests don't
    depend on the live bank.
  - `client/src/lib/__tests__/createExamPaperBuilder.test.ts` (new)
    — 13 vitest cases covering: target accuracy ±2 marks, per-topic
    floor enforcement, empty-topic warning, undersized-pool partial
    + warning, deterministic by seed (same seed → same paper),
    different seeds → different but valid papers, calculator
    filtering, single-section paperStyle (core-dominant), AO/
    command-word diversity tie-break, ExamPaperWorksheet shape
    parity with examPaperBuilder.ts, mark-scheme section default
    on, mark-scheme omitted when includeAnswers=false, empty pool,
    invalid-input throws.

- **PR-B · Step 8 — Tool UI + registry + route + hub card**. In a
  single commit:
  - `client/src/pages/tools/CreateExamPaper.tsx` (new) —
    self-contained tool page. Form: subject (canonical-id select
    over the 9 subjects with bank questions), year-group, tier,
    multi-select topic chips driven by `getTopicsForSubject` with
    fine-grained subtopic chips per group (using
    `getSubtopicsForTopic` from PR-A) and per-chip question-count
    badge driven by `getCandidatePoolForTopics`, total-marks input
    with quick presets (40/60/80/100), calculator + paper-style +
    include-answers toggles. Submit calls
    `buildCreatedExamPaper`, renders sections inline with a Print /
    Save-as-PDF button (via `window.print()`). Warnings array is
    surfaced as an amber callout when present. Self-contained — no
    AIToolPage dependency, no AI generation.
  - `client/src/lib/tool-registry.ts` — appended a new
    `ToolEntry`: id `create-exam-paper`, label "Create an Exam
    Paper", path `/tools/create-exam-paper`, hub `revision`,
    sendTo `[differentiate, flash-cards, audio-revision-hub]`,
    icon `ScrollText`, colour `text-rose-700 bg-rose-50`,
    writeBack `true`.
  - `client/src/App.tsx` — added lazy import + Route line.
  - `client/src/pages/hubs/RevisionHubSection.tsx` — added a 5th
    storyboard step "Build a mock exam paper" pointing at the
    new tool.

- **PR-B · Step 9 — Open PR-B**. Opened as PR
  [#108](https://github.com/tahmidburner22-oss/send-assistant/pull/108)
  on branch `feat/phase-e-pr-b-create-exam-paper`, stacked on top
  of PR-A's clean branch (`feat/phase-e-pr-a-bank-coverage`). PR
  body links the phase folder, summarises the algorithm, and
  includes a worked example.

- **Branching cleanup**. Cut `feat/phase-e-pr-a-bank-coverage` from
  HEAD `95140da` (PR-A's last commit) and `feat/phase-e-pr-b-create-exam-paper`
  from `fb2b13e` (PR-B's last commit, on top of PR-A). Reopened the
  PRs cleanly:
  - **PR #109** = PR-A: `feat/phase-e-pr-a-bank-coverage` → `main`.
  - **PR #108** = PR-B: `feat/phase-e-pr-b-create-exam-paper` → `feat/phase-e-pr-a-bank-coverage` (stacked).
  - PR #107 (the original "everything-in-one-branch" PR) is left
    behind — close it in favour of #109/#108.

## What is in flight

_Nothing — Phase E is complete. Both PRs are open and awaiting review._

## What is next

_Phase E has no further steps in this session._ Subsequent sessions
can pick up the follow-on waves below — each is a self-contained
chunk that fits in one session.

**Future waves** (any subsequent session can pick up):

- **Wave 2 gap-fill** — bump every PR-A wave-1 subtopic from 5
  questions to 10 questions (+5 each × 32 subtopics = +160
  questions). Use `docs/exam-bank-coverage.json` `belowTen` array to
  pick rows with `count` between 1 and 9 in the priority subjects.
  Run the back-tagger + audit + `--update-baseline` after authoring;
  the CI gate guards regressions.
- **Wave 3+** — work through the remaining 514 zero-coverage
  subtopics in non-core subjects (MFL, drama, music, sociology,
  art, KS1/KS2 maths). The audit JSON makes this a transparent task
  list.
- **Class Pack / PDF integration for Create-an-Exam-Paper** — wire
  the new tool into the Worksheets Save-to-Library +
  Send-to-Class-Pack flow so generated papers persist and can be
  assigned. The engine already emits the canonical
  `ExamPaperWorksheet` shape, so this is one extra import away.
- **Subtopic dropdown in the Worksheet Generator** — surface the new
  `getSubtopicsForTopic` helper in the existing worksheet-generator
  subtopic dropdown so worksheets can be filtered to subtopic
  granularity instead of topic granularity.

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
