/**
 * mtp-v2-enhancements.ts
 *
 * Second-wave improvements layered on top of the original `mtp-enhancements.ts`
 * (which already ships backwards-from-assessment, NC heatmap, retrieval link
 * insertion, change feed/clashes, and the bridge to Lesson Planner).
 *
 * Five new pure-function improvements:
 *
 *  1. Prior / next learning bridge — surface the unit that comes before and
 *     after this MTP across the year-group sequence (looks at saved MTPs).
 *  2. Knowledge organiser spinoff — generate a 1-page knowledge organiser
 *     (vocabulary, key facts, diagram slot, sticky questions) from MTP text.
 *  3. Lesson-titles fast pass — produce a titles-only outline of every
 *     lesson in the unit so the unit can be talked through in 30 seconds.
 *  4. Tracking grid — pupils × objectives RAG grid, persisted locally for
 *     gap-analysis at unit close.
 *  5. Cross-curricular suggestions — given the MTP topic, propose 4–6
 *     cross-subject links with a concrete activity hook each.
 */

import { callAI } from "@/lib/ai";

// ─── Shared helpers ────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

const TERM_ORDER = [
  "Autumn 1", "Autumn 2",
  "Spring 1", "Spring 2",
  "Summer 1", "Summer 2",
];

function termRank(t?: string): number {
  if (!t) return 0;
  const idx = TERM_ORDER.indexOf(t);
  return idx >= 0 ? idx : 0;
}

const MTP_KEY = "adaptly_mtp_v1";

interface MtpRowLite {
  id?: string;
  weekNumber?: number;
  topic: string;
  date?: string;
}
interface MtpLite {
  id?: string;
  title?: string;
  yearGroup?: string;
  subject?: string;
  termTag?: string;
  rows?: MtpRowLite[];
}

function loadMtps(): MtpLite[] {
  try {
    const all = JSON.parse(localStorage.getItem(MTP_KEY) || "[]");
    return Array.isArray(all) ? all : [];
  } catch { return []; }
}

// ─── 1. Prior / next learning bridge ───────────────────────────────────────

export interface BridgeUnit {
  mtpId?: string;
  title: string;
  termTag?: string;
  yearGroup?: string;
  topics: string[];          // first 3 row topics, used as "highlights"
}

export interface LearningBridge {
  current: BridgeUnit;
  prior?: BridgeUnit;
  next?: BridgeUnit;
}

/**
 * Build a prior/current/next bridge by ordering the saved MTPs for the same
 * subject + year-group by termTag.
 */
export function buildLearningBridge(args: {
  subject?: string;
  yearGroup?: string;
  termTag?: string;
  currentTitle: string;
  currentTopics: string[];
}): LearningBridge {
  const all = loadMtps()
    .filter((m) => (!args.subject || m.subject?.toLowerCase() === args.subject?.toLowerCase()))
    .filter((m) => (!args.yearGroup || m.yearGroup?.toLowerCase() === args.yearGroup?.toLowerCase()))
    .filter((m) => m.termTag)
    .sort((a, b) => termRank(a.termTag) - termRank(b.termTag));

  const idx = args.termTag ? all.findIndex((m) => m.termTag === args.termTag) : -1;
  const summarise = (m: MtpLite): BridgeUnit => ({
    mtpId: m.id,
    title: m.title || `${m.subject || ""} ${m.yearGroup || ""}`.trim() || "Unit",
    termTag: m.termTag,
    yearGroup: m.yearGroup,
    topics: (m.rows || []).slice(0, 3).map((r) => r.topic).filter(Boolean) as string[],
  });

  const current: BridgeUnit = {
    title: args.currentTitle || "This unit",
    termTag: args.termTag,
    yearGroup: args.yearGroup,
    topics: args.currentTopics.slice(0, 3),
  };

  let prior: BridgeUnit | undefined;
  let next: BridgeUnit | undefined;
  if (idx > 0) prior = summarise(all[idx - 1]);
  if (idx >= 0 && idx < all.length - 1) next = summarise(all[idx + 1]);
  // If no exact match (current MTP not yet saved), pick by term ordering
  if (idx === -1 && args.termTag) {
    const beforeAll = all.filter((m) => termRank(m.termTag) < termRank(args.termTag));
    const afterAll = all.filter((m) => termRank(m.termTag) > termRank(args.termTag));
    if (beforeAll.length > 0) prior = summarise(beforeAll[beforeAll.length - 1]);
    if (afterAll.length > 0) next = summarise(afterAll[0]);
  }

  return { current, prior, next };
}

