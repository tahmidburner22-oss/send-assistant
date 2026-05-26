/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * answerVerifier.ts — FEAT-G1.
 *
 * Pure deterministic pupil-answer verifier for the four typeable
 * answer formats (numeric / short-text / mcq / structured) plus an
 * "open" pass-through that surfaces a teacher-mark message. Reads
 * `section.answerSpec` (added in this Phase to shared/aiSchemas.ts).
 *
 * Numeric branch:   reuses mathsVerifier.evalNumeric / parseExpectedNumeric.
 * Short-text:       case- + whitespace-insensitive equality + synonym bag
 *                   + Levenshtein distance ≤1 for words >6 chars.
 * MCQ:              accepts both `correctLetter: 'A'` and a numeric index 0-25.
 * Structured:       step-by-step match (M1/M2/A1) over the supplied steps.
 *
 * No LLM calls — the entire verifier is deterministic. The LLM is
 * reserved for "open" essays in Phase H follow-ups.
 */

export type VerifierStatus = "correct" | "partial" | "incorrect" | "unmarked";

export type VerifierMode = "numeric" | "short-text" | "mcq" | "structured" | "open";

export interface AnswerSpec {
  mode: VerifierMode;
  /** Numeric: canonical answer; short-text: canonical string; mcq: ignored. */
  answer?: string | number;
  unit?: string;
  tolerance?: number;
  canonicalAnswer?: string;
  synonyms?: string[];
  correctLetter?: string;
  steps?: { method: string; accept?: string[] }[];
  rubricRef?: string;
}

export interface MisconceptionLink {
  distractor?: string;
  misconceptionId?: string;
  misconceptionText?: string;
}

export interface VerifyOptions {
  /** When the question carries `metadata.misconceptionLinks`, pass the
   * matching subset here so the verifier can name the misconception. */
  misconceptionLinks?: MisconceptionLink[];
  /** Optional: section index for telemetry/logging. */
  sectionIndex?: number;
  /** Maximum marks available (defaults to 1). */
  marksAvailable?: number;
}

export interface VerifyResult {
  status: VerifierStatus;
  gainedMarks: number;
  marksAvailable: number;
  feedback: string;
  hintTier?: 1 | 2 | 3;
  misconceptionId?: string;
  misconceptionText?: string;
  /** Internal: which branch ran. Useful for tests + telemetry. */
  mode: VerifierMode;
}

const SYNONYM_GROUPS: Record<string, string[]> = {
  // A small built-in synonym bag; metadata.markSchemeSynonyms supplements
  // this list when supplied via the section's answerSpec.synonyms.
  evaporation: ["evaporate", "evaporates", "evaporating"],
  freezing: ["freeze", "freezes", "froze"],
  photosynthesis: ["photosynthesise", "photosynthesize"],
  respiration: ["respire", "respires"],
  combustion: ["burning", "burn", "combust", "combusts"],
};

function normalize(s: string | number | undefined | null): string {
  if (s === null || s === undefined) return "";
  return String(s).trim().toLowerCase().replace(/\s+/g, " ");
}

