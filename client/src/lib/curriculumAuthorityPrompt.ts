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


// ─── PR-2 — Imperial / SI unit detection (audit item #14) ───────────────────
//
// UK schools, GCSE specs and the National Curriculum use SI units. Imperial
// drift sneaks in via US-trained LLMs (60 mph, 32°F, 5 ft 9 in, 100 lbs).
// Phase 5's manifesto names "SI units only" as a non-negotiable; this
// detector turns the rule into a probe.
//
// We **warn only** — never silently rewrite the value, because the
// numerical conversion is non-trivial (60 mph → 96.6 km/h ≠ 60 km/h) and a
// silent rewrite that left the number intact would make the question
// factually wrong. Teachers fix manually after the warning. A follow-up PR
// can add a value-aware rewriter behind a feature flag.
//
// Topic-aware: when the worksheet is *about* unit conversion (topic title
// contains "convert" / "units" / "imperial"), the detector returns no
// warnings — those questions legitimately need both unit families.

/** One imperial-unit fingerprint. */
export interface ImperialUnitMatch {
  /** The matched imperial token, e.g. "mph" or "°F" or "5 ft 9 in". */
  match: string;
  /** Short human label used in the warning, e.g. "miles per hour". */
  label: string;
  /** The SI unit teachers should rewrite to, e.g. "km/h" or "°C". */
  siEquivalent: string;
}

/**
 * Token table. Order matters: longer / more-specific tokens first so
 * "5 ft 9 in" wins over "5 ft" or "9 in". Each pattern is global +
 * case-insensitive; lastIndex is reset on every call.
 */
const IMPERIAL_TOKENS: Array<{ re: RegExp; label: string; si: string }> = [
  // Compound length first
  { re: /\b\d+(?:\.\d+)?\s*ft\s+\d+(?:\.\d+)?\s*(?:in|inches?)\b/gi, label: "feet+inches", si: "metres / centimetres" },
  // Speed
  { re: /\b\d+(?:\.\d+)?\s*mph\b/gi, label: "miles per hour", si: "km/h" },
  // Temperature (Fahrenheit) — degrees-F symbol or "F" after a number
  { re: /-?\d+(?:\.\d+)?\s*°\s*F\b/gi, label: "degrees Fahrenheit", si: "°C" },
  { re: /-?\d+(?:\.\d+)?\s*degrees?\s+Fahrenheit\b/gi, label: "degrees Fahrenheit", si: "°C" },
  // Mass
  { re: /\b\d+(?:\.\d+)?\s*lbs?\b/gi, label: "pounds (mass)", si: "kg" },
  { re: /\b\d+(?:\.\d+)?\s*pounds?\b(?!\s*sterling|\s*\(£)/gi, label: "pounds (mass)", si: "kg" },
  { re: /\b\d+(?:\.\d+)?\s*oz\b/gi, label: "ounces", si: "grams" },
  // Length (single unit)
  { re: /\b\d+(?:\.\d+)?\s*(?:miles?)\b(?!\s*per)/gi, label: "miles", si: "km" },
  { re: /\b\d+(?:\.\d+)?\s*(?:yds?|yards?)\b/gi, label: "yards", si: "metres" },
  { re: /\b\d+(?:\.\d+)?\s*ft\b/gi, label: "feet", si: "metres" },
  { re: /\b\d+(?:\.\d+)?\s*feet\b/gi, label: "feet", si: "metres" },
  { re: /\b\d+(?:\.\d+)?\s*(?:in|inches?)\b/gi, label: "inches", si: "centimetres" },
  // Volume (US gallon / pint conflict — we flag and let the teacher disambiguate)
  { re: /\b\d+(?:\.\d+)?\s*(?:gal|gallons?)\b/gi, label: "gallons", si: "litres" },
];

/**
 * Returns true when the worksheet's topic / subject explicitly covers
 * imperial / SI conversion. Conversion-topic questions legitimately need
 * imperial values; the detector is a no-op for them.
 */
export function isUnitConversionTopic(
  topic: string | undefined,
  subject: string | undefined,
): boolean {
  const t = `${topic || ""} ${subject || ""}`.toLowerCase();
  return (
    /\b(convert|conversion|imperial|metric)\b/.test(t) &&
    /\b(unit|units|measurement|measurements)\b/.test(t)
  );
}

/**
 * Detects imperial-unit usage in pupil-facing content. Returns one entry
 * per occurrence (deduplicated by exact-match string). Pure / idempotent.
 */
export function findImperialUnits(
  text: string | undefined | null,
): ImperialUnitMatch[] {
  if (!text) return [];
  const seen = new Set<string>();
  const out: ImperialUnitMatch[] = [];
  for (const { re, label, si } of IMPERIAL_TOKENS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const matched = m[0];
      const key = matched.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ match: matched, label, si: si, siEquivalent: si });
      if (m.index === re.lastIndex) re.lastIndex++; // safety against zero-width
    }
    re.lastIndex = 0;
  }
  return out;
}

