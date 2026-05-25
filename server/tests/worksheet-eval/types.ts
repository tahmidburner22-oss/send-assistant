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

/**
 * PR-1 (big-bang-7-sprints) Sprint 1.C — per-axis rubric scores.
 *
 * Mirrors the 6-axis rubric in `docs/teacher-rater-rubric.md`. Each
 * axis is rated 1–5 (5 = exemplary, 1 = unusable). `null` is a valid
 * value: it means "not applicable / not rated this run". For
 * `sendAlignment` specifically, `null` is the correct value when the
 * fixture has no `sendNeed` declared (per the rubric's own rules).
 */
export interface AxisScores {
  curriculumFidelity: number | null;
  stemAuthenticity: number | null;
  accessibility: number | null;
  marksAndAnswers: number | null;
  sendAlignment: number | null;
  uxAndPrintability: number | null;
}

/** PR-1 Sprint 1.C — per-rater human scores. One row per rater per
 *  fixture; multiple raters per fixture are allowed (and encouraged
 *  for inter-rater agreement). */
export interface HumanScoreEntry {
  raterId: string;
  axes: AxisScores;
  notes?: string;
}

/** PR-1 Sprint 1.C — per-axis aggregate across the corpus. */
export interface AxisScoresAggregate {
  curriculumFidelity: AxisAggregate;
  stemAuthenticity: AxisAggregate;
  accessibility: AxisAggregate;
  marksAndAnswers: AxisAggregate;
  sendAlignment: AxisAggregate;
  uxAndPrintability: AxisAggregate;
}

export interface AxisAggregate {
  /** Mean over rated rows (rows where the axis is non-null). */
  mean: number | null;
  min: number | null;
  max: number | null;
  /** Number of rows that contributed a non-null score. */
  count: number;
}

/** Ordered list of axis keys — single source of truth for any code
 *  that iterates the rubric (summariser, aggregator, model-judge
 *  prompt builder). The order matches the rubric document. */
export const AXIS_KEYS = [
  "curriculumFidelity",
  "stemAuthenticity",
  "accessibility",
  "marksAndAnswers",
  "sendAlignment",
  "uxAndPrintability",
] as const;

export type AxisKey = (typeof AXIS_KEYS)[number];

/** One eval fixture. Fixtures are JSON files under `fixtures/` or
 *  entries in `comparison-corpus.json`. */
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
  /**
   * PR-1 Sprint 1.C — per-axis floor for the model-judge axis-floor
   * rule. Each value is the minimum acceptable rating (1–5) for that
   * axis. Missing axes inherit the runner default (3 — "usable with
   * edit"). Set to 0 to disable the floor for that axis (useful for
   * SEND-flagged fixtures where one axis is intentionally relaxed
   * during early calibration).
   */
  modelJudgeAxisFloor?: Partial<Record<AxisKey, number>>;
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
  /**
   * PR-1 Sprint 1.C — origin tag.
   *
   * "fixtures"   = loaded from `fixtures/*.json` (the broad PR-5 corpus)
   * "comparison" = loaded from `comparison-corpus.json` (the stable benchmark)
   *
   * Optional + additive — older runners that don't tag rows still
   * produce valid reports.
   */
  corpus?: "fixtures" | "comparison";
  /** PR-1 Sprint 1.C — model-judge per-axis scores for this row.
   *  Stamped only when the model-judge actually rated this fixture. */
  modelJudgeScores?: AxisScores;
  /** PR-1 Sprint 1.C — the model-judge's free-text rationale for the
   *  scores it gave this row. Truncated to ~500 chars in the report
   *  to keep eval-report.json a reasonable size. */
  modelJudgeRationale?: string;
  /** PR-1 Sprint 1.C — human-rater scores for this row, when a CSV
   *  was supplied. One entry per rater. */
  humanScores?: HumanScoreEntry[];
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

  /**
   * PR-1 Sprint 1.C — model-judge metadata.
   *
   * `modelJudgeProvider` is the provider string ("claude", "openai",
   * "groq", "gemini", "openrouter", or "stub" / "none") used by the
   * judge — distinct from `generatorVersion` so a reader can audit
   * cross-provider isolation. `modelJudgeAggregate` is the per-axis
   * aggregate over rated rows.
   */
  modelJudgeProvider?: string;
  modelJudgeModel?: string;
  modelJudgeAggregate?: AxisScoresAggregate;

  /**
   * PR-1 Sprint 1.C — human-scores source.
   *
   * Path (relative to repo root) of the `humanScores.csv` file that
   * fed `rows[i].humanScores`. Set by the runner when a CSV was
   * supplied via `EVAL_HUMAN_SCORES_CSV`. Absent when no human
   * ratings ran. The aggregator over `rows[i].humanScores` is also
   * stamped at report level when present.
   */
  humanScoresPath?: string;
  humanScoresAggregate?: AxisScoresAggregate;

  /**
   * PR-1 Sprint 1.C — comparison-corpus metadata.
   *
   * When the run included the comparison corpus, this captures the
   * corpus version + size at run time so historical scorecards can
   * detect distribution shifts. Absent when only the per-file
   * fixtures ran.
   */
  comparisonCorpus?: {
    version: string;
    size: number;
  };
}
