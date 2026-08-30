/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/tests/worksheet-eval/rubric.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Per-axis rubric for the model-judge rater (Sprint 1.D) and the
 * summariser's per-axis block (Sprint 1.C). Single source of truth
 * for axis ids, descriptors, prompts, and weights.
 *
 * The rubric is intentionally a pure data export — no helpers, no
 * computation. Consumers (the rater, the axis-floor rule, the
 * summariser) import `RUBRIC_AXES` and key by `axis.id`.
 *
 * Five axes covering the dimensions a teacher cares about:
 *
 *   1. curriculum-fidelity     — does every section anchor to a real
 *                                spec point on the named board's
 *                                published taxonomy?
 *   2. command-word-discipline — does the worksheet use board-correct
 *                                command words ("describe", "explain",
 *                                "evaluate", …) at the level the year
 *                                group expects?
 *   3. scaffolding             — does cognitive load ramp from low- to
 *                                high-stakes within the worksheet, or
 *                                does it dump the hardest question
 *                                first?
 *   4. send-register           — when sendNeed is set, does the
 *                                wording, sentence length, and visual
 *                                support match the SEND profile?
 *   5. examiner-voice          — does the prose read like a board
 *                                mark-scheme — terse, precise, no
 *                                hedging, no "you might want to" — or
 *                                like a generic AI assistant?
 *
 * Bands run 1 (unacceptable) → 5 (exemplary). Each axis has all five
 * bands defined; partial-band coverage is a CI failure.
 *
 * Weights sum to 1.0 across all axes. The summariser computes the
 * weighted-average axis score per fixture; the axis-floor rule
 * (Sprint 1.C) enforces per-axis minimums independently of the
 * weighted average.
 *
 * Axis ids are STABLE — changing one is a breaking change for the
 * report contract. New axes are added by appending to RUBRIC_AXES;
 * existing weights must be re-balanced in the same change so the
 * sum stays 1.0.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Five-band descriptor scale. Level 1 = unacceptable, 5 = exemplary. */
export type RubricLevel = 1 | 2 | 3 | 4 | 5;

/** One band on one axis. */
export interface RubricBand {
  /** 1..5, where 1 is unacceptable and 5 is exemplary. */
  level: RubricLevel;
  /** Human-readable descriptor — what does this level look like? */
  descriptor: string;
}

/** One axis in the rubric. Five bands, one model-judge prompt, one weight. */
export interface RubricAxis {
  /** Stable id used as the report column header. Kebab-case. */
  id: string;
  /** Human-readable name for the summariser table. */
  name: string;
  /** Question the model-judge rater asks — must elicit a 1..5 integer. */
  prompt: string;
  /** Five bands, one per level. Indexed by level (1..5), MUST be ordered. */
  bands: RubricBand[];
  /** Contribution to the weighted-average axis score. Sum across the
   *  registry MUST equal 1.0 (test enforced). */
  weight: number;
}

// ─── Axis definitions ────────────────────────────────────────────────────────

const curriculumFidelity: RubricAxis = {
  id: "curriculum-fidelity",
  name: "Curriculum fidelity",
  prompt:
    "On a 1–5 scale, how well does every question on this worksheet anchor " +
    "to a real, named spec point on the stated exam board's published " +
    "taxonomy? 1 = no spec anchors or invented codes throughout. 3 = roughly " +
    "half the questions cite a real, correct spec point. 5 = every question " +
    "cites a verifiable spec point at the right depth for the year group. " +
    "Reply with the integer only.",
  bands: [
    {
      level: 1,
      descriptor:
        "No spec references stamped, or every reference is invented / off-board.",
    },
    {
      level: 2,
      descriptor:
        "A minority of questions cite real spec points; the rest are vague or invented.",
    },
    {
      level: 3,
      descriptor:
        "Roughly half cite real spec points at the right level; the rest are loose.",
    },
    {
      level: 4,
      descriptor:
        "Most questions cite real spec points; one or two are loose or under-specified.",
    },
    {
      level: 5,
      descriptor:
        "Every question cites a verifiable spec point at the depth the year group expects.",
    },
  ],
  weight: 0.25,
};

const commandWordDiscipline: RubricAxis = {
  id: "command-word-discipline",
  name: "Command-word discipline",
  prompt:
    "On a 1–5 scale, does this worksheet use board-correct command words " +
    "(describe, explain, evaluate, justify, calculate, …) at the level the " +
    "year group expects? 1 = command words are absent or wildly mis-pitched. " +
    "3 = mostly correct but one or two pitched too low/high. 5 = every " +
    "command word is board-correct and pitched precisely. Reply with the " +
    "integer only.",
  bands: [
    {
      level: 1,
      descriptor:
        "Command words absent, or generic ('answer the question') throughout.",
    },
    {
      level: 2,
      descriptor:
        "Some command words present but most are mis-pitched for the year group.",
    },
    {
      level: 3,
      descriptor:
        "Mostly correct; one or two questions pitched a year too low or too high.",
    },
    {
      level: 4,
      descriptor:
        "Board-correct throughout; minor inconsistencies in mark-economy.",
    },
    {
      level: 5,
      descriptor:
        "Every command word is board-correct and matched to its mark-economy.",
    },
  ],
  weight: 0.2,
};

