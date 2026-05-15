/**
 * analytics-enhancements.ts — Improvements layered onto Analytics Dashboard.
 *
 *  1. Ofsted Deep Dive export (canned questions answered from live data)
 *  2. Cohort comparison view (PP / EAL / SEND vs. non-SEND)
 *  3. Intervention ROI panel (cost per percentile-point)
 *  4. Anomaly alerts (drops in engagement / attendance)
 *  5. Drill-through to underlying records
 */

const ANOMALY_KEY = "adaptly_analytics_anomalies_v1";
const ROI_KEY = "adaptly_analytics_roi_v1";

// ── Shared types ────────────────────────────────────────────────────────────

export type Cohort = "all" | "send" | "pp" | "eal" | "non-send";

export const COHORT_LABEL: Record<Cohort, string> = {
  all: "All pupils",
  send: "SEND",
  pp: "Pupil Premium",
  eal: "EAL",
  "non-send": "Non-SEND",
};

export interface PupilSnapshot {
  pupilId: string;
  cohort: Cohort[];
  toolUsage: number;        // generations in last 30 days
  attendancePct: number;    // 0–100
  attainmentDelta: number;  // standardised z-score vs baseline (+ improvement)
  lastEngagedAt?: number;
}

// ── 1. Ofsted Deep Dive export ──────────────────────────────────────────────

export interface DeepDiveSection {
  question: string;
  evidence: string[];
}

export function buildDeepDive(snapshots: PupilSnapshot[]): DeepDiveSection[] {
  const send = snapshots.filter((s) => s.cohort.includes("send"));
  const nonSend = snapshots.filter((s) => s.cohort.includes("non-send"));
  const avg = (xs: number[]) => xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : 0;

  return [
    {
      question: "How do you identify pupils with SEND?",
      evidence: [
        `${send.length} pupils currently flagged with SEND across screener + EHCP records.`,
        `Screener used: ${snapshots.filter((s) => (s.toolUsage || 0) > 0).length} pupils have at least one tool generation linked to identification workflow.`,
      ],
    },
    {
      question: "How do you measure the impact of provision?",
      evidence: [
        `Mean attainment delta — SEND cohort: ${avg(send.map((s) => s.attainmentDelta))}; Non-SEND: ${avg(nonSend.map((s) => s.attainmentDelta))}.`,
        `Mean attendance — SEND: ${avg(send.map((s) => s.attendancePct))}%; Non-SEND: ${avg(nonSend.map((s) => s.attendancePct))}%.`,
      ],
    },
    {
      question: "How do you ensure adaptive teaching reaches every pupil?",
      evidence: [
        `Average tool generations per SEND pupil in the last 30 days: ${avg(send.map((s) => s.toolUsage))}.`,
        `Pupils with zero engagement in 14+ days: ${snapshots.filter((s) => !s.lastEngagedAt || Date.now() - (s.lastEngagedAt || 0) > 14 * 86400_000).length}.`,
      ],
    },
    {
      question: "How do leaders quality-assure SEND provision?",
      evidence: [
        "Provenance card on every AI generation logs prompt template, validators run, and pupil context fields used.",
        "All EHCP / BSP / Passport edits are auto-written to the pupil timeline (read-only audit trail).",
      ],
    },
  ];
}

export function deepDiveAsText(sections: DeepDiveSection[]): string {
  return [
    "Ofsted Deep Dive — SEND",
    `Generated ${new Date().toLocaleDateString("en-GB")}`,
    "─────────────────────────────",
    ...sections.flatMap((s) => [
      "",
      `Q: ${s.question}`,
      ...s.evidence.map((e) => `• ${e}`),
    ]),
  ].join("\n");
}

// ── 2. Cohort comparison ────────────────────────────────────────────────────

export interface CohortStats {
  cohort: Cohort;
  count: number;
  avgToolUsage: number;
  avgAttendance: number;
  avgAttainmentDelta: number;
}

