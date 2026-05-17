/**
 * lesson-planner-v2-enhancements.ts
 *
 * Five further improvements layered onto Lesson Planner, separate from
 * `lesson-planner-enhancements.ts` (which already ships: adaptive teaching
 * column from passports, retrieval starter, pacing widget, bundle export,
 * plan critique pass).
 *
 *  1. Visual 5-minute slot timeline — horizontal lesson-shape strip with
 *     minute markers and proportional phase blocks.
 *  2. Resources auto-extractor — scans the generated plan text and pulls a
 *     tick-list of resources mentioned anywhere in the document.
 *  3. Adaptive teaching matrix — fills a 4-row x 3-column matrix (VARK ×
 *     Support/Core/Stretch) by classifying each phase's differentiation note.
 *  4. TA / LSA briefing card — extracts pupil-facing scaffolds, pre-teach
 *     vocabulary, and seating recommendations into a one-pager.
 *  5. MTP back-reference — given the topic and yearGroup, finds a matching
 *     row in any locally-stored MTP and reports its lesson-of-unit position.
 */

// ─── 1. Timeline rendering ──────────────────────────────────────────────────

export interface TimelinePhase {
  name: string;
  mins: number;
}

export interface TimelineSlot {
  startMin: number;
  endMin: number;
  phaseName: string;
  colour: string;
}

const PHASE_COLOURS = [
  "#3b82f6", // blue — starter
  "#8b5cf6", // violet — main teach
  "#10b981", // emerald — guided
  "#f59e0b", // amber — independent
  "#ec4899", // pink — plenary
  "#6366f1", // indigo — extra
];

export function buildTimeline(phases: TimelinePhase[]): TimelineSlot[] {
  let cursor = 0;
  return phases.map((p, i) => {
    const slot: TimelineSlot = {
      startMin: cursor,
      endMin: cursor + p.mins,
      phaseName: p.name,
      colour: PHASE_COLOURS[i % PHASE_COLOURS.length],
    };
    cursor += p.mins;
    return slot;
  });
}

export function timelineHtml(slots: TimelineSlot[]): string {
  if (slots.length === 0) return "";
  const total = slots[slots.length - 1].endMin;
  const tickInterval = 5;
  const ticks: number[] = [];
  for (let m = 0; m <= total; m += tickInterval) ticks.push(m);
  return `
<div style="font-family:Arial,sans-serif;">
  <div style="position:relative;height:46px;background:#f1f5f9;border-radius:6px;border:1px solid #cbd5e1;overflow:hidden;">
    ${slots.map((s) => {
      const left = (s.startMin / total) * 100;
      const width = ((s.endMin - s.startMin) / total) * 100;
      return `<div title="${escapeHtml(s.phaseName)} — ${s.endMin - s.startMin} min" style="position:absolute;top:0;left:${left}%;width:${width}%;height:100%;background:${s.colour};border-right:1px solid #fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;text-shadow:0 1px 1px rgba(0,0,0,0.3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 4px;">
        ${escapeHtml(s.phaseName)} (${s.endMin - s.startMin}m)
      </div>`;
    }).join("")}
  </div>
  <div style="position:relative;height:14px;margin-top:2px;">
    ${ticks.map((m) => {
      const left = (m / total) * 100;
      return `<div style="position:absolute;left:${left}%;top:0;font-size:8px;color:#64748b;transform:translateX(-50%);">${m}'</div>`;
    }).join("")}
  </div>
</div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// ─── 2. Resources auto-extractor ───────────────────────────────────────────

const RESOURCE_PATTERNS: { label: string; rx: RegExp }[] = [
  { label: "Mini whiteboards",      rx: /\bmini[\s-]?whiteboards?\b/i },
  { label: "Worksheet",             rx: /\bworksheet(s)?\b/i },
  { label: "Tablets / iPads",       rx: /\b(tablets?|iPads?)\b/i },
  { label: "Manipulatives",         rx: /\bmanipulatives?\b/i },
  { label: "Number line",           rx: /\bnumber\s+line\b/i },
  { label: "Counters / cubes",      rx: /\bcounters?\b|\bcubes?\b/i },
  { label: "Dictionary / glossary", rx: /\bdictionar(y|ies)\b|\bglossar(y|ies)\b/i },
  { label: "Textbook",              rx: /\btext[-\s]?books?\b/i },
  { label: "Highlighters",          rx: /\bhighlighters?\b/i },
  { label: "Coloured pens",         rx: /\bcoloured\s+pens?\b/i },
  { label: "Sticky notes",          rx: /\b(sticky|post[-\s]?it)\s+notes?\b/i },
  { label: "Video clip",            rx: /\bvideo\s+clip\b|\byoutube\b|\bbbc\s+bitesize\b/i },
  { label: "Visualiser",            rx: /\bvisuali[sz]er\b/i },
  { label: "Smartboard / IWB",      rx: /\b(smart\s*board|iwb|interactive\s+whiteboard)\b/i },
  { label: "Lab equipment",         rx: /\b(beaker|test\s+tube|bunsen|tripod|gauze|goggles)\b/i },
  { label: "Calculator",            rx: /\bcalculators?\b/i },
  { label: "Ruler / protractor",    rx: /\b(rulers?|protractors?|set\s+squares?)\b/i },
  { label: "PE equipment",          rx: /\b(cones?|bibs?|footballs?|netballs?)\b/i },
  { label: "Art materials",         rx: /\b(paint|brushes?|clay|charcoal)\b/i },
  { label: "Maps / atlas",          rx: /\b(maps?|atlas(es)?|globe)\b/i },
  { label: "Glue / scissors",       rx: /\b(glue|scissors)\b/i },
  { label: "Headphones",            rx: /\bheadphones\b/i },
  { label: "Mini-whiteboards pens", rx: /\bdry[-\s]?wipe\s+pens?\b/i },
  { label: "Sentence stems sheet",  rx: /\bsentence\s+(stems?|frames?|starters?)\b/i },
  { label: "Word bank",             rx: /\bword\s+banks?\b/i },
];

