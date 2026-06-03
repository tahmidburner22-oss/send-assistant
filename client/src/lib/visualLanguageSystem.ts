/**
 * visualLanguageSystem.ts
 *
 * June 2026 — Complete Visual Language System for Adaptly Worksheets.
 *
 * This module is the SINGLE SOURCE OF TRUTH for:
 *   - Semantic colours (7 tokens mapped to section types)
 *   - Section icons (mapped in WorksheetRenderer)
 *   - Response type indicators (□ ○ ✎ 🎨 🗣️)
 *   - Difficulty dots (● ●● ●●●)
 *   - Progress markers (① ② ③ … ⑳)
 *   - Flow arrows (➜ ↓ ↺ ⇒ ↔ ⤴ ⤵)
 *   - Border styles (solid=essential, dashed=optional, double=assessment)
 *   - Overlay priority rules
 *
 * The key is CONSISTENCY. If every worksheet uses exactly the same colours
 * and icons in the same way, pupils quickly learn the system and can
 * navigate tasks more independently.
 *
 * OVERLAY RULE: When an accessibility overlay is applied, the background
 * becomes the overlay colour, text becomes black, and ALL semantic colours
 * are removed. The overlay ALWAYS takes priority.
 */

// ─── Semantic Colours ────────────────────────────────────────────────────────
// Consistent visual language that teachers instantly understand.

export const SEMANTIC_COLOURS = {
  blue:   { meaning: "Information or teaching point", hex: "#1d4ed8", bg: "#eff6ff" },
  green:  { meaning: "Main task / activity", hex: "#15803d", bg: "#f0fdf4" },
  yellow: { meaning: "Hint, reminder, or support", hex: "#a16207", bg: "#fefce8" },
  orange: { meaning: "Important vocabulary", hex: "#c2410c", bg: "#fff7ed" },
  red:    { meaning: "Challenge or extension task", hex: "#b91c1c", bg: "#fef2f2" },
  purple: { meaning: "Reflection or self-assessment", hex: "#6d28d9", bg: "#faf5ff" },
  grey:   { meaning: "Teacher notes or optional content", hex: "#374151", bg: "#f9fafb" },
} as const;

// ─── Response Type Indicators ────────────────────────────────────────────────
// These symbols tell pupils HOW to respond to each question.

export const RESPONSE_TYPES = {
  tickBox:       { symbol: "□", label: "Tick box", description: "Tick the correct answer" },
  circleAnswer:  { symbol: "○", label: "Circle answer", description: "Circle the correct option" },
  writtenResponse: { symbol: "✎", label: "Written response", description: "Write your answer" },
  drawAnnotate:  { symbol: "🎨", label: "Draw/annotate", description: "Draw or annotate the diagram" },
  verbalResponse:{ symbol: "🗣️", label: "Verbal response", description: "Discuss with your partner" },
} as const;

export type ResponseType = keyof typeof RESPONSE_TYPES;

/**
 * Determines the response type indicator for a given section/question type.
 * Used by the renderer to prepend the correct symbol to each question.
 */
export function getResponseTypeForSection(sectionType: string, content?: string): ResponseType {
  const type = sectionType.toLowerCase();
  const text = (content || "").toLowerCase();

  if (type === "q-mcq" || type === "mcq_2col" || /circle|select|choose/i.test(text)) {
    return "circleAnswer";
  }
  if (type === "q-true-false" || type === "true_false" || /true.*false|tick/i.test(text)) {
    return "tickBox";
  }
  if (type === "q-draw" || type === "q-label-diagram" || type === "q-circuit" || type === "q-graph" ||
      /draw|sketch|label|annotate|diagram/i.test(text)) {
    return "drawAnnotate";
  }
  if (/discuss|partner|group|talk|verbal/i.test(text)) {
    return "verbalResponse";
  }
  // Default: written response
  return "writtenResponse";
}

// ─── Difficulty Indicators ───────────────────────────────────────────────────
// Shows pupils and teachers the difficulty level of each section.

export const DIFFICULTY_INDICATORS = {
  core:         { dots: "●", label: "Core", colour: "green", emoji: "🟢" },
  intermediate: { dots: "●●", label: "Intermediate", colour: "yellow", emoji: "🟡" },
  advanced:     { dots: "●●●", label: "Advanced", colour: "red", emoji: "🔴" },
} as const;

export type DifficultyLevel = keyof typeof DIFFICULTY_INDICATORS;

/**
 * Maps section types to difficulty levels for the dot indicators.
 */
export function getDifficultyForSection(sectionType: string): DifficultyLevel {
  const type = sectionType.toLowerCase();
  if (["guided", "recall", "q-true-false", "q-mcq", "q-gap-fill", "q-matching", "q-ordering"].includes(type)) {
    return "core";
  }
  if (["independent", "understanding", "q-short-answer", "q-data-table", "application"].includes(type)) {
    return "intermediate";
  }
  if (["challenge", "q-challenge", "q-extended", "extension"].includes(type)) {
    return "advanced";
  }
  return "core";
}

