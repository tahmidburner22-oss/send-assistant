/**
 * Phase 3 — Examiner-voice Revision Tips builder
 *
 * Single source of truth for the worksheet "Examiner Tips" / "Revision
 * Tips" surface. Pure / deterministic.
 *
 * Why this exists
 * ---------------
 * Pre-Phase-3 the worksheet ended at Self-Reflection. There was no
 * examiner-voice callout that taught a pupil HOW to attempt the
 * questions in front of them — what the command word actually wants,
 * which misconception the awarding body has flagged on this topic,
 * which method habits lose marks, how the mark scheme is structured,
 * and how to budget time against the section mark tariffs. Without
 * that, the worksheet is a question paper, not a revision resource.
 *
 * This module is the deterministic floor. It produces five tips, each
 * in a distinct category, each topic-anchored, each in UK examiner
 * voice. The tips are:
 *   1. command-word — what the worksheet's command word actually wants
 *   2. misconception — names a real misconception about THIS topic
 *   3. method        — subject-specific method habit pupils lose marks on
 *   4. mark-scheme   — how marks are awarded for the section's tariff
 *   5. time          — how to budget time against the mark tariff
 *
 * It is consumed in three places:
 *   1. The structured-path emit in `ai.ts` (so the AI either matches the
 *      worked example or its output is replaced).
 *   2. The Phase 3 post-validator `enforceRevisionTipsPresence`
 *      (rewrites generic AI output without overwriting good content).
 *   3. Tests in `server/tests/worksheetScrutiny.test.ts`.
 *
 * Conventions inherited from Phases 1 and 2
 * -----------------------------------------
 *   - Single source of truth: every visible "Examiner tip" string in the
 *     codebase that ships to a pupil should come from here. No hand-
 *     rolled tip strings anywhere else.
 *   - UK English. UK awarding-body command words. SI units. No US
 *     contexts. Examiner voice (second person, imperative, terse).
 *   - Sciences do NOT get the dot-grid working-out box — Phase 1 lock.
 *     The method-tip text differs by subject family (maths: "show every
 *     step"; sciences: "include units before rounding"; humanities:
 *     "anchor every claim to a date or source"; English: "embed the
 *     quote, then analyse a single word") — but this section never
 *     carries a working-out affordance.
 *   - Never invent spec codes — Phase 1 lock. Tips reference `specRef`
 *     only when one is already on the worksheet.
 *
 * Reuse
 * -----
 * Phase 2's `selfReflectionBuilder` already centralises three things
 * that the Revision-Tips surface needs: `classifySubject`,
 * `classifySendRegister` and `extractTopicNounPhrase` /
 * `pickCommandWords`. This module imports them rather than duplicating
 * — keeping the single-source-of-truth invariant intact.
 */

import {
  classifySendRegister,
  classifySubject,
  extractTopicNounPhrase,
  pickCommandWords,
  type SendRegister,
  type SubjectFamily,
} from "./selfReflectionBuilder";

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * One examiner tip. The category is exposed so the renderer (and tests)
 * can label / colour-code rows; in normal output the category is shown
 * as an UPPERCASE label prefix on the rendered line.
 */
export interface RevisionTip {
  category: "command-word" | "misconception" | "method" | "mark-scheme" | "time";
  /** Short uppercase label shown to the pupil (e.g. "COMMAND WORD"). */
  label: string;
  /** The tip text itself. Examiner voice. UK English. ≤ 200 chars. */
  text: string;
}

