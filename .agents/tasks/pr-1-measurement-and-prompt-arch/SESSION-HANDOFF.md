# PR-1 — Session Handoff

> **Update this file at the end of every checkpoint.** Edit "What
> is done" / "What is in flight" / "What is next" in the same
> commit as the work it describes. Push to remote in the same step.
> Keep this file ~250 lines.

Last updated: **2026-05-25 — Sprint 1.A landed**.

Branch: `feat/pr-1-measurement-and-prompt-arch`.

## Status

This is a **fresh implementation** of PR-1. A previous chat session
narrated doing this work but the commits never reached the remote
(no work-branch was found on origin; twelve heuristic name guesses
all returned "couldn't find remote ref"). Treat the original
narrative as a spec, not a status report. Every sub-step below is
either "shipped on this branch" (with a real commit sha) or "not
yet implemented".

## File pin-points (so the next chat doesn't re-explore)

Read these exact ranges, not the whole files.

| File | Line range | Why |
| ---- | ---------- | --- |
| `server/tests/worksheet-eval/types.ts` | 24–46 | `EvalFixtureParams` — DO NOT EDIT (no params change for PR-1) |
| `server/tests/worksheet-eval/types.ts` | 48–67 | `EvalFixture` — extend with `humanScores?`, `axisFloors?`, `experimentVariant?` (1.C, 3.D) |
| `server/tests/worksheet-eval/types.ts` | 69–85 | `EvalReportRow` — extend with `axisScores?`, `experimentVariant?` (1.C, 3.D) |
| `server/tests/worksheet-eval/types.ts` | 87–115 | `EvalReport` — extend with `variantStats?`, `axisStats?` (1.C, 3.D) |
| `server/tests/worksheet-eval/rules.ts` | 188–197 | `RULE_REGISTRY` — register `model-judge-axis-floor` here (1.C) |
| `server/tests/worksheet-eval/rules.ts` | 95–125 | Pattern for new rule (read `metadata.modelJudgeAxes` + per-fixture `axisFloors`) |
| `server/tests/worksheet-eval/runner.ts` | 152–200 | `runFixture` — extend signature to accept rater + invoke after post-validate (1.E) |
| `server/tests/worksheet-eval/runner.ts` | 202–280 | `main()` — `pickRater()`, load human-scores CSV, build aggregates (1.E) |
| `server/tests/worksheet-eval/runner.ts` | 56–80   | `loadFixtures` pattern — replicate for human-scores loader (1.E) |
| `server/tests/worksheet-eval/summariser.ts` | 38–60 | `renderMarkdownSummary` — add per-axis block + per-variant block (1.C, 3.D) |
| `server/tests/worksheet-eval/generators.ts` | 145–170 | `liveGenerator.generate` — pattern for the rater's `callAIMessages` call (1.D) |
| `client/src/lib/promptAbFramework.ts` | (whole file) | Already exists — `pickVariant` + `resolveExperiment` (#45, shipped) |
| `.github/workflows/worksheet-eval.yml` | (whole file) | Add baseline-refresh job on `push: main` (1.F) |

`callAIMessages` signature (verified via grep, NOT inferred): the
function takes `(messages, maxTokens?, opts?)` — three positional
args, NOT a single options object. The Sprint 1.D rater MUST call
it with that exact shape.

## What is done

- **Planning bundle + Sprint 1.A — Per-axis rubric** (this commit).
  Authored the four-file planning bundle in
  `.agents/tasks/pr-1-measurement-and-prompt-arch/`. Shipped
  `server/tests/worksheet-eval/rubric.ts` exporting `RUBRIC_AXES`
  with five axes (`curriculum-fidelity`, `command-word-discipline`,
  `scaffolding`, `send-register`, `examiner-voice`). Each axis has
  five descriptor bands (level 1 = unacceptable, level 5 =
  exemplary), a model-judge prompt, and a weight that sums to 1.0
  across the registry. Shipped
  `server/tests/worksheet-eval-rubric.test.ts` asserting the
  registry's invariants (5 axes, unique ids, weights sum to 1.0,
  all bands present, prompts non-empty). The rubric is consumed by
  no other module yet — Sprints 1.C, 1.D, 3.D pick it up later.

