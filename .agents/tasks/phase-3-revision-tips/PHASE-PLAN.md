# Phase 3 — Revision Tips (examiner-voice 5-tip panel)

Goal: every worksheet has a deterministic, topic-anchored "Examiner
Tips" panel — five short, examiner-voice tips that reference the
worksheet's actual command words, common mistakes, mark tariffs and
time budget. No generic AI prose, no "make sure you revise well", no
US-style "study habits" filler. Pupils should be able to read the panel
once and walk into the question knowing exactly what the marker is
looking for.

Phase 3 follows the Phase 1 / Phase 2 pattern verbatim:

```
single source of truth library
        ↓
    AI prompt rule + worked example
        ↓
    post-validator (rewrites generic, never overwrites good)
        ↓
    renderer component + section-toggle wiring
        ↓
    scrutiny tests
```

## Why this matters (read before any change)

- **The user-facing problem.** Today, after the worksheet questions and
  before / alongside Self Reflection, there is no examiner-voice tip
  surface. CGP-grade UK revision guides always carry a "Tips from the
  examiner" / "Watch out for…" callout — it surfaces the command word
  the question is actually testing, the misconception the awarding body
  has flagged on this topic, the method habit pupils lose marks on, the
  mark-scheme structure ("Level 4 needs a counter-argument") and a time
  tip anchored to the mark tariff. Without this, the worksheet is a
  question paper, not a revision resource.
- **The pedagogical north star.** A Year 9 worksheet on "Adding
  fractions" should carry tips like *"Always find the common
  denominator BEFORE you add. Two marks for method, one mark for the
  final answer in its simplest form."* — not *"Revise carefully and ask
  if you don't understand."* A Year 11 English Literature worksheet on
  "Macbeth Act 1 Scene 5" should carry tips like *"Quote in fewer than
  six words; embed the quote inside your sentence; analyse a single
  word from it."* — not *"Read the play first."*.
- **Non-negotiables (inherited from Phase 1).** UK English, UK
  awarding-body command words, SI units, no US contexts, no invented
  spec codes, sciences do NOT get the maths-only working-out box.

## Hard sizing rules (apply to this PR)

- ≤ ~700 net lines changed.
- ≤ ~12 files touched.
- One coherent concept per PR — Phase 3 is one PR.
- Reads scoped to specific functions, not whole-file.
- **Never read `client/src/lib/ai.ts` or
  `client/src/components/WorksheetRenderer.tsx` in full from a fresh chat.**
  They are 5,200+ and 8,200+ lines respectively. Use `grep_search` to locate
  the named exports/functions, then read narrow ranges only. The handoff
  doc lists the exact line ranges and identifiers from the previous session.
- Sandbox is `INTEGRATIONS_ONLY` — npm install is blocked. Type-check and
  test runs happen on PR push via CI.

## Header to paste at the start of any fresh chat picking up this phase

```
Context: send-assistant repo, branch phase-3-revision-tips
         (or a sibling branch checked out from main).
Working on Phase 3 — Revision Tips (examiner-voice 5-tip panel).
Live state: .agents/tasks/phase-3-revision-tips/SESSION-HANDOFF.md
Plan:      .agents/tasks/phase-3-revision-tips/PHASE-PLAN.md
Constraint: do not read ai.ts or WorksheetRenderer.tsx in full;
            grep for the named exports first and read narrow ranges only.
            Sandbox is INTEGRATIONS_ONLY — do not run npm install.
```

## PRs in this phase

| PR    | Title                                                                             | Status      |
| ----- | --------------------------------------------------------------------------------- | ----------- |
| PH3   | Revision Tips section (builder + section-type + prompt + post-validator + tests)  | in progress |

Phase 3 is a single PR because the builder, section-type wiring, prompt
rule, validator and renderer must ship together. If the diff exceeds
~700 net lines we split at the validator / renderer boundary.

## Definition-of-done

- [ ] `client/src/lib/revisionTipsBuilder.ts` is the single source of
      truth for the Revision-Tips surface. Pure / deterministic. Given
      `(topic, subject, year, sendKey, examBoard, commandWordsUsed,
      marksUsed, misconceptions)` it returns `{ tips: RevisionTip[],
      subtitle: string }` with exactly five tips covering the five
      categories: command-word, misconception, method, mark-scheme,
      time.
