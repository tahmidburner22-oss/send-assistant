# Phase F · Curriculum Bank — PHASE-PLAN

> **One PR, scoped tightly.** This phase folder exists for traceability and
> to give the next agent (if context limits force resumption) a clean place
> to read the plan without scrolling chat. The companion file is
> `SESSION-HANDOFF.md`, which is the live resume contract.

## Why this phase exists

The user's diagnosis (verbatim, condensed):

> The Higher and Foundation versions of a worksheet need to actually be different,
> and the scaffolded version needs to actually be scaffolded for this topic — not
> just have generic hints. The questions need to match what is actually taught in
> classrooms. Is there a way to ingest curriculum content for all subjects?

That diagnosis is correct. Diagnosis confirmed against current code:

- `/api/ai/differentiate-worksheet` rewords existing questions with no spec-ref or tier-subset awareness. The `tier` field on `SpecPoint` (`foundation | higher | both`) already exists in the schema but no code reads it.
- `/api/ai/scaffold-worksheet`'s deterministic fallback in `buildLocalScaffold` emits **regex-class hints** like `if (/\d|=|\+|-|×|÷|\//.test(line)) return "Hint: Show one step at a time."` — i.e. the hint is keyed on punctuation, not topic.
- Curriculum coverage is **3 datasets** (AQA Maths Y10, Edexcel Maths Y10, AQA Combined Science Y10) versus the ~120 needed for full UK secondary coverage.
- The few-shot bank in `getSpecQuestions()` only fires when a topic happens to be in `expandedMathTopics` or `worksheetAllTopics`; otherwise the LLM generates with no curricular anchor.

## What ships in this PR

A single PR titled **"Phase F · Curriculum Bank"** delivering:

### 1. Architecture (`client/src/lib/curriculumBank.ts`)

A new pure-function module that merges three data sources into one lookup:

- **Spec points** (existing `specPointTaxonomy` data) — *what* should be taught.
- **Exemplars** (new `client/src/data/exemplars/`) — *what a real past-paper question looks like* on this spec point, paraphrased.
- **Scaffolds** (new `client/src/data/scaffolds/`) — *how to support a struggling pupil* on this spec point (sentence frames, word bank, step ladder).

Public API:

```ts
lookupBySpecRef(board, subject, yearGroup, specRef): CurriculumEntry | null
lookupByTopic(board, subject, yearGroup, topic, opts?): CurriculumEntry[]
filterByTier(entries, tier): CurriculumEntry[]
buildExemplarPromptBlock(entries, opts): string
buildScaffoldPromptBlock(entries, sendNeed?): string
targetAoHistogramForTier(tier): { AO1: number; AO2: number; AO3: number }
```

### 2. Tier-aware differentiator

Rewrite `/api/ai/differentiate-worksheet` to:

- Read `metadata.specRef` from the source worksheet (already stamped by FEAT-PB1 / `questionProvenance`).
- Filter the spec-point dataset by `tier === "higher" | "both"` for Higher mode (and `"foundation" | "both"` for Foundation mode).
- Pull tier-matching exemplars from the new bank into the prompt's few-shot block.
- Send tier-specific AO targets to the LLM (Foundation ≥ 60% AO1; Higher ≤ 40% AO1, ≥ 30% AO2, ≥ 20% AO3).
- Result: pressing **Higher** doesn't reword Foundation — it generates from a Higher-only spec subset with Higher-style exemplars.

### 3. Topic-aware scaffolder

Rewrite `/api/ai/scaffold-worksheet` and `buildLocalScaffold` to:

- Look up scaffold rows per spec-ref in the new bank (sentence frames, word bank, step ladder, common pitfalls).
- Use those rows when present; fall back to the existing per-SEND-need rules when the bank doesn't cover the topic yet.
- Result: hints are **about this topic**, not "show one step at a time".

### 4. 13 new spec-point datasets

