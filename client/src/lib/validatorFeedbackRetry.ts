/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * client/src/lib/validatorFeedbackRetry.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 3.B (PR-1 / big-bang-7-sprints).
 *
 * Validator-feedback retry loop. When ≥ N post-validator warnings fire
 * on a single worksheet, instead of letting the validators silently
 * patch the output, re-prompt the generator ONCE with the specific
 * warnings inlined as constraints. Keep the better-scoring result.
 *
 * Pure / deterministic / idempotent (the helper itself is — the
 * generator may not be). Single round-trip retry only — no retry
 * pyramid; one re-prompt or none.
 *
 * Two surfaces:
 *
 *   - `runWithValidatorFeedbackRetry(generate, validate, append, params, opts)`
 *     — generic over the generator function shape. Useful when the
 *     caller wants to retry around a non-worksheet generator (e.g.
 *     a classroom-quiz builder later in the roadmap).
 *
 *   - `runWorksheetWithRetry(generate, params, opts)` — the
 *     worksheet-specific convenience wrapper. Reads warnings + qaScore
 *     from `metadata.postValidatorWarnings` + `metadata.qaScore.total`,
 *     appends to `additionalInstructions` on retry. Stamps
 *     `metadata.retryCount` (0 | 1) and `metadata.retryReasons` for
 *     telemetry.
 *
 * Threshold defaults to 3 ("when ≥ 3 validators fire") — consistent
 * with the SESSION-HANDOFF design note in PHASE-PLAN.md.
 *
 * The retry constraint block is intentionally narrow:
 *   - Up to 8 warnings inlined (more than that and the prompt
 *     bloats without proportional benefit).
 *   - Each warning becomes a single constraint line after light
 *     normalisation (strips post-validator name prefixes like
 *     "[Phase 1 / enforceSpecAnchorPresence — ...]").
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { AIWorksheetResult } from "./ai";

// ─── Shared types ────────────────────────────────────────────────────────────

export interface ValidatorFeedbackEvaluation {
  /** Raw warning strings (after de-duplication). */
  warnings: string[];
  /** Optional 0–100 quality score. When absent the helper picks the
   *  retry result by default if a retry happened (warnings present
   *  → retry was taken → retry is the "considered" result). */
  qaScore?: number;
}

export interface RetryOpts {
  /** Trigger threshold — retry happens when warnings.length >= this.
   *  Default 3. Set to 0 to disable retry. Set to Infinity to never retry. */
  threshold?: number;
  /** Maximum number of warnings inlined into the retry prompt.
   *  Default 8 — prevents prompt bloat on noisy outputs. */
  maxWarningsInRetry?: number;
  /** When true, the retry winner is determined by qaScore. When the
   *  qaScores tie or are both undefined, retry wins (it had the
   *  benefit of the feedback). Default true. */
  preferHigherQaScore?: boolean;
  /** Optional logger for diagnostic output. Defaults to no-op so the
   *  helper stays silent in production. */
  logger?: (msg: string) => void;
}

export interface RetryOutcome<R> {
  result: R;
  /** 0 = no retry happened (warnings were below threshold).
   *  1 = retry happened. The helper never retries more than once. */
  retryCount: 0 | 1;
  /** The warnings that triggered the retry (empty when retryCount=0). */
  retryReasons: string[];
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Strip common post-validator name prefixes so the retry prompt
 *  doesn't waste tokens on internal labels the generator can't act
 *  on. Pure / idempotent. */
export function stripValidatorPrefix(warning: string): string {
  // Common prefixes from the existing post-validator chain:
  //   "[Phase 1 / enforceSpecAnchorPresence — …]"
  //   "[PR-2 — Awarding-body command-word fidelity]"
  //   "[Phase PR-8 — Validator registry] …"
  return warning
    .replace(/^\s*\[[^\]]+\]\s*[—:-]?\s*/, "")
    .trim();
}

/** Build the constraint block to inline into the retry prompt.
 *  Pure / deterministic. */
export function buildConstraintBlock(
  warnings: string[],
  maxWarnings = 8,
): string {
  const cleaned: string[] = [];
  const seen = new Set<string>();
  for (const w of warnings) {
    const norm = stripValidatorPrefix(w);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    cleaned.push(norm);
    if (cleaned.length >= maxWarnings) break;
  }
  if (cleaned.length === 0) return "";
  const header =
    `# RETRY — fix the following ${cleaned.length} issue(s) ` +
    `before responding. Treat each as a hard constraint.`;
  const body = cleaned.map((c, i) => `${i + 1}. ${c}`).join("\n");
  const tail =
    "Do NOT discuss why these are issues; just produce a corrected " +
    "worksheet that satisfies every constraint.";
  return `${header}\n\n${body}\n\n${tail}`;
}

// ─── Generic retry surface ───────────────────────────────────────────────────

/**
 * Generic retry-around-a-generator surface. Pure / idempotent.
 *
 *   - `generate`     async function that produces a result of type R
 *                    from params of type P.
 *   - `validate`     pure function that extracts
 *                    `{ warnings, qaScore }` from one result.
 *   - `append`       pure function that returns a new params object
 *                    with the constraint block appended (typically
 *                    onto an `additionalInstructions` field).
 *   - `params`       initial generator params.
 *   - `opts`         threshold, maxWarningsInRetry, etc.
 *
 * Returns `{ result, retryCount, retryReasons }`. Callers stamp this
 * onto their result's metadata themselves so this helper stays
 * fully generic (no AIWorksheetResult coupling).
 */
