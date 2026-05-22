/**
 * curriculumAuthorityPrompt.ts
 *
 * Phase 5 — Curriculum-authority system prompt rewrite.
 *
 * Single source of truth for the worksheet system prompt's *voice and
 * authority layer*. Phases 1–4 shipped the structural foundation
 * (counts / per-Q affordances / spec-lock), the topic-anchored
 * Self-Reflection content surface, the examiner-voice Revision Tips
 * panel and the SEND content-rules block. None of those layers tells
 * the model who it is or what it is bound to; they all tell it what
 * to produce. This module fills that gap.
 *
 * Public surface (used by ai.ts and worksheetPostValidator.ts):
 *
 *   buildCurriculumAuthorityPreamble(inputs)
 *     The opening manifesto. Anchors the (board × subject × year ×
 *     topic × key stage) tuple. Names the awarding body, the National
 *     Curriculum Programmes of Study, UK English, SI units. Sets the
 *     tonal register expectation. Replaces today's thin
 *     "You are an expert UK teacher…" opener.
 *
 *   buildNonNegotiablesBlock()
 *     The consolidated UK English / SI units / no-US-contexts /
 *     awarding-body / no-fabricated-codes / no-softeners block. Six
 *     numbered clauses. Static — no inputs, same text every prompt —
 *     so every worksheet shares the same authority backbone.
 *
 *   buildPedagogicalRegisterNote(inputs)
 *     Tonal anchor that scales by key stage. KS1/KS2 = warm but
 *     precise; KS3 = clear and explanatory; GCSE = examiner voice;
 *     A-Level = academic but direct. Used to set the writing
 *     register expectation.
 *
 *   UK_ENGLISH_SUBSTITUTIONS
 *     Frozen list of US → UK rewrite rules. The post-validator uses
 *     this table to silently rewrite drift in pupil-facing content.
 *
 *   BANNED_SOFTENERS
 *     Frozen list of regexes for softener phrases banned in pupil-
 *     facing content. The post-validator warns (does NOT silently
 *     rewrite) when one is detected — the model needs to learn the
 *     lesson via the prompt, not via a paper-over.
 *
 *   FABRICATED_AO_CODE_RE
 *     Regex for invented assessment-objective codes (AO5+).
 *
 *   PLACEHOLDER_LEAKAGE_RE
 *     Regex catching template-literal leakage in pupil-facing
 *     content (`${...}`, literal `[topic]`, literal `[N marks]`,
 *     literal `___` outside gap-fill sections).
 *
 *   isUKEnglishCompliant(text)
 *     Pure boolean predicate. Returns true when no substitution
 *     would change the text.
 *
 *   applyUKEnglishSubstitutions(text)
 *     Pure rewriter. Returns { rewritten, substitutions[] } so
 *     callers can warn per drift fixed.
 *
 * Everything in this module is pure, deterministic, and synchronous.
 * Tests in server/tests/worksheetScrutiny.test.ts lock every contract.
 */

// ─── Inputs ──────────────────────────────────────────────────────────────────

/**
 * Inputs the manifesto + register note need. All five fields are
 * already plumbed into ai.ts since Phase 1 — no new metadata, no new
 * UI controls. Optional only because some KS1/KS2 callsites omit
 * `examBoard` (no awarding body before GCSE).
 */
export interface CurriculumAuthorityInputs {
  subject?: string;
  yearGroup?: string;
  examBoard?: string;
  topic?: string;
  /** STEM vs Humanities — already computed in ai.ts via the same regex. */
  isSTEM?: boolean;
}

/**
 * Coarse key-stage classification derived from yearGroup. Matches the
 * partitioning used elsewhere in ai.ts (`yearNum <= 6 ? "KS1/KS2"
 * : yearNum <= 9 ? "KS3" : yearNum <= 11 ? "GCSE" : "A-Level"`).
 *
 * Public so tests can lock the boundary cases (Year 6 → KS2,
 * Year 7 → KS3, Year 11 → GCSE, Year 12 → A-Level).
 */
export type KeyStage = "KS1" | "KS2" | "KS3" | "GCSE" | "A-Level";

