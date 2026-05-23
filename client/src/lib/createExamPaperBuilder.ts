/**
 * createExamPaperBuilder.ts — Phase E PR-B.
 *
 * Pure-function exam-paper assembly engine. Takes (subject, topics[],
 * totalMarks) and emits an ExamPaperWorksheet — the same output shape
 * examPaperBuilder.ts produces, so the new tool slots straight into
 * the existing renderer / PDF / Class-Pack pipeline without any new
 * export plumbing.
 *
 * Algorithm:
 *   1. Pull candidate pool from the bank using
 *      `getCandidatePoolForTopics` (PR-A surface).
 *   2. Split pool into mark-bands:
 *        warm-up: 1-3 marks
 *        core:    4-6 marks
 *        stretch: 7+ marks
 *   3. Mark-shape budget:
 *        real-exam       30% / 50% / 20% of totalMarks across bands
 *        single-section  100% in core
 *   4. Per-topic floor: every requested topic contributes at least
 *      one question, OR a warning is emitted naming the empty topic.
 *   5. Greedy deterministic-shuffle knapsack within each band:
 *      walk pool in shuffled order, pick the next question that fits
 *      the remaining budget. Tie-break by AO + command-word diversity
 *      against questions already selected.
 *   6. Sort selected questions ascending by marks within each section.
 *   7. Format via formatQuestionForWorksheet.
 *   8. Emit ExamPaperWorksheet.
 *
 * Determinism: identical (params, seed) always produce the identical
 * paper. Tests rely on this. `seed` is hashed to seed a small linear
 * congruential generator (LCG); when omitted, defaults to djb2(JSON of
 * params) so calls without an explicit seed are still deterministic.
 *
 * Pure: no I/O, no LLM, no localStorage, no globals beyond the question
 * bank imported through `pastPaperQuestions`.
 *
 * Reuses (does NOT modify) examPaperBuilder.ts — only imports its
 * output type.
 */

import type {
  PastPaperQuestion,
  AssessmentObjective,
} from "./pastPaperQuestions";
import {
  getCandidatePoolForTopics,
  formatQuestionForWorksheet,
} from "./pastPaperQuestions";
import type { ExamPaperWorksheet, ExamPaperSection } from "./examPaperBuilder";

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type CreatedExamPaperStyle = "real-exam" | "single-section";

export interface CreatedExamPaperParams {
  /** Canonical subject id (e.g. "mathematics", "biology"). Required. */
  subject: string;
  /** One or more topic OR subtopic names from SUBTOPICS_MAP. Required. */
  topics: string[];
  /** Target total marks for the assembled paper. Required. */
  totalMarks: number;
  /** Optional tier filter (Higher / Foundation). */
  tier?: "Higher" | "Foundation";
  /** Optional school year-group (1-13) for age-appropriate filtering. */
  yearGroup?: number;
  /** Optional examination board (e.g. "Adaptly"). */
  examBoard?: string;
  /** Optional calculator policy. Filters the pool to questions whose
   *  `calculator` field matches (or is unspecified — assume permissive). */
  calculator?: boolean;
  /** Optional SEND profile id. Surfaced on the worksheet metadata only;
   *  the engine does not adapt content. */
  sendNeed?: string;
  /** Whether to include a teacher-only mark-scheme section. Default: true. */
  includeAnswers?: boolean;
  /**
   * Paper shape:
   *   "real-exam"      → 30/50/20 mark-band split (default)
   *   "single-section" → all marks in a single Core section
   */
  paperStyle?: CreatedExamPaperStyle;
  /** Optional fixed timing in minutes (default: 1 minute per mark, GCSE pace). */
  timingMinutes?: number;
  /** Optional integer seed for deterministic output. */
  seed?: number;
  /**
   * Optional override of the candidate pool. ONLY for tests — production
   * callers should leave this undefined so the engine pulls from the
   * real bank via `getCandidatePoolForTopics`.
   */
  poolOverride?: PastPaperQuestion[];
}