// ─── Progress Markers ────────────────────────────────────────────────────────
// Circled numbers for task sequencing.

export const PROGRESS_MARKERS = [
  "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩",
  "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱", "⑲", "⑳",
] as const;

/**
 * Returns the circled number marker for a given question index (0-based).
 * Falls back to "(N)" format for numbers > 20.
 */
export function getProgressMarker(index: number): string {
  if (index >= 0 && index < PROGRESS_MARKERS.length) {
    return PROGRESS_MARKERS[index];
  }
  return `(${index + 1})`;
}

// ─── Flow Arrows and Symbols ─────────────────────────────────────────────────
// Used to indicate flow, transitions, and relationships between sections.

export const FLOW_SYMBOLS = {
  nextStep:      { symbol: "➜", meaning: "Next step" },
  continueBelow: { symbol: "↓", meaning: "Continue below" },
  reviewRevisit: { symbol: "↺", meaning: "Review or revisit" },
  conclusion:    { symbol: "⇒", meaning: "Conclusion or answer" },
  compare:       { symbol: "↔", meaning: "Compare" },
  extension:     { symbol: "⤴", meaning: "Extension activity" },
  support:       { symbol: "⤵", meaning: "Support activity" },
} as const;

/**
 * Returns the appropriate flow arrow for transitioning between sections.
 */
export function getFlowArrow(fromType: string, toType: string): string {
  const to = toType.toLowerCase();
  if (to === "challenge" || to === "q-challenge" || to === "extension") {
    return FLOW_SYMBOLS.extension.symbol;
  }
  if (to === "send-support" || to === "sentence-starters" || to === "word-bank") {
    return FLOW_SYMBOLS.support.symbol;
  }
  if (to === "self-reflection" || to === "self-assessment") {
    return FLOW_SYMBOLS.conclusion.symbol;
  }
  if (to === "retrieval" || to === "prior-knowledge") {
    return FLOW_SYMBOLS.reviewRevisit.symbol;
  }
  return FLOW_SYMBOLS.nextStep.symbol;
}

// ─── Section Icons (Activity Type) ──────────────────────────────────────────
// These map to the universal icon language for worksheets.

export const ACTIVITY_ICONS = {
  read:        { emoji: "📖", label: "Read" },
  listen:      { emoji: "👂", label: "Listen" },
  write:       { emoji: "✏️", label: "Write" },
  discuss:     { emoji: "💬", label: "Discuss" },
  investigate: { emoji: "🔍", label: "Investigate" },
  think:       { emoji: "🧠", label: "Think carefully" },
  hint:        { emoji: "💡", label: "Hint" },
  challenge:   { emoji: "⭐", label: "Challenge" },
  timed:       { emoji: "⏱️", label: "Timed activity" },
  check:       { emoji: "✓", label: "Check your work" },
  objective:   { emoji: "🎯", label: "Learning objective" },
  vocabulary:  { emoji: "📚", label: "Key vocabulary" },
  partner:     { emoji: "🤝", label: "Partner activity" },
  group:       { emoji: "👥", label: "Group activity" },
} as const;

/**
 * Returns the activity icon for a given section type.
 */
export function getActivityIcon(sectionType: string, content?: string): string {
  const type = sectionType.toLowerCase();
  const text = (content || "").toLowerCase();

  if (type === "objective" || type === "learning-objective") return ACTIVITY_ICONS.objective.emoji;
  if (type === "vocabulary" || type === "key-terms") return ACTIVITY_ICONS.vocabulary.emoji;
  if (type === "challenge" || type === "q-challenge") return ACTIVITY_ICONS.challenge.emoji;
  if (type === "example" || type === "worked-example") return ACTIVITY_ICONS.think.emoji;
  if (type === "send-support" || type === "reminder-box") return ACTIVITY_ICONS.hint.emoji;
  if (type === "self-reflection" || type === "self-assessment") return ACTIVITY_ICONS.check.emoji;
  if (/partner|pair/i.test(text)) return ACTIVITY_ICONS.partner.emoji;
  if (/group|team/i.test(text)) return ACTIVITY_ICONS.group.emoji;
  if (/discuss|talk/i.test(text)) return ACTIVITY_ICONS.discuss.emoji;
  if (/investigat|explor/i.test(text)) return ACTIVITY_ICONS.investigate.emoji;
  if (/read|passage|text/i.test(text)) return ACTIVITY_ICONS.read.emoji;
  if (/timed|minute|second/i.test(text)) return ACTIVITY_ICONS.timed.emoji;
  return ACTIVITY_ICONS.write.emoji;
}