export interface RevisionTipsInputs {
  /** Topic exactly as submitted to the worksheet generator. */
  topic: string;
  /** Subject string exactly as submitted (drives method-tip text and
   *  command-word selection). */
  subject?: string;
  /** Year group string ("Year 9", "Year 10", "Y11"). Reserved for
   *  future cognitive-load tuning; currently informational only. */
  year?: string | number;
  /** Awarding-body code (aqa | edexcel | ocr | wjec | ccea | …) exactly
   *  as submitted. Currently used only in the worded mark-scheme tip. */
  examBoard?: string;
  /** Command words actually used on the questions in this worksheet.
   *  When supplied, the command-word tip echoes the FIRST verb so the
   *  tip mirrors what the pupil is about to see. Falls back to the
   *  per-subject default when empty. */
  commandWordsUsed?: string[];
  /** Per-question marks tariff (e.g. [1, 1, 1, 2, 2, 3, 4, 5, 6, 8]).
   *  When supplied, the time-tip uses sum-of-marks * 1.0 minute as a
   *  budget anchor and the mark-scheme tip mentions the largest tariff
   *  on the worksheet. */
  marksUsed?: number[];
  /** One or more topic-specific misconceptions, exactly as the AI or
   *  the common-mistakes section surfaced them. The misconception tip
   *  echoes the first item verbatim (≤ 140 chars, sentence-cased). */
  misconceptions?: string[];
  /** Optional SEND need (lowercase, hyphenated — same keying as
   *  `sendKey` in `selfReflectionBuilder.ts`). Tunes register / tone. */
  sendKey?: string;
}

export interface RevisionTipsOutput {
  /** Always exactly five tips, in canonical category order:
   *  command-word, misconception, method, mark-scheme, time. */
  tips: RevisionTip[];
  /** Subtitle to display above the panel. Tuned for SEND register. */
  subtitle: string;
}

// ─── Per-subject method-tip text ────────────────────────────────────────────
//
// One short, examiner-voice sentence per subject family. Names the
// concrete habit pupils lose marks on. Written so it reads naturally
// when prefixed by "Method:" or "WATCH OUT:".

const METHOD_TIPS: Record<SubjectFamily, string> = {
  maths:
    "Show every step of your working — method marks are awarded for the steps, not just the final answer. Always state the units, and round only at the very end.",
  science:
    "Quote the formula, substitute the numbers, then evaluate. Always include the SI unit on your answer and the variable on each labelled axis if you draw a graph.",
  englishLit:
    "Embed each quotation inside your sentence (under six words is plenty), then analyse a SINGLE word from it. Link your point back to the writer's intent in every paragraph.",
  englishLang:
    "Anchor every point to a precise quotation and name the technique (e.g. simile, plosive, modal verb). Then comment on the EFFECT on the reader, not what it 'shows'.",
  humanities:
    "Anchor every claim to a date, named source or named figure. Use connectives like 'however' and 'as a result' so your causal chain is explicit.",
  creative:
    "Reference a named practitioner / artist / composer for every claim, and link your evaluation to the brief's intended audience.",
  general:
    "Re-read the question before you answer it; underline the command word and the topic noun. Plan one short sentence per mark before you write.",
};

// ─── Per-subject misconception fallback text ────────────────────────────────
//
// Used when `misconceptions[]` is empty. Topic-anchored via the topic
// noun phrase so the tip is never generic.

function defaultMisconceptionTip(family: SubjectFamily, noun: string): string {
  switch (family) {
    case "maths":
      return `Pupils most often lose marks on ${noun} by skipping a method line or not converting units before they calculate. Slow down.`;
    case "science":
      return `Pupils most often lose marks on ${noun} by writing the right idea in everyday language. Use the precise scientific term and quote the formula.`;
    case "englishLit":
      return `Pupils most often lose marks on ${noun} by retelling the plot rather than analysing a word, technique or structural choice.`;
    case "englishLang":
      return `Pupils most often lose marks on ${noun} by spotting features without explaining the EFFECT on the reader. Always answer the "so what?" question.`;
    case "humanities":
      return `Pupils most often lose marks on ${noun} by giving a one-sided answer. Use "however" at least once and reach a clear judgement at the end.`;
    case "creative":
      return `Pupils most often lose marks on ${noun} by describing the work without evaluating it. Say what works, what doesn't, and why.`;
    case "general":
    default:
      return `Pupils most often lose marks on ${noun} by misreading the command word. Underline it, then plan ONE short sentence per mark before you write.`;
  }
}

// ─── Per-subject mark-scheme phrasing ───────────────────────────────────────
//
// Tells the pupil how marks are STRUCTURED for this subject family.
// Used by the mark-scheme tip; topic-anchored via the noun phrase and,
// when supplied, the largest mark tariff on the worksheet.

