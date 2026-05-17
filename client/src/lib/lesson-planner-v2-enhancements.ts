/**
 * lesson-planner-v2-enhancements.ts
 *
 * Second-wave improvements layered on top of the original
 * `lesson-planner-enhancements.ts` (which already ships adaptive teaching
 * COLUMN, retrieval starter, pacing widget, bundle manifest, plan critique).
 *
 * Five new pure-function improvements:
 *
 *  1. 5-minute slot timeline — slice the lesson plan into 5-min granular
 *     micro-slots so a supply teacher can pace minute-by-minute.
 *  2. Resources auto-list — parse the plan text and surface a deduplicated
 *     resources checklist (with print-ready HTML).
 *  3. Adaptive teaching matrix — 2D printable grid mapping SEND profiles
 *     against strategy columns (Inputs / Tasks / Outputs / Environment).
 *  4. TA brief — one-page A4 support-staff card distilling the lesson to
 *     "what to say, what to watch, what to scaffold".
 *  5. MTP back-reference — locate the MTP unit / week the current topic
 *     belongs to (from existing `adaptly_mtp_v1` storage) and produce a
 *     back-link payload for the UI to jump to.
 */

// ─── Shared helpers ────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// ─── 1. 5-minute slot timeline ─────────────────────────────────────────────

export interface PlanPhaseInput {
  name: string;
  mins: number;
  teacherSteps: string[];
  pupilSteps: string[];
  differentiation?: string;
}

export interface FiveMinSlot {
  slotIndex: number;       // 1..N
  startMin: number;        // 0, 5, 10…
  endMin: number;          // 5, 10, 15…
  phaseName: string;
  activity: string;        // teacher step at this slot
  pupilDoing: string;      // pupil step at this slot
}

/**
 * Convert a list of phases into a flat 5-minute slot timeline. A phase that
 * lasts e.g. 17 minutes becomes 4 slots (3 × 5min + 1 × 2min trailing,
 * collapsed back into the 4th 5-min slot).
 */
export function buildFiveMinTimeline(phases: PlanPhaseInput[]): FiveMinSlot[] {
  const slots: FiveMinSlot[] = [];
  let cursor = 0;
  let slotIndex = 0;
  for (const phase of phases) {
    if (!phase || !phase.mins || phase.mins <= 0) continue;
    const slotsInPhase = Math.max(1, Math.round(phase.mins / 5));
    const teacher = phase.teacherSteps || [];
    const pupil = phase.pupilSteps || [];
    for (let i = 0; i < slotsInPhase; i++) {
      slotIndex += 1;
      const startMin = cursor;
      const endMin = startMin + (i === slotsInPhase - 1 ? Math.max(5, phase.mins - i * 5) : 5);
      cursor = endMin;
      const tStep = teacher.length > 0 ? teacher[i % teacher.length] : `Continue ${phase.name}`;
      const pStep = pupil.length > 0 ? pupil[i % pupil.length] : `Engaged in ${phase.name}`;
      slots.push({
        slotIndex,
        startMin,
        endMin,
        phaseName: phase.name,
        activity: tStep,
        pupilDoing: pStep,
      });
    }
  }
  return slots;
}

