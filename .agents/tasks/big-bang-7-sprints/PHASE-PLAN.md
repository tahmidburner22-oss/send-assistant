# Big-Bang 7-Sprint Plan — 4 PRs

The user's original brief was 7 sprints. The constraint is "least
amount of PRs." Bundling rule: **bundle when the dependency direction
is one-way and the review profile is the same; split when reviewer
skills differ.**

This phase consolidates 7 sprints into **4 PRs**:

| PR  | Sprints   | Title                                   | Why bundled                                                                                   |
| --- | --------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | 1 + 3     | Measurement foundation + prompt arch    | Measuring without fixing wastes a cycle; fixing without measuring is faith-based.             |
| 2   | 2         | Spec-point taxonomy expansion           | Pure data entry; isolated review surface (a Subject Lead can review without reading code).    |
| 3   | 4 + 6     | Examiner-voice cadence + SEND moat      | Both depend on PR-1's measurement layer to prove improvement; one eval run validates both.    |
| 4   | 5 + 7     | Source-driven generation + scorecard    | UX/distribution layer; needs PR-1 baselines as scorecard input.                               |

## Dependency graph

```
                 PR-1 (measure + prompt arch) ──┬──> PR-3 (cadence + SEND)
                                                └──> PR-4 (source + scorecard)
PR-2 (taxonomy expansion) ── independent, parallel-safe
```

PR-2 can land in parallel with PR-1; PR-3 and PR-4 sequence after PR-1.

---

## PR-1 — Measurement foundation + prompt architecture

Branch: `big-bang-7/pr-1-measure-and-prompt-arch`

Deliverables (every one must be in the merged diff):

### Sprint 1 — Measurement foundation

| Item | File | Status |
| --- | --- | --- |
| 6-axis × 1–5 teacher-rater rubric with anchors | `docs/teacher-rater-rubric.md` (new) | not started |
| 30-fixture comparison corpus across segments + SEND | `server/tests/worksheet-eval/comparison-corpus.json` (new) | not started |
| Model-judge harness (cross-provider) | `server/tests/worksheet-eval/modelJudgeRater.ts` (new) | not started |
| `EvalReport` schema additive: `humanScores`, `modelJudgeScores` | `server/tests/worksheet-eval/types.ts` (extend) | not started |
| Markdown summary shows per-axis breakdown | `server/tests/worksheet-eval/summariser.ts` (extend) | not started |
| Baseline checked in for PR diffs | `server/tests/worksheet-eval/eval-report.baseline.json` (new) | not started |
| Nightly CI invokes model-judge when keys present | `.github/workflows/worksheet-eval.yml` (extend) | not started |

### Sprint 3 — Prompt architecture

| Item | File | Status |
| --- | --- | --- |
| Two-pass generator (skeleton + parallel section fill) | `client/src/lib/aiGenerateWorksheetTwoPass.ts` (new — orchestrator wraps existing aiGenerateWorksheet under feature flag `WORKSHEET_TWO_PASS_ENABLED`) | not started |
| Validator-feedback retry: re-prompt once when ≥3 validators fire | `client/src/lib/validatorFeedbackRetry.ts` (new — invoked from `runWorksheetPostValidators` tail) | not started |
| Per-subject prompt family audit + unit test | `client/src/lib/__tests__/perSubjectPromptFamilies.test.ts` (new) | not started |
| Wire `promptAbFramework` into eval harness | `server/tests/worksheet-eval/runner.ts` + `generators.ts` (extend) | not started |
| Wire `selfConsistencySampler` onto Section 3 | `client/src/lib/aiGenerateWorksheetTwoPass.ts` (orchestrator hook) | not started |

### Sprint 1+3 verification gate (CI must pass before PR opens)

- [ ] `npm test` green (vitest)
- [ ] `tsc --noEmit` green
- [ ] `npm run eval:worksheets` produces an `eval-report.json` with the per-axis `modelJudgeScores` block populated when keys are present, empty `{}` otherwise
- [ ] Mock-mode model-judge yields a deterministic stub score (so CI without keys is meaningful)
- [ ] Validator-fire-rate per worksheet on the 30-fixture corpus does NOT regress versus baseline