function markSchemeTip(family: SubjectFamily, noun: string, topMarks: number, examBoard: string | undefined): string {
  const board = (examBoard || "").trim();
  const boardLabel = board ? board.toUpperCase() : "the awarding body";
  const tariff = topMarks > 0 ? `the ${topMarks}-mark question on ${noun}` : `the longest question on ${noun}`;
  switch (family) {
    case "maths":
      return `On ${tariff}, ${boardLabel} mark schemes typically award method marks (M) for the chosen approach and accuracy marks (A) for the final answer with units. Lose your method line and you lose the M marks.`;
    case "science":
      return `On ${tariff}, ${boardLabel} mark schemes reward the correct subject vocabulary AND a worked numerical answer with units. One mark per discrete idea — keep your sentences short.`;
    case "englishLit":
      return `On ${tariff}, Level 4 / top-band ${boardLabel} answers need a sustained argument, embedded quotations and analysis at the level of a single word or technique. Reach a clear judgement.`;
    case "englishLang":
      return `On ${tariff}, the ${boardLabel} grid rewards precise terminology AND a comment on the EFFECT on the reader. One mark per technique-plus-effect pair.`;
    case "humanities":
      return `On ${tariff}, top-band ${boardLabel} answers carry a balanced argument, specific dated evidence and an explicit judgement. The judgement is the difference between Level 3 and Level 4.`;
    case "creative":
      return `On ${tariff}, the ${boardLabel} grid rewards subject-specific vocabulary and an evaluation linked to the audience or brief — not a description of the work.`;
    case "general":
    default:
      return `On ${tariff}, ${boardLabel} examiners reward direct answers to the command word and topic. One short sentence per mark is usually enough.`;
  }
}

// ─── Per-command-word tip text ──────────────────────────────────────────────
//
// What each command word ACTUALLY wants the pupil to do. UK awarding-
// body command-word lists harmonised — same vocabulary used across
// AQA / Edexcel / OCR / WJEC / CCEA. Lookup is case-insensitive.

const COMMAND_WORD_DEFINITIONS: Record<string, string> = {
  calculate: "give a numerical answer with the units, showing every step of your method",
  "work out": "give a numerical answer with the units, showing every step of your method",
  solve: "find the value(s) of the unknown — show the rearrangement, then the substitution, then the answer",
  find: "give the answer with appropriate units; show your method only if the marks demand it",
  "show that": "derive the stated result — full working only, no narrative; the final line MUST be the stated value",
  "prove that": "construct a logical chain from a known fact to the stated result; every step must be justified",
  determine: "give a numerical or algebraic answer that you have actually calculated, not estimated",
  evaluate: "weigh strengths and limitations, then reach a clear judgement at the end",
  estimate: "round each value to one significant figure, then calculate; do NOT use a calculator",
  describe: "say WHAT happens or WHAT something looks like — no reasons unless asked",
  explain: "give the reason WHY — chain your sentences with 'because', 'so' or 'therefore'",
  compare: "use comparative language ('whereas', 'more than', 'unlike') in every sentence; cover both items",
  contrast: "focus on the DIFFERENCES; structure paragraph by paragraph or point by point",
  analyse: "break the topic into parts, examine each part, then comment on how the parts relate",
  identify: "name the item / feature / part — usually one or two words is enough",
  state: "give a single short factual answer; no explanation needed",
  list: "write the items in a single line or numbered, with no commentary",
  outline: "give the main points in order, briefly — no detail unless asked",
  suggest: "propose a sensible answer based on the information given; you do not need to be certain",
  discuss: "consider more than one viewpoint, then reach a balanced conclusion",
  justify: "give reasons that support the stated position; one reason per sentence",
  assess: "judge the importance / significance with evidence; reach an explicit conclusion",
  interpret: "explain the meaning of the data / source in the context of the question",
  deduce: "use the information given to reach a logical conclusion; cite what you used",
  predict: "use the pattern / law to forecast the next value or outcome; quote the trend",
  define: "give a precise meaning — usually one short sentence using the technical term",
  draw: "produce a labelled diagram with a title; use a sharp pencil and a ruler for any straight lines",
  sketch: "produce a quick freehand drawing showing the key features and labels",
  plot: "mark each point accurately on the axes; join with a line of best fit only when asked",
  label: "annotate the diagram with the named parts; no description unless asked",
  to: "give a balanced argument and reach a judgement at the end (likely 'to what extent')",
};

