/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * client/src/lib/aiGenerateWorksheetTwoPass.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 3.A + 3.E (PR-1 / big-bang-7-sprints).
 *
 * Two-pass worksheet generator orchestrator. Wraps `aiGenerateWorksheet`
 * under the `WORKSHEET_TWO_PASS_ENABLED` env / runtime flag.
 *
 *   Pass 1 (skeleton):
 *     - Tiny prompt (~1.5k tokens): "list the sections this worksheet
 *       must contain" with type + marks + draft title + spec ref.
 *     - Returns JSON: `{ sections: [{ id, type, marks, specRef, title }] }`.
 *     - LLM does not fill `content`; that's Pass 2's job.
 *
 *   Pass 2 (section fill):
 *     - One focused prompt per section (~500 tokens each), in
 *       parallel via `Promise.all`.
 *     - Per-subject prompt-family directives (from
 *       `perSubjectPromptFamilies`) inlined so each section call
 *       carries the subject's voice + forbidden patterns.
 *     - Returns the section's `content`, `commandWord`, etc.
 *
 *   Reconciliation:
 *     - Skeleton + filled sections merged into a single
 *       `AIWorksheetResult`.
 *     - Stamps `metadata.generatorVersion = "two-pass-1.0.0"`.
 *
 *   Self-consistency (Sprint 3.E):
 *     - Behind `PROMPT_SELF_CONSISTENCY_ENABLED`.
 *     - Highest-mark question section is filled N times in
 *       parallel where N = `recommendedSampleCount(marks)`.
 *     - `reconcileSelfConsistency` picks the consensus answer key
 *       + marking points; the section's `content` becomes the
 *       most-elaborated sample text, mark-scheme uses the
 *       reconciled point list.
 *     - Stamps `metadata.selfConsistencyApplied = true`,
 *       `metadata.selfConsistencyConfidence = number`.
 *
 * Routing:
 *   - `aiGenerateWorksheetTwoPass(params)` is the public entry.
 *   - When `WORKSHEET_TWO_PASS_ENABLED` is OFF (default), it
 *     delegates straight to `aiGenerateWorksheet` — preserves all
 *     existing behaviour.
 *   - When ON, it runs the two-pass path described above.
 *   - The result of either path is a valid `AIWorksheetResult` so
 *     downstream callers (post-validator chain, eval harness,
 *     renderer) don't care which path produced it.
 *
 * The flag is intentionally opt-in only in this PR. A future PR will
 * promote the two-pass path to default once eval-harness numbers
 * confirm parity or improvement.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  aiGenerateWorksheet,
  callAIMessages,
  parseWithFixes,
  type AIWorksheetResult,
  type AIWorksheetSection,
} from "./ai";
import { lookupPromptFamily, renderPromptFamily } from "./perSubjectPromptFamilies";
import {
  shouldSelfSample,
  recommendedSampleCount,
  reconcileSelfConsistency,
  type ExtendedAnswerSample,
} from "./selfConsistencySampler";

// ─── Public params ──────────────────────────────────────────────────────────

/** Param shape mirrors the legacy `aiGenerateWorksheet` so callers
 *  can swap in this orchestrator without re-typing their call sites.
 *  Subset only — fields actually consumed by either pass. */
export interface TwoPassParams {
  subject: string;
  topic: string;
  yearGroup: string;
  sendNeed?: string;
  difficulty?: string;
  examBoard?: string;
  includeAnswers?: boolean;
  examStyle?: boolean;
  worksheetLength?: string;
  readingAge?: number;
  isRevisionMat?: boolean;
  paper?: "P1" | "P2" | "P3";
  calculator?: boolean;
  recallTopic?: string;
  priorTopics?: string[];
  /** Per-call override for the two-pass flag. When set, ignores the
   *  env / global. Useful for the eval harness A/B layer. */
  twoPassOverride?: boolean;
  /** Per-call override for self-consistency. Same precedence rules
   *  as `twoPassOverride`. */
  selfConsistencyOverride?: boolean;
}