// ─── Border Styles ───────────────────────────────────────────────────────────
// Communicate task importance through border treatment.

export const BORDER_STYLES = {
  solid:   { meaning: "Essential task", css: "solid" },
  dashed:  { meaning: "Optional task", css: "dashed" },
  double:  { meaning: "Assessment task", css: "double" },
  rounded: { meaning: "Support materials", borderRadius: "8px" },
  shaded:  { meaning: "Examples", useBgShading: true },
} as const;

/**
 * Returns the border style for a section type.
 */
export function getBorderStyleForSection(sectionType: string): keyof typeof BORDER_STYLES {
  const type = sectionType.toLowerCase();
  // Assessment sections
  if (["self-reflection", "self-assessment", "exit-ticket"].includes(type)) return "double";
  // Optional / teacher content
  if (["teacher-notes", "mark-scheme", "answers", "word-bank", "sentence-starters"].includes(type)) return "dashed";
  // Support materials
  if (["send-support", "reminder-box"].includes(type)) return "rounded";
  // Examples
  if (["example", "worked-example"].includes(type)) return "shaded";
  // Everything else is essential
  return "solid";
}

// ─── Overlay Priority ────────────────────────────────────────────────────────
// When an accessibility overlay is active, ALL visual language colours are
// suppressed. The overlay colour becomes the background and text becomes black.

/**
 * Determines if an overlay is active (non-white, non-transparent colour).
 * When active, the renderer must suppress ALL semantic colours.
 */
export function isOverlayActive(overlayColor?: string | null): boolean {
  if (!overlayColor) return false;
  const c = overlayColor.trim().toLowerCase();
  return c !== "" && c !== "#ffffff" && c !== "#fff" && c !== "white" && c !== "transparent" && c !== "none";
}

/**
 * Returns the style object when overlay is active.
 * All headers, borders, and backgrounds become overlay colour; text is black.
 */
export function getOverlayStyle(overlayColor: string) {
  return {
    border: "#000000",
    bg: overlayColor,
    badge: "#000000",
    badgeBg: overlayColor,
    headerBg: overlayColor,
    headerText: "#000000",
    // Structural formatting (icons, pills, layout) is preserved
    // Only colours are suppressed
  };
}

// ─── Example Legend (for Pupil Reference) ────────────────────────────────────
// This can be printed on the first page of any worksheet.

export const PUPIL_LEGEND = [
  { icon: "🎯", label: "Objective", description: "What you will learn today" },
  { icon: "📚", label: "Vocabulary", description: "Important words to know" },
  { icon: "🔵", label: "Information", description: "Read this to learn" },
  { icon: "🟢", label: "Main Task", description: "Complete these questions" },
  { icon: "💡", label: "Hint", description: "Extra help if you need it" },
  { icon: "⭐", label: "Challenge", description: "Stretch yourself" },
  { icon: "✓", label: "Check Your Work", description: "Review your answers" },
  { icon: "🟣", label: "Reflection", description: "How well did you do?" },
  { icon: "●", label: "Core", description: "Everyone should complete these" },
  { icon: "●●", label: "Intermediate", description: "Most students should try these" },
  { icon: "●●●", label: "Advanced", description: "Challenge yourself with these" },
] as const;

// ─── Exam-Style Mode (Maths Genie Layout) ────────────────────────────────────
// When exam-style mode is active, the worksheet uses minimal clean layout
// matching Edexcel/AQA/OCR actual paper style.

export const EXAM_STYLE_CONFIG = {
  /** No section colour headers — just question numbers */
  suppressSectionHeaders: true,
  /** No decorative icons */
  suppressIcons: true,
  /** No difficulty dots (exam papers don't show difficulty) */
  suppressDifficultyDots: true,
  /** Marks shown in brackets: (3 marks) */
  marksFormat: "round-brackets" as const,
  /** Generous working lines */
  defaultWorkingLines: 6,
  /** Question numbers are bold, left-aligned */
  questionNumberStyle: "bold-left" as const,
  /** No word banks or hints (exam conditions) */
  suppressScaffolding: true,
  /** Wide margins for print */
  margins: { top: "2cm", bottom: "2cm", left: "2.5cm", right: "2cm" },
  /** Font: clean, professional */
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "11pt",
  /** Line spacing for working out */
  lineSpacing: "1.8",
} as const;

/**
 * Returns true if the worksheet should use exam-style minimal layout.
 * Triggered by: examStyle=true flag OR worksheet type is "past-paper" or
 * "exam-practice".
 */
export function shouldUseExamStyleLayout(metadata?: Record<string, unknown>): boolean {
  if (!metadata) return false;
  if (metadata.examStyle === true) return true;
  if (metadata.worksheetType === "exam-practice" || metadata.worksheetType === "past-paper") return true;
  return false;
}