export function timelineHtml(slots: FiveMinSlot[], opts?: { topic?: string; yearGroup?: string }): string {
  const header = opts && (opts.topic || opts.yearGroup)
    ? `<h2 style="font-size:14pt;margin:0 0 4mm;color:#1d4ed8;">5-min timeline — ${escapeHtml(opts.topic || "")} ${opts.yearGroup ? `(${escapeHtml(opts.yearGroup)})` : ""}</h2>`
    : `<h2 style="font-size:14pt;margin:0 0 4mm;color:#1d4ed8;">5-min timeline</h2>`;
  return `<div style="font-family:Arial,sans-serif;padding:10mm;max-width:210mm;">
    ${header}
    <table style="width:100%;border-collapse:collapse;font-size:10pt;">
      <thead>
        <tr style="background:#dbeafe;">
          <th style="text-align:left;padding:5px;border:1px solid #93c5fd;width:18mm;">Time</th>
          <th style="text-align:left;padding:5px;border:1px solid #93c5fd;width:32mm;">Phase</th>
          <th style="text-align:left;padding:5px;border:1px solid #93c5fd;">Teacher</th>
          <th style="text-align:left;padding:5px;border:1px solid #93c5fd;">Pupils</th>
        </tr>
      </thead>
      <tbody>
        ${slots.map((s) => `<tr>
          <td style="padding:4px;border:1px solid #cbd5e1;font-variant-numeric:tabular-nums;">${formatMin(s.startMin)}–${formatMin(s.endMin)}</td>
          <td style="padding:4px;border:1px solid #cbd5e1;">${escapeHtml(s.phaseName)}</td>
          <td style="padding:4px;border:1px solid #cbd5e1;">${escapeHtml(s.activity)}</td>
          <td style="padding:4px;border:1px solid #cbd5e1;">${escapeHtml(s.pupilDoing)}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>`;
}

function formatMin(m: number): string {
  const h = Math.floor(m / 60);
  const mm = (m % 60).toString().padStart(2, "0");
  return `${h}:${mm}`;
}

// ─── 2. Resources auto-list ────────────────────────────────────────────────

export interface DetectedResource {
  label: string;
  category: "physical" | "digital" | "print" | "consumable";
  occurrences: number;
}

const RESOURCE_RULES_FINAL: Array<{ rx: RegExp; label: string; category: DetectedResource["category"] }> = [
  { rx: /mini[\s-]*whiteboard/gi,                 label: "Mini whiteboards (1 per pupil)", category: "physical" },
  { rx: /\bipad|tablet/gi,                        label: "iPads / tablets",                category: "digital"  },
  { rx: /\blaptop|chromebook/gi,                  label: "Laptops / Chromebooks",          category: "digital"  },
  { rx: /\b(?:textbook|exercise\s+book)/gi,       label: "Textbooks / exercise books",     category: "print"    },
  { rx: /\bworksheet/gi,                          label: "Worksheet (1 per pupil)",        category: "print"    },
  { rx: /\bmanipulative|counters?|cubes?\b/gi,    label: "Manipulatives (counters/cubes)", category: "physical" },
  { rx: /\bruler|protractor|compass/gi,           label: "Maths sets (ruler, protractor, compass)", category: "physical" },
  { rx: /\b(?:pencils?|pens?|colour(?:ed|ing)?\s+pencils?)/gi, label: "Pens / pencils / colouring pencils", category: "consumable" },
  { rx: /\bglue\s+stick|scissors/gi,              label: "Glue sticks & scissors",         category: "consumable" },
  { rx: /\bpost[-\s]?it|sticky\s+notes?/gi,       label: "Post-it notes",                  category: "consumable" },
  { rx: /\bvideo|youtube|clip\b/gi,               label: "Video clip (preview before)",    category: "digital"  },
  { rx: /\bslides?|powerpoint|keynote|deck\b/gi,  label: "Slide deck on board",            category: "digital"  },
  { rx: /\bvisualiser\b/gi,                       label: "Visualiser",                     category: "digital"  },
  { rx: /\btimer|stopwatch\b/gi,                  label: "Visible timer",                  category: "digital"  },
  { rx: /\bdice|spinner\b/gi,                     label: "Dice / spinners",                category: "physical" },
  { rx: /\bsentence\s+stems?|word\s+banks?\b/gi,  label: "Sentence stems / word bank",     category: "print"    },
  { rx: /\btopic\s+image|picture\s+pack\b/gi,     label: "Picture pack / topic image",     category: "print"    },
];

/**
 * Scan the plan text for resource keywords and produce a deduplicated list.
 * Counts how many times each resource is referenced — useful for prioritising
 * physical-vs-digital prep before the lesson.
 */
export function detectResources(planText: string): DetectedResource[] {
  const text = (planText || "").toString();
  if (!text) return [];
  const seen = new Map<string, DetectedResource>();
  for (const rule of RESOURCE_RULES_FINAL) {
    const matches = text.match(rule.rx);
    if (matches && matches.length > 0) {
      const existing = seen.get(rule.label);
      if (existing) existing.occurrences += matches.length;
      else seen.set(rule.label, { label: rule.label, category: rule.category, occurrences: matches.length });
    }
  }
  return Array.from(seen.values()).sort((a, b) => b.occurrences - a.occurrences);
}

export function resourcesChecklistHtml(resources: DetectedResource[], opts?: { topic?: string; yearGroup?: string }): string {
  const grouped: Record<DetectedResource["category"], DetectedResource[]> = {
    physical: [], digital: [], print: [], consumable: [],
  };
  for (const r of resources) grouped[r.category].push(r);
  const section = (cat: DetectedResource["category"], title: string, colour: string) => {
    const list = grouped[cat];
    if (list.length === 0) return "";
    return `<div style="margin:0 0 4mm;">
      <h3 style="font-size:11pt;color:${colour};margin:0 0 2mm;">${title}</h3>
      <ul style="margin:0;padding-left:6mm;font-size:10pt;line-height:1.5;list-style:none;">
        ${list.map((r) => `<li style="padding:1mm 0;">☐ ${escapeHtml(r.label)}${r.occurrences > 1 ? ` <span style="color:#64748b;font-size:9pt;">×${r.occurrences} mentions</span>` : ""}</li>`).join("")}
      </ul>
    </div>`;
  };
  const headerLine = opts?.topic ? ` — ${escapeHtml(opts.topic)} ${opts.yearGroup ? `(${escapeHtml(opts.yearGroup)})` : ""}` : "";
  return `<div style="font-family:Arial,sans-serif;padding:10mm;max-width:210mm;">
    <h2 style="font-size:14pt;margin:0 0 4mm;color:#1d4ed8;">Resources checklist${headerLine}</h2>
    ${section("physical", "Physical", "#0f766e")}
    ${section("digital",  "Digital",  "#7c3aed")}
    ${section("print",    "Print / Paper", "#b45309")}
    ${section("consumable","Consumables","#be123c")}
    ${resources.length === 0 ? '<p style="font-size:10pt;color:#64748b;font-style:italic;">No specific resources detected — generate a fuller plan or list resources in the form.</p>' : ""}
  </div>`;
}

// ─── 3. Adaptive teaching matrix ───────────────────────────────────────────

export type AdaptiveAxis = "Inputs" | "Tasks" | "Outputs" | "Environment";

export interface MatrixCell {
  profile: string;            // e.g. "Dyslexia"
  axis: AdaptiveAxis;
  strategy: string;
}

const MATRIX_LIBRARY: Record<string, Record<AdaptiveAxis, string>> = {
  Dyslexia: {
    Inputs:      "Cream paper / overlay; sans-serif 14pt; pre-teach key vocab",
    Tasks:       "Chunk into ≤3 sub-steps; modelled answer first",
    Outputs:     "Accept verbal or scribed; fewer-but-deeper questions",
    Environment: "Quiet seat near board; line-tracker available",
  },
  ADHD: {
    Inputs:      "Now/Next visual; clear single-instruction at a time",
    Tasks:       "Short 8–10 min blocks; movement micro-break",
    Outputs:     "Whiteboard answer first then book; checklist tick-offs",
    Environment: "Front-and-side seat; fidget tool permitted",
  },
  Autism: {
    Inputs:      "Visual schedule of the lesson; literal language",
    Tasks:       "Same structure as last lesson; warn 5 min before transitions",
    Outputs:     "Pre-agreed format; option to type rather than write",
    Environment: "Predictable seat; ear defenders available",
  },
  EAL: {
    Inputs:      "Bilingual word bank; image-supported vocab",
    Tasks:       "Sentence stems; talk-partner with strong English speaker",
    Outputs:     "Accept first-language drafting; oral rehearsal first",
    Environment: "Visible word wall; subtitled video",
  },
  SLCN: {
    Inputs:      "5 pre-taught key words with visuals; slow pace",
    Tasks:       "Modelled sentence frames; symbol-supported task card",
    Outputs:     "Allow 10s processing time; draw-then-tell",
    Environment: "Reduced background noise; eye-level adult support",
  },
  "Visual impairment": {
    Inputs:      "Enlarged 18pt+ print; tactile diagrams; read aloud",
    Tasks:       "High-contrast worksheets; describe images verbally",
    Outputs:     "Verbal answers welcomed; large-grid book",
    Environment: "Front-and-good-light seat; magnifier ready",
  },
  "Hearing impairment": {
    Inputs:      "Face the pupil; captioned media only",
    Tasks:       "Written instructions alongside spoken",
    Outputs:     "Buddy-check after each instruction",
    Environment: "Carpet/soft surfaces; FM system if used",
  },
  "Higher attainers": {
    Inputs:      "Pre-loaded extension question",
    Tasks:       "Open-ended depth task; justify-and-evaluate",
    Outputs:     "Peer-teach back; written explanation",
    Environment: "Access to research books / extra reading",
  },
};

export const MATRIX_PROFILES = Object.keys(MATRIX_LIBRARY);
export const MATRIX_AXES: AdaptiveAxis[] = ["Inputs", "Tasks", "Outputs", "Environment"];

/**
 * Build a flat list of matrix cells for the chosen profiles, ready for grid
 * rendering or printing. Profiles default to all-eight if none specified.
 */
export function buildAdaptiveMatrix(profiles?: string[]): MatrixCell[] {
  const chosen = (profiles && profiles.length > 0 ? profiles : MATRIX_PROFILES).filter((p) => MATRIX_LIBRARY[p]);
  const out: MatrixCell[] = [];
  for (const p of chosen) {
    for (const a of MATRIX_AXES) {
      out.push({ profile: p, axis: a, strategy: MATRIX_LIBRARY[p][a] });
    }
  }
  return out;
}

export function adaptiveMatrixHtml(cells: MatrixCell[], opts?: { topic?: string; yearGroup?: string }): string {
  const profiles = Array.from(new Set(cells.map((c) => c.profile)));
  const headerLine = opts?.topic ? ` — ${escapeHtml(opts.topic)} ${opts.yearGroup ? `(${escapeHtml(opts.yearGroup)})` : ""}` : "";
  return `<div style="font-family:Arial,sans-serif;padding:10mm;max-width:297mm;">
    <h2 style="font-size:14pt;margin:0 0 4mm;color:#7c3aed;">Adaptive teaching matrix${headerLine}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:9.5pt;">
      <thead>
        <tr style="background:#ede9fe;">
          <th style="text-align:left;padding:5px;border:1px solid #c4b5fd;width:36mm;">Profile</th>
          ${MATRIX_AXES.map((a) => `<th style="text-align:left;padding:5px;border:1px solid #c4b5fd;">${escapeHtml(a)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${profiles.map((p) => `<tr>
          <td style="padding:4px;border:1px solid #cbd5e1;background:#faf5ff;font-weight:700;color:#6d28d9;">${escapeHtml(p)}</td>
          ${MATRIX_AXES.map((a) => {
            const cell = cells.find((c) => c.profile === p && c.axis === a);
            return `<td style="padding:4px;border:1px solid #cbd5e1;">${escapeHtml(cell?.strategy || "")}</td>`;
          }).join("")}
        </tr>`).join("")}
      </tbody>
    </table>
    <p style="font-size:9pt;color:#64748b;font-style:italic;margin:4mm 0 0;">Tick the columns relevant to today's lesson; pin a copy to the back of the door.</p>
  </div>`;
}

// ─── 4. TA brief ───────────────────────────────────────────────────────────

export interface TaBrief {
  topic: string;
  yearGroup: string;
  whatToSay: string[];        // exact phrases the TA should say
  whatToWatch: string[];      // pupil-look-fors
  whatToScaffold: string[];   // scaffolds available
  pupilsToPrioritise?: string[]; // names from the SEND-needs field
}

const SAY_HINTS = [
  "Show me on your whiteboard…",
  "Tell me back what we just did, in your own words.",
  "What's the first step?",
  "Point to the part you're stuck on.",
  "Read it aloud to me before you write.",
];

const WATCH_HINTS = [
  "Are pupils reaching for the success criteria?",
  "Pencils up after 30 seconds → who hasn't started?",
  "Spot off-task body language; redirect with the phrase, not a name.",
  "Note who finishes early — they need the stretch task.",
];

const SCAFFOLD_HINTS = [
  "Sentence stems sheet (use side-saddle, not in front).",
  "Worked example — point at it, do not solve for them.",
  "Word bank with images — pre-cut on each table.",
  "Mini-whiteboard for sketch-it-first.",
];

/**
 * Distil a lesson plan into a one-page TA brief: 5–6 phrases to say, lookout
 * cues, scaffolds available. Pulls pupil names out of the SEND-needs field
 * if you pass them in.
 */
export function buildTaBrief(args: {
  topic: string;
  yearGroup: string;
  planText: string;
  sendNeeds?: string;
}): TaBrief {
  const planLower = (args.planText || "").toLowerCase();
  const watch: string[] = [...WATCH_HINTS];
  const scaffold: string[] = [];
  if (/sentence\s+stems?|word\s+bank/.test(planLower)) scaffold.push(SCAFFOLD_HINTS[0], SCAFFOLD_HINTS[2]);
  if (/worked\s+example|i\s+do/.test(planLower))       scaffold.push(SCAFFOLD_HINTS[1]);
  if (/mini[-\s]*whiteboard/.test(planLower))          scaffold.push(SCAFFOLD_HINTS[3]);
  if (scaffold.length === 0) scaffold.push(SCAFFOLD_HINTS[0]);
  const pupilsToPrioritise = (args.sendNeeds || "")
    .split(/[,;]\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return {
    topic: args.topic,
    yearGroup: args.yearGroup,
    whatToSay: SAY_HINTS,
    whatToWatch: watch,
    whatToScaffold: Array.from(new Set(scaffold)),
    pupilsToPrioritise,
  };
}

export function taBriefHtml(brief: TaBrief): string {
  const list = (items: string[], colour: string) => `<ul style="margin:0;padding-left:5mm;font-size:10.5pt;line-height:1.55;color:${colour};">
    ${items.map((s) => `<li style="margin-bottom:1.5mm;">${escapeHtml(s)}</li>`).join("")}
  </ul>`;
  return `<div style="font-family:Arial,sans-serif;padding:12mm;max-width:210mm;">
    <h1 style="font-size:16pt;margin:0 0 2mm;color:#0f766e;">TA brief — ${escapeHtml(brief.topic)} <span style="font-weight:400;color:#0f766e;">(${escapeHtml(brief.yearGroup)})</span></h1>
    <p style="font-size:9.5pt;color:#64748b;margin:0 0 5mm;">Read me in 60 seconds before the lesson. Print A4 single page.</p>
    <h2 style="font-size:12pt;color:#0f766e;margin:0 0 2mm;">What to say</h2>
    ${list(brief.whatToSay, "#1f2937")}
    <h2 style="font-size:12pt;color:#0f766e;margin:5mm 0 2mm;">What to watch for</h2>
    ${list(brief.whatToWatch, "#1f2937")}
    <h2 style="font-size:12pt;color:#0f766e;margin:5mm 0 2mm;">What to scaffold</h2>
    ${list(brief.whatToScaffold, "#1f2937")}
    ${brief.pupilsToPrioritise && brief.pupilsToPrioritise.length > 0 ? `
      <h2 style="font-size:12pt;color:#be123c;margin:5mm 0 2mm;">Prioritise check-ins</h2>
      ${list(brief.pupilsToPrioritise, "#1f2937")}
    ` : ""}
  </div>`;
}

// ─── 5. MTP back-reference ─────────────────────────────────────────────────

const MTP_KEY = "adaptly_mtp_v1";

export interface MtpRowLite {
  id: string;
  weekNumber: number;
  date: string;
  topic: string;
}

export interface MtpLite {
  id: string;
  title: string;
  yearGroup: string;
  subject: string;
  termTag?: string;
  rows: MtpRowLite[];
}

export interface MtpBackReference {
  mtpId: string;
  mtpTitle: string;
  weekNumber: number;
  rowTopic: string;
  matchScore: number;       // 0..1
  jumpHref: string;         // route the UI can navigate to
}

function tokenise(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3);
}

function loadMtps(): MtpLite[] {
  try {
    const all = JSON.parse(localStorage.getItem(MTP_KEY) || "[]") as MtpLite[];
    return Array.isArray(all) ? all : [];
  } catch { return []; }
}

/**
 * Find the MTP unit/week the current lesson topic belongs to. Compares topic
 * tokens against each MTP row topic, returns up to `max` best matches with
 * score ≥ 0.25. Same year-group is preferred (boosted by 0.2).
 */
export function findMtpBackReferences(args: {
  topic: string;
  subject?: string;
  yearGroup?: string;
}, max = 3): MtpBackReference[] {
  if (!args.topic) return [];
  const topicTokens = new Set(tokenise(args.topic));
  if (topicTokens.size === 0) return [];
  const mtps = loadMtps();
  const out: MtpBackReference[] = [];
  for (const mtp of mtps) {
    if (args.subject && mtp.subject && mtp.subject.toLowerCase() !== args.subject.toLowerCase()) continue;
    const ygBoost = (args.yearGroup && mtp.yearGroup && mtp.yearGroup.toLowerCase() === args.yearGroup.toLowerCase()) ? 0.2 : 0;
    for (const row of mtp.rows || []) {
      const rowTokens = tokenise(row.topic || "");
      if (rowTokens.length === 0) continue;
      let hits = 0;
      for (const t of rowTokens) if (topicTokens.has(t)) hits += 1;
      const overlap = hits / Math.max(topicTokens.size, rowTokens.length);
      const score = Math.min(1, overlap + ygBoost);
      if (score >= 0.25) {
        out.push({
          mtpId: mtp.id,
          mtpTitle: mtp.title || `${mtp.subject || ""} ${mtp.yearGroup || ""}`.trim(),
          weekNumber: row.weekNumber,
          rowTopic: row.topic,
          matchScore: Math.round(score * 100) / 100,
          jumpHref: `/tools/medium-term-planner?mtp=${encodeURIComponent(mtp.id)}&week=${row.weekNumber}`,
        });
      }
    }
  }
  return out.sort((a, b) => b.matchScore - a.matchScore).slice(0, max);
}

export function backReferenceSummaryHtml(refs: MtpBackReference[]): string {
  if (refs.length === 0) {
    return `<p style="font-size:10pt;color:#64748b;font-style:italic;font-family:Arial,sans-serif;">No matching MTP unit found yet — once you build a Medium-Term Plan covering this topic, this lesson will auto-link back.</p>`;
  }
  return `<div style="font-family:Arial,sans-serif;font-size:10.5pt;">
    <p style="margin:0 0 3mm;color:#1f2937;">This lesson appears to belong to:</p>
    <ul style="margin:0;padding-left:5mm;list-style:none;">
      ${refs.map((r) => `<li style="margin-bottom:2mm;">
        <strong style="color:#15803d;">${escapeHtml(r.mtpTitle)}</strong>
        <span style="color:#64748b;"> — Week ${r.weekNumber}: </span>
        <span>${escapeHtml(r.rowTopic)}</span>
        <span style="color:#94a3b8;font-size:9pt;"> (match ${Math.round(r.matchScore * 100)}%)</span>
      </li>`).join("")}
    </ul>
  </div>`;
}