export function classifyKeyStage(yearGroup: string | undefined): KeyStage {
  const n = parseInt((yearGroup || "").replace(/\D/g, "") || "0", 10);
  if (n <= 0) return "KS3"; // safe default — KS3 is the median classroom
  if (n <= 2) return "KS1";
  if (n <= 6) return "KS2";
  if (n <= 9) return "KS3";
  if (n <= 11) return "GCSE";
  return "A-Level";
}

// ─── Awarding-body labels ───────────────────────────────────────────────────
//
// The board is exposed to the AI so it knows which command-word list and AO
// vocabulary applies. We map common short ids to the canonical UK label so
// the manifesto reads as a head of department would write it. Anything we
// don't recognise (or pre-GCSE worksheets with no board) falls back to a
// neutral phrasing — never a fabricated label.

const BOARD_LABELS: Readonly<Record<string, string>> = Object.freeze({
  aqa: "AQA",
  edexcel: "Pearson Edexcel",
  pearson: "Pearson Edexcel",
  ocr: "OCR",
  wjec: "WJEC",
  eduqas: "WJEC Eduqas",
  ccea: "CCEA",
  cie: "Cambridge International",
  cambridge: "Cambridge International",
});

function normaliseBoardLabel(examBoard: string | undefined): string | "" {
  const raw = (examBoard || "").trim().toLowerCase().replace(/\s+/g, "");
  if (!raw) return "";
  return BOARD_LABELS[raw] || examBoard!.trim();
}

// ─── Curriculum-authority preamble ──────────────────────────────────────────

/**
 * The opening manifesto. Replaces today's single line at the top of
 * structuredSystemSections with a properly bound role-and-authority
 * block. The output is a single string suitable for joining into the
 * existing array — no leading or trailing blank lines.
 *
 * Shape:
 *   1. Role + authority chain (3 numbered clauses)
 *   2. Output contract (raw JSON only, no markdown, every rule mandatory)
 *   3. Quality bar (head-of-department-print-without-reviewing standard)
 *
 * The text scales by key stage: GCSE / A-Level get the awarding-body
 * clause; KS3 gets the school-scheme clause; KS1/KS2 anchors to the
 * National Curriculum only (no awarding body exists pre-GCSE).
 */
export function buildCurriculumAuthorityPreamble(
  inputs: CurriculumAuthorityInputs = {},
): string {
  const subject = (inputs.subject || "the subject").trim();
  const yearGroup = (inputs.yearGroup || "the year group").trim();
  const topic = (inputs.topic || "the topic").trim();
  const keyStage = classifyKeyStage(inputs.yearGroup);
  const board = normaliseBoardLabel(inputs.examBoard);
  const wantBoardClause = (keyStage === "GCSE" || keyStage === "A-Level") && !!board;

  const authorityChain: string[] = [];
  authorityChain.push(
    `1. The UK National Curriculum (Department for Education, Programmes of Study at gov.uk). Quote PoS statements verbatim — never paraphrase.`,
  );
  if (wantBoardClause) {
    authorityChain.push(
      `2. The published ${board} specification for ${subject} at ${keyStage}. ${board}'s command-word list, assessment objectives (AO1–AO4 only — never AO5+), mark-scheme conventions and content boundaries are the only authoritative reference for question wording, marking and difficulty.`,
    );
    authorityChain.push(
      `3. The teacher commissioning this worksheet for ${yearGroup} pupils studying "${topic}". Write as that teacher's experienced colleague — not as a generic tutor or a US-style assistant.`,
    );
  } else if (keyStage === "KS3") {
    authorityChain.push(
      `2. Your school's KS3 scheme of work. KS3 has no awarding body — anchor difficulty and language to the gov.uk KS3 Programme of Study, and prepare pupils for the GCSE command-word vocabulary they will meet from Year 10.`,
    );
    authorityChain.push(
      `3. The teacher commissioning this worksheet for ${yearGroup} pupils studying "${topic}". Write as that teacher's experienced colleague — not as a generic tutor or a US-style assistant.`,
    );
  } else {
    // KS1/KS2 — no awarding body, child-appropriate framing
    authorityChain.push(
      `2. The Key Stage ${keyStage === "KS1" ? "1" : "2"} Programme of Study for ${subject}. ${keyStage} has no awarding body — anchor difficulty and language to the gov.uk PoS attainment targets.`,
    );
    authorityChain.push(
      `3. The class teacher commissioning this worksheet for ${yearGroup} pupils studying "${topic}". Write as that teacher's experienced colleague — clear, warm, accurate, never a generic tutor or a US-style assistant.`,
    );
  }

  const lines: string[] = [];
  lines.push(
    `CURRICULUM AUTHORITY — read this before producing anything else.`,
  );
  lines.push(
    `You are a senior UK teacher and subject lead producing a classroom-ready worksheet for Adaptly, an EdTech platform used by mainstream and SEND-aware UK schools. You are bound to the following authority chain:`,
  );
  lines.push(...authorityChain);
  lines.push(
    `OUTPUT CONTRACT: respond with valid raw JSON only — no markdown fences, no code blocks, no HTML, no commentary. Every rule that follows is a non-negotiable boundary on your output, not a suggestion.`,
  );
  lines.push(
    `QUALITY BAR: the worksheet you generate should be the kind of resource a head of department would print and hand to a class without reviewing first — textbook quality, classroom-ready, traceable to the curriculum, free of US-LLM defaults.`,
  );

  return lines.join("\n");
}

