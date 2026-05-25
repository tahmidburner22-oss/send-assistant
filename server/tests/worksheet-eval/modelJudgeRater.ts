/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/tests/worksheet-eval/modelJudgeRater.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 1.D — Model-judge rater for the eval harness.
 *
 * Rates a generated worksheet against the 6-axis rubric in
 * `docs/teacher-rater-rubric.md`. Two implementations:
 *
 *   1. `stubRater`  — deterministic, $0, runs offline. Derives axis
 *      scores from the worksheet's stamped `qaScore.total` + the
 *      `metadata.postValidatorWarnings` array (categorised into
 *      per-axis penalties). Used when `EVAL_JUDGE_MODE=stub` (the
 *      default in CI / sandbox / dev).
 *
 *   2. `liveRater`  — calls a real LLM (via the same `callAI`
 *      provider abstraction `generators.liveGenerator` uses) with a
 *      rubric-grounded prompt. Returns
 *      `{ scores, rationale }`. Used when `EVAL_JUDGE_MODE=live`
 *      AND a provider key is in env.
 *
 * Cross-provider isolation: the judge provider MUST NOT match the
 * generator provider for the comparison to be meaningful. Mismatch
 * is enforced as a runtime warning (logged, not aborted) so local
 * debugging stays unblocked. Set `EVAL_JUDGE_STRICT_ISOLATION=1` to
 * upgrade the warning to an error.
 *
 * Both raters return the same shape so the runner downstream of the
 * call doesn't care which path produced the rating.
 *
 * Schema additions are additive: never write a field on row /
 * report that isn't in `types.ts`. Sprint 1.C is the contract.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { PostValidatorWorksheet } from "../../../client/src/lib/worksheetPostValidator";
import type {
  AxisKey,
  AxisScores,
  EvalFixture,
  EvalFixtureParams,
} from "./types";
import { AXIS_KEYS } from "./types";

// ─── Public types ────────────────────────────────────────────────────────────

export interface RaterResult {
  scores: AxisScores;
  rationale: string;
}

export interface Rater {
  /** Free-text label for the report ("stub" / "live"). */
  name: string;
  /** Provider id ("claude", "openai", "groq", "gemini", "openrouter",
   *  "stub"). Surfaces in the report so cross-provider isolation can
   *  be audited from a JSON file alone. */
  provider: string;
  /** Model id (e.g. "claude-3-5-sonnet"). May be `""` for stub. */
  model: string;
  /** Estimated USD cost per call — used by the cost guard. */
  estimatedCostUsd: number;
  /** Rate one worksheet against the 6-axis rubric. */
  rate(
    worksheet: PostValidatorWorksheet,
    fixture: EvalFixture,
  ): Promise<RaterResult>;
}

// ─── Stub rater ──────────────────────────────────────────────────────────────

/** Maximum length of the rationale string stamped on report rows.
 *  Keeps eval-report.json a reasonable size when 30+ fixtures
 *  contribute rationales. */
export const RATIONALE_TRUNCATE_AT = 500;

/**
 * Convert a 0–100 qaScore to a 1–5 base axis score (band-mapped):
 *
 *   ≥ 90  → 5  (exemplary)
 *   ≥ 75  → 4  (solid)
 *   ≥ 60  → 3  (usable with edit)
 *   ≥ 40  → 2  (significant rework)
 *   else  → 1  (unusable)
 *
 * The band edges match the rubric document's score labels so a
 * worksheet scoring 85 from the post-validator chain consistently
 * maps to "solid" (4) rather than wandering between 4 and 5 with
 * arithmetic noise.
 */
export function bandFromQaScore(qa: number | undefined): number {
  if (typeof qa !== "number" || Number.isNaN(qa)) return 3;
  if (qa >= 90) return 5;
  if (qa >= 75) return 4;
  if (qa >= 60) return 3;
  if (qa >= 40) return 2;
  return 1;
}

/**
 * Map a single warning string to the axis (or axes) it should
 * deduct from. Substring-matched against a curated catalogue of
 * patterns drawn from the existing post-validator warning surface.
 * Returns an empty array when a warning doesn't map to a rubric
 * axis (e.g. an internal-only diagnostic) — those warnings still
 * affect `qaScore` via the existing scoreboard, they just don't
 * double-deduct on a rubric axis.
 *
 * Pure / deterministic — single source of truth for stub-rater
 * deductions. The live rater's prompt makes the same per-axis
 * concern split, so the two raters stay calibrated.
 */
