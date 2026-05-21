/**
 * Phase 2 — Topic-specific Self-Reflection builder
 *
 * Single source of truth for the worksheet "How Did I Do?" / "Self Reflection"
 * surface. Pure / deterministic.
 *
 * Why this exists
 * ---------------
 * Before Phase 2, when the AI failed to emit topic-anchored reflection
 * content, the structured-path SEND fallback in `ai.ts` and the renderer's
 * pad-to-3 fallback in `WorksheetRenderer.tsx:SelfReflectionSection` both
 * emitted generic placeholder content (`I can ___.`,
 * `I can apply what I have learned today`). The pupil saw literal
 * placeholders on the page and a content-free exit ticket. The reflection
 * panel became pedagogical noise instead of a metacognition prompt.
 *
 * This module is the deterministic floor. It produces topic-anchored content
 * that:
 *   - Always names the actual topic (from `metadata.topic`).
 *   - Uses command words drawn from the worksheet's own questions when
 *     available (`commandWordsUsed`), otherwise from a per-subject default
 *     table aligned with awarding-body command-word lists.
 *   - Tunes register for the same five SEND branches as `ai.ts` (tick-box /
 *     sentence-starter / emotional check-in / older-learner / standard).
 *
 * It is consumed in three places:
 *   1. The structured-path fallback in `ai.ts` (when the AI either errored
 *      or omitted reflection content).
 *   2. The Phase 2 post-validator `enforceSelfReflectionTopicAnchor`
 *      (rewrites generic AI output without overwriting good content).
 *   3. Tests in `server/tests/worksheetScrutiny.test.ts`.
 *
 * Conventions inherited from Phase 1
 * ----------------------------------
 *   - Single source of truth: every `I can …` string in the codebase that
 *     ships to a pupil should come from here. No hand-rolled placeholders
 *     anywhere else.
 *   - UK English. UK statutory framework. SI units. No US contexts.
 *   - Sciences do NOT get the dot-grid Working-Out box — Phase 1 lock.
 *     Reflection statements for sciences therefore use prose-style writing
 *     prompts, not calculation prompts (mathematical sciences excepted).
 *   - Never invent spec codes — Phase 1 lock. (The reflection surface
 *     doesn't carry specRef, but the convention applies if it ever does.)
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SelfReflectionInputs {
  /** The topic exactly as submitted to the worksheet generator. Required —
   *  every reflection statement, prompt and exit ticket mentions this. */
  topic: string;
  /** Subject string exactly as submitted (e.g. "mathematics", "biology",
   *  "english-literature"). Drives command-word selection. */
  subject?: string;
  /** Year group string ("Year 9", "Year 10", "Y11"). Reserved for future
   *  cognitive-load tuning; currently informational only. */
  year?: string | number;
  /** Section groups present on this worksheet ("recall", "understanding",
   *  "application", "challenge"). Used to bias which command words appear
   *  earliest in the I-can statements (recall verbs first, application
   *  verbs later). */
  sectionGroupsPresent?: string[];
  /** Command words actually used on the questions in this worksheet.
   *  When supplied, the builder echoes these so the reflection mirrors the
   *  verbs the pupil just saw on the questions. Falls back to the per-
   *  subject default table when empty / not supplied. */
  commandWordsUsed?: string[];
  /** Optional SEND need (lowercase, hyphenated — matches the keying in
   *  `ai.ts:2810`'s `sendKey`). Tunes the register / structure of the
   *  reflection (tick-box only / sentence-starter / emotional check-in /
   *  older-learner / standard). */
  sendKey?: string;
}

export interface SelfReflectionOutput {
  /** ≥5 "I can …" statements. Every one mentions the topic noun phrase. */
  iCanStatements: string[];
  /** 2 written-reflection prompts. Each mentions the topic noun phrase. */
  writtenPrompts: string[];
  /** Exit ticket sentence — always contains the topic noun phrase. */
  exitTicket: string;
  /** Subtitle to display above the section. */
  subtitle: string;
}

// ─── Subject classification ────────────────────────────────────────────────

