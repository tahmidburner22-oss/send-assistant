# Phase 5 — Curriculum-authority system prompt rewrite

Goal: turn the worksheet system prompt into an **explicit, single-voice
curriculum-authority preamble** so the AI's output reads as if written
by an experienced UK teacher who is bound to the National Curriculum,
the named awarding-body specification, UK English, SI units and the
awarding-body command-word vocabulary — and not as a generic LLM
"helpful assistant".

Phase 1 shipped the *structural* foundation (counts, per-Q affordances,
spec-lock validator). Phases 2–4 layered on the *content surfaces*
(topic-anchored Self-Reflection, examiner-voice Revision Tips,
non-cosmetic SEND content rules). Phase 5 is the **voice and authority
layer**: the framing that binds the whole prompt to UK statutory
authority, removes US-LLM drift, and turns the opener from "You are an
expert UK teacher" into a properly bound `(National Curriculum × named
exam board × year group × topic × awarding-body command-word vocabulary)`
contract.

Phase 5 follows the Phase 1 / 2 / 3 / 4 pattern verbatim:

```
single source of truth library  ← new: client/src/lib/curriculumAuthorityPrompt.ts
        ↓
    AI prompt rule + worked example  ← compose into structuredSystemSections
        ↓
    post-validator (rewrites US-drift / banned softeners / fabricated AO codes)
        ↓                              new: enforceCurriculumAuthorityInvariants
    renderer component + section-toggle wiring  ← NOT touched
        ↓                              prompt-only phase, no UI surface
    scrutiny tests
```

## Why this matters (read before any change)

- **The user-facing problem.** Today the system prompt opens with a
  single thin line: *"You are an expert UK teacher creating a
  professional, print-ready worksheet. You respond with valid raw JSON
  only…"*. Everything that follows is a downstream rule. The model has
  no anchor that says "you are bound to the UK National Curriculum,
  the named awarding body, UK English and SI units; the awarding-body
  command-word vocabulary is the only legitimate verb set; US-LLM
  defaults like 'color', 'aluminum', 'math', 'meter', 'organize',
  'theater', 'have a think about it', 'make sure you revise' are
  banned by name". As a result, drift creeps in case-by-case — a
  question gets `color` instead of `colour`, a Self-Reflection prompt
  gets a `Have a think about…` softener, an extended-answer rubric
  invents an `AO5` band — and Phases 1–4's downstream rules have to
  catch each one in isolation. We don't have a *manifesto* block at
  the top of the prompt that names the authority and the bans.
- **The pedagogical north star.** A teacher picking a worksheet off
  Adaptly should be able to read the first paragraph of the system
  prompt (if they ever inspect it via debug mode) and recognise it as
  the kind of brief a UK head of department would issue: "Year 11 AQA
  Combined Science. Higher tier. UK English. SI units. Use AQA's
  command words. Trace every question to a published spec point. Do
  not soften the register. Do not invent a code." The opener should
  *be* that brief.
- **Non-negotiables (inherited verbatim from Phases 1–4).** UK English,
  UK statutory framework, SI units, no US contexts, no copyrighted
  past-paper text verbatim, awarding-body command words only, sciences
  do NOT get the maths-only working-out box, never invent spec codes.
  Phase 5 doesn't add new non-negotiables — it *names* the existing
  ones in one consolidated authority block at the top of the prompt
  so the rest of the prompt is enforcing rules the model has already
  agreed to.

## Hard sizing rules (apply to this PR)

- ≤ ~700 net lines changed (target ~500–600).
- ≤ ~12 files touched (target ~7–8).
- One coherent concept per PR — Phase 5 is one PR.
- Reads scoped to specific functions, not whole-file.
- **Never read `client/src/lib/ai.ts` or
  `client/src/components/WorksheetRenderer.tsx` in full from a fresh chat.**
  Phase 5 only needs the `structuredSystemSections` array (~lines
  2520–2580), the `ksGcseNote` template literal (~lines 2325–2345),
  the `specPointAnchorBlock` already at lines 1530–1580 (no edit
  needed — Phase 5 cross-references it), and the two
  `runWorksheetPostValidators` callsites. Use `grep_search` for the
  exact line anchors. Do not read the rest.
- Sandbox is `INTEGRATIONS_ONLY` — npm install is blocked. Type-check
  and test runs happen on PR push via CI.

## Header to paste at the start of any fresh chat picking up this phase

```
Context: send-assistant repo, branch phase-5-curriculum-authority
         (or a sibling branch checked out from main).
