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
import type { EvalReport, EvalReportRow } from "./types";

function statusBadge(row: EvalReportRow): string {
  if (row.generationError) return "ERR";
  return row.passed ? "PASS" : "FAIL";
}

function pct(part: number, whole: number): string {
  if (whole === 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
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
