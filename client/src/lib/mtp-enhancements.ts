/**
 * mtp-enhancements.ts — Improvements layered onto Medium-Term Planner.
 *
 *  1. Backwards from the assessment point — schedule lessons that build to it
 *  2. Curriculum-mapping heatmap (NC objectives × lessons)
 *  3. Interleaving + retrieval slot per lesson (prior-unit links)
 *  4. Cross-team coordination — change feed when two teachers share a class
 *  5. Bridge to Lesson Planner — every row generates a full lesson
 */

const MTP_KEY = "adaptly_mtp_v1";
const MTP_CHANGES_KEY = "adaptly_mtp_changes_v1";

// ── Shared types ────────────────────────────────────────────────────────────

export interface MtpRow {
  id: string;
  weekNumber: number;
  date: string;             // YYYY-MM-DD
  topic: string;
  ncObjectives: string[];   // e.g. ["5F4", "5N3"]
  retrievalLink?: string;   // prior topic to retrieve
  assessment?: boolean;
  notes?: string;
}

export interface Mtp {
  id: string;
  title: string;
  yearGroup: string;
  subject: string;
  termTag: string;          // "Aut-2025"
  rows: MtpRow[];
  authors: string[];        // teacher names
  updatedAt: number;
}

// ── 1. Backwards from assessment ────────────────────────────────────────────

export interface BackwardsPlanInput {
  assessmentDate: string;
  assessmentDescription: string;
  weeksAvailable: number;
  ncObjectivesToCover: string[];
  startDate: string;
}

export function backwardsPlan(input: BackwardsPlanInput): MtpRow[] {
  const rows: MtpRow[] = [];
  const start = new Date(input.startDate);
  const objectivesPerWeek = Math.max(1, Math.ceil(input.ncObjectivesToCover.length / Math.max(1, input.weeksAvailable - 1)));
  for (let i = 0; i < input.weeksAvailable; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    const isAssessmentWeek = i === input.weeksAvailable - 1;
    const slice = isAssessmentWeek
      ? []
      : input.ncObjectivesToCover.slice(i * objectivesPerWeek, (i + 1) * objectivesPerWeek);
    rows.push({
      id: `mtp_${Date.now()}_${i}`,
      weekNumber: i + 1,
      date: d.toISOString().slice(0, 10),
      topic: isAssessmentWeek ? input.assessmentDescription : `Build towards: ${slice.join(", ") || "consolidation"}`,
      ncObjectives: slice,
      assessment: isAssessmentWeek,
      retrievalLink: i > 0 ? rows[i - 1].topic : undefined,
    });
  }
  return rows;
}

// ── 2. Curriculum heatmap ───────────────────────────────────────────────────

export interface HeatmapCell {
  rowId: string;
  weekNumber: number;
  ncObjective: string;
  covered: boolean;
}

export function curriculumHeatmap(rows: MtpRow[], allObjectives: string[]): HeatmapCell[] {
  const out: HeatmapCell[] = [];
  for (const row of rows) {
    for (const obj of allObjectives) {
      out.push({
        rowId: row.id,
        weekNumber: row.weekNumber,
        ncObjective: obj,
        covered: row.ncObjectives.includes(obj),
      });
    }
  }
  return out;
}

export function uncoveredObjectives(rows: MtpRow[], allObjectives: string[]): string[] {
  const covered = new Set(rows.flatMap((r) => r.ncObjectives));
  return allObjectives.filter((o) => !covered.has(o));
}

// ── 3. Interleaving + retrieval ─────────────────────────────────────────────

export interface RetrievalSlot {
  rowId: string;
  fromTopic: string;
  proposedQuestion: string;
}

export function autoInsertRetrieval(rows: MtpRow[]): MtpRow[] {
  return rows.map((row, idx) => {
    if (idx === 0 || row.retrievalLink) return row;
    // Pick a topic from 3 weeks earlier if available, else immediately previous
    const sourceIdx = Math.max(0, idx - 3);
    return { ...row, retrievalLink: rows[sourceIdx].topic };
  });
}

