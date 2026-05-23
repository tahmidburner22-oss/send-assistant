/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/tests/worksheet-eval/runner.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Eval-harness runner. Closes audit item #44 (FEAT-PR5).
 *
 * Reads every fixture under `fixtures/`, calls the configured generator
 * (mock by default, live with `EVAL_MODE=live`), threads the output
 * through `runWorksheetPostValidators`, scores each fixture against the
 * `rules` it declares, and writes `eval-report.json` to this directory.
 *
 * Three knobs:
 *   EVAL_MODE              "mock" (default) | "live"
 *   EVAL_BUDGET_USD        max total spend before we abort (default 1.00)
 *   EVAL_BAIL_ON_FAIL      "1" exits 1 on any fixture failure
 *
 * Usage:
 *   npm run eval:worksheets               # mock mode, full corpus
 *   EVAL_MODE=live npm run eval:worksheets
 *   EVAL_BUDGET_USD=0.01 npm run eval:worksheets   # cost-guard demo
 *   npm run eval:worksheets -- --bail     # CI-friendly bail
 *
 * The runner does NOT block PRs — that gate lands in PR-22 once a
 * baseline has settled (see `.agents/tasks/big-bang-improvements/
 * PHASE-PLAN.md`).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

import {
  runWorksheetPostValidators,
  type PostValidatorWorksheet,
} from "../../../client/src/lib/worksheetPostValidator";

import { evaluateRules, ALL_RULE_NAMES } from "./rules";
import { pickGenerator, type Generator } from "./generators";
import {
  renderMarkdownSummary,
  writeJobSummary,
} from "./summariser";
import type { EvalFixture, EvalReport, EvalReportRow } from "./types";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(HERE, "fixtures");
const REPORT_PATH = join(HERE, "eval-report.json");

const EVAL_HARNESS_VERSION = "1.0.0";

/**
 * Load every `*.json` fixture in the corpus, in stable id order.
 * Skips files starting with `_` (templates / READMEs).
 */
async function loadFixtures(): Promise<EvalFixture[]> {
  const entries = await readdir(FIXTURES_DIR);
  const files = entries
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .sort();
  const fixtures: EvalFixture[] = [];
  for (const file of files) {
    const raw = await readFile(join(FIXTURES_DIR, file), "utf8");
    const fixture = JSON.parse(raw) as EvalFixture;
    if (!fixture.id) fixture.id = file.replace(/\.json$/, "");
    if (!fixture.rules || fixture.rules.length === 0) {
      // Sensible default: every built-in rule.
      fixture.rules = [...ALL_RULE_NAMES];
    }
    fixtures.push(fixture);
  }
  return fixtures;
}

/** Pre-flight cost estimate; aborts the run when over budget. */
function checkBudget(
  fixtures: EvalFixture[],
  generator: Generator,
  budgetUsd: number,
): { ok: true; estimatedTotal: number } | { ok: false; estimatedTotal: number } {
  const estimatedTotal = fixtures.reduce(
    (sum) => sum + generator.estimatedCostUsd,
    0,
  );
  return estimatedTotal > budgetUsd
    ? { ok: false, estimatedTotal }
    : { ok: true, estimatedTotal };
}

/** Minimum-viable empty report when the cost guard aborts. */
function emptyReport(
  generator: Generator,
  startedAt: string,
  totalMs: number,
  estimatedTotalCostUsd: number,
): EvalReport {
  return {
    startedAt,
    totalMs,
    evalHarnessVersion: EVAL_HARNESS_VERSION,
    generatorVersion: generator.name,
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      errored: 0,
      totalCostUsd: 0,
    },
    ruleStats: {},
    rows: [],
    budgetAborted: true,
    estimatedTotalCostUsd,
  };
}

/** Run one fixture end-to-end. Catches generator + post-validator
 *  errors and rolls them up into the row's `generationError`. */
