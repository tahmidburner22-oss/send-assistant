# Big-Bang 7-Sprint Plan — Session Handoff

> **Always update this file at the end of every checkpoint** so the
> next chat can pick up cleanly. Edit "What is done" / "What is in
> flight" / "What is next" in the same commit as the work it describes.
> Push to remote in the same step.

Last updated: 2026-05-25 — **Scaffolding only.** Phase folder created
with `RESUME.md`, `PHASE-PLAN.md`, this file. No code yet. Next
chunk: open branch `big-bang-7/pr-1-measure-and-prompt-arch` from
main, then begin PR-1 / Sprint 1 deliverables in order.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Big-bang 7-sprint plan, 4 PRs.
Resume:  .agents/tasks/big-bang-7-sprints/SESSION-HANDOFF.md
Plan:    .agents/tasks/big-bang-7-sprints/PHASE-PLAN.md
Constraints:
  - Sandbox is INTEGRATIONS_ONLY. No npm install. Tests + tsc
    run in CI on PR push.
  - Do NOT read ai.ts (5,448 lines), worksheetPostValidator.ts
    (2,233 lines), Worksheets.tsx, or WorksheetRenderer.tsx in
    full. Line ranges are pinned in this file (below).
  - Schema additions: optional fields only.
  - Bank edits: append-only.
  - All new validators pure + idempotent.
  - Push to remote after every meaningful chunk.
