# Big-Bang Improvements — 85-item ledger

This is the master plan for the 85 improvements to worksheet content
and the worksheet generator that were identified in the May 2026
audit. Items are batched into 28 sequential, PR-sized work units that
each respect the repo's existing sizing rules (≤ ~700 net lines, ≤
~12 files, one coherent concept per PR — see Phase 1–5 plans for the
shared discipline).

## How to read this file

- **PR-1 .. PR-28** = the work units. Each maps to one branch and
  one pull request. Sized so a fresh chat can finish it without
  exhausting context.
- **#1 .. #85** = the original audit-item numbers. Search this file
  for `#NN ` to find which PR a specific audit item lands in. The
  item-to-PR mapping is also kept in
  [`LEDGER.md`](./LEDGER.md) for one-screen scanning.
- The live status of every PR + every audit item is tracked in
  [`SESSION-HANDOFF.md`](./SESSION-HANDOFF.md). That file is the
  canonical resume point — read it before starting any new chat.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo, branch big-bang-improvements
         (or a sibling branch checked out from main).
Resume: .agents/tasks/big-bang-improvements/SESSION-HANDOFF.md
Plan:   .agents/tasks/big-bang-improvements/PHASE-PLAN.md
Ledger: .agents/tasks/big-bang-improvements/LEDGER.md
Constraint: do not read ai.ts, Worksheets.tsx, or WorksheetRenderer.tsx
            in full from a fresh chat (5,200 / 6,500 / 7,000+ lines).
            grep for the named exports first; read narrow ranges only.
            Sandbox is INTEGRATIONS_ONLY — do not run npm install.
            Type-check + tests run in CI on PR push.
Goal: complete the next un-shipped PR in
      .agents/tasks/big-bang-improvements/SESSION-HANDOFF.md
      then update SESSION-HANDOFF.md and LEDGER.md and open the PR.
