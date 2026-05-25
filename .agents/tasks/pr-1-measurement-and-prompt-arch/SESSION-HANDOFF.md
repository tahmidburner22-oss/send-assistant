# PR-1 — Session Handoff

> **Always update this file at the end of every checkpoint.** Edit
> "What is done" / "What is in flight" / "What is next" in the same
> commit as the work it describes. Push to remote in the same step.
> Keep this file ~250 lines.

Last updated: **2026-05-25 (recovery bundle authored from main)**.

## Status of this folder

This folder was authored from `main` after the original PR-1 work
session lost its chat connection mid-write. The original session
described pushing the following commits to a feature branch
(branch name not captured in the narrative):

| Sub-step | Sprint | Approx. commit sha |
| -------- | ------ | ------------------ |
| Branch + scaffolding | scaffold | `efb4547a`         |
| 1.A — Rubric         | 1       | `ca034a2e`         |
| 1.B — Comparison corpus + loader + test | 1 | `1992cfe`     |
| 1.C — Schema + summariser per-axis + axis-floor rule | 1 | `e0e93d4` |
| 1.D — Model-judge rater + classifyWarning | 1 | `c7097bc`        |
| 1.E — Runner integration + human-scores loader | 1 | `5f9ae77`  |
| 1.F — Baseline + nightly workflow + --update-baseline flag | 1 | `cfe21bc` |
| 3.A — Two-pass generator orchestrator + test | 3 | (see "What is done") |
| 3.B — `stripValidatorPrefix` helper + test    | 3 | `805a223`   |
| 3.C — Per-subject prompt-family test          | 3 | (see "What is done") |
| 3.D — Wire `promptAbFramework` into eval harness | 3 | (see "What is done") |

The recovery branch this file lives on (`docs/pr-1-recovery-plan`)
contains **only this `.agents/tasks/pr-1-measurement-and-prompt-arch/`
bundle** — no source-code changes. The original work-branch is
elsewhere on the remote and has not been merged to main.