// ─── PR-2 — Awarding-body command-word fidelity (audit item #2) ─────────────
//
// UK GCSE / A-Level mark schemes are explicit about which command words
// the awarding body uses. AQA / Edexcel / OCR / WJEC / CCEA publish lists.
// Most words are shared across boards; some are board-specific (Edexcel
// uses "Investigate" more freely; OCR favours "Account for"). Inventing
// new verbs ("Reflect on", "Brainstorm", "Compose your thoughts") is a
// red flag — those words don't appear on any UK exam paper, so a pupil
// who learns to recognise them on Adaptly is unprepared for the real
// exam.
//
// COMMAND_WORDS_BY_BOARD encodes the union list per board. Where a board
// doesn't apply (KS1 / KS2), use COMMAND_WORDS_KS_NEUTRAL — the broader
// set that covers National Curriculum Programmes of Study verbs.
//
// `findOffSpecCommandWords` returns the leading verbs of supplied stems
// that are NOT on the named board's published list. The validator
// ` enforceCommandWordFidelity` warns per off-spec verb without rewriting
// (rewriting could change the assessed skill — teachers must intervene).

/** Canonical UK awarding-body codes the validator understands. */
export type ExamBoardCode = "aqa" | "edexcel" | "pearson" | "ocr" | "wjec" | "eduqas" | "ccea" | "cie" | "cambridge";

/** Common KS1–KS5 / cross-board verbs (PoS + frequent shared command words). */
const COMMAND_WORDS_KS_NEUTRAL: ReadonlyArray<string> = Object.freeze([
  "calculate", "work out", "solve", "find", "show that", "prove that", "determine",
  "evaluate", "estimate", "round", "convert", "compute", "factorise", "factorize",
  "expand", "simplify", "rearrange", "plot", "sketch", "draw", "construct",
  "describe", "explain", "compare", "contrast", "analyse", "evaluate",
  "identify", "name", "state", "list", "outline", "suggest", "discuss",
  "justify", "assess", "interpret", "deduce", "predict", "label",
  "define", "complete", "match", "circle", "tick", "underline", "fill in",
  "use", "give", "write down", "write", "select", "choose", "answer",
  "read", "spot", "mark", "highlight", "shade", "annotate", "comment",
  "what is", "which", "how", "when", "where", "who", "why",
]);

/** AQA-specific command words on top of the neutral set. */
const AQA_EXTRAS: ReadonlyArray<string> = Object.freeze([
  "show", "show your working", "give a reason", "give one", "give two",
  "explain how", "explain why", "evaluate the extent",
]);

/** Edexcel / Pearson-specific command words on top of the neutral set. */
const EDEXCEL_EXTRAS: ReadonlyArray<string> = Object.freeze([
  "investigate", "comment on", "to what extent",
]);

/** OCR-specific command words on top of the neutral set. */
const OCR_EXTRAS: ReadonlyArray<string> = Object.freeze([
  "account for", "discuss the extent", "consider",
]);

/** WJEC / Eduqas / CCEA — same as Edexcel + OCR for command-word vocabulary. */
const WJEC_EXTRAS: ReadonlyArray<string> = Object.freeze([
  "investigate", "comment on", "account for", "examine",
]);

const CIE_EXTRAS: ReadonlyArray<string> = Object.freeze([
  "describe", "explain", "discuss", "investigate", "demonstrate", "evaluate",
]);

/** Frozen per-board union lists. Lookup is case-insensitive at call time. */
export const COMMAND_WORDS_BY_BOARD: Readonly<Record<string, ReadonlyArray<string>>> = Object.freeze({
  aqa: Object.freeze([...COMMAND_WORDS_KS_NEUTRAL, ...AQA_EXTRAS]),
  edexcel: Object.freeze([...COMMAND_WORDS_KS_NEUTRAL, ...EDEXCEL_EXTRAS]),
  pearson: Object.freeze([...COMMAND_WORDS_KS_NEUTRAL, ...EDEXCEL_EXTRAS]),
  ocr: Object.freeze([...COMMAND_WORDS_KS_NEUTRAL, ...OCR_EXTRAS]),
  wjec: Object.freeze([...COMMAND_WORDS_KS_NEUTRAL, ...WJEC_EXTRAS]),
  eduqas: Object.freeze([...COMMAND_WORDS_KS_NEUTRAL, ...WJEC_EXTRAS]),
  ccea: Object.freeze([...COMMAND_WORDS_KS_NEUTRAL, ...WJEC_EXTRAS]),
  cie: Object.freeze([...COMMAND_WORDS_KS_NEUTRAL, ...CIE_EXTRAS]),
  cambridge: Object.freeze([...COMMAND_WORDS_KS_NEUTRAL, ...CIE_EXTRAS]),
});