function commandWordTip(verb: string, noun: string): string {
  // Try a verbatim lookup first (full key, e.g. "show that"), then a
  // first-word fallback ("show that" → "show"). Default fallback is
  // "answer the question precisely" — better than nothing.
  const v = verb.trim().toLowerCase();
  if (!v) return `Re-read the question, underline the command word, and answer the question on ${noun} precisely.`;
  const longHit = COMMAND_WORD_DEFINITIONS[v];
  if (longHit) return `When the question says "${verb} …", the examiner wants you to ${longHit}.`;
  const head = v.split(/\s+/)[0];
  const headHit = COMMAND_WORD_DEFINITIONS[head];
  if (headHit) return `When the question says "${verb} …", the examiner wants you to ${headHit}.`;
  return `When the question says "${verb} …" on ${noun}, answer that command precisely — no more, no less.`;
}

// ─── Time-tip ───────────────────────────────────────────────────────────────

/**
 * UK examiners typically allow ~1 minute per mark on Foundation papers
 * and ~1.2–1.5 minutes per mark on Higher / GCE. Pupils consistently
 * spend too long on early low-tariff questions and run out of time on
 * the back end. This tip surfaces the budget so they can pace
 * themselves.
 */
function timeTip(noun: string, totalMarks: number, topMarks: number): string {
  if (totalMarks <= 0) {
    return `Pace yourself: spend roughly one minute per mark. The longest question on ${noun} is worth the most — leave it enough time.`;
  }
  const budget = Math.max(5, Math.round(totalMarks * 1.0));
  const topPart = topMarks > 0 ? ` Save at least ${Math.max(2, Math.round(topMarks * 1.5))} minutes for the ${topMarks}-mark stretch question on ${noun}.` : "";
  return `Pace yourself: aim to spend about ${budget} minutes on the worksheet — roughly one minute per mark.${topPart}`;
}

// ─── SEND register tuning ───────────────────────────────────────────────────

function subtitleForRegister(register: SendRegister): string {
  switch (register) {
    case "tickBoxOnly":
      return "Top tips before you start.";
    case "sentenceStarter":
      return "Read these tips out loud before you start.";
    case "emotional":
      return "Quick tips to keep you on track.";
    case "older":
      return "Examiner tips before you attempt the questions.";
    case "standard":
    default:
      return "Read these examiner tips before you start.";
  }
}

/**
 * For sentence-starter / tick-box-only register we shorten every tip to
 * one short sentence and drop the discursive "When the question says…"
 * preamble. Pure / lossless on standard register.
 */
function shortenForSendRegister(text: string, register: SendRegister): string {
  if (register !== "sentenceStarter" && register !== "tickBoxOnly") return text;
  // Take the first sentence only.
  const firstSentence = text.split(/(?<=[.!?])\s+/)[0] || text;
  return firstSentence.length > 140 ? firstSentence.slice(0, 137).trim() + "…" : firstSentence;
}

// ─── Misconception extraction ───────────────────────────────────────────────

/**
 * Sentence-cases the first item in `misconceptions[]`, strips bullets /
 * leading "Common mistake:" markers, and caps at 140 chars so it fits
 * on the printed panel. Returns null when no usable misconception was
 * supplied.
 */
function pickFirstMisconception(misconceptions: string[] | undefined, noun: string): string | null {
  if (!misconceptions || misconceptions.length === 0) return null;
  for (const raw of misconceptions) {
    if (!raw) continue;
    let s = String(raw).trim();
    if (!s) continue;
    // Strip bullet markers and "Common mistake:" prefixes.
    s = s.replace(/^[\u2022\-\*\d.)\s]+/, "");
    s = s.replace(/^(common\s+mistake|misconception|watch\s+out)\s*[:\-—]\s*/i, "");
    if (!s) continue;
    // Sentence-case the first letter; preserve any acronyms / proper nouns.
    if (/[a-z]/.test(s.charAt(0))) {
      s = s.charAt(0).toUpperCase() + s.slice(1);
    }
    // Cap length.
    if (s.length > 140) s = s.slice(0, 137).trimEnd() + "…";
    // Make sure the noun is implied somewhere; if the misconception is a
    // bare fragment, prepend the noun for context.
    if (!/[a-z]/i.test(s)) {
      s = `Pupils get ${noun} wrong because ${s.toLowerCase()}`;
    }
    return s;
  }
  return null;
}

