/**
 * diagramRanker.ts — PR-23 / audit item #55.
 *
 * Diagram requestability ranking. Pure / deterministic.
 *
 * Each section can carry one of three diagram states:
 *   - present: a curated diagram has already been resolved.
 *   - requestable: no diagram resolved, but the question stem
 *     pedagogically benefits from one.
 *   - not-applicable: the section is prose-only.
 *
 * The ranker scores `requestable` candidates so the admin-gated
 * SVG-fallback pipeline (PR-23 admin gate, complete in `server/routes/ai.ts`)
 * can prioritise the most valuable misses first when budget is tight.
 *
 * Score is the sum of three signals, each in 0..1:
 *   - subject weight (sciences > maths > humanities)
 *   - keyword density of "diagram-implying" verbs in the stem
 *   - mark-tariff weight (a 6-mark Q with no diagram is a bigger gap)
 *
 * Total clamped to 0..3.
 */

export interface DiagramRankSection {
  type?: string;
  title?: string;
  content?: string;
  marks?: number;
  /** Truthy when a curated diagram has already been resolved. */
  imageUrl?: string;
  svg?: string;
  assetRef?: string;
}

export interface DiagramRankWorksheet {
  metadata?: { subject?: string };
  sections?: DiagramRankSection[];
}

export interface DiagramRankRow {
  sectionIndex: number;
  title: string;
  state: "present" | "requestable" | "not-applicable";
  score: number;
  reasons: string[];
}

const SUBJECT_WEIGHT: Record<string, number> = {
  biology: 0.95,
  chemistry: 0.95,
  physics: 0.95,
  science: 0.9,
  geography: 0.85,
  mathematics: 0.7,
  maths: 0.7,
  history: 0.5,
  english: 0.3,
  default: 0.55,
};

const DIAGRAM_VERBS = [
  "draw", "sketch", "label", "plot", "graph", "diagram", "figure",
  "shown below", "as shown", "complete the diagram", "circuit", "ray diagram",
  "force diagram", "structure", "arrange", "annotate", "construct",
  "bisect", "polygon", "vector", "histogram", "scatter", "table below",
];

function subjectWeight(subject: string | undefined): number {
  const key = String(subject || "").toLowerCase().trim();
  for (const [k, v] of Object.entries(SUBJECT_WEIGHT)) {
    if (k === "default") continue;
    if (key.includes(k)) return v;
  }
  return SUBJECT_WEIGHT.default;
}

function keywordDensity(content: string): { density: number; matches: string[] } {
  const text = content.toLowerCase();
  const matches: string[] = [];
  for (const v of DIAGRAM_VERBS) {
    if (text.includes(v)) matches.push(v);
  }
  return { density: Math.min(1, matches.length / 5), matches };
}

function markWeight(marks: number | undefined): number {
  if (!Number.isFinite(marks) || !marks) return 0.2;
  if (marks <= 2) return 0.3;
  if (marks <= 4) return 0.6;
  return 0.9;
}

function isDiagramAttachable(s: DiagramRankSection): boolean {
  const t = String(s.type || "").toLowerCase();
  if (t === "diagram") return true; // already a diagram slot
  if (/^q[-_]/.test(t)) return true;
  return false;
}

function alreadyHasDiagram(s: DiagramRankSection): boolean {
  return Boolean(s.imageUrl || s.svg || s.assetRef);
}

export function rankDiagramRequestability(ws: DiagramRankWorksheet): DiagramRankRow[] {
  const subjectW = subjectWeight(ws.metadata?.subject);
  const rows: DiagramRankRow[] = [];
  const sections = ws.sections || [];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (alreadyHasDiagram(s)) {
      rows.push({
        sectionIndex: i,
        title: String(s.title || `Section ${i + 1}`),
        state: "present",
        score: 0,
        reasons: ["Diagram already resolved"],
      });
      continue;
    }
    if (!isDiagramAttachable(s)) {
      rows.push({
        sectionIndex: i,
        title: String(s.title || `Section ${i + 1}`),
        state: "not-applicable",
        score: 0,
        reasons: [],
      });
      continue;
    }
    const { density, matches } = keywordDensity(String(s.content || ""));
    const mw = markWeight(s.marks);
    const score = Number((subjectW + density + mw).toFixed(3));
    const reasons: string[] = [];
    reasons.push(`subject weight ${subjectW.toFixed(2)}`);
    if (matches.length > 0) reasons.push(`keywords: ${matches.slice(0, 3).join(", ")}`);
    if (s.marks) reasons.push(`tariff ${s.marks} marks`);
    rows.push({
      sectionIndex: i,
      title: String(s.title || `Section ${i + 1}`),
      state: density > 0 ? "requestable" : "not-applicable",
      score,
      reasons,
    });
  }
  return rows;
}

/**
 * Sort + slice helper — return the top-N requestable candidates by
 * score. Used by the admin-gate handler to decide which sections
 * actually round-trip to the SVG fallback.
 */
export function pickTopRequestable(
  rows: DiagramRankRow[],
  topN: number,
): DiagramRankRow[] {
  return rows
    .filter((r) => r.state === "requestable")
    .sort((a, b) => b.score - a.score || a.sectionIndex - b.sectionIndex)
    .slice(0, topN);
}
