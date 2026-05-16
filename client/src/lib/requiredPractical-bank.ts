/**
 * requiredPractical-bank.ts — FEAT-PC9
 *
 * AQA / Edexcel / OCR GCSE Combined Science specifications mandate ~21
 * required practicals per discipline (Biology / Chemistry / Physics).
 * These are explicitly examined — typically on Paper 2 — under the
 * Working-Scientifically (WS) assessment objectives:
 *   AO1 — recall of method
 *   AO2 — apply knowledge to a practical context
 *   AO3 — analyse data, evaluate methods, suggest improvements
 *
 * Until now the worksheet generator just told the LLM to "include a
 * required-practical question where relevant" with no spec codes, no real
 * variables, no realistic data, and no Working-Scientifically focus. This
 * module fills that gap by:
 *
 *   1. Curating a small but realistic bank of UK GCSE required practicals
 *      keyed by (board, subject, topic). Each entry carries the official
 *      spec code, the independent / dependent / control variables, a
 *      sample data table the LLM can use as the stimulus, the most common
 *      experimental errors, and the WS skills assessed.
 *
 *   2. Exposing `getRequiredPracticalsForTopic({ subject, topic, yearGroup,
 *      examBoard })` which returns the matched practicals (best-effort —
 *      falls back to subject-level matches when a precise topic match is
 *      not available).
 *
 *   3. Exposing `formatRequiredPracticalForPrompt(...)` which returns a
 *      mandatory injection block that instructs the LLM to add ONE
 *      Working-Scientifically question to a Y10/Y11 science worksheet
 *      using the bank entry's variables + sample data + WS skill list.
 *
 *   4. Exposing `applyRequiredPracticalTagging(worksheet, opts)` — a
 *      post-generation pass that stamps the chosen entry onto
 *      `metadata.requiredPractical` so the renderer can show a teacher-only
 *      "Required Practical" panel with the spec code and WS skills.
 *
 * Scope of v1: ~12 anchor practicals — enough to cover the highest-traffic
 * Y10/Y11 topics. Adding more is a one-entry edit.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type RequiredPracticalSubject = "biology" | "chemistry" | "physics";
export type RequiredPracticalBoard = "aqa" | "edexcel" | "ocr" | "any";
export type WorkingScientificallySkill =
  | "ws-1.1-method-recall"
  | "ws-1.2-variables"
  | "ws-1.3-controls"
  | "ws-2.1-data-recording"
  | "ws-2.2-units-significant-figures"
  | "ws-3.1-graph-plotting"
  | "ws-3.2-line-of-best-fit"
  | "ws-3.3-anomalous-results"
  | "ws-3.4-trends-conclusions"
  | "ws-4.1-evaluation"
  | "ws-4.2-uncertainty"
  | "ws-4.3-improvements";

export interface RequiredPracticalEntry {
  /** Stable id used in metadata, e.g. "rp-physics-shc". */
  id: string;
  subject: RequiredPracticalSubject;
  /** Boards that examine this practical (use "any" for cross-board fundamentals). */
  boards: RequiredPracticalBoard[];
  /** Spec code per board, e.g. "AQA Physics RP-1 / Edexcel CP-7 / OCR PAG-P3". */
  specCodes: Partial<Record<Exclude<RequiredPracticalBoard, "any">, string>>;
  /** Human-readable practical title. */
  title: string;
  /** Lower-case keywords matched against the worksheet topic. */
  topicKeywords: string[];
  /** Independent variable. */
  ivVariable: string;
  /** Dependent variable. */
  dvVariable: string;
  /** Variables that must be controlled. */
  controls: string[];
  /** A short sample data table the LLM can re-use as the stimulus. */
  sampleData: string;
  /** Common experimental errors (used as distractors in evaluation questions). */
  commonErrors: string[];
  /** Working-Scientifically skills assessed. */
  wsSkills: WorkingScientificallySkill[];
  /** One-sentence pedagogical anchor for the prompt. */
  anchor: string;
}

// ─── The bank ────────────────────────────────────────────────────────────────

