# Big-Bang Improvements — Session Handoff

This file is the **resume point** for any fresh chat picking up the
big-bang improvements work. Read this first, then `PHASE-PLAN.md`,
then `LEDGER.md` for the per-item detail.

> **Always update this file at the end of every working session** so
> the next chat can pick up cleanly. Edit the "What is done" section
> to flip a PR to shipped, set the "What is next" pointer, and append
> any context the next chat will need (file paths, function names,
> design decisions, open questions). Keep it ~200 lines or under.

Last updated: 2026-05-22 (PR-2 in flight on branch
`big-bang/pr-2-pure-validators`; PR-1 merged via PR #85; PR-0 merged
via PR #84).

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Branch off main per PR (see "What is
         next"). Each branch is named big-bang/pr-NN-<slug>.
Resume: .agents/tasks/big-bang-improvements/SESSION-HANDOFF.md
Plan:   .agents/tasks/big-bang-improvements/PHASE-PLAN.md
Ledger: .agents/tasks/big-bang-improvements/LEDGER.md
Constraint: do not read ai.ts (5,200+ lines), Worksheets.tsx
            (6,500+ lines) or WorksheetRenderer.tsx (7,000+ lines) in
            full from a fresh chat. grep for the named exports first;
            read narrow ranges only. Sandbox is INTEGRATIONS_ONLY —
            do not run npm install. Type-check + tests run in CI on
            PR push.
Goal: complete the next un-shipped PR in the "What is next" section
      below, update LEDGER.md and this file, open the PR.
```

## What is done

- **PR-0 — Tracker scaffolding** (PR #84).
- **PR-1 — SEND fidelity probes for the 10 previously-unprobed profiles** (PR #85).
- **PR-2 — New pure post-validators** (branch `big-bang/pr-2-pure-validators`,
  PR pending).

  Audit items closed: **#1, #2, #11, #14, #18** (5 items).

  What changed:
  - `client/src/lib/curriculumAuthorityPrompt.ts`: extended with three
    new pure / deterministic surfaces:
    - **SI unit detection** — `findImperialUnits`, `isUnitConversionTopic`,
      `IMPERIAL_TOKENS` table covering mph, °F, lbs, ft, in, miles, gallons
      and the compound `5 ft 9 in` form. Warn-only — never silently rewrites
      values because numeric conversion is non-trivial (60 mph ≠ 60 km/h).
    - **Awarding-body command-word fidelity** —
      `COMMAND_WORDS_BY_BOARD`, `getCommandWordsForBoard`,
      `extractLeadingCommandWord` (handles checkbox / Q-number / bold /
      emoji decorators), `findOffSpecCommandWords`. Per-board union lists
      for AQA / Edexcel / Pearson / OCR / WJEC / Eduqas / CCEA / CIE on
      top of a KS-neutral verb list (≈ 60 verbs).
    - **Reading-age computation** — `computeReadingAge` (Flesch-Kincaid
      grade level → UK reading age, idempotent), `countSyllables`
      (vowel-group heuristic, drops silent trailing `e` / `ed` / `es`).
  - `client/src/lib/worksheetPostValidator.ts`: three new validators
    wired at the END of `runWorksheetPostValidators` (so they audit
    final post-validated content, including any UK English silent
    rewrites Phase 5 already applied):
    - `enforceCommandWordFidelity` — warn per off-spec verb (deduped
      across questions; lists question numbers per warning).
    - `enforceSiUnitNormalisation` — warn per imperial unit type
      (deduped); no-op when the topic is unit conversion.
    - `enforceReadingAgeBudget` — warn when actual FK reading age
      exceeds declared `expectedReadingAge` by > 1.5 years (BDA
      tolerance band). Falls back to year-group default when
      per-question metadata is absent.
  - `server/tests/worksheetScrutiny.test.ts`: 8 new describe blocks
    covering happy paths, unhappy paths, idempotency, no-op cases,
    and chain-integration.

  Files touched: 3.

## What is in flight

- **PR-2** push + open.

## What is next

**PR-3 — Diagram-question coupling, distractor pedagogy probe, Tier-3
vocabulary audit, mathematical notation hygiene normaliser.**

Audit items: #4, #10, #13, #15, #16.

Files to touch:
- `client/src/lib/worksheetPostValidator.ts`:
  - `enforceDiagramDependencyIntegrity` (#15) — when a question stem
    references "Diagram A", "Diagram B", "the figure", "the graph", the
    named section must exist; otherwise warn (don't strip the question —
    the diagram may still be on its way from the library).
  - `enforceDistractorPedagogy` (#4) — for every MCQ, every wrong-answer
    distractor must be a substantive misconception (not "obviously wrong"
    decoys: same-letter different number, blank, the literal correct
    answer with a typo). Warns per offending distractor.
  - `enforceTier3VocabularyDeclared` (#10) — every Tier 3 word that
    appears in a question stem must also appear in the worksheet's
    Word Bank / Key Vocabulary section. Tier 3 detection: subject-
    specific words ≥ 4 syllables OR matching a curated stop-list per
    subject family.
  - `enforceCommonMistakesForNonMaths` (#16) — extend the existing
    `commonMistakesValidator` to non-maths subjects. Each block needs
    a wrong-answer **example**, not just prose ("pupils think X" with
    no shown wrong working).
- `client/src/lib/notationHygieneNormaliser.ts` (NEW, #13) — pure
  rewriter. Replaces `x` → `×` between digits, `-` → `−` for unary
  minus, `o` → `°` after digit + space. Idempotent. Warns per rewrite.
  Wired into the post-validator chain.
- `server/tests/worksheetScrutiny.test.ts` — extend.

Out of scope for PR-3:
- Vocabulary tiering across the whole subject corpus (PR-19).
- Page-fit / diagram complexity budget (PR-23).

Sizing budget: ≤ ~700 net lines, ≤ ~6 files.
Branch name: `big-bang/pr-3-diagram-distractor-vocab-notation`.

## Definition-of-done for every PR (mirrors PHASE-PLAN.md)

- [ ] CI passes (`npm test` + `tsc --noEmit`).
- [ ] LEDGER.md updated for every item the PR closes.
- [ ] SESSION-HANDOFF.md updated — "What is done" gains a bullet,
      "What is next" advances to the next un-shipped PR.
- [ ] PR description references this handoff file by path.

## Conventions inherited from Phases 1–5

- **Single source of truth.** Every new validator / builder lives in
  one file under `client/src/lib/`; the prompt and the post-validator
  both import from it.
- **Schema / prompt / validator alignment.** New schema field →
  `aiSchemas.ts` (Zod) + `worksheet-generator.ts` (interface) + per-Q
  contract block in `ai.ts` in lockstep, in the same PR.
- **Sciences do NOT get the maths-only working-out box.** Phase 1
  lock — never reintroduce.
- **Never invent spec codes.** Phase 1 lock. AO codes are AO1–AO4
  only.
- **Idempotent / pure validators.** Running twice yields the same
  output as running once. Tests in `worksheetScrutiny.test.ts`
  enforce this for every new validator.
- **Conservative.** When in doubt, validators warn (don't rewrite).

## How to update this file

1. When you START a PR, move it from "What is next" → "What is in flight".
2. When you SHIP a PR, move it from "What is in flight" → "What is done"
   with the PR number, and advance "What is next" to the next row in
   PHASE-PLAN.md.
3. Capture any non-obvious context in "Notes" below.

## Notes (transient, per-session scratchpad)

### PR-2 design decisions

**SI unit normaliser is WARN-ONLY (not a silent rewriter).**
Imperial→SI conversion changes the value by a non-trivial factor
(60 mph = 96.6 km/h, not 60 km/h). A unit-only rewrite that left the
number intact would silently corrupt question semantics. Teachers
fix manually. A future PR can add a value-aware rewriter behind a
feature flag (parse the leading number, multiply by the canonical
conversion factor, round per topic).

**Command-word fidelity uses per-board UNION lists, not exclusive lists.**
The KS-neutral set (`COMMAND_WORDS_KS_NEUTRAL`) covers ~60 verbs
common to every UK awarding body's published list. Per-board
`*_EXTRAS` entries add the board-specific verbs (Edexcel
"Investigate" / "Comment on", OCR "Account for", CIE "Demonstrate").
A verb is on-spec if it's in the union; off-spec if it's not on
that board's union. The validator never STRIPS off-spec verbs
because the assessed skill is encoded in the verb — silent
substitution would change the question's pedagogy. Teachers must
intervene.

**Reading-age budget falls back gracefully.**
Per-question `expectedReadingAge` (PB1, optional schema field) →
year-group default (`inferDefaultReadingAge`) → no-op (when neither
is available). The 1.5-year tolerance band matches BDA / National
Literacy Trust guidance for "comfortable independent reading".
Sub-5-word stems are skipped — Flesch-Kincaid is unreliable on
tiny passages.

### Cross-curricular UK context whitelist (#11) — folded in

PR-2 ships `findImperialUnits` which catches the imperial-unit half
of #11. The non-unit half (cricket-specific contexts, US sports,
seasonal references) is *not* shipped this PR — those are SUBJECT
contexts not unit drift. Folded into PR-12 (bias audit) where a
broader UK-context whitelist lives.

### Self-Reflection command-word echo (#18) — folded in

The `findOffSpecCommandWords` infrastructure lets the
`enforceSelfReflectionTopicAnchor` validator (Phase 2) probe whether
the reflection's I-can statements echo at least one on-spec command
word. The hook isn't wired in this PR (would expand scope into the
Phase 2 builder); flagged for the PR-21 carve-up sweep.

### Resolver-order bug, warning-doubling — still open

From PR-1's notes:
- `resolveSendSpec` masks `semh` behind `anxiety` for bare input
  `"semh"`. Worked around in PR-1 tests by using `"social-emotional"`.
  Fix queued for PR-21.
- `applySendFidelityAudit` duplicates warnings on second invocation.
  Real-world impact nil; flagged for PR-22 idempotency-test sweep.

### PR-2 coverage map

| Validator                        | Audit items | Tests |
| -------------------------------- | ----------- | ----- |
| `enforceCommandWordFidelity`     | #2          | 4 cases (warn / no-op / no-rewrite / idempotent) |
| `enforceSiUnitNormalisation`     | #11 #14     | 4 cases (warn / topic no-op / no-rewrite / idempotent) |
| `enforceReadingAgeBudget`        | #1 #18      | 5 cases (warn / no-op / fallback / no-rewrite / idempotent) |
| Helpers (FK / syllables / verbs) | n/a         | 8 cases across 4 helper-level describes |
| Chain integration                | n/a         | 1 end-to-end |

Total new tests: ~22 cases across 8 describe blocks.