- [ ] `revision-tips` is added as a first-class section type to the
      `WorksheetSection` union in `worksheet-generator.ts`, the
      `ALL_SECTIONS` list and section-toggle UI in `Worksheets.tsx`,
      the `REMOVABLE_SECTION_PRIORITY` ladder, the renderer's palette
      table, and the `isAlwaysStudentVisible` allow-list.
- [ ] `WorksheetRenderer.tsx` adds a `RevisionTipsSection` component
      that renders the marker-block content as a numbered tip card
      panel with house-style accent border, no icons. Dispatched
      immediately before `self-reflection`. Subject- and SEND-aware
      via the parent worksheet metadata.
- [ ] `ai.ts:structuredSystemSections` adds a REVISION TIPS rule and
      a `wantRevisionTips` flag mirroring `wantSelfReflection`. The
      structured-path emit pushes a `{"title":"Revision Tips",
      "type":"revision-tips","teacherOnly":false,"content":"…"}` line
      whose content is the deterministic builder output (so the AI
      either matches it or its output is replaced by the validator).
- [ ] `client/src/lib/worksheetPostValidator.ts` adds
      `enforceRevisionTipsPresence(ws, opts)`. Pure / idempotent.
      Detects generic / off-topic content (fewer than 5 tips, no
      command-word reference, no topic-noun mention, "revise carefully"
      / "study hard" generic prose). When detected, replaces with
      builder output. When the section is missing entirely, does NOT
      auto-insert (opt-in by section selector — same lock as
      Self-Reflection).
- [ ] `runWorksheetPostValidators` chain forwards `commandWordsUsed`
      and `misconceptions` so the validator can resolve the builder.
      Both `ai.ts` callsites pass them. (`subject / year / examBoard /
      topic` are already plumbed since Phase 1/2.)
- [ ] Tests in `server/tests/worksheetScrutiny.test.ts`:
      builder topic-anchors on at least four representative subjects
      (maths Y9, English Lit Y10 Macbeth, Biology Y11 Bioenergetics,
      History KS3 Norman Conquest); builder emits five distinct tip
      categories; per-subject command-word selection picks the right
      verb; misconception tip surfaces a real misconception when one
      is supplied; validator no-op on good content; validator rewrites
      on generic; never overwrites good non-generic content.
- [ ] CI passes (`npm test` + `tsc --noEmit`) on the PR.

## Conventions inherited from Phases 1 and 2 (do NOT break)

- **Single source of truth.** The Revision-Tips surface lives in
  `revisionTipsBuilder.ts`. Never inline a hand-rolled tip string
  anywhere else in the codebase. The prompt scaffold, the validator
  fallback, the renderer's pad-fallback, and any future tests all
  import from one place.
- **Schema / prompt / validator alignment.** Phase 3 introduces no new
  per-section schema field — the builder reads metadata + section
  context. If a future phase needs one (e.g. a per-tip `tipCategory`
  annotation), mirror it across `aiSchemas.ts` (Zod),
  `worksheet-generator.ts` (interface), and the per-question contract
  block in `ai.ts`.
- **Renderer stays subject-aware** through `formatContent`'s `subject`
  option. `RevisionTipsSection` threads `topic` + `subject` from
  `worksheet.metadata`, the same way `SelfReflectionSection` was
  upgraded in Phase 2.
- **Sciences do NOT get the maths-only working-out box.** Phase 1 lock.
  The method-tip text differs by subject family (maths: "show every
  step"; sciences: "include units before rounding"; humanities: "anchor
  every claim to a date or source"; English: "embed the quote, then
  analyse a single word") — but the section never carries a working-
  out affordance.
- **Never invent spec codes.** Phase 1 lock. Tips reference `specRef`
  only when one already exists on a question section.

## What lives in subsequent phases (do NOT scope-creep into Phase 3)

- Phase 4 — SEND content rules (the 21 profiles in
  `sendPromptFragments.ts:SEND_ADAPTATION_SPECS` get a second
  `worksheetRulesContent[]` array — non-cosmetic pedagogy).
- Phase 5 — Full curriculum-authority system prompt rewrite (the bigger
  CGP-grade prompt; this Phase ships only the Revision-Tips surface).
