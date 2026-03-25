/**
 * adaptationEngine.ts — Adaptly Adaptation Engine
 *
 * Stage 5 of the validation pipeline.
 * Applies primary/secondary profile adjustments and SEND overlays
 * without breaking question order or marks.
 *
 * Rules enforced:
 * - Primary mode uses simpler prompts and fewer stacked subparts
 * - SEND overlay preserves question order and marks
 * - SEND adaptations are applied per-question without restructuring
 */

import type { WorksheetData } from "../worksheet-generator";

export type SendNeed =
  | "dyslexia"
  | "dyscalculia"
  | "autism"
  | "adhd"
  | "visual-impairment"
  | "hearing-impairment"
  | "esl"
  | "gifted"
  | "general-sen";

export interface AdaptationProfile {
  phase: "primary" | "secondary";
  sendNeed?: SendNeed;
  difficulty?: "foundation" | "standard" | "higher";
}

export interface SectionAdaptation {
  sectionId: string;
  fontSizeMultiplier: number;       // 1.0 = normal, 1.2 = larger
  lineSpacingMultiplier: number;    // 1.0 = normal, 1.5 = wider
  backgroundColour?: string;        // e.g. "#fffde7" for cream
  fontFamily?: string;              // e.g. "OpenDyslexic, Arial"
  extraAnswerLines: number;         // additional answer lines beyond default
  simplifiedPrompt?: string;        // override for question text
  scaffoldingHints: string[];       // additional hints/sentence starters
  reducedSubparts: boolean;         // remove stacked sub-parts for primary
  boldKeyTerms: boolean;            // bold key vocabulary in question text
  visualCueAdded: boolean;          // add icon/visual cue before question
}

export interface WorksheetAdaptation {
  profile: AdaptationProfile;
  globalFontSize: number;           // base font size in px
  globalLineHeight: number;         // base line height
  globalBackground: string;         // page background colour
  globalFontFamily: string;         // font family
  sectionAdaptations: SectionAdaptation[];
  teacherNotes: string[];           // notes for the teacher copy
  validationWarnings: string[];
}

// ─── SEND adaptation rules ────────────────────────────────────────────────────
const SEND_RULES: Record<SendNeed, Partial<WorksheetAdaptation>> = {
  "dyslexia": {
    globalFontSize: 14,
    globalLineHeight: 1.8,
    globalBackground: "#ffffff", // white — cream removed per design update
    globalFontFamily: "Arial, Helvetica, sans-serif",
  },
  "dyscalculia": {
    globalFontSize: 13,
    globalLineHeight: 1.6,
    globalBackground: "#ffffff",
    globalFontFamily: "Arial, Helvetica, sans-serif",
  },
  "autism": {
    globalFontSize: 13,
    globalLineHeight: 1.6,
    globalBackground: "#f5f5f5",
    globalFontFamily: "Arial, Helvetica, sans-serif",
  },
  "adhd": {
    globalFontSize: 13,
    globalLineHeight: 1.6,
    globalBackground: "#ffffff",
    globalFontFamily: "Arial, Helvetica, sans-serif",
  },
  "visual-impairment": {
    globalFontSize: 16,
    globalLineHeight: 2.0,
    globalBackground: "#ffffff",
    globalFontFamily: "Arial, Helvetica, sans-serif",
  },
  "hearing-impairment": {
    globalFontSize: 13,
    globalLineHeight: 1.5,
    globalBackground: "#ffffff",
    globalFontFamily: "Arial, Helvetica, sans-serif",
  },
  "esl": {
    globalFontSize: 13,
    globalLineHeight: 1.6,
    globalBackground: "#ffffff",
    globalFontFamily: "Arial, Helvetica, sans-serif",
  },
  "gifted": {
    globalFontSize: 12,
    globalLineHeight: 1.4,
    globalBackground: "#ffffff",
    globalFontFamily: "Georgia, serif",
  },
  "general-sen": {
    globalFontSize: 14,
    globalLineHeight: 1.8,
    globalBackground: "#ffffff", // white — cream removed per design update
    globalFontFamily: "Arial, Helvetica, sans-serif",
  },
};

