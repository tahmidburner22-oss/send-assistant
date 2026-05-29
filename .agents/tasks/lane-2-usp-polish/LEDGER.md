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