export async function runWithValidatorFeedbackRetry<P, R>(
  generate: (p: P) => Promise<R>,
  validate: (result: R) => ValidatorFeedbackEvaluation,
  append: (params: P, constraints: string) => P,
  params: P,
  opts: RetryOpts = {},
): Promise<RetryOutcome<R>> {
  const threshold = opts.threshold ?? 3;
  const maxWarnings = opts.maxWarningsInRetry ?? 8;
  const preferHigherQaScore = opts.preferHigherQaScore ?? true;
  const log = opts.logger ?? (() => {});

  const first = await generate(params);
  const firstEval = validate(first);

  if (firstEval.warnings.length < threshold) {
    log(
      `[validatorFeedbackRetry] no retry: ${firstEval.warnings.length} warnings < threshold ${threshold}`,
    );
    return { result: first, retryCount: 0, retryReasons: [] };
  }

  const constraints = buildConstraintBlock(firstEval.warnings, maxWarnings);
  if (!constraints) {
    // No actionable constraints (warnings were all noise after
    // stripping); skip retry.
    log(
      `[validatorFeedbackRetry] no retry: ${firstEval.warnings.length} warnings yielded no actionable constraints`,
    );
    return { result: first, retryCount: 0, retryReasons: [] };
  }

  log(
    `[validatorFeedbackRetry] retrying (${firstEval.warnings.length} warnings >= ${threshold})`,
  );

  const retryParams = append(params, constraints);
  let second: R;
  try {
    second = await generate(retryParams);
  } catch (err) {
    log(
      `[validatorFeedbackRetry] retry failed (${err instanceof Error ? err.message : String(err)}); keeping original`,
    );
    return {
      result: first,
      retryCount: 1,
      retryReasons: firstEval.warnings.slice(0, maxWarnings),
    };
  }
  const secondEval = validate(second);

  // Choose winner. When preferHigherQaScore is on, the higher
  // qaScore wins (ties broken in favour of the retry — it had the
  // benefit of the feedback). When off, retry always wins (taken
  // because original failed the threshold; trust it).
  let winner: R;
  if (preferHigherQaScore) {
    const a = firstEval.qaScore ?? -Infinity;
    const b = secondEval.qaScore ?? -Infinity;
    winner = b >= a ? second : first;
    log(
      `[validatorFeedbackRetry] qaScores: original=${firstEval.qaScore ?? "absent"} retry=${secondEval.qaScore ?? "absent"} → keeping ${winner === second ? "retry" : "original"}`,
    );
  } else {
    winner = second;
  }

  return {
    result: winner,
    retryCount: 1,
    retryReasons: firstEval.warnings.slice(0, maxWarnings),
  };
}

// ─── Worksheet-specific wrapper ─────────────────────────────────────────────

/**
 * Pure helper — extract warnings + qaScore from an
 * `AIWorksheetResult`'s metadata. Used by `runWorksheetWithRetry`.
 *
 * Reads:
 *   - `metadata.postValidatorWarnings: string[]`
 *   - `metadata.qaScore.total: number`
 */
export function extractWorksheetEval(
  ws: AIWorksheetResult,
): ValidatorFeedbackEvaluation {
  const meta = ws.metadata as Record<string, unknown> | undefined;
  const warnings =
    (meta?.postValidatorWarnings as string[] | undefined) ?? [];
  const qaScore = (meta?.qaScore as { total?: number } | undefined)?.total;
  return { warnings, qaScore };
}

/**
 * Pure helper — append a constraint block to a generator-params
 * object's `additionalInstructions` field. Non-mutating: returns a
 * shallow copy with the field updated.
 */
export function appendInstructionsConstraints<
  P extends { additionalInstructions?: string },
>(params: P, constraints: string): P {
  const existing = params.additionalInstructions
    ? params.additionalInstructions.trim() + "\n\n"
    : "";
  return {
    ...params,
    additionalInstructions: existing + constraints,
  };
}

/**
 * Worksheet convenience wrapper. Calls `generate(params)` and, when
 * ≥ threshold post-validator warnings fire, re-prompts ONCE with the
 * warnings inlined as constraints. Stamps `metadata.retryCount` +
 * `metadata.retryReasons` on the returned worksheet for telemetry.
 *
 * Drop-in around either `aiGenerateWorksheet` or
 * `aiGenerateWorksheetTwoPass`. Pure-function-of-function — the
 * helper itself is idempotent (running twice on the same generator
 * with the same flags produces the same answer to the question
 * "should I retry?"; the underlying generator's determinism is its
 * own concern).
 */
export async function runWorksheetWithRetry<
  P extends { additionalInstructions?: string },
>(
  generate: (p: P) => Promise<AIWorksheetResult>,
  params: P,
  opts: RetryOpts = {},
): Promise<AIWorksheetResult> {
  const { result, retryCount, retryReasons } =
    await runWithValidatorFeedbackRetry(
      generate,
      extractWorksheetEval,
      appendInstructionsConstraints,
      params,
      opts,
    );

  // Stamp telemetry onto metadata. We deliberately mutate `result`
  // here (rather than returning a fresh object) because the rest of
  // the pipeline expects the same identity through.
  const metaBag = (result.metadata ?? {}) as Record<string, unknown>;
  metaBag.retryCount = retryCount;
  metaBag.retryReasons = retryReasons;
  result.metadata = metaBag as AIWorksheetResult["metadata"];

  return result;
}