const scaffolding: RubricAxis = {
  id: "scaffolding",
  name: "Scaffolding",
  prompt:
    "On a 1–5 scale, does this worksheet ramp cognitive load appropriately " +
    "— starter / low-stakes recall, then guided practice, then independent " +
    "application — or does it front-load the hardest question? 1 = no ramp, " +
    "or hardest first. 3 = some ramp but uneven. 5 = clean low → high ramp " +
    "with explicit stepping stones. Reply with the integer only.",
  bands: [
    {
      level: 1,
      descriptor:
        "No ramp, or hardest item appears first with no preceding scaffold.",
    },
    {
      level: 2,
      descriptor:
        "Some ramp but with abrupt jumps; missing intermediate steps.",
    },
    {
      level: 3,
      descriptor:
        "Recognisable ramp; one or two steps are uneven or under-scaffolded.",
    },
    {
      level: 4,
      descriptor:
        "Clear low → high ramp with mostly well-judged stepping stones.",
    },
    {
      level: 5,
      descriptor:
        "Clean low → high ramp; explicit stepping stones; checkpoints between phases.",
    },
  ],
  weight: 0.2,
};

const sendRegister: RubricAxis = {
  id: "send-register",
  name: "SEND register",
  prompt:
    "If sendNeed is set on this fixture, on a 1–5 scale how well does the " +
    "wording, sentence length, and visual support match that SEND profile? " +
    "1 = ignores the profile entirely. 3 = generic SEND adjustments " +
    "(shorter sentences) but no profile-specific moves. 5 = every page " +
    "shows profile-specific adjustments (visual schedule for ASD, low-load " +
    "starter for SEMH, decoded vocab for dyslexia, …). If sendNeed is " +
    "unset, reply 5. Reply with the integer only.",
  bands: [
    {
      level: 1,
      descriptor:
        "sendNeed is set but the worksheet ignores it — generic prose, no adjustments.",
    },
    {
      level: 2,
      descriptor:
        "Some shortening / simplification but no profile-specific moves.",
    },
    {
      level: 3,
      descriptor:
        "Generic SEND adjustments present (e.g. shorter sentences) but not profile-specific.",
    },
    {
      level: 4,
      descriptor:
        "Profile-specific adjustments visible on most pages; one or two gaps.",
    },
    {
      level: 5,
      descriptor:
        "Every page shows profile-specific adjustments aligned to the named SEND need.",
    },
  ],
  weight: 0.2,
};

const examinerVoice: RubricAxis = {
  id: "examiner-voice",
  name: "Examiner voice",
  prompt:
    "On a 1–5 scale, does the prose read like a board mark-scheme — terse, " +
    "precise, no hedging, no 'you might want to' — or like a generic AI " +
    "assistant? 1 = chatty, hedging, AI-flavoured throughout. 3 = mixed; " +
    "some questions are crisp, others ramble. 5 = mark-scheme-tight " +
    "throughout with no AI tells. Reply with the integer only.",
  bands: [
    {
      level: 1,
      descriptor:
        "Chatty, hedging, AI assistant tone throughout ('you might want to', 'feel free to').",
    },
    {
      level: 2,
      descriptor:
        "Mostly chatty with occasional crisp phrasing; obvious AI tells in stem language.",
    },
    {
      level: 3,
      descriptor:
        "Mixed register; some questions are mark-scheme-crisp, others ramble.",
    },
    {
      level: 4,
      descriptor:
        "Mostly crisp examiner voice; one or two stems still hedge or over-explain.",
    },
    {
      level: 5,
      descriptor:
        "Terse, precise, mark-scheme-tight throughout; no AI tells.",
    },
  ],
  weight: 0.15,
};

// ─── Registry ────────────────────────────────────────────────────────────────

/**
 * The five-axis rubric. Order is canonical — the summariser renders
 * columns in this order, and the rater's report keys preserve it.
 */
export const RUBRIC_AXES: readonly RubricAxis[] = [
  curriculumFidelity,
  commandWordDiscipline,
  scaffolding,
  sendRegister,
  examinerVoice,
] as const;

/** All axis ids in registry order. Convenient for iteration / table headers. */
export const RUBRIC_AXIS_IDS: readonly string[] = RUBRIC_AXES.map((a) => a.id);

/** Quick lookup by id. Throws if id is unknown — callers should
 *  validate against `RUBRIC_AXIS_IDS` first when accepting external
 *  input. */
export function getRubricAxis(id: string): RubricAxis {
  const found = RUBRIC_AXES.find((a) => a.id === id);
  if (!found) {
    throw new Error(`Unknown rubric axis id: ${id}`);
  }
  return found;
}

/**
 * Compute the weighted-average score across axes from a per-axis
 * score map. Missing axes contribute 0 (their weight is "wasted").
 * Returns 0 if no scores given. Caller's responsibility to decide
 * whether a partial map is meaningful.
 */
export function weightedAxisAverage(
  scores: Record<string, number>,
): number {
  let acc = 0;
  for (const axis of RUBRIC_AXES) {
    const s = scores[axis.id];
    if (typeof s === "number") {
      acc += s * axis.weight;
    }
  }
  return acc;
}
