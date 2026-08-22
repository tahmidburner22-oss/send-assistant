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

/**
 * Subject family classifier shared with `revisionTipsBuilder.ts`. Exported
 * so every Phase 2+ surface that wants subject-aware behaviour (command-
 * word defaults, method tips, mark-scheme phrasing) routes through one
 * canonical mapping rather than re-implementing the same `s.includes(…)`
 * ladder. Returns a discriminated union, not a free string, so callers
 * can be exhaustive in their per-family switches.
 */
export type SubjectFamily = "maths" | "science" | "englishLit" | "englishLang" | "humanities" | "creative" | "general";

export function classifySubject(subject: string | undefined): SubjectFamily {
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

const COMMAND_WORD_DEFAULTS: Record<SubjectFamily, string[]> = {
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
 * Curated set of genuine proper-noun heads that lead UK KS3 / GCSE / KS5
 * curriculum topics. When the FIRST WORD of a topic (case-insensitive,
 * with possessive `'s` / `'` stripped) matches one of these, the topic is
 * preserved in its given casing so reflection statements like
 * "I can analyse Macbeth's tragic flaw" read correctly.
 *
 * Conservative on purpose. Anything not listed (and without a structural
 * proper-noun cue — possessive apostrophe, Act/Scene reference, X-and-Y
 * pattern) falls through to lowercase, which is the safe default for
 * common-noun curriculum titles like "Adding Fractions" or
 * "Quadratic Equations" so they read naturally in mid-sentence templates.
 */
const PROPER_NOUN_HEADS = new Set<string>([
  // English Literature — texts and authors
  "macbeth", "hamlet", "othello", "lear", "tempest", "romeo", "juliet",
  "shakespeare", "shakespearean", "shakespeare's",
  "frankenstein", "jekyll", "hyde", "dracula", "godot", "gatsby",
  "crucible", "mockingbird", "1984",
  "dickens", "stevenson", "orwell", "priestley", "atwood", "austen",
  "brontë", "bronte", "wilde", "heaney", "duffy", "armitage", "blake",
  // Religions and belief systems
  "christianity", "christian", "christians", "christ", "jesus",
  "islam", "islamic", "muslim", "muslims",
  "judaism", "jewish", "jews",
  "hinduism", "hindu", "hindus",
  "buddhism", "buddhist", "buddhists", "buddha",
  "sikhism", "sikh", "sikhs",
  "humanism", "humanist", "humanists",
  "god", "allah", "muhammad", "krishna",
  // History — periods, peoples, individuals
  "norman", "normans", "saxon", "saxons", "viking", "vikings",
  "anglo", "anglo-saxon", "anglo-saxons",
  "tudor", "tudors", "stuart", "stuarts", "georgian", "victorian",
  "edwardian", "elizabethan",
  "british", "english", "european", "american", "russian", "german",
  "french", "spanish", "italian", "japanese", "chinese", "indian",
  "roman", "romans", "greek", "greeks", "egyptian", "egyptians", "mayan",
  "aztec", "aztecs", "inca", "incas",
  "nazi", "nazis", "soviet", "soviets", "ottoman", "ottomans", "holocaust",
  "henry", "elizabeth", "victoria", "edward", "george", "william",
  "richard", "mary",
  "hitler", "stalin", "lenin", "napoleon", "churchill", "cromwell",
  "gandhi", "mandela",
  "world", "wwi", "wwii",
  // Geography — places and major regions
  "africa", "africa's", "asia", "europe", "americas", "antarctica", "arctic",
  "britain", "britain's", "england", "england's", "scotland", "wales",
  "ireland", "uk", "us", "usa", "russia", "china", "india",
  "germany", "france", "japan", "brazil", "kenya", "egypt",
  "amazon", "sahara", "himalayas",
  "london", "paris", "rome", "tokyo", "mumbai", "delhi",
  // Sciences — eponyms
  "newton", "einstein", "darwin", "mendel", "watson", "crick",
  "hooke", "kelvin", "celsius", "fahrenheit",
  "faraday", "ohm", "boyle", "charles",
  "pythagoras", "pythagorean", "fibonacci", "euler",
  // Computing — languages and platforms
  "python", "java", "javascript", "html", "css", "sql", "linux", "windows",
]);

/**
 * Returns true when the topic is led by a genuine proper noun and should
 * have its original casing preserved. Combines a curated whitelist of
 * common UK-curriculum proper-noun heads with structural cues (possessive
 * apostrophe-s, Act / Scene / Chapter / Volume references, "X and Y"
 * pattern between two Title-Case words).
 *
 * Common-noun curriculum titles like "Adding Fractions" or "Quadratic
 * Equations" or "Photosynthesis" return false — they fall through to the
 * lowercase fallback so they read naturally inside mid-sentence "I can …"
 * templates ("I can describe photosynthesis", not "I can describe
 * Photosynthesis").
 */
function isProperNounLed(t: string): boolean {
  if (!t) return false;
  const tokens = t.split(/\s+/);
  const firstWord = tokens[0] || "";
  if (!firstWord) return false;
  // Possessive apostrophe-s on a capitalised first word ("Newton's",
  // "Murphy's", "Pythagoras'") is a high-confidence proper-noun signal.
  if (/^[A-Z][a-zA-Zà-ÿ]+['’](s)?$/.test(firstWord)) return true;
  // Curated whitelist match (case-insensitive, with possessive suffix
  // stripped so "Newton's" and "Newton" both lookup as "newton").
  const key = firstWord.toLowerCase().replace(/['’]s?$/, "");
  if (PROPER_NOUN_HEADS.has(key)) return true;
  // Act / Scene / Chapter / Book / Volume / Part references with a
  // numeral suffix indicate a literary or historical proper noun
  // ("Macbeth Act 1 Scene 5", "Of Mice and Men Chapter 2") even when
  // the first word isn't whitelisted.
  if (/\b(Act|Scene|Chapter|Book|Volume|Part|Canto|Stanza)\s+(\d+|[IVX]+)\b/i.test(t)) {
    return true;
  }
  // "X and Y" between two Title-Case words ("Romeo and Juliet",
  // "Watson and Crick", "Marx and Engels") — preserves the canonical
  // casing of paired proper nouns even when only one is whitelisted.
  if (/^[A-Z][a-zA-Z]+\s+(and|&)\s+[A-Z][a-zA-Z]+/.test(t)) return true;
  return false;
}

/**
 * Strips a topic string down to its essential noun phrase so it reads
 * naturally inside an "I can …" statement.
 *
 * Examples:
 *   "Quadratic Equations"             → "quadratic equations"
 *   "The Heart"                       → "the heart"
 *   "Macbeth Act 1 Scene 5"           → "Macbeth Act 1 Scene 5"
 *   "Newton's Laws"                   → "Newton's Laws"
 *   "Romeo and Juliet"                → "Romeo and Juliet"
 *   "Photosynthesis"                  → "photosynthesis"
 *   "Adding Fractions"                → "adding fractions"
 *   "An Introduction to Photosynthesis" → "photosynthesis"
 *   "Adding fractions"                → "adding fractions"
 */
export function extractTopicNounPhrase(topic: string): string {
  const t = (topic || "").trim();
  if (!t) return "";
  // All-caps acronyms (≤8 chars, letters / digits) stay uppercase. These
  // are domain proper nouns (GDPR, NHS, BBC, GCSE, AQA, KS3, …) and read
  // wrong as "I can describe gdpr".
  if (/^[A-Z][A-Z0-9]{1,7}$/.test(t)) return t;
  // Genuine proper-noun-led topics keep their given casing. Common-noun
  // titles (the default) fall through to the lowercase strip below — so
  // "Adding Fractions" / "Quadratic Equations" / "Photosynthesis" become
  // reading-natural noun phrases rather than leaking title case into
  // mid-sentence templates.
  if (isProperNounLed(t)) return t;
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

/**
 * SEND register tag shared with `revisionTipsBuilder.ts`. Exported so the
 * Revision-Tips surface tunes its register the same way the Self-
 * Reflection surface does — pupils with the same SEND profile see a
 * consistent reading-age and tone across both panels.
 */
export type SendRegister = "tickBoxOnly" | "sentenceStarter" | "emotional" | "older" | "standard";

export function classifySendRegister(sendKey: string | undefined): SendRegister {
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
 * Scrutiny document requirement: Reduce the self-reflection section to
 * exactly ONE quick exit ticket question. The confidence grid and written
 * reflection prompts have been removed as they make the worksheet too long.
 *
 * Returns:
 *   - an empty iCanStatements array (confidence grid removed)
 *   - an empty writtenPrompts array (written reflection removed)
 *   - a single exit-ticket sentence containing the topic noun
 *   - a subtitle appropriate for the SEND register
 *
 * Pure: identical inputs always produce identical output.
 */
export function buildSelfReflection(inputs: SelfReflectionInputs): SelfReflectionOutput {
  const topicRaw = (inputs.topic || "").trim();
  const noun = extractTopicNounPhrase(topicRaw) || "this topic";
  const register = classifySendRegister(inputs.sendKey);

  // ── Confidence-table I can statements ──────────────────────────────────
  // REMOVED per scrutiny document: confidence grid is too long for a worksheet.
  const iCanStatements: string[] = [];

  // ── Written prompts ─────────────────────────────────────────────────────
  // REMOVED per scrutiny document: written reflection prompts are too long.
  const writtenPrompts: string[] = [];

  // ── Exit ticket ─────────────────────────────────────────────────────────
  // Single exit ticket only — always names the topic. Phrasing varies by
  // register but the topic noun is non-negotiable.
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
    register === "sentenceStarter"
      ? "Finish the sentence:"
      : register === "emotional"
        ? "A calm final thought:"
        : register === "older"
          ? "Review your learning:"
          : "Quick exit question:";

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
 * Updated per scrutiny document: the reflection section now contains ONLY
 * an exit ticket. The heuristics have been updated accordingly:
 *   - Contains the literal placeholder `I can ___` (any number of underscores).
 *   - Contains `apply what I have learned` (the long-standing generic fallback).
 *   - The exit ticket exists but does not mention the topic noun.
 *   - A legacy confidence-table block contains fewer than five meaningful
 *     I-can statements. Existing complete, topic-anchored legacy blocks are
 *     accepted to avoid overwriting a teacher's usable content.
 *
 * Returns `false` (i.e. content is OK, no rewrite) when the content contains
 * a topic-anchored exit ticket. Newly generated content remains the compact,
 * single-question exit-ticket format.
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

  // For short topic roots (< 4 chars) like "IT", "AI", "UK", "EU" the
  // substring `nounRoot` appears incidentally in many unrelated words
  // ("write" contains "it", "explain" contains "ai"). Substring-matching
  // those would let generic content sneak through as "topic-anchored".
  // We therefore require a word-boundary match for short needles.
  // Longer needles keep substring matching so plurals and possessives
  // ("fraction" → "fractions", "Macbeth" → "Macbeth's") still anchor.
  const needsBoundary = (needle: string): boolean => needle.length < 4;
  const escapeForRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const containsNeedle = (haystack: string, needle: string): boolean => {
    if (!needle) return false;
    if (needsBoundary(needle)) {
      const re = new RegExp(`\\b${escapeForRegex(needle)}\\b`);
      return re.test(haystack);
    }
    return haystack.includes(needle);
  };

  const mentionsTopic = (s: string): boolean => {
    if (!nounRoot) return false;
    const lower = s.toLowerCase();
    if (containsNeedle(lower, nounRoot)) return true;
    // Allow partial-word matches (≥3 chars, with word-boundary safety on
    // 3-char tokens) for multi-word topics so "fraction" matches
    // "fractions", "Macbeth" matches "Macbeth's".
    return nounWords.some(w => containsNeedle(lower, w));
  };

  // New output intentionally contains only the exit ticket. However, a
  // complete legacy block can still be educationally valid and must not be
  // replaced merely because it is longer: changing it would be destructive
  // and causes repeated post-validator warnings. An incomplete legacy grid is
  // still generic because it offers an unreliable reflection scaffold.
  if (/CONFIDENCE_TABLE:/i.test(text)) {
    const legacyStatements = text.match(/^\s*I\s+can\s+.+$/gim) || [];
    if (legacyStatements.length < 5) return true;
    if (!legacyStatements.every(mentionsTopic)) return true;
  }

  // Exit ticket: must be present and must mention the topic noun.
  const etMatch = text.match(/EXIT_TICKET:\s*([^\n]+)/i);
  if (etMatch) {
    if (!mentionsTopic(etMatch[1])) return true;
  } else {
    // No exit ticket marker — check the trailing exit-ticket-shaped line.
    const trailing = text.split("\n").map(l => l.trim()).filter(Boolean).pop() || "";
    if (/exit\s*ticket|one thing you learned|key point you will take/i.test(trailing) && !mentionsTopic(trailing)) {
      return true;
    }
    // No exit ticket at all — generic.
    if (!trailing || !mentionsTopic(trailing)) return true;
  }

  // Lastly: if the literal pad-to-3 fallback string survived through the
  // renderer-level pad, that's still generic noise.
  if (textLower.includes("i can apply what i have learned today")) return true;

  return false;
}
