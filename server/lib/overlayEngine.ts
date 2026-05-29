/**
 * Overlay Engine
 *
 * Deterministic worksheet overlays that preserve the underlying worksheet
 * structure, ordering, numbering, and diagram assets.
 *
 * Design rules (spec-aligned):
 * - Never remove or reorder base sections.
 * - Never touch diagram/image references.
 * - SEND overlays affect FORMATTING AND PRESENTATION ONLY — never academic challenge.
 * - Scaffolding goes in separate support sections (isOverlay: true) inserted AFTER
 *   each question section — NEVER inside the question text itself.
 * - challenge level = ability tier (Foundation/Standard/Higher/Scaffolded)
 * - access method = SEND overlay (dyslexia/ADHD/ASC/MLD/EAL/etc.)
 * - language complexity = reading age / EAL overlay
 * These three dimensions are INDEPENDENT.
 *
 * KEY DESIGN RULES (v2 — updated):
 * 1. Support box titles NEVER name the SEND condition — they use neutral
 *    pedagogical labels ("Hint", "Steps to Follow", "Focus Check", etc.).
 * 2. Scaffolding is QUESTION-SPECIFIC — the overlay engine reads the section
 *    type and content to generate relevant cues, not a generic fixed list.
 * 3. Every support box is visually enclosed (type: "send-support") so the
 *    renderer always draws a bordered, coloured box around it.
 */

export interface WorksheetSection {
  id: string;
  type: string;
  title?: string;
  label?: string;
  content?: string;
  marks?: number;
  imageUrl?: string;
  assetRef?: string;
  svg?: string;
  caption?: string;
  fullPage?: boolean;
  isOverlay?: boolean;
  teacherOnly?: boolean;
  qualityIssues?: string[];
  [key: string]: unknown;
}

export interface OverlayFeatureFlags {
  bilingualKeywords?: {
    enabled: boolean;
    languageCode?: string;
    languageLabel?: string;
  } | boolean;
}

export interface OverlayParams {
  retrievalTopic?: string | null;
  additionalInstructions?: string | null;
  sendNeed?: string | null;
  readingAge?: string | null;
  featureFlags?: OverlayFeatureFlags | null;
}

export interface OverlayResult {
  sections: WorksheetSection[];
  appliedOverlays: AppliedOverlay[];
  structuralHash: string;
  baseStructuralHash: string;
  structurePreserved: boolean;
}

export interface AppliedOverlay {
  type: "retrieval" | "additional_instructions" | "send_need" | "reading_age" | "bilingual_keywords";
  params: Record<string, unknown>;
  appliedAt: string;
}

// ── SEND need labels ──────────────────────────────────────────────────────────
const SEND_LABELS: Record<string, string> = {
  dyslexia: "Dyslexia",
  adhd: "ADHD / Focus Support",
  asc: "Autism Spectrum Support",
  autism: "Autism Spectrum Support",
  asperger: "Asperger / ASC Support",
  esl: "EAL / English as an Additional Language",
  eal: "EAL / English as an Additional Language",
  mld: "Moderate Learning Difficulties Support",
  slcn: "Speech, Language and Communication Needs",
  semh: "Social, Emotional and Mental Health Support",
  anxiety: "Anxiety / SEMH Support",
  "mental-health": "Mental Health / SEMH Support",
  vi: "Visual Impairment Support",
  hi: "Hearing Impairment Support",
  deaf: "Hearing Impairment Support",
  pda: "PDA / Demand Avoidance Support",
  odd: "ODD / Demand Avoidance Support",
  "pda-odd": "PDA / Demand Avoidance Support",
  dyspraxia: "Dyspraxia / DCD Support",
  dcd: "Dyspraxia / DCD Support",
  dyscalculia: "Dyscalculia Support",
  tourettes: "Tourette Syndrome Support",
  "tourette-syndrome": "Tourette Syndrome Support",
  "working-memory": "Working Memory Support",
  memory: "Working Memory Support",
  "older-learners": "Older Learners / Adult Education",
  adult: "Older Learners / Adult Education",
  low_literacy: "Low Literacy Support",
};

// ── Section type sets ─────────────────────────────────────────────────────────
const QUESTION_TYPES = new Set([
  "q-short-answer", "q-extended", "q-challenge", "q-free-response", "q-mcq",
  "q-gap-fill", "q-true-false", "q-label-diagram", "q-data-table", "q-graph",
  "q-circuit", "q-draw", "q-ordering", "q-matching", "q-primary-activity",
  "short-answer", "free-response", "guided", "independent", "challenge",
  "section-a", "section-b", "section-c", "question",
]);

const VOCAB_TYPES = new Set(["key-terms", "vocabulary", "key-vocab", "glossary"]);
const DIAGRAM_TYPES = new Set(["diagram", "q-label-diagram", "label-diagram", "diagram-subq"]);
const OBJECTIVE_TYPES = new Set(["learning-objective", "learning_objective", "objective", "lo"]);

