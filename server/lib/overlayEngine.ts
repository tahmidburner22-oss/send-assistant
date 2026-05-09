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
  return ({ ro: "Romanian", es: "Spanish" } as Record<string, string>)[code] || code.toUpperCase();
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
function buildSupportSection(
  parentId: string,
  sendLabel: string,
  lines: string[],
  teacherOnly = false
): WorksheetSection {
  return {
    id: `send-support-${parentId}-${Date.now()}`,
    type: "send-support",
    title: `Support Box — ${sendLabel}`,
    content: lines.join("\n"),
    isOverlay: true,
    teacherOnly,
  };
}

// ── Per-SEND-need overlay functions ───────────────────────────────────────────
// Each function returns an array of support sections to insert after the
// question sections. They NEVER modify question content.

function buildDyslexiaSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    result.push(buildSupportSection(section.id, "Dyslexia", [
      "Sentence starters: One idea is... / I know this because... / The evidence shows...",
      "Work one line at a time — cover the rest with a piece of paper.",
      "Underline the command word before you start your answer.",
      "Bold key terms are there to help you — use them in your answer.",
    ]));
  }
  return result;
}

function buildAdhdSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  let questionCount = 0;
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    questionCount++;
    result.push(buildSupportSection(section.id, "ADHD / Focus", [
      "[ ] Read the question.",
      "[ ] Underline the command word.",
      "[ ] Write your answer.",
      "[ ] Check your answer.",
    ]));
    // Insert a brain break every 3 questions
    if (questionCount % 3 === 0) {
      result.push({
        id: `adhd-break-${questionCount}-${Date.now()}`,
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

function buildAscSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    result.push(buildSupportSection(section.id, "Autism Spectrum Support", [
      "What you need to do: Read the instruction exactly as written.",
      "Use the worked example first — copy the method step by step.",
      "Write one clear answer for each question part.",
      "If you are unsure, re-read the question — the answer is always in the question or worked example.",
    ]));
  }
  return result;
}

function buildEalSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    if (VOCAB_TYPES.has(section.type)) continue;
    result.push(buildSupportSection(section.id, "EAL Language Support", [
      "Key word bank: check the Key Vocabulary section for definitions before you answer.",
      "You may answer in short, clear sentences — you do not need to write long paragraphs.",
      "Command words: describe = say what you see. Explain = say why. Calculate = show working.",
    ]));
  }
  return result;
}

function buildMldSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    result.push(buildSupportSection(section.id, "MLD Support", [
      "Hint: Look at the worked example — it shows you the method.",
      "Sentence starter: The answer is ___ because ___.",
      "Key facts box: check the Key Vocabulary section if you are stuck.",
      "You can use the word bank to help you.",
    ]));
  }
  return result;
}

function buildSlcnSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    result.push(buildSupportSection(section.id, "SLCN Support", [
      "Sentence frame: ___ is important because ___.",
      "Sentence frame: I think ___ because ___.",
      "Sentence frame: The evidence shows ___ which means ___.",
      "Use the Key Vocabulary section — match each term to the question.",
    ]));
  }
  return result;
}

function buildSemhSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  let questionCount = 0;
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    questionCount++;
    result.push(buildSupportSection(section.id, "Support", [
      "You are doing well — take it one question at a time.",
      "There is no time pressure — work at your own pace.",
      "If you feel stuck, skip this question and come back to it.",
    ]));
    if (questionCount === 3) {
      result.push({
        id: `semh-checkin-${Date.now()}`,
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

function buildViSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    result.push(buildSupportSection(section.id, "Visual Impairment Support", [
      "All diagrams are described in text — read the description carefully.",
      "Use large print or screen reader settings as needed.",
      "All questions can be answered from the text — no visual interpretation required.",
    ]));
  }
  return result;
}

function buildHiSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    result.push(buildSupportSection(section.id, "Hearing Impairment Support", [
      "All instructions are written in full — no verbal explanation needed.",
      "Every question is self-contained — all information is on the page.",
      "Check the Key Vocabulary section for definitions of all key terms.",
    ]));
  }
  return result;
}

function buildPdaSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    result.push(buildSupportSection(section.id, "PDA Support", [
      "You might like to try this question — you can choose where to start.",
      "There are two options for this question — pick the one that feels right.",
      "Take a break here if you need to — come back when you are ready.",
    ]));
  }
  return result;
}

function buildDyspraxiaSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    result.push(buildSupportSection(section.id, "Dyspraxia / DCD Support", [
      "You can circle, tick, or underline your answer instead of writing.",
      "Use the answer frame below if you find writing difficult.",
      "Large answer boxes are provided — use as much space as you need.",
    ]));
  }
  return result;
}

function buildDyscalculiaSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    result.push(buildSupportSection(section.id, "Dyscalculia Support", [
      "Step 1: Write down the formula or rule.",
      "Step 2: Write down the numbers you are given.",
      "Step 3: Substitute the numbers into the formula.",
      "Step 4: Calculate the answer.",
      "Step 5: Write the unit.",
      "Use the number line or key facts box if you need it.",
    ]));
  }
  return result;
}

function buildTourettesSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  let questionCount = 0;
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    questionCount++;
    if (questionCount % 3 === 0) {
      result.push({
        id: `tourettes-break-${questionCount}-${Date.now()}`,
        type: "send-support",
        title: "Take a Breath",
        content: "Take a breath here if you need to — then continue when you are ready.",
        isOverlay: true,
        teacherOnly: false,
      });
    }
  }
  return result;
}

function buildWorkingMemorySupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    result.push(buildSupportSection(section.id, "Working Memory Support", [
      "Key information: re-read the Key Vocabulary section before answering.",
      "Write down the key facts you need before you start.",
      "One step at a time — do not try to hold everything in your head.",
      "Check your answer against the worked example when you finish.",
    ]));
  }
  return result;
}

function buildOlderLearnersSupport(sections: WorksheetSection[]): WorksheetSection[] {
  const result: WorksheetSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) continue;
    result.push(buildSupportSection(section.id, "Study Tips", [
      "Study tip: Connect this topic to your own experience or prior knowledge.",
      "Note-taking: Write down one key point from this question in your own words.",
      "Exam technique: Use the command word to structure your answer.",
    ]));
  }
  return result;
}

// ── Master SEND dispatcher ────────────────────────────────────────────────────
function applySendSupport(sections: WorksheetSection[], sendNeed?: string | null): WorksheetSection[] {
  if (!sendNeed || sendNeed === "none" || sendNeed === "none-selected") return sections;
  const key = sendNeed.toLowerCase().replace(/[\s_]/g, "-");

  if (key === "dyslexia") return buildDyslexiaSupport(sections);
  if (key === "adhd") return buildAdhdSupport(sections);
  if (key === "asc" || key === "autism" || key === "asperger") return buildAscSupport(sections);
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

  // Default: generic support box for any unrecognised SEND need
  return sections.map(section => {
    if (!QUESTION_TYPES.has(section.type) || !isTextualSection(section)) return section;
    return {
      ...section,
      content: appendDelimitedBlock(section.content as string, "Support:", [
        "- Read the question carefully.",
        "- Use the worked example if you need help.",
        "- Write your answer clearly.",
      ]),
    };
  });
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