Working on Phase 5 — Curriculum-authority system prompt rewrite.
Live state: .agents/tasks/phase-5-curriculum-authority/SESSION-HANDOFF.md
Plan:      .agents/tasks/phase-5-curriculum-authority/PHASE-PLAN.md
Constraint: do not read ai.ts or WorksheetRenderer.tsx in full;
            grep for the named exports first and read narrow ranges only.
            Sandbox is INTEGRATIONS_ONLY — do not run npm install.
```

## PRs in this phase

| PR    | Title                                                                          | Status      |
| ----- | ------------------------------------------------------------------------------ | ----------- |
| PH5   | Curriculum-authority preamble + non-negotiables block + UK-English validator   | not started |

Phase 5 is a single PR because the builder, the prompt-block insertion,
the non-negotiables manifesto, the new post-validator and the test
coverage must ship together — otherwise the manifesto exists but
nothing enforces it and the validator exists but nothing primes the
model to obey it. If the diff exceeds ~700 net lines we split at the
validator / preamble boundary (the validator is the smaller half).

## Definition-of-done

- [ ] `client/src/lib/curriculumAuthorityPrompt.ts` is the single source
      of truth for the curriculum-authority preamble. Pure /
      deterministic. Public API:
      * `buildCurriculumAuthorityPreamble(inputs)` — returns the full
        opening manifesto (replaces today's thin "expert UK teacher"
        line). Anchors the (board × subject × year × topic × key
        stage) tuple. Names the awarding body explicitly. Names the
        National Curriculum + Programmes of Study by reference.
      * `buildNonNegotiablesBlock()` — returns the consolidated UK
        English / SI units / no-US-contexts / awarding-body / no-
        fabricated-codes / no-softeners block as a single labelled
        section. Static — no inputs. Same text every prompt.
      * `buildPedagogicalRegisterNote(inputs)` — returns the tonal
        anchor that scales by key stage: KS1/KS2 = warm but precise,
        KS3 = clear and explanatory, GCSE = examiner-voice, A-Level
        = academic-but-direct. Used to set tonal expectation.
      * `UK_ENGLISH_SUBSTITUTIONS` — frozen map of US → UK spellings
        the validator silently rewrites (color/colour, aluminum/
        aluminium, math/maths, meter/metre [non-physics-unit
        context], organize/organise, realize/realise, behavior/
        behaviour, theater/theatre, center/centre, gray/grey,
        traveler/traveller, defense/defence, license [verb only — UK
        keeps "license" as verb / "licence" as noun in some
        codebases — pick one consistent rule and document it]).
      * `BANNED_SOFTENERS` — frozen list of softener phrases banned
        in pupil-facing content ("have a think about", "talk about"
        as a question stem, "give it a go", "make sure you revise",
        "study hard", "good luck", "do your best").
      * `FABRICATED_AO_CODE_RE` — regex catching invented assessment
        objective codes (`AO5`, `AO6+`).
      * `isUKEnglishCompliant(text)` — pure boolean predicate.
      * `applyUKEnglishSubstitutions(text)` — pure string rewriter.
- [ ] `ai.ts:structuredSystemSections`:
      * The thin opener `"You are an expert UK teacher creating a
        professional, print-ready worksheet…"` is replaced by
        `buildCurriculumAuthorityPreamble({...})`. Net: ~+15 lines
        for the manifesto, -1 for the original.
      * A new dedicated block `buildNonNegotiablesBlock()` is pushed
        into the array immediately after the preamble, before the
        existing `SUBJECT TYPE` line. Always renders.
      * `buildPedagogicalRegisterNote({...})` is pushed in
        immediately after `readingAgeNote`. Always renders.
      * The existing `QUALITY STANDARD` line is tightened to
        cross-reference the manifesto: "every question is bound to
        the curriculum-authority preamble above — no off-spec
        content, no UK-English drift, no awarding-body code
        fabrication".
      * `ksGcseNote` is left structurally intact — Phase 5 does not
        rewrite the per-section rules. One small change: a leading
        sentence ties `ksGcseNote` back to the manifesto so the AI
        sees the section rules as *implementations* of the authority,
        not as standalone instructions.