// ─── Non-negotiables block ───────────────────────────────────────────────────

/**
 * The six clauses that bind every worksheet. Static text — same on
 * every prompt so the model sees a stable manifesto across topics.
 * Phases 1–4 already enforce most of these rules in their downstream
 * blocks; this manifesto names them up front so the model has a
 * single header to remember rather than a scattered set of rules.
 */
export function buildNonNegotiablesBlock(): string {
  return [
    `NON-NEGOTIABLES — every worksheet, every section, no exceptions:`,
    `1. UK ENGLISH ONLY. Spelling: "colour" not "color"; "metre" not "meter"; "aluminium" not "aluminum"; "maths" not "math"; "organise" not "organize"; "behaviour" not "behavior"; "centre" not "center"; "theatre" not "theater"; "grey" not "gray"; "traveller" not "traveler"; "defence" not "defense"; "favourite" not "favorite"; "honour" not "honor"; "neighbour" not "neighbor". Idioms and place names use UK conventions throughout.`,
    `2. SI UNITS ONLY. Length in metres / kilometres; mass in grams / kilograms; temperature in degrees Celsius (°C); volume in litres / millilitres; time in seconds / minutes / hours. Imperial units are forbidden in question content unless the question is explicitly about unit conversion.`,
    `3. UK CONTEXTS ONLY. Currency in pounds sterling (£). Examples set in UK schools, towns and contexts. No US sports references, no US college / high school / freshman / sophomore vocabulary, no US holiday or political contexts, no Fahrenheit, no miles unless the question is about conversion.`,
    `4. NO COPYRIGHTED PAST-PAPER TEXT VERBATIM. Past-paper references in metadata (e.g. "AQA Nov 2022 P2 Q5") are allowed and encouraged for traceability. Reproducing the question text word-for-word is forbidden — write a fresh question that assesses the same spec point.`,
    `5. AWARDING-BODY COMMAND WORDS ONLY. Every question stem opens with a command word from the named board's published list (Calculate, Explain, Describe, Evaluate, Compare, Justify, State, Identify, Show that, Analyse, Discuss, Define, Outline, Suggest). Softeners are banned: never "Have a think about…", "Talk about…", "Give it a go", "Make sure you revise", "Study hard", "Good luck", "Do your best".`,
    `6. NO FABRICATED CODES. Spec references must come from the SPEC LOCK list in this prompt — never invent a code. Assessment objectives are AO1, AO2, AO3 or AO4 — never AO5 or higher. Past-paper citations must be real or omitted (NEVER invented). Where you cannot trace a question to a published source, leave the citation field empty rather than guessing.`,
  ].join("\n");
}

