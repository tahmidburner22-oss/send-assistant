/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/tests/worksheet-eval/comparisonCorpus.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Loader for the **comparison corpus** — a stable benchmark of 30
 * fixed (subject, year, topic) triples that sit alongside (and are
 * versioned independently from) the per-file `fixtures/` corpus.
 *
 * Two corpora exist for two different reasons:
 *
 *   - `fixtures/*.json`  — the PR-5 broad regression corpus
 *     (~50 fixtures, each its own file). Optimised for adding /
 *     removing fixtures over time without touching anything else.
 *
 *   - `comparison-corpus.json` (this loader) — a single 30-entry
 *     JSON array that defines the **stable benchmark** the
 *     model-judge (Sprint 1.D) and any future paid human-rater
 *     wave score against. Versioned as a unit so historical scores
 *     remain comparable across runs. Distribution:
 *       4 KS1/KS2 · 8 KS3 · 12 GCSE · 3 A-Level · 3 SEND
 *
 * The runner can run either corpus, or both. Default behaviour
 * (no env flag) is the per-file corpus, preserving all existing
 * tooling. Set `EVAL_CORPUS=comparison` to run only the comparison
 * corpus, or `EVAL_CORPUS=both` to run both with a tag on each
 * report row identifying its origin.
 *
 * Schema additions are additive only: new optional fields on
 * `EvalFixture` flow through unchanged. Removing or renaming a
 * fixture id is a breaking change — bump `COMPARISON_CORPUS_VERSION`
 * when that happens so the dashboard can detect the discontinuity.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { EvalFixture } from "./types";

const HERE = dirname(fileURLToPath(import.meta.url));
const CORPUS_PATH = join(HERE, "comparison-corpus.json");

/**
 * Bumped when the corpus shape changes in a way that breaks
 * historical comparisons (fixture removed / renamed / params changed
 * in a way that affects what the rater sees). Adding a fixture is
 * additive — bump only when removing or mutating.
 */
export const COMPARISON_CORPUS_VERSION = "1.0.0";

/** The corpus is intentionally fixed-size. Asserted by the loader so
 *  a hand-edit that drops or duplicates entries fails loudly rather
 *  than silently shifting the benchmark distribution. */
export const COMPARISON_CORPUS_EXPECTED_SIZE = 30;

/**
 * Read + validate `comparison-corpus.json` from disk.
 *
 * Throws when:
 *   - The file isn't valid JSON.
 *   - The top level isn't an array.
 *   - Any fixture is missing one of (id, title, bucket, params, rules).
 *   - Any id isn't `cmp-` prefixed (helps the dashboard distinguish
 *     comparison-corpus rows from per-file fixtures at a glance).
 *   - The corpus size doesn't match `COMPARISON_CORPUS_EXPECTED_SIZE`.
 *
 * Returns `EvalFixture[]` — same shape the runner already uses, so
 * the corpus drops into the existing rule/score machinery without
 * a translation layer.
 */
export async function loadComparisonCorpus(): Promise<EvalFixture[]> {
  let raw: string;
  try {
    raw = await readFile(CORPUS_PATH, "utf8");
  } catch (err) {
    throw new Error(
      `comparisonCorpus: failed to read ${CORPUS_PATH}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `comparisonCorpus: invalid JSON in ${CORPUS_PATH}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `comparisonCorpus: ${CORPUS_PATH} top level must be an array, got ${typeof parsed}`,
    );
  }

  // Validate every fixture before returning. We do not mutate or
  // default-fill missing fields here — the contract is "this corpus
  // is stable as written; if the file is wrong, fail."
  const seenIds = new Set<string>();
  for (const entry of parsed) {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof (entry as { id?: unknown }).id !== "string" ||
      typeof (entry as { title?: unknown }).title !== "string" ||
      typeof (entry as { bucket?: unknown }).bucket !== "string" ||
      typeof (entry as { params?: unknown }).params !== "object" ||
      !Array.isArray((entry as { rules?: unknown }).rules)
    ) {
      throw new Error(
        `comparisonCorpus: invalid fixture shape: ${JSON.stringify(
          entry,
        ).slice(0, 200)}`,
      );
    }
    const fixture = entry as EvalFixture;
    if (!fixture.id.startsWith("cmp-")) {
      throw new Error(
        `comparisonCorpus: fixture id must start with "cmp-": got "${fixture.id}"`,
      );
    }
    if (seenIds.has(fixture.id)) {
      throw new Error(
        `comparisonCorpus: duplicate fixture id "${fixture.id}"`,
      );
    }
    seenIds.add(fixture.id);
    const allowedBuckets = ["maths", "english", "science", "humanities", "send"];
    if (!allowedBuckets.includes(fixture.bucket)) {
      throw new Error(
        `comparisonCorpus: fixture "${fixture.id}" has invalid bucket "${fixture.bucket}"`,
      );
    }
    if (!fixture.params.subject || !fixture.params.yearGroup || !fixture.params.topic) {
      throw new Error(
        `comparisonCorpus: fixture "${fixture.id}" missing required params (subject/yearGroup/topic)`,
      );
    }
  }

  if (parsed.length !== COMPARISON_CORPUS_EXPECTED_SIZE) {
    throw new Error(
      `comparisonCorpus: expected ${COMPARISON_CORPUS_EXPECTED_SIZE} fixtures, got ${parsed.length}. ` +
        `Bump COMPARISON_CORPUS_EXPECTED_SIZE only when deliberately resizing the benchmark.`,
    );
  }

  return parsed as EvalFixture[];
}

/**
 * Tag a list of fixtures with their origin corpus so report rows
 * can distinguish per-file fixtures from comparison-corpus rows.
 * Pure helper — does not mutate the input.
 */
export function tagFixtures<T extends { id: string }>(
  fixtures: T[],
  corpus: "fixtures" | "comparison",
): Array<T & { corpus: "fixtures" | "comparison" }> {
  return fixtures.map((f) => ({ ...f, corpus }));
}

/**
 * Bucket count helper — the corpus distribution must stay roughly
 * balanced for the model-judge to surface meaningful per-bucket
 * deltas. Used by the loader test and the runner's pre-flight log.
 */
export function bucketCounts(fixtures: EvalFixture[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const f of fixtures) {
    counts[f.bucket] = (counts[f.bucket] ?? 0) + 1;
  }
  return counts;
}