export function bridgeHtml(bridge: LearningBridge): string {
  const cell = (label: string, unit: BridgeUnit | undefined, colour: string) => {
    if (!unit) return `<div style="flex:1;border:1.5px dashed #cbd5e1;border-radius:3mm;padding:4mm;background:#f8fafc;">
      <h3 style="font-size:11pt;color:#64748b;margin:0 0 2mm;">${label}</h3>
      <p style="font-size:10pt;color:#64748b;margin:0;font-style:italic;">No unit on file yet.</p>
    </div>`;
    return `<div style="flex:1;border:1.5px solid ${colour};border-radius:3mm;padding:4mm;background:#fff;">
      <h3 style="font-size:11pt;color:${colour};margin:0 0 2mm;">${label}</h3>
      <p style="font-size:11pt;font-weight:700;margin:0 0 1mm;color:#1f2937;">${escapeHtml(unit.title)}</p>
      <p style="font-size:9pt;color:#64748b;margin:0 0 2mm;">${escapeHtml(unit.termTag || "")}</p>
      <ul style="margin:0;padding-left:5mm;font-size:9.5pt;line-height:1.4;color:#1f2937;">
        ${unit.topics.map((t) => `<li>${escapeHtml(t)}</li>`).join("") || "<li style='color:#94a3b8;font-style:italic;'>(no topics yet)</li>"}
      </ul>
    </div>`;
  };
  return `<div style="font-family:Arial,sans-serif;padding:8mm;max-width:280mm;">
    <h2 style="font-size:13pt;color:#15803d;margin:0 0 4mm;">Prior → Current → Next learning</h2>
    <div style="display:flex;gap:4mm;">
      ${cell("Prior unit",   bridge.prior,   "#0891b2")}
      ${cell("Current unit", bridge.current, "#15803d")}
      ${cell("Next unit",    bridge.next,    "#7c3aed")}
    </div>
  </div>`;
}

// ─── 2. Knowledge organiser spinoff ────────────────────────────────────────

export interface KnowledgeOrganiser {
  unitTitle: string;
  yearGroup: string;
  vocabulary: { term: string; definition: string }[];
  keyFacts: string[];
  stickyQuestions: string[];
  diagramHint?: string;
}

/**
 * Build a knowledge organiser from MTP text (no AI dependency by default —
 * extracts vocab + key statements). The extracted version is fast and
 * deterministic; teachers can edit afterwards.
 */
export function deriveKnowledgeOrganiser(args: {
  unitTitle: string;
  yearGroup: string;
  mtpText: string;
}): KnowledgeOrganiser {
  const text = args.mtpText || "";
  const vocab = extractVocab(text, 10);
  const facts = extractKeyFacts(text, 8);
  const stickies = extractStickyQuestions(text, 5);
  return {
    unitTitle: args.unitTitle,
    yearGroup: args.yearGroup,
    vocabulary: vocab,
    keyFacts: facts,
    stickyQuestions: stickies,
    diagramHint: detectDiagramHint(text),
  };
}