- [ ] `client/src/lib/worksheetPostValidator.ts`:
      * Imports `applyUKEnglishSubstitutions`,
        `BANNED_SOFTENERS`, `FABRICATED_AO_CODE_RE` from
        `./curriculumAuthorityPrompt`.
      * Adds `enforceCurriculumAuthorityInvariants(ws, opts)` — pure
        / idempotent. Walks all pupil-facing sections (filters out
        `teacherOnly`). For each section's content + title:
        - Silently rewrites US-spelling tokens to UK equivalents
          using `applyUKEnglishSubstitutions`. Stamps a warning per
          rewrite so the regression is traceable.
        - Detects banned-softener phrases in question-section stems
          and Self-Reflection / Revision-Tips content. Stamps a
          warning. Does NOT silently rewrite (the model needs to
          learn the lesson via the prompt; silent rewrite would
          paper over a real failure).
        - Detects fabricated AO codes (`AO5+`) anywhere in
          structured fields (`section.ao`, content body). Stamps a
          warning. Clamps the field to `"AO1"` only when the field
          is structurally invalid (otherwise leaves it alone — the
          author may have meant `AO4`).
        - Detects template-literal leakage in pupil-facing content
          (`${...}`, literal `[topic]`, literal `[N marks]` where
          N is the letter not a digit, literal `___` outside
          gap-fill sections). Stamps a warning. Does NOT silently
          rewrite (placeholder leakage is a generation bug, not a
          translation issue).
        - Never overwrites good non-drifting content.
      * Wired into `runWorksheetPostValidators` chain immediately
        after the Phase 4 SEND-fidelity block — runs LAST among the
        Phase 1–5 validators so it normalises any text other
        validators may have written.
- [ ] `runWorksheetPostValidators` chain forwards no new args (the
      validator works off `worksheet.metadata.subject` already
      plumbed in Phase 1+).
- [ ] Tests in `server/tests/worksheetScrutiny.test.ts` (new
      `Phase 5 — curriculum-authority` describe block at the bottom
      of the file):
      * `buildCurriculumAuthorityPreamble` — output is deterministic
        for a fixed input; opener names the awarding body, year
        group, topic and key stage; output mentions UK National
        Curriculum + Programmes of Study verbatim; output names UK
        English and SI units; KS2 input produces softer register
        than GCSE; A-Level input produces academic register.
      * `buildNonNegotiablesBlock` — static output contains the six
        required clauses (UK English, SI units, no US contexts, no
        copyrighted past-paper text, awarding-body command words,
        no fabricated codes); output is stable across calls (same
        string).
      * `applyUKEnglishSubstitutions` — `color → colour`,
        `aluminum → aluminium`, `math → maths` (standalone — does
        NOT rewrite `mathematics` or `mathematician`), `meter →
        metre` (rewrites `100 meter dash` but NOT `100 metre`
        already correct, and NOT `kilometre` — case-by-case rules
        documented), `organize → organise`, `behavior → behaviour`,
        idempotent (running twice = same output).
      * `BANNED_SOFTENERS` regex round-trip — `"Have a think about
         photosynthesis"` flagged; `"Calculate the rate of
         photosynthesis"` not flagged.
      * `FABRICATED_AO_CODE_RE` — `"AO5"` flagged, `"AO1"` /
        `"AO2"` / `"AO3"` / `"AO4"` not flagged.
      * `enforceCurriculumAuthorityInvariants` — happy path
        (no-op on clean worksheet); rewrites US drift in question
        stems; preserves UK English already correct; warns on
        softeners without rewriting; warns on fabricated AO codes
        without overwriting structured fields unless invalid; warns
        on template-literal leakage; never touches `teacherOnly`
        sections; idempotent across two consecutive runs.
      * `structuredSystemSections` integration — the prompt string
        for a fixed input contains the curriculum-authority
        preamble; contains the non-negotiables block; contains the
        pedagogical register note; the manifesto names the input's
        awarding body and year group; the QUALITY STANDARD line
        cross-references the manifesto.
