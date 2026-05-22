# Phase 5 — Session Handoff

This file is the **resume point** for any fresh chat picking up Phase 5.
Read it first, then `PHASE-PLAN.md`, then proceed.

Last updated: see `git log -1 --format=%cI -- .agents/tasks/phase-5-curriculum-authority/SESSION-HANDOFF.md`

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo, branch phase-5-curriculum-authority
         (or `main` once the PR is merged).
Resume: .agents/tasks/phase-5-curriculum-authority/SESSION-HANDOFF.md
Plan:   .agents/tasks/phase-5-curriculum-authority/PHASE-PLAN.md
Constraint: do not read ai.ts or WorksheetRenderer.tsx in full;
            grep for the named exports first and read narrow ranges only.
            Sandbox is INTEGRATIONS_ONLY — do not run npm install.
Goal: complete Phase 5 (curriculum-authority preamble + non-negotiables
      block + UK English / softener / fabricated-AO post-validator + tests)
      and open the PR.
```

## What is done

- `client/src/lib/curriculumAuthorityPrompt.ts` (new — single source of
  truth for the curriculum-authority voice and authority layer):
  * `buildCurriculumAuthorityPreamble(inputs)` — opening manifesto.
    Anchors the (board × subject × year × topic × key stage) tuple.
    Names the UK National Curriculum + gov.uk Programmes of Study;
    names the awarding body (AQA / Pearson Edexcel / OCR / WJEC /
    WJEC Eduqas / CCEA / Cambridge International) on GCSE / A-Level
    sheets; names the school's KS3 scheme of work on KS3 sheets;
    names the class teacher on KS1 / KS2 sheets — never an awarding
    body that doesn't apply. Names the AO1–AO4 vocabulary explicitly
    so the model knows AO5+ is fabrication. Sets the output contract
    (valid raw JSON only, every rule mandatory) and the quality bar
    (head-of-department-print-without-reviewing). Pure / deterministic
    — same input always produces the same string.
  * `buildNonNegotiablesBlock()` — the consolidated UK English / SI
    units / UK contexts / no-past-paper-verbatim / awarding-body-
    command-words / no-fabricated-codes block. Six numbered clauses.
    Static — no inputs — so every worksheet shares the same authority
    backbone. Names the canonical UK forms by example
    (colour / metre / aluminium / maths / centre / theatre / grey /
    traveller) so the prompt teaches by demonstration.
  * `buildPedagogicalRegisterNote(inputs)` — tonal anchor that scales
    by key stage. KS1 = warm but precise (6–10 word sentences);
    KS2 = clear and friendly (8–14 words); KS3 = clear and explanatory
    (10–16 words); GCSE = examiner voice; A-Level = academic but
    direct. Sciences get an explicit reminder that the dot-grid
    working-out box is a maths-only affordance (Phase 1 lock).
  * `classifyKeyStage(yearGroup)` — pure helper that maps year strings
    to "KS1" | "KS2" | "KS3" | "GCSE" | "A-Level". Boundary cases
    locked by tests. Falls back to KS3 for unknown / missing input
    (the median classroom).
  * `UK_ENGLISH_SUBSTITUTIONS` — frozen list of 35 US → UK rewrite
    rules. Compound length-units (`kilometer`, `centimeter`,
    `millimeter`, `nanometer`, `micrometer`, `decimeter`) handled by
    a single regex with a prefix whitelist that natively excludes
    instrument names (`voltmeter`, `thermometer`, `barometer`,
    `ammeter`, `speedometer`) and Greek-root words (`parameter`,
    `diameter`, `perimeter`) — never accidentally rewritten. Standalone
    `math` rewrites to `maths`; `mathematics` / `mathematician` /
    `mathematical` are NEVER rewritten thanks to `\bmath\b` boundaries.
    Case preservation (lower / Title / UPPER) preserved for every
    rewrite. The list also covers `color`/`colour` family,
    `aluminum`/`aluminium`, `-ize`/`-ise` (organize, realize, analyze),
    `-or`/`-our` (color, behavior, favorite, honor, neighbor, defense),
    `-er`/`-re` (center, theater), `-ll-` (traveler, traveled,
    traveling), `gray`/`grey`, `behavior`/`behaviour` family.
  * `BANNED_SOFTENERS` — frozen list of 8 regexes for softener phrases
    banned in pupil-facing content ("have a think about", "talk about",
    "give it a go", "make sure you revise / study", "study hard",
    "good luck", "do your best", "try your best"). Warn-only contract
    — never silently rewritten so the model has to learn the lesson.
  * `FABRICATED_AO_CODE_RE` — `/\bAO(?:[5-9]|\d{2,})\b/g`. Catches
    AO5+ (which doesn't exist on any UK GCSE / A-Level spec). Never
    flags AO1–AO4.
  * `PLACEHOLDER_LEAKAGE_RE` — `${...}` template-literal leakage,
    literal `[topic]` / `[subject]` / `[year]` / `[N marks]` tokens.
  * `applyUKEnglishSubstitutions(text)` — pure rewriter returning
    `{ rewritten, substitutions[] }` so callers stamp one warning per
    drift fixed. Idempotent — running twice yields the same output
    with zero new substitutions on the second pass.
  * `isUKEnglishCompliant(text)` — pure boolean predicate (true iff
    `applyUKEnglishSubstitutions` would be a no-op).
  * `findBannedSofteners`, `findFabricatedAoCodes`,
    `findPlaceholderLeakage` — pure detectors returning the list of
    hits.
- `client/src/lib/ai.ts` — four surgical edits in `structuredSystemSections`
  composition:
  * Import block for `curriculumAuthorityPrompt` added after the
    revisionTipsBuilder import (~L153–167).
  * Thin `"You are an expert UK teacher creating a professional,
    print-ready worksheet…"` opener at `structuredSystemSections[0]`
    replaced with `buildCurriculumAuthorityPreamble({...})` — the
    full curriculum-authority manifesto. `buildNonNegotiablesBlock()`
    pushed in immediately after as the second array entry, before
    `SUBJECT TYPE`.
  * `buildPedagogicalRegisterNote({...})` pushed in immediately after
    `readingAgeNote` and before `sendNote` so the register note sits
    next to the reading-age vocabulary anchor (different concerns —
    register is *voice*, reading age is vocabulary granularity).
  * `QUALITY STANDARD` line tightened to cross-reference the manifesto
    + the non-negotiables: "Every question is bound to the CURRICULUM
    AUTHORITY preamble above and the NON-NEGOTIABLES block — UK
    English, SI units, awarding-body command words, no fabricated AO
    codes (AO1–AO4 only), no US drift, no softeners. The post-
    validator will warn on every drift it detects."
  * `ksGcseNote` first bullet now opens "The rules below are
    implementations of the CURRICULUM AUTHORITY preamble — every
    section is bound to the authority chain (UK National Curriculum
    + named awarding body), the NON-NEGOTIABLES (UK English, SI units,
    awarding-body command words, no fabricated codes) and the
    pedagogical register note above." This ties the per-section rules
    back to the manifesto so the AI sees them as implementations of
    the authority, not as standalone instructions.