export function classifyWarning(warning: string): AxisKey[] {
  const w = warning.toLowerCase();
  const axes: AxisKey[] = [];

  // curriculum fidelity ─────────────────────────────────────────
  if (
    w.includes("specref") ||
    w.includes("spec ref") ||
    w.includes("invented") ||
    w.includes("does not match any published") ||
    w.includes("year-group") ||
    w.includes("year group lock") ||
    (w.includes("ao") && w.includes("histogram"))
  ) {
    axes.push("curriculumFidelity");
  }

  // stem authenticity ─────────────────────────────────────────
  if (
    w.includes("command-word") ||
    w.includes("command word") ||
    w.includes("past-paper fingerprint") ||
    w.includes("past paper fingerprint") ||
    w.includes("leaked generator instruction") ||
    w.includes("placeholder") ||
    w.includes("[insert") ||
    w.includes("examiner voice")
  ) {
    axes.push("stemAuthenticity");
  }

  // accessibility ─────────────────────────────────────────────
  if (
    w.includes("reading age") ||
    w.includes("reading-age") ||
    w.includes("tier-3") ||
    w.includes("tier 3") ||
    w.includes("plain english") ||
    w.includes("alt text") ||
    w.includes("wcag") ||
    w.includes("contrast") ||
    w.includes("braille") ||
    w.includes("notation hygiene")
  ) {
    axes.push("accessibility");
  }

  // marks & answers ───────────────────────────────────────────
  if (
    w.includes("mark scheme") ||
    w.includes("mark-scheme") ||
    w.includes("mathsverifier") ||
    w.includes("maths verifier") ||
    w.includes("multiple correct") ||
    w.includes("✓") ||
    w.includes("answer leakage") ||
    w.includes("bloom progression") ||
    w.includes("section question count")
  ) {
    axes.push("marksAndAnswers");
  }

  // SEND alignment ────────────────────────────────────────────
  if (
    w.includes("send fidelity") ||
    w.includes("send-fidelity") ||
    w.includes("dyscalculia") ||
    w.includes("dyslexia scaffold") ||
    w.includes("send adaptation") ||
    w.includes("ehcp")
  ) {
    axes.push("sendAlignment");
  }

  // UX & printability ─────────────────────────────────────────
  if (
    w.includes("page fit") ||
    w.includes("page-fit") ||
    w.includes("foreign diagram") ||
    (w.includes("diagram") && w.includes("removed")) ||
    w.includes("worked example") ||
    w.includes("work step") ||
    w.includes("revision tip") ||
    w.includes("self-reflection") ||
    w.includes("class pack")
  ) {
    axes.push("uxAndPrintability");
  }

  return axes;
}

/**
 * Deterministic stub rater.
 *
 * Scoring algorithm:
 *   1. Pull `metadata.qaScore.total` (default 60 if absent).
 *   2. Map to a 1–5 base score per axis via `bandFromQaScore`.
 *   3. Walk `metadata.postValidatorWarnings`, classify each via
 *      `classifyWarning`, deduct 1 from each affected axis.
 *   4. Clamp every axis to [1, 5].
 *   5. `sendAlignment` is `null` when the fixture has no
 *      `sendNeed` (matches the rubric's "n/a" rule).
 *
 * The result is a pure function of `(worksheet, fixture)` — calling
 * `stubRater.rate` twice on the same input yields identical scores
 * and identical rationale text, so CI diffs stay stable across runs
 * without keys.
 */
export const stubRater: Rater = {
  name: "stub",
  provider: "stub",
  model: "",
  estimatedCostUsd: 0,
  async rate(worksheet, fixture) {
    return computeStubScores(worksheet, fixture);
  },
};