## What is in flight

_Nothing._ Sprint 1.A is the first commit on this branch and is
self-contained.

## What is next

**Sprint 1.B — Comparison-corpus fixtures + loader + test.**

- Create `server/tests/worksheet-eval/fixtures/cmp-*.json` — 30
  entries. Distribution: maths 9 / english 6 / science 7 /
  humanities 5 / send 3. All `cmp-`-prefixed ids, all unique, KS
  bands Y2 through Y13 represented, 3 SEND fixtures with
  `sendNeed`. The 3 SEND fixtures route via
  `params.sendNeed = "social-emotional"` rather than `"semh"` to
  dodge the matcher-order bug in `client/src/lib/sendPromptFragments.ts:resolveSendSpec`
  (out of scope for PR-1; flagged in `big-bang-improvements`).
- Create `server/tests/worksheet-eval/comparisonCorpus.ts` —
  loader function `loadComparisonCorpus(): EvalFixture[]`. Pattern
  follows `loadFixtures` at runner.ts:56–80. The loader filters for
  `id.startsWith("cmp-")` so the original 50 fixtures and the new
  30 don't tangle.
- Create `server/tests/worksheet-eval-comparisonCorpus.test.ts` —
  asserts (a) 30 entries loaded, (b) bucket counts match the plan,
  (c) all ids `cmp-`-prefixed, (d) all ids unique, (e) all KS bands
  Y2–Y13 represented, (f) exactly 3 SEND fixtures with `sendNeed`.

After 1.B: 1.C → 1.D → 1.E → 1.F → 3.A → 3.B → 3.C → 3.D, in that
order. See `PHASE-PLAN.md` for full table + dependency graph.

## Checkpoint protocol

After every sub-step:

1. `git status` — confirm only the intended files changed.
2. `git add <files>` — specific paths, never `git add .`.
3. `git commit -m "<scope>: <what changed> (Sprint X.Y)"` —
   conventional-commit style (e.g.
   `eval: ship comparison corpus + loader (Sprint 1.B)`).
4. `github_push_to_remote` to this branch.
5. Update **this file's** "What is done" + "What is next" sections
   in the same or follow-up commit.
6. **Do not** open a PR until at least Sprint 1.A through 1.F land.
   The PR umbrella covers all 10 sub-steps; opening it too early
   means reviewers see half-baked work.

## Notes (transient scratchpad)

### Resolver-order bug

`resolveSendSpec` in `client/src/lib/sendPromptFragments.ts` has an
ordering issue where a matcher consuming `semh` runs before the
SEMH-specific matcher. **Out of scope for PR-1.** Surfaced here
because Sprint 1.B's three SEND fixtures route through
`"social-emotional"` rather than `"semh"` to dodge this. Flagged
for whichever PR finally touches the SEND scope.

### Original narrative — kept for reference

The previous chat described pushing these sub-steps with these
shas:

| Sub-step | Sprint | Claimed sha |
| -------- | ------ | ----------- |
| Branch + scaffolding | scaffold | `efb4547a` |
| 1.A — Rubric         | 1       | `ca034a2e` |
| 1.B — Corpus + loader + test | 1 | `1992cfe`     |
| 1.C — Schema + summariser + axis-floor rule | 1 | `e0e93d4` |
| 1.D — Model-judge rater + classifyWarning   | 1 | `c7097bc` |
| 1.E — Runner integration + human-scores     | 1 | `5f9ae77` |
| 1.F — Baseline + nightly workflow           | 1 | `cfe21bc` |
| 3.A — Two-pass orchestrator                 | 3 | (not captured) |
| 3.B — `stripValidatorPrefix` helper         | 3 | `805a223` |
| 3.C — Per-subject prompt-family test        | 3 | (not captured) |
| 3.D — Wire promptAbFramework                | 3 | (not captured) |

None of these shas exist on `origin`. Twelve heuristic guesses at
the work-branch name (recorded in this folder's git history)
returned "couldn't find remote ref". The narrative is a useful
spec — file paths, line ranges, the verified `callAIMessages`
signature, the SEND fixture routing trick — but the work itself
must be re-implemented from `main`.