// ─── Builder ────────────────────────────────────────────────────────────────

/**
 * Build a topic-anchored Revision-Tips panel for a worksheet.
 *
 * Always returns exactly five tips, in this fixed order:
 *   1. command-word — what the worksheet's command word actually wants
 *   2. misconception — names a real misconception about THIS topic
 *   3. method — subject-specific method habit
 *   4. mark-scheme — how marks are awarded for the section's tariff
 *   5. time — how to budget time against the mark tariff
 *
 * Pure: identical inputs always produce identical output.
 */
export function buildRevisionTips(inputs: RevisionTipsInputs): RevisionTipsOutput {
  const topicRaw = (inputs.topic || "").trim();
  const noun = extractTopicNounPhrase(topicRaw) || "this topic";
  const family = classifySubject(inputs.subject);
  const register = classifySendRegister(inputs.sendKey);

  // ── 1. Command-word tip ────────────────────────────────────────────────
  // Echo the first command word the worksheet actually used, falling
  // back to the per-subject default ladder. `pickCommandWords` already
  // canonicalises casing ("calculate" → "Calculate", "to what extent"
  // → "Evaluate") so the tip reads cleanly.
  const verbs = pickCommandWords(inputs.subject, inputs.commandWordsUsed, 1);
  const verb = verbs[0] || "Answer";
  const commandText = commandWordTip(verb, noun);

  // ── 2. Misconception tip ───────────────────────────────────────────────
  const supplied = pickFirstMisconception(inputs.misconceptions, noun);
  const misconceptionText = supplied || defaultMisconceptionTip(family, noun);

  // ── 3. Method tip ──────────────────────────────────────────────────────
  const methodText = METHOD_TIPS[family];

  // ── 4. Mark-scheme tip ─────────────────────────────────────────────────
  const marks = (inputs.marksUsed || []).filter(m => Number.isFinite(m) && m > 0);
  const topMarks = marks.length > 0 ? Math.max(...marks) : 0;
  const totalMarks = marks.reduce((a, b) => a + b, 0);
  const markSchemeText = markSchemeTip(family, noun, topMarks, inputs.examBoard);

  // ── 5. Time tip ────────────────────────────────────────────────────────
  const timeText = timeTip(noun, totalMarks, topMarks);

  // Apply SEND-register shortening last so the canonical category text
  // is preserved on standard register.
  const tips: RevisionTip[] = [
    { category: "command-word", label: "COMMAND WORD",  text: shortenForSendRegister(commandText,      register) },
    { category: "misconception", label: "WATCH OUT",     text: shortenForSendRegister(misconceptionText, register) },
    { category: "method",        label: "METHOD",        text: shortenForSendRegister(methodText,        register) },
    { category: "mark-scheme",   label: "MARK SCHEME",   text: shortenForSendRegister(markSchemeText,    register) },
    { category: "time",          label: "TIME",          text: shortenForSendRegister(timeText,          register) },
  ];

  return { tips, subtitle: subtitleForRegister(register) };
}

// ─── Marker-block renderer ──────────────────────────────────────────────────

/**
 * Render a `RevisionTipsOutput` as a marker-block string the renderer
 * parses back into a list of cards. Format:
 *   SUBTITLE: <subtitle>
 *   TIPS:
 *   1. COMMAND WORD: <text>
 *   2. WATCH OUT: <text>
 *   …
 */
export function renderRevisionTipsAsMarkerBlock(out: RevisionTipsOutput): string {
  const lines: string[] = [];
  if (out.subtitle) lines.push(`SUBTITLE: ${out.subtitle}`);
  lines.push("TIPS:");
  out.tips.forEach((tip, i) => {
    lines.push(`${i + 1}. ${tip.label}: ${tip.text}`);
  });
  return lines.join("\n");
}

// ─── Generic-content detector ───────────────────────────────────────────────