If you are picking this up in a fresh chat, **first try to find the
original branch** (`git branch -a | grep -E "measurement|prompt-arch|sprint-1|pr-1"`
on a sandbox that has access). If you find it, the work above may
already be done — verify against this file's "What is done" section.
If you do NOT find it, treat every sub-step in "What is done" as
re-implementable from the pin-points and rubric below.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Working on PR-1 of the four-PR ladder
         (Sprints 1 + 3 — measurement + prompt architecture).
         Recovery folder: .agents/tasks/pr-1-measurement-and-prompt-arch/
         Branch: feat/pr-1-measurement-and-prompt-arch  (or recover
         the original work-branch if you can find it — see "Status
         of this folder" below).
Resume:  .agents/tasks/pr-1-measurement-and-prompt-arch/SESSION-HANDOFF.md
Plan:    .agents/tasks/pr-1-measurement-and-prompt-arch/PHASE-PLAN.md
PR body: .agents/tasks/pr-1-measurement-and-prompt-arch/PR-DESCRIPTION.md
Constraints:
  - Sandbox is INTEGRATIONS_ONLY. No npm install. Type-check + tests
    run in CI on PR push.
  - Do NOT read ai.ts (5,200+), Worksheets.tsx (6,500+),
    WorksheetRenderer.tsx (7,000+) in full from a fresh chat.
  - All extensions to existing eval-harness files MUST be additive —
    older fixtures + reports must keep parsing.
  - Push to remote after every meaningful chunk (one sub-step).
Goal: complete the next un-shipped sub-step in "What is next" below,
      update this file, push.
```

## File pin-points (so the next chat doesn't re-explore)

| File | Line range | Why |
| ---- | ---------- | --- |
| `server/tests/worksheet-eval/types.ts` | 24–46 | `EvalFixtureParams` — DO NOT EDIT (no params change for PR-1) |
| `server/tests/worksheet-eval/types.ts` | 48–67 | `EvalFixture` — extend with `humanScores?`, `axisFloors?`, `experimentVariant?` |
| `server/tests/worksheet-eval/types.ts` | 69–85 | `EvalReportRow` — extend with `axisScores?`, `experimentVariant?` |
| `server/tests/worksheet-eval/types.ts` | 87–115 | `EvalReport` — extend with `variantStats?`, `axisStats?` |
| `server/tests/worksheet-eval/rules.ts` | 185–194 | `RULE_REGISTRY` — register `model-judge-axis-floor` here |
| `server/tests/worksheet-eval/rules.ts` | 95–125 | Pattern for new rule (read `metadata.modelJudgeAxes` + per-fixture `axisFloors`) |
| `server/tests/worksheet-eval/runner.ts` | 152–200 | `runFixture` — extend signature to accept rater + invoke after post-validate |
| `server/tests/worksheet-eval/runner.ts` | 202–280 | `main()` — `pickRater()`, load human-scores CSV, build aggregates |
| `server/tests/worksheet-eval/runner.ts` | 56–80   | `loadFixtures` pattern — replicate for human-scores loader |
| `server/tests/worksheet-eval/summariser.ts` | 38–60 | `renderMarkdownSummary` — add per-axis block + per-variant block |
| `server/tests/worksheet-eval/generators.ts` | 145–170 | `liveGenerator.generate` — pattern for the rater's `callAIMessages` call |
| `client/src/lib/promptAbFramework.ts` | (whole file) | Already exists — `pickVariant` + `resolveExperiment` (#45, shipped) |
| `.github/workflows/worksheet-eval.yml` | (whole file) | Add baseline-refresh job on `push: main` |

`callAIMessages` signature (verified via grep, NOT inferred): the
function takes `(messages, maxTokens?, opts?)` — three positional
args, NOT a single options object. The Sprint 1.D rater MUST call it
with that exact shape.

## What is done

**See "Status of this folder" above.** The list below is a
declaration of what the original session pushed to its work-branch.
If recovering from this bundle on a fresh branch, treat each as a
work item, not a completed item.

- **Branch + scaffolding** (`efb4547a`). Cut feature branch from
  main. Created `.agents/tasks/<task-folder>/` with PHASE-PLAN +
  SESSION-HANDOFF stubs.

- **Sprint 1.A — Per-axis rubric** (`ca034a2e`). Extended
  `server/tests/worksheet-eval/rules.ts` so each fixture can be
  judged on the same axes (curriculum-fidelity, command-word-discipline,
  scaffolding, send-register, examiner-voice). Pure additions to the
  existing `RULE_REGISTRY`.

- **Sprint 1.B — Comparison corpus + loader + test** (`1992cfe`).
  Authored 30 `cmp-*.json` fixtures: maths 9 / english 6 / science 7
  / humanities 5 / send 3. All `cmp-`-prefixed, all unique IDs, all
  KS bands Y2–Y13 represented, 3 SEND fixtures with explicit
  `sendNeed`. New loader + shape test.

- **Sprint 1.C — Schema + summariser per-axis + axis-floor rule**
  (`e0e93d4`). Extended `types.ts` with the per-axis schema. Extended
  `summariser.ts` to render per-axis when present + an aggregate
  helper. Registered `model-judge-axis-floor` in `rules.ts`. Tests
  for schema + rule + summariser helpers.

- **Sprint 1.D — Model-judge rater + classifyWarning** (`c7097bc`).
  New `modelJudgeRater.ts`. Live rater calls `callAIMessages
  (messages, maxTokens?, opts?)` — verified signature, NOT a single
  options object. Deterministic warning classification via
  `classifyWarning` (operator-precedence-tightened). Test pinning
  the rater shape.

- **Sprint 1.E — Runner integration + human-scores loader**
  (`5f9ae77`). Cost guard + `runFixture` extended to accept the
  rater. New CSV human-scores loader. Aggregates wired into the
  report. The `model-judge-axis-floor` rule added to every
  comparison-corpus entry so the new rule is exercised every run.

- **Sprint 1.F — Baseline + nightly workflow + --update-baseline**
  (`cfe21bc`). New `--update-baseline` flag on the runner. New
  structurally-valid empty `baseline.json` (refreshed on first
  nightly run). New separate workflow job that refreshes the
  baseline on `push: main`.

- **Sprint 3.A — Two-pass generator orchestrator** (commit sha not
  captured in narrative). New `client/src/lib/twoPassWorksheetOrchestrator.ts`
  — pure orchestrator with injected generate + critique + revise
  steps for testability. Behind `PROMPT_TWO_PASS_ENABLED`. Test
  pinning the order of operations.

- **Sprint 3.B — `stripValidatorPrefix` helper + test** (`805a223`).
  Helper in the orchestrator file. Test corrects the initial
  wrong-assumption fixture (the helper strips
  `[Phase PR-NN — <validator>]` prefixes from warnings, not the
  validator name itself).

- **Sprint 3.C — Per-subject prompt-family test** (commit sha not
  captured in narrative). New `server/tests/perSubjectPromptFamilies.test.ts`
  — locks the `PROMPT_FAMILIES` map shape per subject so adding a
  subject without its family fails CI.

- **Sprint 3.D — Wire `promptAbFramework` into eval harness**
  (commit sha not captured in narrative). Extended `types.ts` with
  experiment fields. Runner threads variant through `runFixture` +
  the report. Summariser renders per-variant breakdown.
  `experiments.test.ts` covers the bucketing.

## What is in flight

_Nothing._ The original session reported all six Sprint 1 sub-steps
+ all four Sprint 3 sub-steps as pushed before context ran out.

The remaining work is **opening the PR**. The original session was
"updating the header + tracking + opening the PR" when context
expired. If recovering from this bundle, the open-PR step is the
first action.

## What is next

**Open PR-1** with the body in
[`PR-DESCRIPTION.md`](./PR-DESCRIPTION.md). Target: `main`.

After PR-1 lands:

- **PR-2 (Sprints 2)** — Taxonomy expansion. Pure data entry.
  Subject-Lead-reviewable. Lands in **parallel** with PR-1, not
  after — review surface is disjoint.
- **PR-3 (Sprints 4 + 6)** — Examiner-voice cadence + SEND moat.
  Depends on PR-1's measurement layer.
- **PR-4 (Sprints 5 + 7)** — Source-driven generation + visual
  polish + live preview + public scorecard. Depends on PR-1's
  measurement as the scorecard's source.

See [`PHASE-PLAN.md`](./PHASE-PLAN.md) for the full ladder.

## Checkpoint protocol

After every sub-step:

1. `git status` — confirm only the intended files changed.
2. `git add <files>` — specific paths, never `git add .`.
3. `git commit -m "<scope>: <what changed>"` — conventional-commit
   style (e.g. `eval: add per-axis rubric (Sprint 1.A)`).
4. `github_push_to_remote` to the work-branch.
5. Update **this file's** "What is done" + "What is next" sections
   in the same or follow-up commit.

## Notes (transient scratchpad)

### Why this folder was authored from main

The original PR-1 chat session lost its connection while updating
the header + tracking and opening the PR. The next session opened
on a fresh sandbox container with no access to the work-branch
(`git fetch` blocked by the auth gateway; the branch name was
never spelled out in the narrative). Twelve heuristic guesses at
the branch name (`feat/eval-measurement-and-prompt-arch`,
`feat/measurement-prompt-arch`, `feat/pr-1-measurement-prompt-arch`,
`feat/eval-rubric-and-prompt-arch`, `feat/sprints-1-3`,
`feat/eval-measurement`, `feat/measurement-and-prompt-arch`,
`feat/eval-rubric`, `feat/eval-harness-rubric`,
`feat/pr1-measurement-prompt-arch`,
`feat/sprint-1-3-measurement-prompt-arch`,
`feat/eval-axis-rubric`, `feat/measurement-and-prompts`) all
returned "couldn't find remote ref".

The recovery move was to author this `.agents/tasks/<...>/` bundle
on `main` from the narrative, so any future chat (with or without
access to the work-branch) can resume cleanly.

### Verifying recovery against the work-branch

If a future session locates the original work-branch:

1. Read its `.agents/tasks/<...>/SESSION-HANDOFF.md` if any. If it
   doesn't have one, this bundle is the only handoff that exists.
2. Diff the work-branch's `server/tests/worksheet-eval/` against
   `main` to confirm each sub-step's files exist + the rule is
   registered + the rater is callable.
3. If any sub-step is missing, re-implement it from the pin-points
   above. The rubric + the corpus structure + the rater call shape
   are fully specified in `PR-DESCRIPTION.md`.
4. Update this file's "What is done" with the actual commit shas
   from the work-branch.
5. Open PR-1 (or update the existing PR if one was opened in a
   later session).

### Resolver-order bug noted in big-bang/SESSION-HANDOFF (Phase 1)

`resolveSendSpec` in `client/src/lib/sendPromptFragments.ts` has an
ordering issue where a matcher consuming `semh` runs before the
SEMH-specific matcher. **Out of scope for PR-1.** Surfaced here
because Sprint 1.B's three SEND fixtures route through
`"social-emotional"` rather than `"semh"` to dodge this. Flagged
for whichever PR finally touches the SEND scope.
