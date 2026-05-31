/**
 * worksheetPostValidatorRegistry.ts
 *
 * PR-8 — audit item #74. Data-driven post-validator chain.
 *
 * Before this PR, `runWorksheetPostValidators` in
 * `worksheetPostValidator.ts` ran the 22-step validator chain via a
 * giant inline `for (const fn of [ … ])` block. That worked, but it
 * meant any caller wanting to disable a single validator (per-tenant
 * feature flags, eval-harness focus runs, regression-bisecting a flaky
 * validator) had to fork the chain.
 *
 * This module is the single source of truth for **validator order** and
 * **validator names**. It exports:
 *
 *   - `WORKSHEET_POST_VALIDATORS` — a frozen ordered array of
 *     `{ name, fn }` records, one per validator in the chain. The names
 *     are stable kebab-case identifiers (e.g. "single-mcq-correct") so
 *     they can be referenced in config / tenant flags / eval harnesses.
 *   - `runRegistry(ws, opts, overrides)` — runs the registry in order
 *     against the supplied worksheet, returns
 *     `{ worksheet, warnings, ranNames, skippedNames, unknownOverrides }`.
 *     `overrides` is an optional `Record<name, boolean>`; entries set to
 *     `false` skip that validator. Unknown names in `overrides` are
 *     reported via `unknownOverrides` (and surfaced as warnings by the
 *     caller) rather than silently ignored.
 *
 * Every validator registered here MUST be:
 *   - Pure (takes a worksheet, returns a new worksheet — no mutation).
 *   - Idempotent (running twice is the same as running once).
 *   - Conservative (never deletes content the LLM generated correctly).
 *   - Observable (appends a human-readable warning for every fix).
 *
 * Out of scope for PR-8 (per PHASE-PLAN.md):
 *   - Per-validator config schemas (PR-22 SLA work).
 *   - The actual UI for toggling validators (PR-27 telemetry surface).
 *   - The qaScore stamping pass — that runs AFTER the registry because
 *     it consumes the merged warnings (and so isn't part of the
 *     warning-emitting chain). See `runWorksheetPostValidators`.
 */

import {
  enforceSingleMcqCorrect,
  dedupeWordBank,
  stripForeignDiagrams,
  stripEmptyDiagramPlaceholders,
  enforceYearGroupLock,
  capWorkedExampleSteps,
  stripLeakedGeneratorInstructions,
  enforceMarksBracketStyle,
  stripVisiblePlaceholdersAndAnswerLeakage,
  reinforceDyscalculiaMathsScaffolding,
  extractMisconceptionLinks,
  enforceSectionQuestionCounts,
  enforceApplicationQuestionCap,
  enforceSpecAnchorPresence,
  enforceSelfReflectionTopicAnchor,
  enforceRevisionTipsPresence,
  enforceCurriculumAuthorityInvariants,
  enforceCommandWordFidelity,
  enforceSiUnitNormalisation,
  enforceReadingAgeBudget,
  enforceMathsNotationHygiene,
  enforceTierAoHistogram,
  enforceDiagramDependencyIntegrity,
  enforceDistractorPedagogy,
  enforceTier3VocabularyDeclared,
  // Lane 1.6 + 1.7 — Phase 4 SEND-marker enforcer.
  enforceSendOverlayMarkers,
  type PostValidatorWorksheet,
  type PostValidatorOptions,
  type PostValidatorResult,
} from "./worksheetPostValidator";

import { reconcileMarkScheme } from "./markSchemeReconciler";

// PR-10 to PR-18 (combined) — new validators registered after the
// existing chain. Each is pure / idempotent / warn-only and takes a
// worksheet structurally compatible with `PostValidatorWorksheet`.
// We cast through `unknown` because the new modules keep their own
// narrower input/output types so they can be unit-tested in isolation
// without depending on this module's full type surface.
import { enforceBiasSensitivity } from "./biasSensitivityAudit";
import { enforceMarkSchemeUpgrades } from "./markSchemeUpgrades";
import { enforceBloomProgression } from "./bloomProgressionAudit";
import { enforcePastPaperFingerprint } from "./pastPaperFingerprint";
import { enforceAccessibilityAudit } from "./accessibilityAudit";

// PR-19 to PR-27 (combined) — additional validators behind the same
// adapt() pattern. Every entry is pure / idempotent / warn-only.
import { enforceSpVocabularyLibrary } from "./spVocabularyLibraryAudit";
import { enforceSpecPointTaxonomy } from "./specPointTaxonomyAudit";
import { enforceKs5Synoptic } from "./ks5SynopticBuilder";
import { enforceDiagramPageFit } from "./diagramPageFitAudit";
import { enforceCitationGrounding } from "./citationGroundedFactual";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Uniform validator shape so the dispatch loop can call every validator
 * the same way. Validators that don't need `opts` simply ignore it. Any
 * validator that previously closed over `opts` via an inline arrow gets
 * its arguments hoisted to this signature.
 */