// ── Bilingual keyword translations ────────────────────────────────────────────
//
// Lane 1.5 — extended from {ro, es} to the DfE School Census top six pupil
// first languages: ur (Urdu), pl (Polish), bn (Bengali), pa (Punjabi),
// ar (Arabic), ro (Romanian). Spanish (es) is preserved for backwards
// compatibility but is no longer in the canonical UK L1 list at
// `client/src/lib/worksheetSectionTargets.ts:206-216`. Each language ships
// the same ~30 STEM keywords as the original `ro` table for v1; deeper
// per-subject vocabulary is a Lane 3 follow-up.
const TERM_TRANSLATIONS: Record<string, Record<string, string>> = {
  ro: {
    current: "curent",
    voltage: "tensiune",
    resistance: "rezistență",
    conductor: "conductor",
    insulator: "izolator",
    series: "serie",
    parallel: "paralel",
    circuit: "circuit",
    battery: "baterie",
    lamp: "bec",
    switch: "întrerupător",
    charge: "sarcină",
    current_flow: "curgerea curentului",
    ohm: "ohm",
    ohms_law: "legea lui Ohm",
    force: "forță",
    energy: "energie",
    power: "putere",
    cell: "pilă",
    bulb: "bec",
    resistor: "rezistor",
    ammeter: "ampermetru",
    voltmeter: "voltmetru",
    equation: "ecuație",
    fraction: "fracție",
    numerator: "numărător",
    denominator: "numitor",
  },
  // Urdu (ur) — UK's largest non-English pupil L1 (DfE Census).
  ur: {
    current: "کرنٹ",
    voltage: "وولٹیج",
    resistance: "مزاحمت",
    conductor: "موصل",
    insulator: "غیر موصل",
    series: "سلسلہ وار",
    parallel: "متوازی",
    circuit: "سرکٹ",
    battery: "بیٹری",
    lamp: "لیمپ",
    switch: "سوئچ",
    charge: "چارج",
    ohm: "اوہم",
    ohms_law: "اوہم کا قانون",
    force: "قوت",
    energy: "توانائی",
    power: "طاقت",
    cell: "خلیہ",
    bulb: "بلب",
    resistor: "مزاحم",
    ammeter: "ایمیٹر",
    voltmeter: "وولٹ میٹر",
    equation: "مساوات",
    fraction: "کسر",
    numerator: "حسابِ بالا",
    denominator: "حسابِ زیر",
  },
  // Polish (pl).
  pl: {
    current: "prąd",
    voltage: "napięcie",
    resistance: "opór",
    conductor: "przewodnik",
    insulator: "izolator",
    series: "szeregowy",
    parallel: "równoległy",
    circuit: "obwód",
    battery: "bateria",
    lamp: "lampa",
    switch: "przełącznik",
    charge: "ładunek",
    ohm: "om",
    ohms_law: "prawo Ohma",
    force: "siła",
    energy: "energia",
    power: "moc",
    cell: "ogniwo",
    bulb: "żarówka",
    resistor: "rezystor",
    ammeter: "amperomierz",
    voltmeter: "woltomierz",
    equation: "równanie",
    fraction: "ułamek",
    numerator: "licznik",
    denominator: "mianownik",
  },
  // Bengali (bn).
  bn: {
    current: "তড়িৎ প্রবাহ",
    voltage: "ভোল্টেজ",
    resistance: "রোধ",
    conductor: "পরিবাহী",
    insulator: "অন্তরক",
    series: "শ্রেণি",
    parallel: "সমান্তরাল",
    circuit: "বর্তনী",
    battery: "ব্যাটারি",
    lamp: "বাতি",
    switch: "সুইচ",
    charge: "আধান",
    ohm: "ওহম",
    ohms_law: "ওহমের সূত্র",
    force: "বল",
    energy: "শক্তি",
    power: "ক্ষমতা",
    cell: "কোষ",
    bulb: "বাল্ব",
    resistor: "রোধক",
    ammeter: "অ্যামিটার",
    voltmeter: "ভোল্টমিটার",
    equation: "সমীকরণ",
    fraction: "ভগ্নাংশ",
    numerator: "লব",
    denominator: "হর",
  },
  // Punjabi (pa) — Gurmukhi script.
  pa: {
    current: "ਕਰੰਟ",
    voltage: "ਵੋਲਟੇਜ",
    resistance: "ਪ੍ਰਤੀਰੋਧ",
    conductor: "ਚਾਲਕ",
    insulator: "ਨਾਨ-ਚਾਲਕ",
    series: "ਲੜੀ",
    parallel: "ਸਮਾਨਾਂਤਰ",
    circuit: "ਸਰਕਟ",
    battery: "ਬੈਟਰੀ",
    lamp: "ਲੈਂਪ",
    switch: "ਸਵਿਚ",
    charge: "ਚਾਰਜ",
    ohm: "ਓਹਮ",
    ohms_law: "ਓਹਮ ਦਾ ਨਿਯਮ",
    force: "ਬਲ",
    energy: "ਊਰਜਾ",
    power: "ਸ਼ਕਤੀ",
    cell: "ਸੈੱਲ",
    bulb: "ਬਲਬ",
    resistor: "ਰੇਜ਼ਿਸਟਰ",
    ammeter: "ਐਮੀਟਰ",
    voltmeter: "ਵੋਲਟਮੀਟਰ",
    equation: "ਸਮੀਕਰਨ",
    fraction: "ਭਿੰਨ",
    numerator: "ਅੰਸ਼",
    denominator: "ਹਰ",
  },
  // Arabic (ar) — RTL script.
  ar: {
    current: "تيار",
    voltage: "جهد",
    resistance: "مقاومة",
    conductor: "موصل",
    insulator: "عازل",
    series: "توالي",
    parallel: "توازي",
    circuit: "دائرة",
    battery: "بطارية",
    lamp: "مصباح",
    switch: "مفتاح",
    charge: "شحنة",
    ohm: "أوم",
    ohms_law: "قانون أوم",
    force: "قوة",
    energy: "طاقة",
    power: "قدرة",
    cell: "خلية",
    bulb: "مصباح",
    resistor: "مقاوم",
    ammeter: "أميتر",
    voltmeter: "فولتميتر",
    equation: "معادلة",
    fraction: "كسر",
    numerator: "البسط",
    denominator: "المقام",
  },
  // Spanish (es) — preserved for backwards compatibility; not in the
  // canonical UK L1 list. Coverage thinner than the L1s above.
  es: {
    current: "corriente",
    voltage: "voltaje",
    resistance: "resistencia",
    conductor: "conductor",
    insulator: "aislante",
    series: "serie",
    parallel: "paralelo",
    circuit: "circuito",
    battery: "batería",
    lamp: "lámpara",
    switch: "interruptor",
    charge: "carga",
    ohms_law: "ley de Ohm",
  },
};

// ── Utility functions ─────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function cloneSections<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function isTextualSection(section: WorksheetSection): boolean {
  return typeof section.content === "string" && section.content.trim().length > 0 && !DIAGRAM_TYPES.has(section.type);
}

function appendDelimitedBlock(content: string, heading: string, lines: string[]): string {
  if (!content.trim()) return content;
  if (content.includes(heading)) return content;
  const block = [heading, ...lines].join("\n");
  return `${content.trim()}\n\n${block}`;
}

function languageLabel(code: string): string {
  // Lane 1.5 — extended to UK School Census top-six pupil L1s.
  return ({
    ro: "Romanian",
    ur: "Urdu",
    pl: "Polish",
    bn: "Bengali",
    pa: "Punjabi",
    ar: "Arabic",
    es: "Spanish",
  } as Record<string, string>)[code] || code.toUpperCase();
}

function parseRequestedLanguage(
  additionalInstructions?: string | null,
  featureFlags?: OverlayFeatureFlags | null
): { code: string; label: string } | null {
  const bilingualFlag = featureFlags?.bilingualKeywords;
  if (typeof bilingualFlag === "object" && bilingualFlag?.enabled) {
    const code = (bilingualFlag.languageCode || "ro").toLowerCase();
    return { code, label: bilingualFlag.languageLabel || languageLabel(code) };
  }
  const text = (additionalInstructions || "").toLowerCase();
  if (!text) return null;
  if (!/(bilingual|translate|translation|keywords? in|vocabulary in)/i.test(additionalInstructions || "")) return null;
  // Lane 1.5 — detect top-six UK pupil L1s by English name and native script.
  // Order matters: more specific scripts first to avoid false positives.
  if (text.includes("urdu") || /[\u0600-\u06ff]/.test(additionalInstructions || "")) {
    // Urdu uses Arabic script + extended Arabic-Persian range. We default
    // to Urdu when Arabic-script is detected via "urdu" hint; explicit
    // "arabic" check below catches the Arabic case.
    if (text.includes("arabic")) return { code: "ar", label: "Arabic" };
    return { code: "ur", label: "Urdu" };
  }
  if (text.includes("arabic") || text.includes("عربي")) return { code: "ar", label: "Arabic" };
  if (text.includes("polish") || text.includes("polski")) return { code: "pl", label: "Polish" };
  if (text.includes("bengali") || text.includes("bangla") || /[\u0980-\u09ff]/.test(additionalInstructions || "")) {
    return { code: "bn", label: "Bengali" };
  }
  if (text.includes("punjabi") || text.includes("ਪੰਜਾਬੀ") || /[\u0a00-\u0a7f]/.test(additionalInstructions || "")) {
    return { code: "pa", label: "Punjabi" };
  }
  if (text.includes("romanian") || text.includes("română") || text.includes("romana")) return { code: "ro", label: "Romanian" };
  if (text.includes("spanish") || text.includes("español")) return { code: "es", label: "Spanish" };
  return { code: "ro", label: "Romanian" };
}

