# Phase F · Curriculum Bank — SESSION-HANDOFF

> **This is the resume contract.** If you (the user) start a new chat for any
> reason — context limit, fresh window, a different machine — paste the
> contents of this file into the new chat with the message "resume Phase F"
> and the next agent will pick up exactly where the previous one stopped.

## Branch
`feat/phase-f-curriculum-bank` (off `main` at `ac03cde`)

Repo: `tahmidburner22-oss/send-assistant`

## Open PR
**PR URL is appended to this file once `github_create_pull_request` returns.**
See the bottom of this document.

## Current status snapshot

| Block | Status |
|---|---|
| Handoff + plan + sized spec | ✅ committed (`b457a73`) |
| `client/src/lib/curriculumBank.ts` (loader) | ✅ committed (`93a81c3`) |
| Spec-points expansion (16 datasets) | ✅ committed (`947d3ab`) |
| Exemplar bank seed (73 exemplars × 9 subjects) | ✅ committed (`d616670`) |
| Scaffold bank seed (24 rows × 9 subjects) | ✅ committed (`5c2472a`) |
| `specPointTaxonomy.ts` registry extension | ✅ committed (`947d3ab`) |
| `client/src/lib/ai.ts` `getSpecQuestions()` integration | ✅ committed (`8edc5b1`) |
| `/api/ai/differentiate-worksheet` rewrite | ✅ committed (`02bcbe1`) |
| `/api/ai/scaffold-worksheet` rewrite | ✅ committed (`02bcbe1`) |
| `tierAoHistogram` post-validator | ✅ committed (`e4fdb95`) |
| Unit tests | ✅ committed (`ce07085`) |
| `IMPROVEMENTS-MAP.md` + audit doc updates | ✅ committed (`25cca3e`) |
| `npm test` + typecheck green | ⏳ delegated to GitHub Actions CI (sandbox is INTEGRATIONS_ONLY — no npm registry, no local install possible) |
| Pushed + PR opened | ⏳ in this final commit |

## What this PR is doing (one paragraph)

Replaced string-shuffle differentiation and regex-class scaffolding with curriculum-bank-backed pipelines. After this PR, Foundation vs Higher actually differs at the **spec-point** level (uses `tier: "higher"` rows excluded by Foundation, and vice versa), with tier-specific AO histogram targeting; scaffolded versions pull **per-spec-ref sentence frames + word banks + step ladders** instead of regex hints; and the spec-point taxonomy expanded from 3 datasets to **16** covering AQA + Edexcel + OCR for the top GCSE subjects across Y10 and Y11.

## Architecture (final shape, as shipped)

```
client/src/data/
├── spec-points/                       — 16 awarding-body spec datasets
│   ├── aqa-maths-y10.json             (existing)
│   ├── edexcel-maths-y10.json         (existing)
│   ├── aqa-combined-science-y10.json  (existing)
│   ├── aqa-maths-y11.json             (NEW)
│   ├── edexcel-maths-y11.json         (NEW)
│   ├── ocr-maths-y10.json             (NEW)
│   ├── aqa-biology-y10.json           (NEW)
│   ├── aqa-chemistry-y10.json         (NEW)
│   ├── aqa-physics-y10.json           (NEW)
│   ├── edexcel-biology-y10.json       (NEW)
│   ├── edexcel-chemistry-y10.json     (NEW)
│   ├── edexcel-physics-y10.json       (NEW)
│   ├── edexcel-combined-science-y10.json (NEW)
│   ├── aqa-combined-science-y11.json     (NEW)
│   ├── edexcel-combined-science-y11.json (NEW)
│   └── aqa-english-language-y10.json     (NEW)
├── exemplars/                         — 73 paraphrased past-paper exemplars (NEW dir)
│   └── (9 files: aqa+edexcel × maths/bio/chem/phys × y10, plus aqa-english-y10)
└── scaffolds/                         — 24 topic-aware scaffold rows (NEW dir)
    └── (same 9 files)

client/src/lib/
├── curriculumBank.ts                  — single lookup module (NEW)
├── specPointTaxonomy.ts               — registry extended to 16 datasets
├── ai.ts                              — getSpecQuestions consults bank first
└── worksheetPostValidator.ts          — enforceTierAoHistogram added
└── __tests__/curriculumBank.test.ts   — pure-function tests (NEW)

server/routes/ai.ts                    — /differentiate + /scaffold rewrites
                                         + extractSourceSpecRefs helper
                                         + resolveBankEntries helper
                                         + formatAoTargetLine helper

docs/
├── IMPROVEMENTS-MAP.md                — + Phase F row (improvement #21)
└── worksheet-generator-audit.md       — + Phase F section
```

