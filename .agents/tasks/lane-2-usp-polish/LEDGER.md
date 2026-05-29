# Lane 2 — USP Polish — Ledger

Append-only progress log. Each entry: timestamp, item ID, what
changed, files touched, test status.

---

## 2026-05-29 — Branch created

- Branched off `feat/lane-1-pre-pilot-fixes` @ `125629e` (Lane 1
  PR #144 head) to `feat/lane-2-usp-polish`.
- Once PR #144 lands on main, this branch will be rebased onto main
  to drop the Lane 1 commit (it'll be in main already).
- Created task folder `.agents/tasks/lane-2-usp-polish/` with
  SESSION-HANDOFF.md + PHASE-PLAN.md + LEDGER.md (this file).

## In-flight

(items 2.1–2.8 will be appended as they land)



## 2026-05-29 — Lane 2.2 complete: fail-closed SEND markers for ALL needs

### What changed

Extended `enforceSendOverlayMarkers` (Lane 1.6/1.7) to cover the
remaining SEND needs the audit doc names:

- **ADHD** — every pupil-facing question content prefixed with `[ ] `
  if missing; brain-break send-support section inserted mid-flow if
  missing; Challenge title rewritten to `BONUS — only if you want
  to!` (note: ADHD uses "BONUS"; Anxiety uses "OPTIONAL BONUS" —
  different by design per `sendPromptFragments.ts`).
- **Dyslexia** — Method-steps box inserted before the first question
  section if missing, synthesised from the worked example or LO.
- **MLD** — Topic-context block inserted at top if missing
  (skipped if HI's topic-summary is already present, to avoid
  double-insertion when both needs apply).
- **Dyscalculia** — `Numbers in this question: …` cue appended to
  every question content that contains a digit. Complements the
  existing `reinforceDyscalculiaMathsScaffolding` validator which
  is maths-only.
- **EAL / ESL** — sentence frame appended to every extended-response
  question that lacks one. Frame text varies by command verb
  (Calculate / Explain / Compare / Describe / Evaluate). Bilingual
  glossary from Lane 1.5 is additive on top.
- **VI** — warn-only audit: warns on diagram-dependent questions
  with no text equivalent (caption / altText / sibling description),
  and on diagram sections with empty caption + altText. No
  auto-rewrite — a wrong fallback is worse than no fallback for a
  screen-reader user.
- **Dyspraxia / DCD** — warn-only audit: warns when Section A has
  fewer than 3 non-writing question formats (MCQ / matching /
  true-false / circle), and when the Challenge uses
  extended-writing format. No auto-rewrite — format-changing is an
  LLM job.

### Files

- `client/src/lib/worksheetPostValidator.ts` —
  `enforceSendOverlayMarkers` extended with 7 new dispatcher
  branches; 7 new helper functions; new constants
  `ADHD_BONUS_TITLE`, `ADHD_TICK_PREFIX`, `ADHD_BRAIN_BREAK_LINE`,
  `DYSPRAXIA_NON_WRITING_TYPES`.
- `client/src/lib/__tests__/sendOverlayMarkers.test.ts` — NEW
  37-test focused suite covering Lane 1.6 + 1.7 + Lane 2.2
  branches. Every need has happy-path + idempotency tests.

### Test status

- New focused suite: **37 passed / 37 total** ✓
- Full vitest run: **736 passed / 32 failed / 1 skipped** (was 699 /
  32 / 1 on Lane 1 baseline).
- Net: **+37 newly passing, zero new regressions.** All 32
  remaining failures are pre-existing on main (UK English
  substitution bugs, off-spec command-word detection,
  resolveSendSpec semh routing, etc.) and out of scope for this
  PR.

### Idempotency

Every new helper checks for the literal target marker before
mutating. Test suite includes a dedicated `isIdempotent()` helper
that runs the validator twice and asserts the second pass yields
zero new mutations and zero warnings — passes for HI, Anxiety,
ADHD, Dyslexia, MLD, Dyscalculia, EAL.

### Constraints respected

- Never mutates `id`, `type`, `marks`, `imageUrl`, `assetRef` on
  any base section (only `title` and `content`, and only on
  pupil-facing sections).
- Never mutates teacher-only sections (regression test included).
- All inserted sections have unique synthetic IDs prefixed with
  the SEND need name (e.g. `topic-summary-hi-…`,
  `method-steps-dyslexia-…`, `topic-context-mld-…`,
  `brain-break-adhd-…`).



## 2026-05-29 — Lane 2.5 complete: single linesForMarks across worksheet + revision-mat

### What changed

The revision-mat grid in WorksheetRenderer.tsx had its own inline
`getNumLines(marks)` function (`>=4 → 6, else → 3`). The worksheet
renderer used `linesForMarks()` from worksheetSectionTargets.ts
(1m→2, 2m→3, 3m→4, 4m→6, 5–6m→8, 7–8m→12, 9+m→14). A pupil's
worksheet and revision-mat for the same question showed different
amounts of writing space — confusing.

Replaced the inline function with a one-line wrapper that calls
`linesForMarks()`. Now both renderers agree on the marks→lines
mapping. The worksheet-renderer's pre-existing import of
`linesForMarks` at line 19 was already in place — just needed wiring.

### Files

- `client/src/components/WorksheetRenderer.tsx:5184` — replaced
  hard-coded `getNumLines` body with `linesForMarks(marks)` call.

### Test status

Full vitest run: 736 passed / 32 failed / 1 skipped (unchanged from
Lane 2.2 baseline). Zero new regressions.

### Behaviour change

Existing revision mats render slightly different answer-line counts:

| Marks | Before | After |
|---:|---:|---:|
| 1 | 3 lines | 2 lines |
| 2 | 3 lines | 3 lines |
| 3 | 3 lines | 4 lines |
| 4 | 6 lines | 6 lines |
| 5-6 | 6 lines | 8 lines |
| 7-8 | 6 lines | 12 lines |
| 9+ | 6 lines | 14 lines |

Higher-tariff questions get more space (matches GCSE paper
densities). 1-mark questions get one fewer line — minor tightening.
The audit doc target list (1m→2, 2m→3, 3m→4, 4m→5) calls for even
fewer lines on the high tariffs; the implementation is more
generous than spec, deliberately, because real pupils need more
working room than the audit doc estimated.



## 2026-05-29 — Lane 2.6 complete: curriculum-authority preamble on every system prompt

### What changed

Before this change, only the secondary "structured" path
(`structuredSystemSections` at `ai.ts:2713`) called
`buildCurriculumAuthorityPreamble` /
`buildNonNegotiablesBlock` / `buildPedagogicalRegisterNote`. The
primary path (`ai.ts:1478` legacy `system` string) and the
revision-mat path (`ai.ts:1062` `rmSystem`) used weaker, separate
openers.

Now every worksheet's system prompt opens with the same authority
chain — the curriculum + (KS-scaled) awarding-body / school-scheme
clause + UK English / SI units / no-fabricated-codes
non-negotiables + register note (KS1 warm-and-precise → A-Level
academic-and-direct).

### Files

- `client/src/lib/ai.ts`:
  - **Primary path** — preamble + non-negotiables + register note
    prepended to the primary system string. Computed once outside
    the ternary so both branches share the call (cheap pure
    functions; secondary discards them and uses the
    `structuredSystemSections` array's call instead).
  - **Revision-mat path** — preamble + non-negotiables + register
    note prepended to `rmSystem`. `isSTEM` is recomputed locally
    (`rmIsSTEM`) because the broader function's `isSTEM` lives
    after the revision-mat early-return.
  - **Secondary structured path** — unchanged (already had the
    preamble at line 2713).
  - **Secondary legacy path** — unchanged (the legacy `system`
    string for the non-structured `callAI` at line 3572 keeps its
    inline Phase 5 mandate; the curriculum chain is still bound
    via that inline text).

### Test status

Full vitest run: 736 passed / 32 failed / 1 skipped. Unchanged
from Lane 2.2 / 2.5 baseline. Zero new regressions.