```

## Why this exists

The Phase 1–5 / A–D plans already shipped most structural pedagogy
(see `docs/IMPROVEMENTS-MAP.md` and `docs/worksheet-generator-audit.md`).
A May 2026 audit identified a further 85 items split between **content
quality** (pupil-facing pedagogy, accessibility, SEND coverage,
diagrams) and **generator architecture** (validation, prompts,
exports, telemetry, ops). This phase is the umbrella for delivering
all 85.

Some items overlap with phase specs already on disk
(`.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD*.json`,
`.agents/tasks/phase-a-class-aware/features/FEAT-PR5.json`). Those
specs are the source of truth for those individual items — the PRs
below reference them rather than duplicating.

## Sequencing principle

PRs are ordered so that:

1. The highest-leverage, lowest-risk pure-validator additions ship
   first (PR-1 to PR-4). They give us measurable quality gates
   before riskier prompt edits.
2. The eval harness (PR-5) ships before any prompt change so every
   later PR has a regression baseline. (Audit item #44.)
3. Read-only audit surfaces (PR-6 audit panel) ship before write
   surfaces.
4. Server-side prompt unification (PR-7) ships before tenant-level
   feature flags so client/server parity is locked first.
5. Cost transparency + caching (PR-9) ships before any traffic-split
   experiment so spend is observable.
6. Schema-changing PRs (PR-16 stacked SEND profiles, PR-17
   department library) ship after additive PRs.
7. Integration-heavy items (LMS push, MIS roster, email, browser
   extension) are batched into PR-28 and ship last because they
   need external service credentials we cannot exercise from the
   sandbox.

## PR-by-PR

| PR     | Title                                                                                              | Audit items                                  | Status      |
| ------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------- |
| PR-1   | Phase 4 follow-up: SEND fidelity probes for the 12 missing profiles                                | #28                                          | shipped — PR #85 |
| PR-2   | New pure post-validators — command-word fidelity, SI-unit normaliser, reading-age budget           | #1 #2 #11 #14 #18                            | shipped — PR #86 |
| PR-3   | Diagram dependency integrity, distractor pedagogy probe, Tier-3 vocabulary audit, notation hygiene | #4 #10 #13 #15                               | shipped — PR #87 |
| PR-4   | Quality scorecard — wire WorksheetQAScore (already in schema, never computed)                      | #50                                          | shipped — PR #88 |
| PR-5   | Eval harness FEAT-PR5 — 200 canonical UK NC + GCSE prompts + golden-output runner                  | #44                                          | shipped — PR pending |
| PR-6   | Audit-trail panel — surface coverageMap / aoHistogram / fidelityReport in one teacher-facing view  | #79                                          | not started |
| PR-7   | Server-prompt unification — port curriculumAuthorityPrompt to server/routes/ai.ts                  | #39                                          | not started |
| PR-8   | Data-driven post-validator chain — array-of-fn registration, per-validator enable / disable        | #74                                          | not started |
| PR-9   | PD13 cost transparency + generation cache scaffolding                                              | #42 #43                                      | not started |
| PR-10  | Knowledge organiser (PD10) + Anchor poster + Now/Next/Then cards (PD11) — derived, no extra LLM    | #20 #21                                      | not started |
| PR-11  | Versioning + diff history (PD7)                                                                    | #66                                          | not started |
| PR-12  | Bias & sensitivity audit (PD9) — pure heuristics over names, contexts, settings                    | #12                                          | not started |
| PR-13  | Mark-scheme upgrades — synonym expansion, M/A/B itemisation, plausibility/order-of-magnitude rail  | #5 #6 #7                                     | not started |
| PR-14  | Bloom-monotonicity check, science working-space stub, question-difficulty progression validator    | #8 #9                                        | not started |
| PR-15  | Past-paper verbatim fingerprint detection                                                          | #3                                           | not started |
| PR-16  | Trauma-informed SEND profile, stacked SEND profiles, reading-age memory per pupil                  | #29 #30 #32 #82                              | not started |
| PR-17  | Department library + HOD moderation (FEAT-PD12)                                                    | #67                                          | not started |
| PR-18  | Continuous accessibility audit, alt-text quality, tactile graphics, plain English, dyslexia type   | #23 #24 #25 #26 #27                          | not started |
| PR-19  | Catalogue / coverage audits — vocabulary library, spec-point taxonomy, longitudinal progression    | #34 #35 #37 #38 #83 #84                      | not started |
| PR-20  | Higher-risk prompt eng — A/B framework, per-subject prompt families, self-consistency, citations   | #45 #46 #47 #48                              | not started |
| PR-21  | Engineering quality nets — ai.ts second carve-up, CI guards, property tests, snapshot matrix       | #52 #72 #73 #75 #77                          | not started |
| PR-22  | Quality SLA + docs — tiered warnings, schema deprecation, public LLM-output contract               | #49 #51 #53 #85                              | not started |
| PR-23  | Diagram pipeline — admin-gated SVG fallback, requestability ranking, page-fit budget, vector-only  | #54 #55 #56 #57                              | not started |
| PR-24  | Export hardening — DOCX/PDF parity, print-bleed/stapling, A3/A5/leaflet booklet presets            | #58 #59 #60                                  | not started |
| PR-25  | Cross-cutting — KS5 synoptic generator, MFL revision shell, edit-capture-that-learns               | #33 #36 #80                                  | not started |
| PR-26  | Pupil-facing companion app surface — consumes already-stamped companionShare / hint ladders        | #81                                          | not started |
| PR-27  | Telemetry — validator firing dashboard, regeneration heat-map, token + cost dashboard              | #42 #70 #71                                  | not started |
| PR-28  | DEFERRED integrations — LMS push, MIS roster, email-to-generate, share-sheet, ext, Mon-email       | #61 #62 #63 #64 #65 #68 #69                  | deferred    |

Items not assigned a PR above are duplicates, already shipped, or
explicit no-ops:

- #11 (cross-curricular UK-context whitelist) — folded into PR-2 SI
  unit normaliser; same idempotent rewriter shape.
- #16 (Common Mistakes for non-maths) — folded into PR-3 distractor
  pedagogy probe.
- #17 (misconception bank) — already partly built (`misconceptionLinks`,
  PB7); the registry-promotion is folded into PR-13.
- #18 (Self-Reflection command-word echo) — folded into PR-2.
- #19 (Revision-Tips time-budget reconcile with estimatedTime) —
  folded into PR-13.
- #22 (diagram coverage gap badge) — UI half folded into PR-6;
  pipeline half folded into PR-23.
- #31 (Class Pack visual diff) — folded into PR-6.
- #40 (prompt versioning + diff) — folded into PR-11.
- #41 (structured-output retry with diagnostic) — folded into PR-9
  alongside cost transparency since both touch the LLM round-trip.
- #76 (PII redaction in telemetry) — folded into PR-9 / PR-22.
- #78 (crash-free render rate) — folded into PR-22 SLA.

## Out-of-scope guardrails (every PR)

- Do not regress the existing `metadata.postValidatorWarnings`
  channel — every new validator stamps warnings via that channel.
- Do not introduce a parallel prompt path — extend
  `runWorksheetPostValidators` and `structuredSystemSections`.
- Do not change Worksheets.tsx form structure or Phase A
  `Auto-from-class` flow (that work is shipped).
- Every new schema field is **optional** so older worksheets keep
  rendering.
- Sandbox is INTEGRATIONS_ONLY — never run `npm install`.
- Pure functions only in `client/src/lib/`; side-effecting code
  (network, FS, DB) lives in `server/` or in scripts.

## Files expected to change in this phase

```
.agents/tasks/big-bang-improvements/PHASE-PLAN.md      (this file)
.agents/tasks/big-bang-improvements/SESSION-HANDOFF.md (live state)
.agents/tasks/big-bang-improvements/LEDGER.md          (item → PR map)
client/src/lib/                                        (most new validators / builders / helpers)
client/src/components/                                 (audit panel, knowledge organiser, anchor poster surfaces)
server/routes/ai.ts                                    (PR-7 server-prompt unification)
server/routes/                                         (new endpoints for cache, telemetry, dept library)
server/lib/                                            (cache layer, fingerprint corpus loader)
shared/aiSchemas.ts                                    (additive optional fields)
shared/types.ts                                        (additive types)
server/db/schema.sql                                   (PR-9 cache table, PR-11 versions, PR-17 dept library)
server/tests/worksheetScrutiny.test.ts                 (extend per PR — landlocked test file)
scripts/                                               (PR-5 eval harness runner, PR-19 audit scripts)
```

## Definition-of-done (per PR)

- [ ] CI passes (`npm test` + `tsc --noEmit`).
- [ ] LEDGER.md updated — every audit item the PR closes flipped to
      shipped with the PR number.
- [ ] SESSION-HANDOFF.md updated — current PR flipped to shipped,
      next PR set as NEXT, any context the next chat needs captured.
- [ ] No more than one PR open against this branch at a time.