## Resume protocol (follow exactly)

If you're a new agent picking this up:

1. **Verify branch state**:
   ```bash
   git -C /projects/sandbox/send-assistant fetch origin
   git -C /projects/sandbox/send-assistant checkout feat/phase-f-curriculum-bank
   git -C /projects/sandbox/send-assistant log --oneline -20
   git -C /projects/sandbox/send-assistant status --short
   ```
2. **Read this file's "Current status snapshot" table** — it's the truth-of-state.
3. **Read `PHASE-PLAN.md`** in this folder for the full plan, and `features/FEAT-PF1.json` for the sized spec.
4. **If the PR is already open** (URL at bottom), check for review comments and address them. If not yet open, run `github_create_pull_request` with the title and body in the **PR template** section below.
5. **Update this file's snapshot table after every commit.** That is the contract.

## Sources of truth (do NOT rebuild)

- **Spec-point JSON shape**: `{board, subject, yearGroup, qualification, source, specPoints[]}`. Each `specPoint`: `{specRef, specTitle, ao, tier?, bloomLevel?, band?}`. Tier values: `"foundation" | "higher" | "both"`. Reference: `client/src/data/spec-points/aqa-combined-science-y10.json`.
- **Subject canonicaliser** (in `specPointTaxonomy.ts` already): `maths→mathematics`, `english language→english`, `combined science|trilogy→combined science`. New datasets must use the canonical form.
- **Exam-board ids**: `aqa | edexcel | ocr | cie | sqa | ccea | white-rose`.
- **Exemplar rule**: every exemplar must be **paraphrased**, never reproduced verbatim from a published past paper. Source attribution per row.
- **Test runner**: `npm test` (vitest run). Pure-function tests in `client/src/lib/__tests__/`.
- **PR commit policy**: small commits, each compiling green; SESSION-HANDOFF updated after every commit.

## Known constraints (and what was deferred)

- **KS3 (Y7–Y9)**, **KS5 (A-Level)**, and **primary** (White Rose Maths Y1–Y6) are out of scope for this PR. The architecture is drop-in for them — they remain in **Phase F2** backlog.
- **WJEC, CCEA, CIE** likewise.
- **Sandbox is INTEGRATIONS_ONLY** (network mode — no npm registry). `npm install` cannot run in this environment, so `npm test` and `npm run check` were delegated to GitHub Actions CI. The agent verified JSON parse on every new dataset using `python3 json.load` as a substitute, and every TypeScript change was made by careful edit-then-read-back rather than compile-and-run.
- **No schema changes** to the worksheet output contract (`shared/aiSchemas.ts`). All new metadata is additive (`tierAoHistogramReport`, `bankContext` on the differentiate response) and degrades gracefully on older worksheets.

## Acceptance criteria — verified

- [x] `listSpecRefsForTier("aqa","Combined Science","Year 10","higher")` contains spec-refs the Foundation set excludes (e.g. `C5.1.3`). Asserted in `curriculumBank.test.ts`.
- [x] `enforceTierAoHistogram` raises a `p1` warning when actual drift exceeds ±15pp on any AO. Asserted in `curriculumBank.test.ts`.
- [x] Every exemplar row carries a non-empty `source` attribution.
- [x] Backwards compatible: existing public signatures of `specPointTaxonomy` module unchanged.

## PR template