function parseVocabularyPairs(content: string): Array<{ term: string; definition?: string }> {
  return content
    .split(/\n+/)
    .map(line => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
    .map(line => {
      const match = line.match(/^([^:–—-]{2,80})\s*[:–—-]\s*(.+)$/);
      if (match) return { term: match[1].trim(), definition: match[2].trim() };
      return { term: line.trim() };
    })
    .filter(item => item.term.length > 1)
    .slice(0, 12);
}

function normaliseLookupKey(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function translateTerm(term: string, languageCode: string): string | null {
  const table = TERM_TRANSLATIONS[languageCode];
  if (!table) return null;
  const key = normaliseLookupKey(term);
  if (table[key]) return table[key];
  const compact = key.replace(/\s+/g, "_");
  return table[compact] || null;
}

function applyBilingualVocabulary(
  section: WorksheetSection,
  languageCode: string,
  languageLabelText: string
): WorksheetSection {
  if (!section.content || typeof section.content !== "string") return section;
  if (!VOCAB_TYPES.has(section.type)) return section;
  if (section.content.includes(`Keywords in ${languageLabelText}`)) return section;

  const pairs = parseVocabularyPairs(section.content);
  const glossaryLines = pairs
    .map(pair => {
      const translated = translateTerm(pair.term, languageCode);
      if (!translated) return null;
      return `- ${pair.term} — ${translated}`;
    })
    .filter((line): line is string => Boolean(line));

  if (glossaryLines.length === 0) return section;

  return {
    ...section,
    content: appendDelimitedBlock(section.content, `Keywords in ${languageLabelText}:`, glossaryLines),
  };
}

// ── SEND overlay support box builder ─────────────────────────────────────────
// Creates a separate teacher-visible / student-visible support section that is
// inserted AFTER a question section. Never modifies question text itself.
// NOTE: sendLabel is a NEUTRAL PEDAGOGICAL LABEL — never the condition name.
function buildSupportSection(
  parentId: string,
  neutralLabel: string,
  lines: string[],
  teacherOnly = false
): WorksheetSection {
  return {
    id: `send-support-${parentId}-${Date.now()}`,
    type: "send-support",
    title: neutralLabel,
    content: lines.join("\n"),
    isOverlay: true,
    teacherOnly,
  };
}

// ── Per-SEND-need overlay functions ───────────────────────────────────────────
// Each function returns an array of support sections to insert after the
// question sections. They NEVER modify question content.

// ── Question-type detection helpers ──────────────────────────────────────────

// "This section is a calculation-style question" — used by dyscalculia support.
function isCalculationSection(section: WorksheetSection): boolean {
  const content = String(section.content || "").toLowerCase();
  if (section.type === "q-graph" || section.type === "q-circuit" || section.type === "q-data-table") return true;
  return /\b(calculate|work out|find|compute|solve|evaluate|simplify|round|estimate|convert)\b/i.test(content)
      || /\b(how much|how many|what is the value|how far|how long|how fast)\b/i.test(content)
      || /\d+\s*[+\-×÷\/\*]\s*\d+/.test(content);
}

function isMatchingSection(section: WorksheetSection): boolean {
  return section.type === "q-matching" || /\b(match|connect|link|pair)\b/i.test(String(section.content || ""));
}

function isTrueFalseSection(section: WorksheetSection): boolean {
  return section.type === "q-true-false" || /true.*false|false.*true/i.test(String(section.content || ""));
}

function isMcqSection(section: WorksheetSection): boolean {
  return section.type === "q-mcq" || /^[A-D]\s+/m.test(String(section.content || ""));
}

function isGapFillSection(section: WorksheetSection): boolean {
  return section.type === "q-gap-fill" || /word bank|_____/i.test(String(section.content || ""));
}

function isExtendedWritingSection(section: WorksheetSection): boolean {
  return section.type === "q-extended" || section.type === "q-free-response" ||
    /\b(explain|describe|discuss|evaluate|analyse|justify|assess|compare|contrast)\b/i.test(String(section.content || ""));
}

// Extract the first command verb from a section for question-specific cues
function extractCommandVerb(section: WorksheetSection): string {
  const content = String(section.content || "");
  const match = content.match(/\b(Calculate|Work out|Find|Solve|Evaluate|Simplify|Expand|Factorise|Identify|Describe|Explain|Compare|Analyse|Justify|Assess|Discuss|State|Name|List|Define|Match|Circle|Tick|Fill in|Complete|Label|Sketch|Draw|Plot|Show that|Prove|Write|Express|Round|Estimate|Convert)\b/i);
  return match ? match[1].toLowerCase() : "";
}

// Extract a key noun/topic phrase from the question to make hints feel tailored
function extractTopicNoun(section: WorksheetSection): string {
  const content = String(section.content || "");
  // Remove the verb and common stop words to find a noun phrase
  const cleanContent = content.replace(/\b(Calculate|Work out|Find|Solve|Evaluate|Simplify|Expand|Factorise|Identify|Describe|Explain|Compare|Analyse|Justify|Assess|Discuss|State|Name|List|Define|Match|Circle|Tick|Fill in|Complete|Label|Sketch|Draw|Plot|Show that|Prove|Write|Express|Round|Estimate|Convert|the|a|an|in|on|at|to|for|of|with|and|or|is|are|was|were|what|how|why|when|where)\b/gi, "").replace(/[0-9.]+/g, "").trim();
  
  // Try to find a capitalized word that isn't at the start of a sentence
  const capitalizedMatch = cleanContent.match(/\b[A-Z][a-z]{3,}\b/g);
  if (capitalizedMatch && capitalizedMatch.length > 0) {
    // Pick the first interesting capitalized word (excluding common names if possible, but good enough for a hint)
    return capitalizedMatch[0];
  }
  
  // Otherwise just grab the first significant word (4+ chars)
  const wordMatch = cleanContent.match(/\b[a-zA-Z]{5,}\b/g);
  if (wordMatch && wordMatch.length > 0) {
    return wordMatch[0].toLowerCase();
  }
  
  return "this topic";
}

// Build question-specific hint lines based on section type and content
function buildQuestionSpecificHint(section: WorksheetSection): string[] {
  const verb = extractCommandVerb(section);
  const topicNoun = extractTopicNoun(section);
  
  if (isGapFillSection(section)) {
    return [
      `Read each sentence about ${topicNoun} carefully — the missing word is in the word bank below.`,
      "Cross out each word as you use it so you don't use it twice.",
      "If you are unsure, try each word in the gap and see which makes sense.",
    ];
  }
  if (isTrueFalseSection(section)) {
    return [
      `Read each statement about ${topicNoun} carefully — look for key words like 'always', 'never', 'all'.`,
      "If any part of the statement is wrong, the whole statement is FALSE.",
      "Check your answer against the Key Vocabulary section if unsure.",
    ];
  }
  if (isMcqSection(section)) {
    return [
      "Read all four options before choosing — eliminate the ones you know are wrong first.",
      `Look for the option that is most precise about ${topicNoun} and uses subject vocabulary.`,
      "If two options seem similar, re-read the question to spot the key difference.",
    ];
  }
  if (isMatchingSection(section)) {
    return [
      "Start with the terms you are most confident about — match those first.",
      `Check the Key Vocabulary section if a term related to ${topicNoun} is unfamiliar.`,
      "Each term matches exactly one definition — cross out pairs as you go.",
    ];
  }
  if (isCalculationSection(section)) {
    return [
      `${verb ? `'${verb.charAt(0).toUpperCase() + verb.slice(1)}'` : "This question"} means you need to show a calculation — write every step.`,
      `Write the formula or method for ${topicNoun} first, then substitute your numbers.`,
      "Check your answer: does the unit make sense? Is the size reasonable?",
    ];
  }
  if (isExtendedWritingSection(section)) {
    return [
      `${verb ? `'${verb.charAt(0).toUpperCase() + verb.slice(1)}'` : "This question"} means you need to give reasons and use subject vocabulary.`,
      `Use the sentence starter: 'One key point about ${topicNoun} is...' or 'This shows that...'`,
      "Aim for at least one specific example or piece of evidence in your answer.",
    ];
  }
  return [
    `Read the question about ${topicNoun} carefully — underline the key instruction word.`,
    "Use the worked example above as a guide for how to structure your answer.",
    "Check the Key Vocabulary section if you are unsure of any terms.",
  ];
}

// Helper: count the question sections so per-subject scaffolds can scale the
// frequency of brain breaks / check-ins / take-a-breath prompts.
function countQuestions(sections: WorksheetSection[]): number {
  return sections.filter(s => QUESTION_TYPES.has(s.type) && isTextualSection(s)).length;
}

// ── Dyslexia ──────────────────────────────────────────────────────────────────
function buildDyslexiaSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  // One-off reading support panel after the learning objective — neutral title,
  // no condition label. Each question then gets a question-specific "Hint" box.
  const panelInserted = { value: false };
  const fullPanel = (): WorksheetSection => ({
    id: `reading-support-panel-${Date.now()}`,
    type: "send-support",
    title: "Reading Support",
    content: [
      "Sentence starters: One idea is... / I know this because... / The evidence shows...",
      "Work one line at a time — cover the rest of the page with a piece of paper.",
      "Underline the key instruction word before you start your answer.",
      "Bold key terms are there to help you — use them in your answer.",
    ].join("\n"),
    isOverlay: true,
    teacherOnly: false,
  });

  for (const section of sections) {
    result.push(section);
    if (!panelInserted.value && OBJECTIVE_TYPES.has(section.type)) {
      result.push(fullPanel());
      panelInserted.value = true;
    }
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    if (!panelInserted.value) {
      const last = result.pop()!;
      result.push(fullPanel());
      result.push(last);
      panelInserted.value = true;
    }
    // Question-specific hint box — neutral title "Hint"
    result.push(buildSupportSection(section.id, "Hint", buildQuestionSpecificHint(section)));
  }
  return result;
}

// ── ADHD ──────────────────────────────────────────────────────────────────────
function buildAdhdSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  // Inline '[ ]' checkboxes and bolded action verbs are applied CLIENT-SIDE
  // in sendEnforcer.ts. Here we insert:
  //   1. A one-off focus panel after the learning objective (neutral title).
  //   2. A question-specific "Steps to Follow" hint box after each question.
  //   3. BRAIN BREAK separators proportional to question count.
  const total = countQuestions(sections);
  const breakEvery = Math.max(3, Math.ceil(total / 4));
  let questionCount = 0;
  let panelInserted = false;
  const focusPanel = (): WorksheetSection => ({
    id: `focus-panel-${Date.now()}`,
    type: "send-support",
    title: "How This Worksheet Works",
    content: [
      "Tick each question [ ] as you finish it — this helps you track your progress.",
      "The bold word at the start of every question tells you exactly what to do.",
      "Section A has 3 questions. Section B has 5 questions.",
      "The Challenge is a BONUS — only try it if you want to.",
    ].join("\n"),
    isOverlay: true,
    teacherOnly: false,
  });

  for (const section of sections) {
    result.push(section);
    if (!panelInserted && OBJECTIVE_TYPES.has(section.type)) {
      result.push(focusPanel());
      panelInserted = true;
    }
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    if (!panelInserted) {
      const last = result.pop()!;
      result.push(focusPanel());
      result.push(last);
      panelInserted = true;
    }
    questionCount++;
    // Question-specific "Steps to Follow" box
    result.push(buildSupportSection(section.id, "Steps to Follow", buildQuestionSpecificHint(section)));
    if (total >= 3 && questionCount < total && questionCount % breakEvery === 0) {
      result.push({
        id: `brain-break-${questionCount}-${Date.now()}`,
        type: "send-support",
        title: "BRAIN BREAK",
        content: "Stand up, stretch, take 3 deep breaths — then come back to the next question.",
        isOverlay: true,
        teacherOnly: false,
      });
    }
  }
  return result;
}