// ─── Pedagogical register note ───────────────────────────────────────────────

/**
 * Short tonal anchor that scales by key stage. The reading-age note
 * already in ai.ts handles vocabulary granularity; this note handles
 * *register* — the difference between writing for a Year 4 class and
 * writing for a Year 13 class even when the topic is the same idea.
 */
export function buildPedagogicalRegisterNote(
  inputs: CurriculumAuthorityInputs = {},
): string {
  const keyStage = classifyKeyStage(inputs.yearGroup);
  const subjectIsScience = (inputs.subject || "").toLowerCase().match(
    /biology|chemistry|physics|science/,
  );

  const sciencesLine = subjectIsScience
    ? ` Sciences: use SI units throughout and standard writing lines sized by mark tariff — the dot-grid working-out box is a maths-only affordance and must not appear on science worksheets.`
    : "";

  switch (keyStage) {
    case "KS1":
      return `PEDAGOGICAL REGISTER — KS1: warm, child-friendly, but precise. Sentences of 6–10 words. Subject vocabulary explained on first use with a short example. Tone is encouraging — the goal is mastery, never just engagement. No academic hedging, no patronising baby-talk, no exclamation marks at the end of question stems.${sciencesLine}`;
    case "KS2":
      return `PEDAGOGICAL REGISTER — KS2: clear, friendly, but precise. Sentences of 8–14 words. Subject vocabulary used naturally with a brief gloss on first use. Question stems use plain command verbs (Find, Work out, Explain, Describe, Compare). Tone is encouraging but academic — pupils are learning the language they will use at GCSE.${sciencesLine}`;
    case "KS3":
      return `PEDAGOGICAL REGISTER — KS3: clear and explanatory. Sentences of 10–16 words. Subject vocabulary used naturally; brief glosses for new GCSE terms. GCSE command words appear in the prompt so pupils start to recognise them. Tone is direct, never softening — pupils are being prepared for the awarding-body command-word vocabulary they will meet from Year 10.${sciencesLine}`;
    case "GCSE":
      return `PEDAGOGICAL REGISTER — GCSE: examiner voice. Use the awarding body's published command-word vocabulary verbatim. Sentences are direct and unambiguous, sized to the question's mark tariff. No hedging, no padding, no encouragement phrases. Match the tone of the named board's mark schemes.${sciencesLine}`;
    case "A-Level":
      return `PEDAGOGICAL REGISTER — A-Level: academic but direct. Use precise terminology. Expect the reader to handle dense, complex text; do not over-gloss. Use the awarding body's command-word list verbatim. Tone is the published mark scheme's, never an undergraduate textbook's.${sciencesLine}`;
  }
}

// ─── UK English substitutions ────────────────────────────────────────────────

/**
 * One US → UK rewrite rule. The validator iterates this table over
 * pupil-facing content and stamps a warning per applied rewrite.
 *
 * `re` is anchored with `\b` boundaries so compound / Greek-root
 * words (`voltmeter`, `parameter`, `diameter`, `mathematics`) are
 * never accidentally rewritten.
 *
 * `replace` may be a string OR a function — the latter handles
 * case-preservation for compound length units (kilometer →
 * kilometre, Centimeter → Centimetre, …).
 */
export interface UKSubstitution {
  re: RegExp;
  replace: string | ((match: string, ...groups: string[]) => string);
  /** Short label used in the validator's warning messages. */
  label: string;
}

/**
 * Preserve the case of a US word when rewriting to its UK form.
 * Handles three cases: ALL-CAPS, Title-case (first-letter-only) and
 * lower-case. Falls through to the rewritten form unchanged.
 */
function preserveCase(original: string, rewritten: string): string {
  if (!original) return rewritten;
  if (original === original.toUpperCase()) return rewritten.toUpperCase();
  if (original[0] === original[0].toUpperCase()) {
    return rewritten[0].toUpperCase() + rewritten.slice(1);
  }
  return rewritten;
}