/**
 * Returns `true` when a Revision-Tips section's content reads as
 * generic placeholder text (i.e. the AI failed to anchor it to the
 * topic, or the panel is shorter than the canonical five tips). This
 * is the trigger for the post-validator to swap in builder output.
 *
 * Heuristics (any one trips):
 *   - Contains common generic stems ("revise carefully", "study hard",
 *     "make sure you understand", "good luck", "remember to revise").
 *   - Contains the literal placeholder `…` / `___` / `[Tip 1]` etc.
 *   - Has fewer than 5 numbered tips (or 5 lines starting with a tip
 *     category label / number).
 *   - The first tip line does not mention the topic noun phrase.
 *   - None of the tip lines name a UK awarding-body command word.
 *
 * Returns `false` when the panel has ≥ 5 tip-shaped lines, the topic
 * noun appears at least once, and at least one canonical command word
 * appears at least once.
 */
export function isGenericRevisionTips(content: string, topic: string): boolean {
  const text = (content || "").toString();
  if (!text.trim()) return true;

  // Hard placeholder triggers.
  if (/revise\s+carefully/i.test(text)) return true;
  if (/study\s+hard/i.test(text)) return true;
  if (/make\s+sure\s+you\s+(?:understand|revise)/i.test(text)) return true;
  if (/good\s+luck\b/i.test(text)) return true;
  if (/remember\s+to\s+revise/i.test(text)) return true;
  if (/\[\s*tip\s*\d+\s*\]/i.test(text)) return true;
  if (/_{2,}/.test(text)) return true;

  // Count tip-shaped lines: numbered (1. …, 2. …) OR labelled
  // (COMMAND WORD: …, WATCH OUT: …, METHOD: …, MARK SCHEME: …, TIME: …).
  const tipLines = text.split("\n").map(l => l.trim()).filter(l => {
    if (!l) return false;
    if (/^\d+[.)]\s+\S/.test(l)) return true;
    if (/^(COMMAND\s*WORD|WATCH\s*OUT|MISCONCEPTION|METHOD|MARK\s*SCHEME|TIME)\s*:/i.test(l)) return true;
    return false;
  });
  if (tipLines.length < 5) return true;

  // Topic anchoring — at least one of the first five tips should name
  // the topic noun (or one of its words ≥ 4 chars). Mirrors the
  // word-boundary safety rules from `isGenericSelfReflection`.
  const noun = extractTopicNounPhrase(topic).toLowerCase();
  const nounRoot = noun.replace(/^the\s+/, "").trim();
  const nounWords = nounRoot.split(/\s+/).filter(w => w.length >= 4);
  const escapeForRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const containsNeedle = (haystack: string, needle: string): boolean => {
    if (!needle) return false;
    if (needle.length < 4) {
      const re = new RegExp(`\\b${escapeForRegex(needle)}\\b`);
      return re.test(haystack);
    }
    return haystack.includes(needle);
  };
  const mentionsTopic = (s: string): boolean => {
    if (!nounRoot) return false;
    const lower = s.toLowerCase();
    if (containsNeedle(lower, nounRoot)) return true;
    return nounWords.some(w => containsNeedle(lower, w));
  };
  const anchored = tipLines.slice(0, 5).some(mentionsTopic);
  if (!anchored) return true;

  // At least one tip should reference an awarding-body command word.
  // Use a minimal canonical list (case-insensitive, word-boundary).
  const COMMAND_WORDS_FOR_DETECTION = [
    "calculate", "work out", "solve", "find", "show that", "prove that", "determine",
    "evaluate", "estimate", "describe", "explain", "compare", "contrast", "analyse",
    "identify", "state", "list", "outline", "suggest", "discuss", "justify", "assess",
    "interpret", "deduce", "predict", "define", "draw", "sketch", "plot", "label",
  ];
  const lower = text.toLowerCase();
  const hasCommandWord = COMMAND_WORDS_FOR_DETECTION.some(cw => {
    const re = new RegExp(`\\b${escapeForRegex(cw)}\\b`);
    return re.test(lower);
  });
  if (!hasCommandWord) return true;

  return false;
}



