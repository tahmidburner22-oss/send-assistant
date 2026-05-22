# Phase 4 — SEND content rules (non-cosmetic pedagogy)

Goal: every SEND profile in `client/src/lib/sendPromptFragments.ts`
ships a parallel `worksheetRulesContent[]` array so that the AI's
SEND adaptation reaches the **substance of the questions**, not only
their presentation. Today, the `worksheetRules[]` field is dominated
by formatting imperatives (bold the action verb, 1.5× line spacing,
12-word sentences, tick-box reflection). The closing line of the
SEND note even says *"SEND adaptations change HOW questions are
presented — never the academic rigour."* That stance under-serves
SEND pupils — a real adaptation also reaches the concrete-pictorial-
abstract progression, the choice of context, the vocabulary that gets
pre-taught, and the cognitive demand on each question.

Phase 4 adds the second array (one per profile), updates the prompt
block to render both lists labelled separately, softens the CRITICAL
closing line so it acknowledges content-level adaptations while
preserving the curriculum-rigour lock, and ships tests.

Phase 4 follows the Phase 1 / Phase 2 / Phase 3 pattern verbatim:

```
single source of truth library  ← already exists (sendPromptFragments.ts)
        ↓                          extend with worksheetRulesContent[]
    AI prompt rule + worked example
        ↓
    post-validator (rewrites generic, never overwrites good)
        ↓                          NOT extended this phase — see "deferred" below
    renderer component + section-toggle wiring
        ↓                          NOT touched — content rules don't need a UI surface
    scrutiny tests
```

## Why this matters (read before any change)

- **The user-facing problem.** Today, when a teacher selects a SEND
  profile, the AI is told "make sentences shorter, bold the verbs,
  add a brain break". It is NOT told "use small whole numbers before
  scale-up", "embed every command word in a literal context",
  "pre-teach two everyday-English cognates of the key term", "avoid
  social-emotional scenarios in word problems". The result is
  presentation that looks adapted but content that does not.
- **The pedagogical north star.** A Year 9 dyscalculic pupil's
  worksheet on "Adding fractions" should open with `1/2 + 1/4` (small
  numerators, denominators that are factors of each other) BEFORE
  scaling up — not present `7/12 + 5/8` first because the prompt only
  said to bold the verb. An ASC pupil's English worksheet on Macbeth
  should ask `Identify the imperative verb in the line "Come, you
  spirits"` — literal, decodable — not `What does Lady Macbeth's
  language tell us about her feelings?` (theory-of-mind inference)
  just because the prompt only said "use neutral contexts".
- **Non-negotiables (inherited from Phase 1).** UK English, UK
  awarding-body command words, SI units, no US contexts, no invented
  spec codes, sciences do NOT get the maths-only working-out box.

## Hard sizing rules (apply to this PR)

- ≤ ~700 net lines changed.
- ≤ ~12 files touched.
- One coherent concept per PR — Phase 4 is one PR.
- Reads scoped to specific functions, not whole-file.
- **Never read `client/src/lib/ai.ts` or
  `client/src/components/WorksheetRenderer.tsx` in full from a fresh chat.**
  Phase 4 does not need to edit either of them — `ai.ts` consumes
  `getSendNoteForWorksheet` already and the rendered string carries
  whatever blocks the function returns. Use `grep_search` only for
  spot checks.
- Sandbox is `INTEGRATIONS_ONLY` — npm install is blocked. Type-check
  and test runs happen on PR push via CI.

## Header to paste at the start of any fresh chat picking up this phase

```
Context: send-assistant repo, branch phase-4-send-content-rules
         (or a sibling branch checked out from main).
Working on Phase 4 — SEND content rules (non-cosmetic pedagogy).
Live state: .agents/tasks/phase-4-send-content-rules/SESSION-HANDOFF.md
Plan:      .agents/tasks/phase-4-send-content-rules/PHASE-PLAN.md
Constraint: do not read ai.ts or WorksheetRenderer.tsx in full;
            grep for the named exports first and read narrow ranges only.
            Sandbox is INTEGRATIONS_ONLY — do not run npm install.
```

## PRs in this phase

| PR    | Title                                                                   | Status      |
| ----- | ----------------------------------------------------------------------- | ----------- |
| PH4   | SEND content rules — worksheetRulesContent[] across 21 profiles + prompt + tests | in progress |

Phase 4 is a single PR because the field, the 21 populated arrays, the
prompt-block update and the test coverage must ship together. The
sendFidelityAudit probe registry is intentionally NOT extended here
(deferred — see below) so the PR stays narrow.

