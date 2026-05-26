/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * lessonArchetypes.ts — FEAT-G3.
 *
 * Five frozen lesson-archetype templates (Phase G). Each emits an
 * opinionated brief that pre-fills the worksheet generator form;
 * the LLM completes the actual stems. The archetype id is stamped
 * onto `metadata.lessonArchetype` so audit panels and downstream
 * renderers can show "Built from: <archetype>".
 */

export type ArchetypeId =
  | "do-now-i-we-you-do"
  | "5-a-day"
  | "mini-quiz-recap"
  | "exit-ticket"
  | "worked-mini-independent";

export interface ArchetypeDefinition {
  id: ArchetypeId;
  name: string;
  description: string;
  /** Pedagogical structure summary surfaced in the picker. */
  structure: string;
  /** Per-section target overrides (sectionId → questionCount). */
  sectionTargets: Record<string, number>;
  /** Default duration in minutes. */
  defaultDuration: number;
  /** Subjects this archetype is recommended for. */
  recommendedFor: string[];
  /** Prompt directive injected into structuredSystemSections. */
  promptDirective: string;
}

export const ARCHETYPES: Readonly<ArchetypeDefinition[]> = Object.freeze([
  {
    id: "do-now-i-we-you-do",
    name: "Do-Now → I/We/You-Do",
    description:
      "Rosenshine-aligned starter + explicit-instruction sequence. Best for new content.",
    structure:
      "Section A: 3-question Do-Now retrieval. Section B: I-Do worked example. Section C: We-Do invitational. Section D: You-Do independent (5-7 Qs). Reflection.",
    sectionTargets: { doNow: 3, iDo: 1, weDo: 2, youDo: 6 },
    defaultDuration: 50,
    recommendedFor: ["maths", "science", "english", "humanities"],
    promptDirective: [
      "ARCHETYPE: Do-Now → I/We/You-Do",
      "- Section A 'Do Now': 3 retrieval questions on prior LO.",
      "- Section B 'I Do': demonstrate ONE worked example, with explicit teacher think-aloud annotations.",
      "- Section C 'We Do': 1-2 invitational questions inviting class participation; include the prompt 'Discuss with a partner'.",
      "- Section D 'You Do': 5-7 independent practice questions of escalating difficulty.",
      "- End with a 1-sentence self-reflection prompt.",
    ].join("\n"),
  },
  {
    id: "5-a-day",
    name: "5-a-day Drill",
    description: "Mixed-skill warm-up. 5 questions of escalating difficulty.",
    structure:
      "5 mixed-skill questions (1+2+2+3+5 marks, 13 total). No preamble. Optional reflection.",
    sectionTargets: { drill: 5 },
    defaultDuration: 15,
    recommendedFor: ["maths"],
    promptDirective: [
      "ARCHETYPE: 5-a-day Drill",
      "- Emit exactly 5 questions, single section.",
      "- Mark distribution: 1, 2, 2, 3, 5 (escalating).",
      "- Mixed skills from the topic; do NOT include any preamble or vocabulary section.",
    ].join("\n"),
  },
  {
    id: "mini-quiz-recap",
    name: "Mini-Quiz Recap",
    description: "5–10 MCQ recap of the previous lesson's LO. Distractor pedagogy enforced.",
    structure:
      "5-10 multiple-choice questions; 4 options each; one correct. Distractors target known misconceptions.",
    sectionTargets: { mcq: 8 },
    defaultDuration: 15,
    recommendedFor: ["all"],
    promptDirective: [
      "ARCHETYPE: Mini-Quiz Recap",
      "- All questions are MCQ with exactly 4 options labelled A-D.",
      "- Each distractor must target a documented misconception (use metadata.misconceptionsTargeted).",
      "- Mark scheme lists the correct letter + a one-line 'why' for each distractor.",
    ].join("\n"),
  },
  {
    id: "exit-ticket",
    name: "Exit-Ticket",
    description: "3-5 stem questions tagged to today's LO. Markable in 90 seconds.",
    structure: "3-5 short-answer questions tagged to the lesson LO. Self-reflection slot.",
    sectionTargets: { exit: 4 },
    defaultDuration: 5,
    recommendedFor: ["all"],
    promptDirective: [
      "ARCHETYPE: Exit Ticket",
      "- Emit 3-5 short-answer questions only.",
      "- Each question tied to a single LO.",
      "- Append a 1-line self-reflection slot ('How confident are you on a scale of 1-5?').",
    ].join("\n"),
  },
  {
    id: "worked-mini-independent",
    name: "Worked-Example → Mini-Whiteboard → Independent",
    description:
      "Mathematics gradual release: full worked example, mini-whiteboard prompts, then independent practice.",
    structure:
      "Section A: full worked example (steps shown). Section B: 4-6 mini-whiteboard prompts (short-answer). Section C: 6-8 independent practice. Mark scheme + reflection.",
    sectionTargets: { worked: 1, miniWhiteboard: 5, independent: 7 },
    defaultDuration: 60,
    recommendedFor: ["maths", "science"],
    promptDirective: [
      "ARCHETYPE: Worked-Example → Mini-Whiteboard → Independent",
      "- Section A: emit ONE worked-example section with structured `workedExampleSteps` (3-6 steps).",
      "- Section B: 4-6 short-answer mini-whiteboard prompts.",
      "- Section C: 6-8 independent practice questions.",
    ].join("\n"),
  },
]);

const ARCHETYPE_INDEX = new Map<ArchetypeId, ArchetypeDefinition>(
  ARCHETYPES.map((a) => [a.id, a as ArchetypeDefinition]),
);

export function getArchetype(id: ArchetypeId): ArchetypeDefinition | undefined {
  return ARCHETYPE_INDEX.get(id);
}

export interface BriefContext {
  subject?: string;
  yearGroup?: string;
  topic?: string;
  examBoard?: string;
}

export interface ArchetypeBrief {
  archetypeId: ArchetypeId;
  archetypeName: string;
  duration: number;
  sectionTargets: Record<string, number>;
  promptPreamble: string;
  briefSummary: string;
}

/**
 * Builds an opinionated brief from an archetype + context. The output
 * is consumed by the Worksheets form (form state pre-fill) and by
 * structuredSystemSections (prompt block injection).
 */
export function buildArchetypeBrief(
  archetypeId: ArchetypeId,
  ctx: BriefContext = {},
): ArchetypeBrief | null {
  const def = ARCHETYPE_INDEX.get(archetypeId);
  if (!def) return null;
  const subjectPart = ctx.subject ? ` for ${ctx.subject}` : "";
  const yearPart = ctx.yearGroup ? ` ${ctx.yearGroup}` : "";
  const topicPart = ctx.topic ? ` on ${ctx.topic}` : "";
  const briefSummary = `${def.name}${subjectPart}${yearPart}${topicPart}`.trim();
  return {
    archetypeId: def.id,
    archetypeName: def.name,
    duration: def.defaultDuration,
    sectionTargets: { ...def.sectionTargets },
    promptPreamble: def.promptDirective,
    briefSummary,
  };
}

export function listArchetypes(): ArchetypeDefinition[] {
  return ARCHETYPES.slice();
}
