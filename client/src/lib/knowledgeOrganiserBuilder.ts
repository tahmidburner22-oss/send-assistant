/**
 * knowledgeOrganiserBuilder.ts — PR-10 (audit items #20, #21)
 *
 * Pure / deterministic / idempotent builders that derive auxiliary
 * teacher-facing surfaces from an already-generated worksheet:
 *
 *   1. Knowledge Organiser (KO) — a one-page distillation of the topic's
 *      vocabulary, key facts, worked example and common mistakes pulled
 *      directly from the worksheet sections. No extra LLM call.
 *   2. Anchor Poster — a five-band reformat of the KO sized for printing
 *      at A3, suitable for classroom display.
 *   3. Now / Next / Then cards — a three-step sequencing aid for ASC /
 *      working-memory pupils, derived from the worksheet's section order.
 *
 * The shapes are additive metadata (`metadata.knowledgeOrganiser`,
 * `metadata.anchorPoster`, `metadata.nowNextThen`) so older worksheets
 * keep rendering and the new fields are optional everywhere they appear.
 */

export interface KnowledgeOrganiserSection {
  heading: string;
  bullets: string[];
}

export interface KnowledgeOrganiserShape {
  topic: string;
  subject?: string;
  yearGroup?: string;
  sections: KnowledgeOrganiserSection[];
  generatedAt: string;
}

export interface AnchorPosterShape {
  topic: string;
  bands: { label: string; bullets: string[] }[];
  generatedAt: string;
}

export interface NowNextThenShape {
  now: { title: string; cue: string };
  next: { title: string; cue: string };
  then: { title: string; cue: string };
  generatedAt: string;
}

interface KOInputSection {
  type?: string;
  title?: string;
  content?: string;
  teacherOnly?: boolean;
}

interface KOInputWorksheet {
  title?: string;
  sections?: KOInputSection[];
  metadata?: {
    topic?: string;
    subject?: string;
    yearGroup?: string;
    [key: string]: unknown;
  };
}

const TYPE_HEADINGS: Array<{ match: RegExp; heading: string }> = [
  { match: /(word.bank|key.vocab|vocabulary)/i, heading: "Key Vocabulary" },
  { match: /(learning.objective|lo|success.criteria)/i, heading: "Learning Objective" },
  { match: /(worked.example|model.answer)/i, heading: "Worked Example" },
  { match: /(common.mistake|misconception)/i, heading: "Common Mistakes" },
  { match: /(definition|key.fact|knowledge)/i, heading: "Key Facts" },
  { match: /(formula|equation)/i, heading: "Formulas" },
];

function classifyHeading(s: KOInputSection): string | null {
  const probe = `${s.type || ""} ${s.title || ""}`.toLowerCase();
  for (const { match, heading } of TYPE_HEADINGS) {
    if (match.test(probe)) return heading;
  }
  return null;
}

function bulletsFromContent(raw: string, limit = 6): string[] {
  if (!raw) return [];
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s\-*•·\u25AA\u25E6]+/, "").trim())
    .filter((l) => l.length > 0 && l.length <= 240);
  // Prefer bullet-formed lines; fall back to first sentences.
  if (lines.length === 0) return [];
  const bullets = lines.slice(0, Math.max(limit, 1));
  return bullets;
}

/**
 * Build a Knowledge Organiser from an existing worksheet. Pure /
 * deterministic — same input always yields equal output (with a
 * stable timestamp passed via `nowIso`).
 */
