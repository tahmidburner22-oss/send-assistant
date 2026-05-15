/**
 * UK National Curriculum Misconception Bank
 * ─────────────────────────────────────────
 * Curated list of common pupil misconceptions, organised by subject + topic
 * keyword + key stage. Each entry pairs a specific misbelief with the correct
 * understanding so the AI can:
 *
 *   1. design distractors that match REAL student errors (not random plausible-sounding ones)
 *   2. explicitly target the misconception in worked examples, common-mistakes boxes,
 *      and error-correction questions
 *   3. surface "misconceptionsTargeted" in metadata so the marking pass can map a
 *      pupil's wrong answer back to the underlying misbelief (closes the loop with
 *      FEAT-001 scan-and-mark)
 *
 * Sources: BBC Bitesize teacher pages, NCETM "common misconceptions", NRICH,
 * Oak National guidance, AQA/OCR/Edexcel examiner reports, "Closing the Vocabulary
 * Gap" (Quigley) — paraphrased, no verbatim copying.
 *
 * The bank is curated, not exhaustive. Add entries as you see new errors in the wild.
 *
 * IP NOTE: this file is the moat that competitors structurally cannot replicate
 * with raw LLMs. Keep it under version control as a curated dataset.
 */

export type KeyStage = "ks1" | "ks2" | "ks3" | "ks4" | "ks5";

export interface Misconception {
  /** Stable slug — used for telemetry + closed-loop linking. e.g. `m-decimal-longer-bigger` */
  id: string;
  /** Subject family — matches `subjects[].id` in send-data.ts (loosely) */
  subject: string;
  /** Year-group keystage where this misconception is most common */
  keyStages: KeyStage[];
  /** Topic keywords — case-insensitive substring match against worksheet topic */
  topicKeywords: string[];
  /** What the pupil incorrectly believes (1 sentence) */
  misbelief: string;
  /** The actual correct understanding (1 sentence) */
  correct: string;
  /** Optional concrete diagnostic example — used as a distractor seed */
  diagnosticExample?: string;
  /** Optional: brief teacher correction strategy */
  teacherStrategy?: string;
}

