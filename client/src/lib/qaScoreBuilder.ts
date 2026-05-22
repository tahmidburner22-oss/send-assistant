/**
 * qaScoreBuilder.ts
 *
 * PR-4 — audit item #50 — Quality scorecard implementation.
 *
 * The schema (`shared/aiSchemas.ts:WorksheetMetadata.qaScore` and
 * `client/src/lib/worksheet-generator.ts:WorksheetQAScore`) has carried a
 * `qaScore` field for spec §29 since the worksheet pipeline was first
 * designed, but until now only the **legacy** template-based generator at
 * `worksheet-generator.ts:scoreWorksheet` actually computed a value, and
 * that legacy scorer only inspected cosmetic signals (section presence,
 * layout-tag diversity, a reading-age boundary check). The AI-driven path
 * — which is what the production system actually uses on every teacher
 * request — never called `scoreWorksheet` at all, so every AI-generated
 * worksheet shipped without a `qaScore`. The teacher-view banner in
 * `WorksheetRenderer.tsx` (line 4705 / 4792) hid itself behind a
 * `worksheet.metadata?.qaScore` truthy check, which meant teachers never
 * saw a quality score on any AI worksheet.
 *
 * This module is the single source of truth for the scorer. It is wired
 * as the LAST step in `runWorksheetPostValidators` so it sees the final
 * post-validated worksheet — including all warnings stamped by Phases 1–5,
 * PR-1 (SEND fidelity), PR-2 (command-word / SI / reading-age), PR-3
 * (diagram coupling / distractor pedagogy / Tier-3 vocab / notation
 * hygiene), the Common Mistakes audit, the mark-scheme reconciler, and
 * the curriculum-authority invariants. The score is therefore an
 * aggregate of *real* signals from validators that have already done the
 * forensic work, not a separate set of heuristics that could drift out
 * of step with what the validators actually catch.
 *
 * Scoring weights are unchanged from the spec §29 ratios already
 * declared on `WorksheetQAScore`:
 *
 *   curriculumAlignment    /15
 *   examStyleAccuracy      /15
 *   questionProgression    /10
 *   diagramQuality         /10
 *   sendAdaptationQuality  /15
 *   layoutPrintQuality     /10
 *   teacherKeyQuality      /10
 *   notationAccuracy       /10
 *   metadataValidity       /5
 *   ─────────────────────────
 *   total                  /100
 *
 * `failConditions` collects auto-fail messages that override `total` and
 * push `status` to `do-not-publish`. They are reserved for "this
 * worksheet should never reach a teacher" cases (no question sections at
 * all, no teacher key, > 50 % of SEND adaptation rules missing).
 *
 * The scorer is **pure / deterministic / idempotent** — running twice
 * yields the same output.
 */

// The scorer only consumes the post-validator-shape worksheet. We don't
// import from worksheet-generator.ts because that file is large and
// its imports pull in client-only bundles. Re-declare the structural
// shape we need.
export interface QaScorableSection {
  id?: string;
  type?: string;
  title?: string;
  content?: string;
  teacherOnly?: boolean;
  specRef?: string;
  imageUrl?: string;
  assetRef?: string;
  svg?: string;
  [key: string]: unknown;
}

export interface QaScorableWorksheet {
  title?: string;
  subtitle?: string;
  sections?: QaScorableSection[];
  metadata?: Record<string, unknown> & {
    subject?: string;
    topic?: string;
    yearGroup?: string;
    examBoard?: string;
    sendNeed?: string;
    generatorVersion?: string;
    readingAge?: number;
    postValidatorWarnings?: string[];
    sendFidelityReport?: {
      sendNeedId?: string;
      rules?: Array<{ status?: string }>;
    };
    commonMistakesAudit?: {
      sectionFound?: boolean;
      blocks?: Array<{ blockOk?: boolean }>;
    };
  };
  [key: string]: unknown;
}

/**
 * Mirrors `WorksheetQAScore` in `client/src/lib/worksheet-generator.ts`
 * exactly. Re-declared here to keep this module a leaf in the import
 * graph (so the post-validator chain doesn't pull in the legacy
 * generator).
 */
export interface QaScore {
  curriculumAlignment: number;
  examStyleAccuracy: number;
  questionProgression: number;
  diagramQuality: number;
  sendAdaptationQuality: number;
  layoutPrintQuality: number;
  teacherKeyQuality: number;
  notationAccuracy: number;
  metadataValidity: number;
  total: number;
  status:
    | "publish-ready"
    | "good"
    | "needs-revision"
    | "do-not-publish"
    | "regenerate"
    | "pass"
    | "warn"
    | "fail";
  failConditions: string[];
}

