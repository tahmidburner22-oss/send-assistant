# Lane 3 — Roadmap polish (LEDGER)

Lane 3 is a multi-PR programme delivering the W1–W7 primary roadmap
and the Phase F2 backlog (KS3 / Y11 / A-Level / OCR). The full plan
lives in `.agents/tasks/lane-1-pre-pilot-fixes/SESSION-HANDOFF.md`
under "LANE 3 — Roadmap polish".

This folder hosts the per-item LEDGER for any Lane 3 ticket that
ships. Each entry is dated, links to the PR, and records test
deltas + follow-ups.

---

## 2026-05-29 — Lane 3.1 shipped: six-bucket primary reading-age profile

### What changed

- New module `client/src/lib/primaryReadingProfile.ts` exporting
  `getPrimaryReadingProfile(yearNum)` and
  `renderPrimaryReadingProfilePrompt(yearNum)`.
- The primary system prompt at `client/src/lib/ai.ts:~1517`
  previously branched on three reading-age buckets (Y1-2 / Y3-4 /
  Y5-6). Replaced with a 6-bucket profile keyed off `yearNum`,
  matching W1 spec exactly:

  | Year | Phonics | Max words / instruction | Two-clause OK? | Vocab tier |
  |---|---|---:|:---:|---|
  | Y1 | Phase 5 | 6 | no | Tier 1 only |
  | Y2 | Phase 5/6 | 8 | no | Tier 1 only |
  | Y3 | n/a | 10 | no | Tier 2 with inline definition |
  | Y4 | n/a | 12 | yes | Tier 2 (>=80% Tier 1) |
  | Y5 | n/a | 14 | yes | Tier 2 if defined |
  | Y6 | n/a | 16 | yes | ONE Tier 3 word per question allowed if it is the curriculum word being taught |

