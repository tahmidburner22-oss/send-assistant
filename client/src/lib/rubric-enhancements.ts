/**
 * rubric-enhancements.ts — Improvements layered onto Rubric Generator.
 *
 *  1. Co-construction mode (pupil-facing sentence stems → teacher refines)
 *  2. Single-point + dual-point rubric formats (alongside analytic)
 *  3. Self/peer assessment companion sheet
 *  4. Calibration sample work for each level
 *  5. Mark-book bridge — score a pupil → write Report Comment + Skill Ladder update
 */

const RUBRIC_KEY = "adaptly_rubric_scores_v1";

// ── Shared types ────────────────────────────────────────────────────────────

export interface AnalyticRubric {
  title: string;
  criteria: { name: string; descriptors: string[] }[]; // descriptors[level]
  levels: string[];   // e.g. ["Working towards", "Expected", "Greater depth"]
}

// ── 1. Co-construction sentence stems ───────────────────────────────────────

export const COCONSTRUCTION_STEMS = [
  "A great answer would…",
  "I would know I'd done well if…",
  "It would be even better if…",
  "The hardest part is when…",
  "I might get stuck if…",
];

export interface PupilRubricInput {
  pupilId: string;
  stem: string;
  response: string;
}

export function summarisePupilInputs(inputs: PupilRubricInput[]): string[] {
  const grouped = new Map<string, string[]>();
  for (const i of inputs) {
    if (!grouped.has(i.stem)) grouped.set(i.stem, []);
    if (i.response.trim()) grouped.get(i.stem)!.push(i.response.trim());
  }
  const out: string[] = [];
  grouped.forEach((vals, stem) => {
    out.push(`${stem}: ${vals.slice(0, 3).join(" / ")}`);
  });
  return out;
}

// ── 2. Single-point and dual-point formats ──────────────────────────────────

export interface SinglePointRubric {
  title: string;
  expectations: string[];     // what the standard looks like
  glow: string[];             // praise / strengths
  grow: string[];             // next-step suggestions
}

export interface DualPointRubric {
  title: string;
  rows: { criterion: string; current: string; nextStep: string }[];
}

export function toSinglePoint(analytic: AnalyticRubric): SinglePointRubric {
  const middle = Math.floor(analytic.levels.length / 2);
  return {
    title: analytic.title,
    expectations: analytic.criteria.map((c) => c.descriptors[middle] || c.name),
    glow: [],
    grow: [],
  };
}

export function toDualPoint(analytic: AnalyticRubric): DualPointRubric {
  const middle = Math.floor(analytic.levels.length / 2);
  const top = analytic.levels.length - 1;
  return {
    title: analytic.title,
    rows: analytic.criteria.map((c) => ({
      criterion: c.name,
      current: c.descriptors[middle] || c.name,
      nextStep: c.descriptors[top] || `Push beyond "${c.descriptors[middle] || c.name}"`,
    })),
  };
}

// ── 3. Self/peer assessment companion ───────────────────────────────────────

export interface SelfPeerCompanion {
  title: string;
  audience: "self" | "peer";
  tickList: { criterion: string; pupilFriendly: string; whatToDoNext: string }[];
}

export function selfPeerCompanion(rubric: AnalyticRubric, audience: "self" | "peer"): SelfPeerCompanion {
  return {
    title: rubric.title,
    audience,
    tickList: rubric.criteria.map((c) => ({
      criterion: c.name,
      pupilFriendly: pupilFriendly(c.name, audience),
      whatToDoNext: `If not yet, then: ${c.descriptors[0] || "look at the success criteria again"}.`,
    })),
  };
}

function pupilFriendly(criterion: string, audience: "self" | "peer"): string {
  const verb = audience === "self" ? "I have" : "they have";
  // Light heuristic: turn "Use of subordinating conjunctions" → "I have used subordinating conjunctions"
  const lower = criterion.replace(/^Use of /i, "used ").toLowerCase();
  return `${verb} ${lower}.`;
}

// ── 4. Calibration sample work ──────────────────────────────────────────────

export interface CalibrationSample {
  level: string;
  exampleText: string;
  whyThisLevel: string;
}

export function calibrationSamples(rubric: AnalyticRubric): CalibrationSample[] {
  return rubric.levels.map((level, i) => ({
    level,
    exampleText: rubric.criteria
      .map((c) => `[${c.name}] — ${c.descriptors[i] || "(not described)"}`)
      .join("\n"),
    whyThisLevel: `This sample meets every "${level}" descriptor — note especially the ${rubric.criteria[0]?.name.toLowerCase() || "first criterion"}.`,
  }));
}

// ── 5. Mark-book bridge ─────────────────────────────────────────────────────

export interface MarkbookEntry {
  pupilId: string;
  rubricTitle: string;
  scoredAt: number;
  scores: { criterion: string; level: string }[];
  reportComment: string;
  skillRungUpdates: { rungId: string; outcome: "taught" | "mastered" }[];
}

export function scorePupil(opts: {
  pupilId: string;
  rubric: AnalyticRubric;
  scoresByCriterion: Record<string, string>;
  rungIdByCriterion?: Record<string, string>;
}): MarkbookEntry {
  const scores = opts.rubric.criteria.map((c) => ({
    criterion: c.name,
    level: opts.scoresByCriterion[c.name] || opts.rubric.levels[0],
  }));
  // Build a comment paragraph from the scoring grid.
  const sentences = scores.map(({ criterion, level }) => {
    const idx = opts.rubric.levels.indexOf(level);
    if (idx === opts.rubric.levels.length - 1) return `Strong ${criterion.toLowerCase()} — at "${level}".`;
    if (idx === 0) return `${criterion} is still developing — currently "${level}".`;
    return `${criterion} is on track at "${level}".`;
  });
  const reportComment = sentences.join(" ");

  const skillRungUpdates: { rungId: string; outcome: "taught" | "mastered" }[] = [];
  if (opts.rungIdByCriterion) {
    for (const [criterion, rungId] of Object.entries(opts.rungIdByCriterion)) {
      const s = scores.find((x) => x.criterion === criterion);
      if (!s) continue;
      const idx = opts.rubric.levels.indexOf(s.level);
      skillRungUpdates.push({
        rungId,
        outcome: idx >= opts.rubric.levels.length - 1 ? "mastered" : "taught",
      });
    }
  }

  const entry: MarkbookEntry = {
    pupilId: opts.pupilId,
    rubricTitle: opts.rubric.title,
    scoredAt: Date.now(),
    scores,
    reportComment,
    skillRungUpdates,
  };
  try {
    const all = JSON.parse(localStorage.getItem(RUBRIC_KEY) || "[]") as MarkbookEntry[];
    all.push(entry);
    localStorage.setItem(RUBRIC_KEY, JSON.stringify(all.slice(-1000)));
  } catch {}
  return entry;
}

export function listMarkbookEntries(pupilId: string): MarkbookEntry[] {
  try {
    return (JSON.parse(localStorage.getItem(RUBRIC_KEY) || "[]") as MarkbookEntry[])
      .filter((e) => e.pupilId === pupilId)
      .sort((a, b) => a.scoredAt - b.scoredAt);
  } catch { return []; }
}