export type ValidatorFn = (
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions,
) => PostValidatorResult;

/**
 * One row in the registry. `name` is a stable kebab-case identifier;
 * `fn` is the validator. `enabled` defaults to `true` — set `false` in
 * the registry for validators that ship in code but are not on by
 * default.
 */
export interface PostValidatorRegistration {
  readonly name: string;
  readonly fn: ValidatorFn;
  readonly enabled?: boolean;
}

/**
 * Result of running the registry. `worksheet` is the final
 * post-validated worksheet. `warnings` is the accumulated list (in
 * order) the validators stamped. `ranNames` / `skippedNames` are the
 * audit trail of which validators actually ran; `unknownOverrides` is
 * the list of override keys the caller supplied that did not match any
 * registered validator name (caller-side hygiene check).
 */
export interface RunRegistryResult {
  worksheet: PostValidatorWorksheet;
  warnings: string[];
  ranNames: string[];
  skippedNames: string[];
  unknownOverrides: string[];
}

// ─── Adapters ────────────────────────────────────────────────────────────────
//
// Some validators take only `(ws)`; some take `(ws, opts)`. The registry
// signature is uniform `(ws, opts) => result`. We use inline arrow
// functions in the registration array (not eager-binding adapters) so
// the validator references are dereferenced at call-time rather than at
// registry-module-init. This keeps the circular-import shape between
// `worksheetPostValidator.ts` ↔ `worksheetPostValidatorRegistry.ts`
// safe under ESM's live-binding semantics — even though
// `worksheetPostValidator.ts` imports `runRegistry` at the top of its
// module, the registry's own validator references resolve at the
// moment `runRegistry` actually walks the array, by which time the
// other module's named exports are fully initialised.

/**
 * PR-10..18 — Lifts a validator with a narrower local input/output
 * type into the canonical `(PostValidatorWorksheet, PostValidatorOptions)
 * => PostValidatorResult` shape the registry expects. The new modules
 * keep their own narrower types so they can be unit-tested in isolation
 * without depending on this module's full type surface; the cast is
 * sound because every narrow type is a structural subset of
 * `PostValidatorWorksheet` (same `sections` + `metadata` access pattern).
 */
function adapt<T extends { sections?: unknown; metadata?: unknown }>(
  fn: (ws: T) => { worksheet: T; warnings: string[] },
): ValidatorFn {
  return (ws, _opts) => {
    const r = fn(ws as unknown as T);
    return {
      worksheet: r.worksheet as unknown as PostValidatorWorksheet,
      warnings: r.warnings,
    };
  };
}

// ─── Registry ────────────────────────────────────────────────────────────────
//
// Order matters and mirrors the original inline `for (const fn of [ … ])`
// chain in `worksheetPostValidator.ts:runWorksheetPostValidators` exactly
// — every block-comment justification for a given position has been
// preserved on the corresponding row below. Reordering this array
// silently changes the order downstream validators see the worksheet
// in, so the test suite locks the order in `worksheetScrutiny.test.ts`.

