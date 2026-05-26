# Phase G — Where the Worksheet Meets the Pupil

> Competitor-derived improvements — closes the interactivity + template
> ergonomics gap that the existing 30-validator post-chain, curriculum
> bank, SEND fidelity audit, fact-checker and maths CAS verifier do
> not address. Source: a structured review of Twinkl, MathsGenie,
> Dr Frost, Save My Exams, Corbettmaths, TpT, K5 Learning,
> SuperTeacherWorksheets, Liveworksheets, Kahoot, plus AI-worksheet
> meta-reviews and the academic literature on worksheet quality
> (paraphrased throughout for licence compliance).

## Goal

Make the worksheet generator feel as **interactive** and
**template-led** as the best of the competition while keeping the
rigour wins (curriculum-aligned, SEND-fidelity-audited, validator-
chain-clean) the codebase already has.

## Scope

12 implementation work units (G1–G6, G9, G12–G15, G17) + 3 already-
shipped Tier-4 bug fixes (G18–G20) + 1 cleanup (G16 deferred to
Phase H because it has no Phase G dependency).

| ID  | Title                                                              | Tier | Effort | Depends on        |
| --- | ------------------------------------------------------------------ | ---- | ------ | ----------------- |
| G1  | Pupil-facing auto-marking in the companion app                     | 1    | M      | —                 |
| G2  | "Another one like this" same-spec-ref regeneration                 | 1    | S      | curriculumBank.ts |
| G3  | Lesson-archetype templates (5 archetypes)                          | 1    | M      | —                 |
| G4  | Procedural activity types (wordsearch / crossword / matching / cloze) | 1 | M | — |
| G5  | 5-a-day daily-drill builder                                        | 1    | S      | unitPack.ts       |
| G6  | Predicted-paper builder (UI surface)                               | 1    | S      | pastPaperFrequencyAnchor.ts |
| G9  | One-click three-tier ability differentiation (LA / MA / HA)        | 2    | S      | aiDifferentiateExistingWorksheet |
| G12 | Teacher-only answer-key separate page                              | 3    | XS     | pdf-generator-v2.ts |
| G13 | Per-question timer (mock-exam mode)                                | 3    | S      | companion app     |
| G14 | Parent letter / homework cover note auto-generator                 | 3    | S      | aiGenerate*       |
| G15 | Drag-handle section reorder                                        | 3    | S      | Worksheets.tsx    |
| G17 | Worksheet favourites / preset speed-dial                           | 3    | S      | AppContext + server library |
| G18 | Bug — `semh` resolver order fix              ✅ shipped (this PR)   | 4    | XS     | —                 |
| G19 | Bug — fidelity audit warning idempotency     ✅ shipped (this PR)   | 4    | XS     | —                 |
| G20 | Cleanup — delete `WorksheetRenderer.tsx.bak` ✅ shipped (this PR)   | 4    | XS     | —                 |

Effort key: XS ≈ <50 LoC; S ≈ 100–300 LoC; M ≈ 300–800 LoC.

## Out of scope (deferred to Phase H or PR-28)

| Deferred             | Phase | Reason                                                |
| -------------------- | ----- | ----------------------------------------------------- |
| G7 / H1   pupil progress dashboard with skill mastery heatmap | Phase H | depends on the auto-mark data G1 will start to emit |
| G8 / H2   curriculum architect-style year planner | Phase H | larger UI; deserves its own scope debate     |
| G10 / H3  real-world context library              | Phase H | content-curation effort, not engineering       |
| G11 / H4  cross-pupil leaderboards / streaks / badges | Phase H | depends on G1 + multi-pupil progress aggregation |
| G16 / H5  voice-input for the worksheet brief     | Phase H | independent but small; bundled with H for cohesion |
| H6        telemetry admin dashboard hydration     | Phase H | finishes the PR-19..27 deferred follow-up       |
| H7        production corpus loaders               | Phase H | unlocks subjectVocabularyCorpus, citation corpus |
| H8        activate dark env flags                 | Phase H | needs A/B baseline first                       |
| H9        multi-step worked-example walkthrough   | Phase H | depends on G1 interactive surface              |
| H10       wrong-answer aggregate → re-teach pack  | Phase H | depends on G1 data                             |
| H11       per-question "try harder / easier" tier-shift buttons | Phase H | depends on G2 surface |
| H12       spaced-repetition for 5-a-day (Leitner / SM-2) | Phase H | depends on G5 + G1 |