export function retrievalQuestions(rows: MtpRow[]): RetrievalSlot[] {
  return rows
    .filter((r) => r.retrievalLink)
    .map((r) => ({
      rowId: r.id,
      fromTopic: r.retrievalLink!,
      proposedQuestion: `Quick recap: explain the key idea of "${r.retrievalLink}" before we start "${r.topic}".`,
    }));
}

// ── 4. Cross-team coordination ──────────────────────────────────────────────

export interface MtpChange {
  id: string;
  mtpId: string;
  byAuthor: string;
  at: number;
  description: string;
  rowId?: string;
}

export function logChange(change: Omit<MtpChange, "id" | "at">): MtpChange {
  const rec: MtpChange = {
    ...change,
    id: `chg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    at: Date.now(),
  };
  try {
    const all = JSON.parse(localStorage.getItem(MTP_CHANGES_KEY) || "[]") as MtpChange[];
    all.push(rec);
    localStorage.setItem(MTP_CHANGES_KEY, JSON.stringify(all.slice(-1000)));
  } catch {}
  return rec;
}

export function changeFeed(mtpId: string, max = 30): MtpChange[] {
  try {
    return (JSON.parse(localStorage.getItem(MTP_CHANGES_KEY) || "[]") as MtpChange[])
      .filter((c) => c.mtpId === mtpId)
      .sort((a, b) => b.at - a.at)
      .slice(0, max);
  } catch { return []; }
}

export function detectClashes(rows: MtpRow[]): { weekNumber: number; clashes: string[] }[] {
  // Multiple assessments in one week is a clash; same topic twice is a clash.
  const grouped = new Map<number, MtpRow[]>();
  for (const r of rows) {
    if (!grouped.has(r.weekNumber)) grouped.set(r.weekNumber, []);
    grouped.get(r.weekNumber)!.push(r);
  }
  const out: { weekNumber: number; clashes: string[] }[] = [];
  grouped.forEach((rs, wk) => {
    const issues: string[] = [];
    if (rs.filter((r) => r.assessment).length > 1) issues.push(`${rs.filter((r) => r.assessment).length} assessments scheduled.`);
    const topics = rs.map((r) => r.topic.toLowerCase());
    const dupTopic = topics.find((t, i) => topics.indexOf(t) !== i);
    if (dupTopic) issues.push(`Duplicate topic in same week: "${dupTopic}".`);
    if (issues.length) out.push({ weekNumber: wk, clashes: issues });
  });
  return out;
}

// ── 5. Bridge to Lesson Planner ─────────────────────────────────────────────

export interface LessonPlannerSeed {
  topic: string;
  date: string;
  yearGroup: string;
  subject: string;
  ncObjectives: string[];
  priorTopic?: string;
  adaptations: string[];
}

export function rowToLessonPlannerSeed(row: MtpRow, opts: { yearGroup: string; subject: string; adaptations?: string[] }): LessonPlannerSeed {
  return {
    topic: row.topic,
    date: row.date,
    yearGroup: opts.yearGroup,
    subject: opts.subject,
    ncObjectives: row.ncObjectives,
    priorTopic: row.retrievalLink,
    adaptations: opts.adaptations ?? [],
  };
}

// ── Persistence ─────────────────────────────────────────────────────────────

export function saveMtp(mtp: Mtp): void {
  try {
    const all = JSON.parse(localStorage.getItem(MTP_KEY) || "[]") as Mtp[];
    const filtered = all.filter((m) => m.id !== mtp.id);
    filtered.push({ ...mtp, updatedAt: Date.now() });
    localStorage.setItem(MTP_KEY, JSON.stringify(filtered.slice(-100)));
  } catch {}
}

export function listMtps(): Mtp[] {
  try { return JSON.parse(localStorage.getItem(MTP_KEY) || "[]"); } catch { return []; }
}