// ─── PR-19 carry-over #19 — Time-budget reconcile ──────────────────────────
//
// `metadata.estimatedTime` is set on most worksheets as a free-text
// string (e.g. "45 minutes", "35–45 mins", "1 hour"). The Revision-
// Tips builder computes its own time recommendation from the per-Q
// marks tariff (≈ 1 minute per mark). When the two drift wildly —
// e.g. the worksheet ships with 50 marks of questions but the
// metadata says "20 minutes" — pupils get either a frustration spike
// or a coast. This helper surfaces the drift as a single warning so
// the post-validator chain can stamp it on metadata.postValidatorWarnings.
//
// Pure / idempotent. Returns warnings only — never rewrites metadata.

const TIME_RANGE_RE = /(\d+)\s*(?:[–\-—to]+\s*(\d+))?\s*(?:min|minute|mins|hour|hr|h\b|hours)/i;
const HOUR_RE = /\bhour|\bhr|\bh\b/i;

/**
 * Parse a worksheet's `metadata.estimatedTime` string into a numeric
 * minute range. Returns null when the string can't be parsed. Accepts
 * "45 minutes", "35–45 mins", "1 hour", "1 to 2 hours", "20-30 mins".
 */
export function parseEstimatedTimeMinutes(raw: string | undefined): { min: number; max: number } | null {
  if (!raw) return null;
  const match = TIME_RANGE_RE.exec(raw);
  if (!match) return null;
  const lower = Number(match[1]);
  const upper = match[2] ? Number(match[2]) : lower;
  if (!Number.isFinite(lower) || !Number.isFinite(upper)) return null;
  const isHours = HOUR_RE.test(raw);
  const factor = isHours ? 60 : 1;
  const lo = Math.min(lower, upper) * factor;
  const hi = Math.max(lower, upper) * factor;
  return { min: lo, max: hi };
}

export interface TimeBudgetReconcileInputs {
  /** The worksheet's marks tariff (per Q). */
  marksUsed?: number[];
  /** The worksheet's `metadata.estimatedTime` string. */
  estimatedTime?: string;
  /** Allowed drift, expressed as a multiplier of the parsed minute. */
  driftRatio?: number;
}

export interface TimeBudgetReconcileResult {
  warnings: string[];
  /** Computed budget from the marks tariff (minutes). */
  computedMinutes: number;
  /** Parsed minute range from the metadata string, or null. */
  metadataRange: { min: number; max: number } | null;
  /** True when the parsed metadata is outside the drift band. */
  drifted: boolean;
}

/**
 * Reconcile the builder's mark-tariff budget against the worksheet's
 * `metadata.estimatedTime` string. Emits at most ONE warning when the
 * parsed metadata sits outside the drift band (default ±50%).
 *
 * No-ops when the marks tariff is empty (the budget is unknowable) or
 * the metadata string can't be parsed (the audit has nothing to compare
 * against).
 */
export function reconcileRevisionTipsTimeBudget(
  inputs: TimeBudgetReconcileInputs,
): TimeBudgetReconcileResult {
  const drift = inputs.driftRatio ?? 0.5;
  const marks = (inputs.marksUsed || []).filter((m) => Number.isFinite(m) && m > 0);
  const computed = Math.max(0, Math.round(marks.reduce((a, b) => a + b, 0) * 1.0));
  const range = parseEstimatedTimeMinutes(inputs.estimatedTime);
  if (!range || computed <= 0) {
    return { warnings: [], computedMinutes: computed, metadataRange: range, drifted: false };
  }
  const lowerBand = Math.floor(computed * (1 - drift));
  const upperBand = Math.ceil(computed * (1 + drift));
  // Drifted = the entire metadata range sits outside the band on
  // either side. A range that overlaps the band at all does not
  // warn.
  const drifted = range.max < lowerBand || range.min > upperBand;
  const warnings: string[] = [];
  if (drifted) {
    warnings.push(
      `[Phase PR-19 — Revision Tips time budget] Builder estimate ${computed} min (1 min per mark, ${marks.length} Qs) drifts from metadata.estimatedTime "${inputs.estimatedTime}".`,
    );
  }
  return { warnings, computedMinutes: computed, metadataRange: range, drifted };
}
