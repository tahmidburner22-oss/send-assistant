# Worksheet eval harness

> Closes audit item #44 (FEAT-PR5). See
> [`.agents/tasks/phase-a-class-aware/features/FEAT-PR5.json`](../.agents/tasks/phase-a-class-aware/features/FEAT-PR5.json)
> for the original spec, and [`.agents/tasks/big-bang-improvements/PHASE-PLAN.md`](../.agents/tasks/big-bang-improvements/PHASE-PLAN.md)
> for how this fits into the wider quality programme.

The eval harness exercises 50 canonical UK National Curriculum / GCSE
prompts through the worksheet generator + post-validator chain and
writes a single `eval-report.json` artefact. It is the regression
baseline that lets us land prompt / model / validator changes
confidently — every PR can run it locally, and CI runs it nightly.

The harness is **not** a PR-blocking gate yet. The blocking gate lands
in **PR-22** once a stable baseline has settled. Today the harness
exists so that:

- Local devs get a fast quality smoke-test before landing a prompt
  change.
- Nightly CI publishes an artefact you can diff against yesterday's.
- PR-13 / PR-14 / PR-20 (mark-scheme + Bloom + per-subject prompts)
  have a regression net the moment they touch the prompt.

## Usage

```bash
# Full run, mock mode (default — free, deterministic, no API keys).
npm run eval:worksheets

# Live mode — calls the production aiGenerateWorksheet. Requires API
# keys in env (the underlying client/src/lib/ai.ts reads from
# localStorage, which the harness shims under Node).
EVAL_MODE=live EVAL_OPENAI_KEY=sk-... npm run eval:worksheets

# Cost-guard demo — abort cleanly when the estimated total exceeds
# the budget. Live mode estimate is ~$0.008 per call.
EVAL_BUDGET_USD=0.01 EVAL_MODE=live npm run eval:worksheets

# CI-friendly: exit 1 on any fixture failure or generation error.
npm run eval:worksheets -- --bail
```

The runner writes `server/tests/worksheet-eval/eval-report.json` and
prints a markdown summary to stdout. When run inside GitHub Actions
the markdown is also appended to `$GITHUB_STEP_SUMMARY` so it's
visible inline on the workflow run page.

## What it tests

For every fixture the harness:

1. Calls the configured generator with the fixture's `params`.
2. Threads the output through `runWorksheetPostValidators` (so the
   eval reflects what an end-user actually sees, including silent
   rewrites and warnings stamped along the way).
3. Scores the post-validated worksheet against the rule names listed
   in the fixture's `rules` array.

## Rule catalogue

Rules live in [`server/tests/worksheet-eval/rules.ts`](../server/tests/worksheet-eval/rules.ts).
Each rule is a pure predicate — adding a new one is a single function.

| Rule                     | Source of truth                                                                                                | Fails when                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `mcq-single-correct`     | `enforceSingleMcqCorrect` (Phase 1 post-validator)                                                             | Multiple ✓ markers / "CORRECT: B" leaks survive             |
| `word-bank-deduped`      | `dedupeWordBank`                                                                                               | A duplicate term remains after the dedupe pass              |
| `no-foreign-diagrams`    | `stripForeignDiagrams`                                                                                         | A diagram from another subject survives the strip pass      |
| `reading-age-in-range`   | `enforceReadingAgeBudget` (PR-2) and `metadata.readingAgeActual` if stamped                                    | The stamped or warned reading age is outside the fixture band |
| `spec-ref-present`       | `enforceSpecAnchorPresence` (Phase 1)                                                                          | Any question ships without a `specRef` after the chain      |
| `send-fidelity-floor`    | `metadata.sendFidelityReport.fidelityRatio` (FEAT-PB6)                                                         | Fidelity ratio < 0.5 (configurable per fixture)             |
| `qa-score-floor`         | `metadata.qaScore.total` (PR-4)                                                                                | Score < 60 (override per-fixture via `qaScoreFloor`)        |

## Adding a fixture

A fixture is a single JSON file in
[`server/tests/worksheet-eval/fixtures/`](../server/tests/worksheet-eval/fixtures/).
The id is the filename minus `.json`.

```jsonc
{
  "id": "english-y10-macbeth",
  "title": "Year 10 English — Macbeth, Act 1 Scene 5",
  "bucket": "english",
  "params": {
    "subject": "English",
    "topic": "Macbeth — Act 1 Scene 5",
    "yearGroup": "Year 10",
    "examBoard": "AQA",
    "difficulty": "medium",
    "includeAnswers": true
  },
  "rules": [
    "mcq-single-correct",
    "word-bank-deduped",
    "spec-ref-present",
    "qa-score-floor",
    "reading-age-in-range"
  ],
  "readingAgeRange": [13, 17],
  "estimatedTokens": 4000
}
```

Mandatory fields: `id`, `title`, `bucket`, `params`, `rules`. Optional:
`readingAgeRange`, `qaScoreFloor`, `estimatedTokens`. `params` matches
a useful subset of `aiGenerateWorksheet`'s parameter object — adding a
new param to the generator does **not** require regenerating fixtures.

## Cost guard

The runner aborts before any generation call if the estimated total
cost exceeds `EVAL_BUDGET_USD` (default $1.00). In mock mode the
estimate is always $0, so the guard is a no-op. In live mode, the
estimate is `fixtures.length × estimatedCostPerCall`, where the
per-call cost defaults to $0.008 (≈ GPT-4o-mini at 4k tokens) and is
overridable via `EVAL_COST_PER_CALL`.

## Reading the report

`eval-report.json` shape (additive — older readers must keep working):

```ts
{
  startedAt: ISO8601,
  totalMs: number,
  evalHarnessVersion: "1.0.0",
  generatorVersion: "mock" | "<git sha>",
  summary: { total, passed, failed, errored, totalCostUsd },
  ruleStats: { [ruleName]: { passed, failed } },
  rows: [
    {
      id, title, bucket,
      passed, failedRules: [{ rule, reason }],
      warnings: string[],
      generationMs, costUsd,
      generationError?: string,
    }
  ]
}
```

The `ruleStats` block makes it cheap to spot a single rule
regressing across the corpus (e.g. `mcq-single-correct` failures
jumping from 0 to 7 between two consecutive nightly runs).

## Architecture

```
server/tests/worksheet-eval/
├── fixtures/                # 50 JSON fixtures (one per case)
├── runner.ts                # iterates fixtures, writes eval-report.json
├── rules.ts                 # pure rule predicates
├── generators.ts            # mock + live generator implementations
├── summariser.ts            # markdown summary for stdout / $GITHUB_STEP_SUMMARY
├── types.ts                 # EvalFixture / EvalReport contracts
└── eval-report.json         # written by the runner (gitignored)
```

The post-validator chain (`runWorksheetPostValidators`) is imported
read-only — the harness never mutates product code.
