/**
 * report-comments-enhancements.ts — Improvements layered onto Report Comments.
 *
 *  1. Tone calibration to school's house-style (learn from exemplars)
 *  2. Strength + next-step paired structure (validator)
 *  3. Gendered-language detection (extends FEAT-006 cliché lint)
 *  4. Pupil-evidence quotes (one specific work-sample per pupil)
 *  5. Bulk season mode using Batch Runner (FEAT-005) — overnight 200-pupil run
 */

const STYLE_KEY = "adaptly_report_house_style_v1";

// ── 1. Tone calibration ─────────────────────────────────────────────────────

export interface HouseStyle {
  exemplarCount: number;
  avgSentenceLength: number;
  avgParagraphSentences: number;
  formality: "formal" | "warm" | "balanced";
  pupilNamingConvention: "first" | "first-last" | "title-last";
  commonOpeners: string[];
  commonClosers: string[];
}

export function fitHouseStyle(exemplars: string[]): HouseStyle {
  if (exemplars.length === 0) {
    return {
      exemplarCount: 0,
      avgSentenceLength: 18,
      avgParagraphSentences: 4,
      formality: "balanced",
      pupilNamingConvention: "first",
      commonOpeners: [],
      commonClosers: [],
    };
  }
  const allSentences = exemplars.flatMap((e) => e.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean));
  const allParagraphs = exemplars.flatMap((e) => e.split(/\n{2,}/).filter(Boolean));
  const avgSentenceLength = allSentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0) / Math.max(1, allSentences.length);
  const avgParagraphSentences = allParagraphs.reduce((acc, p) => acc + p.split(/[.!?]+/).filter(Boolean).length, 0) / Math.max(1, allParagraphs.length);

  const formality: HouseStyle["formality"] =
    /\b(?:has\s+demonstrated|continues\s+to|achievement|attainment)\b/i.test(exemplars.join(" "))
      ? "formal"
      : /\bgreat\b|\bsuper\b|\b!\b/i.test(exemplars.join(" "))
        ? "warm"
        : "balanced";

  const naming: HouseStyle["pupilNamingConvention"] =
    /\b(?:Mr|Mrs|Ms|Miss)\s+[A-Z][a-z]+/.test(exemplars.join(" ")) ? "title-last"
    : /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(exemplars.join(" ")) ? "first-last"
    : "first";

  const openers = allSentences.slice(0, 50).map((s) => s.split(/\s+/).slice(0, 3).join(" "));
  const closers = allSentences.slice(-30).map((s) => s.split(/\s+/).slice(-3).join(" "));

  const style: HouseStyle = {
    exemplarCount: exemplars.length,
    avgSentenceLength: +avgSentenceLength.toFixed(1),
    avgParagraphSentences: +avgParagraphSentences.toFixed(1),
    formality,
    pupilNamingConvention: naming,
    commonOpeners: dedupeTopK(openers, 5),
    commonClosers: dedupeTopK(closers, 5),
  };
  try { localStorage.setItem(STYLE_KEY, JSON.stringify(style)); } catch {}
  return style;
}