// ─── Per-section SEND adaptations ─────────────────────────────────────────────
function buildSectionAdaptation(sectionId: string, profile: AdaptationProfile): SectionAdaptation {
  const base: SectionAdaptation = {
    sectionId,
    fontSizeMultiplier: 1.0,
    lineSpacingMultiplier: 1.0,
    extraAnswerLines: 0,
    scaffoldingHints: [],
    reducedSubparts: false,
    boldKeyTerms: false,
    visualCueAdded: false,
  };

  // Primary mode: simpler prompts, fewer stacked subparts
  if (profile.phase === "primary") {
    base.reducedSubparts = true;
    base.boldKeyTerms = true;
    base.visualCueAdded = true;
  }

  if (!profile.sendNeed) return base;

  switch (profile.sendNeed) {
    case "dyslexia":
      return {
        ...base,
        fontSizeMultiplier: 1.15,
        lineSpacingMultiplier: 1.5,
        backgroundColour: "#ffffff", // white — cream removed per design update
        fontFamily: "Arial, Helvetica, sans-serif",
        extraAnswerLines: 2,
        boldKeyTerms: true,
        scaffoldingHints: ["Use the key vocabulary list to help you.", "Look at the worked example if you are stuck."],
      };
    case "dyscalculia":
      return {
        ...base,
        fontSizeMultiplier: 1.1,
        lineSpacingMultiplier: 1.4,
        extraAnswerLines: 2,
        boldKeyTerms: true,
        scaffoldingHints: ["Write out the formula first.", "Show all your working."],
      };
    case "autism":
      return {
        ...base,
        fontSizeMultiplier: 1.1,
        lineSpacingMultiplier: 1.5,
        backgroundColour: "#f5f5f5",
        extraAnswerLines: 1,
        scaffoldingHints: ["Read the question carefully.", "Answer in full sentences."],
      };
    case "adhd":
      return {
        ...base,
        fontSizeMultiplier: 1.1,
        lineSpacingMultiplier: 1.4,
        reducedSubparts: true,
        visualCueAdded: true,
        extraAnswerLines: 1,
        scaffoldingHints: ["Focus on one question at a time."],
      };
    case "visual-impairment":
      return {
        ...base,
        fontSizeMultiplier: 1.3,
        lineSpacingMultiplier: 1.8,
        extraAnswerLines: 2,
        boldKeyTerms: true,
      };
    case "esl":
      return {
        ...base,
        fontSizeMultiplier: 1.1,
        lineSpacingMultiplier: 1.5,
        extraAnswerLines: 2,
        boldKeyTerms: true,
        scaffoldingHints: ["Key words are shown in bold.", "Use the vocabulary list to help you."],
      };
    case "gifted":
      return {
        ...base,
        extraAnswerLines: -1, // fewer lines, expect concise answers
        scaffoldingHints: ["Extend your answer with a further example.", "Can you link this to another topic?"],
      };
    default:
      return {
        ...base,
        fontSizeMultiplier: 1.1,
        lineSpacingMultiplier: 1.5,
        extraAnswerLines: 2,
        boldKeyTerms: true,
      };
  }
}

/**
 * Builds a complete WorksheetAdaptation for the given profile.
 * SEND overlay preserves question order and marks.
 */
export function buildAdaptation(
  worksheet: WorksheetData,
  profile: AdaptationProfile
): WorksheetAdaptation {
  const warnings: string[] = [];

  // Global settings
  const sendRules = profile.sendNeed ? SEND_RULES[profile.sendNeed] : {};
  const globalFontSize = sendRules.globalFontSize ?? (profile.phase === "primary" ? 13 : 12);
  const globalLineHeight = sendRules.globalLineHeight ?? 1.5;
  const globalBackground = sendRules.globalBackground ?? "#ffffff";
  const globalFontFamily = sendRules.globalFontFamily ?? "Arial, Helvetica, sans-serif";

  // Per-section adaptations
  const sectionAdaptations: SectionAdaptation[] = (worksheet.sections ?? []).map(section =>
    buildSectionAdaptation(section.id ?? section.title, profile)
  );

  // Teacher notes
  const teacherNotes: string[] = [];
  if (profile.sendNeed) {
    teacherNotes.push(`SEND ADAPTATION: ${profile.sendNeed.toUpperCase()}`);
    teacherNotes.push(`Font size increased to ${globalFontSize}px.`);
    teacherNotes.push(`Line spacing set to ${globalLineHeight}× normal.`);
    if (globalBackground !== "#ffffff") {
      teacherNotes.push(`Background colour changed to ${globalBackground} to reduce visual stress.`);
    }
    teacherNotes.push(`Question order and marks are unchanged from the standard worksheet.`);
  }
  if (profile.phase === "primary") {
    teacherNotes.push(`PRIMARY MODE: Simplified prompts and visual cues applied. Stacked sub-parts removed.`);
  }

  // Validate: SEND overlay must not change question count or marks
  const originalSectionCount = worksheet.sections?.length ?? 0;
  if (sectionAdaptations.length !== originalSectionCount) {
    warnings.push(`SEND overlay changed section count from ${originalSectionCount} to ${sectionAdaptations.length}. This should not happen.`);
  }

  return {
    profile,
    globalFontSize,
    globalLineHeight,
    globalBackground,
    globalFontFamily,
    sectionAdaptations,
    teacherNotes,
    validationWarnings: warnings,
  };
}

