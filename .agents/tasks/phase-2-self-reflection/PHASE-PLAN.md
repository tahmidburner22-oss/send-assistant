# Phase 2 — Topic-specific Self-Reflection

Goal: every worksheet's "How Did I Do?" panel is **anchored to the actual
topic and the question types used**. No generic `I can ___.` placeholders,
no generic `Write one thing you learned today` exit ticket without the
topic name, no generic confidence-grid fallback that ignores what the
worksheet actually covered.

Phase 2 follows Phase 1's structural foundation. Phase 1 proved out the
single-source-of-truth pattern (one library file, one schema field, one
prompt block, one post-validator); Phase 2 reuses that pattern for the
Self-Reflection content surface.

## Why this matters (read before any change)

- **The user-facing problem.** Today, when the AI fails to emit topic-anchored
  reflection content, both the structured path
  (`ai.ts` ~line 2838: `WRITTEN_PROMPTS:\nI can ___.`) and the SEND fallback
  (`ai.ts` ~line 2835) emit a generic placeholder. The pupil sees
  `I can ___.` literally on the page and a content-free exit ticket. The
  reflection panel becomes pedagogical noise instead of a metacognition
  prompt.
- **The pedagogical north star.** A Year 9 worksheet on "Adding fractions"
  must have reflection statements like `I can find the common denominator
  before adding two fractions` — not `I can ___.`. A Year 11 English
  Literature worksheet on "Macbeth Act 1 Scene 5" must have
  `I can analyse Lady Macbeth's use of imperative verbs to summon the
  spirits` — not `I can apply what I have learned today`.
- **Non-negotiables (inherited from Phase 1).** UK English, UK statutory
  framework, SI units, no US contexts, command words drawn from the same
  awarding-body vocabulary used elsewhere on the worksheet.

## Hard sizing rules (apply to every PR in this phase)

- ≤ ~700 net lines changed.
- ≤ ~12 files touched.
- One coherent concept per PR — Phase 2 is one PR.
- Reads scoped to specific functions, not whole-file.
- **Never read `client/src/lib/ai.ts` or
  `client/src/components/WorksheetRenderer.tsx` in full from a fresh chat.**
  They are 4,500+ and 7,000+ lines respectively. Use `grep_search` to locate
  the named exports/functions, then read narrow ranges only. The handoff
  doc lists the exact line ranges and identifiers from the previous session.
- Sandbox is `INTEGRATIONS_ONLY` — npm install is blocked. Type-check and
  test runs happen on PR push via CI.

## Header to paste at the start of any fresh chat picking up this phase

```
Context: send-assistant repo, branch phase-2-self-reflection
         (or a sibling branch checked out from main).
Working on Phase 2 — Topic-specific Self-Reflection.
Live state: .agents/tasks/phase-2-self-reflection/SESSION-HANDOFF.md
Plan:      .agents/tasks/phase-2-self-reflection/PHASE-PLAN.md
Constraint: do not read ai.ts or WorksheetRenderer.tsx in full;
            grep for the named exports first and read narrow ranges only.
            Sandbox is INTEGRATIONS_ONLY — do not run npm install.
```

## PRs in this phase

| PR    | Title                                                                  | Status      |
| ----- | ---------------------------------------------------------------------- | ----------- |
| PH2   | Topic-specific Self-Reflection (builder + prompt + validator + tests)  | in progress |

Phase 2 is a single PR because the builder, prompt rule, validator and
renderer must ship together. If the diff exceeds ~700 net lines we split
at the validator / renderer boundary (the renderer is the smaller half).

## Definition-of-done

- [ ] `client/src/lib/selfReflectionBuilder.ts` is the single source of
      truth for the Self-Reflection surface. Pure / deterministic. Given
      `(topic, subject, year, sectionGroupsPresent, commandWordsUsed)` it
      returns `{ iCanStatements: string[], writtenPrompts: string[],
      exitTicket: string }`.
- [ ] `ai.ts` hard-coded fallbacks at the SEND `selfReflectionContent`
      block (currently `WRITTEN_PROMPTS:\nI can ___.\n…`) call into the
      builder rather than emitting placeholder strings.
- [ ] System prompt in `ai.ts:structuredSystemSections` SELF-REFLECTION
      block tightened: AI must emit at least 5 `I can …` statements that
      mention the topic noun and at least one of the worksheet's command
      words. The builder output is shown to the AI as a worked example
      (so the AI either matches the standard or its output is replaced).
- [ ] `client/src/lib/worksheetPostValidator.ts` adds
      `enforceSelfReflectionTopicAnchor(ws, opts)`. Pure / idempotent.
      Detects generic patterns (`I can ___`, `apply what I have learned`,
      `\u2026learned today` without the topic noun, fewer than 5 `I can`
      statements). When detected, replaces the section content with the
      builder output and stamps a warning. Never overwrites good
      topic-anchored content.
- [ ] `runWorksheetPostValidators` chain forwards `topic`, `subject`,
      `year` so the validator can resolve the builder. Both `ai.ts`
      callsites (structured + legacy) pass them.
- [ ] `WorksheetRenderer.tsx` `SelfReflectionSection` parser is extended
      (small) to display per-question command-word recall when the
      builder hands it in (`I can [Command] [topic-noun-phrase]`), with a
      graceful fallback to today's behaviour on legacy content.
- [ ] Tests in `server/tests/worksheetScrutiny.test.ts`:
      builder output is topic-anchored for at least four representative
      subjects (maths Y9, English Lit Y10 Macbeth, Biology Y11
      Bioenergetics, History KS3 Norman Conquest); validator no-op on
      good content; validator rewrites generic placeholder content; never
      overwrites good non-generic content.
- [ ] CI passes (`npm test` + `tsc --noEmit`) on the PR.

## Conventions inherited from Phase 1 (do NOT break)

- **Single source of truth.** The Self-Reflection surface gets its own
  library file (`selfReflectionBuilder.ts`). Never inline a hand-rolled
  `I can …` string anywhere else. The prompt scaffold, the validator
  fallback, and any future tests all import from one place.
- **Schema / prompt / validator alignment.** If a new schema field is
  introduced (e.g. a `selfReflectionTopicNoun` annotation), it must be
  added in lockstep to `aiSchemas.ts`, `worksheet-generator.ts`, and the
  per-question contract block in `ai.ts:structuredSystemSections`. We do
  NOT need a new schema field for Phase 2 (the builder reads
  `metadata.topic / subject / year / commandWordsUsed`); this clause is
  defensive in case scope drifts.
- **Renderer stays subject-aware.** Any new content render path must
  thread `subject` through `formatContent`'s `subject` option.
- **Sciences do NOT get the maths-only working-out box.** Phase 1 lock.
  Phase 2's `I can Calculate …` example output for sciences uses standard
  writing lines, not the dot-grid box.
- **Never invent spec codes.** Phase 1 lock.

## What lives in subsequent phases (do NOT scope-creep into Phase 2)

- Phase 3 — New `revision-tips` section type with examiner-voice 5-tip
  panel.
- Phase 4 — SEND content rules (the 21 profiles in
  `sendPromptFragments.ts:SEND_ADAPTATION_SPECS` get a second
  `worksheetRulesContent[]` array — non-cosmetic pedagogy).
- Phase 5 — Full curriculum-authority system prompt rewrite (the bigger
  CGP-grade prompt; this Phase ships only the Self-Reflection surface).