async function runFixture(
  fixture: EvalFixture,
  generator: Generator,
): Promise<EvalReportRow> {
  const t0 = Date.now();
  const row: EvalReportRow = {
    id: fixture.id,
    title: fixture.title,
    bucket: fixture.bucket,
    passed: false,
    failedRules: [],
    warnings: [],
    generationMs: 0,
    costUsd: 0,
  };

  try {
    const generated = await generator.generate(fixture.params);
    const post = runWorksheetPostValidators(
      generated as PostValidatorWorksheet,
      {
        subject: fixture.params.subject,
        yearGroup: fixture.params.yearGroup,
        sendNeed: fixture.params.sendNeed,
        examBoard: fixture.params.examBoard,
        topic: fixture.params.topic,
      },
    );
    const ws = post.worksheet;
    const stamped =
      (ws.metadata?.postValidatorWarnings as string[] | undefined) ?? [];
    row.warnings = stamped;
    const evaluation = evaluateRules(ws, fixture);
    row.passed = evaluation.passed;
    row.failedRules = evaluation.failedRules;
  } catch (err) {
    row.generationError =
      err instanceof Error ? err.message : String(err);
  }

  row.generationMs = Date.now() - t0;
  row.costUsd = generator.estimatedCostUsd;
  return row;
}

/** Aggregate per-rule pass/fail counts across the full corpus. */
function buildRuleStats(
  rows: EvalReportRow[],
  fixtures: EvalFixture[],
): Record<string, { passed: number; failed: number }> {
  const stats: Record<string, { passed: number; failed: number }> = {};
  const byId = new Map(fixtures.map((f) => [f.id, f]));
  for (const row of rows) {
    if (row.generationError) continue;
    const fixture = byId.get(row.id);
    if (!fixture) continue;
    const failed = new Set(row.failedRules.map((r) => r.rule));
    for (const ruleName of fixture.rules) {
      if (!stats[ruleName]) stats[ruleName] = { passed: 0, failed: 0 };
      if (failed.has(ruleName)) stats[ruleName].failed += 1;
      else stats[ruleName].passed += 1;
    }
  }
  return stats;
}

export async function main(): Promise<EvalReport> {
  const startedWall = Date.now();
  const startedAt = new Date(startedWall).toISOString();

  const generator = pickGenerator();
  const budgetUsd = parseFloat(process.env.EVAL_BUDGET_USD ?? "1.00");
  const bailOnFail =
    process.env.EVAL_BAIL_ON_FAIL === "1" ||
    process.argv.includes("--bail");

  const fixtures = await loadFixtures();
  if (fixtures.length === 0) {
    throw new Error(`No fixtures found under ${FIXTURES_DIR}`);
  }
  console.log(
    `[eval] mode=${generator.name} fixtures=${fixtures.length} budget=$${budgetUsd.toFixed(2)} bail=${bailOnFail}`,
  );

  const budgetCheck = checkBudget(fixtures, generator, budgetUsd);
  if (!budgetCheck.ok) {
    const totalMs = Date.now() - startedWall;
    const report = emptyReport(
      generator,
      startedAt,
      totalMs,
      budgetCheck.estimatedTotal,
    );
    await writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
    console.error(
      `[eval] cost guard: estimated $${budgetCheck.estimatedTotal.toFixed(4)} > budget $${budgetUsd.toFixed(2)} — aborting`,
    );
    if (bailOnFail) process.exit(2);
    return report;
  }

  const rows: EvalReportRow[] = [];
  for (const fixture of fixtures) {
    const row = await runFixture(fixture, generator);
    rows.push(row);
    const status = row.generationError
      ? "ERR"
      : row.passed
      ? "PASS"
      : "FAIL";
    console.log(
      `[eval] ${status.padEnd(4)} ${fixture.id} (${fixture.bucket}) ${row.generationMs}ms` +
        (row.failedRules.length > 0
          ? ` — ${row.failedRules.map((r) => r.rule).join(", ")}`
          : ""),
    );
  }

  const ruleStats = buildRuleStats(rows, fixtures);
  const summary = {
    total: rows.length,
    passed: rows.filter((r) => r.passed).length,
    failed: rows.filter((r) => !r.passed && !r.generationError).length,
    errored: rows.filter((r) => Boolean(r.generationError)).length,
    totalCostUsd: rows.reduce((s, r) => s + r.costUsd, 0),
  };

  const report: EvalReport = {
    startedAt,
    totalMs: Date.now() - startedWall,
    evalHarnessVersion: EVAL_HARNESS_VERSION,
    generatorVersion:
      generator.name === "live"
        ? process.env.EVAL_GENERATOR_VERSION ?? "live"
        : "mock",
    summary,
    ruleStats,
    rows,
  };

  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`[eval] report written to ${REPORT_PATH}`);

  const md = renderMarkdownSummary(report);
  console.log("\n" + md + "\n");
  await writeJobSummary(md);

  // PR-22 — regression detector. Pass `--diff-against=<path>` (or
  // EVAL_DIFF_AGAINST=<path>) to compare against a previous report
  // and fail CI when failure rate per rule jumps >5% relative to
  // yesterday's nightly artefact.
  const diffPath = parseDiffAgainstFlag();
  if (diffPath) {
    try {
      const prev = JSON.parse(await readFile(diffPath, "utf8")) as EvalReport;
      const regressions = detectRegressions(prev, report, 0.05);
      if (regressions.length > 0) {
        console.error(
          `[eval] regression detector: ${regressions.length} rule(s) regressed by >5% versus ${diffPath}:`,
        );
        for (const r of regressions) {
          console.error(
            `  - ${r.rule}: prev failure rate ${(r.prevRate * 100).toFixed(1)}% → now ${(r.nextRate * 100).toFixed(1)}% (Δ +${(r.delta * 100).toFixed(1)}%)`,
          );
        }
        if (bailOnFail) process.exit(3);
      } else {
        console.log(`[eval] regression detector: OK against ${diffPath}.`);
      }
    } catch (e) {
      console.warn(
        `[eval] regression detector: could not read ${diffPath} (${e instanceof Error ? e.message : String(e)}). Skipping.`,
      );
    }
  }

  if (bailOnFail && (summary.failed > 0 || summary.errored > 0)) {
    process.exit(1);
  }
  return report;
}