function extractVocab(text: string, max: number): { term: string; definition: string }[] {
  // Try to read the "Key vocabulary" block if present
  const out: { term: string; definition: string }[] = [];
  const block = text.match(/Key\s+(?:vocabulary|vocab)[:\s]*([\s\S]+?)(?:\n\s*\*\*|\n\s*##|\n\n\n|$)/i);
  if (block && block[1]) {
    const lines = block[1].split(/\n+/).map((l) => l.trim()).filter(Boolean);
    for (const l of lines) {
      const m = l.replace(/^[\-•*\d.)\s]+/, "").match(/^([A-Za-z][\w\s\-]*?)\s*[:\-–]\s*(.+)$/);
      if (m && m[1] && m[2]) {
        out.push({ term: m[1].trim(), definition: m[2].trim() });
        if (out.length >= max) return out;
      }
    }
  }
  // Fallback — capitalised words appearing 2+ times outside common stop-list
  if (out.length === 0) {
    const counts = new Map<string, number>();
    const matches = text.match(/\b[A-Z][a-z]{4,}\b/g) || [];
    for (const w of matches) counts.set(w, (counts.get(w) || 0) + 1);
    Array.from(counts.entries())
      .filter(([w, c]) => c >= 2 && !/^(?:Lesson|Week|Year|Term|Pupils?|Teacher|Resources?|Assessment|Plenary|Starter|Main|Topic|Subject|Activity|Differentiation|Objectives?|Outcome|Outcomes?)$/.test(w))
      .sort((a, b) => b[1] - a[1])
      .slice(0, max)
      .forEach(([w]) => out.push({ term: w, definition: "(define here)" }));
  }
  return out;
}

function extractKeyFacts(text: string, max: number): string[] {
  // Pick sentences containing measurable / factual cues.
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 18 && s.length < 220);
  const cues = /(\d{2,4}|\b(?:always|never|because|caused|results?\s+in|equals?|approximately)\b)/i;
  const facts: string[] = [];
  for (const s of sentences) {
    if (cues.test(s) && !/learning\s+objective|success\s+criteria|differentiation/i.test(s)) {
      facts.push(s.replace(/^[\-•*\d.)\s]+/, ""));
      if (facts.length >= max) break;
    }
  }
  return facts;
}

function extractStickyQuestions(text: string, max: number): string[] {
  const out: string[] = [];
  const matches = text.match(/[A-Z][^?.!]{12,180}\?/g) || [];
  for (const m of matches) {
    out.push(m.trim());
    if (out.length >= max) break;
  }
  // Templated fallback — synthesise from the unit title
  if (out.length === 0) {
    const title = (text.match(/Topic\s*[:\-]\s*([^\n]+)/i)?.[1] || "this topic").trim();
    out.push(`What is the most important idea in ${title}?`);
    out.push(`How does ${title} link to what we learned before?`);
    out.push(`Where would we see ${title} in real life?`);
  }
  return out.slice(0, max);
}

function detectDiagramHint(text: string): string | undefined {
  if (/diagram|cycle|map|chart|graph|table/i.test(text)) {
    const m = text.match(/(diagram|cycle|map|chart|graph|table)\s+of\s+[^.!?\n]+/i);
    return m ? m[0].slice(0, 90) : "Add a diagram for this unit's central idea.";
  }
  return undefined;
}