Goal: complete the next un-shipped item in "What is next" below.
```

## File pin-points (so the next chat doesn't re-explore)

| File                                                                   | Line range / API                                                       | Why                                                                                  |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `client/src/lib/ai.ts` §GENERATE marker                                | L1002–L4170 (3,167 lines, the worksheet generator)                      | Sprint 3 wraps it; do NOT read in full.                                              |
| `client/src/lib/ai.ts` `aiGenerateWorksheet` signature                 | L1003 (`export async function aiGenerateWorksheet(params: { … })`)      | Sprint 3 two-pass orchestrator delegates to it under flag.                           |
| `client/src/lib/ai.ts` `aiGenerateWorksheetFromClassBrief`             | L4192 (returns same shape, ~50-line wrapper)                            | Sprint 5 `aiGenerateWorksheetFromSource` slots in next to it.                        |
| `client/src/lib/ai.ts` `callAI` + `callAIMessages`                     | L591 + L649                                                             | Sprint 5 vision-mode wiring extends these.                                           |
| `client/src/lib/worksheetPostValidator.ts` `runWorksheetPostValidators` | grep `runWorksheetPostValidators` — uses registry from PR-8             | Sprint 3 retry loop fires from this tail. Do NOT read file in full.                  |
| `client/src/lib/worksheetPostValidator.ts` validator chain registry    | imported from `worksheetPostValidatorRegistry.ts` (PR-8 of big-bang)    | Sprint 4 examiner-voice pass registers via the same `adapt()` pattern.               |
| `client/src/lib/promptAbFramework.ts`                                  | 111 lines, exports `pickVariant`, `resolveExperiment`, `validateExperiment` | Sprint 3 wires into eval harness; module is bench-ready, not yet on hot path.    |
| `client/src/lib/selfConsistencySampler.ts`                             | 130 lines, exports `shouldSelfSample`, `recommendedSampleCount`, `reconcileSelfConsistency` | Sprint 3 wires onto Section 3 hot path; bench-ready.                  |
| `client/src/lib/perSubjectPromptFamilies.ts`                           | 125 lines, exports `PROMPT_FAMILIES`, `lookupPromptFamily`, `renderPromptFamily` | Sprint 3 audit asserts maths-only loads for maths topic; bench-ready.        |
| `client/src/lib/specPointTaxonomy.ts`                                  | 215 lines, dataset registration via `taxonomyKey()` (L116) + `getSpecPoints` (L134) | Sprint 2 adds new datasets behind this surface — no signature changes.   |
| `client/src/lib/class-pack.ts`                                         | `runClassPack` at L139, `buildClassPackHtml` at L401, `openClassPackWindow` at L480 | Sprint 6 extends `runClassPack` to accept tier-set (core/supported/extension). |
| `client/src/lib/ehcp-enhancements.ts`                                  | EHCP-draft helpers (NOT worksheet-gen — separate concern)               | Sprint 6 builds a NEW `aiWorksheetEhcpBridge.ts` that adapts EHCP outcomes → generator instructions. Don't repurpose this module wholesale. |
| `client/src/lib/pupil-context.ts`                                      | `buildPupilContext(child)` at L33                                       | Sprint 6 bridge consumes this output as the "first-class input" pathway.             |
| `client/src/lib/sendPromptFragments.ts`                                | 1,217 lines — resolver-order bug noted in big-bang PR-1 notes           | Sprint 6 adds SM + DLD entries; do NOT touch the SEMH resolver-order bug here.       |
| `client/src/lib/sendFidelityAudit.ts`                                  | 958 lines, `applySendFidelityAudit` is the entry point                  | Sprint 6 SM + DLD profiles add to PROBES table.                                      |
| `client/src/lib/pastPaperFingerprint.ts`                               | 166 lines                                                               | Sprint 4 extends with `enforceCadenceDrift` (mirror of existing too-close detector). |
| `client/src/lib/wcagAuditor.ts`                                        | 332 lines                                                               | Sprint 6 extends with alt-text quality check (currently compliance-only).            |
| `server/tests/worksheet-eval/runner.ts`                                | 230 lines, `main()` orchestrates the run                                | Sprint 1 extends to invoke model-judge + write per-axis breakdown.                   |
| `server/tests/worksheet-eval/types.ts`                                 | 100 lines, `EvalReport` interface — additive extension                  | Sprint 1 adds `humanScores`, `modelJudgeScores` fields.                              |
| `server/tests/worksheet-eval/rules.ts`                                 | `RULE_REGISTRY` is open-set                                             | Sprint 1 adds `model-judge-axis-floor` rule (per-axis threshold).                    |
| `server/tests/worksheet-eval/generators.ts`                            | 200 lines, mock + live generators                                       | Sprint 1 model-judge uses a SECOND generator (judge model) — see Sprint 1 note below. |
| `server/tests/worksheet-eval/fixtures/`                                | 50 fixtures (10 maths/english/science/humanities/send)                  | Sprint 1 adds 30-fixture comparison-corpus alongside (different selection).          |
| `.github/workflows/worksheet-eval.yml`                                 | nightly cron + workflow_dispatch                                        | Sprint 1 extends to run model-judge when `EVAL_JUDGE_*` keys are set.                |

## What is done

- **Phase scaffolding** (this commit). Created the phase folder with
  `RESUME.md`, `PHASE-PLAN.md`, this handoff file. No code yet.

## What is in flight

_Nothing. Awaiting kick-off of PR-1 / Sprint 1._

## What is next

**PR-1 / Sprint 1 — Measurement foundation.** Branch:
`big-bang-7/pr-1-measure-and-prompt-arch`. Cut from latest `main`.

Order of chunks (each is one commit + push):

1. **Cut branch + bootstrap commit.** Create `big-bang-7/pr-1-measure-and-prompt-arch` from main. First commit is just the phase scaffolding (this folder). Push.
2. **Sprint 1.A — rubric document.** Write `docs/teacher-rater-rubric.md`: 6 axes × 5 levels with anchor examples. Axes: (1) curriculum fidelity, (2) stem authenticity, (3) accessibility, (4) marks/answers tightness, (5) SEND alignment, (6) UX/printability. Commit + push.
3. **Sprint 1.B — comparison corpus.** Write `server/tests/worksheet-eval/comparison-corpus.json` — 30 fixed (subject, year, topic) triples spanning KS1/KS2 (4), KS3 (8), GCSE (12), A-Level (3), SEND-flagged (3). Plus a manifest entry in `server/tests/worksheet-eval/fixtures/_corpus-manifest.json` (or similar) so the runner picks them up. Commit + push.
4. **Sprint 1.C — eval-report schema extension.** Extend `EvalReport` and `EvalReportRow` in `types.ts` with `humanScores?: AxisScores` and `modelJudgeScores?: AxisScores`. Update `summariser.ts` markdown to render per-axis when present. Commit + push.
5. **Sprint 1.D — model-judge harness.** New file `server/tests/worksheet-eval/modelJudgeRater.ts` exporting `rateWithModelJudge(worksheet, fixture, judgeProvider): Promise<AxisScores>`. Loads `EVAL_JUDGE_PROVIDER` env (different from generator provider) + `EVAL_JUDGE_MODEL`. Mock implementation returns deterministic stub scores when no key (so CI without keys is meaningful). Commit + push.
6. **Sprint 1.E — runner wiring.** `runner.ts` calls `rateWithModelJudge` per fixture, stores into `row.modelJudgeScores`. `rules.ts` adds `model-judge-axis-floor` rule (configurable per-axis floor in fixture). Commit + push.
7. **Sprint 1.F — baseline + nightly CI.** Run the harness once; commit `eval-report.baseline.json`. Extend `.github/workflows/worksheet-eval.yml` to set `EVAL_DIFF_AGAINST=eval-report.baseline.json` so PRs see deltas. Commit + push.

After Sprint 1.F lands, switch to **Sprint 3** chunks (still inside PR-1 — same branch). See PHASE-PLAN.md PR-1 row for the Sprint 3 deliverables list.

When all Sprint 1 + Sprint 3 deliverables are checked off in PHASE-PLAN.md and `npm test` + `tsc --noEmit` + `npm run eval:worksheets` are all green, run the verification gate, then open PR-1.

## Per-PR tracking (live state for the current PR)

### PR-1 — `big-bang-7/pr-1-measure-and-prompt-arch`

Status: **not started**.

Sprint 1 deliverables (from PHASE-PLAN.md):

- [ ] `docs/teacher-rater-rubric.md` (6-axis × 1–5 with anchors)
- [ ] `server/tests/worksheet-eval/comparison-corpus.json` (30 triples)
- [ ] `EvalReport` schema extended with `humanScores` + `modelJudgeScores`
- [ ] `server/tests/worksheet-eval/modelJudgeRater.ts` (cross-provider judge)
- [ ] `summariser.ts` per-axis breakdown
- [ ] `rules.ts` `model-judge-axis-floor` rule
- [ ] `eval-report.baseline.json` checked in
- [ ] `.github/workflows/worksheet-eval.yml` invokes model-judge when keys set

Sprint 3 deliverables (from PHASE-PLAN.md):

- [ ] `client/src/lib/aiGenerateWorksheetTwoPass.ts` (orchestrator)
- [ ] `client/src/lib/validatorFeedbackRetry.ts` (retry loop)
- [ ] `client/src/lib/__tests__/perSubjectPromptFamilies.test.ts`
- [ ] `promptAbFramework` wired into eval harness (`runner.ts` + `generators.ts`)
- [ ] `selfConsistencySampler` wired onto Section 3 hot path

### PR-2 — `big-bang-7/pr-2-taxonomy-expansion`

Status: not started. See PHASE-PLAN.md PR-2 deliverables.

### PR-3 — `big-bang-7/pr-3-cadence-and-send-moat`

Status: not started. See PHASE-PLAN.md PR-3 deliverables.

### PR-4 — `big-bang-7/pr-4-source-and-scorecard`

Status: not started. See PHASE-PLAN.md PR-4 deliverables.

## Definition of done (each PR)

- [ ] CI passes (`npm test` + `tsc --noEmit` + `npm run eval:worksheets` if affected).
- [ ] Every checkbox in the PR's deliverables table in `PHASE-PLAN.md` is checked.
- [ ] This `SESSION-HANDOFF.md` updated — PR row flipped to "shipped (PR #NNN)" and "What is next" advanced.
- [ ] PR description references this folder by path so a reviewer sees the wider context.
- [ ] Branch is pushed; PR is open against `main`.

## Checkpoint protocol (mirrors phase-e)

After every chunk:

1. `git status` to confirm only intended files changed.
2. `git add <files>` (specific paths, never `git add .`).
3. `git commit -m "<scope>: <what changed>"` conventional-commit style.
4. `github_push_to_remote` to the current PR's branch.
5. Update this file's "What is done" + "What is next" sections in the same commit (or a follow-up if the chunk's diff is already large).

## Notes (transient scratchpad)

### Sprint 1 design — model-judge as second generator

The eval harness already has a `Generator` abstraction in
`generators.ts` with `mockGenerator` and `liveGenerator`. The
model-judge is naturally a **second generator slot** — same
abstraction, different responsibility (it consumes a worksheet and
emits axis scores instead of producing a worksheet from params).

To avoid the mental confusion of "two generators that aren't both
generators," the implementation uses a separate `Rater` interface in
`modelJudgeRater.ts`:

```ts
export interface Rater {
  name: string;
  estimatedCostUsd: number;
  rate(worksheet: PostValidatorWorksheet, fixture: EvalFixture): Promise<AxisScores>;
}
```

`runner.ts` picks both — `pickGenerator()` for fixture → worksheet,
`pickRater()` for worksheet → axis scores. Cost guard sums both.

Provider isolation: the rater MUST use a different provider than the
generator (per the user's spec — "Claude judging GPT output"). This is
enforced by checking `EVAL_JUDGE_PROVIDER !== EVAL_GENERATOR_PROVIDER`
at runtime; mismatch yields a runner warning but doesn't abort
(useful for local debugging).

### Sprint 3 design — two-pass generator as orchestrator, not rewrite

The current `aiGenerateWorksheet` is 3,167 lines. Inverting it
in-place would be a multi-thousand-line diff with a high regression
surface. Instead, Sprint 3 adds a **new orchestrator**
`aiGenerateWorksheetTwoPass.ts` that:

1. Calls a small skeleton-generation prompt (~1.5k tokens) returning
   `{ sections: [{ id, type, marks, specRef }] }`.
2. Calls existing prompts in parallel for each section (one fill call
   per section, scoped to ~500 tokens).
3. Reuses the entire post-validator chain unchanged.
4. Stamps `metadata.generatorVersion = "two-pass-1.0.0"` so eval and
   telemetry can see the path.

Wiring: `aiGenerateWorksheet` becomes a router. When
`WORKSHEET_TWO_PASS_ENABLED=1` (or the per-tenant flag from PR-22 of
big-bang-improvements is on), it delegates to the two-pass
orchestrator. Otherwise it runs the legacy path. The eval harness
runs both paths to prove no regression before flipping the default.

### Sprint 6 design — EHCP bridge is a NEW module

`ehcp-enhancements.ts` is for EHCP-document drafting (provision text,
golden-thread, tribunal scoring) — not worksheet generation. Sprint
6's "promote to first-class input" therefore means a new bridge
module `aiWorksheetEhcpBridge.ts` that adapts EHCP outcomes (text
strings) → generator-side instructions (additionalInstructions,
sendNeed, readingAge). The bridge is the integration point;
`ehcp-enhancements.ts` itself stays untouched.

### Context-limit recovery

If this chat hits a context limit mid-flight:

1. The next chat reads `RESUME.md` first, then this file.
2. The "What is in flight" section lists the exact file + line where
   work paused, plus what the next sub-step is.
3. The current PR's checklist in "Per-PR tracking" shows which boxes
   are ticked.
4. The chat resumes from the next un-ticked box; no re-exploration.

The file pin-points table above is the contract that makes
re-exploration unnecessary. Add a row whenever you discover a new
location worth pinning.
