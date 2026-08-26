/**
 * sendDescriptionEnforcer.ts
 *
 * Spec — "SEND Description Requirement" (worksheet scrutiny, June 2026):
 *
 *   When a SEND need is selected the worksheet must
 *     1. state clearly at the top WHICH SEND adaptation has been applied,
 *     2. describe in 2–3 sentences HOW this specific adaptation changes the
 *        worksheet, and
 *     3. never use a single generic label — for autism it must name the
 *        specific sub-profile ("there are many different types so it needs to
 *        elaborate on how it's adapting to each need").
 *
 * This deterministic post-validator guarantees that block exists on the
 * output. It is, like every other post-validator in this codebase:
 *   - Pure        — returns a new worksheet, never mutates the input.
 *   - Idempotent  — detects its own marker section and skips on re-run.
 *   - Conservative— only INSERTS when the block is absent; never edits or
 *                   deletes content the generator produced.
 *   - Observable  — appends one human-readable warning to
 *                   metadata.postValidatorWarnings.
 *
 * Content is sourced from `sendDescriptionsEnhanced.ts` (the single source of
 * truth for SEND need descriptions) so the wording stays consistent with the
 * teacher-facing adaptations panel. Autism sub-profiles are resolved from the
 * sendNeed string itself (which may carry a sub-profile via a colon, e.g.
 * "asc:asc-sensory", or as a free keyword such as "pda" / "demand avoidance").
 */

import { getSendDescription } from "./sendDescriptionsEnhanced";

/** Stable id used for idempotency detection + by the renderer's section map. */
export const SEND_DESCRIPTION_SECTION_ID = "send-adaptation-note";
/** Section `type` the renderer styles as a blue "information" block. */
export const SEND_DESCRIPTION_SECTION_TYPE = "send-adaptation";

interface EnforcerSection {
  id?: string;
  type?: string;
  title?: string;
  content?: string;
  teacherOnly?: boolean;
  [key: string]: unknown;
}

interface EnforcerWorksheet {
  sections?: EnforcerSection[];
  metadata?: Record<string, unknown> & {
    sendNeed?: string;
    postValidatorWarnings?: string[];
  };
  [key: string]: unknown;
}

/**
 * Autism sub-profile resolver. The first matcher whose regex hits the
 * sub-profile / sendNeed text wins. Each carries a human-readable name and a
 * concrete "how it changes the worksheet" clause so the inserted block can
 * elaborate per sub-type (the explicit scrutiny requirement for autism).
 */
const ASD_SUBPROFILES: Array<{ match: RegExp; name: string; method: string }> = [
  {
    match: /demand[\s-]?avoid|\bpda\b/,
    name: "Pathological Demand Avoidance (PDA) profile",
    method:
      "tasks are framed as choices rather than demands, collaborative wording replaces direct instructions, and no consequence language is used",
  },
  {
    match: /sensor/,
    name: "sensory and processing profile",
    method:
      "visual clutter is stripped back, a muted palette is used for any overlay, and every task is broken into the smallest possible steps",
  },
  {
    match: /social|communicat/,
    name: "social-communication profile",
    method:
      "every discussion task offers a written alternative, all group work has a solo equivalent, and idioms and implied meaning are removed",
  },
  {
    match: /rigid|routine|predict/,
    name: "predictability and routine profile",
    method:
      "the layout is kept identical to previous worksheets, success criteria are stated explicitly, and all instructions are numbered steps",
  },
  {
    match: /mask|internal/,
    name: "high-masking profile",
    method:
      "a quiet working option is offered without the pupil having to ask, low-key check-in prompts are built in, and social demands are reduced",
  },
  {
    match: /asperger/,
    name: "Asperger profile",
    method:
      "language is kept literal and precise, instructions are explicit and numbered, and ambiguous or figurative phrasing is avoided",
  },
  {
    match: /monotrop|interest/,
    name: "monotropism / intense-interest profile",
    method:
      "real-world examples are linked to familiar interests where possible, time boundaries are made clear, and transitions between sections are signposted",
  },
];