export function knowledgeOrganiserHtml(ko: KnowledgeOrganiser): string {
  return `<div style="font-family:Arial,sans-serif;padding:10mm;max-width:297mm;">
    <h1 style="font-size:18pt;color:#15803d;margin:0 0 2mm;">${escapeHtml(ko.unitTitle)} <span style="font-weight:400;font-size:12pt;color:#15803d;">(${escapeHtml(ko.yearGroup)})</span></h1>
    <p style="font-size:9pt;color:#64748b;margin:0 0 4mm;">Knowledge organiser — print A3 landscape, fold for pupil books.</p>
    <div style="display:grid;grid-template-columns:1.2fr 1fr 0.9fr;gap:4mm;">
      <div style="border:1.5px solid #15803d;border-radius:3mm;padding:3mm;background:#f0fdf4;">
        <h2 style="font-size:11pt;color:#166534;margin:0 0 2mm;">Vocabulary</h2>
        <ul style="margin:0;padding-left:4mm;font-size:9.5pt;line-height:1.45;">
          ${ko.vocabulary.map((v) => `<li><strong>${escapeHtml(v.term)}</strong> — ${escapeHtml(v.definition)}</li>`).join("")}
        </ul>
      </div>
      <div style="border:1.5px solid #1d4ed8;border-radius:3mm;padding:3mm;background:#eff6ff;">
        <h2 style="font-size:11pt;color:#1e40af;margin:0 0 2mm;">Key facts</h2>
        <ol style="margin:0;padding-left:5mm;font-size:9.5pt;line-height:1.45;">
          ${ko.keyFacts.map((f) => `<li>${escapeHtml(f)}</li>`).join("") || "<li style='color:#94a3b8;font-style:italic;'>(none extracted — add manually)</li>"}
        </ol>
      </div>
      <div style="border:1.5px solid #b45309;border-radius:3mm;padding:3mm;background:#fffbeb;">
        <h2 style="font-size:11pt;color:#9a3412;margin:0 0 2mm;">Sticky questions</h2>
        <ul style="margin:0;padding-left:4mm;font-size:9.5pt;line-height:1.45;">
          ${ko.stickyQuestions.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}
        </ul>
        ${ko.diagramHint ? `<p style="margin:3mm 0 0;padding-top:2mm;border-top:1px dashed #fbbf24;font-size:9pt;color:#9a3412;"><strong>Diagram slot:</strong> ${escapeHtml(ko.diagramHint)}</p>` : ""}
      </div>
    </div>
  </div>`;
}

// ─── 3. Lesson-titles fast pass ────────────────────────────────────────────

export interface LessonTitle {
  weekNumber: number;
  lessonInWeek: number;
  title: string;
}

/**
 * Pull a lesson-title outline from the MTP body. Looks for "**[Lesson N
 * (Week W, Lesson L): Title]**" markers as written by the existing
 * MediumTermPlanner buildPrompt.
 */
export function extractLessonTitles(mtpText: string): LessonTitle[] {
  const out: LessonTitle[] = [];
  if (!mtpText) return out;
  const rx = /\*\*\s*\[?\s*Lesson\s+(\d+)\s*\(?\s*Week\s+(\d+),?\s*Lesson\s+(\d+)[^)]*\)?\s*[:\-–]\s*([^\]\n*]+?)\s*\]?\s*\*\*/gi;
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = rx.exec(mtpText)) !== null) {
    out.push({
      weekNumber: parseInt(m[2], 10),
      lessonInWeek: parseInt(m[3], 10),
      title: m[4].trim().replace(/\*+/g, ""),
    });
  }
  return out;
}

export function lessonTitlesHtml(titles: LessonTitle[], unitTitle: string): string {
  if (titles.length === 0) {
    return `<p style="font-family:Arial,sans-serif;font-size:10pt;color:#64748b;font-style:italic;">No lesson titles detected — generate the medium-term plan first.</p>`;
  }
  const grouped = new Map<number, LessonTitle[]>();
  for (const t of titles) {
    const arr = grouped.get(t.weekNumber) || [];
    arr.push(t);
    grouped.set(t.weekNumber, arr);
  }
  const weeks = Array.from(grouped.keys()).sort((a, b) => a - b);
  return `<div style="font-family:Arial,sans-serif;padding:8mm;max-width:210mm;">
    <h2 style="font-size:14pt;color:#15803d;margin:0 0 3mm;">Lesson titles — ${escapeHtml(unitTitle)}</h2>
    <p style="font-size:9.5pt;color:#64748b;margin:0 0 4mm;">A 30-second talk-through of the unit. Read down, not across.</p>
    ${weeks.map((wk) => `<div style="margin-bottom:3mm;">
      <strong style="color:#0f766e;font-size:11pt;">Week ${wk}</strong>
      <ol style="margin:1mm 0 0 5mm;padding:0;font-size:10pt;line-height:1.5;">
        ${grouped.get(wk)!.map((t) => `<li>${escapeHtml(t.title)}</li>`).join("")}
      </ol>
    </div>`).join("")}
  </div>`;
}