const QUESTION_SECTION_TYPES = new Set([
  "q-short-answer",
  "q-extended",
  "q-mcq",
  "q-true-false",
  "q-gap-fill",
  "q-matching",
  "q-data-table",
  "q-label-diagram",
  "q-ordering",
  "challenge",
  "recall",
  "understanding",
  "application",
  "questions",
]);

const TEACHER_KEY_TYPES = new Set([
  "teacher-key",
  "mark-scheme",
  "answers",
  "answer-key",
]);

const LO_TYPES = new Set(["learning-objective", "objective"]);

/**
 * Categorise a post-validator warning so the scorer can deduct against
 * the right component. The matchers are intentionally narrow so a warning
 * only counts toward one bucket — overlapping deductions would punish the
 * same issue twice.
 */
type WarningBucket =
  | "curriculum"
  | "command-word"
  | "diagram"
  | "send"
  | "notation"
  | "uk-english"
  | "common-mistakes"
  | "mark-scheme"
  | "softener"
  | "ao"
  | "placeholder"
  | "section-count"
  | "reading-age"
  | "distractor"
  | "tier3-vocab"
  | "si-unit"
  | "self-reflection"
  | "revision-tips"
  | "other";

function bucketOf(w: string): WarningBucket {
  // Order matters — earlier matchers win.
  if (/spec[- ]?(point|anchor)|\bspec[- ]?(point|anchor)|specRef|no taxonomy bundled/i.test(w)) return "curriculum";
  if (/command[- ]word fidelity/i.test(w)) return "command-word";
  if (/diagram .*(missing|unresolved|coupling|references)/i.test(w)) return "diagram";
  if (/SEND fidelity|SEND adaptation/i.test(w)) return "send";
  if (/\bSI units?\b|\bimperial\b/i.test(w)) return "si-unit";
  if (/notation hygiene/i.test(w)) return "notation";
  if (/UK[- ]English rewrite/i.test(w)) return "uk-english";
  if (/Common Mistakes/i.test(w)) return "common-mistakes";
  if (/Mark[- ]scheme drift|reconcile|reconciler/i.test(w)) return "mark-scheme";
  if (/banned softener|softener phrase/i.test(w)) return "softener";
  if (/\bAO\d+|fabricated[- ]AO|fabricated assessment[- ]objective/i.test(w)) return "ao";
  if (/placeholder|template[- ]literal leakage/i.test(w)) return "placeholder";
  if (/section count|out of target|count exceeded|count below/i.test(w)) return "section-count";
  if (/reading age|reading-age|Flesch[- ]Kincaid/i.test(w)) return "reading-age";
  if (/distractor pedagogy|MCQ distractor|duplicate distractor/i.test(w)) return "distractor";
  if (/Tier[- ]?3|Tier-3 vocabulary|Tier3 vocabulary/i.test(w)) return "tier3-vocab";
  if (/self[- ]?reflection/i.test(w)) return "self-reflection";
  if (/revision[- ]?tips/i.test(w)) return "revision-tips";
  return "other";
}

function tally(warnings: string[]): Record<WarningBucket, number> {
  const counts: Record<WarningBucket, number> = {
    curriculum: 0,
    "command-word": 0,
    diagram: 0,
    send: 0,
    notation: 0,
    "uk-english": 0,
    "common-mistakes": 0,
    "mark-scheme": 0,
    softener: 0,
    ao: 0,
    placeholder: 0,
    "section-count": 0,
    "reading-age": 0,
    distractor: 0,
    "tier3-vocab": 0,
    "si-unit": 0,
    "self-reflection": 0,
    "revision-tips": 0,
    other: 0,
  };
  for (const w of warnings) counts[bucketOf(w)]++;
  return counts;
}

/** Clamp a number into [min, max]. */
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Compute the QA scorecard for a post-validated worksheet.
 *
 * Every component starts at its full weight and is deducted against
 * relevant warning buckets and structural signals. The function is
 * pure — running it twice on the same worksheet returns deep-equal
 * output.
 */