/** Pure helper exposed for tests. */
export function computeStubScores(
  worksheet: PostValidatorWorksheet,
  fixture: EvalFixture,
): RaterResult {
  const meta = worksheet.metadata as Record<string, unknown> | undefined;
  const qaTotal = (meta?.qaScore as { total?: number } | undefined)?.total;
  const baseBand = bandFromQaScore(qaTotal);
  const warnings =
    (meta?.postValidatorWarnings as string[] | undefined) ?? [];

  const deductions: Record<AxisKey, number> = {
    curriculumFidelity: 0,
    stemAuthenticity: 0,
    accessibility: 0,
    marksAndAnswers: 0,
    sendAlignment: 0,
    uxAndPrintability: 0,
  };
  for (const w of warnings) {
    for (const axis of classifyWarning(w)) {
      deductions[axis] += 1;
    }
  }

  // Cap deductions so a noisy worksheet doesn't push every axis to 0.
  for (const axis of AXIS_KEYS) {
    if (deductions[axis] > 3) deductions[axis] = 3;
  }

  const clamp = (n: number) => Math.max(1, Math.min(5, n));
  const hasSend = Boolean(fixture.params.sendNeed);

  const scores: AxisScores = {
    curriculumFidelity: clamp(baseBand - deductions.curriculumFidelity),
    stemAuthenticity: clamp(baseBand - deductions.stemAuthenticity),
    accessibility: clamp(baseBand - deductions.accessibility),
    marksAndAnswers: clamp(baseBand - deductions.marksAndAnswers),
    sendAlignment: hasSend
      ? clamp(baseBand - deductions.sendAlignment)
      : null,
    uxAndPrintability: clamp(baseBand - deductions.uxAndPrintability),
  };

  const dedNotes = AXIS_KEYS
    .filter((axis) => deductions[axis] > 0 && scores[axis] !== null)
    .map((axis) => `${axis} −${deductions[axis]}`)
    .join(", ");
  const qaNote =
    typeof qaTotal === "number"
      ? `qaScore ${qaTotal} → band ${baseBand}`
      : `qaScore absent → band 3`;
  const rationale = truncateRationale(
    `[stub] ${qaNote}. ${dedNotes ? `Axis deductions: ${dedNotes}.` : "No axis deductions."} Warnings observed: ${warnings.length}.`,
  );

  return { scores, rationale };
}

/** Truncate a rationale to `RATIONALE_TRUNCATE_AT` chars with a
 *  visible elision marker so the reader knows it was clipped. */
export function truncateRationale(s: string): string {
  if (s.length <= RATIONALE_TRUNCATE_AT) return s;
  return s.slice(0, RATIONALE_TRUNCATE_AT - 3) + "...";
}

// ─── Live rater ──────────────────────────────────────────────────────────────

/** Rubric prompt block — mirrors `docs/teacher-rater-rubric.md`. The
 *  block is the LIVE contract between the two raters: the stub's
 *  warning-classification table above and this prompt are the same
 *  rubric expressed in two different surfaces. Keep them in sync. */
const RUBRIC_SYSTEM_PROMPT = `You are a senior UK classroom teacher (HoD-level) rating a worksheet against a fixed 6-axis rubric. Be honest. A "5" means HoD-exemplar grade; a "1" means unusable. Most worksheets land in the 2–4 band.

The 6 axes (rate each 1–5):

1. curriculumFidelity — does this teach what the spec says, at the right level, with real spec-refs (not invented), correct command words, and topic-stable scope?
2. stemAuthenticity — do the stems sound like a real exam (specific contexts, principal-examiner cadence) or like a chatbot wrote them ("Let's explore...", "Imagine you're a chemist...")? Distractors should be real misconceptions.
3. accessibility — reading age in band, Tier-3 vocab in a Word Bank, sentence length appropriate, notation correct, diagrams parseable without colour-only legends.
4. marksAndAnswers — mark scheme present + correct (a model answer would actually score the marks), AO codes accurate, no calculation errors, M1/A1 split where appropriate.
5. sendAlignment — when a SEND profile is declared, does the worksheet evidence concrete adaptations matching the profile, or just stamp a banner? RETURN null FOR THIS AXIS WHEN NO SEND PROFILE IS DECLARED IN THE INPUT.
6. uxAndPrintability — clean page breaks, sensible whitespace per question, teacher-only sections clearly marked, professional typography. Would a teacher print 30 copies without apologising?

Return ONLY a JSON object with this exact shape (no markdown, no commentary):

{
  "scores": {
    "curriculumFidelity": <1-5>,
    "stemAuthenticity":   <1-5>,
    "accessibility":      <1-5>,
    "marksAndAnswers":    <1-5>,
    "sendAlignment":      <1-5 or null>,
    "uxAndPrintability":  <1-5>
  },
  "rationale": "<one paragraph, max 400 chars, identifying the strongest and weakest axis>"
}

Be conservative. If unsure, score 3 ("usable with edit") rather than 4. Do not pad scores upward.`;