function classifySubject(subject: string | undefined): "maths" | "science" | "englishLit" | "englishLang" | "humanities" | "creative" | "general" {
  const s = (subject || "").toLowerCase();
  if (s.includes("math")) return "maths";
  if (s.includes("biology") || s.includes("chemistry") || s.includes("physics") || s.includes("science")) return "science";
  if (s.includes("english-literature") || s.includes("english literature") || s.includes("literature")) return "englishLit";
  if (s.includes("english-language") || s.includes("english language") || s === "english") return "englishLang";
  if (s.includes("history") || s.includes("geography") || s.includes("religious") || s.includes("citizenship")) return "humanities";
  if (s.includes("art") || s.includes("music") || s.includes("drama") || s.includes("design")) return "creative";
  return "general";
}

// ─── Command-word defaults (per subject family) ────────────────────────────
//
// These are drawn from the AQA / Edexcel / OCR command-word vocabularies
// and the `commandWord` values that already appear on past-paper questions
// in `questionBankMaths.ts`, `questionBankBiology.ts`,
// `questionBankChemistry.ts`, `questionBankEnglish.ts`. Order is
// pedagogically sequenced (recall → understanding → application →
// analysis → evaluation) so the first 5 words form a natural confidence
// ramp.

const COMMAND_WORD_DEFAULTS: Record<ReturnType<typeof classifySubject>, string[]> = {
  maths:        ["Calculate", "Solve", "Find",      "Show that",    "Determine"],
  science:      ["Describe",  "Explain", "Calculate", "Compare",     "Evaluate"],
  englishLit:   ["Identify",  "Describe", "Explain",  "Analyse",    "Evaluate"],
  englishLang:  ["Identify",  "Describe", "Explain",  "Analyse",    "Compare"],
  humanities:   ["Describe",  "Explain", "Compare",   "Analyse",    "Evaluate"],
  creative:     ["Describe",  "Explain", "Compare",   "Analyse",    "Evaluate"],
  general:      ["Describe",  "Explain", "Identify",  "Compare",    "Evaluate"],
};

/**
 * Canonical title-cased forms for every command word that might appear in
 * `commandWordsUsed`. Used to normalise mixed casing so "calculate" and
 * "CALCULATE" both surface as "Calculate".
 */
const CANONICAL_COMMAND_WORDS: Record<string, string> = {
  "calculate": "Calculate", "solve": "Solve", "find": "Find",
  "show that": "Show that", "show": "Show that", "determine": "Determine",
  "work out": "Work out", "evaluate": "Evaluate", "estimate": "Estimate",
  "compute": "Compute",
  "describe": "Describe", "explain": "Explain", "compare": "Compare",
  "contrast": "Contrast", "analyse": "Analyse", "analyze": "Analyse",
  "identify": "Identify", "name": "Name", "state": "State", "list": "List",
  "outline": "Outline", "suggest": "Suggest", "discuss": "Discuss",
  "justify": "Justify", "assess": "Assess", "interpret": "Interpret",
  "deduce": "Deduce", "predict": "Predict", "label": "Label",
  "define": "Define", "draw": "Draw", "sketch": "Sketch", "plot": "Plot",
  "write": "Write", "complete": "Complete", "match": "Match",
  "circle": "Circle", "tick": "Tick", "underline": "Underline",
  "to what extent": "Evaluate", "explore": "Explore",
};

function canonicaliseCommandWord(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const lower = raw.trim().toLowerCase();
  if (!lower) return null;
  return CANONICAL_COMMAND_WORDS[lower] || (lower.charAt(0).toUpperCase() + lower.slice(1));
}

/**
 * Returns up to N distinct command words to use, preferring those actually
 * used on the worksheet's questions. Pads from the per-subject default
 * table. Always returns at least N items (defaults table guarantees 5).
 */