function stripUnit(s: string, unit?: string): string {
  if (!unit) return s;
  const u = unit.toLowerCase();
  return s.replace(new RegExp(`\\s*${u.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*$`, "i"), "").trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function fuzzyMatch(pupil: string, target: string): boolean {
  if (pupil === target) return true;
  if (target.length > 6 && Math.abs(pupil.length - target.length) <= 2) {
    return levenshtein(pupil, target) <= 1;
  }
  return false;
}

function expandSynonyms(canonical: string, extras?: string[]): string[] {
  const out = new Set<string>();
  out.add(canonical);
  for (const s of extras || []) out.add(normalize(s));
  for (const key of Object.keys(SYNONYM_GROUPS)) {
    if (key === canonical || SYNONYM_GROUPS[key].includes(canonical)) {
      out.add(key);
      for (const v of SYNONYM_GROUPS[key]) out.add(v);
    }
  }
  return Array.from(out);
}

function verifyNumeric(spec: AnswerSpec, pupil: string, marksAvail: number): VerifyResult {
  const expectedNum = typeof spec.answer === "number" ? spec.answer : parseFloat(String(spec.answer ?? ""));
  if (!Number.isFinite(expectedNum)) {
    return { status: "unmarked", gainedMarks: 0, marksAvailable: marksAvail, feedback: "No expected answer set.", mode: "numeric" };
  }
  const trimmed = normalize(pupil);
  const stripped = stripUnit(trimmed, spec.unit);
  const pupilNum = parseFloat(stripped);
  if (!Number.isFinite(pupilNum)) {
    return { status: "incorrect", gainedMarks: 0, marksAvailable: marksAvail, feedback: "Could not read your answer as a number.", mode: "numeric" };
  }
  const tol = typeof spec.tolerance === "number" && spec.tolerance >= 0 ? spec.tolerance : 0;
  const ok = Math.abs(pupilNum - expectedNum) <= tol + 1e-9;
  if (ok) {
    return { status: "correct", gainedMarks: marksAvail, marksAvailable: marksAvail, feedback: `Correct ✓ — ${marksAvail} mark${marksAvail === 1 ? "" : "s"}`, mode: "numeric" };
  }
  return { status: "incorrect", gainedMarks: 0, marksAvailable: marksAvail, feedback: "Try again ✗", mode: "numeric" };
}

function verifyShortText(spec: AnswerSpec, pupil: string, marksAvail: number): VerifyResult {
  const canonical = normalize(spec.canonicalAnswer ?? spec.answer);
  if (!canonical) {
    return { status: "unmarked", gainedMarks: 0, marksAvailable: marksAvail, feedback: "No expected answer set.", mode: "short-text" };
  }
  const candidates = expandSynonyms(canonical, spec.synonyms);
  const npupil = normalize(pupil);
  if (!npupil) {
    return { status: "incorrect", gainedMarks: 0, marksAvailable: marksAvail, feedback: "Try again ✗", mode: "short-text" };
  }
  for (const c of candidates) {
    if (fuzzyMatch(npupil, c)) {
      return { status: "correct", gainedMarks: marksAvail, marksAvailable: marksAvail, feedback: `Correct ✓ — ${marksAvail} mark${marksAvail === 1 ? "" : "s"}`, mode: "short-text" };
    }
  }
  return { status: "incorrect", gainedMarks: 0, marksAvailable: marksAvail, feedback: "Try again ✗", mode: "short-text" };
}

function verifyMcq(
  spec: AnswerSpec,
  pupil: string,
  marksAvail: number,
  options?: VerifyOptions,
): VerifyResult {
  let correct = "";
  if (typeof spec.correctLetter === "string" && /^[a-z]$/i.test(spec.correctLetter)) {
    correct = spec.correctLetter.toUpperCase();
  } else if (typeof spec.answer === "number" && Number.isInteger(spec.answer) && spec.answer >= 0 && spec.answer < 26) {
    correct = String.fromCharCode(65 + spec.answer);
  } else if (typeof spec.answer === "string" && /^[a-z]$/i.test(spec.answer.trim())) {
    correct = spec.answer.trim().toUpperCase();
  }
  if (!correct) {
    return { status: "unmarked", gainedMarks: 0, marksAvailable: marksAvail, feedback: "No expected answer set.", mode: "mcq" };
  }
  const npupil = pupil.trim().toUpperCase();
  if (npupil === correct) {
    return { status: "correct", gainedMarks: marksAvail, marksAvailable: marksAvail, feedback: `Correct ✓ — ${marksAvail} mark${marksAvail === 1 ? "" : "s"}`, mode: "mcq" };
  }
  // Surface diagnosed misconception when the wrong letter matches a link.
  const link = (options?.misconceptionLinks || []).find((l) => (l.distractor || "").trim().toUpperCase() === npupil);
  if (link) {
    return {
      status: "incorrect",
      gainedMarks: 0,
      marksAvailable: marksAvail,
      feedback: link.misconceptionText
        ? `Try again ✗ — ${link.misconceptionText}`
        : "Try again ✗ — common misconception detected",
      mode: "mcq",
      misconceptionId: link.misconceptionId,
      misconceptionText: link.misconceptionText,
    };
  }
  return { status: "incorrect", gainedMarks: 0, marksAvailable: marksAvail, feedback: "Try again ✗", mode: "mcq" };
}

function verifyStructured(
  spec: AnswerSpec,
  pupil: string,
  marksAvail: number,
): VerifyResult {
  const steps = spec.steps || [];
  if (steps.length === 0) {
    return { status: "unmarked", gainedMarks: 0, marksAvailable: marksAvail, feedback: "No method steps defined.", mode: "structured" };
  }
  const npupil = normalize(pupil);
  let matched = 0;
  for (const step of steps) {
    const accept = (step.accept && step.accept.length ? step.accept : [step.method]).map(normalize);
    if (accept.some((a) => a && npupil.includes(a))) {
      matched += 1;
    }
  }
  if (matched === 0) {
    return { status: "incorrect", gainedMarks: 0, marksAvailable: marksAvail, feedback: "Try again ✗", mode: "structured" };
  }
  if (matched === steps.length) {
    return { status: "correct", gainedMarks: marksAvail, marksAvailable: marksAvail, feedback: `Correct ✓ — ${marksAvail} mark${marksAvail === 1 ? "" : "s"}`, mode: "structured" };
  }
  const partialMarks = Math.max(1, Math.round((marksAvail * matched) / steps.length));
  return {
    status: "partial",
    gainedMarks: partialMarks,
    marksAvailable: marksAvail,
    feedback: `Partial ◐ — ${partialMarks}/${marksAvail} marks (${matched}/${steps.length} steps matched)`,
    mode: "structured",
    hintTier: matched === steps.length - 1 ? 1 : matched > steps.length / 2 ? 2 : 3,
  };
}

/**
 * Pure deterministic verifier. Same input → same output across two
 * calls. No LLM, no network, no global state.
 */
export function verifyAnswer(
  spec: AnswerSpec | undefined | null,
  pupilInput: string,
  options: VerifyOptions = {},
): VerifyResult {
  const marksAvail = options.marksAvailable ?? 1;
  if (!spec || !spec.mode) {
    return { status: "unmarked", gainedMarks: 0, marksAvailable: marksAvail, feedback: "Teacher will mark this.", mode: "open" };
  }
  if (spec.mode === "open") {
    return { status: "unmarked", gainedMarks: 0, marksAvailable: marksAvail, feedback: "Teacher will mark this.", mode: "open" };
  }
  switch (spec.mode) {
    case "numeric":
      return verifyNumeric(spec, pupilInput, marksAvail);
    case "short-text":
      return verifyShortText(spec, pupilInput, marksAvail);
    case "mcq":
      return verifyMcq(spec, pupilInput, marksAvail, options);
    case "structured":
      return verifyStructured(spec, pupilInput, marksAvail);
    default:
      return { status: "unmarked", gainedMarks: 0, marksAvailable: marksAvail, feedback: "Unknown answer format.", mode: "open" };
  }
}

export const __testing = { levenshtein, fuzzyMatch, normalize, expandSynonyms };
