# Big-Bang 7-Sprint Plan — Session Handoff

> **Always update this file at the end of every checkpoint** so the
> next chat can pick up cleanly. Edit "What is done" / "What is in
> flight" / "What is next" in the same commit as the work it describes.
> Push to remote in the same step.

Last updated: 2026-05-25 — **PR-1 in flight, Sprint 1.A + 1.B + 1.C
shipped.** Branch `big-bang-7/pr-1-measure-and-prompt-arch`. Sprint
1.C extended `EvalReport` schema additively with `AxisScores` (6
axes from rubric, null = n/a), `HumanScoreEntry`, `AxisScoresAggregate`,
plus per-row `modelJudgeScores` / `humanScores` / `corpus` tags and
report-level `modelJudgeProvider` / `modelJudgeAggregate` /
`humanScoresPath` / `humanScoresAggregate` / `comparisonCorpus`
metadata. New `model-judge-axis-floor` rule (default floor 3, per-axis
override via `fixture.modelJudgeAxisFloor`, floor=0 disables).
Summariser renders a "Per-axis (model-judge)" + "Per-axis (human,
median)" markdown block when present. 17-test lock at
`server/tests/evalRubricExtensions.test.ts`. Next chunk: Sprint 1.D —
`modelJudgeRater.ts` cross-provider judge.

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

- **Phase scaffolding** (commit `8828ad2`). Created the phase folder
  with `RESUME.md`, `PHASE-PLAN.md`, this handoff file. Branch
  `big-bang-7/pr-1-measure-and-prompt-arch` cut from `main` and
  pushed.

- **PR-1 / Sprint 1.A — Teacher-rater rubric.** Wrote
  `docs/teacher-rater-rubric.md`: 6 axes × 5 anchors each
  (curriculum fidelity, stem authenticity, accessibility, marks &
  answers tightness, SEND alignment, UX & printability). Includes
  CSV format for batch human ratings (`humanScores.csv` with
  fixtureId / raterId / per-axis cells / notes), and the calibration
  contract (model-judge vs human, target ≤0.5 mean abs deviation per
  axis, drift ≥1.0 triggers judge-prompt recalibration). Hand-offable
  to any practising UK classroom teacher; ~7-minute rate-time budget.

- **PR-1 / Sprint 1.B — Comparison corpus.** Three new files:
  - `server/tests/worksheet-eval/comparison-corpus.json` — 30 fixed
    fixtures with `cmp-` prefixed ids. Distribution: 4 KS1/KS2
    (Y2 maths, Y4 English, Y5 science, Y6 RE) + 8 KS3 (Y7+Y9 maths,
    Y7+Y8 English, Y8+Y9 science, Y8 geography, Y9 history) + 12
    GCSE (AQA maths Y10F + Y10H + Y11H, Edexcel maths Y10H, OCR
    maths Y10H, AQA bio Y10, AQA chem Y11, AQA phys Y10, AQA Eng
    Lit Y10 Macbeth, AQA Eng Lang Y11 P2 Q5, AQA geography Y11
    tectonics, AQA history Y10 Cold War) + 3 A-Level (AQA maths
    Y12, AQA biology Y13, AQA Eng Lit Y12) + 3 SEND (dyslexia Y8
    maths, ADHD Y10 English, ASC sensory Y8 science). Per-bucket
    counts: maths 9 · english 6 · science 7 · humanities 5 · send 3.
  - `server/tests/worksheet-eval/comparisonCorpus.ts` — loader
    (`loadComparisonCorpus`, `bucketCounts`, `tagFixtures`,
    `COMPARISON_CORPUS_VERSION = "1.0.0"`,
    `COMPARISON_CORPUS_EXPECTED_SIZE = 30`). Loader validates id
    prefix, uniqueness, bucket whitelist, required params, exact
    size, and throws on any deviation so a hand-edit can't silently
    shift the benchmark.
  - `server/tests/comparisonCorpus.test.ts` — 9 vitest cases
    locking corpus size, prefix + uniqueness, rule-name validity
    (against `ALL_RULE_NAMES`), bucket distribution, key-stage
    coverage (KS1/KS2 + KS3 + GCSE + A-Level + SEND), SEND
    `send-fidelity-floor` rule presence, exam-board + spec-rule
    presence on GCSE/A-Level fixtures, readingAgeRange monotonic +
    plausible (5–20, span ≤5 years), and version semver shape.
    Helper test asserts `bucketCounts` sums to corpus length and
    `tagFixtures` is non-mutating.

