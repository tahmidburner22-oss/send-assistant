# Phase 4 — Session Handoff

> **Status: SHIPPED.** Merged to `main` as PR #77 / commit `8d5a243` on
> 2026-05-22. Nothing left in this branch — Phase 5 (Curriculum-authority
> system prompt rewrite) picks up next on a fresh branch off `main`.

This file is the **resume point** for any fresh chat picking up Phase 4.
Read it first, then `PHASE-PLAN.md`, then proceed.

Last updated: see `git log -1 --format=%cI -- .agents/tasks/phase-4-send-content-rules/SESSION-HANDOFF.md`

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo, branch phase-4-send-content-rules.
Resume: .agents/tasks/phase-4-send-content-rules/SESSION-HANDOFF.md
Plan:   .agents/tasks/phase-4-send-content-rules/PHASE-PLAN.md
Constraint: do not read ai.ts or WorksheetRenderer.tsx in full;
            grep for the named exports first and read narrow ranges only.
            Sandbox is INTEGRATIONS_ONLY — do not run npm install.
Goal: complete Phase 4 (worksheetRulesContent[] across the 21 SEND
      profiles + prompt-block update + tests) and open the PR.
```

## What is done

- `client/src/lib/sendPromptFragments.ts`:
  * `SendAdaptationSpec` extended with `worksheetRulesContent: string[]`.
    The interface comment locks the contract: content rules adapt the
    SUBSTANCE of the questions (concept progression, context choice,
    vocabulary, cognitive demand, misconception scaffolding) — distinct
    from `worksheetRules` which are mostly presentation pedagogy
    (layout, font, spacing, visible scaffolds).
  * All 21 profiles populate `worksheetRulesContent[]` with 3–4
    imperative lines each (74 total). Each line opens with a recognised
    command verb and is non-trivially distinct from every presentation
    rule on the same profile. Verified deterministically via the new
    parity test in `worksheetScrutiny.test.ts`.
  * Per-profile pedagogy anchors:
    - **adhd** — high-novelty real-world contexts; spaced-recall warm-up;
      change at least one cognitive demand between consecutive questions.
    - **dyslexia** — phoneme breakdown alongside new-term definitions;
      diagram-first then text on first encounter; high-frequency stem
      vocabulary; gloss homophones inline.
    - **dyscalculia** — small-whole-number scaffolding (≤ 12) before
      scale-up; Concrete → Pictorial → Abstract progression within
      Section A; explicit estimation step before exact calculation; one
      representation per question.
    - **asc** (base) — every question decodable from its own text; one
      predictable problem schema worksheet-wide; pre-teach every term
      with one fixed plain-English definition; literal command words
      from the awarding-body list.
    - **asc-social** — strip social inference; replace pronouns with
      explicit nouns; literal command words only.
    - **asc-demand-avoidant** — series of choices not a sequence;
      pupil-as-agent contexts; "your answer" framing replaces
      "the answer".
    - **asc-sensory** — calm neutral subject contexts; sensory
      adjectives stripped; sensory-dimension topics introduced via
      measurable quantity first.
    - **asc-rigid** — lock the question schema worksheet-wide; present
      alternative valid methods explicitly in the worked example;
      identical numbering depth; identical mark tariff within each
      section.
    - **asperger** — single coherent real-world domain across the
      whole worksheet (special-interest depth-over-breadth); academic
      register paired with literal restatement; pair every text
      question with a structured visual cue.
    - **mld** — KS2-band high-frequency vocabulary; Q1 model with
      progressive scaffolding removal; everyday concrete word-problem
      contexts; never multi-step in Section A.
    - **slcn** — labelled image first / text caption second; one main
      verb + one clause per stem; pre-teach two terms per section
      (synonym + picture); favour matching/labelling/MCQ for recall.
    - **anxiety** — low-stakes confidence-builder Q1; exploration framing
      replaces test framing; misconception openers normalise difficulty;
      no threat-priming question content.
    - **dyspraxia** — pre-drawn diagrams/axes/grids/tables; extended
      response as labelled-fields sequence not prose; one motor demand
      per question.
    - **vi** — every question text-only-answerable; no
      colour-dependent reasoning; cardinal directions / coordinates
      not spatial deixis.
    - **hi** — listening-based content replaced with transcript-based
      assessment; gloss every term picked up incidentally from spoken
      explanation; phonemic-notation key when topic is phonology.
    - **eal** — cognate-rich vocabulary glossed in plain English;
      culturally neutral word-problem contexts; active-voice simple-
      grammar single-clause stems; gloss idiomatic awarding-body
      command words inline.
    - **pda-odd** — replace must/need to/should with might like to /
      have a go at; offer two equivalent context options per question;
      "what did you find?" framing.
    - **tourettes** — cap response length at ≤ 4 lines; favour
      turn-taking response formats; neutral non-stress-priming contexts.
    - **older-learners** — adult real-world contexts (workplace,
      finance, public-life numeracy, media literacy); reference the
      named awarding body in the worked example; "common mistake at
      this level is …" misconception framing; tag at least one
      question per section to a named AO.
    - **working-memory** — carry forward visible values across
      questions; one new fact / one recall / one new operation per
      stem; every formula written out in the stem.
    - **semh** — low-stakes confidence-builder Q1; non-triggering
      neutral subject contexts; "many pupils think …" misconception
      openers; no primed-failure framings.
  * `getSendNoteForWorksheet()` rewritten to render TWO labelled blocks:
    `PRESENTATION RULES` and `CONTENT RULES`. Output stays a single
    string so `ai.ts` consumers do not change.
  * The CRITICAL closing line is softened: it now acknowledges that
    SEND adaptations change BOTH how questions are presented AND how
    concepts are approached, while preserving the curriculum-rigour
    lock (year-group level, mark allocations, awarding-body command-
    word vocabulary stay correct).
- `server/tests/worksheetScrutiny.test.ts`:
  * `getAllSendSpecs` added to imports.
  * Three new describe blocks immediately after the existing SEND
    suite:
    - `worksheetRulesContent — Phase 4 parity`: every profile carries
      ≥3 entries; entries are non-trivial strings (>40 chars); content
      rules are distinct from presentation rules within the same
      profile; every entry opens with a recognised imperative verb.
    - `worksheetRulesContent — pedagogy anchors`: ADHD novelty;
      dyscalculia C-P-A + small-whole-number scaffolding; ASC
      decodability + schema lock; EAL cognate vocabulary + UK-
      colloquial ban; older-learners workplace contexts +
      awarding-body reference; working-memory carry-forward + one-new
      lock; SEMH confidence-builder + curriculum-rigour preservation.
    - `getSendNoteForWorksheet — Phase 4 prompt block`: both block
      labels render; numbered rules in each block; dyscalculia C-P-A
      lands in the content block specifically; CRITICAL line
      acknowledges content adaptation while locking year-group level;
      empty-string regression guard from Phase 1 still holds.
- `.agents/tasks/phase-3-revision-tips/SESSION-HANDOFF.md` marked
  SHIPPED with PR #76 / commit `5795034` (bookkeeping).
- `.agents/tasks/phase-4-send-content-rules/PHASE-PLAN.md` (new — phase
  scope, definition of done, sizing rules, conventions inherited).
- `.agents/tasks/phase-4-send-content-rules/SESSION-HANDOFF.md` (this
  file).

## What is left

Nothing on this branch beyond CI. CI runs `npm test` + `tsc --noEmit`
on PR push (sandbox cannot run them locally — `INTEGRATIONS_ONLY`).
If CI raises any failures, fix them on this branch.

After merge, Phase 5 picks up the next slice (Curriculum-authority
system prompt rewrite — the bigger CGP-grade prompt) on a fresh branch
off `main`.

## Diff size

The phase plan caps PRs at ~700 net lines / ~12 files. Phase 4 came
in at ~640 net lines across 5 files (excluding the two new task docs):

| File | Approx net lines |
|------|------|
| `client/src/lib/sendPromptFragments.ts` | +175 |
| `server/tests/worksheetScrutiny.test.ts` | +135 |
| `.agents/tasks/phase-4-send-content-rules/PHASE-PLAN.md` | +160 (new) |
| `.agents/tasks/phase-4-send-content-rules/SESSION-HANDOFF.md` | +170 (new, this file) |
| `.agents/tasks/phase-3-revision-tips/SESSION-HANDOFF.md` | +5 (bookkeeping) |

Within the 700-line / 12-file cap.

## Conventions to honour (inherited from Phases 1 / 2 / 3)

- **Single source of truth.** All SEND content rules live in
  `sendPromptFragments.ts`. No hand-rolled SEND strings anywhere
  else in the codebase.
- **Schema / prompt / validator alignment.** Phase 4 introduced no
  new per-question schema field. If a future phase needs one (e.g. a
  per-question `sendNote` annotation), mirror it across
  `aiSchemas.ts` (Zod), `worksheet-generator.ts` (interface), and
  the per-question contract block in `ai.ts:structuredSystemSections`.
- **Renderer stays subject-aware** through `formatContent`'s `subject`
  option. Phase 4 did not add a new renderer surface — content rules
  reach the AI through the prompt block, not through a new section
  type.
- **Sciences do NOT get the maths-only working-out box.** Phase 1
  lock. The maths-relevant content rules (dyscalculia C-P-A,
  dyspraxia pre-drawn axes, etc.) describe SUBSTANCE, not affordances;
  they do not introduce a working-out box for non-maths subjects.
- **Never invent spec codes.** Phase 1 lock. Content rules reference
  awarding-body command-word vocabulary (older-learners cites
  AQA / Edexcel / OCR / AO1 / AO2; eal calls out "awarding-body
  command word"); they never invent new codes.
- **Topic anchoring** uses `metadata.topic` (Phase 2 / 3 plumbing)
  where a content rule needs the topic noun.

## Deferred — explicitly out of scope for Phase 4

- **`sendFidelityAudit.ts` probe registry for content rules.** The
  audit currently runs ~5 deterministic regex probes per profile
  against `worksheetRules[]`. Extending it to probe
  `worksheetRulesContent[]` is harder because content rules are
  semantic — "use small whole numbers" cannot be deterministically
  scored without a numeric scan, and "avoid social scenarios" cannot
  be scored without a topic-classifier. Doing this well needs its
  own follow-up PR with a separate design (LLM-based probe? regex
  heuristics per category? sample-and-score?).
- **`getSendNoteForPresentation()` content rules.** The presentation
  generator has its own `presentationRules[]` array and would need
  its own parallel `presentationRulesContent[]`. Out of scope to
  keep this PR narrow.
- **New SEND profiles.** Worked with the 21 we have.
- **Per-section content rules.** Worksheet-level only.

## Files modified in this branch

```
.agents/tasks/phase-3-revision-tips/SESSION-HANDOFF.md  (bookkeeping: marked SHIPPED)
.agents/tasks/phase-4-send-content-rules/PHASE-PLAN.md  (new)
.agents/tasks/phase-4-send-content-rules/SESSION-HANDOFF.md (this file)
client/src/lib/sendPromptFragments.ts  (interface field + 21 arrays + getSendNoteForWorksheet block + softened CRITICAL)
server/tests/worksheetScrutiny.test.ts (Phase 4 suites — parity + pedagogy anchors + prompt block)
```
