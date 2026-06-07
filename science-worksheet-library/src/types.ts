/**
 * Science Worksheet Library — Type Definitions v2.0
 *
 * Each worksheet is a single JSON file describing a one-page A4-landscape
 * revision/practice sheet for a specific subtopic. The renderer converts
 * this to self-contained HTML; the generator produces PDF + PNG.
 *
 * Key design principles:
 * - Each subtopic gets its own bespoke layout (panels, diagrams, questions differ)
 * - Standard variant is authored first; ADHD variant uses same grid but calmer palette,
 *   chunked steps, checkboxes, progress tracker, simplified language
 * - Worksheets must fit one A4-landscape page (enforced by generator)
 * - Diagrams are print-safe inline SVGs keyed in diagrams.ts
 */

// ─── Variant ──────────────────────────────────────────────────────────────────

export type WorksheetVariant = 'standard' | 'adhd';

// ─── Header ───────────────────────────────────────────────────────────────────

export interface WorksheetHeader {
  /** Subject name, e.g. "Chemistry" */
  subject: string;
  /** Year group, e.g. "Year 10" */
  yearGroup: string;
  /** Main title, e.g. "Metallic Bonding" */
  title: string;
  /** Diagram label badge on the right, e.g. "Diagram A" (rendered as a navy badge) */
  diagramLabel?: string;
  /** Subtitle below title, e.g. "Interpretation & Practice" (blue italic) */
  subtitle?: string;
  /** Show a NAME / DATE box on the right (instead of a diagram label badge) */
  nameDateBox?: boolean;
  /** Title colour: "black" or "blue" (defaults to blue) */
  titleColor?: 'black' | 'blue';
  /** Draw a double horizontal rule under the title */
  titleUnderline?: boolean;
}

// ─── Key Vocabulary ───────────────────────────────────────────────────────────

export interface VocabTerm {
  term: string;
  definition: string;
}

// ─── Common Misconceptions ────────────────────────────────────────────────────

export interface Misconception {
  wrong: string;
  right: string;
}

// ─── Diagrams ─────────────────────────────────────────────────────────────────

export interface DiagramRef {
  /** Key into the diagrams.ts SVG library */
  id: string;
  /** Optional caption beneath the diagram */
  caption?: string;
  /** Optional width override (CSS value, e.g. "180px") */
  width?: string;
  /** Optional height override */
  height?: string;
}

// ─── Info Panels ──────────────────────────────────────────────────────────────

/**
 * Info panels appear in the top section of the worksheet.
 * They can contain diagrams, formulas, worked examples, or definitions.
 * Layout mode determines how many columns the info row uses.
 */
export type InfoPanelType =
  | 'diagram'        // A panel primarily showing a diagram with labels/definitions
  | 'formula'        // A formula box (e.g. concentration = mass / volume)
  | 'worked-example' // A fully worked calculation
  | 'definition'     // A key definition (full-width bar)
  | 'conversion'     // A conversion reminder box
  | 'vocab'          // Key vocabulary terms
  | 'misconceptions'; // Common misconceptions

export interface InfoPanel {
  /** Panel type — affects rendering style */
  type: InfoPanelType;
  /** Panel title (rendered as section header) */
  title: string;
  /** Main text content (supports basic markdown-like: **bold**, *italic*) */
  content?: string;
  /** Optional secondary text (e.g. definitions below a diagram) */
  secondaryContent?: string;
  /** Diagram reference (for diagram-type panels) */
  diagram?: DiagramRef;
  /** Formula lines (for formula-type panels), rendered as math expressions */
  formulaLines?: string[];
  /** Vocab terms (for vocab-type panels) */
  vocab?: VocabTerm[];
  /** Misconceptions (for misconceptions-type panels) */
  misconceptions?: Misconception[];
  /** Worked example steps (for worked-example panels) */
  workedSteps?: string[];
  /** Whether this panel spans full width (overrides column layout) */
  fullWidth?: boolean;
}

// ─── Questions ────────────────────────────────────────────────────────────────

export type QuestionType =
  | 'short-answer'
  | 'calculation'
  | 'fill-blank'
  | 'label-diagram'
  | 'explain'
  | 'compare'
  | 'conversion';

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface Question {
  /** Question number (rendered as badge) */
  number: number;
  /** Section title shown next to badge, e.g. "LABEL THE STRUCTURE" */
  sectionTitle: string;
  /** The question type — affects rendering/spacing */
  type: QuestionType;
  /** Main instruction/question text */
  text: string;
  /** Optional secondary instruction (e.g. "Use the conversion reminder above.") */
  secondaryText?: string;
  /** For calculations: answer unit suffix, e.g. "g/dm³" */
  answerUnit?: string;
  /** For label-diagram: word bank items */
  wordBank?: string[];
  /** For compare: table data */
  table?: TableData;
  /** For compare: options to circle */
  circleOptions?: string[];
  /** Diagram embedded in this question panel */
  diagram?: DiagramRef;
  /** Number of answer lines to render */
  answerLines?: number;
  /** Whether to show a large working box instead of lines */
  workingBox?: boolean;
  /** For ADHD variant: chunked step-by-step prompts */
  steps?: string[];
  /** For ADHD variant: show checkbox per step */
  checkboxes?: boolean;
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export interface WorksheetFooter {
  /** Quick revision tip (💡 TIP: ...) */
  tip?: string;
  /** Think deeper / extension prompt (✓ Think: ...) */
  thinkPrompt?: string;
}

// ─── ADHD-specific Configuration ──────────────────────────────────────────────

export interface AdhdConfig {
  /** Calmer palette overrides (CSS custom properties) */
  palette?: Record<string, string>;
  /** Show progress tracker bar at top */
  progressTracker?: boolean;
  /** Simplified language is used throughout (affects question text) */
  simplifiedLanguage?: boolean;
  /** Chunked steps enabled globally (individual questions define steps) */
  chunkedSteps?: boolean;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

/**
 * Layout modes:
 * - 'info-grid': 3-column info panels on top + 2×2 question grid below (Concentration)
 * - 'panel-pair': Full-width definition bar + 2 large question panels (Metallic Bonding)
 */
export type LayoutMode = 'info-grid' | 'panel-pair';

export interface LayoutConfig {
  /** Overall layout mode */
  mode: LayoutMode;
  /** Number of info panel columns (default: 3 for info-grid, ignored for panel-pair) */
  infoCols?: number;
  /** Number of question columns (default: 2) */
  questionCols?: number;
  /** Number of question rows (default: 2 for info-grid, 1 for panel-pair) */
  questionRows?: number;
}

// ─── Root Worksheet Object ────────────────────────────────────────────────────

export interface Worksheet {
  /** Schema version */
  version: '2.0';
  /** Variant type */
  variant: WorksheetVariant;
  /** Compact header info */
  header: WorksheetHeader;
  /** Layout configuration */
  layout: LayoutConfig;
  /** Info panels (top section — diagrams, formulas, worked examples, definitions) */
  infoPanels: InfoPanel[];
  /** Practice questions (bottom section — boxed with numbered badges) */
  questions: Question[];
  /** Footer content (tip + think prompt) */
  footer?: WorksheetFooter;
  /** ADHD-specific configuration (only present for adhd variant) */
  adhd?: AdhdConfig;
}