export function pickCommandWords(
  subject: string | undefined,
  commandWordsUsed: string[] | undefined,
  n = 5,
): string[] {
  const family = classifySubject(subject);
  const seen = new Set<string>();
  const out: string[] = [];

  // 1. Echo the verbs from the worksheet's own questions, in the order they
  //    were used. This anchors the reflection to what the pupil just saw.
  for (const raw of commandWordsUsed || []) {
    const canon = canonicaliseCommandWord(raw);
    if (!canon) continue;
    if (seen.has(canon)) continue;
    seen.add(canon);
    out.push(canon);
    if (out.length >= n) return out;
  }

  // 2. Pad from the per-subject default table.
  for (const word of COMMAND_WORD_DEFAULTS[family]) {
    if (seen.has(word)) continue;
    seen.add(word);
    out.push(word);
    if (out.length >= n) return out;
  }

  // 3. If still short (e.g. n > 5), fall back to general defaults.
  if (out.length < n) {
    for (const word of COMMAND_WORD_DEFAULTS.general) {
      if (seen.has(word)) continue;
      seen.add(word);
      out.push(word);
      if (out.length >= n) return out;
    }
  }
  return out;
}

// ─── Topic-noun extraction ──────────────────────────────────────────────────

/**
 * Strips a topic string down to its essential noun phrase so it reads
 * naturally inside an "I can …" statement.
 *
 * Examples:
 *   "Quadratic Equations"             → "quadratic equations"
 *   "The Heart"                       → "the heart"
 *   "Macbeth Act 1 Scene 5"           → "Macbeth Act 1 Scene 5"
 *   "An Introduction to Photosynthesis" → "photosynthesis"
 *   "Adding fractions"                → "adding fractions"
 */
export function extractTopicNounPhrase(topic: string): string {
  const t = (topic || "").trim();
  if (!t) return "";
  // Strip leading article-prefixes that read awkwardly inside "about X".
  // Keep the full string for proper-noun-led topics (Macbeth, Newton's Laws).
  const startsWithProperNoun = /^[A-Z]/.test(t) && /^[A-Z][a-z]+(\s|$)/.test(t)
    && !/^(The|An|A|Introduction|An Introduction|The Introduction)\b/i.test(t);
  if (startsWithProperNoun) return t;
  const stripped = t
    .replace(/^An Introduction to\s+/i, "")
    .replace(/^Introduction to\s+/i, "")
    .replace(/^The\s+/i, "the ")
    .replace(/^An?\s+/i, "");
  return stripped.length >= 3 ? stripped.toLowerCase() : t.toLowerCase();
}

// ─── SEND register classification ──────────────────────────────────────────
//
// Mirrors the five branches in `ai.ts:2810` so the builder's SEND output
// matches the rest of the pupil-facing surface. Anything outside these
// five branches falls back to "standard".

type SendRegister = "tickBoxOnly" | "sentenceStarter" | "emotional" | "older" | "standard";

function classifySendRegister(sendKey: string | undefined): SendRegister {
  const k = (sendKey || "").toLowerCase().replace(/[\s_]/g, "-");
  if (!k) return "standard";
  const tickBoxIds = [
    "asc", "autism", "asperger",
    "asc-social", "asc-demand-avoidant", "asc-sensory", "asc-rigid",
    "adhd", "dyslexia", "dyscalculia", "mld", "dyspraxia", "working-memory",
  ];
  if (tickBoxIds.some(id => k === id || k.startsWith(id + ":"))) return "tickBoxOnly";
  if (["slcn", "eal", "esl"].includes(k)) return "sentenceStarter";
  if (["semh", "anxiety", "mental-health", "pda", "pda-odd", "odd", "social-emotional"].includes(k)) return "emotional";
  if (["older-learners", "adult"].includes(k)) return "older";
  return "standard";
}

// ─── Builder ────────────────────────────────────────────────────────────────

/**
 * Build a topic-anchored Self-Reflection content surface for a worksheet.
 *
 * Always returns:
 *   - exactly 5 "I can …" statements, each containing the topic noun phrase
 *   - exactly 2 written-reflection prompts, each containing the topic noun
 *   - an exit-ticket sentence containing the topic noun
 *   - a subtitle appropriate for the SEND register
 *
 * Pure: identical inputs always produce identical output.
 */