export interface ExtractedResource {
  label: string;
  occurrences: number;
}

export function extractResources(text: string): ExtractedResource[] {
  const out: ExtractedResource[] = [];
  for (const { label, rx } of RESOURCE_PATTERNS) {
    const matches = text.match(new RegExp(rx.source, rx.flags + (rx.global ? "" : "g")));
    if (matches && matches.length > 0) {
      out.push({ label, occurrences: matches.length });
    }
  }
  return out.sort((a, b) => b.occurrences - a.occurrences);
}

// ─── 3. Adaptive teaching matrix ───────────────────────────────────────────

export type LearningModality = "Visual" | "Auditory" | "Kinaesthetic" | "Reading/Writing";
export type AttainmentTier = "Support" | "Core" | "Stretch";

export interface MatrixCell {
  modality: LearningModality;
  tier: AttainmentTier;
  suggestion: string;
}

const MODALITY_KEYWORDS: Record<LearningModality, RegExp> = {
  Visual:           /\b(visual|diagram|picture|image|video|colour|chart|model)\b/i,
  Auditory:         /\b(audio|verbal|spoken|listen|discussion|talk|read[-\s]aloud)\b/i,
  Kinaesthetic:     /\b(kinaesthetic|kinesthetic|hands[-\s]on|movement|manipulative|physical|act\s+out)\b/i,
  "Reading/Writing":/\b(read|write|note[-\s]taking|graphic\s+organiser|sentence\s+frame)\b/i,
};

const TIER_KEYWORDS: Record<AttainmentTier, RegExp> = {
  Support: /\b(support|scaffold|simplif|sentence\s+starters?|pre[-\s]teach|adult\s+support)\b/i,
  Core:    /\b(core|standard|main|all\s+pupils)\b/i,
  Stretch: /\b(stretch|extension|challenge|deeper|higher[-\s]order|gifted)\b/i,
};

const FALLBACK_MATRIX: Record<LearningModality, Record<AttainmentTier, string>> = {
  Visual: {
    Support: "Pre-prepared visual model with annotations the pupil completes",
    Core:    "Diagram exemplars on board, pupils replicate with key labels",
    Stretch: "Pupils design their own visual model and justify the design",
  },
  Auditory: {
    Support: "Read instructions aloud and check understanding individually",
    Core:    "Talk-partner discussion using sentence starters",
    Stretch: "Lead a small-group oral explanation to peers",
  },
  Kinaesthetic: {
    Support: "Use manipulatives or pre-cut cards to model the concept",
    Core:    "Move-and-match activity with peer discussion",
    Stretch: "Design a physical demo or movement-based teaching aid",
  },
  "Reading/Writing": {
    Support: "Cloze passage with word bank; sentence frame on desk",
    Core:    "Note-taking template with success-criteria checklist",
    Stretch: "Extended writing using disciplinary terminology unprompted",
  },
};

/** Build the matrix from a free-text differentiation paragraph. Falls back to
 *  curated suggestions for any cell that has no signal in the source. */
export function buildAdaptiveMatrix(differentiationText: string): MatrixCell[] {
  const cells: MatrixCell[] = [];
  const modalities: LearningModality[] = ["Visual", "Auditory", "Kinaesthetic", "Reading/Writing"];
  const tiers: AttainmentTier[] = ["Support", "Core", "Stretch"];

  // Split text into sentences for tier+modality matching.
  const sentences = differentiationText.split(/(?<=[.!?])\s+/);

  for (const modality of modalities) {
    for (const tier of tiers) {
      let suggestion = "";
      for (const sentence of sentences) {
        if (MODALITY_KEYWORDS[modality].test(sentence) && TIER_KEYWORDS[tier].test(sentence)) {
          suggestion = sentence.trim();
          break;
        }
      }
      cells.push({
        modality,
        tier,
        suggestion: suggestion || FALLBACK_MATRIX[modality][tier],
      });
    }
  }

  return cells;
}

