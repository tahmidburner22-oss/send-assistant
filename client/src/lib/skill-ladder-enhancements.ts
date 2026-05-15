/**
 * skill-ladder-enhancements.ts — Improvements layered onto the Skill Ladder.
 *
 *  1. Skill graph (DAG) with prerequisites — surfaces stuck rungs upstream
 *  2. Auto-population from work events (every quiz / worksheet updates rungs)
 *  3. Pupil-facing "I can…" progression poster
 *  4. Mastery vs. exposure distinction (taught / mastered with threshold)
 *  5. Cohort gap report — "16 pupils stuck on rung 7B" → small-group sheet
 */

const SKILL_KEY    = "adaptly_skill_state_v1";
const SKILL_GRAPH_KEY = "adaptly_skill_graph_v1";

// ── Shared types ────────────────────────────────────────────────────────────

export type RungStatus = "not-taught" | "taught" | "mastered";

export interface Rung {
  id: string;
  label: string;
  curriculumRef?: string;        // e.g. NC code "5F4"
  prerequisites: string[];       // rung ids
}

export interface PupilRungState {
  pupilId: string;
  rungId: string;
  status: RungStatus;
  attempts: number;
  successes: number;
  updatedAt: number;
}

// ── 1. Skill graph (DAG) ────────────────────────────────────────────────────

export function loadGraph(): Rung[] {
  try { return JSON.parse(localStorage.getItem(SKILL_GRAPH_KEY) || "[]"); } catch { return []; }
}

export function saveGraph(rungs: Rung[]): void {
  try { localStorage.setItem(SKILL_GRAPH_KEY, JSON.stringify(rungs.slice(0, 5000))); } catch {}
}

export function upstreamPrerequisites(rungId: string, graph: Rung[] = loadGraph()): Rung[] {
  const map = new Map(graph.map((r) => [r.id, r]));
  const out: Rung[] = [];
  const seen = new Set<string>();
  function walk(id: string): void {
    if (seen.has(id)) return;
    seen.add(id);
    const node = map.get(id);
    if (!node) return;
    for (const p of node.prerequisites) {
      const parent = map.get(p);
      if (parent) { out.push(parent); walk(parent.id); }
    }
  }
  walk(rungId);
  return out;
}

/**
 * For a stuck rung, return the deepest unmastered prerequisite — that is the
 * actual gap that should be re-taught first.
 */
export function gapBelow(rungId: string, pupilId: string, graph: Rung[] = loadGraph()): Rung | null {
  const upstream = upstreamPrerequisites(rungId, graph);
  for (const r of upstream) {
    const s = getState(pupilId, r.id);
    if (s.status !== "mastered") return r;
  }
  return null;
}

// ── 2. Auto-population ──────────────────────────────────────────────────────

export interface WorkEvent {
  pupilId: string;
  rungId: string;
  correct: boolean;
}

export function applyWork(events: WorkEvent[], opts: { masteryRatio?: number; minAttempts?: number } = {}): void {
  const ratio = opts.masteryRatio ?? 0.8;
  const minN = opts.minAttempts ?? 3;
  const all = readAll();
  for (const e of events) {
    const key = `${e.pupilId}::${e.rungId}`;
    const cur = all.get(key) ?? newRecord(e.pupilId, e.rungId);
    cur.attempts++;
    if (e.correct) cur.successes++;
    cur.updatedAt = Date.now();
    if (cur.status === "not-taught") cur.status = "taught";
    if (cur.attempts >= minN && cur.successes / cur.attempts >= ratio) cur.status = "mastered";
    all.set(key, cur);
  }
  writeAll(all);
}

// ── 3. Pupil-facing "I can…" poster ─────────────────────────────────────────

export interface PosterEntry {
  rungId: string;
  iCanStatement: string;
  status: RungStatus;
}

export function posterFor(pupilId: string, graph: Rung[] = loadGraph()): PosterEntry[] {
  return graph.map((r) => {
    const s = getState(pupilId, r.id);
    return {
      rungId: r.id,
      iCanStatement: rungToICan(r),
      status: s.status,
    };
  });
}