export const REQUIRED_PRACTICAL_BANK: RequiredPracticalEntry[] = [
  // ── PHYSICS ───────────────────────────────────────────────────────────────
  {
    id: "rp-physics-shc",
    subject: "physics",
    boards: ["aqa", "edexcel", "ocr"],
    specCodes: {
      aqa: "AQA Physics RP-1 (Specific Heat Capacity)",
      edexcel: "Edexcel Core Practical CP-12 (Thermal energy / SHC)",
      ocr: "OCR Gateway PAG-P3 (Specific Heat Capacity)",
    },
    title: "Specific Heat Capacity of a Solid Block",
    topicKeywords: ["specific heat capacity", "shc", "thermal energy", "internal energy", "energy stores"],
    ivVariable: "Energy transferred to the block (J)",
    dvVariable: "Temperature change of the block (°C)",
    controls: ["Mass of the block", "Material of the block", "Insulation around the block", "Starting temperature"],
    sampleData: "Energy (J) | 0  | 600 | 1200 | 1800 | 2400 | 3000\nTemp (°C)  | 21 | 23  | 25   | 27   | 29   | 31",
    commonErrors: [
      "Heat lost to the surroundings — block not insulated",
      "Thermometer not in good thermal contact with block",
      "Voltmeter / ammeter zero error",
      "Insufficient time for heat to spread evenly through the block before reading",
    ],
    wsSkills: ["ws-1.2-variables", "ws-2.1-data-recording", "ws-3.1-graph-plotting", "ws-3.4-trends-conclusions", "ws-4.3-improvements"],
    anchor: "Use the energy / temperature data to find the gradient → c = E / (m × ΔT). Pupils must identify the IV/DV, plot a graph, and evaluate sources of heat loss.",
  },
  {
    id: "rp-physics-resistance",
    subject: "physics",
    boards: ["aqa", "edexcel", "ocr"],
    specCodes: {
      aqa: "AQA Physics RP-3 (Resistance of a wire)",
      edexcel: "Edexcel Core Practical CP-10 (Resistance and length of a wire)",
      ocr: "OCR Gateway PAG-P5 (Resistance)",
    },
    title: "Resistance of a Wire",
    topicKeywords: ["resistance", "ohm", "circuit", "current", "voltage", "wire"],
    ivVariable: "Length of the wire (cm)",
    dvVariable: "Resistance of the wire (Ω) — calculated from V / I",
    controls: ["Cross-sectional area of the wire", "Material of the wire", "Temperature of the wire (use low currents)"],
    sampleData: "Length (cm) | 10  | 20  | 30  | 40  | 50\nVoltage (V) | 0.4 | 0.8 | 1.2 | 1.6 | 2.0\nCurrent (A) | 0.20| 0.20| 0.20| 0.20| 0.20\nR = V / I (Ω)| 2.0 | 4.0 | 6.0 | 8.0 | 10.0",
    commonErrors: [
      "Wire heating up at higher currents — resistance changes with temperature",
      "Crocodile clip placed inside the measured length",
      "Diameter of the wire varies along its length",
      "Parallax error reading the metre rule",
    ],
    wsSkills: ["ws-1.2-variables", "ws-1.3-controls", "ws-3.1-graph-plotting", "ws-3.2-line-of-best-fit", "ws-4.1-evaluation"],
    anchor: "Plot resistance against length, draw a line of best fit, and explain why the line passes (almost) through the origin. Pupils evaluate why the wire heats up at higher currents.",
  },
  {
    id: "rp-physics-iv-characteristics",
    subject: "physics",
    boards: ["aqa", "edexcel", "ocr"],
    specCodes: {
      aqa: "AQA Physics RP-4 (I-V characteristics)",
      edexcel: "Edexcel Core Practical CP-11 (I-V characteristics)",
      ocr: "OCR Gateway PAG-P5 (I-V characteristics)",
    },
    title: "I-V Characteristics of a Filament Bulb / Diode / Resistor",
    topicKeywords: ["i-v characteristic", "i-v graph", "filament", "diode", "ohmic", "non-ohmic"],
    ivVariable: "Voltage across the component (V)",
    dvVariable: "Current through the component (A)",
    controls: ["Component identity", "Ambient temperature", "Same circuit setup"],
    sampleData: "Voltage (V) | -3  | -2  | -1  | 0 | 1  | 2  | 3\nCurrent (A) | -0.6| -0.4| -0.2| 0 | 0.2| 0.4| 0.6 (resistor — ohmic, straight line)",
    commonErrors: [
      "Filament bulb tested for too long — bulb temperature rises during the experiment",
      "Switching the leads on the diode and assuming no current flows in either direction",
      "Variable resistor not zeroed before reading",
    ],
    wsSkills: ["ws-1.2-variables", "ws-3.1-graph-plotting", "ws-3.4-trends-conclusions", "ws-4.1-evaluation"],
    anchor: "Pupils plot I against V (sweep both directions), identify whether the component is ohmic, and explain the curvature seen in a filament bulb in terms of resistance changing with temperature.",
  },
  {
    id: "rp-physics-acceleration",
    subject: "physics",
    boards: ["aqa", "edexcel", "ocr"],
    specCodes: {
      aqa: "AQA Physics RP-7 (Acceleration / F = ma)",
      edexcel: "Edexcel Core Practical CP-9 (Investigating motion)",
      ocr: "OCR Gateway PAG-P2 (Acceleration)",
    },
    title: "Investigating Acceleration with a Trolley and Light Gates",
    topicKeywords: ["acceleration", "f = ma", "newton's second law", "motion", "trolley", "light gate"],
    ivVariable: "Force applied to the trolley (N)",
    dvVariable: "Acceleration of the trolley (m/s²)",
    controls: ["Mass of the trolley + masses (total mass kept constant by transferring masses from the trolley to the hanger)", "Same track", "Same air-resistance / friction"],
    sampleData: "Force (N)        | 0.5 | 1.0 | 1.5 | 2.0 | 2.5\nAcceleration (m/s²)| 0.4 | 0.9 | 1.4 | 1.9 | 2.4",
    commonErrors: [
      "Friction not compensated by tilting the runway",
      "Mass not kept constant — only adding to the hanger increases system mass",
      "Light gates not perpendicular to the trolley path",
    ],
    wsSkills: ["ws-1.2-variables", "ws-1.3-controls", "ws-3.1-graph-plotting", "ws-3.4-trends-conclusions", "ws-4.3-improvements"],
    anchor: "Pupils show that a / F is approximately constant, identify the gradient as 1/m, and explain why the line should pass through the origin if friction is fully compensated.",
  },
  {
    id: "rp-physics-density",
    subject: "physics",
    boards: ["aqa", "edexcel", "ocr"],
    specCodes: {
      aqa: "AQA Physics RP-2 (Density)",
      edexcel: "Edexcel Core Practical CP-13 (Density)",
      ocr: "OCR Gateway PAG-P1 (Density)",
    },
    title: "Density of Regular and Irregular Solids",
    topicKeywords: ["density", "particle model", "mass per unit volume"],
    ivVariable: "Object identity (regular block / irregular stone)",
    dvVariable: "Density (kg/m³ or g/cm³) — calculated from mass and volume",
    controls: ["Same balance", "Same measuring cylinder", "Water at the same temperature"],
    sampleData: "Object  | Mass (g) | Volume (cm³) | Density (g/cm³)\nBlock A | 81.0     | 30.0          | 2.70 (aluminium)\nStone   | 78.5     | 28.0          | 2.80 (granite)",
    commonErrors: [
      "Trapped air bubbles on the irregular object inflate the displaced volume",
      "Water added past the calibration line on the measuring cylinder",
      "Reading parallax on the meniscus",
    ],
    wsSkills: ["ws-2.1-data-recording", "ws-2.2-units-significant-figures", "ws-4.1-evaluation"],
    anchor: "Pupils compare measured density to a published value, calculate the percentage error, and propose one method improvement.",
  },

  // ── CHEMISTRY ─────────────────────────────────────────────────────────────
  {
    id: "rp-chem-rate",
    subject: "chemistry",
    boards: ["aqa", "edexcel", "ocr"],
    specCodes: {
      aqa: "AQA Chemistry RP-5 (Rates of reaction)",
      edexcel: "Edexcel Core Practical CP-14 (Rates of reaction)",
      ocr: "OCR Gateway PAG-C5 (Rates of reaction)",
    },
    title: "Rate of Reaction — Sodium Thiosulfate and Hydrochloric Acid",
    topicKeywords: ["rate of reaction", "thiosulfate", "concentration", "collision theory"],
    ivVariable: "Concentration of sodium thiosulfate (mol/dm³)",
    dvVariable: "Time for the cross to disappear (s) — proxy for rate",
    controls: ["Volume of HCl", "Volume of solution", "Temperature", "Same observer + cross"],
    sampleData: "Concentration (mol/dm³) | 0.10 | 0.20 | 0.30 | 0.40\nTime to disappear (s)   | 120  | 60   | 40   | 30\n1/Time (s⁻¹)            | 0.008| 0.017| 0.025| 0.033",
    commonErrors: [
      "Different observers judging the cross differently",
      "Reading the stopwatch before the cross is fully obscured",
      "Solution temperature drifting between trials",
    ],
    wsSkills: ["ws-1.2-variables", "ws-1.3-controls", "ws-2.1-data-recording", "ws-3.1-graph-plotting", "ws-3.4-trends-conclusions"],
    anchor: "Pupils plot 1/time against concentration, recognise the proportional relationship, and link it to collision theory (more particles per unit volume → more collisions per second).",
  },
  {
    id: "rp-chem-titration",
    subject: "chemistry",
    boards: ["aqa", "edexcel", "ocr"],
    specCodes: {
      aqa: "AQA Chemistry RP-1 (Titration)",
      edexcel: "Edexcel Core Practical CP-1 (Titration)",
      ocr: "OCR Gateway PAG-C2 (Titration)",
    },
    title: "Titration — Acid–Alkali Neutralisation",
    topicKeywords: ["titration", "neutralisation", "acid", "alkali", "concentration"],
    ivVariable: "Volume of acid added (cm³)",
    dvVariable: "Volume of acid required to reach the end-point (cm³)",
    controls: ["Concentration of alkali in conical flask", "Same indicator", "Volume of alkali in conical flask", "Burette zeroed before each trial"],
    sampleData: "Trial    | Rough | 1     | 2     | 3\nFinal (cm³) | 24.85 | 24.10 | 24.05 | 24.15\nInitial (cm³)|  0.00 |  0.00 |  0.00 |  0.00\nTitre (cm³)  | 24.85 | 24.10 | 24.05 | 24.15\n(Concordant: trials 1, 2, 3 within 0.10 cm³)",
    commonErrors: [
      "Air bubble in the burette tip changes the recorded volume",
      "Indicator added in inconsistent quantity between trials",
      "Drops added past the end-point",
      "Mean calculated using the rough trial",
    ],
    wsSkills: ["ws-1.3-controls", "ws-2.1-data-recording", "ws-2.2-units-significant-figures", "ws-3.3-anomalous-results", "ws-4.1-evaluation"],
    anchor: "Pupils only average concordant titres (within 0.10 cm³), calculate the mean titre, and use it to find the unknown concentration. They evaluate why the rough trial is excluded.",
  },
  {
    id: "rp-chem-electrolysis",
    subject: "chemistry",
    boards: ["aqa", "edexcel", "ocr"],
    specCodes: {
      aqa: "AQA Chemistry RP-3 (Electrolysis)",
      edexcel: "Edexcel Core Practical CP-7 (Electrolysis)",
      ocr: "OCR Gateway PAG-C4 (Electrolysis)",
    },
    title: "Electrolysis of Aqueous Copper Sulfate / Sodium Chloride",
    topicKeywords: ["electrolysis", "electrolyte", "anode", "cathode", "ions"],
    ivVariable: "Type of electrolyte (CuSO₄ / NaCl / H₂SO₄)",
    dvVariable: "Products formed at the cathode and anode (identified)",
    controls: ["Current", "Time", "Same electrodes", "Same volume of electrolyte"],
    sampleData: "Electrolyte | Cathode product | Anode product\nCuSO₄(aq)   | Copper (pink)   | Oxygen (gas, relights glowing splint)\nNaCl(aq)    | Hydrogen (pop)  | Chlorine (bleaches damp blue litmus)",
    commonErrors: [
      "Inert electrodes contaminated between trials",
      "Gas escaping before being collected over water",
      "Product test (splint / litmus) applied too late",
    ],
    wsSkills: ["ws-1.1-method-recall", "ws-2.1-data-recording", "ws-3.4-trends-conclusions", "ws-4.1-evaluation"],
    anchor: "Pupils predict products using the rules (least reactive metal at cathode; halide ion at anode where present), identify gases by the standard tests, and explain anomalous results.",
  },
  {
    id: "rp-chem-paper-chromatography",
    subject: "chemistry",
    boards: ["aqa", "edexcel", "ocr"],
    specCodes: {
      aqa: "AQA Chemistry RP-6 (Chromatography)",
      edexcel: "Edexcel Core Practical CP-3 (Chromatography)",
      ocr: "OCR Gateway PAG-C1 (Chromatography)",
    },
    title: "Paper Chromatography of Food Dyes",
    topicKeywords: ["chromatography", "rf value", "separation", "stationary phase", "mobile phase"],
    ivVariable: "Sample dye (A / B / C / unknown X)",
    dvVariable: "Rf value of each component spot",
    controls: ["Same solvent", "Same paper", "Same starting line", "Same time in solvent"],
    sampleData: "Dye        | Distance moved by spot (cm) | Solvent front (cm) | Rf\nA          | 4.5                          | 9.0                | 0.50\nB          | 6.3                          | 9.0                | 0.70\nUnknown X  | 4.5 + 6.3                    | 9.0                | 0.50, 0.70 (mixture of A + B)",
    commonErrors: [
      "Origin line drawn in pen — ink dissolves in the solvent",
      "Solvent level above the origin line",
      "Paper touching the side of the beaker",
    ],
    wsSkills: ["ws-1.2-variables", "ws-2.1-data-recording", "ws-3.4-trends-conclusions", "ws-4.1-evaluation"],
    anchor: "Pupils calculate Rf = (distance moved by spot) / (distance moved by solvent) and identify unknowns by matching Rf values.",
  },

  // ── BIOLOGY ───────────────────────────────────────────────────────────────
  {
    id: "rp-bio-osmosis",
    subject: "biology",
    boards: ["aqa", "edexcel", "ocr"],
    specCodes: {
      aqa: "AQA Biology RP-3 (Osmosis)",
      edexcel: "Edexcel Core Practical CP-3 (Osmosis in potato)",
      ocr: "OCR Gateway PAG-B2 (Osmosis)",
    },
    title: "Osmosis in Potato Tissue",
    topicKeywords: ["osmosis", "diffusion", "transport", "cell membrane", "concentration", "potato"],
    ivVariable: "Concentration of sucrose / salt solution (mol/dm³)",
    dvVariable: "Percentage change in mass of the potato cylinder",
    controls: ["Length of potato cylinder", "Mass at start", "Time in solution", "Temperature", "Same potato"],
    sampleData: "Concentration (mol/dm³) | 0.0  | 0.2  | 0.4  | 0.6  | 0.8\nStart mass (g)          | 2.50 | 2.50 | 2.50 | 2.50 | 2.50\nEnd mass (g)            | 2.65 | 2.55 | 2.45 | 2.30 | 2.18\n% change in mass        | +6.0 | +2.0 | -2.0 | -8.0 | -12.8",
    commonErrors: [
      "Surface water not blotted before re-weighing",
      "Different potatoes used between trials",
      "Time in solution not standardised",
    ],
    wsSkills: ["ws-1.2-variables", "ws-1.3-controls", "ws-3.1-graph-plotting", "ws-3.4-trends-conclusions", "ws-4.3-improvements"],
    anchor: "Pupils plot % change in mass against concentration, identify the concentration where mass change = 0 (isotonic point), and link gain/loss of mass to net water movement by osmosis.",
  },
  {
    id: "rp-bio-photosynthesis",
    subject: "biology",
    boards: ["aqa", "edexcel", "ocr"],
    specCodes: {
      aqa: "AQA Biology RP-6 (Photosynthesis — light intensity)",
      edexcel: "Edexcel Core Practical CP-5 (Photosynthesis)",
      ocr: "OCR Gateway PAG-B3 (Photosynthesis)",
    },
    title: "Light Intensity and the Rate of Photosynthesis",
    topicKeywords: ["photosynthesis", "light intensity", "elodea", "pondweed", "rate"],
    ivVariable: "Distance of lamp from pondweed (cm) — proxy for light intensity (1/d²)",
    dvVariable: "Number of bubbles of oxygen released per minute",
    controls: ["Type of pondweed", "Volume / concentration of NaHCO₃ solution", "Temperature (water bath)", "Time per reading"],
    sampleData: "Distance (cm)        | 10  | 20  | 30  | 40  | 50\nBubbles / min        | 60  | 28  | 14  | 8   | 5\n1/d² (cm⁻²) × 10⁻³  | 10.0| 2.5 | 1.1 | 0.6 | 0.4",
    commonErrors: [
      "Lamp warming the water — confounds with temperature",
      "Bubble counting inconsistent at high rates",
      "CO₂ source running out near the end of the trial",
    ],
    wsSkills: ["ws-1.2-variables", "ws-1.3-controls", "ws-3.1-graph-plotting", "ws-3.4-trends-conclusions", "ws-4.3-improvements"],
    anchor: "Pupils plot rate against 1/d², identify the proportional region at low intensities, and explain why the curve plateaus when CO₂ or temperature becomes limiting.",
  },
  {
    id: "rp-bio-enzymes",
    subject: "biology",
    boards: ["aqa", "edexcel", "ocr"],
    specCodes: {
      aqa: "AQA Biology RP-4 (Enzymes — pH / temperature)",
      edexcel: "Edexcel Core Practical CP-2 (Enzymes)",
      ocr: "OCR Gateway PAG-B4 (Enzymes)",
    },
    title: "Effect of pH (or Temperature) on the Activity of Amylase",
    topicKeywords: ["enzyme", "amylase", "ph", "temperature", "starch", "active site"],
    ivVariable: "pH of buffer (or temperature, °C)",
    dvVariable: "Time taken for amylase to fully break down starch (no blue-black with iodine, s)",
    controls: ["Concentration of enzyme + substrate", "Volume of solutions", "Same iodine concentration", "Time interval between iodine tests"],
    sampleData: "pH                   | 4   | 5   | 6   | 7   | 8\nTime (s) for no blue | 240 | 90  | 35  | 60  | 180\nRate (1/time)        | 0.004| 0.011| 0.029| 0.017| 0.006",
    commonErrors: [
      "Iodine test interval too long — overshoots end-point",
      "Buffer not allowed to equilibrate to enzyme temperature",
      "Solutions not pre-mixed at the same temperature",
    ],
    wsSkills: ["ws-1.2-variables", "ws-1.3-controls", "ws-3.1-graph-plotting", "ws-3.3-anomalous-results", "ws-3.4-trends-conclusions"],
    anchor: "Pupils plot rate (1/time) against pH, identify the optimum, and explain the fall-off either side of optimum in terms of changes to the enzyme's active site.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normaliseTopicKey(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function normaliseSubject(subject: string | undefined): RequiredPracticalSubject | null {
  const s = (subject || "").toLowerCase();
  if (s.includes("biology") || s.includes("bio")) return "biology";
  if (s.includes("chemistry") || s.includes("chem")) return "chemistry";
  if (s.includes("physics") || s.includes("phys")) return "physics";
  // Combined "science" — return null so the caller can choose to show all three.
  return null;
}

function normaliseBoard(examBoard: string | undefined): RequiredPracticalBoard | null {
  const b = (examBoard || "").toLowerCase();
  if (!b || b === "none" || b === "n/a" || b === "general") return null;
  if (b.includes("aqa")) return "aqa";
  if (b.includes("edexcel") || b.includes("pearson")) return "edexcel";
  if (b.includes("ocr")) return "ocr";
  return null;
}

function isKs4(yearGroup: string | undefined): boolean {
  const m = (yearGroup || "").match(/(\d+)/);
  if (!m) return false;
  const y = parseInt(m[1], 10);
  return y >= 10 && y <= 11;
}

/**
 * Find required practicals matching the given subject, topic, year and board.
 * Returns up to `limit` entries (default 1) ordered by match quality.
 *
 * Falls back to subject-level entries when no topic match is found, so the
 * caller is guaranteed to get *something* useful for KS4 science topics.
 */
export function getRequiredPracticalsForTopic(opts: {
  subject?: string;
  topic?: string;
  yearGroup?: string;
  examBoard?: string;
  limit?: number;
}): RequiredPracticalEntry[] {
  // Only inject required-practical content for KS4 (Y10/Y11). KS3 topics
  // sometimes overlap (e.g. resistance, photosynthesis) but the spec codes
  // and assessment objectives only apply at GCSE.
  if (!isKs4(opts.yearGroup)) return [];

  const subjectKey = normaliseSubject(opts.subject);
  const board = normaliseBoard(opts.examBoard);
  const topicKey = normaliseTopicKey(opts.topic || "");
  const limit = opts.limit ?? 1;

  // Score each entry.
  const scored = REQUIRED_PRACTICAL_BANK.map((entry) => {
    let score = 0;
    if (subjectKey) {
      if (entry.subject === subjectKey) score += 10;
    } else {
      // Combined-science request — accept any of the three
      score += 1;
    }
    if (board) {
      if (entry.boards.includes(board) || entry.boards.includes("any")) score += 4;
    }
    if (topicKey) {
      for (const kw of entry.topicKeywords) {
        if (topicKey.includes(kw.toLowerCase())) {
          score += 6;
          break;
        }
      }
    }
    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score >= 10).slice(0, limit).map((s) => s.entry);
}

/**
 * Format a single Required-Practical block for injection into the AI prompt.
 * Returns "" when no practical applies. The block instructs the LLM to add
 * one Working-Scientifically question to the Application section using the
 * bank entry's variables, sample data, and WS skills.
 */
export function formatRequiredPracticalForPrompt(opts: {
  subject?: string;
  topic?: string;
  yearGroup?: string;
  examBoard?: string;
}): string {
  const practicals = getRequiredPracticalsForTopic({ ...opts, limit: 1 });
  if (practicals.length === 0) return "";
  const p = practicals[0];

  // Pick the most specific spec code we have for the supplied board.
  const board = normaliseBoard(opts.examBoard);
  const specCode = board ? p.specCodes[board] : Object.values(p.specCodes)[0] || p.title;

  const wsList = p.wsSkills.map((s) => `  • ${s}`).join("\n");
  const errors = p.commonErrors.map((e) => `  - ${e}`).join("\n");

  return `\nREQUIRED PRACTICAL — WORKING SCIENTIFICALLY (mandatory for KS4 science worksheets):
Spec reference: ${specCode}
Anchor practical: ${p.title}
Independent variable: ${p.ivVariable}
Dependent variable: ${p.dvVariable}
Controls (must keep constant): ${p.controls.join(", ")}
Sample data table (use this exact data — pupils must work with realistic numbers):
${p.sampleData}
Common experimental errors (use as evaluation distractors / "improve the method" prompts):
${errors}

PER-WORKSHEET RULE: Insert exactly ONE Working-Scientifically question in Section 3 (Application) — 4 to 6 marks. The question MUST do all of:
  (a) reference the practical's IV / DV / control variables explicitly;
  (b) use the sample data above as the stimulus (a small data table OR a partially-completed graph);
  (c) test at least TWO of the following Working-Scientifically skills:
${wsList}
  (d) finish with an EVALUATE / IMPROVE-THE-METHOD sub-part referencing one of the common errors above.
Anchor: ${p.anchor}
After generation, return the bank id "${p.id}" in metadata.requiredPractical.id so the teacher view can show the spec reference.\n`;
}

// ─── Post-generation tagging ────────────────────────────────────────────────

interface TaggableSection {
  type?: string;
  title?: string;
  content?: string;
  teacherOnly?: boolean;
  [key: string]: unknown;
}

interface TaggableWorksheet {
  sections?: TaggableSection[];
  metadata?: Record<string, unknown> & {
    subject?: string;
    topic?: string;
    yearGroup?: string;
    examBoard?: string;
    requiredPractical?: {
      id: string;
      title: string;
      specCode: string;
      wsSkills: WorkingScientificallySkill[];
      detected: boolean;
      evidence?: string;
    };
    postValidatorWarnings?: string[];
  };
  [key: string]: unknown;
}

/**
 * Best-effort detection: did the generated worksheet actually include the
 * required-practical question we asked for? We look for any section whose
 * content references both the IV variable AND at least one Working-
 * Scientifically command word.
 */
function detectPracticalInWorksheet(
  worksheet: TaggableWorksheet,
  practical: RequiredPracticalEntry,
): { detected: boolean; evidence?: string } {
  const sections = worksheet.sections || [];
  const haystack = sections
    .filter((s) => !s.teacherOnly)
    .map((s) => `${s.title || ""}\n${s.content || ""}`)
    .join("\n");
  const lower = haystack.toLowerCase();
  const ivToken = practical.ivVariable.split(/[\s(]/)[0].toLowerCase();
  const dvToken = practical.dvVariable.split(/[\s(]/)[0].toLowerCase();
  const wsCommandWords = /\b(evaluate|suggest one improvement|state the independent variable|control variable|anomalous|line of best fit|why might.*differ)\b/i;

  const hasIv = ivToken.length > 2 && lower.includes(ivToken);
  const hasDv = dvToken.length > 2 && lower.includes(dvToken);
  const hasWs = wsCommandWords.test(haystack);

  if (hasIv && (hasDv || hasWs)) {
    return { detected: true, evidence: `references "${ivToken}" and a Working-Scientifically command word` };
  }
  if (hasWs && hasIv) {
    return { detected: true, evidence: `references "${ivToken}" and an evaluate/improvement prompt` };
  }
  return { detected: false, evidence: `no question references "${ivToken}" alongside a WS command word` };
}

export interface RequiredPracticalOptions {
  subject?: string;
  topic?: string;
  yearGroup?: string;
  examBoard?: string;
}

/**
 * Stamp the chosen required practical onto `metadata.requiredPractical` and,
 * if the worksheet didn't actually include it, append a warning to
 * `metadata.postValidatorWarnings` so the existing teacher banner picks it
 * up. No-op when no KS4 science practical applies.
 */
export function applyRequiredPracticalTagging<W extends TaggableWorksheet>(
  worksheet: W,
  opts: RequiredPracticalOptions = {},
): W {
  const practicals = getRequiredPracticalsForTopic({
    subject: opts.subject || worksheet.metadata?.subject,
    topic: opts.topic || worksheet.metadata?.topic,
    yearGroup: opts.yearGroup || worksheet.metadata?.yearGroup,
    examBoard: opts.examBoard || worksheet.metadata?.examBoard,
    limit: 1,
  });
  if (practicals.length === 0) return worksheet;

  const p = practicals[0];
  const board = normaliseBoard(opts.examBoard || worksheet.metadata?.examBoard);
  const specCode = board ? p.specCodes[board] : Object.values(p.specCodes)[0] || p.title;
  const detection = detectPracticalInWorksheet(worksheet, p);

  const warnings: string[] = [];
  if (!detection.detected) {
    warnings.push(`[Required Practical] expected ${p.title} (${specCode}) — ${detection.evidence}.`);
  }

  const existingWarnings = Array.isArray(worksheet.metadata?.postValidatorWarnings)
    ? (worksheet.metadata!.postValidatorWarnings as string[])
    : [];
  return {
    ...worksheet,
    metadata: {
      ...(worksheet.metadata || {}),
      requiredPractical: {
        id: p.id,
        title: p.title,
        specCode,
        wsSkills: p.wsSkills,
        detected: detection.detected,
        evidence: detection.evidence,
      },
      postValidatorWarnings: [...existingWarnings, ...warnings],
    },
  } as W;
}
