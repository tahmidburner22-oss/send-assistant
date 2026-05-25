/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/tests/worksheet-eval/summariser.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders an `EvalReport` as a one-screen markdown table for stdout +
 * GitHub Actions job summary. CI calls this so failures are visible
 * without downloading the JSON artefact.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { writeFile, appendFile } from "node:fs/promises";
import type {
  AxisAggregate,
  AxisKey,
  AxisScores,
  AxisScoresAggregate,
  EvalReport,
  EvalReportRow,
  HumanScoreEntry,
} from "./types";
import { AXIS_KEYS } from "./types";

const AXIS_LABELS: Record<AxisKey, string> = {
  curriculumFidelity: "Curriculum fidelity",
  stemAuthenticity: "Stem authenticity",
  accessibility: "Accessibility",
  marksAndAnswers: "Marks & answers",
  sendAlignment: "SEND alignment",
  uxAndPrintability: "UX & printability",
};

function statusBadge(row: EvalReportRow): string {
  if (row.generationError) return "ERR";
  return row.passed ? "PASS" : "FAIL";
}

function pct(part: number, whole: number): string {
  if (whole === 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

/**
 * PR-1 Sprint 1.C — empty-aggregate factory. Used both as the
 * starting accumulator and as the value returned when no rows
 * carry per-axis scores.
 */
function emptyAggregate(): AxisScoresAggregate {
  const empty: AxisAggregate = { mean: null, min: null, max: null, count: 0 };
  return {
    curriculumFidelity: { ...empty },
    stemAuthenticity: { ...empty },
    accessibility: { ...empty },
    marksAndAnswers: { ...empty },
    sendAlignment: { ...empty },
    uxAndPrintability: { ...empty },
  };
}

/**
 * PR-1 Sprint 1.C — aggregate per-axis scores across a list of
 * `AxisScores` blocks. Skips `null` axis values (intentional n/a per
 * rubric — e.g. sendAlignment for non-SEND fixtures). Pure /
 * deterministic / no I/O.
 *
 * Mean is rounded to 2 dp for stability across runs (so the
 * baseline diff doesn't fail on rounding noise). Returns the
 * `emptyAggregate()` shape when zero rows had non-null scores
 * for any axis — keeps consumers from needing to handle a
 * `null` aggregate separately.
 */
export function aggregateAxisScores(
  scoreBlocks: Array<AxisScores | undefined | null>,
): AxisScoresAggregate {
  const acc: Record<AxisKey, number[]> = {
    curriculumFidelity: [],
    stemAuthenticity: [],
    accessibility: [],
    marksAndAnswers: [],
    sendAlignment: [],
    uxAndPrintability: [],
  };
  for (const block of scoreBlocks) {
    if (!block) continue;
    for (const axis of AXIS_KEYS) {
      const v = block[axis];
      if (typeof v === "number" && !Number.isNaN(v)) {
        acc[axis].push(v);
      }
    }
  }
  const out = emptyAggregate();
  for (const axis of AXIS_KEYS) {
    const values = acc[axis];
    if (values.length === 0) continue;
    const sum = values.reduce((a, b) => a + b, 0);
    out[axis] = {
      mean: Number((sum / values.length).toFixed(2)),
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }
  return out;
}

/**
 * PR-1 Sprint 1.C — collapse a list of human-rater entries (one row
 * per rater per fixture) into a per-fixture AxisScores using the
 * **median** across raters. Median chosen over mean so a single
 * outlier rater doesn't move the cell. Pure helper — does not
 * mutate inputs.
 */
export function medianHumanScores(
  entries: HumanScoreEntry[] | undefined,
): AxisScores | null {
  if (!entries || entries.length === 0) return null;
  const out: AxisScores = {
    curriculumFidelity: null,
    stemAuthenticity: null,
    accessibility: null,
    marksAndAnswers: null,
    sendAlignment: null,
    uxAndPrintability: null,
  };
  for (const axis of AXIS_KEYS) {
    const values = entries
      .map((e) => e.axes[axis])
      .filter((v): v is number => typeof v === "number");
    if (values.length === 0) continue;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 1
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    out[axis] = Number(median.toFixed(2));
  }
  return out;
}

/** Render one axis-aggregate block as a markdown table. */
function renderAxisBlock(
  title: string,
  agg: AxisScoresAggregate | undefined,
): string[] {
  if (!agg) return [];
  // Only render axes that actually have data — avoid 6 empty rows
  // when only 1 axis was rated (e.g. an early calibration run).
  const rated = AXIS_KEYS.filter((axis) => (agg[axis]?.count ?? 0) > 0);
  if (rated.length === 0) return [];
  const lines: string[] = [];
  lines.push("");
  lines.push(`### ${title}`);
  lines.push("");
  lines.push("| Axis | Mean | Min | Max | n |");
  lines.push("| --- | ---: | ---: | ---: | ---: |");
  for (const axis of rated) {
    const a = agg[axis];
    lines.push(
      `| ${AXIS_LABELS[axis]} | ${a.mean ?? "—"} | ${a.min ?? "—"} | ${a.max ?? "—"} | ${a.count} |`,
    );
  }
  return lines;
}

/**
 * Render the report as compact markdown:
 *
 *   ## Worksheet eval — 2026-05-22 (mock)
 *   - 50 fixtures · 47 pass · 3 fail · 0 error · $0.00
 *   - Per-rule: mcq-single-correct 50/50 · word-bank-deduped 49/50 · …
 *   - Failures: …
 *
 * Designed to fit on one screen even with 200 fixtures.
 */
export function renderMarkdownSummary(report: EvalReport): string {
  const lines: string[] = [];
  lines.push(
    `## Worksheet eval — ${report.startedAt.slice(0, 10)} (${report.generatorVersion})`,
  );

  if (report.budgetAborted) {
    lines.push("");
    lines.push(
      `> **Aborted** by cost guard. Estimated total $${(report.estimatedTotalCostUsd ?? 0).toFixed(4)} exceeded budget.`,
    );
    return lines.join("\n");
  }

  const { summary, ruleStats, rows } = report;
  lines.push("");
  lines.push(
    `- **${summary.total}** fixtures · **${summary.passed}** pass (${pct(summary.passed, summary.total)}) · **${summary.failed}** fail · **${summary.errored}** error · est. **$${summary.totalCostUsd.toFixed(4)}** · ${(report.totalMs / 1000).toFixed(1)}s`,
  );
  if (report.modelJudgeProvider) {
    lines.push(
      `- model-judge: \`${report.modelJudgeProvider}${report.modelJudgeModel ? "/" + report.modelJudgeModel : ""}\``,
    );
  }
  if (report.comparisonCorpus) {
    lines.push(
      `- comparison-corpus: v${report.comparisonCorpus.version} (${report.comparisonCorpus.size} fixtures)`,
    );
  }
  if (report.humanScoresPath) {
    lines.push(`- human-scores source: \`${report.humanScoresPath}\``);
  }

  // PR-1 Sprint 1.C — per-axis blocks. Render only when present so
  // legacy reports (no judge / no humans) still produce a clean
  // summary.
  lines.push(...renderAxisBlock("Per-axis (model-judge)", report.modelJudgeAggregate));
  lines.push(...renderAxisBlock("Per-axis (human, median)", report.humanScoresAggregate));

  // Per-rule pass/fail.
  lines.push("");
  lines.push("### Per-rule results");
  lines.push("");
  lines.push("| Rule | Pass | Fail |");
  lines.push("| --- | ---: | ---: |");
  for (const [rule, stat] of Object.entries(ruleStats).sort()) {
    lines.push(`| ${rule} | ${stat.passed} | ${stat.failed} |`);
  }

  // Failures, capped to 20 rows so a noisy run doesn't blow out the
  // job summary.
  const failures = rows.filter((r) => !r.passed);
  if (failures.length > 0) {
    lines.push("");
    lines.push(`### Failures (${failures.length})`);
    lines.push("");
    lines.push("| ID | Bucket | Status | Failed rules / error |");
    lines.push("| --- | --- | --- | --- |");
    for (const row of failures.slice(0, 20)) {
      const detail = row.generationError
        ? row.generationError.slice(0, 80)
        : row.failedRules.map((r) => `${r.rule}: ${r.reason}`).join("; ").slice(0, 120);
      lines.push(
        `| ${row.id} | ${row.bucket} | ${statusBadge(row)} | ${detail} |`,
      );
    }
    if (failures.length > 20) {
      lines.push("");
      lines.push(`_… ${failures.length - 20} more in eval-report.json._`);
    }
  }

  // Bucket roll-up.
  const buckets = new Map<string, { passed: number; total: number }>();
  for (const row of rows) {
    const b = buckets.get(row.bucket) ?? { passed: 0, total: 0 };
    b.total += 1;
    if (row.passed) b.passed += 1;
    buckets.set(row.bucket, b);
  }
  if (buckets.size > 0) {
    lines.push("");
    lines.push("### By bucket");
    lines.push("");
    lines.push("| Bucket | Pass | Total | % |");
    lines.push("| --- | ---: | ---: | ---: |");
    for (const [bucket, stat] of [...buckets.entries()].sort()) {
      lines.push(
        `| ${bucket} | ${stat.passed} | ${stat.total} | ${pct(stat.passed, stat.total)} |`,
      );
    }
  }

  return lines.join("\n");
}

/**
 * Write the markdown summary to `$GITHUB_STEP_SUMMARY` so it appears
 * inline on the workflow run page. No-op when the env var isn't set
 * (i.e. when running locally / outside Actions).
 */
export async function writeJobSummary(md: string): Promise<void> {
  const target = process.env.GITHUB_STEP_SUMMARY;
  if (!target) return;
  try {
    // appendFile will create the file if it doesn't exist.
    await appendFile(target, md + "\n");
  } catch {
    // Fall back to writeFile if append fails (e.g. on stricter
    // filesystems). Either way, never block the runner on summary
    // emission.
    try {
      await writeFile(target, md + "\n");
    } catch {
      /* ignore */
    }
  }
}
