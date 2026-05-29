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
import type { EvalFixture } from "./types";

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

// ─── Registry ────────────────────────────────────────────────────────────────

/**
 * Lane 2.3 — Stacked-need both-markers-present rule.
 *
 * Inspects a worksheet whose `params.sendNeed` is a `+`-separated
 * compound key (e.g. "hi+eal", "adhd+dyslexia") and asserts that
 * EVERY recognised need in the compound has its hallmark marker
 * present in the post-validated worksheet. Skipped when the fixture
 * declares no compound (i.e. single-need or no-need fixtures pass
 * vacuously).
 *
 * The marker dictionary mirrors the dispatch table in
 * `enforceSendOverlayMarkers`. Unknown need keys (e.g. "asc",
 * "slcn", "working-memory" — which have no post-validator marker
 * enforcer today) are tolerated as no-ops so future fixtures can be
 * added without breaking the rule.
 *
 * Failure message lists EVERY missing need so the eval report names
 * the gap precisely (rather than failing on the first missing
 * marker).
 */
type StackedMarkerProbe = (ws: PostValidatorWorksheet) => string | undefined;

function findStackedSection(
  ws: PostValidatorWorksheet,
  sectionType: string,
  titleRegex?: RegExp,
): string | undefined {
  const sections = ws.sections || [];
  for (const s of sections) {
    if (s.teacherOnly) continue;
    const t = String(s.type || "").toLowerCase();
    const title = String(s.title || "");
    if (t === sectionType.toLowerCase()) return s.title || s.type || sectionType;
    if (titleRegex && titleRegex.test(title)) return title;
  }
  return undefined;
}

function findContentSubstring(
  ws: PostValidatorWorksheet,
  re: RegExp,
): string | undefined {
  const sections = ws.sections || [];
  for (const s of sections) {
    if (s.teacherOnly) continue;
    const content = typeof s.content === "string" ? s.content : "";
    const m = content.match(re);
    if (m) return m[0];
  }
  return undefined;
}

/** ADHD has THREE possible markers: tick-box prefix on questions,
 *  brain-break section, OR Challenge title rewrite to "BONUS — only
 *  if you want to!". Any one is sufficient evidence. */
function findAdhdMarker(ws: PostValidatorWorksheet): string | undefined {
  const sections = ws.sections || [];
  for (const s of sections) {
    if (s.teacherOnly) continue;
    const content = typeof s.content === "string" ? s.content : "";
    const firstLine = (content.split("\n").find((l) => l.trim()) || "").trim();
    if (firstLine.startsWith("[ ]")) return "tick-box prefix";
    if (/brain\s*break/i.test(content)) return "brain break";
    const title = String(s.title || "");
    if (/^BONUS\b/.test(title) || /^OPTIONAL BONUS\b/.test(title)) return title;
  }
  return undefined;
}

/** Anxiety markers: Challenge title containing "OPTIONAL BONUS" OR
 *  Section A/1 title prefixed with "WARM-UP". Either is sufficient. */
function findAnxietyTitleMarker(ws: PostValidatorWorksheet): string | undefined {
  const sections = ws.sections || [];
  for (const s of sections) {
    if (s.teacherOnly) continue;
    const title = String(s.title || "");
    if (/^OPTIONAL BONUS\b/.test(title)) return title;
    if (/^WARM-UP\b/.test(title)) return title;
  }
  return undefined;
}

const STACKED_MARKER_PROBES: Readonly<Record<string, StackedMarkerProbe>> = {
  hi: (ws) => findStackedSection(ws, "topic-summary"),
  "hearing-impairment": (ws) => findStackedSection(ws, "topic-summary"),
  deaf: (ws) => findStackedSection(ws, "topic-summary"),
  dyslexia: (ws) =>
    findStackedSection(ws, "method-box", /method\s*step|step[-\s]by[-\s]step/i),
  // MLD branch is no-op when HI's topic-summary is already present
  // (by design — see enforceMldMarkers). Either marker satisfies the
  // MLD need: a topic-context block, OR a topic-summary that the HI
  // branch inserted.
  mld: (ws) =>
    findStackedSection(ws, "topic-context") ??
    findStackedSection(ws, "topic-summary"),
  adhd: (ws) => findAdhdMarker(ws),
  dyscalculia: (ws) =>
    findContentSubstring(ws, /numbers\s+in\s+this\s+question|number\s+steps/i),
  eal: (ws) => findContentSubstring(ws, /sentence\s+frame|^frame\s*:|starter\s*:/im),
  esl: (ws) => findContentSubstring(ws, /sentence\s+frame|^frame\s*:|starter\s*:/im),
  anxiety: (ws) => findAnxietyTitleMarker(ws),
  semh: (ws) => findAnxietyTitleMarker(ws),
  "mental-health": (ws) => findAnxietyTitleMarker(ws),
  // VI / Dyspraxia are warn-only audits — they don't INSERT a marker.
  // For the stacked rule we treat them as satisfied vacuously so the
  // rule gates only on insert / append branches that produce
  // verifiable evidence.
  vi: () => "vi-audit-only-no-marker",
  "visual-impairment": () => "vi-audit-only-no-marker",
  visual: () => "vi-audit-only-no-marker",
  dyspraxia: () => "dyspraxia-audit-only-no-marker",
  dcd: () => "dyspraxia-audit-only-no-marker",
};

const stackedNeedsBothMarkersPresent: Rule = (ws, fixture) => {
  const send = (fixture.params?.sendNeed || "").toString().toLowerCase();
  if (!send || !/[+&,]/.test(send)) return { ok: true };

  const parts = send
    .split(/[+&,]/)
    .map((p) => p.trim().replace(/^send:/, "").replace(/[\s_]/g, "-"))
    .filter(Boolean);
  // De-dupe.
  const unique = Array.from(new Set(parts));
  // Ignore parts with no probe registered (asc / slcn / working-memory).
  const probed = unique.filter((p) => STACKED_MARKER_PROBES[p]);
  if (probed.length === 0) return { ok: true };

  const missing: string[] = [];
  for (const part of probed) {
    const probe = STACKED_MARKER_PROBES[part];
    const evidence = probe(ws);
    if (!evidence) missing.push(part);
  }
  if (missing.length > 0) {
    return {
      ok: false,
      reason: `stacked sendNeed "${send}" missing markers for: ${missing.join(", ")}`,
    };
  }
  return { ok: true };
};

export const RULE_REGISTRY: Record<string, Rule> = {
  "mcq-single-correct": mcqSingleCorrect,
  "word-bank-deduped": wordBankDeduped,
  "no-foreign-diagrams": noForeignDiagrams,
  "reading-age-in-range": readingAgeInRange,
  "spec-ref-present": specRefPresent,
  "send-fidelity-floor": sendFidelityFloor,
  "qa-score-floor": qaScoreFloor,
  "stacked-needs-both-markers-present": stackedNeedsBothMarkersPresent,
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