// ── ASC / Autism Spectrum Condition ───────────────────────────────────────────
// Teacher feedback: the per-question 'What you need to do' boxes made the
// worksheet feel duplicated. This version emits ONE box per section
// (guided/independent/challenge or Section 1/2/3), placed before the first
// question in each section, using steps derived from the dominant question
// type in that section. This matches the ASC worksheetRule: "Each section
// opens with ONE 'What you need to do:' box listing exact steps."
function buildAscSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];

  // Section-boundary detection: anything that looks like a new section header
  // starts a new group. We also treat a 3-question gap (no question section
  // between two question sections) as a section boundary.
  const isSectionHeader = (s: WorksheetSection): boolean => {
    const title = String(s.title || "").toLowerCase();
    const type = String(s.type || "").toLowerCase();
    return (
      type === "section-a" || type === "section-b" || type === "section-c" ||
      type === "header" ||
      /^section\s*[abc123]/.test(title) ||
      /^(fluency|reasoning|problem\s*solving|recall|understanding|application|challenge|warm[\s-]?up|quick\s*start|main\s*practice|explore|investigate|secret\s*mission)/.test(title)
    );
  };

  const groupStepsFor = (group: WorksheetSection[]): string[] => {
    // Build one set of steps per section by inspecting the dominant question
    // type across the group's question sections. If the group is mixed, pick
    // the type of the FIRST question section.
    const firstQ = group.find(s => QUESTION_TYPES.has(s.type) && isTextualSection(s));
    if (!firstQ) return [];
    if (isGapFillSection(firstQ)) {
      return [
        "What you need to do:",
        "1. Read each sentence carefully.",
        "2. Find the missing word in the word bank.",
        "3. Write the word in the blank space.",
        "4. Cross out each word after you use it.",
      ];
    }
    if (isTrueFalseSection(firstQ)) {
      return [
        "What you need to do:",
        "1. Read the statement exactly as written.",
        "2. Decide if it is completely true or not.",
        "3. Circle TRUE or FALSE.",
        "4. If any part is wrong, the answer is FALSE.",
      ];
    }
    if (isMcqSection(firstQ)) {
      return [
        "What you need to do:",
        "1. Read the question exactly as written.",
        "2. Read all four options A, B, C, D.",
        "3. Cross out the options you know are wrong.",
        "4. Circle the correct answer.",
      ];
    }
    if (isMatchingSection(firstQ)) {
      return [
        "What you need to do:",
        "1. Read all the terms on the left.",
        "2. Read all the definitions on the right.",
        "3. Match each term to its definition with a line.",
        "4. Each term matches exactly one definition.",
      ];
    }
    if (isCalculationSection(firstQ)) {
      return [
        "What you need to do:",
        "1. Read the question exactly as written.",
        "2. Write down the formula or method from the worked example.",
        "3. Substitute the numbers from the question.",
        "4. Calculate and write your answer with the correct unit.",
      ];
    }
    if (isExtendedWritingSection(firstQ)) {
      return [
        "What you need to do:",
        "1. Read the question exactly as written.",
        "2. Underline the instruction word (e.g. Explain, Describe).",
        "3. Write one clear sentence for each point.",
        "4. Use subject vocabulary from the Key Vocabulary section.",
      ];
    }
    return [
      "What you need to do:",
      "1. Read the question exactly as written.",
      "2. Look at the worked example — use the same method.",
      "3. Write one clear answer for each question part.",
      "4. If unsure, re-read the question — the answer is always there.",
    ];
  };

  // Walk sections once, grouping by section boundary, emitting one support
  // box per group immediately after the header (or immediately before the
  // first question if there's no header). This guarantees at most one
  // 'What you need to do' box per section — never per question.
  let currentGroup: WorksheetSection[] = [];
  let insertAfterIdx = -1; // index in `result` where the support box should go
  const flushGroup = () => {
    if (currentGroup.length === 0) return;
    const steps = groupStepsFor(currentGroup);
    if (steps.length > 0 && insertAfterIdx >= 0) {
      const box = buildSupportSection(
        `section-${insertAfterIdx}`,
        "What you need to do",
        steps,
      );
      result.splice(insertAfterIdx + 1, 0, box);
    }
    currentGroup = [];
    insertAfterIdx = -1;
  };

  for (const section of sections) {
    const isHeader = isSectionHeader(section);
    if (isHeader) {
      flushGroup();
      result.push(section);
      insertAfterIdx = result.length - 1;
      continue;
    }
    if (QUESTION_TYPES.has(section.type) && isTextualSection(section)) {
      if (insertAfterIdx === -1) {
        // No explicit header; insert the box before this first question
        insertAfterIdx = result.length - 1;
      }
      currentGroup.push(section);
    }
    result.push(section);
  }
  flushGroup();
  return result;
}