export function cohortStats(snapshots: PupilSnapshot[]): CohortStats[] {
  const cohorts: Cohort[] = ["all", "send", "pp", "eal", "non-send"];
  return cohorts.map((c) => {
    const slice = c === "all" ? snapshots : snapshots.filter((s) => s.cohort.includes(c));
    const n = slice.length || 1;
    return {
      cohort: c,
      count: slice.length,
      avgToolUsage: +(slice.reduce((a, s) => a + s.toolUsage, 0) / n).toFixed(1),
      avgAttendance: +(slice.reduce((a, s) => a + s.attendancePct, 0) / n).toFixed(1),
      avgAttainmentDelta: +(slice.reduce((a, s) => a + s.attainmentDelta, 0) / n).toFixed(2),
    };
  });
}

// ── 3. Intervention ROI ─────────────────────────────────────────────────────

export interface InterventionROI {
  name: string;
  pupils: number;
  termCostGBP: number;
  baselinePercentile: number;
  currentPercentile: number;
}

export function listROIs(): InterventionROI[] {
  try { return JSON.parse(localStorage.getItem(ROI_KEY) || "[]"); } catch { return []; }
}

export function saveROIs(rows: InterventionROI[]): void {
  try { localStorage.setItem(ROI_KEY, JSON.stringify(rows.slice(-200))); } catch {}
}

export function roiCostPerPoint(r: InterventionROI): number | null {
  const points = r.currentPercentile - r.baselinePercentile;
  if (points <= 0) return null;
  return +(r.termCostGBP / (r.pupils * points)).toFixed(2);
}

// ── 4. Anomaly alerts ───────────────────────────────────────────────────────

export interface Anomaly {
  pupilId: string;
  kind: "engagement-drop" | "attendance-dip" | "subgroup-attendance";
  message: string;
  at: number;
}

export function detectAnomalies(snapshots: PupilSnapshot[]): Anomaly[] {
  const out: Anomaly[] = [];
  for (const s of snapshots) {
    if (s.toolUsage <= 0) {
      out.push({ pupilId: s.pupilId, kind: "engagement-drop", message: "No tool usage in 30 days.", at: Date.now() });
    }
    if (s.attendancePct < 90) {
      out.push({ pupilId: s.pupilId, kind: "attendance-dip", message: `Attendance ${s.attendancePct}% (below 90%).`, at: Date.now() });
    }
  }
  // Sub-group level
  const sendSlice = snapshots.filter((s) => s.cohort.includes("send"));
  if (sendSlice.length) {
    const avg = sendSlice.reduce((a, s) => a + s.attendancePct, 0) / sendSlice.length;
    if (avg < 90) {
      out.push({ pupilId: "__cohort__", kind: "subgroup-attendance", message: `SEND cohort average attendance ${avg.toFixed(1)}%.`, at: Date.now() });
    }
  }
  try { localStorage.setItem(ANOMALY_KEY, JSON.stringify(out.slice(-500))); } catch {}
  return out;
}

// ── 5. Drill-through ────────────────────────────────────────────────────────

export interface DrillThroughTarget {
  metric: "toolUsage" | "attendance" | "attainmentDelta";
  pupilIds: string[];
}

export function drillThrough(snapshots: PupilSnapshot[], opts: {
  metric: DrillThroughTarget["metric"];
  cohort?: Cohort;
  threshold?: number;
}): DrillThroughTarget {
  const slice = opts.cohort && opts.cohort !== "all"
    ? snapshots.filter((s) => s.cohort.includes(opts.cohort!))
    : snapshots;
  const t = opts.threshold ?? 0;
  const ids = slice
    .filter((s) => {
      if (opts.metric === "toolUsage") return s.toolUsage <= t;
      if (opts.metric === "attendance") return s.attendancePct < t || (t === 0 && s.attendancePct < 90);
      return s.attainmentDelta <= t;
    })
    .map((s) => s.pupilId);
  return { metric: opts.metric, pupilIds: ids };
}