- **PR-1 / Sprint 1.C — Eval-report schema additive extension +
  axis-floor rule + per-axis summariser.** Five files touched:
  - `server/tests/worksheet-eval/types.ts` — additive only.
    Added: `AxisScores` (6 axes, `null` = n/a), `HumanScoreEntry`
    (raterId + axes + optional notes), `AxisScoresAggregate`
    (per-axis `{ mean, min, max, count }`), `AxisAggregate`,
    frozen `AXIS_KEYS` array (single source of truth for axis
    iteration order — matches the rubric document), derived
    `AxisKey` type. `EvalFixture` gained
    `modelJudgeAxisFloor?: Partial<Record<AxisKey, number>>`.
    `EvalReportRow` gained `corpus?: "fixtures" | "comparison"`,
    `modelJudgeScores?: AxisScores`,
    `modelJudgeRationale?: string` (truncated ~500 chars),
    `humanScores?: HumanScoreEntry[]`. `EvalReport` gained
    `modelJudgeProvider`, `modelJudgeModel`, `modelJudgeAggregate`,
    `humanScoresPath`, `humanScoresAggregate`, `comparisonCorpus
    { version, size }`. Older runners that don't read these fields
    keep working — every addition is `?` optional.
  - `server/tests/worksheet-eval/rules.ts` — added
    `model-judge-axis-floor` rule. Reads
    `metadata.modelJudgeScores`; passes when not present (no judge
    ran). Default floor 3 ("usable with edit"); per-fixture override
    via `fixture.modelJudgeAxisFloor[axis]`; floor 0 disables an
    axis check. `null` axis values treated as n/a (skipped, never
    counted as 0). Multi-axis failures are aggregated into one
    reason string for compact reporting.
  - `server/tests/worksheet-eval/summariser.ts` — three new pure
    helpers: `aggregateAxisScores(blocks)` (mean to 2dp, min, max,
    count; non-mutating; null-safe), `medianHumanScores(entries)`
    (per-axis median across raters; outlier-resistant via median
    over mean), and the private `renderAxisBlock`. The markdown
    summary now renders "Per-axis (model-judge)" and "Per-axis
    (human, median)" tables when those aggregates are present;
    legacy reports without them produce identical markdown to
    before. Header gains one-line provider + corpus + human-scores
    annotations when those fields are present.
  - `server/tests/evalRubricExtensions.test.ts` (new) — 17 vitest
    cases across 4 describe blocks: 8 for the new rule
    (registered, no-op when judge absent, default-floor pass,
    default-floor fail, per-axis override relax, override tighten,
    floor=0 disables, null=n/a, multi-axis aggregation), 4 for
    `aggregateAxisScores` (empty, null/undefined safe, correct
    mean+min+max+count, 2dp rounding, non-mutating), 4 for
    `medianHumanScores` (empty, single-rater pass-through, odd-count
    median, even-count midpoint, all-null axis stays null), 1 for
    `AXIS_KEYS` ordering matching the rubric document.

## What is in flight

_Nothing in flight; ready to start Sprint 1.B._

## What is next

**PR-1 / Sprint 1.D — Model-judge rater (cross-provider).** Branch
`big-bang-7/pr-1-measure-and-prompt-arch` (already on it).

New file `server/tests/worksheet-eval/modelJudgeRater.ts`:

```ts
export interface Rater {
  name: string;
  provider: string;
  model: string;
  estimatedCostUsd: number;
  rate(worksheet: PostValidatorWorksheet, fixture: EvalFixture):
    Promise<{ scores: AxisScores; rationale: string }>;
}

export const stubRater: Rater = { ... };  // deterministic, $0
export const liveRater: Rater = { ... };  // hits judge provider
export function pickRater(): Rater { ... } // EVAL_JUDGE_PROVIDER
```

Key constraints:
- Stub returns deterministic scores derived from the worksheet's
  `qaScore.total` (so CI without keys is meaningful: high
  qaScore = high axis means; low = low). NOT random — must be
  reproducible across runs given the same input.
- Live mode requires `EVAL_JUDGE_PROVIDER !== EVAL_GENERATOR_PROVIDER`
  (cross-provider isolation); mismatch yields a runtime warning
  but doesn't abort.
- Prompt embeds the rubric anchors from
  `docs/teacher-rater-rubric.md` so the judge rates against the
  same contract as humans.
- Returns shape `{ scores, rationale }`; rationale truncated to
  500 chars before stamping on the row.

After Sprint 1.D → Sprint 1.E (runner integration: invoke rater
per row, stamp scores onto `metadata.modelJudgeScores`, populate
`modelJudgeAggregate` on the report, plus comparison-corpus loader
wiring).

## Per-PR tracking (live state for the current PR)

### PR-1 — `big-bang-7/pr-1-measure-and-prompt-arch`

Status: **in flight, 3/13 deliverables shipped**.

Sprint 1 deliverables (from PHASE-PLAN.md):

- [x] `docs/teacher-rater-rubric.md` (6-axis × 1–5 with anchors)
- [x] `server/tests/worksheet-eval/comparison-corpus.json` (30 triples) + loader + tests
- [x] `EvalReport` schema extended with `humanScores` + `modelJudgeScores` + `model-judge-axis-floor` rule + per-axis summariser
- [ ] `server/tests/worksheet-eval/modelJudgeRater.ts` (cross-provider judge)
- [ ] runner wires rater + corpus into the run; populates `modelJudgeAggregate`
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