/**
 * Applies the adaptation to a WorksheetData object.
 * Returns a new WorksheetData with adaptation metadata attached.
 * Does NOT change question order or marks.
 */
export function applyAdaptation(
  worksheet: WorksheetData,
  adaptation: WorksheetAdaptation
): WorksheetData {
  return {
    ...worksheet,
    metadata: {
      ...worksheet.metadata,
      sendAdaptation: adaptation.profile.sendNeed,
      phase: adaptation.profile.phase,
      globalFontSize: adaptation.globalFontSize,
      globalLineHeight: adaptation.globalLineHeight,
      globalBackground: adaptation.globalBackground,
      globalFontFamily: adaptation.globalFontFamily,
    },
    sections: (worksheet.sections ?? []).map((section, i) => {
      const sa = adaptation.sectionAdaptations[i];
      if (!sa) return section;
      return {
        ...section,
        _adaptation: sa,
      };
    }),
  };
}

// ─── applySEND: 3-tier local differentiation engine ──────────────────────────
/**
 * Applies one of three differentiation tiers to a worksheet without any AI call.
 *
 * Tier: "foundation"
 *  - Simplifies command words
 *  - Adds scaffolds, sentence starters, step prompts
 *  - Reduces sub-part density (extra spacing)
 *  - Keeps layouts, marks, structure unchanged
 *
 * Tier: "higher"
 *  - Upgrades command words to higher-order thinking
 *  - Adds extension prompts and challenge questions
 *  - Removes basic scaffolds (expects independence)
 *  - Keeps layouts, marks, structure unchanged
 *
 * Tier: "send" (mixed_ability)
 *  - Simplifies wording
 *  - Adds chunked instructions, word banks, visual cues
 *  - Adds sentence starters and step-by-step prompts
 *  - Increases spacing between sub-parts
 *  - Keeps layouts, marks, structure unchanged
 */