- [ ] CI passes (`npm test` + `tsc --noEmit`) on the PR.

## Conventions inherited from Phases 1 / 2 / 3 / 4 (do NOT break)

- **Single source of truth.** The curriculum-authority surface lives in
  `curriculumAuthorityPrompt.ts`. No hand-rolled US→UK rewrite tables,
  banned-softener lists, or AO-code regexes anywhere else in the
  codebase. The prompt scaffold, the validator, and any future tests
  all import from one place.
- **Schema / prompt / validator alignment.** Phase 5 introduces no
  new per-question schema field. The validator works off the existing
  `metadata.subject / examBoard / yearGroup / topic` — already
  plumbed since Phase 1.
- **Renderer stays subject-aware** through `formatContent`'s `subject`
  option. Phase 5 does not add a renderer surface — the curriculum
  authority reaches the AI through the prompt only.
- **Sciences do NOT get the maths-only working-out box.** Phase 1
  lock. The pedagogical register note for sciences explicitly says
  "use SI units and standard writing lines"; it does not introduce
  new affordances.
- **Never invent spec codes.** Phase 1 lock. Phase 5's manifesto
  *names* this rule explicitly; the validator catches AO codes
  (which Phase 1's spec-anchor validator does not cover).
- **Topic anchoring** uses `metadata.topic` (Phase 2 / 3 plumbing).
  The manifesto opening line explicitly anchors to the topic noun.
- **No SEND scope creep.** Phase 4 is shipped. Phase 5 does not edit
  `sendPromptFragments.ts` or any SEND surface. The pedagogical
  register note is purely about key-stage tonal scaling, NOT about
  SEND register (which has its own `classifySendRegister` taxonomy).

## Deferred — explicitly out of scope for Phase 5

- **Past-paper-verbatim detection.** A future phase could ship a
  fingerprint check against a past-paper corpus to flag verbatim
  copies. Phase 5 only *names* the rule in the manifesto; it does
  not implement detection.
- **Awarding-body command-word fidelity audit.** The manifesto names
  the rule; per-board command-word lists already exist in
  `pastPapers.ts`. A future phase could add a validator that flags
  questions opening with verbs *outside* the named board's command-
  word list. Phase 5 leaves this to the per-question contract block
  + the model's compliance.
- **`server/routes/ai.ts` legacy non-structured path.** Server-side
  prompts (revision-mat, exam paper, diagram generator) are a
  different codepath. Phase 5 ships the client-side structured path
  only. A follow-up phase could port the manifesto into the server
  paths if needed.
- **Per-question reading-age regression detector.** Phase 1's
  `expectedReadingAge` field already exists. A future phase could
  add a validator that compares actual sentence length / Flesch
  score against the declared reading age. Phase 5 leaves this to
  the existing per-question contract block.

## What lives in subsequent phases (do NOT scope-creep into Phase 5)

- Phase 6 (provisional) — Past-paper fingerprint detection,
  awarding-body command-word fidelity audit, server-route
  manifesto port. Not committed; design after Phase 5 ships.

## Files expected to change in this branch

```
.agents/tasks/phase-4-send-content-rules/SESSION-HANDOFF.md   (bookkeeping: marked SHIPPED)
.agents/tasks/phase-5-curriculum-authority/PHASE-PLAN.md      (this file — new)
.agents/tasks/phase-5-curriculum-authority/SESSION-HANDOFF.md (new — written at end of phase)
client/src/lib/curriculumAuthorityPrompt.ts                   (new — ~250 lines)
client/src/lib/ai.ts                                          (replace opener + push 2 new blocks + tighten QUALITY STANDARD + tie ksGcseNote — narrow edits only)
client/src/lib/worksheetPostValidator.ts                      (+ enforceCurriculumAuthorityInvariants + plumb in chain)
server/tests/worksheetScrutiny.test.ts                        (Phase 5 test suites — ~180 lines)
```

Estimated diff size: ~500–600 net lines across 7 files. Within
the 700-line / 12-file cap.