export function matrixHtml(cells: MatrixCell[]): string {
  const tiers: AttainmentTier[] = ["Support", "Core", "Stretch"];
  const modalities: LearningModality[] = ["Visual", "Auditory", "Kinaesthetic", "Reading/Writing"];
  const tierColour: Record<AttainmentTier, string> = {
    Support: "#fef3c7",
    Core: "#dbeafe",
    Stretch: "#dcfce7",
  };

  const cellLookup = new Map<string, MatrixCell>();
  for (const c of cells) cellLookup.set(`${c.modality}|${c.tier}`, c);

  return `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:11px;">
    <thead>
      <tr>
        <th style="border:1px solid #cbd5e1;padding:6px;background:#f8fafc;text-align:left;">Modality \u00d7 Tier</th>
        ${tiers.map((t) => `<th style="border:1px solid #cbd5e1;padding:6px;background:${tierColour[t]};">${t}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${modalities.map((m) => `
        <tr>
          <td style="border:1px solid #cbd5e1;padding:6px;font-weight:700;background:#f1f5f9;">${m}</td>
          ${tiers.map((t) => {
            const cell = cellLookup.get(`${m}|${t}`);
            return `<td style="border:1px solid #cbd5e1;padding:6px;vertical-align:top;background:${tierColour[t]}80;">${escapeHtml(cell?.suggestion || "")}</td>`;
          }).join("")}
        </tr>
      `).join("")}
    </tbody>
  </table>`;
}

// ─── 4. TA / LSA briefing card ─────────────────────────────────────────────

export interface TaBriefing {
  pupilFocus: string[];          // pupils + needs (free text the teacher enters)
  keyVocabPreTeach: string[];    // extracted vocab terms
  scaffoldsAvailable: string[];  // sentence frames, word banks, visuals
  seatingRecommendation: string; // e.g. "Sit B near front by teacher"
  duringStarter: string;
  duringMain: string;
  duringPlenary: string;
}

/** Pull pieces of the lesson plan into a TA-facing summary. */
export function buildTaBriefing(args: {
  vocab: { term: string; definition: string }[];
  phases: { name: string; teacherSteps: string[]; pupilSteps: string[]; differentiation: string }[];
  sendAdaptations: string;
  pupilFocus?: string;
  seatingNote?: string;
}): TaBriefing {
  const phaseByKey = (key: string) =>
    args.phases.find((p) => p.name.toLowerCase().includes(key));
  const starter  = phaseByKey("starter") || phaseByKey("hook");
  const plenary  = phaseByKey("plenary");
  const main     = phaseByKey("main") || phaseByKey("teach");

  // Collect scaffolds mentioned anywhere in the plan.
  const allText = [args.sendAdaptations, ...args.phases.map((p) => p.differentiation)].join(" ");
  const scaffolds: string[] = [];
  if (/sentence\s+(stems?|frames?|starters?)/i.test(allText)) scaffolds.push("Sentence stems sheet");
  if (/word\s+banks?/i.test(allText)) scaffolds.push("Word bank with images");
  if (/visual(s|\s+aids?)?/i.test(allText)) scaffolds.push("Visual aids / pictogram");
  if (/manipulatives?/i.test(allText)) scaffolds.push("Manipulatives / counters");
  if (/checklist|success\s+criteria/i.test(allText)) scaffolds.push("Success-criteria checklist");
  if (/cloze/i.test(allText)) scaffolds.push("Cloze passage");

  return {
    pupilFocus: (args.pupilFocus || "")
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean),
    keyVocabPreTeach: args.vocab.slice(0, 5).map((v) => `${v.term}: ${v.definition}`),
    scaffoldsAvailable: scaffolds.length > 0 ? scaffolds : ["No specific scaffolds named — TA to ask the teacher"],
    seatingRecommendation: args.seatingNote ||
      "Sit focus pupils within line of sight of the teacher; TA to circulate during independent practice.",
    duringStarter: starter ? `Help focus pupils enter the room and access the starter task: ${starter.pupilSteps[0] || ""}` : "Greet pupils and settle them.",
    duringMain:    main ? `Sit alongside named pupils during teacher input. Reduce demand if they show signs of overwhelm.` : "Support pupils during the main teaching block.",
    duringPlenary: plenary ? `Help pupils complete the plenary task: ${plenary.pupilSteps[0] || ""}. Note any pupils who could not complete.` : "Help pupils pack away and exit calmly.",
  };
}

export function taBriefingHtml(b: TaBriefing, lessonTitle: string): string {
  return `<style>
    .ta-card { font-family: Arial, sans-serif; padding: 14mm; max-width: 210mm; }
    .ta-card h1 { font-size: 16pt; margin: 0 0 4mm; color: #1e3a8a; }
    .ta-card h2 { font-size: 11pt; margin: 6mm 0 2mm; color: #1e40af; border-bottom: 1px solid #93c5fd; padding-bottom: 1mm; }
    .ta-card .row { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
    .ta-card .cell { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 3mm; padding: 3mm; page-break-inside: avoid; }
    .ta-card ul { margin: 1mm 0; padding-left: 4mm; font-size: 10pt; line-height: 1.5; }
    .ta-card .during { background: #fef3c7; padding: 3mm; border-radius: 3mm; margin-top: 2mm; font-size: 10pt; }
    .ta-card .during strong { color: #92400e; }
  </style>
  <div class="ta-card">
    <h1>TA / LSA briefing — ${escapeHtml(lessonTitle)}</h1>
    <div class="row">
      <div class="cell">
        <h2 style="margin-top:0;">Pupils to focus on</h2>
        <ul>${b.pupilFocus.length ? b.pupilFocus.map((p) => `<li>${escapeHtml(p)}</li>`).join("") : "<li>(teacher to confirm)</li>"}</ul>
      </div>
      <div class="cell">
        <h2 style="margin-top:0;">Pre-teach vocabulary</h2>
        <ul>${b.keyVocabPreTeach.map((v) => `<li>${escapeHtml(v)}</li>`).join("")}</ul>
      </div>
      <div class="cell">
        <h2 style="margin-top:0;">Scaffolds available</h2>
        <ul>${b.scaffoldsAvailable.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
      </div>
      <div class="cell">
        <h2 style="margin-top:0;">Seating</h2>
        <p style="font-size:10pt;margin:1mm 0;">${escapeHtml(b.seatingRecommendation)}</p>
      </div>
    </div>
    <h2>What you do during the lesson</h2>
    <div class="during"><strong>Starter:</strong> ${escapeHtml(b.duringStarter)}</div>
    <div class="during"><strong>Main:</strong> ${escapeHtml(b.duringMain)}</div>
    <div class="during"><strong>Plenary:</strong> ${escapeHtml(b.duringPlenary)}</div>
  </div>`;
}

// ─── 5. MTP back-reference ─────────────────────────────────────────────────

export interface MtpReference {
  unitTitle: string;
  termTag: string;
  lessonNumber: number;          // 1-indexed within the unit
  totalLessons: number;
  date?: string;                 // YYYY-MM-DD if scheduled
}

const MTP_KEY = "adaptly_mtp_v1";

interface StoredMtpRow { topic: string; date?: string; weekNumber?: number; }
interface StoredMtp {
  title: string;
  termTag: string;
  yearGroup: string;
  subject: string;
  rows: StoredMtpRow[];
}

/** Find an MTP row that matches the given lesson's topic + year group. */
export function findMtpReference(args: { topic: string; yearGroup: string; subject?: string }): MtpReference | null {
  try {
    const all = JSON.parse(localStorage.getItem(MTP_KEY) || "[]") as StoredMtp[];
    const tokens = args.topic.toLowerCase().split(/\W+/).filter((t) => t.length > 3);
    for (const mtp of all) {
      if (mtp.yearGroup !== args.yearGroup) continue;
      if (args.subject && mtp.subject && mtp.subject !== args.subject) continue;
      for (let i = 0; i < mtp.rows.length; i++) {
        const rowText = mtp.rows[i].topic.toLowerCase();
        const matches = tokens.filter((t) => rowText.includes(t));
        if (matches.length >= Math.max(1, Math.ceil(tokens.length / 3))) {
          return {
            unitTitle: mtp.title,
            termTag: mtp.termTag,
            lessonNumber: i + 1,
            totalLessons: mtp.rows.length,
            date: mtp.rows[i].date,
          };
        }
      }
    }
  } catch { /* swallow */ }
  return null;
}

export function mtpReferenceBadgeHtml(ref: MtpReference): string {
  return `<div style="display:inline-flex;align-items:center;gap:6px;background:#eef2ff;border:1px solid #c7d2fe;color:#3730a3;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;font-family:Arial,sans-serif;">
    <span style="background:#6366f1;color:#fff;border-radius:999px;padding:1px 6px;font-size:10px;">L${ref.lessonNumber}/${ref.totalLessons}</span>
    <span>${escapeHtml(ref.unitTitle)} \u2014 ${escapeHtml(ref.termTag)}${ref.date ? " \u2014 " + escapeHtml(ref.date) : ""}</span>
  </div>`;
}
