export type AccessibilityFontScale = "standard" | "large" | "extra-large";
export type AccessibilityLineSpacing = "standard" | "spacious" | "extra-spacious";
export type ScaffoldingLevel = "independent" | "prompted" | "part-modelled" | "modelled";

export interface LearnerAccessibilityPreferences {
  fontScale: AccessibilityFontScale;
  lineSpacing: AccessibilityLineSpacing;
  highContrast: boolean;
  reduceVisualClutter: boolean;
  useVisualSupports: boolean;
  responseModes: Array<"written" | "spoken" | "visual" | "practical">;
}

export interface LearnerCommunicationPreferences {
  instructionStyle: "direct" | "invitational" | "choice-led";
  processingTime: "standard" | "extended";
  vocabularySupport: boolean;
  sentenceFrames: boolean;
}

export interface TemporarySupportAdjustment {
  id: string;
  label: string;
  reason: string;
  startsOn?: string;
  endsOn?: string;
  active: boolean;
}

export interface LearnerSupportProfile {
  version: 1;
  strengths: string[];
  barriers: string[];
  successfulStrategies: string[];
  sensoryPreferences: string[];
  accessibility: LearnerAccessibilityPreferences;
  communication: LearnerCommunicationPreferences;
  scaffoldingLevel: ScaffoldingLevel;
  pupilVoice: string;
  temporaryAdjustments: TemporarySupportAdjustment[];
  reviewedAt?: string;
  reviewedBy?: string;
}

export const DEFAULT_LEARNER_SUPPORT_PROFILE: LearnerSupportProfile = {
  version: 1,
  strengths: [],
  barriers: [],
  successfulStrategies: [],
  sensoryPreferences: [],
  accessibility: {
    fontScale: "standard",
    lineSpacing: "standard",
    highContrast: false,
    reduceVisualClutter: false,
    useVisualSupports: false,
    responseModes: ["written"],
  },
  communication: {
    instructionStyle: "direct",
    processingTime: "standard",
    vocabularySupport: false,
    sentenceFrames: false,
  },
  scaffoldingLevel: "prompted",
  pupilVoice: "",
  temporaryAdjustments: [],
};

const list = (value: unknown, limit = 12): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map(item => item.trim().slice(0, 180)).slice(0, limit)
    : [];

const text = (value: unknown, limit = 500): string => typeof value === "string" ? value.trim().slice(0, limit) : "";

const oneOf = <T extends string>(value: unknown, permitted: readonly T[], fallback: T): T =>
  typeof value === "string" && (permitted as readonly string[]).includes(value) ? value as T : fallback;

/**
 * Normalises untrusted API/local-storage JSON into a stable support contract.
 * The profile describes access and teaching preferences, not a diagnosis, and
 * deliberately excludes safeguarding or family-contact data.
 */