export function buildSelfReflection(inputs: SelfReflectionInputs): SelfReflectionOutput {
  const topicRaw = (inputs.topic || "").trim();
  const noun = extractTopicNounPhrase(topicRaw) || "this topic";
  const verbs = pickCommandWords(inputs.subject, inputs.commandWordsUsed, 5);
  const register = classifySendRegister(inputs.sendKey);

  // ── Confidence-table I can statements ──────────────────────────────────
  // Five generic-but-topic-anchored statement frames. The verb varies; the
  // topic stays constant so every statement is provably about THIS topic.
  // The sentence-starter SEND register strips the verb stem and drops the
  // topic in directly so beginners are scaffolded with a uniform frame.
  const iCanStatements: string[] =
    register === "sentenceStarter"
      ? [
          `I can talk about ${noun} in a sentence.`,
          `I can name one key word from ${noun}.`,
          `I can give an example linked to ${noun}.`,
          `I can ask a question about ${noun}.`,
          `I can explain what I learned today about ${noun}.`,
        ]
      : [
          `I can ${verbs[0]} confidently when the question is about ${noun}.`,
          `I can ${verbs[1]} the key ideas in ${noun} using the right vocabulary.`,
          `I can ${verbs[2]} a question about ${noun} with a worked answer.`,
          `I can ${verbs[3]} what I have learned about ${noun} to a new problem.`,
          `I can ${verbs[4]} my own answer about ${noun} and spot mistakes.`,
        ];

  // ── Written prompts ─────────────────────────────────────────────────────
  // Two prompts. Both topic-anchored. Sentence-starter register is more
  // heavily scaffolded; emotional / older registers are tuned for tone.
  const writtenPrompts: string[] =
    register === "sentenceStarter"
      ? [
          `One thing I now understand about ${noun} is …`,
          `One thing I still want to ask about ${noun} is …`,
        ]
      : register === "emotional"
        ? [
            `One thing about ${noun} I felt confident about today was …`,
            `One thing about ${noun} I would like more time on is …`,
          ]
        : register === "older"
          ? [
              `The most useful thing I learned about ${noun} today is …`,
              `One way I will use what I learned about ${noun} is …`,
            ]
          : [
              `One thing I now understand about ${noun} that I did not before is …`,
              `One question I still want to ask about ${noun} is …`,
            ];

  // ── Exit ticket ─────────────────────────────────────────────────────────
  // Always names the topic. Phrasing varies by register but the topic noun
  // is non-negotiable.
  const exitTicket: string =
    register === "tickBoxOnly"
      ? `Write ONE thing you learned today about ${noun} in a single sentence:`
      : register === "emotional"
        ? `One thing I want to remember about ${noun} is:`
        : register === "older"
          ? `Write ONE key point you will take away from today's lesson on ${noun}:`
          : register === "sentenceStarter"
            ? `Today I learned about ${noun}. The most important thing was …`
            : `Write ONE thing you learned today about ${noun} in a single sentence:`;

  // ── Subtitle ────────────────────────────────────────────────────────────
  const subtitle: string =
    register === "tickBoxOnly"
      ? "How did you get on?"
      : register === "sentenceStarter"
        ? "Review your understanding."
        : register === "emotional"
          ? "How are you feeling?"
          : register === "older"
            ? "Review your learning."
            : "Review your understanding before moving on.";

  return { iCanStatements, writtenPrompts, exitTicket, subtitle };
}

// ─── Marker-block renderer ─────────────────────────────────────────────────

/**
 * Render a `SelfReflectionOutput` as the marker-block string the
 * `SelfReflectionSection` parser in `WorksheetRenderer.tsx` already
 * understands (SUBTITLE: / CONFIDENCE_TABLE: / WRITTEN_PROMPTS: /
 * EXIT_TICKET:).
 *
 * The renderer's emotional-checkin SEND branch uses CHECK_IN: instead of
 * CONFIDENCE_TABLE:; both use this same marker block format.
 */
export function renderSelfReflectionAsMarkerBlock(out: SelfReflectionOutput): string {
  const lines: string[] = [];
  if (out.subtitle) lines.push(`SUBTITLE: ${out.subtitle}`);
  if (out.iCanStatements.length > 0) {
    lines.push(`CONFIDENCE_TABLE:`);
    for (const s of out.iCanStatements) lines.push(s);
  }
  if (out.writtenPrompts.length > 0) {
    lines.push(`WRITTEN_PROMPTS:`);
    for (const p of out.writtenPrompts) lines.push(p);
  }
  if (out.exitTicket) lines.push(`EXIT_TICKET: ${out.exitTicket}`);
  return lines.join("\n");
}