// ─── Flag plumbing ──────────────────────────────────────────────────────────

const TWO_PASS_VERSION = "two-pass-1.0.0";

/**
 * Reads the runtime + env flag. Browser callers can set
 * `globalThis.WORKSHEET_TWO_PASS_ENABLED = true` to turn it on for
 * one tab without rebuilding. Node callers set the env var.
 *
 * Per-call `twoPassOverride` wins over both — useful for A/B
 * experiments.
 */
export function isTwoPassEnabled(override?: boolean): boolean {
  if (typeof override === "boolean") return override;
  const g = globalThis as unknown as { WORKSHEET_TWO_PASS_ENABLED?: boolean };
  if (typeof g.WORKSHEET_TWO_PASS_ENABLED === "boolean") {
    return g.WORKSHEET_TWO_PASS_ENABLED;
  }
  if (typeof process !== "undefined" && process.env) {
    const v = process.env.WORKSHEET_TWO_PASS_ENABLED;
    if (v === "1" || v === "true") return true;
  }
  return false;
}

export function isSelfConsistencyEnabled(override?: boolean): boolean {
  if (typeof override === "boolean") return override;
  const g = globalThis as unknown as { PROMPT_SELF_CONSISTENCY_ENABLED?: boolean };
  if (typeof g.PROMPT_SELF_CONSISTENCY_ENABLED === "boolean") {
    return g.PROMPT_SELF_CONSISTENCY_ENABLED;
  }
  if (typeof process !== "undefined" && process.env) {
    const v = process.env.PROMPT_SELF_CONSISTENCY_ENABLED;
    if (v === "1" || v === "true") return true;
  }
  return false;
}

// ─── Pass 1 — skeleton ──────────────────────────────────────────────────────

export interface SkeletonSection {
  id: string;
  type: string;
  marks: number;
  specRef?: string;
  title: string;
}

export interface SkeletonResult {
  title: string;
  subtitle?: string;
  sections: SkeletonSection[];
  totalMarks: number;
  estimatedTime?: string;
}

/** Build the Pass-1 system + user message. Kept short on purpose
 *  (~700 tokens) so the skeleton call is fast and cheap. */
export function buildSkeletonPrompt(params: TwoPassParams): {
  system: string;
  user: string;
} {
  const family = lookupPromptFamily(params.subject);
  const system = [
    family.header,
    "Your job NOW is to design the worksheet skeleton ONLY. Do NOT write question content yet.",
    "Return JSON with this exact shape:",
    "{",
    '  "title": "<short worksheet title>",',
    '  "subtitle": "<year group + exam board if any>",',
    '  "totalMarks": <int>,',
    '  "estimatedTime": "<e.g. \'25 minutes\'>",',
    '  "sections": [',
    '    { "id": "lo",  "type": "learning-objective", "marks": 0, "title": "Learning Objective" },',
    '    { "id": "wb",  "type": "word-bank",          "marks": 0, "title": "Key Vocabulary" },',
    '    { "id": "we",  "type": "worked-example",     "marks": 0, "title": "Worked Example" },',
    '    { "id": "q1",  "type": "q-short-answer",     "marks": <int>, "specRef": "<board code>", "title": "Question 1" },',
    "    ...",
    '    { "id": "ms",  "type": "mark-scheme",        "marks": 0, "title": "Mark Scheme" },',
    '    { "id": "sr",  "type": "self-reflection",    "marks": 0, "title": "Self-Reflection" },',
    '    { "id": "rt",  "type": "revision-tips",      "marks": 0, "title": "Revision Tips" }',
    "  ]",
    "}",
    "Required structure: 1 LO + 1 word-bank + 1 worked-example + EXACTLY 7 question sections + 1 mark-scheme + 1 self-reflection + 1 revision-tips.",
    "Question types in order: q-short-answer, q-mcq, q-true-false, q-gap-fill, q-extended, application, challenge.",
    "Mark scheme totalMarks must match the sum of question section marks.",
    "Spec refs: only emit codes that exist in the named exam board's published taxonomy. If unsure, omit the field — do NOT invent codes.",
  ].join("\n");
  const user = buildPassUserMessage(params);
  return { system, user };
}

