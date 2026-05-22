/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/tests/worksheet-eval/types.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared types for the eval harness. Kept narrow so fixtures stay
 * trivial JSON files. The fixture contract intentionally subsumes
 * only the `aiGenerateWorksheet` parameter shape we exercise — adding
 * a new param to the generator does NOT require regenerating fixtures.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Parameters passed to the worksheet generator. Mirrors a useful
 *  subset of `aiGenerateWorksheet`'s param object — fixtures only need
 *  to supply the fields they exercise. */
export interface EvalFixtureParams {
  subject: string;
  topic: string;
  yearGroup: string;
  sendNeed?: string;
  difficulty?: string;
  examBoard?: string;
  includeAnswers?: boolean;
  examStyle?: boolean;
  worksheetLength?: string;
  readingAge?: number;
  isRevisionMat?: boolean;
  paper?: "P1" | "P2" | "P3";
  calculator?: boolean;
  recallTopic?: string;
  priorTopics?: string[];
}

/** One eval fixture. Fixtures are JSON files under `fixtures/`. */
export interface EvalFixture {
  /** Stable, unique id (also the filename minus `.json`). */
  id: string;
  /** Human-readable title — appears in the report table. */
  title: string;
  /** Free-text label so fixtures can be filtered ("maths", "send"). */
  bucket: "maths" | "english" | "science" | "humanities" | "send";
  /** Args passed to the generator. */
  params: EvalFixtureParams;
  /** Names of rules from `RULE_REGISTRY` to assert against the
   *  post-validated output. */
  rules: string[];
  /** Optional band [min, max] for `reading-age-in-range`. */
  readingAgeRange?: [number, number];
  /** Optional override for `qa-score-floor` (default 60). */
  qaScoreFloor?: number;
  /** Estimated tokens per run for the cost guard (default 4000). */
  estimatedTokens?: number;
}

/** Per-fixture row in the report. */
export interface EvalReportRow {
  id: string;
  title: string;
  bucket: string;
  passed: boolean;
  failedRules: Array<{ rule: string; reason: string }>;
  warnings: string[];
  generationMs: number;
  costUsd: number;
  /** Reason if generation itself failed (no-key, network, etc.). */
  generationError?: string;
}

/** Top-level report shape. Stable contract — older runners must keep
 *  reading newer reports without breakage (additive fields only). */
export interface EvalReport {
  /** ISO-8601 of when the run started. */
  startedAt: string;
  /** Wall-clock duration in ms. */
  totalMs: number;
  /** Eval-harness version stamped on the report so the diff runner
   *  (out of scope for this PR) can detect schema drift. */
  evalHarnessVersion: string;
  /** Generator-version string copied off the env (or "unknown"). */
  generatorVersion: string;
  /** Summary counts. */
  summary: {
    total: number;
    passed: number;
    failed: number;
    errored: number;
    totalCostUsd: number;
  };
  /** Per-rule pass/fail counts across the corpus. */
  ruleStats: Record<string, { passed: number; failed: number }>;
  /** Per-fixture rows in fixture-id order. */
  rows: EvalReportRow[];
  /** Whether the run was aborted by the cost guard. */
  budgetAborted?: boolean;
  /** Estimated total cost at abort time, when applicable. */
  estimatedTotalCostUsd?: number;
}