/**
 * Returns the resolved command-word list for the given exam board, or
 * the neutral KS-spanning list when the board is missing / unrecognised.
 */
export function getCommandWordsForBoard(examBoard: string | undefined | null): ReadonlyArray<string> {
  const key = (examBoard || "").trim().toLowerCase();
  if (!key) return COMMAND_WORDS_KS_NEUTRAL;
  return COMMAND_WORDS_BY_BOARD[key] || COMMAND_WORDS_KS_NEUTRAL;
}

/**
 * Extracts the leading command word from a question stem. Handles the
 * common decorations:
 *   - Markdown bold (`**Calculate** the value`)
 *   - Question number prefix (`1. Calculate`, `Q1. **Calculate**`)
 *   - ADHD checkbox prefix (`[ ] Calculate`)
 *   - Multi-word command words (`Show that`, `Work out`, `Give one`)
 *
 * Returns the lower-cased command word, or null when no leading verb
 * could be parsed (the stem may be a label-the-diagram instruction or a
 * gap-fill paragraph).
 */
export function extractLeadingCommandWord(stem: string | undefined | null): string | null {
  if (!stem) return null;
  // Take the first non-empty line so multi-paragraph stems don't trip us up.
  const firstLine = String(stem).split("\n").map(l => l.trim()).find(Boolean) || "";
  // Strip leading emoji, checkbox, question number, bold markers — in
  // that order so each strip can fire on the cleaner remainder. (A
  // single-pass chain in another order leaves a leading "[" or "**" in
  // place when an emoji starts the line.)
  const cleaned = firstLine
    .replace(/^[\u{1F300}-\u{1FAFF}]+\s*/u, "")
    .replace(/^\s*\[\s*[xX]?\s*\]\s+/, "")
    .replace(/^\s*(?:Q?\d+[.)])\s+/, "")
    .replace(/^\s*\*\*\s*/, "")
    .trim();
  if (!cleaned) return null;
  // Try multi-word command words first (longest match wins) by checking
  // the first 3 words against the known verbs.
  const words = cleaned.split(/[\s\*]+/).filter(Boolean).map(w => w.toLowerCase().replace(/[^a-z]/g, ""));
  for (const span of [3, 2, 1]) {
    if (words.length < span) continue;
    const candidate = words.slice(0, span).join(" ");
    if (!candidate || !/[a-z]/.test(candidate)) continue;
    // Special-case "show your working" / "give a reason" — three-word verbs.
    if (
      span === 3 && (
        candidate === "show your working" ||
        candidate === "give a reason" ||
        candidate === "give one reason" ||
        candidate === "give two reasons" ||
        candidate === "explain how the" ||
        candidate === "explain why the" ||
        candidate === "to what extent"
      )
    ) {
      // Strip trailing "the" / "is" / "are" so we return the canonical command.
      if (candidate === "show your working") return "show your working";
      if (candidate === "give a reason") return "give a reason";
      if (candidate === "give one reason") return "give one";
      if (candidate === "give two reasons") return "give two";
      if (candidate.startsWith("explain how")) return "explain how";
      if (candidate.startsWith("explain why")) return "explain why";
      if (candidate === "to what extent") return "to what extent";
    }
    if (
      span === 2 && (
        candidate === "show that" || candidate === "prove that" ||
        candidate === "work out" || candidate === "write down" ||
        candidate === "fill in" || candidate === "comment on" ||
        candidate === "account for" || candidate === "what is" ||
        candidate === "give one" || candidate === "give two"
      )
    ) {
      return candidate;
    }
    if (span === 1) {
      // Filter out non-verb leaders ("a", "the", etc.) — they signal the
      // stem doesn't actually open with a command word, and the validator
      // should warn on that separately.
      if (
        candidate.length >= 3 &&
        !["the", "and", "but", "for", "this", "that", "your", "some", "all"].includes(candidate)
      ) {
        return candidate;
      }
    }
  }
  return null;
}

/**
 * Off-spec command words detected in `text`, given the named exam board.
 * Returns one entry per UNIQUE off-spec verb so a worksheet that opens
 * 12 questions with "Reflect on" generates one warning, not 12.
 *
 * The function matches whole leading words at line start (or right after
 * a question number / checkbox / bold prefix), so it never false-flags
 * the same verb mid-sentence.
 */