// ── EAL / English as an Additional Language ───────────────────────────────────
function buildEalSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    if (VOCAB_TYPES.has(section.type)) continue;
    // Question-specific language support — neutral title "Language Support"
    const hints: string[] = [];
    const verb = extractCommandVerb(section);
    if (verb) {
      const verbGuide: Record<string, string> = {
        describe: "'Describe' = say what you can see or what happens.",
        explain: "'Explain' = say why something happens. Use 'because'.",
        calculate: "'Calculate' = show your working and write the answer.",
        identify: "'Identify' = name or point to the correct answer.",
        compare: "'Compare' = say what is the same and what is different.",
        evaluate: "'Evaluate' = say how good or effective something is, with reasons.",
        justify: "'Justify' = give reasons for your answer.",
        analyse: "'Analyse' = break the topic into parts and explain each part.",
        state: "'State' = write a short, direct answer — one sentence is enough.",
        define: "'Define' = write the meaning of the word or term.",
        name: "'Name' = write the correct word or term.",
        list: "'List' = write several items, one per line.",
        sketch: "'Sketch' = draw a simple diagram — labels are helpful.",
      };
      const guide = verbGuide[verb.toLowerCase()];
      if (guide) hints.push(guide);
    }
    hints.push("Check the Key Vocabulary section for definitions before you answer.");
    hints.push("You can answer in short, clear sentences — you do not need long paragraphs.");
    result.push(buildSupportSection(section.id, "Language Support", hints));
  }
  return result;
}

// ── MLD / Moderate Learning Difficulties ─────────────────────────────────────
function buildMldSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    // Question-specific hints — neutral title "Help Box"
    const hints: string[] = [];
    if (isGapFillSection(section)) {
      hints.push("Hint: Each missing word is in the word bank — read each option carefully.");
      hints.push("Sentence starter: The missing word is ___ because it fits the sentence.");
    } else if (isTrueFalseSection(section)) {
      hints.push("Hint: Check each statement against the Key Vocabulary section.");
      hints.push("Sentence starter: This is TRUE / FALSE because ___.");
    } else if (isMcqSection(section)) {
      hints.push("Hint: Cross out the options you know are wrong first.");
      hints.push("Sentence starter: The answer is ___ because ___.");
    } else if (isCalculationSection(section)) {
      hints.push("Hint: The worked example shows you the method — copy the steps.");
      hints.push("Sentence starter: First I need to ___, then I ___.");
    } else if (isExtendedWritingSection(section)) {
      hints.push("Hint: Write one sentence for each point you want to make.");
      hints.push("Sentence starter: The answer is ___ because ___.");
    } else {
      hints.push("Hint: The worked example shows you the method.");
      hints.push("Sentence starter: The answer is ___ because ___.");
    }
    hints.push("Key facts: check the Key Vocabulary section if you are stuck.");
    result.push(buildSupportSection(section.id, "Help Box", hints));
  }
  return result;
}

// ── SLCN / Speech, Language and Communication Needs ──────────────────────────
function buildSlcnSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    // Question-specific sentence frames — neutral title "Sentence Starters"
    const frames: string[] = [];
    if (isGapFillSection(section)) {
      frames.push("The missing word is ___ because it describes ___.");
      frames.push("I chose ___ because ___.");
    } else if (isTrueFalseSection(section)) {
      frames.push("This statement is TRUE / FALSE because ___.");
      frames.push("I know this because ___.");
    } else if (isCalculationSection(section)) {
      frames.push("The method I used is ___.");
      frames.push("My answer is ___ because ___.");
    } else if (isMcqSection(section)) {
      frames.push("The answer is ___ because ___.");
      frames.push("I know this is correct because ___.");
    } else if (isExtendedWritingSection(section)) {
      frames.push("___ is important because ___.");
      frames.push("I think ___ because ___.");
      frames.push("The evidence shows ___ which means ___.");
    } else {
      frames.push("___ is important because ___.");
      frames.push("I think ___ because ___.");
    }
    frames.push("Use the Key Vocabulary section — match each term to the question.");
    result.push(buildSupportSection(section.id, "Sentence Starters", frames));
  }
  return result;
}

// ── SEMH / Social, Emotional and Mental Health ────────────────────────────────
function buildSemhSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  // Check-in cadence scales to worksheet length.
  const total = countQuestions(sections);
  const checkInAt = Math.max(2, Math.ceil(total / 2));
  let questionCount = 0;
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    questionCount++;
    // Question-specific encouragement + practical tip — neutral title "Encouragement"
    const hints: string[] = ["You are doing well — take it one question at a time."];
    if (isCalculationSection(section)) {
      hints.push("If the calculation feels tricky, write down what you know first — then try the next step.");
    } else if (isExtendedWritingSection(section)) {
      hints.push("Start with one sentence — you can always add more once you have begun.");
    } else if (isGapFillSection(section)) {
      hints.push("Start with the gaps you are most confident about — skip any you are unsure of and come back.");
    } else {
      hints.push("If you feel stuck, skip this question and come back to it.");
    }
    hints.push("There is no time pressure — work at your own pace.");
    result.push(buildSupportSection(section.id, "Encouragement", hints));
    if (total >= 3 && questionCount === checkInAt) {
      result.push({
        id: `check-in-${Date.now()}`,
        type: "send-support",
        title: "Check In",
        content: "How are you feeling right now?\n[ ] Calm   [ ] OK   [ ] Need a break\nIf you need a break, let your teacher know.",
        isOverlay: true,
        teacherOnly: false,
      });
    }
  }
  return result;
}