function rungToICan(r: Rung): string {
  // Light heuristic — strip codes and prefix with "I can".
  const cleaned = r.label.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return /^i\s+can\b/i.test(cleaned) ? cleaned : `I can ${cleaned[0]?.toLowerCase() ?? ""}${cleaned.slice(1)}`;
}

export function posterAsText(entries: PosterEntry[], pupilName: string): string {
  return [
    `${pupilName} — My Learning Ladder`,
    "─────────────────────────────",
    ...entries.map((e) => {
      const tick = e.status === "mastered" ? "★" : e.status === "taught" ? "✓" : " ";
      return `[${tick}] ${e.iCanStatement}`;
    }),
  ].join("\n");
}

// ── 4. Mastery vs. exposure ─────────────────────────────────────────────────

export interface MasteryConfig {
  masteryRatio: number;          // e.g. 0.8 → ≥80% accuracy
  minAttempts: number;           // e.g. 3
  windowDays?: number;           // optional rolling window
}

export const DEFAULT_MASTERY: MasteryConfig = { masteryRatio: 0.8, minAttempts: 3 };

export function isMastered(state: PupilRungState, cfg: MasteryConfig = DEFAULT_MASTERY): boolean {
  if (state.attempts < cfg.minAttempts) return false;
  return state.successes / state.attempts >= cfg.masteryRatio;
}

// ── 5. Cohort gap report ────────────────────────────────────────────────────

export interface CohortGap {
  rungId: string;
  rungLabel: string;
  stuckPupilIds: string[];
}

export function cohortGaps(pupilIds: string[], graph: Rung[] = loadGraph()): CohortGap[] {
  const out: CohortGap[] = [];
  for (const r of graph) {
    const stuck = pupilIds.filter((pid) => {
      const s = getState(pid, r.id);
      return s.status !== "mastered" && s.attempts > 0;
    });
    if (stuck.length >= 3) {
      out.push({ rungId: r.id, rungLabel: r.label, stuckPupilIds: stuck });
    }
  }
  return out.sort((a, b) => b.stuckPupilIds.length - a.stuckPupilIds.length);
}

/** Generate a small-group worksheet brief for the cohort gap. */
export function smallGroupBrief(gap: CohortGap): string {
  return [
    `Small-group worksheet brief`,
    `Target rung: ${gap.rungLabel} (${gap.rungId})`,
    `Group size: ${gap.stuckPupilIds.length}`,
    "",
    "Suggested structure:",
    "1. Recap of rung concept (3 min, modelled with examples)",
    "2. Three scaffolded practice questions (collaborative)",
    "3. Three independent practice questions (assess for mastery)",
    "4. Quick exit ticket — one question, mark on the spot",
  ].join("\n");
}

// ── Internal storage ────────────────────────────────────────────────────────

function newRecord(pupilId: string, rungId: string): PupilRungState {
  return { pupilId, rungId, status: "not-taught", attempts: 0, successes: 0, updatedAt: Date.now() };
}

function readAll(): Map<string, PupilRungState> {
  try {
    const raw = localStorage.getItem(SKILL_KEY) || "{}";
    const obj = JSON.parse(raw) as Record<string, PupilRungState>;
    return new Map(Object.entries(obj));
  } catch { return new Map(); }
}

function writeAll(m: Map<string, PupilRungState>): void {
  try {
    const obj: Record<string, PupilRungState> = {};
    m.forEach((v, k) => { obj[k] = v; });
    localStorage.setItem(SKILL_KEY, JSON.stringify(obj));
  } catch {}
}

export function getState(pupilId: string, rungId: string): PupilRungState {
  const m = readAll();
  const k = `${pupilId}::${rungId}`;
  return m.get(k) ?? newRecord(pupilId, rungId);
}

export function setStatus(pupilId: string, rungId: string, status: RungStatus): void {
  const m = readAll();
  const k = `${pupilId}::${rungId}`;
  const cur = m.get(k) ?? newRecord(pupilId, rungId);
  cur.status = status;
  cur.updatedAt = Date.now();
  m.set(k, cur);
  writeAll(m);
}