export const MISCONCEPTION_BANK: Misconception[] = [
  // ─────────────── MATHS — Number ───────────────
  {
    id: "m-decimal-longer-bigger",
    subject: "Maths",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["decimal", "place value", "ordering", "compare"],
    misbelief: "A decimal with more digits is always larger.",
    correct: "Place value determines size — 0.7 is larger than 0.65 because 7 tenths > 6 tenths.",
    diagnosticExample: "Which is larger: 0.7 or 0.65?",
    teacherStrategy: "Stack decimals vertically aligned by the decimal point; compare from the left.",
  },
  {
    id: "m-fraction-bigger-denom-bigger",
    subject: "Maths",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["fraction", "compare", "equivalent", "ordering"],
    misbelief: "A fraction with a larger denominator is always larger.",
    correct: "A larger denominator means more, smaller pieces — so 1/8 < 1/4.",
    diagnosticExample: "Which is larger: 1/4 or 1/8?",
    teacherStrategy: "Use a fraction wall or pizza diagram before symbolic comparison.",
  },
  {
    id: "m-multiply-makes-bigger",
    subject: "Maths",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["multiply", "decimal", "fraction"],
    misbelief: "Multiplying always makes a number bigger.",
    correct: "Multiplying by a value between 0 and 1 makes a number smaller (e.g. 6 × 0.5 = 3).",
    diagnosticExample: "Calculate 6 × 0.5 — pupils often answer 12 or 60.",
  },
  {
    id: "m-divide-smaller-by-bigger",
    subject: "Maths",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["divide", "division"],
    misbelief: "You cannot divide a smaller number by a larger one.",
    correct: "Division of a smaller number by a larger gives a fraction or decimal less than 1 (e.g. 3 ÷ 6 = 0.5).",
  },
  {
    id: "m-negative-add",
    subject: "Maths",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["negative", "directed number", "add", "subtract"],
    misbelief: "Two negatives always make a positive.",
    correct: "True only for multiplication and division. For addition: -3 + -4 = -7 (still negative).",
    diagnosticExample: "Calculate -3 + -4.",
  },
  {
    id: "m-percent-of-percent",
    subject: "Maths",
    keyStages: ["ks3", "ks4"],
    topicKeywords: ["percentage", "percent", "increase", "decrease"],
    misbelief: "A 20% increase followed by a 20% decrease returns the original value.",
    correct: "Percentages are multiplicative — 1.2 × 0.8 = 0.96, so 4% lower than original.",
  },

  // ─────────────── MATHS — Algebra ───────────────
  {
    id: "m-algebra-letters-as-objects",
    subject: "Maths",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["algebra", "expression", "simplify", "letter"],
    misbelief: "In algebra, 3a means '3 apples' (the letter is an object).",
    correct: "Letters are variables representing unknown numbers — 3a means 3 × a.",
  },
  {
    id: "m-algebra-equals-do",
    subject: "Maths",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["algebra", "equation", "solve", "equals"],
    misbelief: "The equals sign means 'work it out' or 'the answer is'.",
    correct: "The equals sign means 'is the same as' — both sides are balanced.",
    teacherStrategy: "Use a balance scale visual when introducing equation solving.",
  },
  {
    id: "m-square-of-sum",
    subject: "Maths",
    keyStages: ["ks3", "ks4"],
    topicKeywords: ["expand", "square", "bracket", "quadratic"],
    misbelief: "(a + b)² = a² + b²",
    correct: "(a + b)² = a² + 2ab + b² — the cross terms must be included.",
    diagnosticExample: "Expand (x + 3)² — pupils often write x² + 9.",
  },

  // ─────────────── MATHS — Geometry / Stats ───────────────
  {
    id: "m-area-perimeter-mix",
    subject: "Maths",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["area", "perimeter"],
    misbelief: "Area and perimeter are interchangeable / a shape with the bigger perimeter has the bigger area.",
    correct: "Perimeter is the boundary length (1D); area is the surface (2D). Two shapes can share a perimeter but have different areas.",
  },
  {
    id: "m-prob-50-50",
    subject: "Maths",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["probability", "chance", "likely"],
    misbelief: "If something has two outcomes, each has probability 1/2.",
    correct: "Probability depends on equally likely outcomes — winning the lottery has 2 outcomes (yes/no) but isn't 1/2.",
  },
  {
    id: "m-mean-vs-median",
    subject: "Maths",
    keyStages: ["ks3", "ks4"],
    topicKeywords: ["mean", "median", "average", "outlier"],
    misbelief: "The mean is always the best average to use.",
    correct: "The mean is distorted by outliers — the median is more representative for skewed data.",
  },

  // ─────────────── SCIENCE — Physics ───────────────
  {
    id: "s-weight-mass",
    subject: "Science",
    keyStages: ["ks3", "ks4"],
    topicKeywords: ["weight", "mass", "gravity", "force"],
    misbelief: "Weight and mass mean the same thing.",
    correct: "Mass is the amount of matter (kg, scalar). Weight is a force due to gravity (N, vector). W = mg.",
    diagnosticExample: "An astronaut on the Moon: does mass change? Does weight change?",
  },
  {
    id: "s-no-friction-no-force",
    subject: "Science",
    keyStages: ["ks3", "ks4"],
    topicKeywords: ["force", "newton", "motion", "friction"],
    misbelief: "Moving objects always need a constant force to keep them moving.",
    correct: "Newton's first law — without resultant force, objects continue at constant velocity. Friction usually causes the deceleration we see.",
  },
  {
    id: "s-current-used-up",
    subject: "Science",
    keyStages: ["ks3", "ks4"],
    topicKeywords: ["current", "circuit", "series", "parallel", "electric"],
    misbelief: "Current is 'used up' as it flows through components.",
    correct: "Current is the same at every point in a series circuit — energy is transferred, not current.",
  },
  {
    id: "s-bigger-magnet-bigger-force",
    subject: "Science",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["magnet", "magnetic", "field"],
    misbelief: "A bigger magnet always exerts a stronger force.",
    correct: "Force depends on field strength × distance — a small neodymium magnet beats a big iron one.",
  },
  {
    id: "s-heat-cold",
    subject: "Science",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["heat", "energy", "temperature", "cold"],
    misbelief: "Cold flows from cold objects to warm objects.",
    correct: "Energy flows from hot to cold — 'cold' is the absence of thermal energy, not a substance.",
  },

  // ─────────────── SCIENCE — Chemistry ───────────────
  {
    id: "c-atom-vs-molecule",
    subject: "Science",
    keyStages: ["ks3", "ks4"],
    topicKeywords: ["atom", "molecule", "element", "compound"],
    misbelief: "Atoms and molecules are the same thing.",
    correct: "An atom is a single unit; a molecule is two or more atoms bonded together (e.g. O₂ is a molecule of two oxygen atoms).",
  },
  {
    id: "c-conservation-mass-burning",
    subject: "Science",
    keyStages: ["ks3", "ks4"],
    topicKeywords: ["combustion", "burning", "mass", "conservation"],
    misbelief: "When something burns, mass is lost.",
    correct: "Mass is conserved — the gases (CO₂, H₂O vapour) escape but the total mass of all products = mass of all reactants.",
  },
  {
    id: "c-acid-strong-vs-concentrated",
    subject: "Science",
    keyStages: ["ks4"],
    topicKeywords: ["acid", "ph", "concentration", "strong"],
    misbelief: "Strong acids and concentrated acids are the same thing.",
    correct: "Strong = fully dissociates in water (ionisation). Concentrated = high amount per volume. A dilute strong acid (HCl) and concentrated weak acid (ethanoic) are different.",
  },

  // ─────────────── SCIENCE — Biology ───────────────
  {
    id: "b-plants-eat-soil",
    subject: "Science",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["plant", "photosynthesis", "growth", "soil"],
    misbelief: "Plants get their food from the soil.",
    correct: "Plants make glucose by photosynthesis using CO₂ and water; soil supplies minerals (e.g. nitrates), not 'food'.",
  },
  {
    id: "b-evolution-individual",
    subject: "Science",
    keyStages: ["ks3", "ks4"],
    topicKeywords: ["evolution", "natural selection", "adaptation", "darwin"],
    misbelief: "Individual organisms evolve during their lifetime.",
    correct: "Populations evolve across generations — selection acts on inherited variation, not on lifetime adaptations.",
  },
  {
    id: "b-deoxygenated-blue",
    subject: "Science",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["blood", "circulation", "vein", "artery"],
    misbelief: "Deoxygenated blood is blue.",
    correct: "Deoxygenated blood is dark red. Veins look blue through skin because of how light scatters.",
  },

  // ─────────────── ENGLISH ───────────────
  {
    id: "e-similes-metaphors",
    subject: "English",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["simile", "metaphor", "figurative", "language"],
    misbelief: "A simile and a metaphor mean the same thing.",
    correct: "A simile uses 'like' or 'as' (her smile was like sunshine). A metaphor states it directly (her smile was sunshine).",
  },
  {
    id: "e-its-vs-its",
    subject: "English",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["punctuation", "apostrophe", "spag"],
    misbelief: "It's always needs an apostrophe to show possession.",
    correct: "It's = it is / it has. Its (no apostrophe) = belonging to it. Possessive pronouns never take an apostrophe.",
  },
  {
    id: "e-author-narrator",
    subject: "English",
    keyStages: ["ks3", "ks4"],
    topicKeywords: ["narrator", "author", "perspective", "voice"],
    misbelief: "The narrator and the author are the same person.",
    correct: "The narrator is a constructed voice — the author chooses it. An unreliable narrator may not represent the author's view.",
  },

  // ─────────────── HISTORY ───────────────
  {
    id: "h-source-bias-fact",
    subject: "History",
    keyStages: ["ks3", "ks4"],
    topicKeywords: ["source", "evidence", "bias", "primary"],
    misbelief: "A primary source is more reliable than a secondary source.",
    correct: "Both can be biased — a primary source is closer in time but may be more partial. Reliability depends on author, audience, and purpose.",
  },
  {
    id: "h-causation-single",
    subject: "History",
    keyStages: ["ks3", "ks4"],
    topicKeywords: ["cause", "reason", "why"],
    misbelief: "Historical events have a single cause.",
    correct: "Events have multiple, interacting causes (long-term, short-term, triggers) — historians weigh their relative importance.",
  },

  // ─────────────── GEOGRAPHY ───────────────
  {
    id: "g-weather-climate",
    subject: "Geography",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["weather", "climate", "temperature"],
    misbelief: "Weather and climate are the same.",
    correct: "Weather is short-term atmospheric state (today). Climate is the long-term average pattern (over 30+ years).",
  },
  {
    id: "g-ocean-current-tide",
    subject: "Geography",
    keyStages: ["ks2", "ks3"],
    topicKeywords: ["tide", "current", "ocean", "coast"],
    misbelief: "Tides and currents are the same thing.",
    correct: "Tides are the rise and fall of sea level (caused by Moon's gravity). Currents are the horizontal flow of water (driven by wind, density, temperature).",
  },

  // ─────────────── COMPUTING ───────────────
  {
    id: "co-bigO-machine",
    subject: "Computing",
    keyStages: ["ks4", "ks5"],
    topicKeywords: ["big o", "complexity", "algorithm", "efficiency"],
    misbelief: "A faster computer makes Big-O complexity better.",
    correct: "Big-O measures growth rate, independent of hardware — O(n²) vs O(n log n) matters whatever the CPU.",
  },
  {
    id: "co-binary-leading-zero",
    subject: "Computing",
    keyStages: ["ks3", "ks4"],
    topicKeywords: ["binary", "denary", "conversion", "bit"],
    misbelief: "Leading zeroes change a binary number's value.",
    correct: "0001 = 0001 = 1. Leading zeroes are place-holders to show byte length, not value.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Lookup helpers
// ─────────────────────────────────────────────────────────────────────────────

function ksFromYear(yearGroup: string | undefined | null): KeyStage | null {
  if (!yearGroup) return null;
  const n = parseInt(String(yearGroup).replace(/\D/g, ""), 10);
  if (isNaN(n)) return null;
  if (n <= 2) return "ks1";
  if (n <= 6) return "ks2";
  if (n <= 9) return "ks3";
  if (n <= 11) return "ks4";
  return "ks5";
}

/**
 * Find the most relevant misconceptions for a worksheet's subject + topic + year.
 * Returns at most `limit` entries, ranked by topic-keyword match strength then key-stage match.
 */
export function findRelevantMisconceptions(opts: {
  subject: string;
  topic: string;
  yearGroup?: string;
  limit?: number;
}): Misconception[] {
  const { subject, topic, yearGroup, limit = 3 } = opts;
  const subjectLower = subject.toLowerCase();
  const topicLower = (topic || "").toLowerCase();
  const ks = ksFromYear(yearGroup);

  const scored = MISCONCEPTION_BANK.map((m) => {
    let score = 0;

    // Subject match (loose) — Science covers Biology/Chemistry/Physics
    const mSubLower = m.subject.toLowerCase();
    const subjectMatches =
      mSubLower === subjectLower ||
      (mSubLower === "science" && /(physic|chem|biol|science)/i.test(subjectLower)) ||
      (subjectLower.includes(mSubLower) || mSubLower.includes(subjectLower));
    if (!subjectMatches) return { m, score: -1 };
    score += 2;

    // Topic keyword match
    const matchedKeywords = m.topicKeywords.filter((kw) => topicLower.includes(kw.toLowerCase()));
    score += matchedKeywords.length * 5;

    // Key-stage match
    if (ks && m.keyStages.includes(ks)) score += 3;

    return { m, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, Math.max(1, Math.min(limit, scored.length))).map((x) => x.m);
}

/**
 * Build the misconception block for injection into an AI worksheet prompt.
 * Returns "" if no relevant misconceptions found (so the prompt remains clean).
 */
export function buildMisconceptionPromptBlock(opts: {
  subject: string;
  topic: string;
  yearGroup?: string;
  limit?: number;
}): { block: string; ids: string[] } {
  const items = findRelevantMisconceptions(opts);
  if (items.length === 0) return { block: "", ids: [] };

  const lines = items.map((m, i) => {
    const example = m.diagnosticExample ? `\n  • Diagnostic example: ${m.diagnosticExample}` : "";
    return `${i + 1}. [${m.id}] PUPILS THINK: ${m.misbelief}\n   ACTUAL: ${m.correct}${example}`;
  });

  const block = [
    "",
    "DIAGNOSTIC MISCONCEPTION TARGETS — MANDATORY USE:",
    "The following misconceptions are well-evidenced for this topic and year group.",
    "Your job is to design questions (especially MCQ distractors and error-correction items)",
    "so that a pupil's wrong answer reveals which misconception they hold.",
    "",
    ...lines,
    "",
    "RULES:",
    "- For at least one MCQ in the worksheet, make the WRONG OPTIONS map to these misconceptions.",
    "  Place the misconception id in square brackets at the END of each distractor line, e.g.",
    '  "B  0.65  [m-decimal-longer-bigger]" — the brackets will be stripped before printing.',
    "- The Common Mistakes section MUST address at least one of these misconceptions explicitly.",
    "- Add a top-level metadata field `misconceptionsTargeted` to your JSON output, set to the",
    "  array of misconception ids you actually targeted (e.g. [\"m-decimal-longer-bigger\"]).",
    "  This is REQUIRED — do not omit it.",
    "",
  ].join("\n");

  return { block, ids: items.map((m) => m.id) };
}

/** Look up a misconception by id (used by the marking pipeline). */
export function getMisconceptionById(id: string): Misconception | undefined {
  return MISCONCEPTION_BANK.find((m) => m.id === id);
}