export interface CreatedExamPaperResult {
  /** The assembled paper, in the same shape as examPaperBuilder.ts emits. */
  worksheet: ExamPaperWorksheet;
  /** Non-fatal warnings — empty topics, undersized pool, etc. */
  warnings: string[];
  /** Diagnostic — questions chosen, in section order. */
  selectedQuestions: PastPaperQuestion[];
  /** Diagnostic — marks landed in each band. */
  bandTotals: { warmup: number; core: number; stretch: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// Determinism helpers
// ─────────────────────────────────────────────────────────────────────────────

/** djb2 32-bit string hash. Same family used elsewhere in the repo. */
function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

/** Tiny LCG seeded from a 32-bit integer. Deterministic. */
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** Deterministic Fisher-Yates shuffle. Returns a NEW array. */
function shuffleDeterministic<T>(arr: ReadonlyArray<T>, rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─────────────────────────────────────────────────────────────────────────────
// Band classification
// ─────────────────────────────────────────────────────────────────────────────

export type MarkBand = "warmup" | "core" | "stretch";

export function classifyBand(marks: number): MarkBand {
  if (marks <= 3) return "warmup";
  if (marks <= 6) return "core";
  return "stretch";
}

function bandBudget(
  totalMarks: number,
  paperStyle: CreatedExamPaperStyle,
): Record<MarkBand, number> {
  if (paperStyle === "single-section") {
    return { warmup: 0, core: totalMarks, stretch: 0 };
  }
  // 30/50/20 split (rounded so the three add up to totalMarks).
  const warmup = Math.round(totalMarks * 0.3);
  const stretch = Math.round(totalMarks * 0.2);
  const core = totalMarks - warmup - stretch;
  return { warmup, core, stretch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Topic-matching (mirror of getCandidatePoolForTopics's matcher)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if the question's effective topic OR subtopic matches the
 * requested topic name. Uses substring match in either direction so a
 * broad topic (e.g. "Algebra") matches subtopic-tagged questions and a
 * fine subtopic (e.g. "Quadratic equations") matches topic-tagged
 * questions whose text mentions it.
 */
function questionMatchesTopic(q: PastPaperQuestion, requested: string): boolean {
  const r = requested.toLowerCase();
  if (!r) return false;
  const t = (q.topic || "").toLowerCase();
  const s = (q.subtopic || "").toLowerCase();
  if (t && (t.includes(r) || r.includes(t))) return true;
  if (s && (s.includes(r) || r.includes(s))) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tie-break scoring — diversity bonus
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score a candidate question for a tie-break against the questions
 * already selected. Higher score = better fit. Used to prefer AOs and
 * command words not yet represented.
 */
function diversityScore(
  candidate: PastPaperQuestion,
  alreadySelected: PastPaperQuestion[],
): number {
  const usedAos = new Set<AssessmentObjective>();
  const usedCmds = new Set<string>();
  for (const s of alreadySelected) {
    if (s.ao) usedAos.add(s.ao);
    if (s.commandWord) usedCmds.add(s.commandWord.toLowerCase());
  }
  let score = 0;
  if (candidate.ao && !usedAos.has(candidate.ao)) score += 2;
  if (candidate.commandWord && !usedCmds.has(candidate.commandWord.toLowerCase())) score += 1;
  return score;
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculator filter
// ─────────────────────────────────────────────────────────────────────────────

function calculatorAllows(q: PastPaperQuestion, calc: boolean | undefined): boolean {
  if (calc === undefined) return true;
  if (q.calculator === undefined) return true; // permissive when unspecified
  return q.calculator === calc;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

const MARGIN_MARKS = 2; // hard band-budget tolerance

export function buildCreatedExamPaper(
  params: CreatedExamPaperParams,
): CreatedExamPaperResult {
  const {
    subject,
    topics,
    totalMarks,
    tier,
    yearGroup,
    examBoard,
    calculator,
    sendNeed,
    includeAnswers = true,
    paperStyle = "real-exam",
    timingMinutes,
    seed,
    poolOverride,
  } = params;

  const warnings: string[] = [];

  if (!subject) throw new Error("buildCreatedExamPaper: subject is required");
  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error("buildCreatedExamPaper: at least one topic is required");
  }
  if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
    throw new Error("buildCreatedExamPaper: totalMarks must be a positive number");
  }

  // 1. Pool. Tests inject `poolOverride` so they don't need the real bank.
  const rawPool: PastPaperQuestion[] =
    poolOverride ?? getCandidatePoolForTopics({ subject, topics, tier, yearGroup, board: examBoard });

  // Apply calculator filter.
  const pool = rawPool.filter(q => calculatorAllows(q, calculator));

  if (pool.length === 0) {
    warnings.push(`Pool is empty for subject="${subject}" topics=${JSON.stringify(topics)}.`);
    return emptyResult(params, warnings);
  }

  // 2. Per-topic coverage check + floor.
  const seedNum = seed !== undefined ? seed : djb2(JSON.stringify({ subject, topics, totalMarks, tier, yearGroup, paperStyle }));
  const rng = makeRng(seedNum);
  const shuffledPool = shuffleDeterministic(pool, rng);

  const selected: PastPaperQuestion[] = [];
  const selectedIds = new Set<string>();

  for (const topic of topics) {
    const topicPool = shuffledPool.filter(q => questionMatchesTopic(q, topic));
    if (topicPool.length === 0) {
      warnings.push(`No questions match topic "${topic}". The paper will skip this topic.`);
      continue;
    }
    // Locked-in floor question for this topic — pick the one with the
    // most distinct AO/command word against current selection.
    const ranked = topicPool
      .map(q => ({ q, score: diversityScore(q, selected) }))
      .sort((a, b) => b.score - a.score);
    const floor = ranked[0].q;
    if (!selectedIds.has(floor.id)) {
      selected.push(floor);
      selectedIds.add(floor.id);
    }
  }

  // 3. Compute band budgets and current usage from floor questions.
  const budgets = bandBudget(totalMarks, paperStyle);
  const usedByBand: Record<MarkBand, number> = { warmup: 0, core: 0, stretch: 0 };
  for (const q of selected) usedByBand[classifyBand(q.marks ?? 0)] += q.marks ?? 0;

  // 4. Greedy knapsack per band.
  const bandsInOrder: MarkBand[] = ["warmup", "core", "stretch"];
  for (const band of bandsInOrder) {
    const target = budgets[band];
    if (target <= 0) continue;
    // candidates = pool questions whose marks fall in this band, not yet selected
    const candidates = shuffledPool.filter(q => {
      if (selectedIds.has(q.id)) return false;
      const m = q.marks ?? 0;
      if (m <= 0) return false;
      return classifyBand(m) === band;
    });

    // Walk candidates, prefer diversity-best fit at each step.
    let safety = candidates.length + 8; // hard upper bound
    while (usedByBand[band] < target - MARGIN_MARKS && safety-- > 0) {
      // Filter to those that still fit the remaining budget.
      const remaining = target + MARGIN_MARKS - usedByBand[band];
      const fits = candidates.filter(q => {
        if (selectedIds.has(q.id)) return false;
        return (q.marks ?? 0) <= remaining;
      });
      if (fits.length === 0) break;

      // Pick highest-diversity score; ties broken by shuffled order
      // (which is itself deterministic from seed).
      let best = fits[0];
      let bestScore = diversityScore(best, selected);
      for (let i = 1; i < fits.length; i++) {
        const s = diversityScore(fits[i], selected);
        if (s > bestScore) { best = fits[i]; bestScore = s; }
      }
      selected.push(best);
      selectedIds.add(best.id);
      usedByBand[band] += best.marks ?? 0;
    }
  }

  // 5. Pool-too-small warning if final total is significantly below target.
  const finalMarks = selected.reduce((s, q) => s + (q.marks ?? 0), 0);
  if (finalMarks < totalMarks * 0.9) {
    warnings.push(
      `Pool too small to reach the target of ${totalMarks} marks. Returning a partial paper of ${finalMarks} marks. ` +
      `Either lower the target marks or pick more topics.`,
    );
  }

  // 6. Sort selected within bands by marks ascending.
  const bySection: Record<MarkBand, PastPaperQuestion[]> = { warmup: [], core: [], stretch: [] };
  for (const q of selected) bySection[classifyBand(q.marks ?? 0)].push(q);
  for (const band of bandsInOrder) {
    bySection[band].sort((a, b) => (a.marks ?? 0) - (b.marks ?? 0));
  }

  // 7. Build sections.
  const sections: ExamPaperSection[] = [];
  let questionNumber = 1;
  const sectionTitle: Record<MarkBand, string> = {
    warmup: "Section A — Warm-up",
    core: "Section B — Core",
    stretch: "Section C — Stretch",
  };
  for (const band of bandsInOrder) {
    const qs = bySection[band];
    if (qs.length === 0) continue;
    const lines: string[] = [];
    for (const q of qs) {
      lines.push(formatQuestionForWorksheet(q, questionNumber, /*showMarkScheme*/ false, /*showHint*/ false));
      questionNumber++;
    }
    sections.push({
      title: sectionTitle[band],
      type: "exam-questions",
      content: lines.join("\n\n"),
    });
  }

  // Mark-scheme — teacher-only.
  if (includeAnswers) {
    const msLines: string[] = [];
    let n = 1;
    for (const band of bandsInOrder) {
      for (const q of bySection[band]) {
        const ms = q.markScheme || q.answer || "[no mark scheme provided]";
        msLines.push(`Q${n}. (${q.marks ?? 0} marks) ${ms}`);
        n++;
      }
    }
    sections.push({
      title: "Mark Scheme",
      type: "mark-scheme",
      content: msLines.join("\n"),
      teacherOnly: true,
    });
  }

  // 8. Worksheet shape — same as examPaperBuilder.ts.
  const minutes = timingMinutes ?? Math.max(15, Math.round(totalMarks * 1));
  const adaptations: string[] = [];
  if (sendNeed) adaptations.push(`SEND adapt: ${sendNeed}`);
  if (calculator !== undefined) adaptations.push(`Calculator: ${calculator ? "allowed" : "NOT allowed"}`);
  if (tier) adaptations.push(`Tier: ${tier}`);

  const yearGroupStr = yearGroup ? `Year ${yearGroup}` : "";
  const subjectTitleCase = subject
    .split("-")
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
  const topicsLabel = topics.length === 1 ? topics[0] : `${topics.length} topics`;
  const tierSuffix = tier ? ` (${tier})` : "";

  const worksheet: ExamPaperWorksheet = {
    title: `${subjectTitleCase} — Mock Exam Paper${tierSuffix}`,
    subtitle: `${topicsLabel}${yearGroupStr ? ` · ${yearGroupStr}` : ""} · ${finalMarks} marks · ${minutes} minutes`,
    sections,
    metadata: {
      subject,
      topic: topicsLabel,
      yearGroup: yearGroupStr,
      difficulty: tier ?? "",
      examBoard: examBoard ?? "Adaptly",
      totalMarks: finalMarks,
      estimatedTime: `${minutes} minutes`,
      adaptations,
      isExamPaper: true,
      questionsUsed: selected.map(q => ({ id: q.id, board: q.board, year: q.year, paper: q.paper })),
    },
    isAI: false,
    isExamPaper: true,
  };

  return {
    worksheet,
    warnings,
    selectedQuestions: selected,
    bandTotals: { ...usedByBand },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty-result helper
// ─────────────────────────────────────────────────────────────────────────────

function emptyResult(
  params: CreatedExamPaperParams,
  warnings: string[],
): CreatedExamPaperResult {
  const subjectTitleCase = params.subject
    .split("-")
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
  return {
    worksheet: {
      title: `${subjectTitleCase} — Mock Exam Paper (empty)`,
      subtitle: "No matching questions in the bank.",
      sections: [],
      metadata: {
        subject: params.subject,
        topic: params.topics.join(", "),
        yearGroup: params.yearGroup ? `Year ${params.yearGroup}` : "",
        difficulty: params.tier ?? "",
        examBoard: params.examBoard ?? "Adaptly",
        totalMarks: 0,
        estimatedTime: "0 minutes",
        adaptations: [],
        isExamPaper: true,
        questionsUsed: [],
      },
      isAI: false,
      isExamPaper: true,
    },
    warnings,
    selectedQuestions: [],
    bandTotals: { warmup: 0, core: 0, stretch: 0 },
  };
}