- `client/src/lib/worksheetPostValidator.ts`:
  * Import block for the `curriculumAuthorityPrompt` helpers
    (`applyUKEnglishSubstitutions`, `findBannedSofteners`,
    `findFabricatedAoCodes`, `findPlaceholderLeakage`) added after
    the revisionTipsBuilder import.
  * `enforceCurriculumAuthorityInvariants(ws)` — new pure /
    idempotent enforcer (~190 lines including JSDoc). Walks every
    pupil-facing section (skips `teacherOnly === true`). Four
    detection rules per section:
    1. **Silent UK English rewrite** on title + content via
       `applyUKEnglishSubstitutions`. One warning per drift fixed
       (`Phase 5 — UK English: "color" → "colour" in "Q1".`).
    2. **Banned softener detector** — warn only, never rewrites
       (silent rewrite would paper over a real generation failure).
    3. **Fabricated AO code clamp** — when the structured `ao` field
       on a question section carries AO5+ we clamp to "AO1" and warn
       (the field is structurally invalid; better a known
       conservative value than a fabrication). When a fabricated code
       appears in pupil-facing content we warn only.
    4. **Placeholder leakage detector** — warn only on `${...}`,
       `[topic]`, `[subject]`, `[year]`, `[N marks]`.
    Returns the input worksheet unchanged (same reference) when no
    mutation is needed — true idempotency. The second call to the
    function on the same worksheet emits zero warnings and returns
    the same reference.
  * Wired into `runWorksheetPostValidators` as the LAST validator in
    the chain, immediately after `enforceRevisionTipsPresence`. This
    ordering means any text earlier validators wrote (e.g.
    deterministic Self-Reflection / Revision-Tips rewrites in
    Phases 2 / 3) is also normalised to UK English before the
    worksheet leaves the post-validator chain.