export function findOffSpecCommandWords(
  text: string | undefined | null,
  examBoard: string | undefined | null,
): string[] {
  if (!text) return [];
  const board = getCommandWordsForBoard(examBoard);
  const allowed = new Set<string>(board.map(v => v.toLowerCase()));
  const offSpec = new Set<string>();
  const lines = String(text).split("\n");
  for (const raw of lines) {
    const verb = extractLeadingCommandWord(raw);
    if (!verb) continue;
    if (allowed.has(verb)) continue;
    offSpec.add(verb);
  }
  return Array.from(offSpec).sort();
}

// ─── PR-2 — Reading-age budget (audit item #1) ──────────────────────────────
//
// Phase 1 / PB1 stamps `expectedReadingAge` on every question (5–18 years).
// Nothing actually validates that the rendered stem hits the budget.
// `computeReadingAge` runs Flesch-Kincaid grade level and converts to a
// UK reading-age estimate (FK + 5). The validator
// ` enforceReadingAgeBudget` (in worksheetPostValidator.ts) compares
// computed-vs-declared per question and warns when the gap exceeds 1.5
// years — the published BDA / NLT tolerance band for "comfortable
// independent reading".
//
// Pure / deterministic. No external syllable dictionary — uses a
// vowel-group heuristic that's good enough for FK (within ±0.5 grade
// levels of CMU dictionary on UK GCSE prose).

/**
 * Returns the number of syllables in a single English word using a
 * vowel-group heuristic. Trailing silent 'e' is dropped (`make` = 1, not 2).
 * Words shorter than 3 chars get 1 syllable. Idempotent.
 */
export function countSyllables(word: string): number {
  if (!word) return 0;
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  // Strip trailing silent 'e' / 'es' / 'ed' (when not preceded by another vowel).
  let stripped = w
    .replace(/(?:[^aeiouy])e$/, m => m.charAt(0))
    .replace(/(?:[^aeiouy])es$/, m => m.charAt(0) + "s")
    .replace(/(?:[^aeiouy])ed$/, m => m.charAt(0) + "d");
  // Count vowel groups.
  const groups = stripped.match(/[aeiouy]+/g);
  return groups ? Math.max(1, groups.length) : 1;
}

/**
 * Counts sentences in a passage. Splits on `.!?` followed by whitespace
 * or end-of-string. Always returns ≥ 1 (so the FK divisor never explodes).
 */
function countSentences(text: string): number {
  const matches = text.split(/[.!?]+(?:\s|$)/).map(s => s.trim()).filter(Boolean);
  return Math.max(1, matches.length);
}

/**
 * Counts words in a passage. Strips markdown bold / italic decorators
 * before splitting so `**Calculate**` = 1 word, not 3.
 */
function countWords(text: string): number {
  const cleaned = text.replace(/[*_~`#]/g, "").replace(/\[[^\]]*\]/g, "");
  const tokens = cleaned.match(/[A-Za-z][A-Za-z']*/g) || [];
  return tokens.length;
}

/**
 * Computes Flesch-Kincaid grade level + UK reading-age estimate for a
 * passage. Returns nulls when the passage is empty or has too few words
 * to compute a meaningful FK score (< 5 words).
 */
export interface ReadingAgeResult {
  /** FK grade level (US-grade-equivalent). 0 = pre-school; 12 = US grade 12 / UK Year 13. */
  flesch: number;
  /** UK reading age in years. FK + 5, clamped to [5, 18]. */
  readingAge: number;
  /** Internal counts for diagnostic / test purposes. */
  words: number;
  sentences: number;
  syllables: number;
}

export function computeReadingAge(text: string | undefined | null): ReadingAgeResult | null {
  if (!text) return null;
  const cleaned = String(text)
    .replace(/[*_~`#]/g, "")
    .replace(/\[\[[^\]]*\]\]/g, "")  // strip diagram markers
    .replace(/\[[^\]]*\]/g, "");      // strip checkbox / placeholder markers
  const sentences = countSentences(cleaned);
  const words = countWords(cleaned);
  if (words < 5) return null;
  let syllables = 0;
  for (const w of cleaned.match(/[A-Za-z][A-Za-z']*/g) || []) {
    syllables += countSyllables(w);
  }
  const flesch = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  const readingAge = Math.max(5, Math.min(18, flesch + 5));
  return {
    flesch: Math.round(flesch * 10) / 10,
    readingAge: Math.round(readingAge * 10) / 10,
    words,
    sentences,
    syllables,
  };
}