- Y1 prompt now includes the W1-mandated icon-cue rule ("every
  instruction must have an icon cue beside it").
- Pure module: no I/O, no global state. The renderer is a one-line
  call from the system prompt builder.

### Files

- `client/src/lib/primaryReadingProfile.ts` — NEW (pure module).
- `client/src/lib/ai.ts` — replaced the 3-bucket switch at L1517
  with a call to `renderPrimaryReadingProfilePrompt(yearNum)`;
  added the import.
- `client/src/lib/__tests__/primaryReadingProfile.test.ts` — NEW
  (19 unit tests).

### Test status

- New focused suite: 19 / 19 ✓
- Full vitest run: **795 passed / 32 failed / 1 skipped (828
  total)**. Lane 2.3 baseline was 776 / 32 / 1 (809 total). Net
  **+19 newly passing, 0 new regressions**.
- TypeScript: 146 baseline errors — same count pre- / post-change.
  Zero new errors in `primaryReadingProfile.ts`,
  `primaryReadingProfile.test.ts`, or `ai.ts`.

### Constraints respected

- Single-need / secondary behaviour is byte-for-byte identical.
  The new module returns the empty string for `yearNum < 1` or
  `yearNum > 6`, so non-primary system prompts collapse to the
  same shape as before.
- The W1 acceptance criteria (Y1 reading-age bucket; KS1 forbids
  analyse / evaluate / etc. — the latter is Lane 3.2) are now
  expressible as data, not as a regex on a prompt string.
- `pedagogicalRegister` from W1 step 3 is deferred — that change
  threads through `buildCurriculumAuthorityPrompt`, which already
  scales by KS in Lane 2.6. A separate ticket can opt KS1 into
  the warmer "Have a go!" register without touching this profile.

### Follow-ups (Lane 3.2 — per-year vocabulary blocklist)

The new module owns the structured profile (`maxVocabTier`,
`tier3CurriculumWordAllowed`); Lane 3.2's
`primaryVocabBlocklist.ts` will read from these fields rather than
re-deriving year bands. Co-locating year-band-keyed primary rules
in this module is the goal — a future refactor of `ai.ts` should
not have to chase year-band branches across multiple files.


---

## 2026-05-30 — Lane 3.2 shipped: per-year primary vocabulary blocklist (fail-closed)

### What changed

W1 step 2 of the primary roadmap: lift the inline "VOCABULARY RULES —
NEVER USE" list out of `ai.ts` into a structured, band-scoped module,
and add a fail-closed post-validator that audits generated output
against it.

- **New module** `client/src/lib/primaryVocabBlocklist.ts`:
  - `PrimaryBand` = `"KS1" | "LKS2" | "UKS2"`.
  - `primaryBandForYear(yearNum)` — Y1-2 → KS1, Y3-4 → LKS2, Y5-6 →
    UKS2 (reuses Lane 3.1 `getPrimaryReadingProfile` as the single
    authority on "is this primary"). Undefined for Y7+.
  - `primaryBandForYearGroup(str)` — resolves the raw year-group
    string the generator emits: `Year N`, `11+ Preparation` → UKS2,
    `KS1` → KS1, `KS2` → UKS2 (lightest, never over-block), and
    explicitly rejects `KS3/4/5`, `GCSE`, `A-Level` (so "KS3" is not
    misread as "Year 3").
  - `KS1_BLOCKED ⊃ LKS2_BLOCKED ⊃ UKS2_BLOCKED` — strictly nested
    frozen lists built from three tiers: `SECONDARY_ABSTRACT` (all
    bands), `UPPER_SUBJECT_WORDS` (LKS2 + KS1 — the Y5/6 curriculum
    words a younger pupil shouldn't meet cold), `KS1_EXTRA` (KS1 only).
    Crucially UKS2 does NOT block its own curriculum words
    (circumference, perpendicular, denominator…) so a Y6 lesson on
    those isn't falsely flagged.
  - `findBlockedVocab(text, band)` — whole-word + inflection match
    (`\b…(s|es|ing|ed|d)?\b`), case-insensitive, with each
    blocked word's plain-English replacement. `\b` boundaries prevent
    sub-string false positives ("ionic" inside "ironic").
  - `renderPrimaryVocabBlocklistPrompt(yearGroup)` — band-appropriate
    "NEVER USE" prompt block, now the single source the generator
    prompt reads from.

- **New post-validator** `enforcePrimaryVocabBlocklist(ws, opts)` in
  `worksheetPostValidator.ts` (+ `PostValidatorPrimaryVocabViolation`
  type and `metadata.primaryVocabViolations` field):
  - Resolves band from `opts.yearGroup` (falls back to
    `ws.metadata.yearGroup`). Non-primary → no-op (KS3+ byte-for-byte
    unchanged).
  - Scans pupil-facing sections (content + `questions[].text/prompt/
    question/stem/content` + options); skips `teacherOnly` and
    `mark-scheme` / `answers` / `teacher-notes` / `send-adaptations`
    types.
  - WARN-ONLY by design: it does NOT auto-rewrite pupil content (a
    blocked word may be the curriculum word being taught; a blind
    in-place swap risks nonsense). Instead it emits a per-word warning
    (naming the section, count, and replacement) AND stamps a
    structured `metadata.primaryVocabViolations` array — the
    re-prompt hook the generation orchestrator can read. This matches
    the `extractMisconceptionLinks` metadata-stamp precedent.
  - Idempotent: violations recomputed deterministically and
    re-stamped each run; warnings only emitted for violations not
    already on the incoming metadata, so a second pass adds none and
    is deep-equal.

- **Registry**: registered as `primary-vocab-blocklist` at the END of
  `WORKSHEET_POST_VALIDATORS` (final audit — sees fully
  post-validated content). `EXPECTED_ORDER` in
  `worksheetScrutiny.test.ts` updated to match.

- **Generator prompt**: `ai.ts` primary path now interpolates
  `renderPrimaryVocabBlocklistPrompt(params.yearGroup)` instead of the
  flat hard-coded list — the prompt and the fail-closed audit share
  one source and cannot drift.

### Why fail-closed = warn + metadata (not in-place rewrite)

The post-validator chain is synchronous and pure — it cannot itself
re-prompt the LLM. The "fail-closed" intent from W1 is realised by (a)
the band-scoped prompt rule reducing blocked words at generation time,
and (b) the validator stamping a structured violation list the
orchestration layer can act on (regenerate / surface to teacher).
Auto-rewriting mid-content was rejected as unsafe (curriculum words,
sentence-level grammar). Documented as such in the validator JSDoc.

### Files

- `client/src/lib/primaryVocabBlocklist.ts` — NEW (pure module).
- `client/src/lib/worksheetPostValidator.ts` — new validator + type +
  metadata field + import.
- `client/src/lib/worksheetPostValidatorRegistry.ts` — registered the
  validator (import + final row).
- `client/src/lib/ai.ts` — primary prompt reads the shared blocklist
  renderer; import added.
- `client/src/lib/__tests__/primaryVocabBlocklist.test.ts` — NEW
  (31 tests).
- `server/tests/worksheetScrutiny.test.ts` — `EXPECTED_ORDER` extended
  with `primary-vocab-blocklist`.

### Test status

- New focused suite: 31 / 31 ✓ (band derivation, KS1 ⊃ LKS2 ⊃ UKS2
  nesting, scanner whole-word/inflection/no-substring, validator
  no-op-for-secondary / flags-KS1 / skips-teacher-only / idempotent /
  metadata-fallback, prompt renderer band-appropriateness).
- `worksheetScrutiny.test.ts` registry-order + one-entry tests pass.
  The 15 pre-existing failures in that file (UK-English drift,
  command-word fidelity, semh routing, qaScore, PR-8 surface) were
  verified via a stash baseline to be present WITHOUT this change too
  — zero new failures introduced.
- Full vitest: **823 passed / 32 failed / 1 skipped (856 total)**.
  Lane 3.1 baseline was 795 / 32 / 1 (828). Net **+28 newly passing,
  zero new regressions**.
- TypeScript: 146 baseline errors, unchanged. Zero new errors in any
  touched file.

### Follow-ups

- Wire `metadata.primaryVocabViolations` into the generation
  orchestrator's re-prompt loop (the true closed loop — out of scope
  for a pure validator).
- Lane 3.1's `pedagogicalRegister` (W1 step 3) remains queued.
- Flesch-Kincaid acceptance test for KS1/UKS2 reading age lands with
  the primary eval-harness fixtures (Lane 3.10).

### Branch / PR note

`feat/lane-3-2-primary-vocab-blocklist` is stacked on
`feat/lane-3-1-primary-reading-age` (PR #147), which imports
`getPrimaryReadingProfile`. If #147 merges to main first, this PR
rebases cleanly; otherwise review them as a stack.
