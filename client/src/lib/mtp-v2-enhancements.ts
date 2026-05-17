/**
 * mtp-v2-enhancements.ts
 *
 * Five further improvements layered onto Medium-Term Planner, separate from
 * the existing `mtp-enhancements.ts` (backwards-from-assessment, heatmap,
 * interleaving auto-insert, change feed, lesson-planner seed).
 *
 *  1. Prior / next learning bridge — explicit prompt fragment naming the
 *     previous and next units so the AI threads the unit between them.
 *  2. Knowledge organiser auto-spinoff — extracts vocab + key facts +
 *     diagram suggestions from the generated MTP and renders an A4 KO.
 *  3. Lesson-titles fast pass — first AI call returns just the lesson titles
 *     so a teacher can rename them before the slow full plan is generated.
 *  4. Tracking grid — printable per-pupil x objectives grid.
 *  5. Cross-curricular suggestions — extracts suggestions paragraph from
 *     the generated MTP and surfaces it as cards.
 */

import { callAI } from "@/lib/ai";

// ─── 1. Prior / next learning bridge ───────────────────────────────────────

export interface BridgeInputs {
  priorUnitTitle?: string;
  priorUnitOutcomes?: string;     // brief summary
  nextUnitTitle?: string;
  nextUnitOutcomes?: string;
}

export function buildBridgePromptFragment(b: BridgeInputs): string {
  if (!b.priorUnitTitle && !b.nextUnitTitle) return "";
  const parts: string[] = ["PROGRESSION CONTEXT (thread the unit between these):"];
  if (b.priorUnitTitle) {
    parts.push(`- Previous unit: "${b.priorUnitTitle}"${b.priorUnitOutcomes ? ` — pupils achieved: ${b.priorUnitOutcomes}` : ""}`);
    parts.push(`  In Lesson 1, explicitly retrieve the most relevant idea from "${b.priorUnitTitle}".`);
  }
  if (b.nextUnitTitle) {
    parts.push(`- Next unit: "${b.nextUnitTitle}"${b.nextUnitOutcomes ? ` — pupils will need to: ${b.nextUnitOutcomes}` : ""}`);
    parts.push(`  In the End of Unit Assessment, plant a question that bridges into "${b.nextUnitTitle}".`);
  }
  return parts.join("\n");
}

// ─── 2. Knowledge organiser auto-spinoff ───────────────────────────────────

export interface KOEntry {
  vocabulary: { term: string; definition: string }[];
  keyFacts: string[];
  diagramIdeas: string[];
  importantPeople?: string[];
  importantDates?: string[];
}

/** Heuristic extractor — pulls a knowledge-organiser-friendly subset from
 *  the generated MTP text without making a second AI call. */