/**
 * `meter` rewriter. Only fires on length-unit usage. Compound
 * instrument names (`voltmeter`, `thermometer`, `barometer`) and
 * Greek-root words (`parameter`, `diameter`, `perimeter`) are NOT
 * rewritten because the regex's word boundaries forbid mid-word
 * matches. Length-prefix compounds (`kilometer`, `centimetre`,
 * `millimeter`, `nanometer`, `micrometer`, `decimeter`) ARE
 * rewritten.
 */
const METER_RE =
  /\b(kilo|centi|milli|nano|micro|deci|deca|hecto)?meter(s?)\b/gi;
function rewriteMeter(_full: string, prefix: string, plural: string): string {
  const base = (prefix || "") + "metre" + (plural || "");
  return preserveCase(_full, base);
}

/**
 * `math` rewriter. Standalone word only — never `mathematics`,
 * `mathematician`, `mathematical`, `aftermath`. The `\bmath\b`
 * boundary handles this naturally.
 */
const MATH_RE = /\bmath\b/gi;
function rewriteMath(full: string): string {
  return preserveCase(full, "maths");
}

/**
 * Frozen list of US → UK substitutions the validator silently
 * applies to pupil-facing content. Compound rewrites (meter,
 * math) use rewriter functions; the rest are simple string
 * replacements with regex.
 *
 * The order is stable and tested — adding a rule later means
 * appending to the end so existing test expectations don't break.
 */