/** PR-22 — pull `--diff-against=<path>` from argv or
 *  `EVAL_DIFF_AGAINST=<path>` from the environment. Returns undefined
 *  when neither is set. */
function parseDiffAgainstFlag(): string | undefined {
  const env = process.env.EVAL_DIFF_AGAINST;
  if (env) return env;
  const arg = process.argv.find((a) => a.startsWith("--diff-against="));
  if (arg) return arg.slice("--diff-against=".length);
  return undefined;
}

export interface RegressionRow {
  rule: string;
  prevRate: number;
  nextRate: number;
  delta: number;
}

/**
 * PR-22 — return the list of rules whose failure rate jumped by more
 * than `threshold` between the two reports. A rule that is brand-new
 * in `next` (i.e. not present in `prev`) is NOT flagged — adding a
 * rule is a deliberate move, not a regression.
 */
export function detectRegressions(
  prev: EvalReport,
  next: EvalReport,
  threshold: number,
): RegressionRow[] {
  const out: RegressionRow[] = [];
  for (const [rule, n] of Object.entries(next.ruleStats || {})) {
    const p = prev.ruleStats?.[rule];
    if (!p) continue;
    const prevTotal = (p.passed || 0) + (p.failed || 0);
    const nextTotal = (n.passed || 0) + (n.failed || 0);
    if (prevTotal === 0 || nextTotal === 0) continue;
    const prevRate = p.failed / prevTotal;
    const nextRate = n.failed / nextTotal;
    const delta = nextRate - prevRate;
    if (delta > threshold) {
      out.push({
        rule,
        prevRate: Number(prevRate.toFixed(4)),
        nextRate: Number(nextRate.toFixed(4)),
        delta: Number(delta.toFixed(4)),
      });
    }
  }
  return out;
}

// Detect "I'm the entry point" without depending on Node's
// `import.meta.url === ` boilerplate getting confused by CJS wrappers.
const isEntryPoint =
  typeof process !== "undefined" &&
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isEntryPoint) {
  main().catch((err) => {
    console.error("[eval] fatal:", err);
    process.exit(1);
  });
}
