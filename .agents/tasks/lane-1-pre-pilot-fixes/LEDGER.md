# Lane 1 — Pre-pilot Fixes — Ledger

Append-only progress log. Each entry: timestamp, item ID, what
changed, files touched, test status.

---

## 2026-05-29 — Branch created

- Branched off `main` @ `3d50b97` (`diagrams: automated batch
  26609763687`) to `feat/lane-1-pre-pilot-fixes`.
- Created task folder `.agents/tasks/lane-1-pre-pilot-fixes/` with
  SESSION-HANDOFF.md (covers all 3 lanes) + PHASE-PLAN.md +
  LEDGER.md (this file).

## 2026-05-29 — Lane 1 implementation complete

### 1.1 — Mark-badge regex accepts both bracket styles
- File: `client/src/components/WorksheetRenderer.tsx:1801`
- Old regex matched `[N marks]` only — Section 3 (audit-doc rule:
  use `(N marks)`) silently lost badge + answer-line ramp + working-
  out box.
- New alternation regex accepts `[N marks]` and `(N marks)`.
  Capture-group renumbering applied (`markCount` now from group 3
  OR group 4; `trailing` now group 5).

### 1.2 — Prompt: Section-3 round brackets + dynamic Q-range
- File: `client/src/lib/ai.ts:1416` and lines 3510–3514.
- Replaced stale `Q7, Q8, Q9` literal with the dynamic
  `Q${sec1+sec2+1}–Q${sec1+sec2+sec3}` expression already used
  elsewhere in the prompt.
- Appended a MARK FORMAT block to the secondary system prompt
  telling the AI to use `(N marks)` on Section 3 only.
- Updated Q16–Q20 JSON shape-guide template strings from `[N
  marks]` to `(N marks)` so the example matches the rule.

### 1.3 — Toolbar declutter
- File: `client/src/pages/Worksheets.tsx:6068+`
- Toolbar Row 2 collapsed from ~18 button surfaces to 7 primary +
  1 More dropdown. Primary kept: Edit AI / Edit Manually (with
  Cancel + Save Changes when in edit mode), PDF, Print, Save,
  Differentiate, ThreeTier (LA/MA/HA).
- Moved into More dropdown (grouped under Layout / Export / Access
  / Class & lesson labels): Sections, Overlay, Typography, QTI,
  Braille, Translate, Read Aloud, A11y audit, Pupil mode (QR),
  Class pack, Lesson bundle, Scan & mark, Scenario swap, Assign.
- All onClick handlers reused unchanged. Assign Dialog kept
  mounted; trigger moved into the dropdown.

### 1.4 — Teacher/pupil view consistency banner
- File: `client/src/pages/Worksheets.tsx`
- Added module-level `hashPupilSections()` (DJB2; excludes
  teacherOnly + mark-scheme/answers/teacher-notes types).
- Added state `lastPrintedPupilHash`, useMemo `currentPupilHash`,
  reset effect on title/section-count change, derived
  `showViewConsistencyBanner`.
- Yellow banner JSX above toolbar Row 1 with AlertCircle + a
  "Preview" button that opens `handleOpenPrintPreview(viewMode)`.
- Snapshot stamps in `handleDownloadPdf` (after `pdf.save`) and
  `handlePrintWithOptions` (before browser print dialog).

### 1.5 — EAL languages: top-six UK pupil L1s
- File: `server/lib/overlayEngine.ts:121`
- `TERM_TRANSLATIONS` extended from `{ ro, es }` to
  `{ ro, ur, pl, bn, pa, ar, es }`. Each new language ships ~30
  STEM keywords (current/voltage/resistance/circuit/equation/
  fraction/numerator/denominator etc.) in the native script.
- `parseRequestedLanguage` detects each by English name AND native
  Unicode script range (Arabic 0600–06FF, Bengali 0980–09FF,
  Gurmukhi 0A00–0A7F).
- `languageLabel` table updated.

### 1.6 + 1.7 — Deterministic SEND markers
- File: `client/src/lib/worksheetPostValidator.ts` +
  `client/src/lib/worksheetPostValidatorRegistry.ts`
- New validator `enforceSendOverlayMarkers` registered as
  `"send-overlay-markers"` BEFORE `self-reflection-topic-anchor`
  in the registry.
- HI path (`hi` / `hearing-impairment` / `deaf`): inserts a
  deterministic "Topic Summary — read first" section above the
  first question section if missing. Synthesised from the
  worksheet's existing Learning Objective + Key Vocabulary
  sections — no AI call.
- Anxiety path (`anxiety` / `semh` / `mental-health`): renames
  Challenge → "OPTIONAL BONUS — only if you want to!"; renames
  any "Section 1" / "Section A" titled section to prepend
  "WARM-UP — no pressure!".
- Both paths idempotent. Helpers: `enforceHiTopicSummary`,
  `enforceAnxietySectionTitles`, `opts_topic_or_metadata`,
  `findFirstSectionContent`, `extractVocabularyTerms`.

### 1.8 — Stronger placeholder scrubber
- File: `client/src/lib/worksheetPostValidator.ts:751`
- `PLACEHOLDER_RE` extended with a richer keyword list and an
  optional digit / `ONE` / `Single` / `One` / `optional` / `short`
  prefix. Now catches: `[5 specific skills/concepts from
  <topic>]`, `[learning objective]`, `[Activity question N]`,
  `[ONE clear, simple instruction sentence]`, `[debatable claim
  about <topic>]`, `[brief title e.g. ...]`, `[question about
  <topic>]`, `[scenario...]`, plus all previously-caught patterns.
- Idempotent.

### Test status

Ran the full vitest suite (`npx vitest run --reporter=basic`).

| State | Failed | Passed | Total |
|-------|-------:|-------:|------:|
| `main` (clean baseline) | 34 | 697 | 732 |
| `feat/lane-1-pre-pilot-fixes` (this branch) | 32 | 699 | 732 |

**Net: +2 passing. Zero new regressions.**

The 2 newly-passing tests are the PR-8 registry-order assertions
that were stale on main (missing `bias-sensitivity` through
`tier-ao-histogram`). Lane 1 fixes the test array as a side effect
of adding `send-overlay-markers`.

All 32 remaining failures are pre-existing in main:
- 7 × Phase 5 UK-English substitution bugs (`metre`/`meter`
  duplication in `applyUKEnglishSubstitutions`).
- 3 × PR-2 command-word fidelity / unit-conversion topic detection.
- 1 × Phase 1 enforceSectionQuestionCounts message text drift.
- 1 × Phase G `resolveSendSpec` semh routing bug.
- 1 × PR-4 placeholder leakage QA-score deduction.
- 1 × PR-8 backwards-compatibility test (depends on the upstream
  PR-2 failures).
- 17 × other modules (unitPack zip, schedulers, etc.) — none
  touched by Lane 1.

These are documented as Lane 2 / Lane 3 follow-ups in
`SESSION-HANDOFF.md` and are out of scope for the pre-pilot PR.

### TypeScript

`npm run check` → only the four pre-existing tsconfig env errors
(missing `@types/node` / missing `vite/client` types in the
sandbox install + two TS5101 deprecation warnings on `tsconfig.json`).
None of my edits produce a TypeScript diagnostic.

## Next

- Stage + commit + push branch (this PR).
- Open PR with the changelog above.
- Lane 2 + Lane 3 queued in `SESSION-HANDOFF.md`.