export const UK_ENGLISH_SUBSTITUTIONS: ReadonlyArray<UKSubstitution> =
  Object.freeze([
    // Length units (metre family) — uses rewriter to preserve prefix + case
    { re: METER_RE, replace: rewriteMeter, label: "meter→metre" },
    // Standalone "math" → "maths"
    { re: MATH_RE, replace: rewriteMath, label: "math→maths" },
    // Colour family
    { re: /\bcolor\b/gi, replace: (m: string) => preserveCase(m, "colour"), label: "color→colour" },
    { re: /\bcolors\b/gi, replace: (m: string) => preserveCase(m, "colours"), label: "colors→colours" },
    { re: /\bcolored\b/gi, replace: (m: string) => preserveCase(m, "coloured"), label: "colored→coloured" },
    { re: /\bcoloring\b/gi, replace: (m: string) => preserveCase(m, "colouring"), label: "coloring→colouring" },
    { re: /\bcolorful\b/gi, replace: (m: string) => preserveCase(m, "colourful"), label: "colorful→colourful" },
    // Aluminium
    { re: /\baluminum\b/gi, replace: (m: string) => preserveCase(m, "aluminium"), label: "aluminum→aluminium" },
    // -ize → -ise (curated; words that are -ize in both English variants like "capsize"/"prize" are excluded by being absent)
    { re: /\borganize\b/gi, replace: (m: string) => preserveCase(m, "organise"), label: "organize→organise" },
    { re: /\borganized\b/gi, replace: (m: string) => preserveCase(m, "organised"), label: "organized→organised" },
    { re: /\borganizing\b/gi, replace: (m: string) => preserveCase(m, "organising"), label: "organizing→organising" },
    { re: /\borganization\b/gi, replace: (m: string) => preserveCase(m, "organisation"), label: "organization→organisation" },
    { re: /\borganizations\b/gi, replace: (m: string) => preserveCase(m, "organisations"), label: "organizations→organisations" },
    { re: /\brealize\b/gi, replace: (m: string) => preserveCase(m, "realise"), label: "realize→realise" },
    { re: /\brealized\b/gi, replace: (m: string) => preserveCase(m, "realised"), label: "realized→realised" },
    { re: /\brealizing\b/gi, replace: (m: string) => preserveCase(m, "realising"), label: "realizing→realising" },
    { re: /\branalyze\b/gi, replace: (m: string) => preserveCase(m, "analyse"), label: "analyze→analyse" },
    { re: /\banalyzed\b/gi, replace: (m: string) => preserveCase(m, "analysed"), label: "analyzed→analysed" },
    { re: /\banalyzing\b/gi, replace: (m: string) => preserveCase(m, "analysing"), label: "analyzing→analysing" },
    // Behaviour family
    { re: /\bbehavior\b/gi, replace: (m: string) => preserveCase(m, "behaviour"), label: "behavior→behaviour" },
    { re: /\bbehaviors\b/gi, replace: (m: string) => preserveCase(m, "behaviours"), label: "behaviors→behaviours" },
    { re: /\bbehavioral\b/gi, replace: (m: string) => preserveCase(m, "behavioural"), label: "behavioral→behavioural" },
    // -re/-er (centre, theatre)
    { re: /\bcenter\b/gi, replace: (m: string) => preserveCase(m, "centre"), label: "center→centre" },
    { re: /\bcenters\b/gi, replace: (m: string) => preserveCase(m, "centres"), label: "centers→centres" },
    { re: /\bcentered\b/gi, replace: (m: string) => preserveCase(m, "centred"), label: "centered→centred" },
    { re: /\btheater\b/gi, replace: (m: string) => preserveCase(m, "theatre"), label: "theater→theatre" },
    { re: /\btheaters\b/gi, replace: (m: string) => preserveCase(m, "theatres"), label: "theaters→theatres" },
    // -our (favourite, honour, neighbour, defence, etc.)
    { re: /\bfavorite\b/gi, replace: (m: string) => preserveCase(m, "favourite"), label: "favorite→favourite" },
    { re: /\bfavorites\b/gi, replace: (m: string) => preserveCase(m, "favourites"), label: "favorites→favourites" },
    { re: /\bhonor\b/gi, replace: (m: string) => preserveCase(m, "honour"), label: "honor→honour" },
    { re: /\bhonors\b/gi, replace: (m: string) => preserveCase(m, "honours"), label: "honors→honours" },
    { re: /\bhonored\b/gi, replace: (m: string) => preserveCase(m, "honoured"), label: "honored→honoured" },
    { re: /\bneighbor\b/gi, replace: (m: string) => preserveCase(m, "neighbour"), label: "neighbor→neighbour" },
    { re: /\bneighbors\b/gi, replace: (m: string) => preserveCase(m, "neighbours"), label: "neighbors→neighbours" },
    { re: /\bdefense\b/gi, replace: (m: string) => preserveCase(m, "defence"), label: "defense→defence" },
    // Travelled / -ll-
    { re: /\btraveler\b/gi, replace: (m: string) => preserveCase(m, "traveller"), label: "traveler→traveller" },
    { re: /\btravelers\b/gi, replace: (m: string) => preserveCase(m, "travellers"), label: "travelers→travellers" },
    { re: /\btraveled\b/gi, replace: (m: string) => preserveCase(m, "travelled"), label: "traveled→travelled" },
    { re: /\btraveling\b/gi, replace: (m: string) => preserveCase(m, "travelling"), label: "traveling→travelling" },
    // Grey
    { re: /\bgray\b/gi, replace: (m: string) => preserveCase(m, "grey"), label: "gray→grey" },
    { re: /\bgrays\b/gi, replace: (m: string) => preserveCase(m, "greys"), label: "grays→greys" },
  ]);

// ─── Banned softeners ────────────────────────────────────────────────────────

/**
 * Phrases that disqualify a question stem regardless of context.
 * The validator warns (and does NOT silently rewrite) when one of
 * these is detected — silent rewriting would paper over a real
 * generation failure that the prompt should be teaching the model
 * to avoid.
 */
export const BANNED_SOFTENERS: ReadonlyArray<RegExp> = Object.freeze([
  /\bhave a think about\b/i,
  /\btalk about\b/i,
  /\bgive it a go\b/i,
  /\bmake sure you (?:revise|study)\b/i,
  /\bstudy hard\b/i,
  /\bgood luck\b/i,
  /\bdo your best\b/i,
  /\btry your best\b/i,
]);

/**
 * Catches invented assessment-objective codes. UK exam boards use
 * AO1 through AO4 (and very rarely AO4 only on practical-skill
 * specs). AO5 and higher do not exist in any UK GCSE / A-Level
 * specification — when the model emits one, the prompt has failed
 * to bind it to the awarding body's AO list.
 */
export const FABRICATED_AO_CODE_RE = /\bAO(?:[5-9]|\d{2,})\b/g;

