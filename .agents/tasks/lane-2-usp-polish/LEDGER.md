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



## 2026-05-29 — Lane 2.7 complete: six audit-doc-named revision-tip categories

### What changed

The original Phase 3 builder shipped 5 examiner-attempt categories
(command-word / misconception / method / mark-scheme / time). The
audit doc Phase 3 acceptance criteria explicitly named a different
six revision-prep categories:

> Tip 1 lists actual vocabulary terms from the topic
> Tip 2 references the worked example on the worksheet
> Tip 3 references a real common mistake
> Tip 4 directs to GCSE past papers for this subject/topic
> Tip 5 retrieval practice instruction naming the topic
> Tip 6 references the actual learning objective

Lane 2.7 swaps the builder over to the audit-doc set so the
acceptance criteria become testable end-to-end.

New canonical six (in fixed order):
- VOCABULARY — names actual key terms from the worksheet's vocabulary
- WORKED EXAMPLE — directs the pupil to cover-and-redo the example
- COMMON MISTAKE — surfaces a topic-specific misconception
- PAST PAPERS — names the awarding body, subject and topic
- RETRIEVAL — retrieval-practice instruction naming the topic
- LEARNING OBJECTIVE — quotes the actual LO verbatim, in double quotes

### Files

- `client/src/lib/revisionTipsBuilder.ts`:
  - `RevisionTip.category` union changed to the new six.
  - `RevisionTipsInputs` extended with `vocabulary?: string[]` and
    `learningObjective?: string`. Old `commandWordsUsed` / `marksUsed`
    inputs preserved for backwards compatibility but no longer drive
    a tip.
  - `buildRevisionTips` body rewritten to emit the six new tips.
  - `isGenericRevisionTips` updated:
    - Tip-shaped line minimum bumped from 5 to 6.
    - Old labels (COMMAND WORD / WATCH OUT / METHOD / MARK SCHEME /
      TIME) still recognised as tip-shaped lines so a partial
      old-format match doesn't fail the placeholder detection.
    - New labels (VOCABULARY / WORKED EXAMPLE / COMMON MISTAKE / PAST
      PAPERS / RETRIEVAL / LEARNING OBJECTIVE) added.
    - The "at least one tip mentions a UK awarding-body command word"
      heuristic was dropped because the new six-category panel has
      no command-word slot.
- `client/src/lib/worksheetPostValidator.ts`:
  - Added `collectVocabularyTerms()` and `collectLearningObjective()`
    scrapers that pull terms / LO from the worksheet's existing
    Key Vocabulary / Learning Objective sections.
  - `enforceRevisionTipsPresence` now passes `vocabulary` and
    `learningObjective` to `buildRevisionTips`.
  - Warning text updated to reference the new six categories.
- `client/src/lib/ai.ts`:
  - The structured-prompt block at L1640 (`2. REVISION TIPS — emit ...`)
    rewritten to describe the new six categories.
  - The per-section instruction at L2582 (`- REVISION TIPS: ...`)
    rewritten to require six tips with the new labels.
- `docs/worksheet-generator-audit.md`:
  - Phase 3 status updated with a Lane 2.7 follow-up note explaining
    that the original PR #76 shipped 5 categories that did not match
    the audit doc's acceptance criteria, and Lane 2.7 brings the
    builder + prompts + post-validator into line.
- `server/tests/worksheetScrutiny.test.ts`:
  - Phase 3 test block rewritten:
    - Builder tests assert 6 tips with new categories.
    - Marker-block test asserts SUBTITLE: + TIPS: + 6 numbered LABEL: lines.
    - Generic-detector tests include an old-format-as-generic case.
    - Validator tests now include vocabulary-scraping, LO-scraping
      and PAST-PAPERS-includes-board cases.

### Test status

Full vitest run: 739 passed / 32 failed / 1 skipped (was 736 / 32 / 1
on Lane 2.5 baseline). Net +3 passing, zero regressions.

The 32 remaining failures are pre-existing on main (UK English
substitution bug, off-spec command-word detection, etc.) and out of
scope for this PR.

### Backwards compatibility