export function computeQaScore(ws: QaScorableWorksheet): QaScore {
  const sections = ws.sections || [];
  const meta = ws.metadata || {};
  const warnings = (meta.postValidatorWarnings as string[] | undefined) || [];
  const counts = tally(warnings);

  const sectionTypes = new Set(sections.map((s) => String(s.type || "").toLowerCase()));
  const questionSections = sections.filter((s) =>
    QUESTION_SECTION_TYPES.has(String(s.type || "").toLowerCase()),
  );
  const teacherKeySections = sections.filter((s) =>
    TEACHER_KEY_TYPES.has(String(s.type || "").toLowerCase()),
  );
  const hasLearningObjective = sections.some((s) =>
    LO_TYPES.has(String(s.type || "").toLowerCase()),
  );
  const hasDiagram = sections.some(
    (s) =>
      /diagram/i.test(String(s.type || "")) ||
      Boolean(s.imageUrl) ||
      Boolean(s.svg) ||
      Boolean(s.assetRef),
  );

  // ── 1. curriculumAlignment (/15) ─────────────────────────────────────────
  let curriculumAlignment = 15;
  curriculumAlignment -= Math.min(8, counts.curriculum * 1);
  // Question sections without a specRef each cost 1 (capped at 5).
  const questionsWithoutSpecRef = questionSections.filter((s) => !s.specRef).length;
  curriculumAlignment -= Math.min(5, questionsWithoutSpecRef);
  curriculumAlignment = clamp(curriculumAlignment, 0, 15);

  // ── 2. examStyleAccuracy (/15) ───────────────────────────────────────────
  let examStyleAccuracy = 15;
  examStyleAccuracy -= Math.min(10, counts["command-word"] * 2);
  if (!hasLearningObjective) examStyleAccuracy -= 4;
  // No "extended"/"challenge" type means no exam-style stretch question.
  if (!sectionTypes.has("q-extended") && !sectionTypes.has("challenge")) {
    examStyleAccuracy -= 3;
  }
  examStyleAccuracy = clamp(examStyleAccuracy, 0, 15);

  // ── 3. questionProgression (/10) ─────────────────────────────────────────
  let questionProgression = 10;
  questionProgression -= Math.min(6, counts["section-count"] * 2);
  if (questionSections.length === 0) questionProgression = 0;
  questionProgression = clamp(questionProgression, 0, 10);

  // ── 4. diagramQuality (/10) ──────────────────────────────────────────────
  let diagramQuality = 10;
  diagramQuality -= Math.min(8, counts.diagram * 4);
  // If a worksheet has no diagram at all, lose a small amount —
  // some topics genuinely don't need one, so this is a soft signal.
  if (!hasDiagram) diagramQuality -= 2;
  diagramQuality = clamp(diagramQuality, 0, 10);

  // ── 5. sendAdaptationQuality (/15) ───────────────────────────────────────
  let sendAdaptationQuality = 15;
  const sendReport = meta.sendFidelityReport;
  const sendNeed = String(meta.sendNeed || "").toLowerCase();
  const isSendTagged = sendNeed && sendNeed !== "none-selected" && sendNeed !== "none";
  if (isSendTagged) {
    if (!sendReport) {
      // SEND-tagged but no audit ran — significant signal gap.
      sendAdaptationQuality -= 6;
    } else {
      const rules = sendReport.rules || [];
      const missing = rules.filter((r) => r.status === "missing").length;
      const total = rules.length || 1;
      const missRatio = missing / total;
      sendAdaptationQuality -= Math.min(12, Math.round(missRatio * 12));
    }
  }
  // Generic SEND warnings that didn't tie to the structured report.
  sendAdaptationQuality -= Math.min(4, counts.send * 1);
  sendAdaptationQuality = clamp(sendAdaptationQuality, 0, 15);

  // ── 6. layoutPrintQuality (/10) ──────────────────────────────────────────
  let layoutPrintQuality = 10;
  // Distinct section types is a proxy for visual diversity. Print-ready
  // worksheets typically show ≥ 5 distinct types; below 4 is monotonous.
  const distinctTypes = sectionTypes.size;
  if (distinctTypes < 4) layoutPrintQuality -= 3;
  if (distinctTypes < 6) layoutPrintQuality -= 1;
  // Placeholder leakage (template-literal artifacts in pupil text) is
  // a classic print-quality failure.
  layoutPrintQuality -= Math.min(4, counts.placeholder * 2);
  layoutPrintQuality = clamp(layoutPrintQuality, 0, 10);

  // ── 7. teacherKeyQuality (/10) ───────────────────────────────────────────
  let teacherKeyQuality = 10;
  if (teacherKeySections.length === 0) teacherKeyQuality -= 6;
  teacherKeyQuality -= Math.min(4, counts["common-mistakes"] * 1);
  teacherKeyQuality -= Math.min(3, counts["mark-scheme"] * 1);
  teacherKeyQuality = clamp(teacherKeyQuality, 0, 10);

  // ── 8. notationAccuracy (/10) ────────────────────────────────────────────
  let notationAccuracy = 10;
  notationAccuracy -= Math.min(6, counts.notation * 1);
  notationAccuracy -= Math.min(3, counts["uk-english"] * 1);
  notationAccuracy -= Math.min(2, counts["si-unit"] * 1);
  notationAccuracy -= Math.min(2, counts["tier3-vocab"] * 1);
  // Reading-age outside [5, 18] is implausible; deduct hard.
  const readingAge = typeof meta.readingAge === "number" ? meta.readingAge : null;
  if (readingAge !== null && (readingAge < 5 || readingAge > 18)) notationAccuracy -= 3;
  notationAccuracy -= Math.min(2, counts["reading-age"] * 1);
  notationAccuracy = clamp(notationAccuracy, 0, 10);

  // ── 9. metadataValidity (/5) ─────────────────────────────────────────────
  let metadataValidity = 5;
  if (!meta.subject) metadataValidity -= 1;
  if (!meta.topic) metadataValidity -= 1;
  if (!meta.yearGroup) metadataValidity -= 1;
  if (!meta.examBoard) metadataValidity -= 1;
  if (!meta.generatorVersion) metadataValidity -= 1;
  metadataValidity = clamp(metadataValidity, 0, 5);

  // ── failConditions ───────────────────────────────────────────────────────
  const failConditions: string[] = [];
  if (questionSections.length === 0) {
    failConditions.push("No question sections present");
  }
  if (teacherKeySections.length === 0) {
    failConditions.push("Missing Teacher Key");
  }
  if (sendReport) {
    const rules = sendReport.rules || [];
    const missing = rules.filter((r) => r.status === "missing").length;
    const total = rules.length || 1;
    if (rules.length > 0 && missing / total > 0.5) {
      failConditions.push("SEND adaptation severely incomplete (> 50% rules missing)");
    }
  }
  if (counts.placeholder >= 3) {
    failConditions.push("Multiple placeholder leakage warnings — output not pupil-ready");
  }

  // ── total ────────────────────────────────────────────────────────────────
  const total =
    curriculumAlignment +
    examStyleAccuracy +
    questionProgression +
    diagramQuality +
    sendAdaptationQuality +
    layoutPrintQuality +
    teacherKeyQuality +
    notationAccuracy +
    metadataValidity;

  // ── status ───────────────────────────────────────────────────────────────
  let status: QaScore["status"];
  if (failConditions.length > 0) {
    status = "do-not-publish";
  } else if (total >= 90) {
    status = "publish-ready";
  } else if (total >= 75) {
    status = "good";
  } else if (total >= 60) {
    status = "needs-revision";
  } else {
    status = "regenerate";
  }

  return {
    curriculumAlignment,
    examStyleAccuracy,
    questionProgression,
    diagramQuality,
    sendAdaptationQuality,
    layoutPrintQuality,
    teacherKeyQuality,
    notationAccuracy,
    metadataValidity,
    total,
    status,
    failConditions,
  };
}