export const WORKSHEET_POST_VALIDATORS: ReadonlyArray<PostValidatorRegistration> =
  Object.freeze<PostValidatorRegistration[]>([
    { name: "single-mcq-correct", fn: (ws, _opts) => enforceSingleMcqCorrect(ws) },
    { name: "dedupe-word-bank", fn: (ws, _opts) => dedupeWordBank(ws) },
    { name: "strip-foreign-diagrams", fn: (ws, opts) => stripForeignDiagrams(ws, opts) },
    {
      name: "strip-empty-diagram-placeholders",
      fn: (ws, _opts) => stripEmptyDiagramPlaceholders(ws),
    },
    { name: "year-group-lock", fn: (ws, opts) => enforceYearGroupLock(ws, opts) },
    {
      name: "cap-worked-example-steps",
      fn: (ws, opts) => capWorkedExampleSteps(ws, opts),
    },
    {
      name: "strip-leaked-generator-instructions",
      fn: (ws, _opts) => stripLeakedGeneratorInstructions(ws),
    },
    // IMP-06 — GCSE round-bracket mark style. Runs right after the leak
    // sanitiser so every later validator + the renderer see "(N marks)".
    {
      name: "marks-bracket-style",
      fn: (ws, _opts) => enforceMarksBracketStyle(ws),
    },
    {
      name: "strip-visible-placeholders-and-answer-leakage",
      fn: (ws, _opts) => stripVisiblePlaceholdersAndAnswerLeakage(ws),
    },
    {
      name: "reinforce-dyscalculia-maths-scaffolding",
      fn: (ws, opts) => reinforceDyscalculiaMathsScaffolding(ws, opts),
    },
    // PR worksheet-gen-efficiency #7 — deterministic mark-scheme
    // reconciler. Runs AFTER MCQ/word-bank fixes and BEFORE the
    // misconception-link extractor.
    { name: "reconcile-mark-scheme", fn: (ws, opts) => reconcileMarkScheme(ws, opts) },
    // FEAT-PB7 — extract per-MCQ misconception linkage AFTER all
    // other content rewrites.
    {
      name: "extract-misconception-links",
      fn: (ws, _opts) => extractMisconceptionLinks(ws),
    },
    // IMP-04 — trim Section 3 (application) to the GCSE cap of 5 BEFORE the
    // count contract runs, so the final warning surface is clean once excess
    // exam-style questions have been removed.
    {
      name: "application-question-cap",
      fn: (ws, opts) => enforceApplicationQuestionCap(ws, opts),
    },
    // Phase 1 — section-count contract (7-7-5 + 1).
    {
      name: "section-question-counts",
      fn: (ws, opts) => enforceSectionQuestionCounts(ws, opts),
    },
    // Phase 1 — curriculum + GCSE spec lock.
    { name: "spec-anchor-presence", fn: (ws, opts) => enforceSpecAnchorPresence(ws, opts) },
    // Lane 1.6 + 1.7 — Phase 4 SEND-marker enforcer. Runs BEFORE
    // self-reflection-topic-anchor so the reflection validator sees the
    // post-rename Anxiety section titles. Inserts a fresh section for
    // HI worksheets when the AI omitted the Topic Summary block, and
    // renames the Challenge / Section 1 titles for Anxiety/SEMH
    // worksheets to remove threat-language.
    {
      name: "send-overlay-markers",
      fn: (ws, opts) => enforceSendOverlayMarkers(ws, opts),
    },
    // Phase 2 — topic-specific Self-Reflection.
    {
      name: "self-reflection-topic-anchor",
      fn: (ws, opts) => enforceSelfReflectionTopicAnchor(ws, opts),
    },
    // Phase 3 — examiner-voice Revision Tips.
    {
      name: "revision-tips-presence",
      fn: (ws, opts) => enforceRevisionTipsPresence(ws, opts),
    },
    // Phase 5 — curriculum-authority invariants.
    {
      name: "curriculum-authority-invariants",
      fn: (ws, _opts) => enforceCurriculumAuthorityInvariants(ws),
    },
    // PR-2 — three new pure / idempotent validators at the END of the
    // chain so they audit the FINAL post-validated content.
    {
      name: "command-word-fidelity",
      fn: (ws, opts) => enforceCommandWordFidelity(ws, opts),
    },
    {
      name: "si-unit-normalisation",
      fn: (ws, opts) => enforceSiUnitNormalisation(ws, opts),
    },
    { name: "reading-age-budget", fn: (ws, opts) => enforceReadingAgeBudget(ws, opts) },
    // PR-3 — four validators auditing the FINAL post-validated content.
    // Notation hygiene runs FIRST among the PR-3 group so the next
    // three see clean notation.
    {
      name: "maths-notation-hygiene",
      fn: (ws, _opts) => enforceMathsNotationHygiene(ws),
    },
    {
      name: "diagram-dependency-integrity",
      fn: (ws, _opts) => enforceDiagramDependencyIntegrity(ws),
    },
    { name: "distractor-pedagogy", fn: (ws, _opts) => enforceDistractorPedagogy(ws) },
    {
      name: "tier3-vocabulary-declared",
      fn: (ws, _opts) => enforceTier3VocabularyDeclared(ws),
    },
    // PR-10 to PR-18 (combined) — new validators added at the END of
    // the chain so they audit FINAL post-validated content. All are
    // warn-only; none mutate pupil-facing content.
    // PR-12 (audit #12) — Bias & sensitivity heuristics.
    { name: "bias-sensitivity", fn: adapt(enforceBiasSensitivity) },
    // PR-13 (#5 #6 #7) — Mark-scheme synonyms / method marks /
    // plausibility rail.
    { name: "mark-scheme-upgrades", fn: adapt(enforceMarkSchemeUpgrades) },
    // PR-14 (#8 #9) — Bloom monotonicity + science working-space stub.
    { name: "bloom-progression", fn: adapt(enforceBloomProgression) },
    // PR-15 (#3) — Past-paper verbatim fingerprint detection.
    { name: "past-paper-fingerprint", fn: adapt(enforcePastPaperFingerprint) },
    // PR-18 (#23 #24 #25 #26 #27) — Accessibility / alt-text / tactile
    // / plain-English / dyslexia typography composite audit.
    { name: "accessibility-audit", fn: adapt(enforceAccessibilityAudit) },
    // ─── PR-19 to PR-27 (combined) ────────────────────────────────────
    // PR-19 (#83) — Subject-vocabulary library audit (worksheet slice).
    { name: "sp-vocabulary-library", fn: adapt(enforceSpVocabularyLibrary) },
    // PR-19 (#35 #84) — Spec-point taxonomy completeness audit
    // (worksheet slice; the corpus runner lives in scripts/).
    { name: "spec-point-taxonomy", fn: adapt(enforceSpecPointTaxonomy) },
    // PR-25 (#36) — KS5 synoptic stem detector (only fires on Y12+).
    { name: "ks5-synoptic", fn: adapt(enforceKs5Synoptic) },
    // PR-23 (#56) — Diagram page-fit + complexity budget audit.
    { name: "diagram-page-fit", fn: adapt(enforceDiagramPageFit) },
    // PR-20 (#48) — Citation-grounded factual layer. Ships dark
    // behind PROMPT_CITATION_LAYER_ENABLED; the validator no-ops
    // when the env flag is false.
    { name: "citation-grounding", fn: adapt(enforceCitationGrounding) },
    // ─── Phase F · FEAT-PF1 ───────────────────────────────────────────
    // Tier-AO histogram check. Compares metadata.aoHistogram against
    // the curriculum bank's tier target (Foundation: AO1≈60/AO2≈30/AO3≈10;
    // Higher: AO1≈40/AO2≈40/AO3≈20). p1 warning when off-target by more
    // than ±15pp on any AO. No-ops when tier or aoHistogram is missing.
    { name: "tier-ao-histogram", fn: (ws, _opts) => enforceTierAoHistogram(ws) },
  ]);

