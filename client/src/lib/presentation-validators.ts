/**
 * presentation-validators.ts — pure post-generation checks
 *
 * Runs over a generated deck and surfaces "this slide is incomplete" warnings
 * without touching the deck. The PresentationMaker page wires these in to
 * paint a small badge next to each problem slide and offer a one-click
 * "Fix this slide" action that re-routes through the slide-level refine flow.
 *
 * Items addressed:
 *  - 22: coverage check — every learning objective should appear in at least
 *    one slide's content.
 *  - 24: mandatory `differentiation` on activity-class slides.
 *  - 26: reading-age verifier — flag slides whose Flesch-Kincaid grade level
 *    exceeds the teacher-set target.
 */

export interface SlideForValidation {
  type: string;
  title?: string;
  body?: string;
  question?: string;
  bullets?: string[];
  speakerNotes?: string;
  successCriteria?: { must: string; should: string; could: string };
  workedExampleBox?: { problem: string; steps: string[]; answer: string };
  examQuestion?: { stem: string };
  differentiation?: { support?: string; core?: string; extension?: string };
  vocabTable?: { term: string; definition: string }[];
  terms?: { term: string; definition: string }[];
  retrievalQuestions?: string[];
  realWorldContext?: string;
  examTip?: string;
  markSchemeHint?: string;
  hintLadder?: string[];
  liveModel?: { iDo: string; weDo: string; youDo: string };
  homeworkBrief?: string;
}

export interface ValidationFinding {
  index: number;
  kind: "missing-differentiation" | "uncovered-objective" | "reading-age-too-high";
  severity: "info" | "warn" | "error";
  message: string;
  suggestion?: string;
}

// ─── 24: differentiation validator ──────────────────────────────────────
// Activity-class slide types are the ones that genuinely benefit from a
// support/core/extension split. We don't require differentiation on
// title / objectives / vocab-reference / break / etc.
const ACTIVITY_CLASS = new Set([
  "activity", "pause-and-solve", "think-pair-share", "exam-practice",
  "choose-your-task", "mini-quiz", "check-understanding", "do-now",
]);

export function findMissingDifferentiation(slides: SlideForValidation[]): ValidationFinding[] {
  const out: ValidationFinding[] = [];
  slides.forEach((s, i) => {
    if (!ACTIVITY_CLASS.has(s.type)) return;
    const d = s.differentiation;
    if (!d || (!d.support && !d.core && !d.extension)) {
      out.push({
        index: i,
        kind: "missing-differentiation",
        severity: "warn",
        message: `Slide ${i + 1} (${s.type}) is an activity but has no differentiation.`,
        suggestion: "Add support / core / extension cards via Refine.",
      });
    }
  });
  return out;
}

// ─── 22: coverage check ─────────────────────────────────────────────────
// Splits the teacher-supplied objectives string by newlines/semicolons and
// confirms that each objective's keyword set appears somewhere in the deck.
export function findUncoveredObjectives(
  slides: SlideForValidation[],
  objectivesString: string,
): ValidationFinding[] {
  if (!objectivesString || !objectivesString.trim()) return [];
  const objectives = objectivesString
    .split(/[\n;]/)
    .map(s => s.replace(/^[-•*\d\.\s]+/, "").trim())
    .filter(Boolean);
  if (objectives.length === 0) return [];

  // Build a haystack of every text-bearing field across the deck, lower-cased.
  const haystack = slides.map(s => [
    s.title, s.body, s.question, ...(s.bullets || []),
    s.speakerNotes,
    s.workedExampleBox?.problem, s.workedExampleBox?.answer,
    s.examQuestion?.stem,
    s.successCriteria?.must, s.successCriteria?.should, s.successCriteria?.could,
    s.realWorldContext, s.examTip, s.markSchemeHint,
    ...(s.vocabTable || []).map(v => `${v.term} ${v.definition}`),
    ...(s.terms || []).map(v => `${v.term} ${v.definition}`),
    ...(s.retrievalQuestions || []),
    ...(s.hintLadder || []),
    s.liveModel?.iDo, s.liveModel?.weDo, s.liveModel?.youDo,
    s.homeworkBrief,
  ].filter(Boolean).join(" ").toLowerCase()).join("\n");

  return objectives.flatMap((obj, oi): ValidationFinding[] => {
    const keywords = obj
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 3 && !["that","with","from","this","these","those","will","when","what","which","into","about","they","also","have","more"].includes(w));
    if (keywords.length === 0) return [];
    // Coverage = at least 50% of meaningful keywords appear in the deck.
    const hits = keywords.filter(k => haystack.includes(k)).length;
    if (hits / keywords.length < 0.5) {
      return [{
        index: -1,
        kind: "uncovered-objective" as const,
        severity: "warn" as const,
        message: `Objective ${oi + 1} ("${obj}") may be under-covered: ${hits}/${keywords.length} key words found.`,
        suggestion: "Add a content/worked-example slide that names this objective directly.",
      }];
    }
    return [];
  });
}

// ─── 26: Flesch-Kincaid grade-level reading-age verifier ────────────────
function syllableCount(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}
function fleschKincaidGradeLevel(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const syllables = words.reduce((sum, w) => sum + syllableCount(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59;
}
/** Convert FK grade level to a UK reading age (years). FK + 5 ≈ UK age. */
function fkToReadingAge(grade: number): number {
  return Math.max(5, Math.round(grade + 5));
}

export function findHighReadingAgeSlides(
  slides: SlideForValidation[],
  targetReadingAge: number,
  tolerance = 1,
): ValidationFinding[] {
  const out: ValidationFinding[] = [];
  slides.forEach((s, i) => {
    const text = [s.body, s.question, ...(s.bullets || [])].filter(Boolean).join(" ");
    if (!text || text.length < 30) return;
    const grade = fleschKincaidGradeLevel(text);
    const age = fkToReadingAge(grade);
    if (age > targetReadingAge + tolerance) {
      out.push({
        index: i,
        kind: "reading-age-too-high",
        severity: "warn",
        message: `Slide ${i + 1} reads at age ~${age} (target: ${targetReadingAge}).`,
        suggestion: "Shorten sentences and replace technical words with plain-English equivalents.",
      });
    }
  });
  return out;
}

// Convenience aggregator
export function runAllValidators(opts: {
  slides: SlideForValidation[];
  objectives?: string;
  readingAge?: number;
}): ValidationFinding[] {
  const { slides, objectives = "", readingAge } = opts;
  return [
    ...findMissingDifferentiation(slides),
    ...findUncoveredObjectives(slides, objectives),
    ...(readingAge ? findHighReadingAgeSlides(slides, readingAge) : []),
  ];
}