// ─── Generic-content detector ──────────────────────────────────────────────

/**
 * Returns `true` when a Self-Reflection section's content reads as generic
 * placeholder text — i.e. the AI failed to anchor it to the topic. This is
 * the trigger for the post-validator to swap in builder output.
 *
 * Heuristics (any one trips):
 *   - Contains the literal placeholder `I can ___` (any number of underscores).
 *   - Contains `apply what I have learned` (the long-standing generic fallback).
 *   - Has fewer than 5 `I can …` statements.
 *   - The exit ticket exists but does not mention the topic noun.
 *
 * Returns `false` (i.e. content is OK, no rewrite) when the AI emitted ≥5
 * `I can …` statements, all containing the topic noun or its lemma, and
 * the exit ticket also contains the topic noun.
 */
export function isGenericSelfReflection(content: string, topic: string): boolean {
  const text = (content || "").toString();
  if (!text.trim()) return true;

  // Hard placeholder triggers.
  if (/I can _{2,}/i.test(text)) return true;
  if (/apply what I have learned/i.test(text)) return true;
  if (/I can apply what I/i.test(text)) return true;

  // The renderer's pad-to-3 fallback uses the literal string above — also
  // catch the variant emitted by some legacy paths.
  if (/I can apply what I('ve| have) learn(ed|t) today/i.test(text)) return true;

  const noun = extractTopicNounPhrase(topic).toLowerCase();
  const nounRoot = noun.replace(/^the\s+/, "").trim();
  const nounWords = nounRoot.split(/\s+/).filter(w => w.length >= 3);
  const textLower = text.toLowerCase();

  const mentionsTopic = (s: string): boolean => {
    if (!nounRoot) return false;
    const lower = s.toLowerCase();
    if (lower.includes(nounRoot)) return true;
    // Allow partial-word matches (≥3 chars) for multi-word topics so
    // "fraction" matches "fractions", "Macbeth" matches "Macbeth's".
    return nounWords.some(w => lower.includes(w));
  };

  // Find the I-can statement region (CONFIDENCE_TABLE: marker, or all
  // lines starting with "I can").
  const ctMatch = text.match(/CONFIDENCE_TABLE:\s*([\s\S]*?)(?=WRITTEN_PROMPTS:|EXIT_TICKET:|$)/i);
  let iCanLines: string[] = [];
  if (ctMatch) {
    iCanLines = ctMatch[1].split("\n")
      .map(l => l.replace(/^[•\-\*\d.)\s]+/, "").trim())
      .filter(Boolean);
  } else {
    iCanLines = text.split("\n")
      .map(l => l.trim())
      .filter(l => /^I can\b/i.test(l));
  }

  if (iCanLines.length > 0) {
    if (iCanLines.length < 5) return true;
    // Every one of the first 5 should mention the topic noun.
    const anchored = iCanLines.slice(0, 5).every(mentionsTopic);
    if (!anchored) return true;
  } else {
    // No I-can statements at all — generic by construction.
    return true;
  }

  // Exit ticket: only check it if present; if it's there but topic-free,
  // count the worksheet as generic.
  const etMatch = text.match(/EXIT_TICKET:\s*([^\n]+)/i);
  if (etMatch) {
    if (!mentionsTopic(etMatch[1])) return true;
  } else {
    // No exit ticket marker — check the trailing exit-ticket-shaped line.
    const trailing = text.split("\n").map(l => l.trim()).filter(Boolean).pop() || "";
    if (/exit\s*ticket|one thing you learned|key point you will take/i.test(trailing) && !mentionsTopic(trailing)) {
      return true;
    }
  }

  // Lastly: if the literal pad-to-3 fallback string survived through the
  // renderer-level pad, that's still generic noise.
  if (textLower.includes("i can apply what i have learned today")) return true;

  return false;
}