/**
 * Build the user-message block for the judge — a compact rendering
 * of the worksheet. We pass section titles + first ~200 chars of
 * each section's content so the judge can see what's there without
 * the prompt blowing past 4k tokens on a long worksheet.
 */
export function buildJudgeUserMessage(
  worksheet: PostValidatorWorksheet,
  fixture: EvalFixture,
): string {
  const params = fixture.params;
  const sendNote = params.sendNeed
    ? `SEND profile declared: ${params.sendNeed}. Score sendAlignment 1–5.`
    : `No SEND profile declared. Return sendAlignment: null.`;

  const lines: string[] = [];
  lines.push(`Subject: ${params.subject}`);
  lines.push(`Year group: ${params.yearGroup}`);
  lines.push(`Topic: ${params.topic}`);
  if (params.examBoard) lines.push(`Exam board: ${params.examBoard}`);
  if (params.difficulty) lines.push(`Declared difficulty: ${params.difficulty}`);
  lines.push(sendNote);
  lines.push("");
  lines.push(`Worksheet title: ${worksheet.title ?? "(no title)"}`);
  lines.push(`Subtitle: ${worksheet.subtitle ?? "(none)"}`);
  lines.push("");
  lines.push("Sections (title + first 200 chars of content):");
  for (const section of worksheet.sections ?? []) {
    const title = section.title ?? "(untitled)";
    const type = section.type ?? "?";
    const content = (section.content ?? "").slice(0, 200);
    lines.push(`- [${type}] ${title}`);
    if (content.trim()) lines.push(`  ${content}`);
  }
  return lines.join("\n");
}

/**
 * Parse the judge's JSON output. Defensive: tries straight
 * `JSON.parse` first, then falls back to extracting the first
 * `{...}` block from a text response (some providers wrap JSON in
 * commentary even when asked not to). Returns null on parse fail.
 */
