import {
  getWorksheetOverlayColor,
  resolveWorksheetOverlayId,
  type WorksheetOverlayMode,
} from "./worksheetOverlay";

export type PupilAssignmentSection = {
  title: string;
  type: string;
  content: string;
  teacherOnly?: boolean;
  svg?: string;
  caption?: string;
  imageUrl?: string;
  assetRef?: string;
};

export type PupilAssignmentMetadata = {
  subject?: string;
  topic?: string;
  yearGroup?: string;
  difficulty?: string;
  examBoard?: string;
  sendNeed?: string;
  /** Resolved screen/readability overlay selected for this pupil-safe copy. */
  overlay?: string;
  /** Whether the overlay was selected automatically or intentionally by a teacher. */
  accessibilityOverlayMode?: WorksheetOverlayMode;
  /** Dedicated print-format worksheets retain their approved white paper surface. */
  protectedLayout?: boolean;
  /** Human-readable summary of visible supports, not confidential pupil data. */
  adaptationSummary?: string[];
  /** Curriculum/specification reference when the generator provides one. */
  curriculumReference?: string;
  /** Generation source, e.g. manual assignment or approved scheduler. */
  source?: string;
  /** Validation/provenance summary for staff review. */
  qualityStatus?: "checked" | "needs-review" | "unknown";
  [key: string]: unknown;
};

export type PupilAssignmentPayload = {
  title: string;
  type: string;
  content: string;
  subtitle?: string;
  sections?: PupilAssignmentSection[];
  metadata?: PupilAssignmentMetadata;
};

const TEACHER_ONLY_TYPES = new Set([
  "mark-scheme",
  "answers",
  "teacher-notes",
  "adaptations",
  "teacher-answer-key",
]);

function parseJsonObject(value: unknown): Record<string, unknown> | undefined {
  if (!value) return undefined;
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return undefined;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : undefined;
  } catch {
    return undefined;
  }
}

function normaliseSections(value: unknown): PupilAssignmentSection[] | undefined {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? (() => { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })()
      : [];

  const sections = raw
    .filter((section): section is Record<string, unknown> => !!section && typeof section === "object")
    .map(section => ({
      title: String(section.title || "Untitled section"),
      type: String(section.type || "content"),
      content: String(section.content || ""),
      teacherOnly: Boolean(section.teacherOnly),
      svg: typeof section.svg === "string" ? section.svg : undefined,
      caption: typeof section.caption === "string" ? section.caption : undefined,
      imageUrl: typeof section.imageUrl === "string" ? section.imageUrl : undefined,
      assetRef: typeof section.assetRef === "string" ? section.assetRef : undefined,
    }))
    .filter(section => !section.teacherOnly && !TEACHER_ONLY_TYPES.has(section.type));

  return sections.length > 0 ? sections : undefined;
}

/**
 * Prepares the only worksheet representation an assigned pupil can receive.
 * Teacher-only material is deliberately excluded even if an upstream caller
 * accidentally includes it in a sections array.
 */
export function buildPupilAssignmentPayload(input: PupilAssignmentPayload): PupilAssignmentPayload {
  return {
    ...input,
    sections: normaliseSections(input.sections),
    metadata: parseJsonObject(input.metadata) as PupilAssignmentMetadata | undefined,
  };
}

/**
 * Normalises server rows whose JSON fields may arrive parsed or serialised.
 * This prevents a refresh from losing diagrams, captions, metadata or the
 * pupil-safe section split that the renderer depends on.
 */
export function hydratePupilAssignmentPayload(row: Record<string, unknown>): PupilAssignmentPayload {
  return buildPupilAssignmentPayload({
    title: String(row.title || "Untitled assignment"),
    type: String(row.type || "worksheet"),
    content: String(row.content || ""),
    subtitle: typeof row.subtitle === "string" ? row.subtitle : undefined,
    sections: row.sections as PupilAssignmentSection[] | undefined,
    metadata: parseJsonObject(row.metadata) as PupilAssignmentMetadata | undefined,
  });
}

/**
 * Resolves display-only worksheet paper treatment for learner-facing assignment
 * views. The metadata is already filtered by buildPupilAssignmentPayload;
 * this helper deliberately considers no teacher-only or personal data.
 */
export function resolvePupilAssignmentOverlay(metadata?: PupilAssignmentMetadata) {
  const safeMetadata = metadata || {};
  const protectedLayout = safeMetadata.protectedLayout === true
    || Boolean(safeMetadata.fixedLandscape || safeMetadata.scienceLandscape);
  const overlayId = resolveWorksheetOverlayId({
    sendNeed: safeMetadata.sendNeed,
    selectedOverlayId: safeMetadata.overlay,
    mode: safeMetadata.accessibilityOverlayMode || "auto",
    protectedLayout,
  });

  return {
    id: overlayId,
    color: getWorksheetOverlayColor(overlayId),
  };
}