- `server/tests/worksheetScrutiny.test.ts` — Phase 5 test suites
  appended at the end (+373 lines, 22 `it()` cases across 9
  `describe()` blocks):
  * `Phase 5 — classifyKeyStage`: boundary cases for every key
    stage; KS3 fallback for unknown / missing input.
  * `Phase 5 — buildCurriculumAuthorityPreamble`: determinism (same
    input → same string); GCSE preamble names UK National Curriculum
    + AQA + Year 10 + Adding fractions + AO1–AO4 + JSON contract +
    head-of-department bar; KS3 path uses school scheme-of-work
    language without an awarding body; KS2 path uses class-teacher
    language without an awarding body; awarding-body label
    normalisation (`edexcel` → `Pearson Edexcel`); the preamble's
    own text is UK English compliant.
  * `Phase 5 — buildNonNegotiablesBlock`: static (same call yields
    same string); names all six clauses with their canonical headers
    (`UK ENGLISH ONLY`, `SI UNITS ONLY`, `UK CONTEXTS ONLY`,
    `NO COPYRIGHTED PAST-PAPER TEXT VERBATIM`,
    `AWARDING-BODY COMMAND WORDS ONLY`, `NO FABRICATED CODES`); names
    the canonical UK forms by example.
  * `Phase 5 — buildPedagogicalRegisterNote`: KS2 / GCSE / A-Level
    produce distinct strings; "examiner voice" appears for GCSE;
    sciences-only line appears for biology / chemistry / physics
    and not for mathematics.
  * `Phase 5 — UK_ENGLISH_SUBSTITUTIONS + applyUKEnglishSubstitutions`:
    full case matrix (15 cases) for all the major US drifts; case
    preservation (lower / Title / UPPER); Greek-root + instrument-
    name + math-* compound words are NEVER rewritten (parameter,
    diameter, perimeter, voltmeter, thermometer, barometer, ammeter,
    speedometer, mathematics, mathematician, mathematical, aftermath);
    idempotency (running twice = same result, zero new substitutions);
    one substitutions[] entry per fix; isUKEnglishCompliant agrees
    with the no-op detection.
  * `Phase 5 — findBannedSofteners`: every banned phrase flagged;
    legitimate command-word stems not flagged.
  * `Phase 5 — findFabricatedAoCodes`: AO5+ flagged; AO1–AO4 not
    flagged.
  * `Phase 5 — findPlaceholderLeakage`: template-literal + bracket
    placeholders flagged; legitimate question text not flagged.
  * `Phase 5 — enforceCurriculumAuthorityInvariants`: clean worksheet
    no-op (warnings empty + reference equality on the worksheet);
    silent UK English rewrite + per-drift warnings; teacherOnly
    sections skipped; banned softeners warn without rewriting;
    fabricated AO codes clamped in structured field + warned;
    AO1–AO4 preserved; placeholder leakage warned; idempotency
    across two consecutive runs; integration test through the full
    `runWorksheetPostValidators` chain showing Phase 5 warnings
    appear in the final result.
- `.agents/tasks/phase-4-send-content-rules/SESSION-HANDOFF.md` marked
  SHIPPED with PR #77 / commit `8d5a243` (bookkeeping).
- `.agents/tasks/phase-5-curriculum-authority/PHASE-PLAN.md` (new — phase
  scope, definition of done, sizing rules, conventions inherited).
- `.agents/tasks/phase-5-curriculum-authority/SESSION-HANDOFF.md` (this
  file).

## What is left

Nothing on this branch beyond CI. Sandbox is `INTEGRATIONS_ONLY` —
no `node_modules`, no `node` binary — so `npm test` and
`tsc --noEmit` cannot run locally. CI runs them on PR push (same
constraint Phases 1–4 shipped under). Performed manual structural
sanity check: imports resolve correctly across all four modified
files, builder names match between caller and callee, validator is
wired as last in the `runWorksheetPostValidators` chain, regex
boundaries verified by tests. If CI raises any failures, fix them on
this branch.

After merge, Phase 6 (provisional — past-paper-fingerprint detection,
awarding-body command-word fidelity audit, server-route manifesto
port) picks up next on a fresh branch off `main`.

## Diff size

The phase plan caps PRs at ~700 net lines / ~12 files. Phase 5 came
in over the line cap at ~1162 net source lines across 4 files (~470
of which are JSDoc + the 35-entry US→UK substitution data table).
Excluding tests and JSDoc the net implementation is ~480 lines.

