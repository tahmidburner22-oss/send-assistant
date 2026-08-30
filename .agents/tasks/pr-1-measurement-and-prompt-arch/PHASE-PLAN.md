# PR-1 — Measurement + Prompt Architecture (Sprints 1 + 3)

> **This is the master plan for PR-1 of the four-PR ladder that
> takes the worksheet generator from "feels right" to "measurably
> better".** The ladder bundles seven internal sprints into four
> review-sized PRs based on review profile (code vs. data vs. UX),
> not sprint number.

## How to read this file

- **PR-1 .. PR-4** = the work units. Each maps to one branch and
  one pull request, sized so a fresh chat can finish it without
  exhausting context.
- **Sprints 1 .. 7** = the underlying internal sprints. The mapping
  to PRs is in the table below; live status of every sprint is in
  [`SESSION-HANDOFF.md`](./SESSION-HANDOFF.md).
- This folder co-exists with `.agents/tasks/big-bang-improvements/`.
  The "PR-1" here is **distinct from the big-bang PR-1** (which is
  audit item #28, shipped as PR #85). Disambiguate by folder.

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
    WorksheetRenderer.tsx (7,000+) in full from a fresh chat. grep
    for named exports first; read narrow ranges only.
  - All extensions to existing eval-harness files MUST be additive.
    Older fixtures + reports must keep parsing.
  - Push to remote after every meaningful chunk (one sprint sub-step).
Goal: complete the next un-shipped sprint sub-step in
      SESSION-HANDOFF.md's "What is next" section, update the
      handoff, push.
```

## Why this exists

The big-bang ledger shipped 28 PRs of pure additions. The eval
harness (PR-5 / FEAT-PR5) shipped in PR #89 with seven rules over
post-validator output. That gives us a regression gate. It does
NOT yet give us a **quality signal** — the rules check that
warnings weren't raised, but they don't grade the worksheet's
actual content on the axes a teacher cares about (curriculum
fidelity, command-word discipline, scaffolding, SEND register,
examiner voice).

A May 2026 review of the eval reports identified seven internal
sprints needed to close the loop:

1. **Sprint 1 — Measurement.** Per-axis rubric, comparison corpus,
   model-judge rater, baseline + nightly workflow.
2. **Sprint 2 — Taxonomy expansion.** Hand-author the next 200
   spec-anchored fixtures.
3. **Sprint 3 — Prompt architecture.** Two-pass generate-then-
   critique, per-subject prompt families, A/B framework wired into
   the eval runner.
4. **Sprint 4 — Examiner-voice cadence.** Tighten the prompt's
   command-word + mark-economy discipline.
5. **Sprint 5 — Source-driven generation + visual polish.** Pull
   spec-point text and exemplars from a frozen corpus rather than
   re-deriving from the topic name; live preview in the editor.
6. **Sprint 6 — SEND moat.** Lock the SEND fidelity floor at the
   per-profile level + add the missing trauma-informed register
   variant.
7. **Sprint 7 — Public scorecard.** Surface the eval-report
   markdown on a public status page so partners can see the
   trend.

## PR ladder

| PR     | Sprints   | Why bundled                                                                                                                       | Parallelisable with |
| ------ | --------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| PR-1   | 1 + 3     | Biggest-effect pair. Measuring without fixing wastes a cycle; fixing without measuring is faith-based. One eval run validates both. | PR-2                |
| PR-2   | 2         | Pure data entry. Subject-Lead-reviewable, isolated review surface. Lands in parallel with PR-1.                                   | PR-1                |
| PR-3   | 4 + 6     | Examiner-voice cadence + SEND moat both depend on PR-1's measurement to prove they worked. One eval run validates both.           | After PR-1 lands    |
| PR-4   | 5 + 7     | UX + distribution layer (source-driven gen, visual polish, live preview, public scorecard). Needs PR-1's measurement as the scorecard's source. | After PR-1, PR-3   |

## PR-1 internal sequencing (Sprints 1 + 3)

Within PR-1, work proceeds in alphabetised sub-steps so each is
one checkpoint-able commit. **Push after every sub-step.**

### Sprint 1 — Measurement

| Sub-step | Title                                            | Touches                                                      |
| -------- | ------------------------------------------------ | ------------------------------------------------------------ |
| 1.A      | Per-axis rubric                                  | `server/tests/worksheet-eval/rubric.ts` (new)                |
| 1.B      | Comparison-corpus fixtures + loader              | `server/tests/worksheet-eval/fixtures/cmp-*.json` (new)      |
| 1.C      | Schema extension + summariser per-axis + axis-floor rule | `types.ts`, `rules.ts`, `summariser.ts`              |
| 1.D      | Model-judge rater                                | `server/tests/worksheet-eval/modelJudgeRater.ts` (new)       |
| 1.E      | Runner integration                               | `server/tests/worksheet-eval/runner.ts` (extend)             |
| 1.F      | Baseline + nightly workflow                      | `server/tests/worksheet-eval/baseline.json` + workflow YAML  |

### Sprint 3 — Prompt architecture

| Sub-step | Title                                            | Touches                                                      |
| -------- | ------------------------------------------------ | ------------------------------------------------------------ |
| 3.A      | Two-pass generator orchestrator                  | `client/src/lib/twoPassWorksheetOrchestrator.ts` (new)       |
| 3.B      | `stripValidatorPrefix` helper                    | `client/src/lib/twoPassWorksheetOrchestrator.ts` (extend)    |
| 3.C      | Per-subject prompt-family test                   | `server/tests/perSubjectPromptFamilies.test.ts` (new)        |
| 3.D      | Wire `promptAbFramework` into eval harness       | `types.ts`, `runner.ts`, `summariser.ts` (extend)            |

### Why this order

- 1.A → 1.B: rubric must exist before fixtures can reference its
  axes.
- 1.B → 1.C: corpus must load before the schema can encode
  per-fixture human scores.
- 1.C → 1.D: schema must accept rater output before the rater can
  stamp into it.
- 1.D → 1.E: rater must be callable before the runner can invoke
  it.
- 1.E → 1.F: runner must produce reports before a baseline can be
  frozen.
- 3.A → 3.B: orchestrator must exist before the prefix-stripper
  has a caller.
- 3.C is independent — can be authored any time after 3.A.
- 3.D depends on 1.E (runner) and the existing
  `client/src/lib/promptAbFramework.ts` (#45, shipped via the
  big-bang PR-19..27 combined branch).

## Out-of-scope guardrails (every sub-step)

- Do not regress the existing eval-harness contract — `EvalReport`
  fields must remain readable by older runners.
- Do not change the seven built-in rule names (`mcq-single-correct`,
  `word-bank-deduped`, `no-foreign-diagrams`,
  `reading-age-in-range`, `spec-ref-present`, `send-fidelity-floor`,
  `qa-score-floor`). New rules are additive.
- Comparison-corpus fixtures use the `cmp-` id prefix so they
  don't collide with the original 50 fixtures.
- The model-judge rater is opt-in — `EVAL_MODE=mock` must keep
  working without any rater env. Live rater requires
  `EVAL_RATER=model-judge` plus a model-provider env.
- The two-pass orchestrator is **dark-launched** — it ships behind
  `PROMPT_TWO_PASS_ENABLED` and the existing single-pass path
  remains the default until PR-3 (sprints 4 + 6) flips the flag.
- Sandbox is INTEGRATIONS_ONLY — never run `npm install`.
  Type-check + tests run in CI on PR push.
- Pure functions only in `client/src/lib/`; side-effecting code
  (network, FS) lives in `server/` or in scripts.

## Files expected to change in this phase

```
server/tests/worksheet-eval/types.ts                           (extend)
server/tests/worksheet-eval/rules.ts                           (extend — +1 rule)
server/tests/worksheet-eval/runner.ts                          (extend)
server/tests/worksheet-eval/summariser.ts                      (extend)
server/tests/worksheet-eval/rubric.ts                          (new — Sprint 1.A)
server/tests/worksheet-eval/comparisonCorpus.ts                (new — Sprint 1.B)
server/tests/worksheet-eval/modelJudgeRater.ts                 (new — Sprint 1.D)
server/tests/worksheet-eval/humanScoresLoader.ts               (new — Sprint 1.E)
server/tests/worksheet-eval/fixtures/cmp-*.json                (new — 30 entries, 1.B)
server/tests/worksheet-eval/fixtures/comparison-corpus-human-scores.csv (new — 1.E)
server/tests/worksheet-eval/baseline.json                      (new — 1.F)
client/src/lib/twoPassWorksheetOrchestrator.ts                 (new — 3.A + 3.B)
server/tests/worksheet-eval-rubric.test.ts                     (new — 1.A)
server/tests/worksheet-eval-comparisonCorpus.test.ts           (new — 1.B)
server/tests/worksheet-eval-rules-axis-floor.test.ts           (new — 1.C)
server/tests/worksheet-eval-summariser.test.ts                 (new — 1.C)
server/tests/worksheet-eval-rater.test.ts                      (new — 1.D)
server/tests/worksheet-eval-runner-human-scores.test.ts        (new — 1.E)
server/tests/worksheet-eval-experiments.test.ts                (new — 3.D)
server/tests/twoPassWorksheetOrchestrator.test.ts              (new — 3.A)
server/tests/perSubjectPromptFamilies.test.ts                  (new — 3.C)
.github/workflows/worksheet-eval.yml                           (extend — baseline refresh job, 1.F)
.agents/tasks/pr-1-measurement-and-prompt-arch/                (this folder)
```

## Definition-of-done (PR-1)

- [ ] CI passes (`npm test` + `tsc --noEmit`).
- [ ] All six Sprint 1 sub-steps shipped + all four Sprint 3
      sub-steps shipped.
- [ ] `SESSION-HANDOFF.md` "What is done" lists every sub-step
      with its commit sha; "What is in flight" is empty; "What is
      next" points at PR-3 (next dependent PR — PR-2 lands in
      parallel).
- [ ] PR description references this folder by path so a reviewer
      who reads the PR sees the wider plan.
- [ ] Baseline file is structurally valid (older runners can parse
      it); first nightly run on `main` populates real numbers.
- [ ] No more than one PR open against this branch at a time.

## Conventions inherited from big-bang + phase-e

- **Single source of truth.** Rubric lives in one file
  (`rubric.ts`); the rater and the summariser both import from
  it.
- **Schema / rule / summariser alignment.** New axis → schema in
  `types.ts` + rule in `rules.ts` + render in `summariser.ts` in
  lockstep, in the same sub-step.
- **Idempotent / pure validators.** Running the rater twice
  yields the same axis scores.
- **Conservative.** When in doubt, the rater warns (it doesn't
  rewrite the worksheet — that's the orchestrator's job).
- **Push, don't accumulate.** After every sub-step, push to
  remote. Never hold > one logical chunk locally (rule #1 of
  phase-e RESUME).