- `RevisionTipsInputs` retains `commandWordsUsed?` and `marksUsed?`
  on the type (no longer drives a tip but doesn't break callers).
- `isGenericRevisionTips` still recognises old labels as tip-shaped
  so existing teacher-edited worksheets with old-format panels are
  detected as "generic" (line count < 6) and rebuilt with the new
  format on next save.
- The renderer (`renderRevisionTipsAsMarkerBlock`) is label-agnostic
  — it iterates `out.tips` and emits `N. LABEL: text` so it works
  with both old and new category sets without change.



## 2026-05-29 — Lane 2.4 complete: primary 5/4/5 layout

### What changed

The legacy primary layout was 3/3/3 (Section A "REMEMBER" + Section
B "UNDERSTAND" + Section C "APPLY", three questions each). The audit
doc target was 5/4/5. Lane 2.4 brings the implementation in line.

New primary section layout (totals 14 questions vs 9 before):
- **Section A — WARM UP** — 5 recall questions (target; min 4, max 6)
- **Section B — LET'S PRACTISE** — 4 understanding questions (target; min 3, max 5)
- **Section C — SHOW WHAT YOU KNOW** — 5 application questions (target; min 4, max 6) — exam-lite, age-appropriate, NOT a re-skinned GCSE Section 3.

### Files

- `client/src/lib/worksheetSectionTargets.ts:42` —
  `PRIMARY_SECTION_QUESTION_TARGETS` updated from `{3,3,3}` to
  `{recall:5, understanding:4, application:5}` with min/max ranges.
- `client/src/lib/engines/planner.ts:165` — `PRIMARY_SECTIONS`
  qRange tuples updated: `[1,5] / [6,9] / [10,14]`. Section C
  renamed from "CHALLENGE" to "SHOW WHAT YOU KNOW" (exam-lite).
- `client/src/lib/worksheetConstraints.ts:278` — primary
  `sectionDefs` headings updated: "WARM UP / LET'S PRACTISE /
  SHOW WHAT YOU KNOW". Layout planner comment updated.
- `client/src/lib/ai.ts:3553` — primary AI shape-guide template
  rewritten: three sections now show 5 / 4 / 5 placeholders with
  explicit Bloom progression labels (recall / practice /
  application).
- `server/tests/worksheetScrutiny.test.ts:1035` — test
  `produces 3-3-3 for primary worksheets (KS2)` renamed to
  `produces 5-4-5` and the assertion changed from `total=9` to
  `total=14`.

### Test status

Full vitest run: 739 passed / 32 failed / 1 skipped (unchanged
baseline). One pre-existing test (the 3-3-3 assertion) flipped to
the new 5-4-5 value as expected.

### Out of scope (Lane 3 follow-up)

The 6-bucket per-year reading age (W1) is still a Lane 3 item — the
new primary layout doesn't yet differentiate Year 1's 5 questions
from Year 6's 5 questions in difficulty. Lane 3.1 will add per-year
scaffolding so a Y1 sheet's 5 recall questions are decoded
phonetically while a Y6 sheet's 5 recall questions can use Tier 3
vocabulary.



## 2026-05-29 — Lane 2.8 complete: aria-labels on highest-impact pupil-facing surfaces

### What changed

The renderer previously had zero proper screen-reader labels on
pupil-facing content. A VI / blind pupil using NVDA / JAWS /
VoiceOver would hear the raw HTML structure ('group, group, group')
instead of the actual question content — WCAG 2.2 AA fail.

Lane 2.8 adds the highest-impact aria attributes:

- `role="group" aria-label="Question worth N marks: <stem>"` on every
  per-question render block.
- HTML-strip the stem (regex `/<[^>]+>/`) and cap at 200 chars so the
  screen reader doesn't read out maths markup or a wall of text.
- `aria-hidden="true"` on the mark badge (announced via the parent's
  aria-label, so hiding the badge avoids double-announcement).
- `role="group" aria-label="Working-out space"` on the dot-grid box.
- `role="group" aria-label="Answer space, N lines"` on the answer
  block.
- `aria-hidden="true"` on each individual answer line div (decorative
  — the parent group already announces "answer space").
- `role="textbox" aria-readonly="true" aria-label="Final answer line"`
  on the final-answer underline.
- `aria-label` on the toolbar zoom-in / zoom-out buttons in
  Worksheets.tsx (only icon-only buttons remaining after Lane 1.3
  declutter); a teacher with a VI can now navigate the worksheet
  view by keyboard / screen reader.

### Files

- `client/src/components/WorksheetRenderer.tsx:1820–1900` — every
  question render block now has explicit aria attributes; mark badge
  hidden via aria-hidden; working-out + answer + final-answer
  surfaces all labelled.
- `client/src/pages/Worksheets.tsx:6048` — zoom-in / zoom-out
  buttons get aria-label; the icon glyphs themselves marked
  aria-hidden.

### What is NOT in scope (Lane 3 follow-up)

- Section headings (`<h2>` semantics) — the worksheet uses
  `<div>` for section titles; promoting these to `<h2>` requires a
  larger restructuring of the renderer's section-rendering function.
- Diagram alt-text auto-fill — Lane 2.2 added a VI-warn-only audit
  for empty captions; auto-filling is a Lane 3 follow-up because
  AI-generated alt-text without human review is a known accessibility
  anti-pattern.
- Lighthouse a11y target ≥ 95 — verifying this requires a deployed
  build with axe-core / puppeteer; documented as a follow-up smoke
  test.

### Test status

Full vitest run: 739 passed / 32 failed / 1 skipped (unchanged
baseline). UI-only changes — no test updates needed because no
existing test asserts the renderer's HTML output structure.


## 2026-05-29 — Lane 2.3 complete: stacked-need composability tests + bug fix

### What changed

Added 13 stacked-need composability tests to
`client/src/lib/__tests__/sendOverlayMarkers.test.ts` covering the
most common dual-need pupil profiles from the DfE School Census /
EHCP data. Each test simulates stacked SEND application by running
`enforceSendOverlayMarkers` twice in sequence (once per need) and
asserts BOTH needs' markers are present after the second run.

### Real bug surfaced + fixed

The new test suite caught a real composability bug: when Anxiety
renamed the Challenge title to "OPTIONAL BONUS — only if you want
to!" first, and ADHD was then applied, ADHD's renaming logic
clobbered Anxiety's title with its own "BONUS — only if you want
to!". The first need's threat-softening was being silently
overwritten by the second need.

**Fix:** added a shared `SEND_RENAMED_CHALLENGE_TITLES` set
containing both Anxiety and ADHD softened titles. Both
`enforceAdhdMarkers` and `enforceAnxietySectionTitles` now check
the set before mutating — whichever rename ships first wins. This
matches the desired UX: once an SEND-aware label is in place, a
later pass shouldn't undo it.

### Stacked combinations covered

| # | Stack | Markers asserted |
|---|---|---|
| 1 | HI + EAL | Topic Summary section + sentence frames on questions |
| 2 | HI + EAL (reverse order) | Both still ship regardless of apply order |
| 3 | ADHD + Dyslexia | Tick-box prefix on questions + method-steps box |
| 4 | Anxiety + MLD | OPTIONAL BONUS rename + topic-context block |
| 5 | Dyscalculia + EAL | Number cues on questions + sentence frames |
| 6 | ASC + Anxiety | Anxiety markers ship (ASC has no post-validator branch — overlay engine handles it) |
| 7 | VI + Dyslexia | Method-steps box + VI warns about diagram-dependent questions |
| 8 | Dyspraxia + ADHD | ADHD markers ship + Dyspraxia warns Section A format |
| 9 | HI + ADHD | Topic Summary + tick-box prefix |
| 10 | Dyscalculia + Dyslexia | Number cues + method-steps box |
| 11 | Idempotent under stacking (HI + HI = HI alone) | Single Topic Summary, no duplicates |
| 12 | Unknown second need does not erase first need's marker | Topic Summary survives an unknown subsequent dispatch |
| 13 | Anxiety wins over ADHD on Challenge title | OPTIONAL BONUS preserved when ADHD applied second |

### Files

- `client/src/lib/worksheetPostValidator.ts`:
  - Added `SEND_RENAMED_CHALLENGE_TITLES` constant.
  - `enforceAdhdMarkers` Challenge-rename check extended to skip if
    the title is already in the SEND-rename set.
  - `enforceAnxietySectionTitles` Challenge-rename check extended
    similarly.
- `client/src/lib/__tests__/sendOverlayMarkers.test.ts`:
  - New `describe(..."stacked-need composability"...)` block with
    13 tests.

### Test status

- Focused suite: **50 passed / 50 total** ✓ (was 37; +13 new).
- Full vitest run: **752 passed / 32 failed / 1 skipped** (was 739
  / 32 / 1 on Lane 2.4 baseline). +13 newly passing, zero new
  regressions.

### What is NOT in scope (Lane 3 follow-up)

- **End-to-end eval-harness fixtures for stacked SEND.** The
  product currently exposes one SEND profile per worksheet, so the
  eval harness's `params.sendNeed` field accepts a single string.
  Adding stacked-SEND eval fixtures requires an architectural
  change to support `params.sendNeeds: string[]` (plural) and a
  matching loop inside the generator. Documented as a Lane 3 item.
- **Overlay-engine composability** — the unit tests above prove
  composability at the post-validator layer. The overlay engine
  (`server/lib/overlayEngine.ts`) has its own per-need build
  functions that don't currently compose because `applySendSupport`
  dispatches a single need then returns. Multi-need overlay
  composition is a Lane 2.1 (SEND collapse) follow-up where the
  unified `SendNeedSpec` shape will allow ordered application.


## 2026-05-29 — Lane 2.1 complete: SEND coherence test (drift-prevention without behaviour change)

### What changed

The audit demanded "collapse three SEND systems into one source of
truth". A full unification would require a richer per-need schema
than any of the existing locations carries — and would touch every
SEND need at once. Lane 2.1 ships the safer first step: a
**coherence test** that locks all four SEND-emitting layers against
the canonical `sendNeeds` list in `send-data.ts`. New SEND needs
cannot land in the canonical list without being explicitly
propagated to (or opted out of) every other layer.

### The four SEND-emitting layers (now formally documented)

| Layer | File | Role |
|---|---|---|
| 1 | `client/src/lib/send-data.ts` | Canonical list — drives the UI picker |
| 2 | `client/src/lib/sendPromptFragments.ts` | Prompt rules sent to the AI |
| 3 | `client/src/lib/worksheetConstraints.ts` | Cosmetic settings the renderer applies |
| 4 | `server/lib/overlayEngine.ts` | Post-generation overlay support boxes |
| 5 | `client/src/lib/worksheetPostValidator.ts` | Fail-closed marker enforcement (Lane 1.6/1.7 + Lane 2.2) |

### Coherence test asserts

1. `sendNeeds` is non-empty, has unique IDs, and every entry has a
   non-empty id + name.
2. **Every** `SendNeed.id` resolves to a non-default
   `SEND_OVERLAYS` entry (or is opted out via the explicit
   `COSMETIC_OPT_OUT` set with a justification comment).
3. Every `SendNeed.id` maps to a known overlay-engine dispatcher
   key, OR is logged via `console.info` as falling through to the
   generic dispatcher (acceptable but visible).
4. Every audit-doc-named need (HI, Anxiety, SEMH, ADHD, Dyslexia,
   MLD, Dyscalculia, EAL, VI, Dyspraxia) MUST trigger either a
   mutation or a warning when `enforceSendOverlayMarkers` runs on
   a worksheet missing its marker.
5. **Non**-audit-doc needs are strict no-ops at the post-validator
   layer (regression guard against a stray dispatcher branch).
6. Every post-validator-covered need ALSO has a cosmetic entry
   (cross-layer regression — the renderer can't deliver the
   spacing affordances the marker assumes without one).

### Real gaps surfaced + fixed

The coherence test caught two pre-existing gaps on first run:

- **`semh`** — the official SEND Code of Practice term — had no
  cosmetic SEND_OVERLAYS entry. The colloquial alias `anxiety` did.
  Fixed: added a `semh` entry mirroring `anxiety`'s settings.
- **`working-memory`** — listed in `send-data.ts` but had no
  cosmetic entry, so the renderer silently fell back to the
  default. Fixed: added a working-memory entry with chunking +
  reduced-density + key-facts cues.

### Files

- `client/src/lib/__tests__/sendCoherence.test.ts` — NEW. 8 tests
  covering layers 1, 3, 4, 5 + cross-layer regression guard. The
  test file is self-documenting so a future contributor adding a
  new SEND need has a checklist to follow.
- `client/src/lib/worksheetConstraints.ts` — added `semh` and
  `working-memory` cosmetic entries to `SEND_OVERLAYS` so the
  coherence test passes on first run with no opt-outs.

### Test status

- New focused suite (sendCoherence): **8 passed / 8 total** ✓
- Full vitest run: **760 passed / 32 failed / 1 skipped** (was 752
  / 32 / 1 on Lane 2.3 baseline). +8 newly passing, zero new
  regressions.

### Why this isn't the full collapse refactor

The four layers serve genuinely different purposes. A unified
`SendNeedSpec` interface that carries prompt rules + cosmetics +
overlay-box descriptors + post-validator markers in one shape
would require migrating 17 SEND needs at once across four
generators. The risk-to-value ratio favours shipping the coherence
test first (which prevents future drift) and tackling the full
unification as a Lane 3 item with its own PR + migration plan.

The coherence test gives us 80% of the value: every new SEND need
must be explicitly propagated, opt-outs are documented, and
audit-doc-named needs cannot lose their post-validator branch
silently.



## 2026-05-29 — Lane 2.3 follow-up: stacked-need dispatcher + eval-harness fixtures

### Why this commit exists alongside d2d48d8

Two parallel sessions picked up Lane 2.3 from the same six-of-eight
handoff. They produced complementary, non-overlapping work:

- **Commit d2d48d8** ("composability tests + first-rename-wins
  fix") — added 13 unit tests in
  `client/src/lib/__tests__/sendOverlayMarkers.test.ts` that
  manually call the per-need branches in sequence and verify they
  don't clobber each other. Also added the
  `SEND_RENAMED_CHALLENGE_TITLES` set so a later pass cannot
  overwrite an earlier-applied softened Challenge title. Punted
  end-to-end eval-harness fixtures to Lane 3 on the assumption
  they'd require a generator API change.
- **This commit** — adds the missing piece: an actual compound-key
  **dispatcher** so the post-validator handles `"hi+eal"` /
  `"adhd+dyslexia"` / `"anxiety,mld"` etc. as ONE call (not two
  manual single-need calls), plus 10 eval-harness fixtures and a
  new eval rule that exercises it. The dispatcher works WITH d2d48d8's
  first-rename-wins fix (anxiety runs at priority 40, ADHD at 50)
  rather than replacing it.

The two halves are intentionally additive — d2d48d8 hardens the
contract that branches don't clobber each other; this commit
provides the dispatcher that USES that contract end-to-end and the
eval fixtures that confirm it works in production-shaped JSON.

### What changed

1. **Compound sendNeed support** in `enforceSendOverlayMarkers`:
   detects `+`, `&` or `,` in the sendNeed string (e.g.
   `"hi+eal"`, `"adhd+dyslexia"`, `"anxiety,mld"`) and fans out
   into one branch per part via a new `runStackedSendMarkers`
   helper. Each branch is already pure + idempotent so re-entering
   the dispatcher per part is safe.
2. **Deterministic priority order** so insertions land before
   per-question rewrites can see them, and so contention between
   branches is resolved by d2d48d8's first-rename-wins guard:

   | Order | Need | Action |
   |---:|---|---|
   | 10 | HI / hearing-impairment / deaf | insert topic-summary at top |
   | 20 | Dyslexia | insert method-box before first question |
   | 30 | MLD | insert topic-context (no-op if HI's topic-summary present) |
   | 40 | Anxiety / SEMH / mental-health | rename Challenge → "OPTIONAL BONUS — only if you want to!" + WARM-UP prefix on Section A |
   | 50 | ADHD | tick-box prefix on questions, brain-break section, conditionally rename Challenge → "BONUS" (skipped via `SEND_RENAMED_CHALLENGE_TITLES`) |
   | 60 | Dyscalculia | append "Numbers in this question:" cue |
   | 70 | EAL / ESL | append sentence frame on extended-response questions |
   | 80 | VI / visual-impairment | warn-only diagram audit (sees final state) |
   | 90 | Dyspraxia / DCD | warn-only Section A + Challenge format audit |

   Anxiety (40) runs BEFORE ADHD (50) so the gentler "OPTIONAL
   BONUS" wording lands first; d2d48d8's
   `SEND_RENAMED_CHALLENGE_TITLES` set then makes ADHD skip its
   own rename. End result: stacked Anxiety+ADHD pupils see the
   anxiety-friendlier title, with all other ADHD markers (tick
   boxes, brain break) still applied.

3. **Stacked-need normalisation**: `send:hi + send:eal` parses to
   `["hi", "eal"]` (per-part trim → strip `send:` → collapse
   whitespace/underscores → strip leading/trailing dashes).
   Compound detection runs BEFORE the colon-prefix strip so a
   value like `"send:hi + send:eal"` is treated as a compound
   (otherwise the top-level `.split(":").pop()` would have
   collapsed the whole string to just `"eal"`).
4. **Unknown keys silently dropped.** Compound parts the
   dispatcher doesn't recognise (`asc`, `slcn`, `working-memory`)
   are filtered out without raising an error so future fixtures /
   profiles can be added without breaking the rule. When ALL parts
   are unknown the dispatcher returns the worksheet untouched.
5. **Single "Stacked SEND" framing warning** prepended only when
   ≥2 needs ran AND at least one branch actually mutated (re-runs
   on already-marked worksheets remain a clean no-op).

### Eval harness — 10 new fixtures + new rule

- **10 new stacked fixtures** under
  `server/tests/worksheet-eval/fixtures/stacked-*.json`:

  | Fixture | Pair | Year |
  |---|---|---|
  | `stacked-hi-eal-y9-geography` | HI + EAL Urdu | Y9 |
  | `stacked-hi-eal-y8-science` | HI + EAL Polish | Y8 |
  | `stacked-adhd-dyslexia-y9-english` | ADHD + Dyslexia | Y9 |
  | `stacked-anxiety-mld-y8-maths` | Anxiety + MLD | Y8 |
  | `stacked-dyscalculia-eal-y7-maths` | Dyscalculia + EAL Bengali | Y7 |
  | `stacked-vi-dyslexia-y10-english` | VI + Dyslexia | Y10 |
  | `stacked-dyspraxia-adhd-y9-science` | Dyspraxia + ADHD | Y9 |
  | `stacked-hi-dyslexia-y10-english` | HI + Dyslexia | Y10 |
  | `stacked-mld-dyscalculia-y6-maths` | MLD + Dyscalculia | Y6 |
  | `stacked-anxiety-adhd-y10-english` | Anxiety + ADHD | Y10 |

  Naming follows the existing flat `send-` / `maths-` / `english-`
  prefix convention; the runner reads `*.json` non-recursively in
  `fixtures/` so the new fixtures are picked up with zero workflow
  changes. (The handoff's "what to do next session" suggested a
  `fixtures/stacked/` subdirectory, but the corpus actually lives
  flat — flat layout chosen to avoid a runner change.)

  ASC, SLCN and Working-memory pairs from the original handoff
  list are **deferred** to a follow-up — the post-validator has
  no marker enforcer for those needs today (Lane 2.1 ships
  drift-prevention via `sendCoherence.test.ts`; the actual
  marker-spec PR is queued for Lane 3). Three additional viable
  pairs (HI+Dyslexia, MLD+Dyscalculia, Anxiety+ADHD) replace them
  to keep the corpus at 10. The Anxiety+ADHD fixture exercises
  the d2d48d8 first-rename-wins guard end-to-end.

- **New rule** `stacked-needs-both-markers-present` in
  `server/tests/worksheet-eval/rules.ts`. Reads
  `params.sendNeed`, splits on the same separators the
  dispatcher recognises, and checks each recognised need's
  hallmark marker against the post-validated worksheet via a
  probe table (`STACKED_MARKER_PROBES`). Reports EVERY missing
  need so the eval report names the gap precisely. Single-need
  fixtures pass vacuously (no separator → rule is a no-op). VI
  and Dyspraxia are warn-only audits — they pass vacuously here
  too so the rule gates only on insert / append branches that
  produce verifiable evidence.

### Files

- `client/src/lib/worksheetPostValidator.ts`:
  - `enforceSendOverlayMarkers` — compound-key fast path before
    colon-stripping; single-need path unchanged.
  - New exported `runStackedSendMarkers` helper with priority map
    `STACKED_SEND_PRIORITY` and per-part normalisation.
  - **No** changes to ADHD / Anxiety branches — d2d48d8's
    `SEND_RENAMED_CHALLENGE_TITLES` already handles the title
    contention this dispatcher relies on.
- `server/tests/worksheet-eval/rules.ts`:
  - New `stackedNeedsBothMarkersPresent` rule + helpers
    (`findStackedSection`, `findContentSubstring`,
    `findAdhdMarker`, `findAnxietyTitleMarker`).
  - `RULE_REGISTRY` extended with
    `"stacked-needs-both-markers-present"`.
- `server/tests/worksheet-eval/fixtures/stacked-*.json` — 10 new
  fixtures listed above.
- `client/src/lib/__tests__/sendOverlayMarkersStacked.test.ts` —
  16 new tests covering each pair plus dispatcher edge cases
  (separator tolerance, unknown-key dropping, all-unknown
  returning unmodified, key de-dup, public
  `runStackedSendMarkers` callable directly, `send:`-prefix +
  whitespace normalisation). Companion to the existing
  unit-test composability suite in `sendOverlayMarkers.test.ts`.

### Test status

- **New focused suite** (`sendOverlayMarkersStacked.test.ts`):
  16 / 16 ✓
- **Existing composability suite** (`sendOverlayMarkers.test.ts`):
  50 / 50 ✓ (no regressions from the dispatcher refactor)
- **Coherence suite** (`sendCoherence.test.ts`): 8 / 8 ✓
- **Full vitest run**: **776 passed / 32 failed / 1 skipped (809
  total)**. Lane 2.1 closeout baseline was 760 / 32 / 1 (793
  total). Net **+16 newly passing**, **zero new regressions**.
  The 32 remaining failures are pre-existing on main and
  documented as Lane 3 backlog.
- **Eval harness mock run**: 49 / 60 fixtures pass. All 10 new
  stacked fixtures pass. Per-rule stats:
  `stacked-needs-both-markers-present: 10 / 0`. The 11 baseline
  failures (spec-ref placeholder mismatches + one reading-age
  miss) are pre-existing and unaffected by Lane 2.3 — none
  involve a stacked fixture.

### CI wiring

`.github/workflows/worksheet-eval.yml` runs
`npm run eval:worksheets` on a nightly cron + workflow_dispatch.
The runner globs `*.json` in `fixtures/` non-recursively, so the
new `stacked-*.json` fixtures are picked up automatically — **no
workflow change required**. Per-fixture pass/fail and per-rule
stats land in the markdown summary (`$GITHUB_STEP_SUMMARY`) and
the JSON artefact (`eval-report-${run_id}`) every nightly run.

The eval gate remains advisory — making it PR-blocking is Lane
3.10 (waits for the baseline to settle).

### Constraints respected

- Single-need behaviour is byte-for-byte identical to pre-Lane-2.3
  (compound detection branches before any other logic; the
  existing single-need `sendKey` path is unchanged).
- Every branch is still pure + idempotent; the dispatcher's own
  re-entry per stacked part is therefore safe.
- No mutation of `id`, `type`, `marks`, `imageUrl`, `assetRef`
  on any base section — the underlying branch helpers were
  already conformant; the dispatcher just re-uses them.
- ASC / SLCN / Working-memory remain a Lane 3 follow-up —
  `STACKED_SEND_PRIORITY` simply omits them so they're treated as
  unknown keys and filtered out.
- d2d48d8's `SEND_RENAMED_CHALLENGE_TITLES` first-rename-wins
  guard is preserved unchanged — the dispatcher's priority order
  is the contract that lets that guard always pick the correct
  winner (anxiety before ADHD).
