/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/tests/worksheet-eval/rules.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Rule registry for the worksheet eval harness. Each rule is a pure
 * predicate over the post-validated worksheet that returns either OK
 * or a reason string. Rules read three inputs:
 *
 *   1. The worksheet (sections + metadata) returned by the generator
 *      and threaded through `runWorksheetPostValidators`.
 *   2. The accumulated `metadata.postValidatorWarnings` array (every
 *      validator stamps warnings here).
 *   3. The fixture itself (so range-style rules can read the
 *      fixture's expected bands, e.g. `readingAgeRange`).
 *
 * Rules are intentionally permissive — they fail only when a
 * post-validator warning of a specific shape was raised, or when a
 * structural invariant the worksheet must hold is missing. Additive
 * rules can be registered without touching the runner.
 *
 * See `docs/eval-harness.md` for the full rule catalogue and how to
 * add a new rule.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { PostValidatorWorksheet } from "../../../client/src/lib/worksheetPostValidator";
import type { EvalFixture, AxisScores } from "./types";
import { AXIS_KEYS } from "./types";

/** Single-rule outcome. `null` reason ⇒ rule passed. */
export type RuleResult = { ok: true } | { ok: false; reason: string };

/** Rule predicate signature. Pure — no I/O. */
export type Rule = (
  worksheet: PostValidatorWorksheet,
  fixture: EvalFixture,
) => RuleResult;

/** Helper — read warnings stamped by post-validators. */
function warnings(ws: PostValidatorWorksheet): string[] {
  return (ws.metadata?.postValidatorWarnings as string[] | undefined) || [];
}

function lower(arr: string[]): string[] {
  return arr.map((s) => s.toLowerCase());
}

// ─── Built-in rules ──────────────────────────────────────────────────────────

/**
 * MCQs must have exactly one correct answer marked. The post-validator
 * `enforceSingleMcqCorrect` strips the second-and-beyond ✓ markers and
 * any leaked "CORRECT: B" meta lines, warning each time. Generator
 * quality fails when those rewrites had to fire — even if the strip
 * was successful, the AI emitted a quality issue.
 */
const mcqSingleCorrect: Rule = (ws) => {
  const w = lower(warnings(ws));
  const hit = w.find(
    (s) =>
      s.includes("removed a second ✓") ||
      s.includes("stripped leaked mark-scheme meta") ||
      s.includes("multiple correct"),
  );
  return hit ? { ok: false, reason: hit } : { ok: true };
};

/**
 * Word-bank entries must be deduplicated AND ≤ 10. `dedupeWordBank`
 * collapses duplicates / caps the bank and warns when it had to act.
 * Generator quality fails when the AI emitted dups or an over-long
 * word bank — regardless of whether the post-validator silently fixed it.
 */
const wordBankDeduped: Rule = (ws) => {
  const w = lower(warnings(ws));
  const hit = w.find(
    (s) =>
      s.includes("de-duplicated and capped word bank") ||
      s.includes("word bank duplicate"),
  );
  return hit ? { ok: false, reason: hit } : { ok: true };
};

/**
 * No diagrams from a foreign subject (e.g. a biology cell on a maths
 * fractions worksheet). `stripForeignDiagrams` strips and warns. Fail
 * when the strip pass had to act — regardless of whether the strip
 * was successful, the AI emitted a wrong-subject diagram.
 */
const noForeignDiagrams: Rule = (ws) => {
  const w = lower(warnings(ws));
  const hit = w.find(
    (s) =>
      s.includes("removed foreign diagram") ||
      s.includes("foreign diagram") ||
      s.includes("subject mismatch on diagram"),
  );
  return hit ? { ok: false, reason: hit } : { ok: true };
};

/**
 * Reading age must be inside the fixture's stated band. Reads either:
 *   1. `metadata.readingAgeActual` (Phase 5 / PR-2 stamps this), or
 *   2. The numeric inside an "actual reading age N.Nyrs" warning, or
 *   3. The fixture-provided `readingAgeRange` and a warning saying
 *      the budget was exceeded.
 *
 * If neither metadata nor warning is available the rule passes (no
 * data — no failure).
 */
const readingAgeInRange: Rule = (ws, fixture) => {
  const range = fixture.readingAgeRange;
  if (!range || range.length !== 2) return { ok: true };
  const [min, max] = range;

  // (1) preferred — explicit number on metadata
  const stamped = (ws.metadata as Record<string, unknown> | undefined)
    ?.readingAgeActual;
  if (typeof stamped === "number") {
    if (stamped < min || stamped > max) {
      return {
        ok: false,
        reason: `reading age ${stamped.toFixed(1)} outside band ${min}-${max}`,
      };
    }
    return { ok: true };
  }

  // (2) parse from warnings stamped by enforceReadingAgeBudget
  const w = warnings(ws);
  const re = /reading\s*age[^\d]*([\d.]+)/i;
  for (const line of w) {
    const m = line.match(re);
    if (m && m[1]) {
      const n = parseFloat(m[1]);
      if (!Number.isNaN(n) && (n < min || n > max)) {
        return { ok: false, reason: line };
      }
    }
  }

  return { ok: true };
};

/**
 * Every question section must carry a real spec-point code from the
 * named board's published taxonomy. `enforceSpecAnchorPresence` warns
 * when (a) the AI omitted specRefs (post-validator filled them) or
 * (b) the AI invented codes that don't match any published list.
 * Both are quality issues — fail in either case.
 *
 * "No spec-point taxonomy bundled" is treated as a no-data pass: it
 * fires when the (board × subject × year) combo isn't bundled, in
 * which case the rule has nothing to grade.
 */
const specRefPresent: Rule = (ws) => {
  const w = lower(warnings(ws));
  const hit = w.find(
    (s) =>
      s.includes("filled missing specref") ||
      s.includes("invented specref") ||
      s.includes("does not match any published code") ||
      s.includes("no spec reference") ||
      s.includes("specref absent"),
  );
  return hit ? { ok: false, reason: hit } : { ok: true };
};

/**
 * SEND fidelity ratio must clear a floor. Reads the structured
 * `metadata.sendFidelityReport` from FEAT-PB6 / PR-1. Threshold is
 * 0.5 — i.e. at least half the SEND profile's rules must show
 * evidence. Skipped when the fixture doesn't declare a `sendNeed`.
 */
const sendFidelityFloor: Rule = (ws, fixture) => {
  if (!fixture.params?.sendNeed) return { ok: true };
  const report = (ws.metadata as Record<string, unknown> | undefined)
    ?.sendFidelityReport as
    | { fidelityRatio?: number; sendNeedName?: string }
    | undefined;
  if (!report || typeof report.fidelityRatio !== "number") {
    return { ok: true }; // no data — don't fail
  }
  const floor = 0.5;
  if (report.fidelityRatio < floor) {
    return {
      ok: false,
      reason: `SEND fidelity ${report.fidelityRatio.toFixed(2)} below floor ${floor} for ${report.sendNeedName ?? fixture.params.sendNeed}`,
    };
  }
  return { ok: true };
};

/**
 * The QA score (PR-4 audit item #50) must be at least the fixture's
 * declared `qaScoreFloor`, defaulting to 60. Fails if either the score
 * is missing or it's below the floor.
 */
const qaScoreFloor: Rule = (ws, fixture) => {
  const floor = fixture.qaScoreFloor ?? 60;
  const meta = ws.metadata as Record<string, unknown> | undefined;
  const score = (meta?.qaScore as { total?: number } | undefined)?.total;
  if (typeof score !== "number") {
    return { ok: false, reason: "qaScore not stamped on worksheet" };
  }
  if (score < floor) {
    return { ok: false, reason: `qaScore ${score} below floor ${floor}` };
  }
  return { ok: true };
};

/**
 * PR-1 Sprint 1.C — model-judge axis-floor rule.
 *
 * The model-judge stamps its per-axis scores at
 * `metadata.modelJudgeScores` (see `modelJudgeRater.ts`, Sprint 1.D).
 * This rule fails when any axis falls below the fixture's declared
 * floor — the floor is configurable per-fixture via
 * `fixture.modelJudgeAxisFloor`. Missing axes inherit the runner
 * default of 3 ("usable with edit"). A floor of 0 disables the
 * check for that axis (useful during early calibration when one
 * axis is intentionally being measured but not gated on).
 *
 * `null` axis scores (e.g. `sendAlignment` for non-SEND fixtures)
 * are skipped — they're an explicit "n/a" per the rubric, not a
 * failure.
 *
 * No-op when the model-judge didn't run (no
 * `metadata.modelJudgeScores` present). This means a fixture that
 * declares the rule but is exercised in a run without judge keys
 * still passes — the rule is a gate on judge output, not on judge
 * presence.
 */
const DEFAULT_AXIS_FLOOR = 3;

const modelJudgeAxisFloor: Rule = (ws, fixture) => {
  const meta = ws.metadata as Record<string, unknown> | undefined;
  const scores = meta?.modelJudgeScores as AxisScores | undefined;
  if (!scores) return { ok: true }; // no judge ran — not a failure

  const floors = fixture.modelJudgeAxisFloor ?? {};
  const failures: string[] = [];

  for (const axis of AXIS_KEYS) {
    const score = scores[axis];
    if (score === null || score === undefined) continue; // n/a
    const floor = floors[axis] ?? DEFAULT_AXIS_FLOOR;
    if (floor <= 0) continue; // disabled
    if (score < floor) {
      failures.push(`${axis} ${score} < floor ${floor}`);
    }
  }

  if (failures.length === 0) return { ok: true };
  return { ok: false, reason: failures.join("; ") };
};

// ─── Registry ────────────────────────────────────────────────────────────────

export const RULE_REGISTRY: Record<string, Rule> = {
  "mcq-single-correct": mcqSingleCorrect,
  "word-bank-deduped": wordBankDeduped,
  "no-foreign-diagrams": noForeignDiagrams,
  "reading-age-in-range": readingAgeInRange,
  "spec-ref-present": specRefPresent,
  "send-fidelity-floor": sendFidelityFloor,
  "qa-score-floor": qaScoreFloor,
  "model-judge-axis-floor": modelJudgeAxisFloor,
};

export const ALL_RULE_NAMES = Object.keys(RULE_REGISTRY);

/** Run a list of rule names against one worksheet. */
export function evaluateRules(
  ws: PostValidatorWorksheet,
  fixture: EvalFixture,
): { passed: boolean; failedRules: Array<{ rule: string; reason: string }> } {
  const failedRules: Array<{ rule: string; reason: string }> = [];
  const ruleNames = fixture.rules ?? [];
  for (const name of ruleNames) {
    const rule = RULE_REGISTRY[name];
    if (!rule) {
      failedRules.push({ rule: name, reason: "rule not registered" });
      continue;
    }
    const result = rule(ws, fixture);
    if (!result.ok) failedRules.push({ rule: name, reason: result.reason });
  }
  return { passed: failedRules.length === 0, failedRules };
}
