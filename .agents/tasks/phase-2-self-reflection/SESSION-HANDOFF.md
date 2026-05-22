# Phase 2 — Session Handoff

> **Status: SHIPPED.** Merged to `main` as PR #75 / commit `6688c31` on
> 2026-05-22. This file is kept for the historical record so subsequent
> phases can see exactly which conventions were locked in. Do not edit
> the conventions block — Phase 3+ inherits it verbatim.

Last updated: see `git log -1 --format=%cI -- .agents/tasks/phase-2-self-reflection/SESSION-HANDOFF.md`

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo, branch phase-2-self-reflection.
Resume: .agents/tasks/phase-2-self-reflection/SESSION-HANDOFF.md
Plan:   .agents/tasks/phase-2-self-reflection/PHASE-PLAN.md
Constraint: do not read ai.ts or WorksheetRenderer.tsx in full;
            grep for the named exports first and read narrow ranges only.
            Sandbox is INTEGRATIONS_ONLY — do not run npm install.
Goal: complete Phase 2 (topic-specific Self-Reflection — builder +
      prompt + post-validator + renderer + tests) and open the PR.
```

## What is done

- `client/src/lib/selfReflectionBuilder.ts` — new single source of truth.
  Public API: `buildSelfReflection`, `renderSelfReflectionAsMarkerBlock`,
  `isGenericSelfReflection`, `extractTopicNounPhrase`, `pickCommandWords`.
  Pure / deterministic. Mirrors the five SEND-register branches in
  `ai.ts:2810` (tickBoxOnly / sentenceStarter / emotional / older /
  standard). Per-subject command-word defaults drawn from the awarding-
  body command-word lists already present on past-paper questions in
  `questionBank{Maths,Biology,Chemistry,English}.ts`. Acronym-preserving
  topic-noun extractor (GDPR / NHS / BBC / GCSE / KS3 stay uppercase).
- `client/src/lib/ai.ts`:
  * Imports `buildSelfReflection` + `renderSelfReflectionAsMarkerBlock`
    alongside the Phase 1 `specPointTaxonomy` import block.
  * SEND fallback ladder at the structured-path
    `selfReflectionContent` block (45 lines of inline string literals,
    one per SEND branch — including the literal placeholder
    `WRITTEN_PROMPTS:\nI can ___.\n`) replaced with a single
    `buildSelfReflection({...})` call. The builder mirrors the same
    five SEND branches internally and ALWAYS emits topic-anchored
    content. Net: -45 lines, plus 1 bug fixed at source.
  * SELF REFLECTION rule in `structuredSystemSections` tightened:
    AI must emit 5 `I can …` statements that name `${params.topic}`
    and start with a real command word. Explicit ban on `I can ___`
    and `I can apply what I have learned`. Exit ticket and written
    prompts must mention the topic.
  * Both `runWorksheetPostValidators(...)` callsites (structured +
    legacy) now forward `topic: params.topic` so the new validator
    can resolve the topic anchor.
- `client/src/lib/worksheetPostValidator.ts`:
  * `PostValidatorOptions` extended with `topic?: string`.
  * Imports `buildSelfReflection`, `renderSelfReflectionAsMarkerBlock`,
    `isGenericSelfReflection` from `./selfReflectionBuilder`.
  * New `enforceSelfReflectionTopicAnchor(ws, opts)` — pure /
    idempotent. Finds the pupil-facing Self-Reflection section, runs
    the generic-content detector, replaces with deterministic builder
    output when generic, no-ops when good. Mirrors the
    `enforceSpecAnchorPresence` pattern (no-op + warn when topic is
    unknown so the bug stays visible).
  * Wired into `runWorksheetPostValidators` chain immediately after
    the Phase 1 spec-anchor validator.
- `client/src/components/WorksheetRenderer.tsx`:
  * `SelfReflectionSection` signature extended with optional `topic?`
    + `subject?` props. Threaded from `worksheet.metadata` at the
    callsite (line 7055).
  * Pad-to-3 fallback (the literal `I can apply what I have learned
    today` string the original Phase 2 plan called out) now uses
    `selfReflectionBuilder` when topic is available. Skips duplicates
    of statements the AI already emitted; only falls back to the
    legacy generic string when topic is genuinely unknown.
  * Topic rows now bold the leading command word on builder-shaped
    `I can <Verb> …` rows. Rows that don't match the pattern render
    as-is — no behavioural regression.
  * Adds `buildSelfReflection` import next to the Phase 1
    `worksheetSectionTargets` import.
- `server/tests/worksheetScrutiny.test.ts` — new Phase 2 test suites:
  * `extractTopicNounPhrase` — article-prefix stripping, proper-noun
    preservation, all-caps acronym preservation, multi-word common-
    noun lower-casing, empty input.
  * `pickCommandWords` — echo / dedupe / pad / per-subject defaults.
  * `buildSelfReflection` — topic anchoring on the four representative
    subjects from the phase plan (maths Y9, English Lit Y10 Macbeth,
    Biology Y11 Bioenergetics, History KS3 Norman Conquest), SEND
    register tuning (sentence-starter / emotional / older), purity.
  * `isGenericSelfReflection` — placeholder detection, low-count
    detection, topic-free exit-ticket detection, builder-output
    no-trigger.
  * `enforceSelfReflectionTopicAnchor` — rewrite happy path, no-op on
    good content, never-overwrite invariant, idempotency, no-section
    no-op, no-topic warn-and-skip, teacher-only ignore, SEND register
    inferred from `opts.sendNeed`.

## What is left (in this branch)

Nothing. PR #75 is merged. Phase 3 picks up the next slice (Revision
Tips — examiner-voice 5-tip panel) on a fresh branch off `main` — see
`.agents/tasks/phase-3-revision-tips/`.

## Codex review feedback addressed (PR #75)

Two P2 review comments on `client/src/lib/selfReflectionBuilder.ts`:

- **`startsWithProperNoun` was too greedy.** The original heuristic
  treated every Title-Case-led topic as a proper noun, so common
  curriculum titles like "Adding Fractions", "Quadratic Equations"
  and "Photosynthesis" were preserved in title case and leaked into
  mid-sentence "I can …" templates. Replaced with `isProperNounLed(t)`
  combining a curated whitelist of UK-curriculum proper-noun heads
  (Macbeth / Newton / Pythagoras / Christianity / Norman / …) with
  structural cues (possessive apostrophe-s, Act/Scene/Chapter/Volume
  references, "X and Y" between Title-Case words). Default is now
  lowercase — proper-noun preservation is the explicit case.
- **Substring topic-anchor false positives on short acronyms.** Topic
  `"IT"` substring-matched `write`/`explain`; topic `"AI"` substring-
  matched `explain`/`fail`. Generic content slipped through as
  topic-anchored. Added a `containsNeedle` helper that requires a
  word-boundary match for needles `< 4` chars and keeps substring
  matching for longer needles (so plurals/possessives like
  `fraction`→`fractions`, `Macbeth`→`Macbeth's` still anchor).
  Applied in both the `nounRoot` and `nounWords` paths of
  `isGenericSelfReflection`.