## Definition-of-done

- [ ] `SendAdaptationSpec.worksheetRulesContent: string[]` added to
      the interface in `client/src/lib/sendPromptFragments.ts`.
- [ ] All 21 profiles populate `worksheetRulesContent[]` with 3–5
      imperative lines that target the substance of the questions
      (concept progression, context choice, vocabulary, cognitive
      demand, misconception scaffolding) — distinct from the
      presentation rules already in `worksheetRules[]`.
- [ ] `getSendNoteForWorksheet()` renders both lists as TWO labelled
      blocks: "PRESENTATION RULES" and "CONTENT RULES". Output stays
      a single string so `ai.ts` consumers do not change.
- [ ] The CRITICAL closing line is softened to acknowledge content-
      level adaptations while preserving the curriculum-rigour lock
      (year-group level, mark allocations, awarding-body alignment
      stay correct).
- [ ] `getSendNoteForPresentation()` is **not** changed — presentations
      already use a separate `presentationRules[]` array. Out of
      scope for Phase 4 to keep the PR narrow.
- [ ] Tests in `server/tests/worksheetScrutiny.test.ts`:
      every spec has ≥3 entries; both block labels render in the
      prompt; four representative pedagogy anchors land (ADHD novelty,
      dyscalculia C-P-A progression, ASC literal-only, EAL cognate
      vocabulary).
- [ ] CI passes (`npm test` + `tsc --noEmit`) on the PR.

## Conventions inherited from Phases 1 / 2 / 3 (do NOT break)

- **Single source of truth.** The SEND surface lives in
  `sendPromptFragments.ts`. No hand-rolled SEND content rule strings
  anywhere else in the codebase. The prompt scaffold and any tests
  import from one place.
- **Schema / prompt / validator alignment.** Phase 4 introduces no
  new per-question schema field — the rules apply at the worksheet
  level, like the existing `worksheetRules[]`. If a future phase
  needs per-question SEND content (e.g. a `sendNote` annotation on
  individual questions), mirror it across `aiSchemas.ts` (Zod),
  `worksheet-generator.ts` (interface), and the per-question contract
  block in `ai.ts:structuredSystemSections`.
- **Renderer stays subject-aware** through `formatContent`'s `subject`
  option. Phase 4 does not add a renderer surface — content rules
  reach the AI through the prompt, not through a new section type.
- **Sciences do NOT get the maths-only working-out box.** Phase 1
  lock. The maths-specific content rules in Phase 4
  (`worksheetRulesContent` for dyscalculia, dyspraxia method-step
  scaffolds, etc.) describe substance, not affordances; they do not
  introduce a working-out box for non-maths subjects.
- **Never invent spec codes.** Phase 1 lock. Content rules reference
  awarding-body command-word vocabulary; they never invent new codes.
- **Topic anchoring.** Where a content rule references the topic
  noun (e.g. "use small whole numbers when introducing the topic"),
  it leans on the same metadata Phase 2 / Phase 3 already plumbed
  through (`metadata.topic`).

## Deferred — explicitly out of scope for Phase 4

- **`sendFidelityAudit.ts` probe registry.** The audit currently runs
  ~5 deterministic regex probes per profile against `worksheetRules[]`
  and reports a pass/fail score per rule. Extending it to probe
  `worksheetRulesContent[]` is harder because content rules are
  semantic — "use small whole numbers" cannot be deterministically
  scored without a numeric scan, and "avoid social scenarios" cannot
  be scored without a topic-classifier. Doing this well needs a
  separate PR with its own design (LLM-based probe? regex heuristics
  per category? sample-and-score?). Phase 4 ships the rules; a
  follow-up phase ships the audit.
- **`getSendNoteForPresentation()` content rules.** The presentation
  generator has its own `presentationRules[]` array and its own
  `presentationRulesContent[]` would be a parallel concern. Out of
  scope to keep the PR narrow.
- **New SEND profiles.** Work with the 21 we have.
- **Per-section content rules.** Worksheet-level only.

## What lives in subsequent phases (do NOT scope-creep into Phase 4)

- Phase 4-follow-up — `sendFidelityAudit` probe registry for
  `worksheetRulesContent[]` (see "Deferred" above).
- Phase 5 — Full curriculum-authority system prompt rewrite (the
  bigger CGP-grade prompt; this Phase ships only the SEND content
  rules surface).
