# Phase F · Curriculum Bank — SESSION-HANDOFF

> **This is the resume contract.** If you (the user) start a new chat for any
> reason — context limit, fresh window, a different machine — paste the
> contents of this file into the new chat with the message "resume Phase F"
> and the next agent will pick up exactly where the previous one stopped.
>
> This file is updated **after every commit** on the branch.

## Branch
`feat/phase-f-curriculum-bank` (off `main` at `ac03cde`)

Repo: `tahmidburner22-oss/send-assistant`

## Open PR
_PR not yet opened. URL will be written here on the final push._

## Current status snapshot

| Block | Status |
|---|---|
| Handoff + plan + sized spec | not yet committed |
| `client/src/lib/curriculumBank.ts` (loader) | not yet committed |
| Spec-points expansion (16 datasets) | not yet committed |
| Exemplar bank seed | not yet committed |
| Scaffold bank seed | not yet committed |
| `specPointTaxonomy.ts` registry extension | not yet committed |
| `client/src/lib/ai.ts` `getSpecQuestions()` integration | not yet committed |
| `/api/ai/differentiate-worksheet` rewrite | not yet committed |
| `/api/ai/scaffold-worksheet` rewrite | not yet committed |
| `tierAoHistogram` post-validator | not yet committed |
| Unit tests | not yet committed |
| `IMPROVEMENTS-MAP.md` + audit doc updates | not yet committed |
| `npm test` + typecheck green | not yet run |
| Pushed + PR opened | not yet done |

The matching todo list inside the agent session has 16 tasks; this file mirrors the same blocks at a higher level so you don't need the agent's todo state to resume.

## What this PR is doing (one paragraph)

Replacing string-shuffle differentiation and regex-class scaffolding with curriculum-bank-backed pipelines. After this PR, Foundation vs Higher actually differs at the **spec-point** level (uses `tier: "higher"` rows excluded by Foundation, and vice versa), with tier-specific AO histogram targeting; scaffolded versions pull **per-spec-ref sentence frames + word banks + step ladders** instead of regex hints; and the spec-point taxonomy expands from 3 datasets to ~16 covering AQA + Edexcel + OCR for the top GCSE subjects across Y10 and Y11.

## Architecture (final shape)

```
client/src/data/
├── spec-points/                  # source-of-truth specs (16 files after this PR)
│   ├── aqa-maths-y10.json        (existing)
│   ├── edexcel-maths-y10.json    (existing)
│   ├── aqa-combined-science-y10.json (existing)
│   ├── aqa-maths-y11.json        (NEW)
│   ├── edexcel-maths-y11.json    (NEW)
│   ├── ocr-maths-y10.json        (NEW)
│   ├── aqa-biology-y10.json      (NEW)
│   ├── aqa-chemistry-y10.json    (NEW)
│   ├── aqa-physics-y10.json      (NEW)
│   ├── edexcel-biology-y10.json  (NEW)
│   ├── edexcel-chemistry-y10.json (NEW)
│   ├── edexcel-physics-y10.json  (NEW)
│   ├── edexcel-combined-science-y10.json (NEW)
│   ├── aqa-combined-science-y11.json (NEW)
│   ├── edexcel-combined-science-y11.json (NEW)
│   └── aqa-english-language-y10.json (NEW)
├── exemplars/                    # NEW: paraphrased exemplar question bank
│   └── <board>-<subject>-<year>.json   (one per seeded subject)
└── scaffolds/                    # NEW: per-spec-ref scaffolding rows
    └── <board>-<subject>-<year>.json   (one per seeded subject)

client/src/lib/
├── curriculumBank.ts             # NEW: single lookup module
├── specPointTaxonomy.ts          # MODIFIED: load all datasets via REGISTRY
├── ai.ts                         # MODIFIED: getSpecQuestions() consults bank
└── worksheetPostValidator.ts     # MODIFIED: + tierAoHistogram check

server/routes/ai.ts               # MODIFIED:
                                  #  - /differentiate-worksheet rewrite
                                  #  - /scaffold-worksheet rewrite
                                  #  - buildLocalScaffold replacement

docs/
├── IMPROVEMENTS-MAP.md           # MODIFIED: + Phase F row
└── worksheet-generator-audit.md  # MODIFIED: + Phase F summary
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
2. **Read this file's "Current status snapshot" table** to see what's done and what's left.
3. **Read the Open Items section below** for any blockers or in-flight notes from the previous agent.
4. **Read `PHASE-PLAN.md`** in this folder for the full plan, and `features/FEAT-PF1.json` for the sized spec.
5. **Continue from the first unchecked block** in the snapshot table, in order.
6. **Update this file's snapshot table after every commit.** That is the contract.

## Sources of truth (do NOT rebuild)

- **Spec-point JSON shape**: `{board, subject, yearGroup, qualification, source, specPoints[]}`. Each `specPoint`: `{specRef, specTitle, ao, tier?, bloomLevel?, band?}`. Tier values: `"foundation" | "higher" | "both"`. Reference: `client/src/data/spec-points/aqa-combined-science-y10.json`.
- **Subject canonicaliser** (in `specPointTaxonomy.ts` already): `maths→mathematics`, `english language→english`, `combined science|trilogy→combined science`. New datasets must use the canonical form.
- **Exam-board ids**: `aqa | edexcel | ocr | cie | sqa | ccea | white-rose`.
- **Exemplar rule**: every exemplar must be **paraphrased**, never reproduced verbatim from a published past paper. Source attribution per row.
- **Test runner**: `npm test` (vitest run). Pure-function tests in `client/src/lib/__tests__/`.
- **PR commit policy**: small commits, each compiling green; SESSION-HANDOFF updated after every commit.

## Open items / known constraints

- **Scope cap for one PR**: this is a single mega-PR delivering the architecture + 16 spec datasets + ~80 seeded exemplars + scaffolds for the seeded subjects. KS3 (Y7–Y9), KS5 (A-Level), and primary (White Rose Maths Y1–Y6) are **out of scope for this PR** and remain to be added in a follow-up Phase F2. The architecture supports them as drop-in datasets.
- **Backwards compatibility**: every existing public function in `specPointTaxonomy.ts` and the existing route response shapes (`/differentiate-worksheet`, `/scaffold-worksheet`) must keep their signatures. Behaviour upgrades are additive.
- **No schema changes** to the worksheet output contract (`shared/aiSchemas.ts`). All new metadata is optional and degrades gracefully on older worksheets.
- **The eval harness** (`server/tests/worksheet-eval/`) must still pass after this PR with no fixture changes — Phase F should cause `qa-score-floor` and `spec-ref-present` to *go up*, never down. Run `npm run eval:worksheets` (mock mode is default) to verify.

## How the next agent verifies "done"

1. `npm test` exits 0.
2. `npm run check` (TypeScript) exits 0.
3. `npm run eval:worksheets` exits 0 with no fixture failures.
4. The PR is open and linked above.
5. The "Current status snapshot" table at the top of this file is all ✅.

## Commit log (this PR)

_To be filled in as commits land. Update this list — and the snapshot table — after every commit._

| # | SHA | Files | Why |
|---|-----|-------|-----|
| _none yet_ | — | — | — |