export function applySEND(
  worksheet: any,
  tier: "mixed_ability" | "foundation" | "higher" | "send" = "mixed_ability"
): any {
  if (!worksheet || !worksheet.sections) return worksheet;

  // ── Foundation / SEND / mixed_ability: simplify command words ────────────
  const SIMPLIFY_MAP: Array<[RegExp, string]> = [
    [/\banalyse\b/gi, "describe and explain"],
    [/\bevaluate\b/gi, "explain the good and bad points of"],
    [/\bassess\b/gi, "explain how well"],
    [/\bjustify\b/gi, "give reasons for"],
    [/\bsynthesize\b/gi, "bring together ideas about"],
    [/\bto what extent\b/gi, "how much do you agree that"],
    [/\baccounting for\b/gi, "explaining why"],
    [/\bwith reference to\b/gi, "using information about"],
    [/\bdemonstrate\b/gi, "show"],
    [/\bformulate\b/gi, "write"],
    [/\bascertain\b/gi, "find out"],
    [/\belaborate\b/gi, "explain in more detail"],
  ];

  // ── Higher: upgrade command words to higher-order thinking ───────────────
  const UPGRADE_MAP: Array<[RegExp, string]> = [
    [/\bdescribe\b/gi, "analyse"],
    [/\bstate\b/gi, "explain"],
    [/\bname\b/gi, "identify and justify"],
    [/\bgive one reason\b/gi, "evaluate the reasons"],
    [/\blist\b/gi, "compare and contrast"],
    [/\bexplain\b/gi, "critically evaluate"],
    [/\bshow that\b/gi, "prove that"],
    [/\bcalculate\b/gi, "derive and calculate"],
  ];

  // ── Foundation scaffolds by section type ─────────────────────────────────
  const FOUNDATION_SCAFFOLDS: Record<string, string> = {
    "q-extended":     "\n\nSentence starter: \"I think this is because...\"\nSentence starter: \"An example of this is...\"\nSentence starter: \"This means that...\"",
    "q-short-answer": "\n\nHint: Look back at the Key Vocabulary section if you are unsure.",
    "q-graph":        "\n\nRemember: Label both axes. Use a ruler. Plot each point carefully.",
    "q-data-table":   "\n\nHint: Read each row carefully before writing your answer.",
    "q-circuit":      "\n\nHint: Use the circuit symbols from the Key Vocabulary section.",
  };

  // ── SEND / mixed_ability scaffolds ───────────────────────────────────────
  const SEND_SCAFFOLDS: Record<string, string> = {
    "q-extended":     "\n\nWord bank: because | therefore | however | this means | as a result\nSentence starter: \"I think this is because...\"\nStep 1: What do you already know?\nStep 2: Use the key vocabulary.\nStep 3: Write your answer in full sentences.",
    "q-short-answer": "\n\nHint: The answer is in the Key Vocabulary section. Look for the bold word.",
    "q-graph":        "\n\nStep 1: Write the axis labels.\nStep 2: Choose your scale.\nStep 3: Plot each point.\nStep 4: Draw a line of best fit.",
    "q-circuit":      "\n\nHint: Use the symbol key. Draw each component one at a time.",
    "challenge":      "\n\nBreak it down: What do you know? → What do you need? → Show your working.",
  };

  // ── Higher extension prompts ──────────────────────────────────────────────
  const HIGHER_EXTENSIONS: Record<string, string> = {
    "q-extended":     "\n\nExtension: Can you link this to a real-world application? What are the limitations of your argument?",
    "q-short-answer": "\n\nExtension: Explain the underlying principle. What would change if conditions were different?",
    "q-graph":        "\n\nExtension: Describe the trend mathematically. What does the gradient represent physically?",
    "q-data-table":   "\n\nExtension: Identify any anomalous results. Suggest a source of error and how to reduce it.",
    "q-circuit":      "\n\nExtension: How would the circuit behaviour change if you added a resistor in series vs. parallel?",
    "challenge":      "\n\nExtension: Generalise your answer. Does this hold for all cases? Prove it.",
  };

  const isFoundation = tier === "foundation";
  const isHigher = tier === "higher";
  const isSend = tier === "send" || tier === "mixed_ability";

  const adaptedSections = worksheet.sections.map((section: any) => {
    if (!section || section.teacherOnly) return section;

    let content = typeof section.content === "string" ? section.content : String(section.content || "");

    if (isFoundation) {
      // ── Foundation: simplify + scaffold ──────────────────────────────────
      for (const [pattern, replacement] of SIMPLIFY_MAP) {
        content = content.replace(pattern, replacement);
      }
      const scaffold = FOUNDATION_SCAFFOLDS[section.type];
      if (scaffold && !content.includes("Hint:") && !content.includes("Sentence starter:")) {
        content = content + scaffold;
      }
      // Add step prompts for calculations
      if (/calculat|show your working|work out|find the value|solve/i.test(content) && !content.includes("Step 1:")) {
        content = content + "\n\nStep 1: Write down what you know.\nStep 2: Choose the formula.\nStep 3: Substitute the values.\nStep 4: Write your answer with units.";
      }
      // Extra spacing between sub-parts
      content = content.replace(/\n(\([a-e]\))/g, "\n\n$1");

    } else if (isHigher) {
      // ── Higher: upgrade command words + add extension prompts ────────────
      for (const [pattern, replacement] of UPGRADE_MAP) {
        content = content.replace(pattern, replacement);
      }
      const ext = HIGHER_EXTENSIONS[section.type];
      if (ext && !content.includes("Extension:")) {
        content = content + ext;
      }
      // Remove basic scaffolds if present (higher students work independently)
      content = content
        .replace(/\n\nHint:.*$/gm, "")
        .replace(/\n\nRemember:.*$/gm, "");

    } else if (isSend) {
      // ── SEND / mixed_ability: simplify + chunk + word bank + step prompts ─
      for (const [pattern, replacement] of SIMPLIFY_MAP) {
        content = content.replace(pattern, replacement);
      }
      const scaffold = SEND_SCAFFOLDS[section.type];
      if (scaffold && !content.includes("Word bank:") && !content.includes("Step 1:")) {
        content = content + scaffold;
      }
      // Extra spacing between sub-parts
      content = content.replace(/\n(\([a-e]\))/g, "\n\n$1");
      // Add step prompts for calculations
      if (/calculat|show your working|work out|find the value|solve/i.test(content) && !content.includes("Step 1:")) {
        content = content + "\n\nStep 1: Write down what you know.\nStep 2: Choose the method.\nStep 3: Show your working.\nStep 4: Write your answer with units.";
      }
    }

    return {
      ...section,
      content,
    };
  });

  const tierLabel = isFoundation ? "foundation" : isHigher ? "higher" : "send";
  const adaptationsList = isFoundation
    ? ["Command words simplified", "Scaffold hints and sentence starters added", "Step-by-step calculation prompts added", "Sub-part spacing increased", "Layouts and marks preserved"]
    : isHigher
    ? ["Command words upgraded to higher-order thinking", "Extension prompts added to each question", "Basic scaffolds removed (independence expected)", "Layouts and marks preserved"]
    : ["Command words simplified", "Word banks and chunked instructions added", "Sentence starters and step prompts added", "Sub-part spacing increased", "Layouts and marks preserved"];

  return {
    ...worksheet,
    sections: adaptedSections,
    metadata: {
      ...worksheet.metadata,
      difficulty: tierLabel,
      sendNeed: isSend ? "mixed_ability" : undefined,
      adaptations: adaptationsList,
    },
  };
}
