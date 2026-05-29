# Lane 2 — USP Polish — Session Handoff

This file is the **resume point** for any fresh chat picking up
follow-up work on the USP-polish lane. Read this first, then
`PHASE-PLAN.md`, then `LEDGER.md`.

Last updated: 2026-05-29 — **all 8 Lane 2 items shipped** on
`feat/lane-2-usp-polish`. PR #145.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Worksheet-generator pre-pilot programme.
         Lane 1 (eight surgical pre-pilot fixes) shipped as PR #144.
         Lane 2 (USP polish) — all 8 items shipped as PR #145.
         Next work is Lane 3 (roadmap polish).
Resume:  .agents/tasks/lane-2-usp-polish/SESSION-HANDOFF.md
Plan:    .agents/tasks/lane-2-usp-polish/PHASE-PLAN.md
Ledger:  .agents/tasks/lane-2-usp-polish/LEDGER.md
Lane 3:  .agents/tasks/lane-1-pre-pilot-fixes/SESSION-HANDOFF.md
         (Lane 3 section)
Branch:  feat/lane-2-usp-polish (off feat/lane-1-pre-pilot-fixes —
         rebase onto main once both PRs land)
Audit:   docs/worksheet-generator-audit.md
         docs/primary-worksheet-improvement-plan.md
         (intended output)
Constraint: SEND IS THE USP. Every change must be deterministic
            (fail-closed in the post-validator), not "asked nicely
            in the prompt and hope".