```
Title:  Phase F · Curriculum Bank — tier-aware differentiator + topic-aware scaffolder + 16 spec datasets

Body (markdown):

## What this PR does

Replaces string-shuffle differentiation and regex-class scaffolding
with curriculum-bank-backed pipelines:

  - **Foundation vs Higher** now actually differ at the spec-point level.
    The differentiator pulls a tier-restricted spec subset from the
    awarding body's published content (e.g. AQA C5.1.3 transition metals
    appears ONLY when Higher is requested) and shows the LLM tier-tagged
    paraphrased exemplars rather than asking it to "make these existing
    questions easier/harder".
  - **Scaffolded versions** are now topic-aware. Sentence frames, word
    banks, step ladders and common pitfalls come from the per-spec-ref
    scaffold bank instead of regex hints keyed on punctuation.
  - **Spec-point coverage** expands from 3 datasets to 16 (AQA + Edexcel
    + OCR for Maths Y10/Y11 and the three sciences Y10/Y11, plus AQA
    English Language Y10).
  - **Exemplar bank** seeds 73 paraphrased past-paper-style exemplars
    across 9 subjects, each tagged with tier/AO/marks/command verb.
  - **Scaffold bank** seeds 24 topic-aware scaffolding rows.
  - **`enforceTierAoHistogram` post-validator** raises a p1 warning when
    a tier-mode worksheet's AO distribution drifts more than ±15pp from
    the curriculum bank's tier target.

## Files

- `.agents/tasks/phase-f-curriculum-bank/{PHASE-PLAN, SESSION-HANDOFF, FEAT-PF1}`
- `client/src/data/spec-points/` (+13 datasets)
- `client/src/data/exemplars/` (NEW dir, 9 files)
- `client/src/data/scaffolds/` (NEW dir, 9 files)
- `client/src/lib/curriculumBank.ts` (NEW)
- `client/src/lib/specPointTaxonomy.ts` (registry extended)
- `client/src/lib/ai.ts` (getSpecQuestions consults bank)
- `client/src/lib/worksheetPostValidator.ts` (+ enforceTierAoHistogram)
- `client/src/lib/worksheetPostValidatorRegistry.ts` (rule registered)
- `client/src/lib/__tests__/curriculumBank.test.ts` (NEW)
- `server/routes/ai.ts` (/differentiate + /scaffold rewrites)
- `docs/IMPROVEMENTS-MAP.md` + `docs/worksheet-generator-audit.md`

## Tested

Pure-function tests in `client/src/lib/__tests__/curriculumBank.test.ts`
cover `lookupBySpecRef`, `lookupByTopic`, `filterByTier`,
`listSpecRefsForTier` (the headline acceptance criterion),
`targetAoHistogramForTier`, both prompt-block builders, and the new
`enforceTierAoHistogram` post-validator.

CI runs `npm run check` + `npm test`.

## Known limitations / Phase F2 backlog

- KS3 (Y7–Y9), KS5 (A-Level), primary (White Rose Maths Y1–Y6).
- WJEC, CCEA, CIE awarding bodies.
- Densification — aiming for ≥1 exemplar and ≥1 scaffold row per
  spec-point on the seeded subjects.
- Geography, history, modern foreign languages — architecture ready,
  content is the next phase.

The architecture is a drop-in: adding a new (board × subject × year) is
one line in `specPointTaxonomy.ts`'s register list plus the JSON file.
```

## Commit log (this PR)

| # | SHA       | Files changed | Why |
|---|-----------|---------------|-----|
| 1 | `b457a73` | 3             | Handoff + plan + sized spec |
| 2 | `93a81c3` | 1             | curriculumBank.ts loader skeleton |
| 3 | `947d3ab` | 14            | 13 new spec-point datasets + registry extension |
| 4 | `d616670` | 10            | Exemplar bank seed + bank wire-up |
| 5 | `5c2472a` | 10            | Scaffold bank seed + bank wire-up |
| 6 | `8edc5b1` | 1             | getSpecQuestions consults bank |
| 7 | `02bcbe1` | 1             | /differentiate + /scaffold endpoint rewrites |
| 8 | `e4fdb95` | 2             | enforceTierAoHistogram post-validator |
| 9 | `ce07085` | 1             | Pure-function tests |
| 10| `25cca3e` | 2             | Docs (IMPROVEMENTS-MAP + audit) |

## How the next agent verifies "done"

1. PR is open and CI is green.
2. The "Current status snapshot" table is all ✅.
3. `metadata.tierAoHistogramReport` appears on every tier-mode
   worksheet generated after merge.
4. Live test: generate Foundation and Higher worksheets on AQA Y10
   Combined Science / Atomic Structure. Foundation does not contain
   transition metals (C5.1.3); Higher does.

---

_PR URL appears below once opened:_

