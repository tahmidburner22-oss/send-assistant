/**
 * smart-target-enhancements.ts — Improvements layered onto SMART Targets.
 *
 *  1. Outcome → 3-step termly target ladder builder
 *  2. Baseline capture wizard (forces a measurable starting point)
 *  3. Sparkline progress per target
 *  4. AR meeting pack (PDF: targets + evidence + parent summary)
 *  5. Statutory compliance — every target maps to ≥1 EHCP Section E outcome
 */

const TARGET_KEY  = "adaptly_smart_targets_v1";
const PROGRESS_KEY = "adaptly_target_progress_v1";

// ── 1. Outcome → ladder builder ─────────────────────────────────────────────

export interface SmartTarget {
  id: string;
  pupilId: string;
  outcomeRef: string;       // e.g. "EHCP Section E #2"
  description: string;
  baseline: string;
  measurable: string;
  termTarget: 1 | 2 | 3;
  reviewDate: string;
  createdAt: number;
}

/**
 * Take one EHCP outcome + a baseline + a year-end target, and emit three
 * stepping-stone termly targets with sensible mid-points.
 */
export function buildTargetLadder(opts: {
  outcomeRef: string;
  pupilId: string;
  baseline: string;
  yearTarget: string;
}): Omit<SmartTarget, "id" | "createdAt">[] {
  const t1End = `From baseline (${opts.baseline}) towards a 30% step.`;
  const t2End = `Build on autumn term — 60% of the way to year target.`;
  const t3End = `Achieve year target: ${opts.yearTarget}`;
  const t = (i: number) => {
    const d = new Date(); d.setMonth(d.getMonth() + 4 * i);
    return d.toISOString().slice(0, 10);
  };
  return [
    { pupilId: opts.pupilId, outcomeRef: opts.outcomeRef, description: t1End, baseline: opts.baseline, measurable: "30% improvement", termTarget: 1, reviewDate: t(1) },
    { pupilId: opts.pupilId, outcomeRef: opts.outcomeRef, description: t2End, baseline: opts.baseline, measurable: "60% improvement", termTarget: 2, reviewDate: t(2) },
    { pupilId: opts.pupilId, outcomeRef: opts.outcomeRef, description: t3End, baseline: opts.baseline, measurable: "100% — meet year target", termTarget: 3, reviewDate: t(3) },
  ];
}

export function saveTargets(targets: SmartTarget[]): void {
  try { localStorage.setItem(TARGET_KEY, JSON.stringify(targets.slice(-500))); } catch {}
}
export function listTargets(pupilId?: string): SmartTarget[] {
  try {
    const all = JSON.parse(localStorage.getItem(TARGET_KEY) || "[]") as SmartTarget[];
    return pupilId ? all.filter(t => t.pupilId === pupilId) : all;
  } catch { return []; }
}
export function addTarget(t: Omit<SmartTarget, "id" | "createdAt">): SmartTarget {
  const rec: SmartTarget = { ...t, id: `tgt_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, createdAt: Date.now() };
  const all = listTargets(); all.push(rec); saveTargets(all);
  return rec;
}

// ── 2. Baseline wizard ──────────────────────────────────────────────────────

const VAGUE_BASELINES = [/^improve/i, /^get\s+better/i, /^work\s+on/i, /^make\s+progress/i];

export function isBaselineMeasurable(text: string): boolean {
  if (!text) return false;
  if (VAGUE_BASELINES.some(rx => rx.test(text.trim()))) return false;
  // Must have a number, a unit, or a frequency phrase.
  return /\d/.test(text) || /\b(words|wcpm|times|out\s+of|minutes|sentences|levels?)\b/i.test(text);
}

export function suggestBaselinePrompts(area: string): string[] {
  const k = area.toLowerCase();
  if (/read/.test(k))       return ["Currently reads X words correct per minute (WCPM) on a Y-level passage.", "Decodes X out of 20 phase-3 CVCs.", "Inference questions: X out of 5 correct."];
  if (/maths|number/.test(k)) return ["Recalls X out of 12 multiplication facts.", "Solves X out of 5 single-step word problems.", "Counts on from any number to 20 with X% accuracy."];
  if (/write/.test(k))      return ["Writes X complete sentences in a 10-minute task.", "Uses capital + full stop in X out of 5 sentences."];
  if (/behav/.test(k))      return ["X behaviour incidents per week (logged).", "Stays on task for an average of X minutes."];
  return ["Achieves the task with X% accuracy.", "Frequency: X times per week."];
}

// ── 3. Sparkline progress ───────────────────────────────────────────────────

export interface ProgressDatum {
  targetId: string;
  at: number;
  value: number;
  note?: string;
}

export function logProgress(p: Omit<ProgressDatum, "at">): void {
  try {
    const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]") as ProgressDatum[];
    all.push({ ...p, at: Date.now() });
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all.slice(-2000)));
  } catch {}
}

export function progressFor(targetId: string): ProgressDatum[] {
  try {
    return (JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]") as ProgressDatum[])
      .filter(p => p.targetId === targetId).sort((a, b) => a.at - b.at);
  } catch { return []; }
}

/** Return SVG path 'd' attribute for a sparkline of values. */
export function sparklinePath(values: number[], width = 80, height = 24): string {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(0.001, max - min);
  return values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

// ── 4. AR meeting pack ──────────────────────────────────────────────────────

export interface ARMeetingPack {
  pupilName: string;
  generatedOn: string;
  targets: SmartTarget[];
  progress: Record<string, ProgressDatum[]>;
  parentSummary: string;
}

export function buildARMeetingPack(pupilId: string, pupilName: string): ARMeetingPack {
  const targets = listTargets(pupilId);
  const progress: Record<string, ProgressDatum[]> = {};
  for (const t of targets) progress[t.id] = progressFor(t.id);
  const lines: string[] = [];
  for (const t of targets) {
    const datapoints = progress[t.id];
    const last = datapoints[datapoints.length - 1];
    const first = datapoints[0];
    if (last && first) {
      const direction = last.value > first.value ? "↑ improved" : last.value < first.value ? "↓ declined" : "→ stable";
      lines.push(`• ${t.description}: ${direction} (${first.value} → ${last.value})`);
    } else {
      lines.push(`• ${t.description}: no measurements yet — flag at meeting.`);
    }
  }
  return {
    pupilName,
    generatedOn: new Date().toISOString(),
    targets,
    progress,
    parentSummary: lines.join("\n"),
  };
}

export function packAsText(pack: ARMeetingPack): string {
  const lines: string[] = [
    `Annual Review Meeting Pack — ${pack.pupilName}`,
    `Generated ${new Date(pack.generatedOn).toLocaleDateString("en-GB")}`,
    "─────────────────────────────",
    "TARGETS",
    ...pack.targets.map(t => `Target ${t.termTarget}: ${t.description} (review: ${t.reviewDate})`),
    "",
    "PARENT-FRIENDLY PROGRESS SUMMARY",
    pack.parentSummary,
  ];
  return lines.join("\n");
}

// ── 5. Statutory compliance check ───────────────────────────────────────────

export function statutoryCheck(targets: SmartTarget[], outcomeRefs: string[]): { orphans: SmartTarget[]; uncovered: string[] } {
  const refsSet = new Set(outcomeRefs.map(r => r.toLowerCase()));
  const orphans = targets.filter(t => !refsSet.has(t.outcomeRef.toLowerCase()));
  const covered = new Set(targets.map(t => t.outcomeRef.toLowerCase()));
  const uncovered = outcomeRefs.filter(r => !covered.has(r.toLowerCase()));
  return { orphans, uncovered };
}