// ── Visual Impairment ─────────────────────────────────────────────────────────
function buildViSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  // Rotate through varied phrasings so the same boilerplate is not repeated
  // verbatim under every question — that was making VI worksheets look
  // mechanical and identical regardless of subject or task.
  const accessVariants = [
    "Every detail you need for this question is written out below — there is nothing you have to read off a diagram.",
    "All information for this task is given in plain text — diagrams are optional and described in words.",
    "This question is fully accessible by reading alone — no visual element is required to answer.",
    "Numbers, units and key terms are spelled out — listen to a screen reader at any speed that works for you.",
  ];
  let viIdx = 0;
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    const verb = extractCommandVerb(section);
    const access = accessVariants[viIdx % accessVariants.length];
    viIdx++;
    const hints: string[] = [access];
    if (isCalculationSection(section)) {
      hints.push("All numbers and formulas are written out in full — copy them straight into your working.");
    } else if (isMatchingSection(section)) {
      hints.push("Match by writing the letter or number of your answer next to each item — you do not need to draw lines.");
    } else if (isExtendedWritingSection(section)) {
      hints.push("Plan your answer in a list first — you can use any layout that suits you, including bullet points.");
    } else if (isGapFillSection(section)) {
      hints.push("Each gap is read aloud as 'blank' by your screen reader — listen for the sentence either side to find the missing word.");
    } else {
      hints.push("Any diagram referenced in this question is described in text below — read the description carefully.");
    }
    if (verb) {
      hints.push(`The command word here is '${verb.charAt(0).toUpperCase() + verb.slice(1)}' — make sure your answer matches what that asks for.`);
    }
    hints.push("Use large print, high contrast or a screen reader — whichever works best for you today.");
    result.push(buildSupportSection(section.id, "Access Note", hints));
  }
  return result;
}

// ── Hearing Impairment ────────────────────────────────────────────────────────
function buildHiSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  // Rotate through varied lead-in phrases so every "Written Instructions"
  // box does not start with the same sentence — that was the main complaint
  // about generic per-question instructions.
  const leadInVariants = [
    "Everything you need for this question is on the page — no spoken explanation is required.",
    "All instructions for this task are written out below — you do not need to listen for anything.",
    "This question is fully self-contained: read carefully and you have everything you need.",
    "Read the question text below — every detail is in writing, including any spoken examples.",
  ];
  let hiIdx = 0;
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    const verb = extractCommandVerb(section);
    const lead = leadInVariants[hiIdx % leadInVariants.length];
    hiIdx++;
    const hints: string[] = [lead];
    // Section-specific extra clue — keep it short and concrete.
    if (isMcqSection(section)) {
      hints.push("Each option is written below the question — you can re-read them as many times as you need.");
    } else if (isTrueFalseSection(section)) {
      hints.push("Decide TRUE or FALSE based only on the statement you can read — there is no audio to compare with.");
    } else if (isGapFillSection(section)) {
      hints.push("The word bank contains every word you need — none have been spoken aloud only.");
    } else if (isCalculationSection(section)) {
      hints.push("All numbers, units and formulas are written out — you do not need to listen for any data.");
    } else if (isExtendedWritingSection(section)) {
      hints.push("Plan in writing first — drawing or signing your plan is fine, but written notes give the most marks.");
    } else if (isMatchingSection(section)) {
      hints.push("Both columns are fully written out — match by drawing a line or by writing the matching letter/number.");
    }
    if (verb) {
      hints.push(`The key instruction for this question is: '${verb.charAt(0).toUpperCase() + verb.slice(1)}'.`);
    }
    hints.push("Check the Key Vocabulary section if you are unsure of any term — definitions are written, not spoken.");
    result.push(buildSupportSection(section.id, "Written Instructions", hints));
  }
  return result;
}

// ── PDA / Demand Avoidance ────────────────────────────────────────────────────
function buildPdaSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    // Question-specific invitational language — neutral title "Your Choice"
    const hints: string[] = [];
    if (isGapFillSection(section)) {
      hints.push("You might like to try filling in the gaps — start with the ones you know.");
      hints.push("You can skip any gap and come back to it — there is no set order.");
    } else if (isCalculationSection(section)) {
      hints.push("You might like to try this calculation — start with the part that interests you.");
      hints.push("You can choose to use the worked example as a guide, or try it your own way.");
    } else if (isExtendedWritingSection(section)) {
      hints.push("You might like to explore this question — you can write as much or as little as you want.");
      hints.push("You can start anywhere in your answer — there is no set order.");
    } else if (isMcqSection(section)) {
      hints.push("You might like to try this question — choose the option that makes most sense to you.");
      hints.push("There is no pressure — take your time reading each option.");
    } else {
      hints.push("You might like to try this question — you can choose where to start.");
      hints.push("There is no pressure — work at your own pace.");
    }
    hints.push("Take a break here if you need to — come back when you are ready.");
    result.push(buildSupportSection(section.id, "Your Choice", hints));
  }
  return result;
}

// ── Dyspraxia / DCD ───────────────────────────────────────────────────────────
function buildDyspraxiaSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    // Question-specific alternative format options — neutral title "Answer Options"
    const hints: string[] = [];
    if (isTrueFalseSection(section) || isMcqSection(section)) {
      hints.push("You can circle or tick your answer instead of writing it out.");
      hints.push("Large answer spaces are provided — use as much room as you need.");
    } else if (isMatchingSection(section)) {
      hints.push("You can draw lines to match, or write the letter/number of your answer.");
      hints.push("Large answer spaces are provided — use as much room as you need.");
    } else if (isGapFillSection(section)) {
      hints.push("You can write the word, or circle it in the word bank and draw an arrow to the gap.");
      hints.push("Large answer spaces are provided — use as much room as you need.");
    } else {
      hints.push("You can circle, tick, or underline your answer instead of writing.");
      hints.push("Large answer boxes are provided — use as much space as you need.");
    }
    hints.push("Use the answer frame if you find it easier to structure your response.");
    result.push(buildSupportSection(section.id, "Answer Options", hints));
  }
  return result;
}

// ── Dyscalculia ───────────────────────────────────────────────────────────────
function buildDyscalculiaSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    // Question-specific number support — neutral title "Number Steps" or "Key Facts"
    if (isCalculationSection(section)) {
      const verb = extractCommandVerb(section);
      result.push(buildSupportSection(section.id, "Number Steps", [
        `Step 1: Write down the formula or rule for '${verb || "this calculation"}'.`,
        "Step 2: Write down the numbers you are given.",
        "Step 3: Substitute the numbers into the formula.",
        "Step 4: Calculate the answer — use a number line or key facts box if you need it.",
        "Step 5: Write your final answer with the correct unit.",
        "Check: does the size of your answer make sense?",
      ]));
    } else if (isTrueFalseSection(section)) {
      result.push(buildSupportSection(section.id, "Number Check", [
        "Look for any numbers or values in the statement.",
        "Check each number against the Key Vocabulary section or worked example.",
        "If the number is wrong, the whole statement is FALSE.",
      ]));
    } else if (isMcqSection(section)) {
      result.push(buildSupportSection(section.id, "Number Check", [
        "Look for any numbers in the options — check which one matches the calculation.",
        "Use the worked example to check your method if unsure.",
        "Before you answer: re-read the Key Vocabulary section for the bold terms.",
      ]));
    } else {
      result.push(buildSupportSection(section.id, "Key Facts", [
        "Before you answer: re-read the Key Vocabulary section for the bold terms.",
        "Write your answer in words first, then check against the word bank.",
      ]));
    }
  }
  return result;
}

