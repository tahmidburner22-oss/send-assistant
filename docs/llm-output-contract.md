# Public LLM-output contract

> Audit item #85. PR-22.
>
> This document is the canonical reference for every metadata field
> emitted by the worksheet generator's structured-output channel.
> It is the contract between the LLM round-trip, the post-validator
> chain, and every downstream consumer (the renderer, the audit
> trail panel, the eval harness, the cost dashboard).
>
> **Stability tier guarantees:**
> - **stable** — fields will not be renamed or removed within ≥ 12 months. Deprecations follow the schedule below.
> - **beta** — fields may be renamed at the next minor release. Two weeks notice.
> - **internal** — undocumented; consumers should not rely on it.
>
> Last reviewed: 2026-05-23 (PR-19..27 combined).

## How to add a new field

1. Add the field to `shared/aiSchemas.ts` as `optional()` so older
   worksheets keep parsing.
2. Add a row to the relevant table below with stability tier
   `beta` for the first 30 days.
3. After 30 days of stable shape, promote to `stable` in this doc.
4. To deprecate a field, tag the schema entry with
   `/** @deprecated YYYY-MM-DD — replaced by … */` and add a row
   to the **Deprecations** section below. CI runs
   `scripts/check-schema-deprecations.mjs` to verify the sunset.

## Top-level worksheet fields

| Field | Type | Stability | Owner | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | stable | curriculum | Pupil-facing |
| `subtitle` | string | stable | curriculum | Optional |
| `sections` | WorksheetSection[] | stable | curriculum | 1..80 entries |
| `metadata` | object | stable | platform | All other fields below |

## metadata.* — stable

| Field | Type | Stability | Notes |
| --- | --- | --- | --- |
| `subject` | string | stable | Free-form lower-case |
| `yearGroup` | string | stable | "Year 9" \| "Y10" \| "KS5" |
| `topic` | string | stable | Free-form |
| `difficulty` | string | stable | "foundation" \| "higher" \| "mixed" |
| `examBoard` | string | stable | "aqa" \| "edexcel" \| "ocr" \| "wjec" \| "ccea" |
| `sendNeed` | string\|null | stable | Single-need worksheets |
| `sendNeeds[]` | string[] | stable | PR-16. Stacked profiles |
| `provider` | string | stable | LLM provider id |
| `generatedAt` | ISO string | stable | UTC |
| `qaScore` | object | stable | PR-4. Quality scorecard |
| `coverageMap` | object | stable | FEAT-PC10 |
| `aoHistogram` | object | stable | Pillar A |
| `sendFidelityReport` | object | stable | FEAT-PB6 |
| `misconceptionLinks[]` | object[] | stable | FEAT-PB7 |
| `commonMistakesAudit` | object | stable | PR-M3 |
| `costEstimate` | object | stable | PR-9 |
| `cacheKey` | string | stable | PR-9 |
| `cacheHit` | boolean | stable | PR-9 |

## metadata.* — beta (PR-10..18)

| Field | Type | Stability | Notes |
| --- | --- | --- | --- |
| `knowledgeOrganiser` | object | beta | PR-10 |
| `anchorPoster` | object | beta | PR-10 |
| `nowNextThen` | object | beta | PR-10 |
| `versionHistory[]` | object[] | beta | PR-11. Capped at 50 entries. |
| `biasSensitivityReport` | object | beta | PR-12 |
| `markSchemeUpgrades` | object | beta | PR-13 |
| `bloomProgressionReport` | object | beta | PR-14 |
| `pastPaperFingerprintMatches[]` | object[] | beta | PR-15 |
| `accessibilityReport` | object | beta | PR-18 |

## metadata.* — beta (PR-19..27 combined batch)

| Field | Type | Stability | Notes |
| --- | --- | --- | --- |
| `synopticStem` | object | beta | PR-25 KS5 only. `{ stem, threadedTopics, suggestedMarks, level }` |
| `editLearnings[]` | object[] | beta | PR-25. `{ kind, sectionTitle, substitutions?, confidence, capturedAt }` |
| `diagramCoverage` | object | beta | PR-23. `{ expected, present, missingSections[] }` |
| `printPreset` | string | beta | PR-24. Optional A3/A5/booklet preset name. |
| `validatorSeverityRoll` | object | beta | PR-22. Per-severity counts. |

## Tier definitions for warning severity

| Severity | Definition | Surface |
| --- | --- | --- |
| `p0` | Blocking — a defect that should not ship. | Teacher banner with hard stop. |
| `p1` | Important — a fidelity gap a teacher must see before publishing. | Teacher banner counter. |
| `p2` | Advisory — heuristic / stylistic checks. | Audit-trail panel only. |

## Deprecations

| Field | Sunset | Replacement | Note |
| --- | --- | --- | --- |
| _(none currently active)_ | — | — | Track new entries here when a field is tagged `@deprecated YYYY-MM-DD` in `shared/aiSchemas.ts`. |

## Public LLM-output stability promise

- Adding an optional field is non-breaking.
- Renaming a field is breaking — must be deprecated first with a
  sunset of at least 12 weeks for `stable` fields, 4 weeks for
  `beta` fields.
- Removing a field is breaking — same windows.
- Changing a field's enum / value range is breaking — same windows.
- The post-validator chain order is internal; tenant overrides via
  `validatorOverrides` are part of the contract (PR-8).
- Rule names in `worksheetPostValidatorRegistry.ts` are part of the
  contract (PR-8) — they cannot be renamed without a deprecation.