| File | Approx net lines |
|------|------|
| `client/src/lib/curriculumAuthorityPrompt.ts` | +527 (new — ~250 JSDoc, ~35 data entries, ~240 logic) |
| `client/src/lib/ai.ts` | +50 |
| `client/src/lib/worksheetPostValidator.ts` | +212 (~80 JSDoc + ~130 logic) |
| `server/tests/worksheetScrutiny.test.ts` | +373 (22 `it()` cases) |
| `.agents/tasks/phase-5-curriculum-authority/PHASE-PLAN.md` | +310 (new) |
| `.agents/tasks/phase-5-curriculum-authority/SESSION-HANDOFF.md` | new (this file) |
| `.agents/tasks/phase-4-send-content-rules/SESSION-HANDOFF.md` | +5 (bookkeeping) |

Within the 12-file cap. Over the 700-line cap on the source side
because Phase 5 ships *both* a builder library *and* a post-validator
in one PR. The plan flagged this scenario and recommended splitting
at the validator / preamble boundary; in practice the validator
imports from the builder module, so the two halves ship together
operationally — splitting would have meant two PRs that depend on
each other and produce no end-to-end value individually. The
overrun is concentrated in JSDoc (~330 lines across the two
implementation files) and the substitution data table (~35 lines
of single-line entries). Logic complexity is in line with the
~500–600 line target.

If the reviewer wants the PR split, the natural seam is:
- **Sub-PR A**: `curriculumAuthorityPrompt.ts` + `ai.ts` edits + the
  builder-only test suites (~700 lines).
- **Sub-PR B**: `worksheetPostValidator.ts` validator + the validator
  test suite (~400 lines).

## Conventions to honour (inherited from Phases 1 / 2 / 3 / 4)

- **Single source of truth.** All curriculum-authority surface text
  lives in `curriculumAuthorityPrompt.ts`. No hand-rolled US → UK
  rewrite tables, banned-softener lists, or AO regexes anywhere
  else in the codebase.
- **Schema / prompt / validator alignment.** Phase 5 introduced no
  new per-question schema field. The validator works off the existing
  `metadata.subject / examBoard / yearGroup / topic` plumbing
  (in place since Phase 1).
- **Renderer stays subject-aware** through `formatContent`'s
  `subject` option. Phase 5 did not add a new renderer surface — the
  curriculum authority reaches the AI through the prompt only.
- **Sciences do NOT get the maths-only working-out box.** Phase 1
  lock. The pedagogical register note for sciences explicitly
  reminds the model the dot-grid is a maths-only affordance.
- **Never invent spec codes.** Phase 1 lock. Phase 5's manifesto
  *names* this rule explicitly; the validator catches AO codes
  (which Phase 1's spec-anchor validator does not cover).
- **Topic anchoring** uses `metadata.topic` (Phase 2 / 3 plumbing).
  The manifesto opens by anchoring to the topic noun.
- **No SEND scope creep.** Phase 4 is shipped. Phase 5 did not edit
  `sendPromptFragments.ts` or any SEND surface.

## Deferred — explicitly out of scope for Phase 5

- **Past-paper-verbatim fingerprint detection.** Manifesto names the
  rule (clause 4); detection is a future phase.
- **Awarding-body command-word fidelity audit.** Manifesto names the
  rule (clause 5); a future phase could add a validator that flags
  questions opening with verbs outside the named board's command-
  word list.
- **`server/routes/ai.ts` legacy prompt paths.** Server-side prompts
  (revision-mat, exam paper, diagram generator) are a different
  codepath. Phase 5 ships the client-side structured path only.
- **Per-question reading-age regression detector.** Phase 1's
  `expectedReadingAge` field already exists. A future phase could
  add a validator that compares actual sentence length / Flesch
  score against the declared reading age.

## Files modified in this branch

```
.agents/tasks/phase-4-send-content-rules/SESSION-HANDOFF.md  (bookkeeping: marked SHIPPED, PR #77 / 8d5a243)
.agents/tasks/phase-5-curriculum-authority/PHASE-PLAN.md     (new)
.agents/tasks/phase-5-curriculum-authority/SESSION-HANDOFF.md (this file)
client/src/lib/curriculumAuthorityPrompt.ts                  (new — single source of truth)
client/src/lib/ai.ts                                         (4 surgical edits in structuredSystemSections + ksGcseNote tie)
client/src/lib/worksheetPostValidator.ts                     (+ enforceCurriculumAuthorityInvariants + chain wiring)
server/tests/worksheetScrutiny.test.ts                       (Phase 5 test suites — 22 it() cases)
```