// ─── 4. Tracking grid (pupils × objectives) ────────────────────────────────

export type RagStatus = "" | "R" | "A" | "G";

export interface TrackingCell {
  pupilId: string;
  objective: string;
  status: RagStatus;
  updatedAt: number;
}

export interface TrackingGridState {
  mtpId: string;
  pupils: { id: string; name: string }[];
  objectives: string[];
  cells: TrackingCell[];
}

const TRACKING_KEY = "adaptly_mtp_tracking_v1";

export function loadTracking(mtpId: string): TrackingGridState | null {
  try {
    const all = JSON.parse(localStorage.getItem(TRACKING_KEY) || "{}") as Record<string, TrackingGridState>;
    return all[mtpId] || null;
  } catch { return null; }
}

export function initTracking(args: {
  mtpId: string;
  pupils: { id: string; name: string }[];
  objectives: string[];
}): TrackingGridState {
  const state: TrackingGridState = {
    mtpId: args.mtpId,
    pupils: args.pupils,
    objectives: args.objectives,
    cells: [],
  };
  saveTracking(state);
  return state;
}

export function saveTracking(state: TrackingGridState): void {
  try {
    const all = JSON.parse(localStorage.getItem(TRACKING_KEY) || "{}") as Record<string, TrackingGridState>;
    all[state.mtpId] = state;
    localStorage.setItem(TRACKING_KEY, JSON.stringify(all));
  } catch {}
}

export function setTrackingCell(state: TrackingGridState, pupilId: string, objective: string, status: RagStatus): TrackingGridState {
  const next: TrackingGridState = {
    ...state,
    cells: state.cells.filter((c) => !(c.pupilId === pupilId && c.objective === objective)),
  };
  if (status) {
    next.cells.push({ pupilId, objective, status, updatedAt: Date.now() });
  }
  saveTracking(next);
  return next;
}

export interface TrackingSummary {
  totalCells: number;
  red: number;
  amber: number;
  green: number;
  pupilsWithGap: { pupilId: string; pupilName: string; gapObjectives: string[] }[];
}

export function summariseTracking(state: TrackingGridState): TrackingSummary {
  let red = 0, amber = 0, green = 0;
  for (const c of state.cells) {
    if (c.status === "R") red += 1;
    else if (c.status === "A") amber += 1;
    else if (c.status === "G") green += 1;
  }
  const gaps: TrackingSummary["pupilsWithGap"] = [];
  for (const p of state.pupils) {
    const reds = state.cells.filter((c) => c.pupilId === p.id && c.status === "R").map((c) => c.objective);
    if (reds.length > 0) gaps.push({ pupilId: p.id, pupilName: p.name, gapObjectives: reds });
  }
  return {
    totalCells: state.pupils.length * state.objectives.length,
    red, amber, green,
    pupilsWithGap: gaps,
  };
}

// ─── 5. Cross-curricular suggestions ───────────────────────────────────────

export interface CrossCurricularLink {
  subject: string;
  hook: string;          // 12–24 word activity hook
}

const CROSS_LIBRARY: Record<string, Array<{ subject: string; hook: string }>> = {
  default: [
    { subject: "English",   hook: "Write a short explanation paragraph using subject-specific vocabulary, with a peer edit pass." },
    { subject: "Maths",     hook: "Pose a single 'how many?' question that uses real data from the topic." },
    { subject: "PSHE",      hook: "Discuss what choices a person in this topic faces, and why they matter." },
    { subject: "Computing", hook: "Sketch a flowchart of the key process or sequence in this topic." },
    { subject: "Art",       hook: "Create a labelled visual representation of the main idea, A4 size." },
    { subject: "Geography", hook: "Map where this topic happens / happened — show climate or population links." },
  ],
};