PR-28 (LMS push, MIS roster, share-sheet, browser extension, weekly
emails, Mon-emails) remains genuinely deferred until external
credentials land.

## Definition-of-done (per work unit)

- [ ] Schema additions (if any) are **additive** — older worksheets
      continue to validate against `shared/aiSchemas.ts`.
- [ ] Validators / builders / helpers are **pure / idempotent /
      conservative** (running twice = running once; never delete LLM
      output that was already correct).
- [ ] Targeted vitest cases live alongside the new code and exercise
      every public function. Where applicable, add a regression case
      to `server/tests/worksheetScrutiny.test.ts`.
- [ ] CI passes (`npm run check` + `npm test`).
- [ ] LEDGER.md updated for every item the work unit closes.
- [ ] SESSION-HANDOFF.md updated — "What is done" gains a bullet,
      "What is next" advances to the next un-shipped row.
- [ ] PR commit message references this PHASE-PLAN.md by path so a
      reviewer sees the wider context.

## Conventions inherited from Phases A–F + big-bang

- **Single source of truth.** Every new validator / builder / helper
  lives in one file under `client/src/lib/`; the prompt and the
  post-validator both import from it. No hand-rolled duplicate strings.
- **Schema / prompt / validator alignment.** New schema field →
  `shared/aiSchemas.ts` (Zod) + `client/src/lib/worksheet-generator.ts`
  (interface) + per-Q contract block in `client/src/lib/ai.ts:structuredSystemSections`
  in lockstep, in the same commit.
- **Renderer stays subject-aware** through `formatContent`'s `subject`
  option in WorksheetRenderer.tsx.
- **Sciences do NOT get the maths-only working-out box** (Phase 1 lock).
- **Never invent spec codes.** AO codes are AO1–AO4 only.
- **Idempotent / pure validators.** Running twice yields the same
  output. Tests in `worksheetScrutiny.test.ts` enforce this.