/**
 * Map the new five-bucket status (`publish-ready` | `good` |
 * `needs-revision` | `do-not-publish` | `regenerate`) onto the legacy
 * three-bucket `validationStatus` field (`pass` | `warn` | `fail`) that
 * the rest of the codebase (renderer banner, Worksheets.tsx page,
 * persistence layer) reads.
 *
 * - `publish-ready` / `good`  → "pass"
 * - `needs-revision`          → "warn"
 * - `regenerate` / `do-not-publish` → "fail"
 */
export function mapStatusToValidation(
  status: QaScore["status"],
): "pass" | "warn" | "fail" {
  switch (status) {
    case "publish-ready":
    case "good":
    case "pass":
      return "pass";
    case "needs-revision":
    case "warn":
      return "warn";
    case "regenerate":
    case "do-not-publish":
    case "fail":
      return "fail";
    default:
      return "warn";
  }
}

/**
 * Stamp `metadata.qaScore` and `metadata.validationStatus` onto a
 * worksheet (immutably). Pure / idempotent — running twice produces the
 * same metadata. Returns the worksheet whether or not the score changed
 * (so callers don't have to branch).
 */
export function applyQaScore<T extends QaScorableWorksheet>(ws: T): T {
  const score = computeQaScore(ws);
  return {
    ...ws,
    metadata: {
      ...(ws.metadata || {}),
      qaScore: score,
      validationStatus: mapStatusToValidation(score.status),
    },
  } as T;
}
