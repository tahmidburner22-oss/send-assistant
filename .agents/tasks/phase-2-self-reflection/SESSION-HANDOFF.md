# Phase 2 — Session Handoff

This file is the **resume point** for any fresh chat picking up Phase 2.
Read it first, then `PHASE-PLAN.md`, then proceed.

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

(none yet — branch just opened)

## What is left (in this branch)

In rough order. Update this list at the end of each working chunk.

- **Task A — Builder.** New `client/src/lib/selfReflectionBuilder.ts`.
  Pure / deterministic. Inputs: `{ topic, subject, year, sectionGroups,
  commandWordsUsed }`. Outputs: `{ iCanStatements: string[5],
  writtenPrompts: string[2], exitTicket: string }`. Internally uses a
  small per-subject command-word default table (Calculate / Solve /
  Describe / Explain / Analyse / Evaluate / etc.) drawn from awarding-
  body command-word lists. Falls back to a topic-noun extraction helper
  when `commandWordsUsed` is empty.

- **Task B — Prompt fallback wiring.** In `client/src/lib/ai.ts` find the
  `selfReflectionContent` block (currently around line 2810–2845 — search
  for `WRITTEN_PROMPTS:\nI can ___.`). Replace the hand-coded fallback
  strings with calls into the builder. Tighten the SELF REFLECTION rule
  in `structuredSystemSections` so the AI is shown a worked example built
  from the builder and told it must produce ≥5 `I can …` statements that
  mention the topic noun and at least one of the worksheet's command
  words.

- **Task C — Validator.** New `enforceSelfReflectionTopicAnchor` in
  `client/src/lib/worksheetPostValidator.ts`. Pure / idempotent.
  Detects generic patterns:
  * Literal `I can ___` placeholder text
  * Phrases matching `/apply what I have learned/i`
  * Fewer than 5 `I can …` statements
  * Exit ticket lacking the topic noun
  When any of those trip, replace the section content with the builder
  output and stamp `metadata.postValidatorWarnings` with a clear message.
  When the AI emits good topic-anchored content, no-op. Plumbed into
  `runWorksheetPostValidators` chain after the existing Phase 1 spec-
  anchor validator.

- **Task D — `runWorksheetPostValidators` plumbing.** Extend
  `PostValidatorOptions` with `topic?: string`, `subject?: string`,
  `year?: string` (subject + year may already be there — verify, do not
  duplicate). Both `ai.ts` callsites (structured + legacy) forward them.

- **Task E — Renderer extension.** Tiny addition to
  `WorksheetRenderer.tsx:SelfReflectionSection`. When the builder emits
  `I can <Command> <topic noun phrase>` statements with a leading command
  word (Calculate / Describe / Analyse / etc.), preserve the bold style
  on the command word in display. Graceful fallback to today's plain
  rendering on legacy content.

- **Task F — Tests.** Add to `server/tests/worksheetScrutiny.test.ts`:
  * `selfReflectionBuilder` produces topic-anchored statements for
    maths Y9 "Adding fractions", English Lit Y10 "Macbeth Act 1 Sc 5",
    Biology Y11 "Bioenergetics", History KS3 "Norman Conquest". Each
    test asserts ≥5 statements, every statement contains the topic noun
    or its lemma.
  * `enforceSelfReflectionTopicAnchor` no-op on good content.
  * `enforceSelfReflectionTopicAnchor` rewrites a generic worksheet to
    builder output and stamps a warning.
  * `enforceSelfReflectionTopicAnchor` never overwrites good
    non-generic content (≥5 `I can …` statements, all containing topic
    or lemma).

- **Task G — CI run.** `npm test` + `tsc --noEmit` will run on PR push.
  Sandbox cannot run them locally (`INTEGRATIONS_ONLY`). If CI raises any
  failures, fix them on this branch.

- **Task H — Open the PR.** Title:
  `Phase 2 — Topic-specific Self-Reflection (builder + prompt + post-validator)`

## Conventions to honour (inherited from Phase 1)

- **Single source of truth.** The Self-Reflection surface gets its own
  library file (`selfReflectionBuilder.ts`). No hand-rolled `I can …`
  strings anywhere else.
- **Schema / prompt / validator alignment.** Phase 2 does not introduce
  a new schema field, but if scope drifts and one is added, mirror it
  across `aiSchemas.ts` (Zod), `worksheet-generator.ts` (interface),
  and the per-question contract block in `ai.ts`.
- **Renderer stays subject-aware** through `formatContent`'s `subject`
  option.
- **Sciences do NOT get the maths-only working-out box.** Phase 1 lock.
- **Never invent spec codes.** Phase 1 lock.

## Files modified so far (commit before context dies)

```
.agents/tasks/phase-2-self-reflection/PHASE-PLAN.md
.agents/tasks/phase-2-self-reflection/SESSION-HANDOFF.md   (this file)
.agents/tasks/phase-1-curriculum-structure/SESSION-HANDOFF.md  (bookkeeping: marked SHIPPED)
```