- **Conservative.** When in doubt, validators warn (don't rewrite).
- **Big-file constraint.** Do NOT read `ai.ts`, `Worksheets.tsx` or
  `WorksheetRenderer.tsx` in full from a fresh chat —
  `scripts/check-no-bigfile-reads.mjs` blocks this from agent docs and
  the same constraint applies to chat investigation. Grep `// §` first.

## Per-work-unit summaries

### G1 — Pupil-facing auto-marking (Tier 1, M)

**Source praise:** Dr Frost ("auto-marking worksheets… instant
feedback"), Liveworksheets ("auto grading and instant feedback").

**What ships:**
- `client/src/lib/answerVerifier.ts` (new, ~250 LoC) — pure verifier
  for the four pupil-typeable answer formats: numeric (with unit
  tolerance via existing `mathsVerifier`), short-text (case-/
  whitespace-insensitive equality + a synonym-bag from the existing
  `markSchemeUpgrades.ts`), MCQ (single-letter), and structured
  (multi-mark with method-mark step matching). Returns
  `{ status: "correct"|"partial"|"incorrect", gainedMarks, feedback,
  hintTier?: 1|2|3, misconceptionId? }`. Reads
  `metadata.misconceptionLinks` (FEAT-PB7) so wrong-answer feedback
  can quote the diagnosed misconception.
- `client/src/pages/companion/[token].tsx` extended with an
  `<AnswerEntryPanel>` per question (input or radio depending on
  question type), a check button, an instant tick / cross result
  card, the diagnosed misconception (if linked), and a "Show hint
  ladder" disclosure that runs the existing `runHintLadder`.
- `client/src/lib/companion-answer-log.ts` (new, ~150 LoC) — pure
  per-pupil-per-worksheet localStorage log keyed by `companion_token
  + sectionIndex` so the pupil can resume mid-worksheet and the
  teacher (G7 in Phase H) can read aggregate completion later.

**Out of scope:** server-side persistence of pupil answers (Phase H
H1 takes this on, gated on the auto-mark surface shipping first);
adaptive next-question selection (Phase H H10).

### G2 — "Another one like this" (Tier 1, S)

**Source praise:** Dr Frost ("huge bank of question generators"),
Save My Exams ("unlimited practice").

**What ships:**
- `client/src/lib/anotherOneLikeThis.ts` (new, ~150 LoC) — given a
  worksheet section, picks a fresh stem on the same `specRef` from
  `curriculumBank.lookupBySpecRef` (preferring a different exemplar
  than the current question via
  `metadata.questionProvenance.sourceExemplarId`). Falls back to
  `aiGenerateWorksheet`-with-`specRef`-pin when the bank has one
  exemplar. Pure dispatcher; the LLM call lives in `ai.ts`.
- `client/src/components/AnotherOneButton.tsx` (new, ~80 LoC) —
  one-click button on every question card in `WorksheetRenderer.tsx`
  (teacher view only; `.no-print`); appends the new question as
  a sibling section with a "Replace original?" / "Delete original"
  affordance.
- `client/src/lib/ai.ts` extension — accept an optional
  `pinSpecRef?: string` + `excludeExemplarIds?: string[]` on
  `aiGenerateWorksheet` so the dispatcher can re-call the existing
  generator instead of duplicating prompt-build logic. Backwards
  compatible (defaults preserve existing behaviour).

### G3 — Lesson-archetype templates (Tier 1, M)

**Source praise:** Twinkl PlanIt (lesson plans embedded in scheme).

**What ships:**
- `client/src/lib/lessonArchetypes.ts` (new, ~200 LoC) — five frozen
  template definitions:
  - **Do-Now → I/We/You-Do** (Rosenshine-aligned starter +
    explicit-instruction sequence)
  - **5-a-day Drill** (mixed-skill warm-up)
  - **Mini-Quiz Recap** (5–10 MCQ recap of last lesson)
  - **Exit-Ticket** (3–5 stem-questions tagged to today's LO)
  - **Worked-Example → Mini-Whiteboard → Independent Practice**
    (mathematics gradual release)
  Each template emits an opinionated `aiGenerateWorksheet` brief —
  pre-fills `subject + topic + duration`, but the AI fills the stems.
- `client/src/components/ArchetypePickerDialog.tsx` (new, ~150 LoC)
  — modal opened from a new "Use a template" button on the
  Worksheets generator form; sets the form state and the
  `metadata.lessonArchetype` flag so downstream renderers + the
  audit panel can show "Built from: Do-Now → I/We/You-Do".
- `client/src/lib/promptSections/archetypeDirectives.ts` (new, ~100
  LoC) — per-archetype prompt block injected into
  `structuredSystemSections` so the LLM understands the archetype's
  pedagogy (e.g. "I do" must demonstrate one worked example, "We do"
  must invite class participation, "You do" must be independent).

### G4 — Procedural activity types (Tier 1, M)

**Source praise:** Twinkl resource breadth (wordsearch / crossword /
matching / cloze are top-downloaded primary formats).

**What ships:**
- `client/src/lib/proceduralActivities/wordsearch.ts` (new, ~200 LoC)
  — pure deterministic wordsearch generator (configurable grid size,
  diagonals on/off, seeded shuffle). Input: word list (often the
  Word Bank from a `vocab-reference` section). Output: `{ grid:
  string[][], placements: { word, row, col, dir }[] }`.
- `client/src/lib/proceduralActivities/crossword.ts` (new, ~300
  LoC) — pure clue-driven crossword. Input: `{ word, clue }[]`.
  Greedy interlocking algorithm seeded by question count; emits
  `{ grid, clues: { num, dir, clue }[] }`.
- `client/src/lib/proceduralActivities/matching.ts` (new, ~120 LoC)
  — left-column ↔ right-column matching with seeded shuffle of the
  right-column. Input: `{ left, right }[]`.
- `client/src/lib/proceduralActivities/cloze.ts` (new, ~150 LoC) —
  `__BLANK__`-token-driven cloze (the LLM emits the prose with
  blanks, this generator extracts the blanks, builds an answer
  table, and decorates the worksheet). Word-bank top of the cloze
  toggleable.
- `WorksheetSectionSchema` (in `shared/aiSchemas.ts`) — new optional
  `type` values: `"wordsearch"`, `"crossword"`, `"matching"`,
  `"cloze"`. Optional payload field `procedural?: { … }` carrying
  the generator output.
- `WorksheetRenderer.tsx` — four new render branches that pick up
  `section.procedural` and render the SVG / table / grid. Print CSS
  preserves layout. Answer-key page (G12) lists the answers
  separately.
- `client/src/lib/promptSections/proceduralActivityDirectives.ts`
  (new, ~80 LoC) — directs the LLM to emit a `wordsearch` / `cloze`
  section with the right `procedural` payload schema when a
  template (G3) requests one.

### G5 — 5-a-day daily-drill builder (Tier 1, S)

**Source praise:** Corbettmaths 5-a-day workbooks; Kahoot 2025 survey
on habit-building.

**What ships:**
- `client/src/lib/fiveADayBuilder.ts` (new, ~180 LoC) —
  deterministic builder. Input: `{ subject, yearGroup, weeks,
  skills: specRef[] }`. Output: 5 questions × 5 weekdays × `weeks`
  worksheets, each pulled from the past-paper question bank +
  curriculum-bank exemplars, mark-tariff-balanced (1 + 2 + 3 + 3 +
  5 = 14 marks per day by default), seeded by `(skills.join, weeks,
  seed)` so identical inputs produce identical packs (CI-stable).
- `client/src/pages/tools/FiveADayBuilder.tsx` (new, ~250 LoC) —
  self-contained page (no AI generation, like
  `CreateExamPaper.tsx`). Multi-select skills, weeks dropdown,
  weekday-on/off toggles, calculator policy, output as a multi-page
  PDF via `pdf-generator-v2`.
- Tool-registry entry under `hub: "revision"`; route in
  `client/src/App.tsx`; storyboard step in `RevisionHubSection.tsx`.

### G6 — Predicted-paper builder (Tier 1, S)

**Source praise:** MathsGenie predicted papers ("topics least likely
to come up… removed").

**What ships:**
- `client/src/lib/predictedPaperBuilder.ts` (new, ~200 LoC) —
  consumes the existing `pastPaperFrequencyAnchor.ts` (PR-19) and
  `getCandidatePoolForTopics`. Inverts the frequency weighting so
  the assembly biases toward topics that are **under**-represented
  in the supplied corpus of recent past papers. Reuses
  `createExamPaperBuilder.ts`'s mark-band budget logic via a thin
  adapter.
- `client/src/pages/tools/PredictedExamPaper.tsx` (new, ~200 LoC) —
  wraps the existing `CreateExamPaper.tsx` form with a "Past papers
  to anchor against" multi-select (years 2019–2024 by default) and
  a "Bias toward unseen topics" slider (0 = neutral / 1 = full
  inversion). Otherwise UI-identical.
- Two thin glue tests in `client/src/lib/__tests__/predictedPaperBuilder.test.ts`
  proving the bias actually moves the topic distribution and the
  output stays seed-deterministic.

### G9 — One-click three-tier ability differentiation (Tier 2, S)

**Source praise:** Twinkl PlanIt three-way differentiated worksheets.

**What ships:**
- `client/src/lib/threeTierDifferentiation.ts` (new, ~150 LoC) —
  wraps `aiDifferentiateExistingWorksheet` with three concurrent
  calls (LA / MA / HA), Promise.allSettled so one failure doesn't
  block the other two, returns `{ low, middle, high }` worksheets.
  Reuses the existing differentiate prompt. Server-side rate-
  limiting respects per-school throttle.
- `client/src/components/ThreeTierButton.tsx` (new, ~100 LoC) —
  added to the Worksheets toolbar; on click opens a tabbed preview
  with the three versions and a "Save all three to library" button
  that triggers the existing AppContext `saveWorksheet` × 3 with
  linked `metadata.differentiationGroup` so HoDs can find them
  together.

### G12 — Teacher-only answer-key separate page (Tier 3, XS)

**What ships:**
- `client/src/lib/answerKeySheet.ts` (new, ~120 LoC) — pure helper
  that consumes a worksheet and emits a sibling print-only
  worksheet structure containing **only** mark-scheme + method
  marks + diagnosed misconceptions, formatted as a compact
  reference (table or two-column).
- One additional checkbox on `PrintOptionsDialog.tsx` ("Print
  answer key as separate page") and the export pipeline appends
  the second page after the main worksheet.
- A4 portrait by default; honours all existing print-preset bleed
  + stapling-edge rules from `printPresets.ts`.

### G13 — Per-question timer (Tier 3, S)

**What ships:**
- `client/src/lib/questionTimer.ts` (new, ~80 LoC) — a tiny pure
  state machine `{ status: "idle"|"running"|"paused"|"finished",
  startedAt, elapsedMs, allocatedMs }`. Reducer-style API for the
  React component to drive.
- `<QuestionTimer />` component on each question card in the
  companion app (G1 dependency); uses the existing
  `metadata.estimatedTimeMinutes` budget for default allocation.
- "Mock-exam mode" toggle on the companion app that auto-starts
  every question's timer in sequence and locks editing-back when
  the time runs out.

### G14 — Parent letter / homework cover note (Tier 3, S)

**Source praise:** Twinkl parent letters + home-school records.

**What ships:**
- `client/src/lib/ai.ts` extension — `aiGenerateParentLetter()`
  (new, ~120 LoC) — takes `{ worksheet, schoolName, teacherName,
  weekStarting, parentTone: "supportive"|"firm"|"informative" }`,
  returns a one-page letter with a 3-bullet "How parents can
  help" section grounded in the worksheet's actual learning
  objective. Reuses the existing curriculum-authority preamble.
- `client/src/components/ParentLetterDialog.tsx` (new, ~120 LoC)
  — opens from the SendToMenu, generates inline preview, exports
  as a separate PDF page or appends to the main worksheet.
- Schema: `metadata.parentLetterAttached?: boolean`.

### G15 — Drag-handle section reorder (Tier 3, S)

**What ships:**
- `<DragHandleColumn />` added to the worksheet preview (teacher
  view, `.no-print`). Uses `@dnd-kit/core` (already in deps for
  Class Pack and Year planner UI). Reorders the
  `worksheet.sections` array in-place (the AppContext exposes the
  setter); the existing `enforceSectionQuestionCounts` validator
  no-ops on reorders since the count is unchanged.
- A "↓ Re-number questions" button after reorder so question
  numbers stay sequential.

### G17 — Worksheet favourites speed-dial (Tier 3, S)

**Source praise:** TpT "filing cabinet" pattern.

**What ships:**
- `server/db/schema.sql` — new `worksheet_favourite` table
  (school_id, user_id, worksheet_id, label, created_at). Append
  via `IF NOT EXISTS`.
- `server/routes/worksheetLibrary.ts` extension — `POST/DELETE
  /api/library/favourites/:id` endpoints.
- `client/src/contexts/AppContext.tsx` — `favourites` Map and
  `toggleFavourite()` action.
- Star-icon affordance on every library row + a "★ Favourites"
  filter chip + a sidebar "Recently favourited" speed-dial on the
  Worksheets generator page that pre-fills the form from a
  favourite worksheet's params.

## Branch + PR strategy

**Recommended:** single combined branch
`feat/phase-g-where-worksheet-meets-pupil`, one commit per work
unit, combined PR off `main`. Mirrors the PR #102 + PR-19..27
precedent. Diff size estimate: ~3,500 LoC across 30 files.

**Fallback if review burden too high:** split into 6 smaller PRs
along the dependency lines:
- PR-G-A: G18 + G19 + G20 (this PR; bug-fix prework + planning)
- PR-G-B: G3 + G4 + G14 (templates + activity types + parent letter
  — no shared deps)
- PR-G-C: G5 + G6 (bank-driven builders)
- PR-G-D: G2 + G9 (regen surfaces — share `ai.ts` extensions)
- PR-G-E: G12 + G15 + G17 (renderer + library polish)
- PR-G-F: G1 + G13 (companion-app interactivity)

Each `FEAT-G*.json` is sized to be its own PR if the team picks
this fallback.