export function buildKnowledgeOrganiser(
  ws: KOInputWorksheet,
  opts: { nowIso?: string } = {},
): KnowledgeOrganiserShape {
  const sections = ws.sections || [];
  const meta = ws.metadata || {};
  const buckets = new Map<string, string[]>();

  for (const s of sections) {
    if (s.teacherOnly) continue;
    const heading = classifyHeading(s);
    if (!heading) continue;
    const bullets = bulletsFromContent(String(s.content || ""));
    if (bullets.length === 0) continue;
    const existing = buckets.get(heading) || [];
    buckets.set(heading, [...existing, ...bullets]);
  }

  // Preserve the canonical heading order regardless of section order.
  const canonical: KnowledgeOrganiserSection[] = TYPE_HEADINGS.map((t) => ({
    heading: t.heading,
    bullets: (buckets.get(t.heading) || []).slice(0, 8),
  })).filter((b) => b.bullets.length > 0);

  return {
    topic: meta.topic || ws.title || "Untitled",
    subject: meta.subject,
    yearGroup: meta.yearGroup,
    sections: canonical,
    generatedAt: opts.nowIso || new Date(0).toISOString(),
  };
}

/**
 * Build an Anchor Poster — a five-band classroom-display reformat of
 * the KO. Bands are: Title, Vocab, Worked Example, Common Mistakes,
 * Memory Hook.
 */
export function buildAnchorPoster(
  ws: KOInputWorksheet,
  opts: { nowIso?: string } = {},
): AnchorPosterShape {
  const ko = buildKnowledgeOrganiser(ws, opts);
  const grab = (heading: string): string[] =>
    (ko.sections.find((s) => s.heading === heading)?.bullets || []).slice(0, 5);

  const bands = [
    { label: "TOPIC", bullets: [ko.topic] },
    { label: "KEY VOCABULARY", bullets: grab("Key Vocabulary") },
    { label: "WORKED EXAMPLE", bullets: grab("Worked Example") },
    { label: "COMMON MISTAKES", bullets: grab("Common Mistakes") },
    {
      label: "REMEMBER",
      bullets: [
        ...grab("Key Facts"),
        ...grab("Formulas"),
      ].slice(0, 5),
    },
  ].filter((b) => b.bullets.length > 0);

  return {
    topic: ko.topic,
    bands,
    generatedAt: ko.generatedAt,
  };
}

/**
 * Build Now / Next / Then cards from the section order. Picks the
 * first content-bearing pupil-facing section as "now", the next one
 * with a question as "next", and a self-reflection / wrap section as
 * "then".
 */
export function buildNowNextThen(
  ws: KOInputWorksheet,
  opts: { nowIso?: string } = {},
): NowNextThenShape {
  const sections = (ws.sections || []).filter((s) => !s.teacherOnly);

  function findBy(predicate: (s: KOInputSection) => boolean): KOInputSection | undefined {
    return sections.find(predicate);
  }

  const intro =
    findBy((s) => /(learning.objective|introduction|word.bank|key.vocab)/i.test(s.title || s.type || "")) ||
    sections[0];
  const main =
    findBy((s) => /^(q-|question|application|practice)/i.test(s.type || "")) ||
    sections[1] ||
    intro;
  const wrap =
    findBy((s) => /(self.reflection|exit.ticket|revision.tips|review)/i.test(s.title || s.type || "")) ||
    sections[sections.length - 1] ||
    main;

  return {
    now: {
      title: String(intro?.title || "Read this"),
      cue: "Look at the vocabulary and the example.",
    },
    next: {
      title: String(main?.title || "Try the questions"),
      cue: "Answer each one in order. Tick when done.",
    },
    then: {
      title: String(wrap?.title || "Check your learning"),
      cue: "Mark your work and write what you learned today.",
    },
    generatedAt: opts.nowIso || new Date(0).toISOString(),
  };
}

/**
 * Convenience: build all three and return a metadata patch shaped for
 * the post-validator chain to merge in.
 */
export function buildAuxiliaryArtifacts(
  ws: KOInputWorksheet,
  opts: { nowIso?: string } = {},
): {
  knowledgeOrganiser: KnowledgeOrganiserShape;
  anchorPoster: AnchorPosterShape;
  nowNextThen: NowNextThenShape;
} {
  return {
    knowledgeOrganiser: buildKnowledgeOrganiser(ws, opts),
    anchorPoster: buildAnchorPoster(ws, opts),
    nowNextThen: buildNowNextThen(ws, opts),
  };
}