const CROSS_TOPIC_HINTS: Array<{ rx: RegExp; extras: CrossCurricularLink[] }> = [
  { rx: /water\s+cycle|rainfall|river/i, extras: [
    { subject: "Geography", hook: "Annotate a UK river map showing where the water cycle is most visible." },
    { subject: "Science",   hook: "Demonstrate evaporation with a kettle and condensation on cold metal." },
  ]},
  { rx: /world\s+war|war|battle/i, extras: [
    { subject: "RE",        hook: "Discuss conscientious objectors — why do some refuse to fight on faith grounds?" },
    { subject: "English",   hook: "Read & analyse a war poem (e.g. Owen) for figurative language." },
  ]},
  { rx: /fraction|decimal|percent/i, extras: [
    { subject: "PE",        hook: "Calculate fraction of pupils choosing each warm-up activity, then plot." },
    { subject: "Cooking / DT", hook: "Halve and quarter a recipe — use measuring jugs to check fractions." },
  ]},
  { rx: /romans?|egypt|ancient/i, extras: [
    { subject: "Latin / English roots", hook: "Find five English words descended from Latin/Greek; map the change." },
    { subject: "Art",       hook: "Sketch a frieze or mosaic in the period style with pencil + pastel." },
  ]},
  { rx: /electric|circuit|magnet/i, extras: [
    { subject: "DT",        hook: "Build a working circuit with a switch and bulb on stripboard." },
    { subject: "Computing", hook: "Simulate a logic gate on a microbit — light an LED on AND-condition." },
  ]},
];

/**
 * Produce 4–6 cross-curricular suggestions. Combines a topic-keyword library
 * with the default rotation. Pure-function — no AI required.
 */
export function suggestCrossCurricular(topic: string, max = 6): CrossCurricularLink[] {
  const out: CrossCurricularLink[] = [];
  for (const rule of CROSS_TOPIC_HINTS) {
    if (rule.rx.test(topic)) {
      out.push(...rule.extras);
      if (out.length >= max) break;
    }
  }
  for (const def of CROSS_LIBRARY.default) {
    if (out.length >= max) break;
    if (!out.find((o) => o.subject === def.subject)) out.push(def);
  }
  return out.slice(0, max);
}

/**
 * Optional AI-augmented cross-curricular pass — if the teacher wants more
 * specific hooks, this calls the model. Falls back to the deterministic
 * library on failure.
 */
export async function aiCrossCurricular(args: {
  topic: string;
  yearGroup: string;
  subject: string;
}): Promise<CrossCurricularLink[]> {
  const system = "You are a UK curriculum designer. Suggest cross-curricular links — short, concrete, classroom-ready. Return strict JSON.";
  const user = `Topic: ${args.topic}
Year group: ${args.yearGroup}
Lead subject: ${args.subject}

Return JSON exactly:
{"links":[{"subject":"English","hook":"12-24 word activity hook"}, ... 4-6 entries ... ]}`;
  try {
    const { text } = await callAI(system, user, 600);
    const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const obj = JSON.parse(cleaned);
    if (Array.isArray(obj.links)) {
      return obj.links
        .filter((l: any) => l && typeof l.subject === "string" && typeof l.hook === "string")
        .slice(0, 6);
    }
  } catch {}
  return suggestCrossCurricular(args.topic, 6);
}

export function crossCurricularHtml(links: CrossCurricularLink[], topic: string): string {
  return `<div style="font-family:Arial,sans-serif;padding:8mm;max-width:210mm;">
    <h2 style="font-size:13pt;color:#7c3aed;margin:0 0 3mm;">Cross-curricular hooks — ${escapeHtml(topic)}</h2>
    <ul style="margin:0;padding-left:5mm;font-size:10pt;line-height:1.55;">
      ${links.map((l) => `<li style="margin-bottom:2mm;"><strong style="color:#6d28d9;">${escapeHtml(l.subject)}:</strong> ${escapeHtml(l.hook)}</li>`).join("")}
    </ul>
  </div>`;
}