Tests added in `server/tests/worksheetScrutiny.test.ts`:

- `extractTopicNounPhrase` lower-cases single-word common-noun topics
  (`Photosynthesis`, `Respiration`, `Mitosis`, `Bioenergetics`,
  `Trigonometry`).
- `extractTopicNounPhrase` preserves apostrophe-led possessive proper
  nouns even outside the whitelist (`Murphy's Law`,
  `Pythagoras' Theorem`).
- `extractTopicNounPhrase` preserves Act/Scene/Chapter references even
  when the head word isn't whitelisted (`Animal Farm Chapter 4`,
  `The Tempest Act 2 Scene 1`).
- `isGenericSelfReflection` does not falsely anchor short acronym
  topics (`IT`, `AI`, `UK`) against incidental substrings in
  `write`/`explain`/`find`.
- `isGenericSelfReflection` still anchors correctly when the short
  acronym appears as a genuine standalone token.

## Conventions to honour (inherited from Phase 1)

- **Single source of truth.** The Self-Reflection surface lives in
  `selfReflectionBuilder.ts`. No hand-rolled `I can …` strings anywhere
  else in the codebase.
- **Schema / prompt / validator alignment.** Phase 2 introduced no new
  schema field. If a future phase needs one (e.g. a per-section
  `selfReflectionTopicNoun`), mirror it across `aiSchemas.ts` (Zod),
  `worksheet-generator.ts` (interface), and the per-question contract
  block in `ai.ts`.
- **Renderer stays subject-aware** through `formatContent`'s `subject`
  option. Phase 2 also threads `topic` to `SelfReflectionSection` —
  follow that pattern when more sections become topic-aware.
- **Sciences do NOT get the maths-only working-out box.** Phase 1 lock.
- **Never invent spec codes.** Phase 1 lock. Same applies if Phase 2's
  builder ever surfaces specRef.

## Files modified in this branch

```
.agents/tasks/phase-1-curriculum-structure/SESSION-HANDOFF.md  (bookkeeping: marked SHIPPED)
.agents/tasks/phase-2-self-reflection/PHASE-PLAN.md            (new)
.agents/tasks/phase-2-self-reflection/SESSION-HANDOFF.md       (this file)
client/src/lib/selfReflectionBuilder.ts                        (new — 459 lines)
client/src/lib/ai.ts                                           (import + replace fallback ladder + tighten rule + plumb topic)
client/src/lib/worksheetPostValidator.ts                       (+ enforceSelfReflectionTopicAnchor + plumb topic)
client/src/components/WorksheetRenderer.tsx                    (SelfReflectionSection topic-aware pad + bold verb)
server/tests/worksheetScrutiny.test.ts                         (Phase 2 test suites — 396 lines)
```
