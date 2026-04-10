/**
 * Overlay Engine
 *
 * Pure function interface for applying worksheet overlays.
 * Overlays are applied in a fixed order and MUST NOT alter:
 *  - Section IDs
 *  - Section order (except retrieval injection after LO)
 *  - Diagram slot IDs or imageUrl fields
 *  - Question numbering
 *
 * Contract:
 *   applyOverlays(baseWorksheet, overlays): RenderedWorksheet
 *
 * Structural integrity is verified before and after via a structural hash.
 */

import { v4 as uuidv4 } from "uuid";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WorksheetSection {
  id: string;
  type: string;
  title?: string;
  label?: string;
  content?: string;
  marks?: number;
  imageUrl?: string;
  assetRef?: string;
  isOverlay?: boolean;
  teacherOnly?: boolean;
  [key: string]: unknown;
}

export interface OverlayParams {
  retrievalTopic?: string | null;
  additionalInstructions?: string | null;
  sendNeed?: string | null;
  readingAge?: string | null;
}

export interface OverlayResult {
  sections: WorksheetSection[];
  appliedOverlays: AppliedOverlay[];
  structuralHash: string;
  baseStructuralHash: string;
  structurePreserved: boolean;
}

export interface AppliedOverlay {
  type: "retrieval" | "additional_instructions" | "send_need" | "reading_age";
  params: Record<string, unknown>;
  appliedAt: string;
}

// ── Structural hash ───────────────────────────────────────────────────────────

/**
 * Compute a structural hash from section IDs, types, and diagram slot IDs.
 * This hash changes only if the structure changes — not if text content changes.
 */
export function computeStructuralHash(sections: WorksheetSection[]): string {
  const structural = sections
    .filter(s => !s.isOverlay) // exclude overlay-injected sections
    .map(s => `${s.id}:${s.type}:${s.assetRef || s.imageUrl || ""}`)
    .join("|");
  // Simple deterministic hash (djb2)
  let hash = 5381;
  for (let i = 0; i < structural.length; i++) {
    hash = ((hash << 5) + hash) ^ structural.charCodeAt(i);
    hash = hash >>> 0; // convert to unsigned 32-bit
  }
  return hash.toString(16).padStart(8, "0");
}

// ── Overlay application ───────────────────────────────────────────────────────

const SEND_LABELS: Record<string, string> = {
  dyslexia: "Dyslexia",
  adhd: "ADHD / Focus Support",
  esl: "EAL / English as Additional Language",
  visual: "Visual Impairment Support",
  asd: "Autism Spectrum Support",
  low_literacy: "Low Literacy Support",
  dyscalculia: "Dyscalculia Support",
  memory: "Working Memory Support",
};

/**
 * Apply overlays to a base sections array in fixed order:
 *  1. SEND adaptation note
 *  2. Reading age note (merged with SEND note if both present)
 *  3. Retrieval section injection (after learning objective)
 *  4. Additional instructions note
 *
 * Returns a new array — never mutates the original.
 */
