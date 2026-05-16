/**
 * misconception-bank.ts — UK-curriculum misconception library (Phase 4 / FEAT-002)
 *
 * Curated bank of common pupil misconceptions across the UK National Curriculum,
 * KS1–KS5. Each entry is keyed by subject + topic + key-stage and includes the
 * misconception itself, the correct understanding, and a short "diagnostic prompt"
 * that the AI prompt builder can use to design a question whose distractor exposes
 * the misconception.
 *
 * Usage:
 *   import { getMisconceptionsForTopic, formatMisconceptionsForPrompt } from "@/lib/misconception-bank";
 *   const block = formatMisconceptionsForPrompt({ subject, topic, yearGroup });
 *   // append `block` into the worksheet system prompt
 *
 * Design notes:
 * - Topic matching is fuzzy (lower-case, hyphenated, substring contains).
 * - Year-group filter is permissive: if no exact KS match, returns subject-level
 *   misconceptions (so the prompt always has something useful).
 * - Each `id` is short (`m-frac-01`) so the AI can echo it back in
 *   `metadata.misconceptionsTargeted` for traceability.
 */

export type KeyStage = "ks1" | "ks2" | "ks3" | "ks4" | "ks5";

export interface MisconceptionEntry {
  id: string;             // short id like "m-frac-01" — AI echoes this back in metadata
  subject: string;        // canonical subject id (lower-case)
  topicKeywords: string[];// topic match keywords (lower-case, hyphen tolerated)
  keyStages: KeyStage[];  // applicable key stages
  misconception: string;  // the wrong belief (one sentence)
  correctUnderstanding: string; // the right understanding (one sentence)
  diagnosticPrompt: string;     // hint for designing a distractor that exposes it
}