function buildPassUserMessage(params: TwoPassParams): string {
  const lines: string[] = [];
  lines.push(`Subject: ${params.subject}`);
  lines.push(`Topic: ${params.topic}`);
  lines.push(`Year group: ${params.yearGroup}`);
  if (params.examBoard) lines.push(`Exam board: ${params.examBoard}`);
  if (params.difficulty) lines.push(`Difficulty: ${params.difficulty}`);
  if (params.sendNeed) lines.push(`SEND profile: ${params.sendNeed}`);
  if (params.readingAge) lines.push(`Target reading age: ${params.readingAge}`);
  if (params.examStyle) lines.push("Exam-style: yes");
  if (params.calculator !== undefined) lines.push(`Calculator: ${params.calculator ? "allowed" : "not allowed"}`);
  if (params.paper) lines.push(`Paper: ${params.paper}`);
  if (params.priorTopics?.length) lines.push(`Prior topics: ${params.priorTopics.join(", ")}`);
  if (params.recallTopic) lines.push(`Recall topic: ${params.recallTopic}`);
  return lines.join("\n");
}

/** Issue Pass-1 LLM call and parse the result. Throws on parse fail. */
export async function aiGenerateWorksheetSkeleton(params: TwoPassParams): Promise<SkeletonResult> {
  const { system, user } = buildSkeletonPrompt(params);
  const reply = await callAIMessages(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    1500,
    { responseFormat: "json_object" },
  );
  const parsed = parseWithFixes(reply.text);
  if (!parsed || !Array.isArray(parsed.sections)) {
    throw new Error(`aiGenerateWorksheetSkeleton: malformed skeleton response (no .sections array)`);
  }
  return parsed as SkeletonResult;
}

// ─── Pass 2 — section fill ──────────────────────────────────────────────────

