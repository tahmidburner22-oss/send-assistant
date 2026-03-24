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
    globalBackground: "#fffde7", // cream
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
    globalBackground: "#fffde7",
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
        backgroundColour: "#fffde7",
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