export const MISCONCEPTION_BANK: MisconceptionEntry[] = [
  // ── MATHS ────────────────────────────────────────────────────────────────
  {
    id: "m-dec-01",
    subject: "mathematics",
    topicKeywords: ["decimal", "place value"],
    keyStages: ["ks2", "ks3"],
    misconception: "Pupils think 0.7 is smaller than 0.65 because 65 > 7.",
    correctUnderstanding: "0.7 = 0.70, which is greater than 0.65.",
    diagnosticPrompt: "Compare two decimals where the longer-decimal trick gives the wrong answer.",
  },
  {
    id: "m-frac-01",
    subject: "mathematics",
    topicKeywords: ["fraction", "fractions"],
    keyStages: ["ks2", "ks3"],
    misconception: "Pupils add fractions by adding numerators and denominators (1/2 + 1/3 = 2/5).",
    correctUnderstanding: "Find a common denominator first: 1/2 + 1/3 = 3/6 + 2/6 = 5/6.",
    diagnosticPrompt: "Provide a sum where adding numerators+denominators gives a nearby plausible distractor.",
  },
  {
    id: "m-frac-02",
    subject: "mathematics",
    topicKeywords: ["fraction", "fractions"],
    keyStages: ["ks2", "ks3"],
    misconception: "Pupils think 1/4 is bigger than 1/3 because 4 > 3.",
    correctUnderstanding: "When the numerator is 1, the larger the denominator the smaller the fraction.",
    diagnosticPrompt: "Ask which unit fraction is largest; include 1/3 vs 1/4 as the trap.",
  },
  {
    id: "m-neg-01",
    subject: "mathematics",
    topicKeywords: ["negative", "directed number"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils think -5 is greater than -2 because 5 > 2.",
    correctUnderstanding: "On the number line, -2 is to the right of -5, so -2 > -5.",
    diagnosticPrompt: "Order a list of negatives where ignoring sign gives the wrong answer.",
  },
  {
    id: "m-pct-01",
    subject: "mathematics",
    topicKeywords: ["percentage", "percentages"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils think 'increase by 20% then decrease by 20%' returns to the original value.",
    correctUnderstanding: "Successive percentages compound multiplicatively: 1.20 × 0.80 = 0.96, a 4% net decrease.",
    diagnosticPrompt: "Ask for the final value after a +20% then -20% change.",
  },
  {
    id: "m-alg-01",
    subject: "mathematics",
    topicKeywords: ["algebra", "expression"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils think 3x means '3 and x' (i.e. addition), not 3 × x.",
    correctUnderstanding: "3x means 3 multiplied by x. If x = 4 then 3x = 12, not 7.",
    diagnosticPrompt: "Substitute a value into 3x; include the additive misread as a distractor.",
  },
  {
    id: "m-alg-02",
    subject: "mathematics",
    topicKeywords: ["expand", "bracket", "expanding"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils write (x+3)² = x² + 9, forgetting the cross term.",
    correctUnderstanding: "(x+3)² = x² + 6x + 9.",
    diagnosticPrompt: "Ask to expand (x+3)²; include x² + 9 as a distractor.",
  },
  {
    id: "m-prob-01",
    subject: "mathematics",
    topicKeywords: ["probability"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils think a fair coin that has shown 4 heads in a row is 'due' to land tails.",
    correctUnderstanding: "Each flip is independent — P(tails) is still 1/2 regardless of past flips.",
    diagnosticPrompt: "Ask about the probability after a streak.",
  },
  {
    id: "m-area-01",
    subject: "mathematics",
    topicKeywords: ["area", "perimeter"],
    keyStages: ["ks2", "ks3"],
    misconception: "Pupils confuse area with perimeter and use the wrong formula.",
    correctUnderstanding: "Perimeter is the distance around (sum of all sides); area is the space inside (length × width for a rectangle).",
    diagnosticPrompt: "Give a rectangle and ask for area; include the perimeter answer as a distractor.",
  },
  {
    id: "m-graph-01",
    subject: "mathematics",
    topicKeywords: ["gradient", "linear graph", "slope", "y=mx+c"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils calculate gradient as Δx/Δy instead of Δy/Δx.",
    correctUnderstanding: "Gradient = change in y ÷ change in x (rise over run).",
    diagnosticPrompt: "Ask for the gradient of a line; include the inverted answer as a distractor.",
  },

  // ── SCIENCE ──────────────────────────────────────────────────────────────
  {
    id: "s-mass-01",
    subject: "science",
    topicKeywords: ["weight", "mass", "force"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils confuse weight (a force, in newtons) with mass (in kilograms).",
    correctUnderstanding: "Mass is the amount of matter (kg). Weight is the gravitational force on it (N). W = m × g.",
    diagnosticPrompt: "Ask for the weight of a 5 kg object on Earth (g = 10 N/kg); include 5 N as a distractor.",
  },
  {
    id: "s-energy-01",
    subject: "physics",
    topicKeywords: ["energy", "energy stores"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils think 'energy is used up' when work is done.",
    correctUnderstanding: "Energy is conserved — it transfers between stores; it is never created or destroyed.",
    diagnosticPrompt: "Ask what happens to the energy when a ball stops rolling — kinetic transfers to thermal.",
  },
  {
    id: "s-circ-01",
    subject: "physics",
    topicKeywords: ["circuit", "current", "electricity"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils think current is 'used up' as it goes around a circuit.",
    correctUnderstanding: "In a series circuit, current is the same at every point — it is the energy carried by the current that is transferred.",
    diagnosticPrompt: "Compare ammeter readings at two points in a series circuit; trap is to choose unequal readings.",
  },
  {
    id: "s-photo-01",
    subject: "biology",
    topicKeywords: ["photosynthesis"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils think plants 'eat' soil to grow.",
    correctUnderstanding: "Plants make glucose by photosynthesis using carbon dioxide and water; they take minerals (not 'food') from soil.",
    diagnosticPrompt: "Ask where the mass of a tree comes from; include 'soil' as a distractor.",
  },
  {
    id: "s-cell-01",
    subject: "biology",
    topicKeywords: ["cell", "animal cell", "plant cell"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils think animal cells have cell walls and chloroplasts.",
    correctUnderstanding: "Only plant cells have a cell wall (cellulose) and chloroplasts; animal cells have neither.",
    diagnosticPrompt: "Ask which structures are NOT found in an animal cell; include cell wall and chloroplast as the trap.",
  },
  {
    id: "s-chem-01",
    subject: "chemistry",
    topicKeywords: ["atom", "molecule", "element", "compound"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils confuse atoms, elements, and compounds.",
    correctUnderstanding: "An element has one type of atom; a compound has atoms of two or more elements chemically bonded.",
    diagnosticPrompt: "Classify substances (H2, H2O, NaCl, O2) as element vs compound.",
  },
  {
    id: "s-acid-01",
    subject: "chemistry",
    topicKeywords: ["acid", "base", "neutralisation", "ph"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils think a higher pH means a stronger acid.",
    correctUnderstanding: "Lower pH = stronger acid. pH 1 is strongly acidic; pH 7 is neutral; pH 14 is strongly alkaline.",
    diagnosticPrompt: "Ask which substance is the strongest acid given pH values; include the highest-pH option as a distractor.",
  },
  {
    id: "s-orbit-01",
    subject: "physics",
    topicKeywords: ["gravity", "orbit", "moon", "planet"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils think astronauts in orbit are weightless because there is no gravity.",
    correctUnderstanding: "There IS gravity in orbit — astronauts are in continuous freefall, which feels weightless.",
    diagnosticPrompt: "Ask why astronauts on the ISS appear weightless.",
  },
  {
    id: "s-resp-01",
    subject: "biology",
    topicKeywords: ["respiration", "breathing"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils confuse respiration with breathing.",
    correctUnderstanding: "Breathing is the physical movement of air; respiration is the chemical release of energy from glucose in cells.",
    diagnosticPrompt: "Ask whether respiration happens only when breathing — trap is 'yes, it stops when you hold your breath'.",
  },

  // ── ENGLISH ──────────────────────────────────────────────────────────────
  {
    id: "e-apos-01",
    subject: "english",
    topicKeywords: ["apostrophe", "possessive", "punctuation"],
    keyStages: ["ks2", "ks3"],
    misconception: "Pupils put an apostrophe in 'its' when it is a possessive (its tail).",
    correctUnderstanding: "'Its' = belonging to it (no apostrophe). 'It's' = it is.",
    diagnosticPrompt: "Choose the correct word for a possessive use of 'it'.",
  },
  {
    id: "e-vow-01",
    subject: "english",
    topicKeywords: ["adjective", "adverb", "word class"],
    keyStages: ["ks2", "ks3"],
    misconception: "Pupils think any word ending in -ly is an adverb.",
    correctUnderstanding: "Most -ly words are adverbs, but not all (e.g. friendly, lovely, lonely are adjectives).",
    diagnosticPrompt: "Identify the word class of 'friendly' in a sentence.",
  },
  {
    id: "e-poet-01",
    subject: "english",
    topicKeywords: ["simile", "metaphor", "figurative"],
    keyStages: ["ks2", "ks3"],
    misconception: "Pupils think any comparison is a simile.",
    correctUnderstanding: "Similes use 'like' or 'as'; metaphors state one thing IS another directly.",
    diagnosticPrompt: "Classify a sentence as simile or metaphor.",
  },
  {
    id: "e-tense-01",
    subject: "english",
    topicKeywords: ["tense", "past", "present", "verb"],
    keyStages: ["ks2", "ks3"],
    misconception: "Pupils mix tenses within a single piece of writing without realising.",
    correctUnderstanding: "Once you set a tense for a piece, every verb should agree unless deliberately shifting time.",
    diagnosticPrompt: "Spot the tense inconsistency in a short paragraph.",
  },

  // ── HISTORY / GEOGRAPHY ─────────────────────────────────────────────────
  {
    id: "h-cause-01",
    subject: "history",
    topicKeywords: ["cause", "consequence", "interpretation"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils give a single cause for complex historical events.",
    correctUnderstanding: "Significant events have multiple, interlinked causes (long-term, short-term, trigger).",
    diagnosticPrompt: "Ask for THREE causes of an event; trap is one-sentence single-cause answer.",
  },
  {
    id: "h-source-01",
    subject: "history",
    topicKeywords: ["source", "evidence", "reliability"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils think primary sources are always more reliable than secondary sources.",
    correctUnderstanding: "Primary sources can be biased or partial; secondary sources can have stronger analysis. Reliability depends on origin, purpose, audience.",
    diagnosticPrompt: "Compare a primary source diary entry with a balanced secondary account.",
  },
  {
    id: "g-river-01",
    subject: "geography",
    topicKeywords: ["river", "erosion", "deposition"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils think rivers flow from south to north or always 'downhill on a map'.",
    correctUnderstanding: "Rivers flow from high to low altitude — direction on the page depends on the terrain, not the compass.",
    diagnosticPrompt: "Identify direction of flow on an OS map using contour lines.",
  },
  {
    id: "g-tect-01",
    subject: "geography",
    topicKeywords: ["plate tectonics", "earthquake", "volcano"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils think earthquakes only happen on destructive plate boundaries.",
    correctUnderstanding: "Earthquakes occur on all plate boundaries — destructive, constructive, conservative — and even within plates.",
    diagnosticPrompt: "Match boundary type to its hazard profile.",
  },

  // ── COMPUTING ────────────────────────────────────────────────────────────
  {
    id: "c-bin-01",
    subject: "computing",
    topicKeywords: ["binary", "denary", "number system"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils read binary right-to-left or assume each digit doubles instead of place values.",
    correctUnderstanding: "Place values from right to left double: 1, 2, 4, 8, 16, 32, 64, 128.",
    diagnosticPrompt: "Convert 1011 to denary.",
  },
  {
    id: "c-algo-01",
    subject: "computing",
    topicKeywords: ["algorithm", "sorting", "searching"],
    keyStages: ["ks3", "ks4"],
    misconception: "Pupils think binary search works on any list.",
    correctUnderstanding: "Binary search requires the list to be SORTED; otherwise use linear search.",
    diagnosticPrompt: "Choose the appropriate search for an unsorted list.",
  },

  // ── PSHE / GENERAL CROSS-CURRICULAR ─────────────────────────────────────
  {
    id: "x-graph-01",
    subject: "general",
    topicKeywords: ["graph", "chart", "data"],
    keyStages: ["ks2", "ks3", "ks4"],
    misconception: "Pupils read scatter graphs as if they were line graphs and 'connect the dots'.",
    correctUnderstanding: "Scatter graphs show correlation between two variables — points are not connected.",
    diagnosticPrompt: "Ask whether to connect points on a scatter chart of height vs weight.",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function normaliseTopic(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

function yearGroupToKeyStage(yg: string | undefined): KeyStage | null {
  if (!yg) return null;
  const m = yg.match(/(\d+)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (n <= 2) return "ks1";
  if (n <= 6) return "ks2";
  if (n <= 9) return "ks3";
  if (n <= 11) return "ks4";
  return "ks5";
}

/**
 * Find misconceptions matching the given subject + topic + year group.
 * Returns up to `limit` entries, ranked by topic-keyword match strength then
 * by key-stage applicability. Returns empty array if no matches at all.
 */
export function getMisconceptionsForTopic(opts: {
  subject?: string;
  topic?: string;
  yearGroup?: string;
  limit?: number;
}): MisconceptionEntry[] {
  const subjectKey = (opts.subject || "").toLowerCase();
  const topicKey = normaliseTopic(opts.topic || "");
  const ks = yearGroupToKeyStage(opts.yearGroup);
  const limit = opts.limit ?? 5;

  // Score each entry
  const scored = MISCONCEPTION_BANK.map((entry) => {
    let score = 0;
    // Subject match (allow partial — e.g. "physics" matches "science")
    if (subjectKey) {
      if (entry.subject === subjectKey) score += 10;
      else if (entry.subject === "general") score += 1;
      else if (
        (subjectKey.includes("physic") || subjectKey.includes("biolog") || subjectKey.includes("chem")) &&
        (entry.subject === "science" || entry.subject === "physics" || entry.subject === "biology" || entry.subject === "chemistry")
      ) {
        score += 6;
      }
    }
    // Topic keyword match
    if (topicKey) {
      for (const kw of entry.topicKeywords) {
        if (topicKey.includes(kw.toLowerCase())) score += 5;
      }
    }
    // Key-stage match
    if (ks && entry.keyStages.includes(ks)) score += 3;
    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);
  // Only return entries with at least some signal (score > 0)
  return scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.entry);
}

/**
 * Look up a single bank entry by id. Returns undefined if not found.
 * Used by the worksheet renderer's teacher view to expand short ids
 * (e.g. `m-frac-01`) into full misconception + correct-understanding text.
 */
export function findMisconceptionById(id: string): MisconceptionEntry | undefined {
  if (!id) return undefined;
  const key = id.trim().toLowerCase();
  return MISCONCEPTION_BANK.find((e) => e.id === key);
}

/**
 * Format a misconception block for injection into the worksheet system prompt.
 * Returns an empty string if no misconceptions match.
 *
 * The block now also instructs the model to emit a single, machine-parseable
 * teacher-only marker right after the correct option line of each MCQ:
 *
 *   TEACHER_DIAGNOSES: A=m-frac-02, C=m-frac-01
 *
 * which the post-validator (worksheetPostValidator.extractMisconceptionLinks)
 * lifts into `metadata.misconceptionLinks` and then strips from the student
 * content. The marker pattern is deliberately fenced (TEACHER_DIAGNOSES:) so
 * we never accidentally show it to pupils even if a model leaks it into
 * student-visible HTML.
 */
export function formatMisconceptionsForPrompt(opts: {
  subject?: string;
  topic?: string;
  yearGroup?: string;
  limit?: number;
}): string {
  const entries = getMisconceptionsForTopic(opts);
  if (entries.length === 0) return "";

  const lines = [
    "",
    "MISCONCEPTION-AWARE QUESTION DESIGN (mandatory):",
    "Some questions in this worksheet must DIAGNOSE common pupil misconceptions about this topic, not just test recall. For each MCQ or short-answer question that targets a misconception below, design at least one distractor or trap that a pupil holding that misconception would fall for.",
    "",
    "Targeted misconceptions for this worksheet:",
  ];
  for (const e of entries) {
    lines.push(`- [${e.id}] ${e.misconception} (Correct: ${e.correctUnderstanding})`);
  }
  lines.push("");
  lines.push("PER-MCQ DIAGNOSIS LINKAGE (mandatory):");
  lines.push("For every MCQ you emit whose distractors target one of the misconceptions above, append a single teacher-only line at the END of that MCQ's content string in this exact format:");
  lines.push("  TEACHER_DIAGNOSES: A=m-frac-02, C=m-frac-01");
  lines.push("Notes: (1) use the option letter (A/B/C/D) of each WRONG answer, never the correct option; (2) the right of '=' is one of the misconception ids above; (3) only include letters whose distractor genuinely diagnoses a listed misconception — omit the line entirely if none do; (4) the marker must be on its own line, no trailing punctuation.");
  lines.push("");
  lines.push("After generation, also return an array of misconception IDs you targeted in metadata.misconceptionsTargeted (e.g. \"misconceptionsTargeted\": [\"m-frac-01\", \"m-pct-01\"]). Do NOT include any [m-id] markers in question text — those IDs are for metadata and the TEACHER_DIAGNOSES line only.");
  lines.push("");
  return lines.join("\n");
}