function capFirst(s: string): string {
  const t = s.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

function lowerFirst(s: string): string {
  const t = s.trim();
  return t ? t.charAt(0).toLowerCase() + t.slice(1) : t;
}

/** Strip trailing punctuation so we can re-join clauses cleanly. */
function trimDot(s: string): string {
  return s.trim().replace(/[.;]+$/, "");
}

/**
 * Split a (possibly compound / sub-profiled) sendNeed string into the primary
 * base need and any sub-profile token. Mirrors the normalisation used by
 * `enforceSendOverlayMarkers` / `overlayEngine.applySendSupport`.
 */
function normaliseSendNeed(raw: string): { base: string; profile: string } {
  const lower = raw.toLowerCase().trim();
  // Stacked need (e.g. "hi+eal") → describe the primary (first) part.
  const primary = lower.split(/[+&,]/)[0].trim();
  if (primary.includes(":")) {
    const [b, ...rest] = primary.split(":");
    return { base: b.trim(), profile: rest.join(":").trim() };
  }
  return { base: primary, profile: "" };
}

/**
 * Returns true when the sendNeed represents a real adaptation (not the
 * "no SEND" sentinels the UI uses).
 */
export function hasMeaningfulSend(sendNeed?: string | null): boolean {
  if (!sendNeed) return false;
  const s = sendNeed.toLowerCase().trim();
  return (
    s !== "" &&
    s !== "none" &&
    s !== "none-selected" &&
    s !== "general" &&
    s !== "n/a"
  );
}

/**
 * Short, teacher-friendly explanation of what the selected support changes.
 * These statements intentionally describe the access change rather than a
 * diagnosis. They are suitable for the worksheet header, the teacher view and
 * the pupil-facing copy without becoming technical or overly clinical.
 */
const PLAIN_LANGUAGE_ADAPTATION_SUMMARIES: Record<string, string> = {
  dyslexia: "Uses a clearer font, more space between lines and shorter instructions so the text is easier to read and follow.",
  adhd: "Breaks work into short chunks with checkboxes and clear action words so pupils can focus on one step at a time.",
  asc: "Uses clear, literal wording, numbered steps and a predictable structure so instructions are easy to follow.",
  mld: "Shows one small step at a time, with worked examples and helpful prompts so new learning feels manageable.",
  eal: "Explains key vocabulary, uses short sentences and adds visual support so pupils can understand the English used in the task.",
  dyscalculia: "Breaks calculations into numbered steps and repeats key methods so pupils can work through maths with confidence.",
  slcn: "Uses short sentences, key-word support and sentence starters so pupils can understand and respond to each task.",
  semh: "Uses calm wording, clear steps and optional challenge so pupils can start work without feeling overwhelmed.",
  vi: "Uses larger, high-contrast text and labels every visual so pupils can access the information clearly.",
  hi: "Writes instructions clearly and provides visual cues so pupils do not need to rely on hearing the task explained.",
};

/**
 * Build a concise summary of the selected SEND support. Returns null when the
 * need is unknown, so callers do not insert a generic or inaccurate claim.
 */
export function buildSendAdaptationSummary(sendNeed: string): string | null {
  const { base, profile } = normaliseSendNeed(sendNeed);
  const desc = getSendDescription(base) || getSendDescription(sendNeed);
  if (!desc) return null;

  const plainSummary = PLAIN_LANGUAGE_ADAPTATION_SUMMARIES[desc.id]
    || "Uses clear instructions and practical support so pupils can access the same learning goal.";

  // Autism remains profile-aware, but the explanation stays brief and concrete.
  if (desc.id === "asc") {
    const hay = `${profile} ${sendNeed}`.toLowerCase();
    const sub = ASD_SUBPROFILES.find((s) => s.match.test(hay));
    if (sub) {
      return `${desc.label} support: ${plainSummary} For this ${sub.name}, ${lowerFirst(trimDot(sub.method))}. The learning goal stays the same.`;
    }
    return `${desc.label} support: ${plainSummary} Autism is a spectrum, so support can be tailored to the pupil. The learning goal and level of challenge stay the same.`;
  }

  return `${desc.label} support: ${plainSummary} The learning goal and level of challenge stay the same.`;
}

/**
 * Guarantee a "How this worksheet is adapted" block naming the specific SEND
 * adaptation (including the autism sub-profile) in plain language. No-op when
 * no SEND need is set or the need is unknown.
 *
 * Generic over the worksheet shape so it slots into the ai.ts structured
 * chain without a cast.
 */
export function enforceSendDescription<T extends EnforcerWorksheet>(
  ws: T,
  sendNeedArg?: string,
): T {
  const sendNeed = sendNeedArg || (ws.metadata?.sendNeed as string | undefined);
  if (!hasMeaningfulSend(sendNeed)) return ws;

  const sections = ws.sections || [];

  // Idempotency — already present (ours, or an AI-authored equivalent)?
  const already = sections.some(
    (s) =>
      s.id === SEND_DESCRIPTION_SECTION_ID ||
      String(s.type || "") === SEND_DESCRIPTION_SECTION_TYPE,
  );
  if (already) return ws;

  const summary = buildSendAdaptationSummary(sendNeed as string);
  if (!summary) return ws;

  const noteSection: EnforcerSection = {
    id: SEND_DESCRIPTION_SECTION_ID,
    type: SEND_DESCRIPTION_SECTION_TYPE,
    title: "How this worksheet is adapted",
    content: summary,
    teacherOnly: false,
  };

  // Insert at the top, but AFTER a learning-objective/success section if one
  // exists, so the lesson objective remains the very first thing on the page.
  const loIdx = sections.findIndex((s) =>
    /^(objective|success|learning-objective)$/.test(
      String(s.type || "").toLowerCase(),
    ),
  );
  const insertAt = loIdx >= 0 ? loIdx + 1 : 0;
  const nextSections = [
    ...sections.slice(0, insertAt),
    noteSection,
    ...sections.slice(insertAt),
  ];

  const prevWarnings = Array.isArray(ws.metadata?.postValidatorWarnings)
    ? (ws.metadata!.postValidatorWarnings as string[])
    : [];
  const warning = `[SEND description] Inserted a "How this worksheet is adapted" block naming the ${sendNeed} adaptation in 2–3 sentences (the generator omitted the required named-and-described summary).`;

  return {
    ...ws,
    sections: nextSections,
    metadata: {
      ...(ws.metadata || {}),
      postValidatorWarnings: [...prevWarnings, warning],
    },
  } as T;
}