/** Build the section-fill prompt for one skeleton section. */
export function buildSectionFillPrompt(
  params: TwoPassParams,
  section: SkeletonSection,
  skeleton: SkeletonResult,
): { system: string; user: string } {
  const family = lookupPromptFamily(params.subject);
  const familyBlock = renderPromptFamily(family);
  const sectionContract = sectionContractFor(section.type);

  const system = [
    family.header,
    "You are filling ONE section of a worksheet skeleton that has already been agreed.",
    "Return JSON with exactly:",
    '{ "content": "<section body, plain text>", "commandWord": "<one word>", "answerLines": <int>, "markScheme": "<short MS>", "diagnosesIfMcq": [{"option":"A","misconception":"..."}] }',
    "Only include fields relevant to this section type.",
    "",
    familyBlock,
    "",
    "Section contract:",
    sectionContract,
  ].join("\n");

  const user = [
    buildPassUserMessage(params),
    "",
    `Worksheet title: ${skeleton.title}`,
    `Section to fill: ${section.title} (type: ${section.type}, marks: ${section.marks})`,
    section.specRef ? `Spec ref: ${section.specRef}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

function sectionContractFor(type: string): string {
  switch (type) {
    case "learning-objective":
      return "Single sentence starting 'Pupils will be able to...'. No bullet points.";
    case "word-bank":
      return "5–10 Tier-3 vocabulary entries. One per line, format 'term — definition'. Plain English definitions.";
    case "worked-example":
      return "Numbered steps (Step 1, Step 2, ...). 3–6 steps. Show working — final answer last.";
    case "q-short-answer":
      return "1 mark; 1 sentence answer expected; concrete context, no chatbot tells.";
    case "q-mcq":
      return "1 mark; 4 options (A–D); ✓ on the correct one; distractors target real misconceptions; emit `diagnosesIfMcq` mapping each distractor to its misconception.";
    case "q-true-false":
      return "1 mark; one statement; pupils write T or F.";
    case "q-gap-fill":
      return "1–2 marks; sentence with 2–3 numbered gaps; word-bank words allowed.";
    case "q-extended":
      return "Higher mark (5–8 typical); structured prompt with ≥2 lines of expected response per mark; mark-scheme MUST list every M / A / E point.";
    case "application":
      return "3–4 marks; real-world / cross-curricular context; multi-step working.";
    case "challenge":
      return "Highest mark (often 6+); deliberate stretch; clearly labelled.";
    case "mark-scheme":
      return "One row per question with marks awarded per point. Use M/A/E codes where appropriate.";
    case "self-reflection":
      return "5 'I can...' statements aligned to the topic, scaled from easy to hard.";
    case "revision-tips":
      return "5 numbered tips, each ~10 words, actionable and topic-specific.";
    default:
      return "Plain text content. Keep it focused and pupil-facing.";
  }
}

/** Issue Pass-2 LLM call for one section. Returns the merged
 *  `AIWorksheetSection` ready for assembly. Errors are surfaced —
 *  the orchestrator catches and decides whether to retry. */
export async function aiFillWorksheetSection(
  params: TwoPassParams,
  section: SkeletonSection,
  skeleton: SkeletonResult,
): Promise<AIWorksheetSection> {
  const { system, user } = buildSectionFillPrompt(params, section, skeleton);
  const reply = await callAIMessages(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    600,
    { responseFormat: "json_object" },
  );
  const parsed = parseWithFixes(reply.text) as Record<string, unknown> | null;
  return {
    id: section.id,
    type: section.type,
    title: section.title,
    teacherOnly: section.type === "mark-scheme",
    content: typeof parsed?.content === "string" ? parsed.content : "",
    ...(typeof parsed?.commandWord === "string" ? { commandWord: parsed.commandWord } : {}),
    ...(typeof parsed?.answerLines === "number" ? { answerLines: parsed.answerLines } : {}),
    ...(typeof parsed?.markScheme === "string" ? { markScheme: parsed.markScheme } : {}),
    ...(section.marks ? { marks: section.marks } : {}),
    ...(section.specRef ? { specRef: section.specRef } : {}),
  } as AIWorksheetSection;
}

// ─── Self-consistency hook (Sprint 3.E) ─────────────────────────────────────

/** Pick the highest-mark question section that should self-sample.
 *  Returns null when no section qualifies. */
export function pickSelfConsistencySection(
  skeleton: SkeletonResult,
): SkeletonSection | null {
  let best: SkeletonSection | null = null;
  for (const s of skeleton.sections) {
    if (!shouldSelfSample({ type: s.type, marks: s.marks })) continue;
    if (!best || (s.marks ?? 0) > (best.marks ?? 0)) best = s;
  }
  return best;
}

/** Run Pass-2 N times in parallel and reconcile. Returns the merged
 *  section + a confidence number stamped into the orchestrator's
 *  output metadata. */
export async function fillSectionWithSelfConsistency(
  params: TwoPassParams,
  section: SkeletonSection,
  skeleton: SkeletonResult,
): Promise<{ section: AIWorksheetSection; confidence: number; sampleCount: number }> {
  const n = recommendedSampleCount(section.marks);
  if (n <= 1) {
    const filled = await aiFillWorksheetSection(params, section, skeleton);
    return { section: filled, confidence: 1, sampleCount: 1 };
  }
  const samples = await Promise.all(
    Array.from({ length: n }, () => aiFillWorksheetSection(params, section, skeleton)),
  );
  const consistencySamples: ExtendedAnswerSample[] = samples.map((s) => ({
    answerKey: typeof s.markScheme === "string" ? s.markScheme : (s.content ?? ""),
    markingPoints: typeof s.markScheme === "string"
      ? s.markScheme.split(/[\n;•·]/).map((p) => p.trim()).filter(Boolean)
      : [],
    sampledAt: new Date().toISOString(),
  }));
  const consensus = reconcileSelfConsistency(consistencySamples);
  // Pick the longest-content sample as the consensus content.
  const longest = samples.reduce(
    (best, cur) => ((cur.content ?? "").length > (best.content ?? "").length ? cur : best),
    samples[0],
  );
  const merged: AIWorksheetSection = {
    ...longest,
    markScheme: consensus.consensusKey || longest.markScheme,
  };
  return { section: merged, confidence: consensus.confidence, sampleCount: n };
}

// ─── Orchestrator ───────────────────────────────────────────────────────────

/**
 * Public entry. Routes to legacy `aiGenerateWorksheet` (default) or
 * to the new two-pass path under flag.
 *
 * Result shape is `AIWorksheetResult` either way — no caller change.
 */
export async function aiGenerateWorksheetTwoPass(
  params: TwoPassParams,
): Promise<AIWorksheetResult> {
  const useTwoPass = isTwoPassEnabled(params.twoPassOverride);
  if (!useTwoPass) {
    // Legacy path — strip the two-pass-only fields before delegation.
    const { twoPassOverride: _t, selfConsistencyOverride: _s, ...legacyParams } = params;
    return aiGenerateWorksheet(legacyParams);
  }

  // Two-pass path.
  const skeleton = await aiGenerateWorksheetSkeleton(params);
  const useSelfConsistency = isSelfConsistencyEnabled(params.selfConsistencyOverride);
  const scSection = useSelfConsistency ? pickSelfConsistencySection(skeleton) : null;

  const filledSections = await Promise.all(
    skeleton.sections.map(async (s) => {
      if (scSection && s.id === scSection.id) {
        // Filled below with self-consistency.
        return null;
      }
      try {
        return await aiFillWorksheetSection(params, s, skeleton);
      } catch (err) {
        console.warn(
          `[twoPass] section fill failed for ${s.id} (${err instanceof Error ? err.message : String(err)}); emitting empty content.`,
        );
        return {
          id: s.id,
          type: s.type,
          title: s.title,
          content: "",
          ...(s.marks ? { marks: s.marks } : {}),
          ...(s.specRef ? { specRef: s.specRef } : {}),
        } as AIWorksheetSection;
      }
    }),
  );

  let scResult: { confidence: number; sampleCount: number } | null = null;
  if (scSection) {
    const r = await fillSectionWithSelfConsistency(params, scSection, skeleton);
    const idx = skeleton.sections.findIndex((s) => s.id === scSection.id);
    if (idx >= 0) filledSections[idx] = r.section;
    scResult = { confidence: r.confidence, sampleCount: r.sampleCount };
  }

  const sections = filledSections.filter((s): s is AIWorksheetSection => Boolean(s));

  const result: AIWorksheetResult = {
    title: skeleton.title,
    subtitle: skeleton.subtitle,
    sections,
    metadata: {
      subject: params.subject,
      topic: params.topic,
      yearGroup: params.yearGroup,
      examBoard: params.examBoard,
      difficulty: params.difficulty ?? "medium",
      adaptations: params.sendNeed ? [params.sendNeed] : [],
      sendNeed: params.sendNeed,
      totalMarks: skeleton.totalMarks,
      estimatedTime: skeleton.estimatedTime ?? "20 minutes",
      generatorVersion: TWO_PASS_VERSION,
      ...(scResult
        ? {
            selfConsistencyApplied: true,
            selfConsistencyConfidence: scResult.confidence,
            selfConsistencySampleCount: scResult.sampleCount,
          }
        : {}),
    },
    isAI: true,
  } as AIWorksheetResult;

  return result;
}