export function parseJudgeResponse(raw: string): RaterResult | null {
  let text = raw.trim();
  // Strip common markdown code fences.
  if (text.startsWith("```")) {
    const firstNewline = text.indexOf("\n");
    if (firstNewline !== -1) {
      text = text.slice(firstNewline + 1);
      const fenceEnd = text.lastIndexOf("```");
      if (fenceEnd !== -1) text = text.slice(0, fenceEnd);
    }
  }
  // Try direct parse.
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Fallback: greedy extract first balanced {...}.
    const open = text.indexOf("{");
    const close = text.lastIndexOf("}");
    if (open === -1 || close === -1 || close < open) return null;
    try {
      parsed = JSON.parse(text.slice(open, close + 1));
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as { scores?: unknown; rationale?: unknown };
  if (!obj.scores || typeof obj.scores !== "object") return null;
  const s = obj.scores as Record<string, unknown>;
  const validateAxis = (
    axisKey: AxisKey,
    nullable = false,
  ): number | null => {
    const v = s[axisKey];
    if (v === null && nullable) return null;
    if (typeof v !== "number" || v < 1 || v > 5) {
      throw new Error(`invalid axis "${axisKey}": ${JSON.stringify(v)}`);
    }
    return v;
  };
  try {
    const scores: AxisScores = {
      curriculumFidelity: validateAxis("curriculumFidelity") as number,
      stemAuthenticity: validateAxis("stemAuthenticity") as number,
      accessibility: validateAxis("accessibility") as number,
      marksAndAnswers: validateAxis("marksAndAnswers") as number,
      sendAlignment: validateAxis("sendAlignment", true),
      uxAndPrintability: validateAxis("uxAndPrintability") as number,
    };
    const rationale =
      typeof obj.rationale === "string"
        ? truncateRationale(obj.rationale)
        : "";
    return { scores, rationale };
  } catch {
    return null;
  }
}

/**
 * Live rater. Calls the configured judge provider via the same
 * dynamic-import + localStorage shim used by `liveGenerator`. Reads
 * `EVAL_JUDGE_PROVIDER` (claude / openai / groq / gemini / openrouter)
 * and `EVAL_JUDGE_MODEL` (provider-specific id). Cost-guard inputs:
 * `EVAL_JUDGE_COST_PER_CALL` (defaults $0.005, ~half of generator
 * cost since the judge runs a smaller prompt with no schema fixing).
 *
 * On any failure (parse error, provider error, missing key) the
 * live rater FALLS BACK to the stub rater for that row. The fallback
 * is logged so the runner can warn — better to ship a complete
 * report with mostly-stub scores than abort the whole run.
 */
export const liveRater: Rater = {
  name: "live",
  provider: process.env.EVAL_JUDGE_PROVIDER ?? "claude",
  model: process.env.EVAL_JUDGE_MODEL ?? "",
  estimatedCostUsd: parseFloat(process.env.EVAL_JUDGE_COST_PER_CALL ?? "0.005"),
  async rate(worksheet, fixture) {
    try {
      const result = await callLiveJudge(worksheet, fixture);
      if (result) return result;
      console.warn(
        `[modelJudge] live rater returned unparseable response for fixture ${fixture.id}; falling back to stub.`,
      );
    } catch (err) {
      console.warn(
        `[modelJudge] live rater errored on fixture ${fixture.id} (${err instanceof Error ? err.message : String(err)}); falling back to stub.`,
      );
    }
    return computeStubScores(worksheet, fixture);
  },
};

/** Internal — issues the actual provider call. Returns null on
 *  unparseable response; throws on transport-level errors.
 *
 *  Note on provider isolation: `callAIMessages` routes through the
 *  app's existing provider chain — we cannot pin a specific
 *  provider from this call site without modifying ai.ts. The judge
 *  runs against whichever provider has a key + responds first. Set
 *  ONE provider key (e.g. only `EVAL_JUDGE_ANTHROPIC_KEY`) to force
 *  the choice, or override at the server-routing layer. The
 *  isolation guard surfaces the risk as a warning. */
async function callLiveJudge(
  worksheet: PostValidatorWorksheet,
  fixture: EvalFixture,
): Promise<RaterResult | null> {
  shimLocalStorageForJudge();
  // Same dynamic import dance liveGenerator uses — the client-side
  // ai.ts module is fine to load under Node provided localStorage
  // is shimmed beforehand.
  const { callAIMessages } = (await import(
    "../../../client/src/lib/ai"
  )) as typeof import("../../../client/src/lib/ai");

  const userMsg = buildJudgeUserMessage(worksheet, fixture);
  const reply = await callAIMessages(
    [
      { role: "system", content: RUBRIC_SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
    1500, // maxTokens — judge output is short JSON, room for rationale
    { responseFormat: "json_object" },
  );

  return parseJudgeResponse(reply.text);
}

/** Mirrors the localStorage shim in `generators.liveGenerator`. The
 *  client-side `ai.ts` module reads provider keys via
 *  `getStoredKey`, which uses `globalThis.localStorage`. This
 *  function seeds it from `EVAL_JUDGE_*` env vars without colliding
 *  with the generator's seed (the keys are merged; if the same
 *  provider is used by both generator and judge, the same key is
 *  used — tests for this case happen in the runner, not here). */
function shimLocalStorageForJudge(): void {
  const g = globalThis as unknown as {
    localStorage?: {
      getItem(k: string): string | null;
      setItem(k: string, v: string): void;
    };
  };
  if (g.localStorage) {
    // Already seeded (probably by liveGenerator). Merge judge keys
    // in if they're not already present.
    const existingRaw = g.localStorage.getItem("ai_keys") ?? "{}";
    let existing: Record<string, string> = {};
    try {
      existing = JSON.parse(existingRaw) as Record<string, string>;
    } catch {
      existing = {};
    }
    const merged = mergeJudgeKeys(existing);
    if (JSON.stringify(merged) !== existingRaw) {
      g.localStorage.setItem("ai_keys", JSON.stringify(merged));
    }
    return;
  }
  const store = new Map<string, string>();
  store.set("ai_keys", JSON.stringify(mergeJudgeKeys({})));
  g.localStorage = {
    getItem(k: string) {
      return store.has(k) ? (store.get(k) as string) : null;
    },
    setItem(k: string, v: string) {
      store.set(k, v);
    },
  };
}

function mergeJudgeKeys(
  existing: Record<string, string>,
): Record<string, string> {
  const envKeys: Record<string, string | undefined> = {
    groq: process.env.EVAL_JUDGE_GROQ_KEY ?? process.env.EVAL_GROQ_KEY,
    gemini: process.env.EVAL_JUDGE_GEMINI_KEY ?? process.env.EVAL_GEMINI_KEY,
    openrouter:
      process.env.EVAL_JUDGE_OPENROUTER_KEY ?? process.env.EVAL_OPENROUTER_KEY,
    openai: process.env.EVAL_JUDGE_OPENAI_KEY ?? process.env.EVAL_OPENAI_KEY,
    claude:
      process.env.EVAL_JUDGE_ANTHROPIC_KEY ?? process.env.EVAL_ANTHROPIC_KEY,
  };
  const out = { ...existing };
  for (const [provider, key] of Object.entries(envKeys)) {
    if (key && !out[provider]) out[provider] = key;
  }
  return out;
}

// ─── Provider isolation guard ────────────────────────────────────────────────

/**
 * Cross-provider isolation check. The rubric calibration story
 * depends on the judge being a different model family than the
 * generator — a model judging its own output is biased. This guard
 * does NOT abort: it logs a warning so local debugging stays
 * unblocked (e.g. running both as `stub` is a perfectly valid
 * unit-test config). Set `EVAL_JUDGE_STRICT_ISOLATION=1` to upgrade
 * the warning to a thrown error.
 *
 * Returns the assessment so the runner can stamp it onto the
 * report's `modelJudgeProvider` annotation.
 */
export function assessProviderIsolation(
  judgeProvider: string,
  generatorProvider: string,
): { isolated: boolean; warning: string | null } {
  if (judgeProvider === "stub" || generatorProvider === "mock") {
    // One side is offline — there's nothing to isolate. The runner
    // logs the stub/mock combo separately.
    return { isolated: true, warning: null };
  }
  if (judgeProvider !== generatorProvider) {
    return { isolated: true, warning: null };
  }
  const warning = `[modelJudge] judge provider "${judgeProvider}" matches generator provider — ratings are biased; consider setting EVAL_JUDGE_PROVIDER to a different family (e.g. "claude" if generator is "openai").`;
  if (process.env.EVAL_JUDGE_STRICT_ISOLATION === "1") {
    throw new Error(warning);
  }
  return { isolated: false, warning };
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Pick a rater from environment configuration.
 *
 *   EVAL_JUDGE_MODE=stub  — always use the deterministic stub (default)
 *   EVAL_JUDGE_MODE=live  — use the live rater (requires
 *                           EVAL_JUDGE_PROVIDER + matching key)
 *   EVAL_JUDGE_MODE=off   — return a no-op rater that doesn't stamp
 *                           anything (skips per-axis evaluation entirely)
 */
export function pickRater(): Rater {
  const mode = (process.env.EVAL_JUDGE_MODE ?? "stub").toLowerCase();
  if (mode === "off") return offRater;
  if (mode === "live") return liveRater;
  return stubRater;
}

/** No-op rater that returns all-null scores and an explicit
 *  rationale. The runner can detect this and skip the rubric block
 *  in the markdown summary entirely. */
export const offRater: Rater = {
  name: "off",
  provider: "off",
  model: "",
  estimatedCostUsd: 0,
  async rate(_ws, _fixture) {
    return {
      scores: {
        curriculumFidelity: null,
        stemAuthenticity: null,
        accessibility: null,
        marksAndAnswers: null,
        sendAlignment: null,
        uxAndPrintability: null,
      },
      rationale: "[off] model-judge disabled by EVAL_JUDGE_MODE=off",
    };
  },
};

// ─── Re-exports for the runner ──────────────────────────────────────────────

export type { EvalFixtureParams }; // convenience re-export