/**
 * Set of registered names. Cached at module load so per-call lookup is
 * O(1) and `unknownOverrides` doesn't have to re-scan the array each
 * time `runRegistry` is invoked.
 */
const REGISTERED_NAMES: ReadonlySet<string> = new Set(
  WORKSHEET_POST_VALIDATORS.map((r) => r.name),
);

/**
 * Public read-only accessor — used by tests and tooling to verify
 * order without exposing the full registry array as a mutable list.
 */
export function listValidatorNames(): readonly string[] {
  return WORKSHEET_POST_VALIDATORS.map((r) => r.name);
}

// ─── Runner ──────────────────────────────────────────────────────────────────

/**
 * Run the registry in declared order. Each entry's `fn` is invoked with
 * `(currentWorksheet, opts)`; its returned `worksheet` flows into the
 * next entry, and its `warnings` accumulate into the result.
 *
 * Overrides:
 *   - `overrides[name] === false` skips that validator. The skipped
 *     name is recorded in `result.skippedNames`.
 *   - `overrides[name] === true` is a no-op (validators are enabled by
 *     default). The name is still recorded in `result.ranNames` after
 *     the validator runs.
 *   - Any key in `overrides` that does not match a registered name is
 *     recorded in `result.unknownOverrides` so the caller can surface
 *     it as a warning. The override is otherwise ignored — unknown
 *     names never block the chain.
 *
 * The runner itself is pure: it does not mutate `ws`, `opts`, or
 * `overrides`, and running it twice on the same input produces a
 * deep-equal result.
 */
export function runRegistry(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
  overrides: Readonly<Record<string, boolean>> = {},
): RunRegistryResult {
  const warnings: string[] = [];
  const ranNames: string[] = [];
  const skippedNames: string[] = [];
  let current: PostValidatorWorksheet = ws;

  for (const entry of WORKSHEET_POST_VALIDATORS) {
    // Resolve enabled state: explicit override wins; otherwise the
    // entry's own default; otherwise true.
    const overrideValue = overrides[entry.name];
    const enabled =
      typeof overrideValue === "boolean"
        ? overrideValue
        : entry.enabled !== false;

    if (!enabled) {
      skippedNames.push(entry.name);
      continue;
    }

    const r = entry.fn(current, opts);
    current = r.worksheet;
    warnings.push(...r.warnings);
    ranNames.push(entry.name);
  }

  // Unknown overrides — caller hygiene check. Cheap enough to compute
  // every call (overrides is typically empty or a handful of keys).
  const unknownOverrides: string[] = Object.keys(overrides).filter(
    (k) => !REGISTERED_NAMES.has(k),
  );

  return {
    worksheet: current,
    warnings,
    ranNames,
    skippedNames,
    unknownOverrides,
  };
}