export function applyOverlays(
  baseSections: WorksheetSection[],
  overlays: OverlayParams
): OverlayResult {
  // Deep clone to avoid mutating the original
  let result: WorksheetSection[] = JSON.parse(JSON.stringify(baseSections));
  const baseStructuralHash = computeStructuralHash(result);
  const appliedOverlays: AppliedOverlay[] = [];

  // ── 1. SEND need note ────────────────────────────────────────────────────────
  if (overlays.sendNeed && overlays.sendNeed !== "none") {
    const sendLabel = SEND_LABELS[overlays.sendNeed] || overlays.sendNeed;
    const readingAgeNote = overlays.readingAge
      ? ` | Reading age adjusted to ${overlays.readingAge}`
      : "";
    const sendNote: WorksheetSection = {
      id: `send-note-overlay-${Date.now()}`,
      type: "teacher-note",
      title: "SEND Adaptations Applied",
      content: `SEND adaptations applied: ${sendLabel}${readingAgeNote}. Formatting, font size, line spacing and language complexity have been adjusted accordingly.`,
      isOverlay: true,
      teacherOnly: false,
    };
    // Replace existing SEND note or prepend
    const existingIdx = result.findIndex(s => s.id?.startsWith("send-note-overlay"));
    if (existingIdx >= 0) {
      result[existingIdx] = sendNote;
    } else {
      result.unshift(sendNote);
    }
    appliedOverlays.push({
      type: "send_need",
      params: { sendNeed: overlays.sendNeed, sendLabel },
      appliedAt: new Date().toISOString(),
    });
  }

  // ── 2. Reading age (standalone, if no SEND need) ─────────────────────────────
  if (overlays.readingAge && (!overlays.sendNeed || overlays.sendNeed === "none")) {
    const readingNote: WorksheetSection = {
      id: `reading-age-overlay-${Date.now()}`,
      type: "teacher-note",
      title: "Reading Age Adjustment",
      content: `Reading age adjusted to ${overlays.readingAge}. Language complexity and vocabulary have been simplified accordingly.`,
      isOverlay: true,
      teacherOnly: false,
    };
    result.unshift(readingNote);
    appliedOverlays.push({
      type: "reading_age",
      params: { readingAge: overlays.readingAge },
      appliedAt: new Date().toISOString(),
    });
  }

  // ── 3. Retrieval section injection ──────────────────────────────────────────
  if (overlays.retrievalTopic) {
    const loIdx = result.findIndex(
      s => s.type === "learning-objective" || s.type === "objective" || s.type === "lo"
    );
    const insertAt = loIdx >= 0 ? loIdx + 1 : Math.min(2, result.length);
    const retrievalSection: WorksheetSection = {
      id: `retrieval-overlay-${Date.now()}`,
      type: "retrieval",
      title: "RETRIEVAL PRACTICE",
      label: "RETRIEVAL",
      content: [
        `Retrieval topic: ${overlays.retrievalTopic}`,
        "",
        `1. What do you remember about ${overlays.retrievalTopic}? Write down 3 key facts.`,
        "",
        `2. Define a key term from ${overlays.retrievalTopic}:`,
        "",
        `3. Give one example related to ${overlays.retrievalTopic}:`,
      ].join("\n"),
      marks: 6,
      isOverlay: true,
    };
    result.splice(insertAt, 0, retrievalSection);
    appliedOverlays.push({
      type: "retrieval",
      params: { retrievalTopic: overlays.retrievalTopic, insertedAt: insertAt },
      appliedAt: new Date().toISOString(),
    });
  }

  // ── 4. Additional instructions note ─────────────────────────────────────────
  if (overlays.additionalInstructions) {
    // Annotate the key-vocab section if present
    const vocabIdx = result.findIndex(
      s => s.type === "key-terms" || s.type === "vocabulary" || s.type === "key-vocab"
    );
    if (vocabIdx >= 0) {
      result[vocabIdx] = {
        ...result[vocabIdx],
        additionalInstructions: overlays.additionalInstructions,
      };
    }
    // Add a teacher note at the top
    const noteSection: WorksheetSection = {
      id: `additional-note-overlay-${Date.now()}`,
      type: "teacher-note",
      title: "Additional Requirements",
      content: `Additional requirement applied: ${overlays.additionalInstructions}`,
      isOverlay: true,
      teacherOnly: false,
    };
    result.unshift(noteSection);
    appliedOverlays.push({
      type: "additional_instructions",
      params: { instructions: overlays.additionalInstructions },
      appliedAt: new Date().toISOString(),
    });
  }

  // ── Structural integrity check ───────────────────────────────────────────────
  const finalStructuralHash = computeStructuralHash(result);
  const structurePreserved = finalStructuralHash === baseStructuralHash;

  if (!structurePreserved) {
    // This should never happen — overlays only add/annotate, never remove base sections
    console.warn(
      "[overlayEngine] Structural hash mismatch after overlays!",
      { baseStructuralHash, finalStructuralHash }
    );
  }

  return {
    sections: result,
    appliedOverlays,
    structuralHash: finalStructuralHash,
    baseStructuralHash,
    structurePreserved,
  };
}

/**
 * Extract the base structure from a sections array.
 * Returns an object with section IDs, types, and diagram slot IDs.
 * This is stored as base_structure_json on library entries.
 */
export function extractBaseStructure(sections: WorksheetSection[]): {
  sectionIds: string[];
  sectionTypes: string[];
  diagramSlotIds: string[];
  questionIds: string[];
  structuralHash: string;
} {
  const baseSections = sections.filter(s => !s.isOverlay);
  return {
    sectionIds: baseSections.map(s => s.id),
    sectionTypes: baseSections.map(s => s.type),
    diagramSlotIds: baseSections
      .filter(s => s.imageUrl || s.assetRef || s.type?.includes("diagram"))
      .map(s => s.id),
    questionIds: baseSections
      .filter(s => s.type?.startsWith("q-") || s.type?.startsWith("question"))
      .map(s => s.id),
    structuralHash: computeStructuralHash(baseSections),
  };
}

/**
 * Extract diagram slots from a sections array.
 * Returns an array of slot descriptors for the diagram_slots_json column.
 */
export function extractDiagramSlots(sections: WorksheetSection[]): Array<{
  sectionId: string;
  slotType: string;
  assetRef?: string;
  imageUrl?: string;
  required: boolean;
}> {
  return sections
    .filter(s => !s.isOverlay && (s.imageUrl || s.assetRef || s.type?.includes("diagram") || s.type === "q-label-diagram"))
    .map(s => ({
      sectionId: s.id,
      slotType: s.type || "diagram",
      assetRef: s.assetRef as string | undefined,
      imageUrl: s.imageUrl as string | undefined,
      required: true,
    }));
}