---

## PR-2 — Spec-point taxonomy expansion

Branch: `big-bang-7/pr-2-taxonomy-expansion`

Deliverables:

| Item | File(s) | Status |
| --- | --- | --- |
| AQA + Edexcel KS3 Sciences (Y7/8/9) | `client/src/lib/specPointTaxonomy/datasets/aqa-ks3-sciences.ts`, `edexcel-ks3-sciences.ts` (new — registered into `specPointTaxonomy.ts`) | not started |
| AQA Y10/11 History, Geography, Religious Studies | `client/src/lib/specPointTaxonomy/datasets/aqa-{history,geography,rs}-y10-y11.ts` (new) | not started |
| AQA + Edexcel English Literature Y10/11 | `client/src/lib/specPointTaxonomy/datasets/{aqa,edexcel}-english-literature-y10-y11.ts` (new) | not started |
| OCR Sciences Y10/11 | `client/src/lib/specPointTaxonomy/datasets/ocr-{biology,chemistry,physics}-y10-y11.ts` (new) | not started |
| AQA A-Level Maths/Bio/Chem/Phys | `client/src/lib/specPointTaxonomy/datasets/aqa-a-level-{maths,biology,chemistry,physics}.ts` (new) | not started |
| Per-dataset eval-harness fixture | `server/tests/worksheet-eval/fixtures/<board>-<subject>-<year>.json` (new) | not started |
| `confidence: "kiro-derived"` metadata field on every new dataset | (in dataset files) | not started |

### Verification gate

- [ ] All new datasets parse + pass schema check (Zod / interface match)
- [ ] `enforceSpecAnchorPresence` matches a real spec ref in ≥95% of the 30-fixture comparison corpus from PR-1 (PR-2 inherits the corpus once PR-1 lands)
- [ ] `tsc --noEmit` green; `npm test` green

---

## PR-3 — Examiner-voice cadence + SEND moat

Branch: `big-bang-7/pr-3-cadence-and-send-moat`

### Sprint 4 — Question cadence

| Item | File | Status |
| --- | --- | --- |
| `examinerVoicePass.ts` post-validator | `client/src/lib/examinerVoicePass.ts` (new — slotted between `markSchemeReconciler` and `mathsVerifier` in `worksheetPostValidator.ts`) | not started |
| Cadence corpus scaffold + loader | `client/src/lib/cadenceCorpus/index.ts`, `client/src/lib/cadenceCorpus/<board>-<subject>.ts` (new) | not started |
| Few-shot injection into examiner-voice prompt (cap 3) | `client/src/lib/examinerVoicePass.ts` (helper) | not started |
| `pastPaperFingerprint` cadence-drift detection | `client/src/lib/pastPaperFingerprint.ts` (extend — add `enforceCadenceDrift`) | not started |
| Regenerate `questionBank*.ts` through examiner-voice pass (preserve IDs + metadata) | `scripts/exam-bank-examiner-voice-pass.mjs` (new) + bank file diffs | not started |

### Sprint 6 — SEND moat

| Item | File | Status |
| --- | --- | --- |
| Promote `ehcp-enhancements` + `pupil-context` to first-class input on `aiGenerateWorksheet` | `client/src/lib/ai.ts` §GENERATE around L1003 + `client/src/lib/aiWorksheetEhcpBridge.ts` (new bridge module) | not started |
| Productise `class-pack.ts` for core/supported/extension PDFs | `client/src/lib/class-pack.ts` (extend `runClassPack` to accept tier-set) | not started |
| Voice-readable export mode (DOCX/HTML clean) | `client/src/lib/voiceReadableExport.ts` (new) | not started |
| Alt-text quality check in `wcagAuditor` | `client/src/lib/wcagAuditor.ts` (extend) | not started |
| Selective Mutism + DLD profiles | `client/src/lib/sendPromptFragments.ts` + `sendStackedProfiles.ts` + `sendFidelityAudit.ts` (extend) | not started |
| Evidence-pack auto-generator | `client/src/lib/evidencePackGenerator.ts` (new) | not started |
| Axe-core Playwright smoke test | `client/tests/e2e/axe-worksheet.spec.ts` (new) + workflow | not started |

