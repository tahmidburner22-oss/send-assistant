/**
 * Overlay Engine
 *
 * Deterministic worksheet overlays that preserve the underlying worksheet
 * structure, ordering, numbering, and diagram assets.
 *
 * Design rules:
 * - Never remove or reorder base sections.
 * - Never touch diagram/image references.
 * - Only insert overlay sections (teacher notes / retrieval) or append clearly
 *   delimited support text within existing text sections.
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
  isOverlay?: boolean;
  teacherOnly?: boolean;
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

const SEND_LABELS: Record<string, string> = {
  dyslexia: "Dyslexia",
  adhd: "ADHD / Focus Support",
  esl: "EAL / English as an Additional Language",
  eal: "EAL / English as an Additional Language",
  visual: "Visual Impairment Support",
  asd: "Autism Spectrum Support",
  autism: "Autism Spectrum Support",
  low_literacy: "Low Literacy Support",
  dyscalculia: "Dyscalculia Support",
  memory: "Working Memory Support",
  mld: "Moderate Learning Difficulties Support",
  semh: "SEMH Support",
};

const QUESTION_TYPES = new Set([
  "q-short-answer", "q-extended", "q-challenge", "q-free-response", "q-mcq",
  "q-gap-fill", "q-true-false", "q-label-diagram", "short-answer", "free-response",
  "guided", "independent", "challenge", "section-a", "section-b", "section-c",
]);

const VOCAB_TYPES = new Set(["key-terms", "vocabulary", "key-vocab", "glossary"]);
const DIAGRAM_TYPES = new Set(["diagram", "q-label-diagram", "label-diagram", "diagram-subq"]);
const OBJECTIVE_TYPES = new Set(["learning-objective", "learning_objective", "objective", "lo"]);

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

function parseRequestedLanguage(additionalInstructions?: string | null, featureFlags?: OverlayFeatureFlags | null): { code: string; label: string } | null {
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

function applyBilingualVocabulary(section: WorksheetSection, languageCode: string, languageLabelText: string): WorksheetSection {
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

function applyDyslexiaSupport(section: WorksheetSection): WorksheetSection {
  if (!isTextualSection(section) || !QUESTION_TYPES.has(section.type)) return section;
  return {
    ...section,
    content: appendDelimitedBlock(section.content as string, "Support:", [
      "- Sentence starters: One idea is... / I know this because... / The evidence shows...",
      "- Work one line at a time.",
      "- Underline the command word before you answer.",
    ]),
  };
}

function applyAdhdSupport(section: WorksheetSection): WorksheetSection {
  if (!isTextualSection(section) || !QUESTION_TYPES.has(section.type)) return section;
  return {
    ...section,
    content: appendDelimitedBlock(section.content as string, "Support:", [
      "- Complete the task in 2 short steps.",
      "- Tick each step when finished.",
      "- Focus on one command word at a time.",
    ]),
  };
}

function applyAutismSupport(section: WorksheetSection): WorksheetSection {
  if (!isTextualSection(section) || !QUESTION_TYPES.has(section.type)) return section;
  return {
    ...section,
    content: appendDelimitedBlock(section.content as string, "Support:", [
      "- Read the instruction exactly as written.",
      "- Use the worked example first, then copy the method.",
      "- Write one clear answer for each question.",
    ]),
  };
}

function applyEalSupport(section: WorksheetSection): WorksheetSection {
  if (!isTextualSection(section)) return section;
  if (VOCAB_TYPES.has(section.type)) return section;
  if (!QUESTION_TYPES.has(section.type)) return section;
  return {
    ...section,
    content: appendDelimitedBlock(section.content as string, "Language support:", [
      "- Key word bank: define the subject words before you answer.",
      "- You may answer in short clear sentences.",
      "- Match each command word to the task: describe / explain / calculate.",
    ]),
  };
}

function applySendSupport(sections: WorksheetSection[], sendNeed?: string | null): WorksheetSection[] {
  if (!sendNeed || sendNeed === "none" || sendNeed === "none-selected") return sections;
  const key = sendNeed.toLowerCase();
  if (key === "dyslexia") return sections.map(applyDyslexiaSupport);
  if (key === "adhd") return sections.map(applyAdhdSupport);
  if (key === "asd" || key === "autism") return sections.map(applyAutismSupport);
  if (key === "esl" || key === "eal") return sections.map(applyEalSupport);
  return sections;
}

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

export function applyOverlays(baseSections: WorksheetSection[], overlays: OverlayParams): OverlayResult {
  let result = cloneSections(baseSections);
  const baseStructuralHash = computeStructuralHash(result);
  const appliedOverlays: AppliedOverlay[] = [];
  const overlayNotes: string[] = [];

  const requestedLanguage = parseRequestedLanguage(overlays.additionalInstructions, overlays.featureFlags);

  if (overlays.sendNeed && overlays.sendNeed !== "none" && overlays.sendNeed !== "none-selected") {
    const sendLabel = SEND_LABELS[overlays.sendNeed] || overlays.sendNeed;
    result = applySendSupport(result, overlays.sendNeed);
    overlayNotes.push(`SEND support applied: ${sendLabel}.`);
    appliedOverlays.push({
      type: "send_need",
      params: { sendNeed: overlays.sendNeed, sendLabel },
      appliedAt: nowIso(),
    });
  }

  if (overlays.readingAge) {
    overlayNotes.push(`Reading age target preserved at ${overlays.readingAge}.`);
    appliedOverlays.push({
      type: "reading_age",
      params: { readingAge: overlays.readingAge },
      appliedAt: nowIso(),
    });
  }

  if (requestedLanguage) {
    result = result.map(section => applyBilingualVocabulary(section, requestedLanguage.code, requestedLanguage.label));
    overlayNotes.push(`Bilingual keyword support added in ${requestedLanguage.label}.`);
    appliedOverlays.push({
      type: "bilingual_keywords",
      params: { languageCode: requestedLanguage.code, languageLabel: requestedLanguage.label },
      appliedAt: nowIso(),
    });
  }

  if (overlays.retrievalTopic) {
    const loIdx = result.findIndex(section => OBJECTIVE_TYPES.has(section.type));
    const insertAt = loIdx >= 0 ? loIdx + 1 : Math.min(1, result.length);
    const retrievalSection: WorksheetSection = {
      id: `retrieval-overlay-${Date.now()}`,
      type: "retrieval",
      title: "RETRIEVAL PRACTICE",
      label: "RETRIEVAL",
      content: [
        `Retrieval topic: ${overlays.retrievalTopic}`,
        "",
        `1. Write three facts you remember about ${overlays.retrievalTopic}.`,
        `2. Define one key term from ${overlays.retrievalTopic}.`,
        `3. Give one example linked to ${overlays.retrievalTopic}.`,
      ].join("\n"),
      marks: 6,
      isOverlay: true,
      teacherOnly: false,
    };
    result.splice(insertAt, 0, retrievalSection);
    appliedOverlays.push({
      type: "retrieval",
      params: { retrievalTopic: overlays.retrievalTopic, insertedAt: insertAt },
      appliedAt: nowIso(),
    });
    overlayNotes.push("Retrieval section inserted after the learning objective.");
  }

  if (overlays.additionalInstructions) {
    overlayNotes.push(`Additional requirement captured: ${overlays.additionalInstructions}`);
    appliedOverlays.push({
      type: "additional_instructions",
      params: { instructions: overlays.additionalInstructions },
      appliedAt: nowIso(),
    });
  }

  if (overlayNotes.length > 0) {
    result.unshift({
      id: `worksheet-overlay-note-${Date.now()}`,
      type: "teacher-note",
      title: "Overlay summary",
      content: overlayNotes.map(line => `- ${line}`).join("\n"),
      isOverlay: true,
      teacherOnly: false,
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