export function extractKnowledgeOrganiser(mtpText: string): KOEntry {
  const ko: KOEntry = {
    vocabulary: [],
    keyFacts: [],
    diagramIdeas: [],
  };

  // Vocabulary section — block following "Key Vocabulary"
  const vocabMatch = mtpText.match(/Key\s+Vocabulary[\s\S]*?(?=\*\*[A-Z]|##|Lesson\s+\d|$)/i);
  if (vocabMatch) {
    const lines = vocabMatch[0].split(/\n+/).filter((l) => l.includes(":") || l.includes(" — ") || l.includes(" - "));
    for (const line of lines.slice(0, 20)) {
      const m = line.match(/[-•*]?\s*([A-Z][\w\s'/\-]+?)\s*[-:—]\s*(.+)/);
      if (m && m[1].length < 40 && m[2].length > 5) {
        ko.vocabulary.push({ term: m[1].trim(), definition: m[2].trim() });
      }
    }
  }

  // Key facts — sentences containing strong factual signals.
  const factPatterns = [
    /\b\d{4}\b[^.!?]+[.!?]/g,                              // dates
    /\b(?:more than|less than|approximately|about)\s+\d+[^.!?]+[.!?]/gi,
    /\b\w+\s+(?:caused|led to|resulted in)\s+[^.!?]+[.!?]/gi,
    /\b(?:the [A-Z]\w+ \w+(?: of \w+)?)\s+(?:is|was|are)\s+[^.!?]+[.!?]/g,
  ];
  const factSet = new Set<string>();
  for (const rx of factPatterns) {
    const matches = mtpText.match(rx);
    if (matches) {
      for (const m of matches.slice(0, 4)) {
        if (m.length > 30 && m.length < 200) factSet.add(m.trim());
      }
    }
  }
  ko.keyFacts = Array.from(factSet).slice(0, 8);

  // Diagram ideas — phrases mentioning diagrams, charts, models, maps.
  const diagramRx = /\b(diagram|chart|table|model|timeline|flow[-\s]chart|labelled\s+diagram|cycle|map)[^.!?\n]{0,80}[.!?\n]/gi;
  const diagramMatches = mtpText.match(diagramRx);
  if (diagramMatches) {
    ko.diagramIdeas = Array.from(new Set(diagramMatches.map((m) => m.trim()))).slice(0, 5);
  }

  // Optional: people and dates for History units.
  const peopleRx = /\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g;
  const datesRx = /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b|\b\d{4}\s*[\u2013-]\s*\d{4}\b/gi;
  const people = Array.from(new Set((mtpText.match(peopleRx) || []).filter((p) => p.split(" ").length >= 2))).slice(0, 6);
  const dates = Array.from(new Set(mtpText.match(datesRx) || [])).slice(0, 6);
  if (people.length) ko.importantPeople = people;
  if (dates.length) ko.importantDates = dates;

  return ko;
}

export function knowledgeOrganiserHtml(args: { unitTitle: string; yearGroup: string; subject: string; ko: KOEntry }): string {
  const { unitTitle, yearGroup, subject, ko } = args;
  return `<style>
    .ko { font-family: Arial, sans-serif; padding: 12mm; max-width: 297mm; }
    .ko h1 { font-size: 18pt; margin: 0 0 2mm; color: #15803d; }
    .ko .meta { font-size: 10pt; color: #166534; margin-bottom: 5mm; }
    .ko .grid { display: grid; grid-template-columns: 2fr 1.4fr 1fr; gap: 4mm; }
    .ko .cell { border: 1.5px solid #86efac; border-radius: 3mm; padding: 3mm; background: #f0fdf4; page-break-inside: avoid; }
    .ko h2 { font-size: 11pt; color: #14532d; margin: 0 0 2mm; border-bottom: 1px solid #86efac; padding-bottom: 1mm; }
    .ko table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    .ko td { padding: 1.5mm; border-bottom: 1px solid #d1fae5; vertical-align: top; }
    .ko td.term { font-weight: 700; color: #166534; width: 32%; }
    .ko ul { margin: 0; padding-left: 4mm; font-size: 9pt; line-height: 1.5; }
  </style>
  <div class="ko">
    <h1>Knowledge Organiser \u2014 ${escapeHtml(unitTitle)}</h1>
    <div class="meta">${escapeHtml(subject)} \u00b7 ${escapeHtml(yearGroup)}</div>
    <div class="grid">
      <div class="cell">
        <h2>Key Vocabulary</h2>
        ${ko.vocabulary.length === 0
          ? "<p style='font-size:9pt;color:#475569;font-style:italic;'>No vocabulary extracted \u2014 check the MTP includes a 'Key Vocabulary' section.</p>"
          : `<table>${ko.vocabulary.map((v) => `<tr><td class="term">${escapeHtml(v.term)}</td><td>${escapeHtml(v.definition)}</td></tr>`).join("")}</table>`}
      </div>
      <div class="cell">
        <h2>Key Facts</h2>
        <ul>${ko.keyFacts.length ? ko.keyFacts.map((f) => `<li>${escapeHtml(f)}</li>`).join("") : "<li style='color:#94a3b8;'>None auto-detected</li>"}</ul>
        ${ko.importantDates && ko.importantDates.length ? `<h2 style="margin-top:3mm;">Dates</h2><ul>${ko.importantDates.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}</ul>` : ""}
      </div>
      <div class="cell">
        <h2>Diagrams to draw</h2>
        <ul>${ko.diagramIdeas.length ? ko.diagramIdeas.map((d) => `<li>${escapeHtml(d)}</li>`).join("") : "<li style='color:#94a3b8;'>None auto-detected</li>"}</ul>
        ${ko.importantPeople && ko.importantPeople.length ? `<h2 style="margin-top:3mm;">People</h2><ul>${ko.importantPeople.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>` : ""}
      </div>
    </div>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// ─── 3. Lesson-titles fast pass ────────────────────────────────────────────

export interface FastPassInputs {
  subject: string;
  yearGroup: string;
  topic: string;
  weeks: number;
  lessonsPerWeek: number;
  priorLearning?: string;
}

export interface FastPassResult {
  titles: { lessonNumber: number; week: number; title: string }[];
}

export async function generateLessonTitlesFastPass(args: FastPassInputs): Promise<FastPassResult> {
  const total = args.weeks * args.lessonsPerWeek;
  const system =
    "You are an outstanding UK teacher. Return ONLY a JSON object with a 'titles' array. Do not include any other prose. Lesson titles must be specific, sequential, and curriculum-appropriate.";
  const user = `Subject: ${args.subject}
Year group: ${args.yearGroup}
Topic: ${args.topic}
Total lessons: ${total} (${args.weeks} weeks x ${args.lessonsPerWeek} lessons/week)
${args.priorLearning ? `Prior learning: ${args.priorLearning}\n` : ""}
Return JSON: {"titles":[{"lessonNumber":1,"week":1,"title":"..."}]}`;
  const { text } = await callAI(system, user, 1500);
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const titles = Array.isArray(parsed?.titles) ? parsed.titles : [];
    return {
      titles: titles
        .filter((t: { lessonNumber?: number; week?: number; title?: string }) => typeof t?.title === "string")
        .slice(0, total)
        .map((t: { lessonNumber?: number; week?: number; title?: string }, i: number) => ({
          lessonNumber: typeof t.lessonNumber === "number" ? t.lessonNumber : i + 1,
          week: typeof t.week === "number" ? t.week : Math.floor(i / args.lessonsPerWeek) + 1,
          title: t.title!,
        })),
    };
  } catch {
    return { titles: [] };
  }
}

export function titlesAsPromptFragment(titles: FastPassResult["titles"]): string {
  if (titles.length === 0) return "";
  return [
    "EDITED LESSON TITLES (use these EXACTLY — do not paraphrase, do not change order):",
    ...titles.map((t) => `Lesson ${t.lessonNumber} (Week ${t.week}): ${t.title}`),
  ].join("\n");
}

// ─── 4. Tracking grid ──────────────────────────────────────────────────────

export interface TrackingGridInputs {
  pupils: { id: string; name: string }[];
  objectives: string[];                // e.g. ["LO1: ...", "LO2: ..."]
  unitTitle: string;
}

export function buildTrackingGridHtml(input: TrackingGridInputs): string {
  return `<style>
    .tg { font-family: Arial, sans-serif; padding: 10mm; }
    .tg h1 { font-size: 14pt; margin: 0 0 4mm; color: #1e3a8a; }
    .tg table { width: 100%; border-collapse: collapse; font-size: 9pt; page-break-inside: auto; }
    .tg th, .tg td { border: 1px solid #cbd5e1; padding: 3mm; }
    .tg th { background: #eef2ff; color: #312e81; text-align: left; font-size: 9pt; }
    .tg td.name { background: #f1f5f9; font-weight: 700; white-space: nowrap; }
    .tg td.tick { width: 4mm; text-align: center; height: 9mm; }
    .tg .legend { font-size: 8pt; color: #64748b; margin-top: 3mm; }
  </style>
  <div class="tg">
    <h1>Tracking grid \u2014 ${escapeHtml(input.unitTitle)}</h1>
    <table>
      <thead>
        <tr>
          <th style="width:38mm;">Pupil</th>
          ${input.objectives.map((o, i) => `<th>${i + 1}. ${escapeHtml(o.length > 40 ? o.slice(0, 38) + "\u2026" : o)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${input.pupils.map((p) => `<tr>
          <td class="name">${escapeHtml(p.name)}</td>
          ${input.objectives.map(() => `<td class="tick"></td>`).join("")}
        </tr>`).join("")}
      </tbody>
    </table>
    <div class="legend">Tick to indicate the pupil has met the objective. Use \u2713 = met, P = partially met, blank = not yet.</div>
  </div>`;
}

// ─── 5. Cross-curricular suggestions ──────────────────────────────────────

export interface CrossCurricularLink {
  subject: string;
  suggestion: string;
}

const SUBJECT_KEYWORDS: { subject: string; rx: RegExp }[] = [
  { subject: "Maths",       rx: /\b(maths?|mathematics|fractions?|number|measurement|graph|statistic|geometry)\b/i },
  { subject: "English",     rx: /\b(english|writing|literacy|reading|poetry|narrative|grammar|persuasiv)\b/i },
  { subject: "Science",     rx: /\b(science|biology|chemistry|physics|forces|electricity|cells?|atoms?|organism|evolution)\b/i },
  { subject: "History",     rx: /\b(history|historical|empire|chronolog|monarch|war\b|battle|civilisation)\b/i },
  { subject: "Geography",   rx: /\b(geograph|map|continent|climate|river|mountain|biome|country)\b/i },
  { subject: "Computing",   rx: /\b(computing|algorithm|programm|spreadsheet|database|coding)\b/i },
  { subject: "Art & Design",rx: /\b(art|design|sketch|colour|painting|sculpture)\b/i },
  { subject: "PSHE",        rx: /\b(pshe|wellbeing|emotion|relationship|health|safety|kindness|respect)\b/i },
  { subject: "RE",          rx: /\b(\bre\b|religion|christian|islam|hindu|jewish|buddhist|sikh|spiritual)\b/i },
  { subject: "Music",       rx: /\b(music|rhythm|melody|composer|instrument|notation)\b/i },
  { subject: "MFL",         rx: /\b(french|spanish|german|mandarin|language\s+lesson)\b/i },
];

/** Heuristic — propose cross-curricular links based on subject keywords found
 *  in the topic and unit overview. */
export function suggestCrossCurricularLinks(args: { topic: string; unitOverview: string; primarySubject: string }): CrossCurricularLink[] {
  const haystack = `${args.topic} ${args.unitOverview}`;
  const links: CrossCurricularLink[] = [];
  for (const { subject, rx } of SUBJECT_KEYWORDS) {
    if (subject === args.primarySubject) continue;
    if (rx.test(haystack)) {
      links.push({
        subject,
        suggestion: makeSuggestion(subject, args.topic),
      });
    }
  }
  // Always seed at least PSHE + writing if nothing else matched.
  if (links.length === 0) {
    links.push({ subject: "PSHE", suggestion: `Reflective discussion: how does "${args.topic}" affect our community?` });
    links.push({ subject: "English", suggestion: `Extended-writing piece linking ${args.topic} to a chosen narrative form.` });
  }
  return links.slice(0, 6);
}

function makeSuggestion(subject: string, topic: string): string {
  const TEMPLATES: Record<string, string> = {
    "Maths":       `Calculate quantities/percentages relevant to "${topic}" (data graphing slot).`,
    "English":     `Write a non-fiction recount or persuasive text rooted in "${topic}".`,
    "Science":     `Investigate the scientific principles underlying aspects of "${topic}".`,
    "History":     `Place the events in "${topic}" on a timeline alongside other periods studied.`,
    "Geography":   `Locate places relevant to "${topic}" on a map and explain their significance.`,
    "Computing":   `Use a spreadsheet or simple program to model "${topic}" data.`,
    "Art & Design":`Create a visual representation or sketchbook page on "${topic}".`,
    "PSHE":        `Discuss the values, ethics, or wellbeing implications raised by "${topic}".`,
    "RE":          `Compare how different worldviews respond to themes in "${topic}".`,
    "Music":       `Compose or appraise a piece of music inspired by "${topic}".`,
    "MFL":         `Translate or learn key vocabulary for "${topic}" in the target language.`,
  };
  return TEMPLATES[subject] || `Make a meaningful connection to "${topic}".`;
}

export function crossCurricularHtml(links: CrossCurricularLink[]): string {
  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;font-family:Arial,sans-serif;">
    ${links.map((l) => `<div style="border:1px solid #fdba74;border-radius:6px;padding:8px;background:#fff7ed;">
      <div style="font-weight:800;font-size:11px;color:#9a3412;">${escapeHtml(l.subject)}</div>
      <div style="font-size:11px;color:#475569;margin-top:3px;line-height:1.5;">${escapeHtml(l.suggestion)}</div>
    </div>`).join("")}
  </div>`;
}