/**
 * Catches template-literal leakage in pupil-facing content. Three
 * shapes:
 *   1. `${...}` — JS template-literal interpolation that escaped
 *      the prompt scaffold.
 *   2. Literal `[topic]` / `[subject]` / `[year]` placeholders —
 *      common LLM-mode failures where the model copied the
 *      worked-example template instead of filling it in.
 *   3. Literal `[N marks]` where N is the letter (not a digit) —
 *      same failure mode, mark badge.
 */
export const PLACEHOLDER_LEAKAGE_RE =
  /\$\{[^}]*\}|\[(?:topic|subject|year(?:\s*group)?|key\s*stage)\]|\[N\s*marks\]/gi;

// ─── Predicates and rewriters ────────────────────────────────────────────────

/**
 * Returns true if the input text contains no US drift the validator
 * would silently rewrite. Used in tests to assert clean inputs stay
 * clean and US drift is detected.
 */
export function isUKEnglishCompliant(text: string | undefined | null): boolean {
  if (!text) return true;
  for (const sub of UK_ENGLISH_SUBSTITUTIONS) {
    sub.re.lastIndex = 0; // global regex defensive reset
    if (sub.re.test(text)) return false;
    sub.re.lastIndex = 0;
  }
  return true;
}

/**
 * Result shape for applyUKEnglishSubstitutions. Callers use
 * `substitutions[]` to stamp one warning per drift fixed.
 */
export interface UKEnglishRewriteResult {
  rewritten: string;
  /** One entry per drift fixed. Empty array = input was already compliant. */
  substitutions: Array<{ label: string; from: string; to: string }>;
}

/**
 * Applies every UK English substitution to the input text. Pure /
 * idempotent — running the result through this function again
 * returns the same result with an empty substitutions list.
 */
export function applyUKEnglishSubstitutions(
  text: string | undefined | null,
): UKEnglishRewriteResult {
  if (!text) return { rewritten: text || "", substitutions: [] };
  let out = text;
  const substitutions: UKEnglishRewriteResult["substitutions"] = [];

  for (const sub of UK_ENGLISH_SUBSTITUTIONS) {
    sub.re.lastIndex = 0;
    // Collect matches first so we can record per-substitution from→to
    // before the actual rewrite. We use replace's callback both to
    // perform the rewrite and to record the pair.
    out = out.replace(sub.re, (match: string, ...groups: unknown[]) => {
      const replaced =
        typeof sub.replace === "function"
          // groups can include the offset and full string at the tail;
          // the rewriters above only consume the first two capture groups
          ? (sub.replace as (m: string, ...g: string[]) => string)(
              match,
              ...(groups.filter((g) => typeof g === "string") as string[]),
            )
          : (sub.replace as string);
      if (replaced !== match) {
        substitutions.push({ label: sub.label, from: match, to: replaced });
      }
      return replaced;
    });
    sub.re.lastIndex = 0;
  }

  return { rewritten: out, substitutions };
}

/**
 * Returns the list of softener phrases detected in the input.
 * Empty list = clean. Used by the post-validator to stamp warnings.
 */
export function findBannedSofteners(
  text: string | undefined | null,
): string[] {
  if (!text) return [];
  const hits: string[] = [];
  for (const re of BANNED_SOFTENERS) {
    const m = text.match(re);
    if (m) hits.push(m[0]);
  }
  return hits;
}

/**
 * Returns the list of fabricated AO codes detected in the input.
 * Empty list = clean. Used by the post-validator to stamp warnings.
 */
export function findFabricatedAoCodes(
  text: string | undefined | null,
): string[] {
  if (!text) return [];
  const hits = text.match(FABRICATED_AO_CODE_RE);
  return hits ? Array.from(hits) : [];
}

/**
 * Returns the list of template-literal / placeholder leakage tokens
 * detected in the input. Empty list = clean.
 */
export function findPlaceholderLeakage(
  text: string | undefined | null,
): string[] {
  if (!text) return [];
  const hits = text.match(PLACEHOLDER_LEAKAGE_RE);
  return hits ? Array.from(hits) : [];
}
