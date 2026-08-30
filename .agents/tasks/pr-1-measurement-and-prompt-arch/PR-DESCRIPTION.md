# PR-1 — Measurement + Prompt Architecture (Sprints 1 + 3)

> Paste this file's contents (below the line marker) into the GitHub
> PR body when opening PR-1. The body is self-contained: a reviewer
> who reads only the PR sees the full plan + the sprint breakdown +
> the verification path.

---

## What this PR does

Pairs the eval-harness measurement layer (Sprint 1) with the prompt-
architecture changes that depend on it (Sprint 3). Bundling lets one
eval run validate both at once. Un-bundling would have left Sprint 3
faith-based.

This is **PR-1 of a four-PR ladder**. See
`.agents/tasks/pr-1-measurement-and-prompt-arch/PHASE-PLAN.md` for
the full ladder and why the seven internal sprints group into four
PRs.

## Sprint 1 — Measurement

| Sub-step | Title | Touches |
| -------- | ----- | ------- |
| 1.A | Per-axis rubric                                | `server/tests/worksheet-eval/rules.ts` |
| 1.B | Comparison-corpus fixtures + loader + test     | `fixtures/cmp-*.json` (30 entries) + new loader |
| 1.C | Schema + summariser per-axis + axis-floor rule | `types.ts`, `rules.ts`, `summariser.ts` |
| 1.D | Model-judge rater                              | `modelJudgeRater.ts` (new) |
| 1.E | Runner integration + human-scores loader      | `runner.ts`, `humanScoresLoader.ts` (new) |
| 1.F | Baseline + nightly workflow                    | `baseline.json`, workflow YAML |

**Sprint 1.B coverage map.** 30 entries: maths 9 / english 6 /
science 7 / humanities 5 / send 3. All `cmp-`-prefixed, all unique
IDs, KS bands Y2 through Y13 represented, 3 SEND fixtures with
`sendNeed`. Distribution matches the plan exactly.

**Sprint 1.D rater contract.** Live rater calls
`callAIMessages(messages, maxTokens?, opts?)` — verified signature
(three positional args, NOT a single options object). Deterministic
warning classification via `classifyWarning` (operator-precedence
tightened so a long warning string can't accidentally match two
buckets). Test pins the rater shape.

**Sprint 1.E runner contract.** Cost guard runs before any rater
call. The `model-judge-axis-floor` rule is added to every
comparison-corpus entry so the new rule is exercised every run.
CSV human-scores loader is opt-in — if the file is absent, the
human-vs-model agreement column simply doesn't render.

**Sprint 1.F baseline contract.** The shipped `baseline.json` is
**structurally valid but empty** — the first nightly run on `main`
populates real numbers. This avoids freezing a baseline taken on a
laptop. The workflow has a separate job that refreshes the baseline
on `push: main`.

## Sprint 3 — Prompt architecture

| Sub-step | Title | Touches |
| -------- | ----- | ------- |
| 3.A | Two-pass generator orchestrator                | `client/src/lib/twoPassWorksheetOrchestrator.ts` (new) |
| 3.B | `stripValidatorPrefix` helper                  | same file (extend) |
| 3.C | Per-subject prompt-family test                 | `server/tests/perSubjectPromptFamilies.test.ts` (new) |
| 3.D | Wire `promptAbFramework` into eval harness     | `types.ts`, `runner.ts`, `summariser.ts` |

**Sprint 3.A two-pass shape.** Pure orchestrator. Three injected
steps: `generate`, `critique`, `revise`. Default-disabled behind
`PROMPT_TWO_PASS_ENABLED`. The existing single-pass path remains
the production default until PR-3 (sprints 4 + 6) flips the flag.
Test pins the order of operations + that an empty critique short-
circuits the revise call.

**Sprint 3.B helper.** `stripValidatorPrefix(warning)` strips
`[Phase PR-NN — <validator>]` prefixes from warnings before the
critique consumes them. Initial test was a wrong-assumption — the
helper strips the prefix, NOT the validator name. Corrected.

**Sprint 3.C prompt-families lock.** Test imports `PROMPT_FAMILIES`
from `client/src/lib/perSubjectPromptFamilies.ts` (#46, shipped via
big-bang PR-19..27 combined branch) and asserts every canonical
subject id has a family entry. Adding a subject without its family
fails CI.

**Sprint 3.D experiment plumbing.** `EvalFixture.experimentVariant?`
+ `EvalReportRow.experimentVariant?` + `EvalReport.variantStats?`.
Runner threads variant through `runFixture`. Summariser renders a
`### By experiment variant` block.

## How to verify

```bash
# Mock mode (sandbox / CI default — no API keys needed):
npm test -- worksheet-eval

# Live model-judge rater (requires env keys):
EVAL_MODE=live EVAL_RATER=model-judge \
  EVAL_OPENAI_KEY=sk-... \
  npm run eval:worksheets

# Two-pass orchestrator unit tests:
npm test -- twoPassWorksheetOrchestrator

# Prompt-families lock:
npm test -- perSubjectPromptFamilies

# Eval-harness experiment bucketing:
npm test -- worksheet-eval-experiments
```

The nightly cron writes the markdown report to
`$GITHUB_STEP_SUMMARY` so regressions are visible without
downloading the JSON.

## Compatibility / additive contract

- All schema additions are **optional** fields. Older
  `EvalReport.json` files keep parsing.
- The seven built-in rule names are unchanged. The new rule
  (`model-judge-axis-floor`) is registered alongside, never
  replaces.
- `EVAL_MODE=mock` works without any rater env. Live rater is
  opt-in via `EVAL_RATER=model-judge`.
- The two-pass orchestrator is dark-launched —
  `PROMPT_TWO_PASS_ENABLED` defaults to off. Existing single-pass
  path is untouched.
- The existing `parseDiffAgainstFlag` + `detectRegressions` (PR-22)
  remain. The new variant + axis stats are additive in the report.

## Out of scope (deliberately, per PHASE-PLAN.md)

- **Sprint 2** — Taxonomy expansion. Separate parallel PR-2,
  Subject-Lead reviewable independently.
- **Sprints 4 + 6** — Examiner-voice cadence + SEND moat. PR-3,
  depends on this PR's measurement layer to prove they worked.
- **Sprints 5 + 7** — Source-driven generation, visual polish,
  live preview, public scorecard. PR-4.
- Flipping `PROMPT_TWO_PASS_ENABLED` to default-on. Lives in PR-3
  once the rater + corpus prove the two-pass path lifts axis
  scores.
- Wiring axis floors into the QA scorecard's deductions. The
  axis-floor rule fails fixtures, but the QA score still uses the
  18-bucket model. Promotion is PR-3.

## Resume / recoverability

This PR's planning lives in
`.agents/tasks/pr-1-measurement-and-prompt-arch/`:

- `PHASE-PLAN.md` — strategic plan + sprint sequencing.
- `SESSION-HANDOFF.md` — live status, file pin-points, commit
  anchors.
- `PR-DESCRIPTION.md` — this file.

If this PR's chat session loses connection mid-write, the next
session opens that folder and resumes from "What is in flight" /
"What is next" without re-exploring the repo.