// ── Tourette Syndrome ─────────────────────────────────────────────────────────
function buildTourettesSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  const total = countQuestions(sections);
  const breakEvery = Math.max(3, Math.ceil(total / 4));
  let questionCount = 0;
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    questionCount++;
    // Question-specific hint box — neutral title "Hint"
    result.push(buildSupportSection(section.id, "Hint", buildQuestionSpecificHint(section)));
    if (total >= 3 && questionCount < total && questionCount % breakEvery === 0) {
      result.push({
        id: `pause-break-${questionCount}-${Date.now()}`,
        type: "send-support",
        title: "Pause Point",
        content: "Take a breath here if you need to — then continue when you are ready.",
        isOverlay: true,
        teacherOnly: false,
      });
    }
  }
  return result;
}

// ── Working Memory ────────────────────────────────────────────────────────────
function buildWorkingMemorySupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    // Question-specific memory aids — neutral title "Memory Aid"
    const hints: string[] = ["Before you start: check the Key Vocabulary section for the bold terms."];
    if (isCalculationSection(section)) {
      hints.push("Write down the formula before you substitute any numbers.");
      hints.push("One step at a time — check each step against the worked example.");
    } else if (isGapFillSection(section)) {
      hints.push("Write down the key words from the word bank before you start.");
      hints.push("Cross out each word as you use it so you don't lose track.");
    } else if (isExtendedWritingSection(section)) {
      hints.push("Write down the key points you want to make before you start writing.");
      hints.push("One point per sentence — check each sentence makes sense before moving on.");
    } else if (isTrueFalseSection(section)) {
      hints.push("Write down the key fact you are checking before you decide TRUE or FALSE.");
      hints.push("Check your answer against the worked example or Key Vocabulary section.");
    } else {
      hints.push("Write down the key facts you need so you don't have to hold them in your head.");
      hints.push("One step at a time — check your answer against the worked example when done.");
    }
    result.push(buildSupportSection(section.id, "Memory Aid", hints));
  }
  return result;
}

// ── Older Learners / Adult Education ─────────────────────────────────────────
function buildOlderLearnersSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    // Question-specific study tips — neutral title "Study Tip"
    const hints: string[] = ["Connect this topic to your own experience or prior knowledge."];
    const verb = extractCommandVerb(section);
    if (verb) {
      const verbTips: Record<string, string> = {
        explain: "Exam technique: 'Explain' means give reasons using subject vocabulary.",
        calculate: "Exam technique: 'Calculate' means show all working and write the answer with units.",
        describe: "Exam technique: 'Describe' means say what you observe or what happens.",
        evaluate: "Exam technique: 'Evaluate' means weigh up the evidence and give a conclusion.",
        compare: "Exam technique: 'Compare' means state similarities AND differences.",
        justify: "Exam technique: 'Justify' means give evidence to support your answer.",
        analyse: "Exam technique: 'Analyse' means break the topic into parts and explain each.",
      };
      hints.push(verbTips[verb.toLowerCase()] || `Exam technique: Use the command word '${verb}' to structure your answer.`);
    } else {
      hints.push("Exam technique: Use the command word to structure your answer.");
    }
    hints.push("Note-taking: Write down one key point from this question in your own words.");
    result.push(buildSupportSection(section.id, "Study Tip", hints));
  }
  return result;
}

// ── Master SEND dispatcher ────────────────────────────────────────────────────
function applySendSupport(sections: WorksheetSection[], sendNeed?: string | null): WorksheetSection[] {
  if (!sendNeed || sendNeed === "none" || sendNeed === "none-selected") return sections;
  // Normalise the key. The UI may emit compound forms like
  // "asc:asc-demand-avoidant" when an autism sub-profile is picked — treat
  // everything after the colon as the authoritative id so the profile is
  // routed correctly and still falls back to the ASC overlay if the profile
  // is unrecognised.
  const rawKey = sendNeed.toLowerCase().replace(/[\s_]/g, "-");
  const key = rawKey.includes(":") ? rawKey.split(":").pop() || rawKey : rawKey;

  if (key === "dyslexia") return buildDyslexiaSupport(sections);
  if (key === "adhd") return buildAdhdSupport(sections);
  if (
    key === "asc" || key === "autism" || key === "asperger" ||
    key.startsWith("asc-")
  ) return buildAscSupport(sections);
  if (key === "esl" || key === "eal") return buildEalSupport(sections);
  if (key === "mld") return buildMldSupport(sections);
  if (key === "slcn") return buildSlcnSupport(sections);
  if (key === "semh" || key === "anxiety" || key === "mental-health") return buildSemhSupport(sections);
  if (key === "vi" || key === "visual-impairment" || key === "visual") return buildViSupport(sections);
  if (key === "hi" || key === "hearing-impairment" || key === "deaf") return buildHiSupport(sections);
  if (key === "pda" || key === "odd" || key === "pda-odd") return buildPdaSupport(sections);
  if (key === "dyspraxia" || key === "dcd") return buildDyspraxiaSupport(sections);
  if (key === "dyscalculia") return buildDyscalculiaSupport(sections);
  if (key === "tourettes" || key === "tourette-syndrome") return buildTourettesSupport(sections);
  if (key === "working-memory" || key === "memory") return buildWorkingMemorySupport(sections);
  if (key === "older-learners" || key === "adult") return buildOlderLearnersSupport(sections);

  // Default: generic question-specific support box for any unrecognised SEND need
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    result.push(buildSupportSection(section.id, "Hint", buildQuestionSpecificHint(section)));
  }
  return result;
}

// ── Reading age support ───────────────────────────────────────────────────────
function applyReadingAgeSupport(sections: WorksheetSection[], readingAge: string): WorksheetSection[] {
  const ageMatch = readingAge.match(/(\d+)/);
  const age = ageMatch ? parseInt(ageMatch[1]) : 12;
  if (age >= 12) return sections;

  const scaffoldingCues = age <= 8
    ? ["Read the question carefully.", "Use the example above to help you.", "Write your answer in the box."]
    : age <= 10
    ? ["Read the question carefully.", "Look at the worked example if you need help.", "Write your answer clearly."]
    : ["Read the question carefully.", "Use the worked example if needed."];

  return sections.map(section => {
    if (!isTextualSection(section)) return section;
    if (!QUESTION_TYPES.has(section.type)) return section;
    const content = section.content as string;
    if (content.includes(scaffoldingCues[0])) return section;
    return {
      ...section,
      content: appendDelimitedBlock(content, "Reading support:", scaffoldingCues),
    };
  });
}

// ── Structural hash ───────────────────────────────────────────────────────────
export function computeStructuralHash(sections: WorksheetSection[]): string {
  const structural = sections
    .filter(section => !section.isOverlay)
    .map(section => `${section.id}:${section.type}:${section.assetRef || section.imageUrl || ""}`)
    .join("|");

  let hash = 5381;
  for (let i = 0; i < structural.length; i++) {
    hash = ((hash << 5) + hash) ^ structural.charCodeAt(i);
    hash >>>= 0;
  }
  return hash.toString(16).padStart(8, "0");
}

