# PR-1 — Measurement + Prompt Architecture (Sprints 1 + 3)

> Paste this file's contents (below the line marker) into the
> GitHub PR body when opening / updating PR-1. The PR is **growing
> incrementally** — one commit per Sprint sub-step, all on
> `feat/pr-1-measurement-and-prompt-arch`. Reviewers can either
> wait for the full set or review per-commit.

---

## What this PR does (when complete)

Pairs the eval-harness measurement layer (Sprint 1) with the
prompt-architecture changes that depend on it (Sprint 3). Bundling
lets one eval run validate both at once. Un-bundling would have
left Sprint 3 faith-based.

This is **PR-1 of a four-PR ladder**. See
`.agents/tasks/pr-1-measurement-and-prompt-arch/PHASE-PLAN.md` for
the full ladder and why the seven internal sprints group into four
PRs.

## Sub-step status

Each row is one commit on this branch. The PR is mergeable once
every row is shipped + CI passes.

| Sub-step | Title                                            | Status   |
| -------- | ------------------------------------------------ | -------- |
| 1.A      | Per-axis rubric                                  | ✅ done  |
| 1.B      | Comparison-corpus fixtures + loader + test       | ⬜ next  |
| 1.C      | Schema + summariser per-axis + axis-floor rule   | ⬜       |
| 1.D      | Model-judge rater                                | ⬜       |
| 1.E      | Runner integration + human-scores loader         | ⬜       |
| 1.F      | Baseline + nightly workflow                      | ⬜       |
| 3.A      | Two-pass generator orchestrator                  | ⬜       |
| 3.B      | `stripValidatorPrefix` helper                    | ⬜       |
| 3.C      | Per-subject prompt-family test                   | ⬜       |
| 3.D      | Wire `promptAbFramework` into eval harness       | ⬜       |

The full per-sub-step contract lives in `PHASE-PLAN.md`. Live
status (with commit shas) lives in `SESSION-HANDOFF.md`. Both files
are checked into this branch under
`.agents/tasks/pr-1-measurement-and-prompt-arch/`.

## How to review while in flight

- Each sub-step is one commit with a Conventional Commit message
  ending in `(Sprint X.Y)`. Reviewers can leave per-commit comments.
- The PR is **not ready to merge** until the table above is all ✅.
  A separate "Mergeable" comment will be posted once Sprint 3.D
  lands and CI is green.
- Tests added per sub-step run on PR push — failing CI on any
  sub-step blocks the merge.

## Compatibility / additive contract

- All schema additions are **optional** fields. Older
  `EvalReport.json` files keep parsing.
- The seven built-in rule names are unchanged. The new rule
  (`model-judge-axis-floor`) is registered alongside in 1.C, never
  replaces.
- `EVAL_MODE=mock` works without any rater env. Live rater is
  opt-in via `EVAL_RATER=model-judge` (1.D).
- The two-pass orchestrator is dark-launched (3.A) —
  `PROMPT_TWO_PASS_ENABLED` defaults to off. Existing single-pass
  path is untouched.
- The existing post-validator stack and the seven built-in rules
  remain. The new variant + axis stats are additive in the report.

## How to verify (final state)

```bash
# Mock mode (sandbox / CI default — no API keys needed):
npm test -- worksheet-eval

# Live model-judge rater (requires env keys):
EVAL_MODE=live EVAL_RATER=model-judge \
  EVAL_OPENAI_KEY=sk-... \
  npm run eval:worksheets

# Two-pass orchestrator unit tests (added in 3.A):
npm test -- twoPassWorksheetOrchestrator

# Prompt-families lock (added in 3.C):
npm test -- perSubjectPromptFamilies

# Eval-harness experiment bucketing (added in 3.D):
npm test -- worksheet-eval-experiments
```

The nightly cron writes the markdown report to
`$GITHUB_STEP_SUMMARY` so regressions are visible without
downloading the JSON (1.F).

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
  axis-floor rule fails fixtures; the QA score still uses the
  existing model. Promotion is PR-3.

## Resume / recoverability

This PR's planning lives in
`.agents/tasks/pr-1-measurement-and-prompt-arch/`:

- `RESUME.md` — read-first, the four checkpointing rules.
- `PHASE-PLAN.md` — strategic plan + sprint sequencing.
- `SESSION-HANDOFF.md` — live status, file pin-points, commit
  anchors. **Updated every checkpoint.**
- `PR-DESCRIPTION.md` — this file.

If a chat session loses connection mid-write, the next session
opens that folder and resumes from "What is in flight" / "What is
next" without re-exploring the repo.