export function normaliseLearnerSupportProfile(value: unknown): LearnerSupportProfile {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const accessibility = raw.accessibility && typeof raw.accessibility === "object" ? raw.accessibility as Record<string, unknown> : {};
  const communication = raw.communication && typeof raw.communication === "object" ? raw.communication as Record<string, unknown> : {};
  const adjustments = Array.isArray(raw.temporaryAdjustments) ? raw.temporaryAdjustments : [];

  return {
    version: 1,
    strengths: list(raw.strengths),
    barriers: list(raw.barriers),
    successfulStrategies: list(raw.successfulStrategies),
    sensoryPreferences: list(raw.sensoryPreferences),
    accessibility: {
      fontScale: oneOf(accessibility.fontScale, ["standard", "large", "extra-large"] as const, "standard"),
      lineSpacing: oneOf(accessibility.lineSpacing, ["standard", "spacious", "extra-spacious"] as const, "standard"),
      highContrast: Boolean(accessibility.highContrast),
      reduceVisualClutter: Boolean(accessibility.reduceVisualClutter),
      useVisualSupports: Boolean(accessibility.useVisualSupports),
      responseModes: (list(accessibility.responseModes, 4) as LearnerAccessibilityPreferences["responseModes"]).filter(mode => ["written", "spoken", "visual", "practical"].includes(mode)),
    },
    communication: {
      instructionStyle: oneOf(communication.instructionStyle, ["direct", "invitational", "choice-led"] as const, "direct"),
      processingTime: oneOf(communication.processingTime, ["standard", "extended"] as const, "standard"),
      vocabularySupport: Boolean(communication.vocabularySupport),
      sentenceFrames: Boolean(communication.sentenceFrames),
    },
    scaffoldingLevel: oneOf(raw.scaffoldingLevel, ["independent", "prompted", "part-modelled", "modelled"] as const, "prompted"),
    pupilVoice: text(raw.pupilVoice),
    temporaryAdjustments: adjustments.slice(0, 8).flatMap((adjustment): TemporarySupportAdjustment[] => {
      if (!adjustment || typeof adjustment !== "object") return [];
      const item = adjustment as Record<string, unknown>;
      const label = text(item.label, 100);
      if (!label) return [];
      return [{
        id: text(item.id, 80) || `support-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
        label,
        reason: text(item.reason, 240),
        startsOn: text(item.startsOn, 20) || undefined,
        endsOn: text(item.endsOn, 20) || undefined,
        active: item.active !== false,
      }];
    }),
    reviewedAt: text(raw.reviewedAt, 40) || undefined,
    reviewedBy: text(raw.reviewedBy, 120) || undefined,
  };
}

export function activeTemporaryAdjustments(profile: LearnerSupportProfile, now = new Date()): TemporarySupportAdjustment[] {
  const today = now.toISOString().slice(0, 10);
  return profile.temporaryAdjustments.filter(item => item.active && (!item.startsOn || item.startsOn <= today) && (!item.endsOn || item.endsOn >= today));
}

/** A bounded, identity-safe context passed only when a teacher has opted in. */
export function learnerSupportPrompt(profile: LearnerSupportProfile): string[] {
  const lines: string[] = [];
  if (profile.strengths.length) lines.push(`- Strengths to use: ${profile.strengths.join("; ")}`);
  if (profile.barriers.length) lines.push(`- Access barriers to remove: ${profile.barriers.join("; ")}`);
  if (profile.successfulStrategies.length) lines.push(`- Strategies known to help: ${profile.successfulStrategies.join("; ")}`);
  if (profile.sensoryPreferences.length) lines.push(`- Sensory/access preferences: ${profile.sensoryPreferences.join("; ")}`);
  const a = profile.accessibility;
  if (a.fontScale !== "standard" || a.lineSpacing !== "standard" || a.highContrast || a.reduceVisualClutter || a.useVisualSupports) {
    lines.push(`- Accessibility: font ${a.fontScale}; spacing ${a.lineSpacing}; ${a.highContrast ? "high contrast" : "standard contrast"}; ${a.reduceVisualClutter ? "reduced visual clutter" : "standard density"}; ${a.useVisualSupports ? "visual supports" : "text-first"}.`);
  }
  const c = profile.communication;
  if (c.instructionStyle !== "direct" || c.processingTime === "extended" || c.vocabularySupport || c.sentenceFrames) {
    lines.push(`- Communication: ${c.instructionStyle} instructions; ${c.processingTime} processing time; ${c.vocabularySupport ? "vocabulary support" : "no extra vocabulary support"}; ${c.sentenceFrames ? "sentence frames" : "independent phrasing"}.`);
  }
  lines.push(`- Scaffold entry point: ${profile.scaffoldingLevel}. Fade support only when teacher evidence supports it; preserve the learning objective and assessment demand.`);
  const temporary = activeTemporaryAdjustments(profile);
  if (temporary.length) lines.push(`- Active temporary adjustments: ${temporary.map(item => item.label).join("; ")}.`);
  if (profile.pupilVoice) lines.push(`- Pupil voice: ${profile.pupilVoice}`);
  return lines;
}

export interface AssessmentAccessPlan {
  responseRoutes: LearnerAccessibilityPreferences["responseModes"];
  presentation: {
    fontScale: AccessibilityFontScale;
    lineSpacing: AccessibilityLineSpacing;
    highContrast: boolean;
    reduceVisualClutter: boolean;
    visualSupports: boolean;
  };
  communication: Pick<LearnerCommunicationPreferences, "instructionStyle" | "processingTime" | "vocabularySupport" | "sentenceFrames">;
  activeTemporaryAdjustments: string[];
  demandInvariant: "Keep the same learning objective, assessment criteria, command word and mark allocation.";
  teacherReviewRequired: true;
}

/**
 * Converts a reviewed profile into an explicit assessment-access plan.  The
 * plan offers how a pupil may access or evidence learning; it never decides
 * what standard is assessed. Tool families can render or persist this safely
 * without inferring diagnosis or using browser-local state.
 */
export function buildAssessmentAccessPlan(profile: LearnerSupportProfile, now = new Date()): AssessmentAccessPlan {
  const support = normaliseLearnerSupportProfile(profile);
  return {
    responseRoutes: support.accessibility.responseModes.length ? support.accessibility.responseModes : ["written"],
    presentation: {
      fontScale: support.accessibility.fontScale,
      lineSpacing: support.accessibility.lineSpacing,
      highContrast: support.accessibility.highContrast,
      reduceVisualClutter: support.accessibility.reduceVisualClutter,
      visualSupports: support.accessibility.useVisualSupports,
    },
    communication: {
      instructionStyle: support.communication.instructionStyle,
      processingTime: support.communication.processingTime,
      vocabularySupport: support.communication.vocabularySupport,
      sentenceFrames: support.communication.sentenceFrames,
    },
    activeTemporaryAdjustments: activeTemporaryAdjustments(support, now).map(item => item.label),
    demandInvariant: "Keep the same learning objective, assessment criteria, command word and mark allocation.",
    teacherReviewRequired: true,
  };
}

export function learnerSupportHeadline(profile: LearnerSupportProfile): string {
  const active = activeTemporaryAdjustments(profile);
  const parts = [
    profile.strengths.length ? `${profile.strengths.length} strength${profile.strengths.length === 1 ? "" : "s"}` : "",
    profile.successfulStrategies.length ? `${profile.successfulStrategies.length} trusted strategy${profile.successfulStrategies.length === 1 ? "" : "ies"}` : "",
    active.length ? `${active.length} temporary adjustment${active.length === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  return parts.join(" · ") || "No learner-support preferences recorded yet";
}