Bringing total coverage from **3 → 16** datasets covering AQA + Edexcel + OCR for the highest-volume GCSE subjects (maths, biology, chemistry, physics, combined science, English Language) across Y10 and Y11 (where applicable).

Sources are public awarding-body specifications. All datasets cite their source in the file's `source` field.

### 5. Exemplar bank seed

~80 paraphrased exemplar questions across the seeded subjects, each tagged with `tier`, `ao`, `marks`, `commandVerb`, and `source`. **Paraphrased, never verbatim.**

### 6. Scaffold bank seed

Per-spec-ref scaffolding rows for the highest-traffic ~30 spec points across the seeded subjects. The scaffold rows are subject-pedagogy specific (e.g. word equation → symbol equation → energy yield ladder for Respiration).

### 7. Tier-AO histogram post-validator

A new check in `worksheetPostValidator.ts` that compares the AO histogram of the generated worksheet against the tier target (when `metadata.tier` is set) and stamps a `p1` warning when the histogram is more than ±15% off target.

### 8. Tests

Pure unit tests for the new module + helper functions, plus a smoke integration test that the differentiator endpoint returns *different spec-refs* for Foundation vs Higher on the same source worksheet.

### 9. Docs

- Add Phase F row to `docs/IMPROVEMENTS-MAP.md`.
- Add the Phase F summary to `docs/worksheet-generator-audit.md`.

## What is **out of scope** for this PR (Phase F2 backlog)

- KS3 (Y7–Y9) datasets
- KS5 / A-Level datasets
- Primary (White Rose Maths Y1–Y6, DfE NC English KS1–KS2)
- WJEC, CCEA datasets
- Full-coverage exemplar bank (>1 exemplar per spec point) — this PR seeds, follow-up densifies.
- Geography, history, modern foreign languages — architecture is ready, content is the next phase.

The architecture is a drop-in. Adding a new (board × subject × year) is one line in `specPointTaxonomy.ts`'s register list plus the JSON file.

## Sequencing inside this PR (commit order)

The branch is built in the order below so each commit compiles. Update `SESSION-HANDOFF.md` "Commit log" after every push.

1. **Plan + handoff + sized spec** — pure docs commit. Lets the user read the contract before any code lands.
2. **`curriculumBank.ts` skeleton + types** — module compiles, returns null for everything. No callers yet.
3. **Spec-point expansion** — drop in the 13 new JSON files; extend `specPointTaxonomy.ts` to register them.
4. **Exemplar bank seed** — drop in the JSON files; bank loader reads them.
5. **Scaffold bank seed** — drop in the JSON files; bank loader reads them.
6. **`getSpecQuestions()` integration** — call into the bank with tier filter.
7. **Differentiator rewrite** — single endpoint change, with feature flag (`X-Phase-F-Differentiator: 1`) for safe rollout that defaults on.
8. **Scaffolder rewrite** — single endpoint change, layered over existing per-SEND rules.
9. **Tier-AO post-validator** — additive check.
10. **Tests** — pure-function and smoke.
11. **Docs** — IMPROVEMENTS-MAP + audit.
12. **Final SESSION-HANDOFF update + push + PR open.**

## Acceptance criteria (verifiable)

- Generating a Foundation and a Higher worksheet on the same topic ("Atomic Structure", AQA Y10) produces worksheets where the **set of `specRef`s referenced differs by ≥ 30%**.
- Generating a Foundation worksheet on AQA Y10 Combined Science contains **0 questions tagged `tier: "higher"`** in any post-validator output.
- Scaffolded version of a worksheet on a seeded topic (e.g. "Respiration") contains the **topic's actual word bank** in the scaffold output, not the regex-extracted token list.
- `npm test` passes.
- `npm run check` passes.
- `npm run eval:worksheets` passes with no fixture regressions.
- `IMPROVEMENTS-MAP.md` lists Phase F as "Shipped — PR #N".
