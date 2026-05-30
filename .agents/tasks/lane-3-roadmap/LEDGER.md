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