export function loadHouseStyle(): HouseStyle | null {
  try { const raw = localStorage.getItem(STYLE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function dedupeTopK(items: string[], k: number): string[] {
  const counts = new Map<string, number>();
  for (const i of items) counts.set(i, (counts.get(i) || 0) + 1);
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, k).map(([s]) => s);
}

// ── 2. Strength + next-step structure validator ─────────────────────────────

export interface StructureFinding {
  problem: "missing-strength" | "missing-next-step" | "no-pairing";
  message: string;
}

const STRENGTH_CUES   = [/\b(?:strength|excels?|achievement|positive|capable|enthusiastic|impressive)\b/i, /\b(?:has\s+made\s+(?:strong|excellent|good)\s+progress)\b/i];
const NEXT_STEP_CUES  = [/\bnext\s+step|to\s+(?:improve|develop)|focus\s+on\b/i, /\bwhen\s+\w+\s+returns/i, /\b(?:could|should|will|might)\b\s+\w+/i];

export function validateStructure(text: string): StructureFinding[] {
  const out: StructureFinding[] = [];
  const hasStrength = STRENGTH_CUES.some((rx) => rx.test(text));
  const hasNextStep = NEXT_STEP_CUES.some((rx) => rx.test(text));
  if (!hasStrength) out.push({ problem: "missing-strength", message: "No clear strength statement — add a specific praise." });
  if (!hasNextStep) out.push({ problem: "missing-next-step", message: 'No clear next step — add "to develop further…" or similar.' });
  if (hasStrength && hasNextStep && !/\.\s*(?:to|next|focus|improve)/i.test(text) && !/however|but/i.test(text)) {
    out.push({ problem: "no-pairing", message: "Strength and next-step aren't paired — make the link explicit." });
  }
  return out;
}

// ── 3. Gendered-language detection ──────────────────────────────────────────

export interface GenderedFinding {
  excerpt: string;
  suggestion: string;
}

const GENDERED_PATTERNS: Array<{ rx: RegExp; replace: (excerpt: string) => string }> = [
  { rx: /\bhe\s+is\s+lively\b/i,             replace: () => "shows energy and engagement" },
  { rx: /\bshe\s+is\s+quiet\b/i,             replace: () => "is reflective and thoughtful" },
  { rx: /\bbubbly\b/i,                       replace: () => "engaged and energetic" },
  { rx: /\bwell-behaved\b/i,                 replace: () => "self-regulated and on-task" },
  { rx: /\bmotherly\b/i,                     replace: () => "considerate and caring" },
  { rx: /\baggressive\b/i,                   replace: () => "assertive (with examples)" },
  { rx: /\bemotional\b/i,                    replace: () => "responsive (specify situation)" },
];

export function detectGendered(text: string): GenderedFinding[] {
  const out: GenderedFinding[] = [];
  for (const { rx, replace } of GENDERED_PATTERNS) {
    const m = text.match(rx);
    if (m) out.push({ excerpt: m[0], suggestion: replace(m[0]) });
  }
  return out;
}

// ── 4. Pupil-evidence quotes ────────────────────────────────────────────────

export interface PupilWorkSample {
  pupilId: string;
  topic: string;
  excerpt: string;
}

export function pickEvidenceQuote(samples: PupilWorkSample[], pupilId: string): PupilWorkSample | null {
  const mine = samples.filter((s) => s.pupilId === pupilId && s.excerpt.length > 20);
  if (mine.length === 0) return null;
  // Pick the longest, most-substantive sample.
  mine.sort((a, b) => b.excerpt.length - a.excerpt.length);
  return mine[0];
}

export function injectEvidenceQuote(comment: string, sample: PupilWorkSample): string {
  // Append a single specific reference if not already present.
  if (comment.toLowerCase().includes(sample.topic.toLowerCase().slice(0, 20))) return comment;
  const trimmed = sample.excerpt.length > 80 ? sample.excerpt.slice(0, 77) + "…" : sample.excerpt;
  return `${comment.replace(/\s+$/, "")} In ${sample.topic}, "${trimmed}"`;
}

// ── 5. Bulk season mode ─────────────────────────────────────────────────────

export interface BatchJob {
  pupilId: string;
  pupilName: string;
  subject?: string;
  contextSnippet: string;
}

export interface BatchPlan {
  estimatedMinutes: number;
  jobsCount: number;
  reviewQueueOnly: boolean;
}

export function planBatch(jobs: BatchJob[], opts: { secondsPerJob?: number; reviewOnlyFailing?: boolean } = {}): BatchPlan {
  const sec = opts.secondsPerJob ?? 4;
  return {
    estimatedMinutes: Math.ceil((jobs.length * sec) / 60),
    jobsCount: jobs.length,
    reviewQueueOnly: !!opts.reviewOnlyFailing,
  };
}

export interface BatchOutcome {
  pupilId: string;
  comment: string;
  validation: StructureFinding[];
  gendered: GenderedFinding[];
  needsReview: boolean;
}

/** Run the comment generator over a batch — returns both successes and the review queue. */
export function runBatchClient(
  jobs: BatchJob[],
  generate: (job: BatchJob) => string,
): BatchOutcome[] {
  return jobs.map((job) => {
    const comment = generate(job);
    const validation = validateStructure(comment);
    const gendered = detectGendered(comment);
    return {
      pupilId: job.pupilId,
      comment,
      validation,
      gendered,
      needsReview: validation.length > 0 || gendered.length > 0,
    };
  });
}
