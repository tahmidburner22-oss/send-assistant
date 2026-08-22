/**
 * validatorSeverity.ts — PR-22 / audit item #49.
 *
 * Tiered severity table for every post-validator. Keys are the stable
 * kebab-case names registered in `worksheetPostValidatorRegistry.ts`.
 *
 *   - p0 = blocking (must-fix before publish): correctness rails the
 *     post-validator chain enforces directly (single-MCQ-correct,
 *     dedupe-word-bank, strip-foreign-diagrams). When a p0 warning
 *     fires, the worksheet should NOT be served to pupils until a
 *     teacher has reviewed.
 *
 *   - p1 = important (publish-ready, but flagged): pedagogy / fidelity
 *     rails. Mark-scheme upgrades, command-word fidelity, SI-unit
 *     normalisation, accessibility audit. Surfaced in the teacher
 *     banner and counted toward the QA score.
 *
 *   - p2 = advisory (nice-to-have): style / heuristic checks that
 *     occasionally fire false positives (bias sensitivity, distractor
 *     pedagogy). Surfaced in the audit-trail panel only.
 *
 * The map is intentionally exhaustive — every name in the registry
 * has an entry — so a future PR that adds a validator without an
 * entry trips a CI check (see `bigBangPr19to27.test.ts`).
 *
 * Pure / immutable. No mutation hooks.
 */

export type WarningSeverity = "p0" | "p1" | "p2";

export const VALIDATOR_SEVERITY: Readonly<Record<string, WarningSeverity>> = Object.freeze({
  // Pre-PR-2 chain.
  "single-mcq-correct": "p0",
  "dedupe-word-bank": "p0",
  "strip-foreign-diagrams": "p0",
  "strip-empty-diagram-placeholders": "p0",
  "year-group-lock": "p1",
  "cap-worked-example-steps": "p1",
  "strip-leaked-generator-instructions": "p0",
  "marks-bracket-style": "p1",
  "strip-visible-placeholders-and-answer-leakage": "p0",
  "reinforce-dyscalculia-maths-scaffolding": "p1",
  "reconcile-mark-scheme": "p1",
  "extract-misconception-links": "p2",
  "send-overlay-markers": "p1",
  "application-question-cap": "p1",
  "section-question-counts": "p1",
  "mark-allocation-variety": "p2",
  "common-mistakes-topic-relevance": "p1",
  "spec-anchor-presence": "p1",
  "self-reflection-topic-anchor": "p1",
  "revision-tips-presence": "p1",
  "curriculum-authority-invariants": "p0",

  // PR-2 audit-only validators.
  "command-word-fidelity": "p1",
  "si-unit-normalisation": "p1",
  "reading-age-budget": "p1",

  // PR-3 audit-only validators.
  "maths-notation-hygiene": "p1",
  "diagram-dependency-integrity": "p1",
  "distractor-pedagogy": "p2",
  "tier3-vocabulary-declared": "p1",

  // PR-10..18 (combined).
  "bias-sensitivity": "p2",
  "mark-scheme-upgrades": "p1",
  "bloom-progression": "p2",
  "past-paper-fingerprint": "p2",
  "accessibility-audit": "p1",

  // PR-19..27 (combined).
  "common-mistakes-non-maths": "p2",
  "sp-vocabulary-library": "p2",
  "spec-point-taxonomy": "p2",
  "ks5-synoptic": "p2",
  "diagram-page-fit": "p1",
  "citation-grounding": "p1",
  "tier-ao-histogram": "p2",

  // Later pipeline additions: important presentation and pedagogy rails are
  // p1; heuristic variety checks remain advisory at p2.
  "learning-objective-wording": "p1",
  "common-mistakes-sentence-case": "p2",
  "reflection-cap": "p1",
  "maths-instruction-brevity": "p1",
  "ks3-length-budget": "p1",
  "vocabulary-repeat": "p2",
  "pedagogy-structure-presence": "p1",
  "full-quality-check": "p1",
  "vocab-table-format": "p1",
  "worked-example-brevity": "p1",
  "instruction-box-dedup": "p1",
  "diagram-presence": "p1",
  "question-wording-brevity": "p1",
  "enhanced-quality-checks": "p1",
});

/**
 * Lookup with a conservative default — unknown names get `p2` so a
 * stray validator doesn't accidentally block publishing while still
 * being audible in the audit-trail panel.
 */
export function lookupSeverity(name: string): WarningSeverity {
  return VALIDATOR_SEVERITY[name] ?? "p2";
}

/** Bucket a list of warning strings by severity. The function expects
 *  each warning to begin with a `[Phase … — <name>]` style prefix or a
 *  registered validator name. Anything else is surfaced as `p2`. */
export function bucketWarningsBySeverity(warnings: string[]): Record<WarningSeverity, string[]> {
  const out: Record<WarningSeverity, string[]> = { p0: [], p1: [], p2: [] };
  for (const w of warnings) {
    const sev = severityForWarning(w);
    out[sev].push(w);
  }
  return out;
}

/**
 * Best-effort severity for a single warning string. Matches the
 * leading bracketed prefix against the registered names; falls back
 * to a regex sweep over canonical phase tags.
 */
export function severityForWarning(message: string): WarningSeverity {
  const text = String(message || "");
  const direct = /^\s*\[(?:Phase\s+\w+\s+—\s+)?([a-z][a-z0-9-]+)/i.exec(text);
  if (direct) {
    const candidate = direct[1].toLowerCase();
    if (VALIDATOR_SEVERITY[candidate]) return VALIDATOR_SEVERITY[candidate];
  }
  if (/MCQ|placeholder|leaked|foreign\s+diagram|year\s*group/i.test(text)) return "p0";
  if (/mark\s+scheme|command\s+word|reading\s+age|notation|SI[-\s]*unit|accessibility|spec\s+ref/i.test(text)) return "p1";
  return "p2";
}