// ── Strong structural assertion ──────────────────────────────────────────────
// Verifies that every non-overlay base section survives verbatim — same id,
// type, content, marks, imageUrl, assetRef. If a SEND overlay ever mutated a
// question the academic integrity contract would be broken. In development we
// throw so the bug is loud; in production we log and continue so a single
// regression doesn't take out the whole worksheet pipeline.
export function assertBaseSectionsPreserved(
  baseSections: WorksheetSection[],
  finalSections: WorksheetSection[]
): void {
  const baseMap = new Map<string, WorksheetSection>();
  for (const s of baseSections) if (!s.isOverlay) baseMap.set(s.id, s);

  const finalMap = new Map<string, WorksheetSection>();
  for (const s of finalSections) if (!s.isOverlay) finalMap.set(s.id, s);

  const mismatches: string[] = [];
  for (const [id, base] of Array.from(baseMap.entries())) {
    const after = finalMap.get(id);
    if (!after) { mismatches.push(`missing base section ${id}`); continue; }
    const keys: Array<keyof WorksheetSection> = ["type", "content", "marks", "imageUrl", "assetRef", "title"];
    for (const k of keys) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((after as any)[k] !== (base as any)[k]) {
        mismatches.push(`${id}.${String(k)} changed`);
      }
    }
  }
  if (mismatches.length === 0) return;
  const msg = `[overlayEngine] Base structure mutated by overlays: ${mismatches.join(", ")}`;
  if (process.env.NODE_ENV !== "production") {
    throw new Error(msg);
  }
  console.error(msg);
}

// ── Main overlay application function ────────────────────────────────────────
export function applyOverlays(baseSections: WorksheetSection[], overlays: OverlayParams): OverlayResult {
  let result = cloneSections(baseSections);
  const baseStructuralHash = computeStructuralHash(result);
  const appliedOverlays: AppliedOverlay[] = [];
  const overlayNotes: string[] = [];

  const requestedLanguage = parseRequestedLanguage(overlays.additionalInstructions, overlays.featureFlags);

  // 1. SEND overlay — inserts support sections after question sections
  if (overlays.sendNeed && overlays.sendNeed !== "none" && overlays.sendNeed !== "none-selected") {
    const sendLabel = SEND_LABELS[overlays.sendNeed.toLowerCase().replace(/[\s_]/g, "-")] || overlays.sendNeed;
    result = applySendSupport(result, overlays.sendNeed);
    overlayNotes.push(`SEND support applied: ${sendLabel}. Scaffolding inserted as support boxes after each question section — academic challenge and question content unchanged.`);
    appliedOverlays.push({
      type: "send_need",
      params: { sendNeed: overlays.sendNeed, sendLabel },
      appliedAt: nowIso(),
    });
  }

  // 2. Reading age overlay
  if (overlays.readingAge) {
    result = applyReadingAgeSupport(result, overlays.readingAge);
    overlayNotes.push(`Reading age adjusted to ${overlays.readingAge}.`);
    appliedOverlays.push({
      type: "reading_age",
      params: { readingAge: overlays.readingAge },
      appliedAt: nowIso(),
    });
  }

  // 3. Bilingual vocabulary overlay
  if (requestedLanguage) {
    result = result.map(section => applyBilingualVocabulary(section, requestedLanguage.code, requestedLanguage.label));
    overlayNotes.push(`Bilingual keyword support added in ${requestedLanguage.label}.`);
    appliedOverlays.push({
      type: "bilingual_keywords",
      params: { languageCode: requestedLanguage.code, languageLabel: requestedLanguage.label },
      appliedAt: nowIso(),
    });
  }

  // 4. Retrieval practice overlay — inserted after learning objective
  if (overlays.retrievalTopic) {
    const loIdx = result.findIndex(section => OBJECTIVE_TYPES.has(section.type));
    const insertAt = loIdx >= 0 ? loIdx + 1 : Math.min(1, result.length);
    const retrievalSection: WorksheetSection = {
      id: `retrieval-overlay-${Date.now()}`,
      type: "retrieval",
      title: "Retrieval Practice",
      label: "RETRIEVAL",
      content: [
        `**Topic: ${overlays.retrievalTopic}**`,
        "",
        `**Brain Dump** — Without looking at your notes, write down everything you can remember about ${overlays.retrievalTopic}. (3 minutes)`,
        "",
        `**Q1.** Name three key facts or terms from ${overlays.retrievalTopic}. [3 marks]`,
        "",
        `**Q2.** Define one key term from ${overlays.retrievalTopic} in your own words. [2 marks]`,
        "",
        `**Q3.** Give one real-world example or application linked to ${overlays.retrievalTopic}. [2 marks]`,
        "",
        `**Q4.** How does ${overlays.retrievalTopic} connect to what you are studying today? [1 mark]`,
      ].join("\n"),
      marks: 8,
      isOverlay: true,
      teacherOnly: false,
    };
    result.splice(insertAt, 0, retrievalSection);
    appliedOverlays.push({
      type: "retrieval",
      params: { retrievalTopic: overlays.retrievalTopic, insertedAt: insertAt },
      appliedAt: nowIso(),
    });
    overlayNotes.push(`Retrieval practice section inserted after the learning objective (topic: ${overlays.retrievalTopic}).`);
  }

  // 5. Additional instructions — captured in overlay log only
  if (overlays.additionalInstructions) {
    overlayNotes.push(`Additional requirement captured: ${overlays.additionalInstructions}`);
    appliedOverlays.push({
      type: "additional_instructions",
      params: { instructions: overlays.additionalInstructions },
      appliedAt: nowIso(),
    });
  }

  // 6. Insert overlay summary note as teacher-only section after learning objective
  if (overlayNotes.length > 0) {
    const loIdx2 = result.findIndex(section => OBJECTIVE_TYPES.has(section.type));
    const noteInsertAt = loIdx2 >= 0 ? loIdx2 + 1 : 0;
    result.splice(noteInsertAt, 0, {
      id: `worksheet-overlay-note-${Date.now()}`,
      type: "teacher-note",
      title: "Overlay Summary (Teacher Only)",
      content: overlayNotes.map(line => `- ${line}`).join("\n"),
      isOverlay: true,
      teacherOnly: true,
    });
  }

  const finalStructuralHash = computeStructuralHash(result);
  const structurePreserved = finalStructuralHash === baseStructuralHash;

  // Stronger post-condition: every non-overlay base section must survive
  // verbatim. This catches any overlay that accidentally mutates a question.
  assertBaseSectionsPreserved(baseSections, result);

  return {
    sections: result,
    appliedOverlays,
    structuralHash: finalStructuralHash,
    baseStructuralHash,
    structurePreserved,
  };
}

// ── Base structure extraction ─────────────────────────────────────────────────
export function extractBaseStructure(sections: WorksheetSection[]): {
  sectionIds: string[];
  sectionTypes: string[];
  diagramSlotIds: string[];
  questionIds: string[];
  structuralHash: string;
} {
  const baseSections = sections.filter(section => !section.isOverlay);
  return {
    sectionIds: baseSections.map(section => section.id),
    sectionTypes: baseSections.map(section => section.type),
    diagramSlotIds: baseSections
      .filter(section => section.imageUrl || section.assetRef || DIAGRAM_TYPES.has(section.type))
      .map(section => section.id),
    questionIds: baseSections
      .filter(section => section.type.startsWith("q-") || QUESTION_TYPES.has(section.type))
      .map(section => section.id),
    structuralHash: computeStructuralHash(baseSections),
  };
}

// ── Diagram slot extraction ───────────────────────────────────────────────────
export function extractDiagramSlots(sections: WorksheetSection[]): Array<{
  sectionId: string;
  slotType: string;
  assetRef?: string;
  imageUrl?: string;
  required: boolean;
}> {
  return sections
    .filter(section => !section.isOverlay && (section.imageUrl || section.assetRef || DIAGRAM_TYPES.has(section.type)))
    .map(section => ({
      sectionId: section.id,
      slotType: section.type || "diagram",
      assetRef: section.assetRef as string | undefined,
      imageUrl: section.imageUrl as string | undefined,
      required: true,
    }));
}