### Verification gate

- [ ] PR-1's eval harness shows model-judge "stem authenticity" axis improved versus baseline
- [ ] `mathsVerifier` still passes on regenerated questionBank entries (no regression)
- [ ] New SEND probe tables pass for SM and DLD profiles (`sendFidelityAudit` returns ratio ≥0.5)
- [ ] Axe-core test green
- [ ] `tsc --noEmit` + `npm test` green

---

## PR-4 — Source-driven generation + visual polish + public scorecard

Branch: `big-bang-7/pr-4-source-and-scorecard`

### Sprint 5 — Diffit-killer + visual polish

| Item | File | Status |
| --- | --- | --- |
| `aiGenerateWorksheetFromSource` | `client/src/lib/ai.ts` (new export, ~200 lines, slotted near `aiGenerateWorksheetFromClassBrief` at L4192) | not started |
| Vision-input mode behind `callAI` | `client/src/lib/ai.ts` (extend `callAI` and `callAIMessages`) | not started |
| Diagram polish (palettes/borders/sketch filter/SVG→PNG) | `client/src/lib/diagramTheme.ts` (new) + `client/src/lib/svgRasteriser.ts` (new) | not started |
| Three primary-phase layout templates | `client/src/lib/printPresets.ts` (extend) + new CSS in `WorksheetRenderer` print path | not started |
| Live preview (skeleton-first render) | `client/src/components/WorksheetRendererStreaming.tsx` (new — wraps existing renderer) | not started |

### Sprint 7 — Public eval scorecard

| Item | File | Status |
| --- | --- | --- |
| Public scorecard generator (markdown + JSON) | `scripts/build-public-scorecard.mjs` (new) | not started |
| Quarterly snapshot tag | `.github/workflows/eval-snapshot.yml` (new) | not started |
| Exemplar-pack scaffolder (20 worksheets across segments + SEND) | `scripts/build-exemplar-pack.mjs` (new) | not started |

### Verification gate

- [ ] `aiGenerateWorksheetFromSource` round-trips a known input fixture deterministically (mock-mode test)
- [ ] Scorecard generator runs on a real `eval-report.json` and emits the expected markdown shape
- [ ] No regression on PR-1's 30-fixture corpus (rerun harness)
- [ ] `tsc --noEmit` + `npm test` green

---

## Hard sizing rules (apply to every PR)

- **Schema additions are additive only.** Optional fields. Older outputs keep loading.
- **Bank edits are append-only.** Never modify existing question entries; new entries only.
- **No npm install.** Sandbox is `INTEGRATIONS_ONLY`. CI on PR push runs `npm test` + `tsc --noEmit`.
- **All new validators are pure + idempotent.** Running twice yields the same output as running once. `worksheetScrutiny.test.ts` enforces this for every new validator.
- **Subject-aware everywhere.** Sciences must NOT get the maths-only working-out box (Phase 1 lock). AO codes are AO1–AO4 only. Never invent spec codes.
- **Conservative validators.** When in doubt, warn — don't rewrite. Silent rewriting papers over real generation failures.
- **Single source of truth.** Every new validator/builder lives in one file under `client/src/lib/`; the prompt and the post-validator both import from it.

## Out of scope (deliberately, for the entire 4-PR run)

- Real past-paper licensing / actual past-paper stems. Cadence corpus uses public-domain placeholders tagged `source: "TODO_REAL_PASTPAPER"` so the swap is one PR when the user has the licensing.
- Subject-Lead sign-off on the new taxonomies. Datasets ship with `confidence: "kiro-derived"` metadata so the system can downgrade gracefully if a SL later flags errors.
- Physical print-test on real printers. PR-4 generates a 5-worksheet sample-pack PDF for the user to take to printers.
- Paid teacher-rater wave. PR-1's rubric + corpus + handoff CSV format make this a one-PR operation when the user has rater data.
- JAWS/NVDA real-screen-reader testing. Axe-core catches static issues; interaction quality is a SENCo handoff.