```

## Lane 2 — final status

| # | Item | Status | Commit |
|---|---|---|---|
| 2.2 | Fail-closed SEND-marker checklist for ALL needs (HI / Anxiety / ADHD / Dyslexia / MLD / Dyscalculia / EAL / VI / Dyspraxia) | ✅ shipped | `89e152d` |
| 2.5 | Single marks→lines mapping shared by worksheet and revision-mat | ✅ shipped | `bd0eab2` |
| 2.6 | Curriculum-authority preamble bound to primary AND revision-mat paths | ✅ shipped | `fa725e8` |
| 2.7 | Six audit-doc-named revision-tip categories (vocabulary / worked-example / common-mistake / past-papers / retrieval / learning-objective) | ✅ shipped | `ac2a117` |
| 2.4 | Primary 5/4/5 layout (was 3/3/3) | ✅ shipped | `9ccdf13` |
| 2.8 | aria-labels on every pupil-facing element + toolbar zoom buttons | ✅ shipped | `dff055d` |
| 2.3 | Stacked-needs composability tests + first-rename-wins fix | ✅ shipped | `d2d48d8` |
| 2.1 | SEND coherence test — drift prevention across all 4 SEND-emitting layers + 2 pre-existing cosmetic gaps fixed | ✅ shipped | `2b62de9` |

## Test baseline at Lane 2 close

| State | Failed | Passed | Total |
|-------|-------:|-------:|------:|
| `main` | 34 | 697 | 732 |
| `feat/lane-1-pre-pilot-fixes` | 32 | 736 | 769 |
| `feat/lane-2-usp-polish` (final) | 32 | 760 | 793 |

**+24 newly passing tests across Lane 2, zero new regressions.** The
24 new tests come from:
- Lane 2.2: 37 focused SEND-marker tests in `sendOverlayMarkers.test.ts`
- Lane 2.3: +13 stacked-need composability tests in the same file
- Lane 2.7: ~3 net new Phase 3 tests after the rewrite
- Lane 2.1: 8 SEND coherence tests in `sendCoherence.test.ts`

(Net of removed legacy tests; existing tests refactored / merged.)

The 32 remaining failures are pre-existing on `main` and out of
scope for both PR #144 and PR #145 (UK English substitution bug,
off-spec command-word detection, etc.). Documented as Lane 3
backlog.

## What is NOT in this PR (Lane 3 backlog)

See `../lane-1-pre-pilot-fixes/SESSION-HANDOFF.md` Lane 3 section
for the full backlog. The big rocks:

### USP / SEND follow-ups

- **Full SEND-system unification** — Lane 2.1 ships a coherence
  test that prevents drift; the actual collapse into a unified
  `SendNeedSpec` shape (one source of truth across prompt +
  cosmetic + overlay + post-validator) is queued as a Lane 3 PR.
  The detailed migration plan is in this folder's `PHASE-PLAN.md`
  under "2.1 detailed change spec".
- **End-to-end eval-harness fixtures for stacked SEND** — Lane 2.3
  ships unit-test-level stacked-need tests; the eval-harness
  fixtures need a `params.sendNeeds: string[]` (plural) generator
  API change before the harness can exercise multi-need worksheets.
- **Multi-language EAL glossaries beyond v1** — Lane 1.5 ships ~30
  STEM keywords in 6 languages (Urdu, Polish, Bengali, Punjabi,
  Arabic, Romanian). Densification to per-subject glossaries (200+
  terms per language) is a Lane 3 follow-up.
- **Lighthouse a11y target ≥ 95** — Lane 2.8 ships aria-labels on
  the highest-impact pupil-facing surfaces; verifying the
  Lighthouse score requires a deployed build with axe-core +
  puppeteer (Lane 3.10 eval gate work).

### Primary roadmap

- Six-bucket per-year primary reading age (W1)
- Per-year vocabulary blocklist with re-prompt loop (W1)
- ~180 primary topic keys (W4)
- Pull diagram catalogue (5,975 briefs) into live DB (W6)
- Inline diagram per question for KS1/KS2 (W3)
- Mascots / Andika / section badges (W2)
- 1-page mode for KS1 (W7)

### Curriculum bank

- Y11 / KS3 / A-Level / OCR exemplars + scaffolds (Phase F2)

### Eval / CI

- Page-break audit for question splits (W7)
- Multi-need params API + stacked-SEND eval fixtures (depends on 2.3 + 2.1)
- PR-blocking eval gate (Lane 3.10)

### Pre-existing test failures (out of scope for Lanes 1 & 2)

The 32 pre-existing failures on `main` should be tackled as a
clean-up PR before the eval gate is made PR-blocking:
- Phase 5 UK English substitution bug — `metre` vs `meter`
  duplication in `applyUKEnglishSubstitutions`
- PR-2 command-word fidelity — `reflect on` vs `reflect`
  detection
- PR-2 unit-conversion topic detection
- Phase G `resolveSendSpec` semh routing
- PR-4 placeholder leakage QA-score deduction
- Plus 17 unitPack / scheduler / billing / auth tests unrelated
  to the worksheet generator

## Rollback plan

Each Lane 2 item is its own commit. Reverting any single commit
restores the prior behaviour without affecting the others. The
ordering on the branch is:

1. `89e152d` — Lane 2.2 (SEND markers ALL needs)
2. `bd0eab2` — Lane 2.5 (single linesForMarks)
3. `fa725e8` — Lane 2.6 (auth preamble everywhere)
4. `ac2a117` — Lane 2.7 (six revision-tip categories)
5. `9ccdf13` — Lane 2.4 (primary 5/4/5)
6. `dff055d` — Lane 2.8 (aria-labels)
7. `1b48432` — handoff doc update (mid-PR)
8. `d2d48d8` — Lane 2.3 (stacked-need composability + first-rename-wins fix)
9. `2b62de9` — Lane 2.1 (SEND coherence test + semh + working-memory cosmetics)
10. (this commit) — handoff close-out

## Smoke-test recipe before pilot

After both PR #144 and PR #145 land on main, generate these
worksheets and verify:

| # | Subject | Topic | Year | Tier | SEND | Marker to confirm |
|---|---|---|---:|---|---|---|
| 1 | Biology | Respiration | 10 | Higher | HI | Topic Summary block above Q1 |
| 2 | Biology | Respiration | 10 | Higher | ADHD | `[ ]` tick boxes on every Q + brain break + "BONUS" challenge title |
| 3 | Biology | Respiration | 10 | Higher | Anxiety | "OPTIONAL BONUS" challenge title + WARM-UP Section 1 |
| 4 | Maths | Quadratics | 10 | Higher | Dyslexia | Method-steps box before Section A |
| 5 | Maths | Quadratics | 10 | Higher | Dyscalculia | "Numbers in this question" cue on calc Qs |
| 6 | Maths | Quadratics | 10 | Higher | MLD | Topic-context block at top |
| 7 | English | Macbeth | 10 | — | EAL (Urdu) | Sentence frames on extended-response Qs + Urdu glossary |
| 8 | Geography | Rivers | 10 | — | VI | Warning if any diagram-dependent Q lacks a text equivalent |
| 9 | Maths | Money | 4 | — | — | 5/4/5 layout: WARM UP / LET'S PRACTISE / SHOW WHAT YOU KNOW |
| 10 | Biology | Photosynthesis | 11 | — | — | Six revision tips: VOCABULARY / WORKED EXAMPLE / COMMON MISTAKE / PAST PAPERS / RETRIEVAL / LEARNING OBJECTIVE |

If all 10 render correctly, you're safe to pilot.
