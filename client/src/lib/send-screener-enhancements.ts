/**
 * send-screener-enhancements.ts — Improvements layered onto SEND Screener.
 *
 *  1. Reusable across the year — change-over-time radar
 *  2. Multi-rater input — disagreement flagging
 *  3. Pathway recommender (in-class / SENCO / external) with non-diagnostic disclaimer
 *  4. Boxall / SDQ / PASS interoperability — accept exported scores
 *  5. One-click referral packet for the chosen pathway
 */

const SCREENER_KEY = "adaptly_screener_runs_v1";

// ── Shared types ────────────────────────────────────────────────────────────

export type Domain =
  | "cognition"
  | "communication"
  | "social-emotional"
  | "sensory-physical"
  | "literacy"
  | "numeracy";

export const DOMAIN_LABEL: Record<Domain, string> = {
  cognition:        "Cognition & learning",
  communication:    "Communication & interaction",
  "social-emotional": "Social, emotional & mental health",
  "sensory-physical": "Sensory & physical",
  literacy:         "Literacy",
  numeracy:         "Numeracy",
};

export type Rater = "teacher" | "ta" | "parent" | "pupil" | "specialist";

export interface ScreenerRun {
  id: string;
  pupilId: string;
  rater: Rater;
  at: number;
  scores: Record<Domain, number>;        // 0–10, higher = more concern
  notes?: string;
  termTag?: string;                      // e.g. "Aut-2025"
}

// ── 1. Reusable across the year ─────────────────────────────────────────────

export function saveRun(run: Omit<ScreenerRun, "id" | "at">): ScreenerRun {
  const rec: ScreenerRun = { ...run, id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, at: Date.now() };
  try {
    const all = JSON.parse(localStorage.getItem(SCREENER_KEY) || "[]") as ScreenerRun[];
    all.push(rec);
    localStorage.setItem(SCREENER_KEY, JSON.stringify(all.slice(-1000)));
  } catch {}
  return rec;
}

export function listRuns(pupilId: string): ScreenerRun[] {
  try {
    return (JSON.parse(localStorage.getItem(SCREENER_KEY) || "[]") as ScreenerRun[])
      .filter((r) => r.pupilId === pupilId)
      .sort((a, b) => a.at - b.at);
  } catch { return []; }
}

export interface RadarSeries {
  domain: Domain;
  values: { at: number; score: number }[];
}

export function radarOverTime(pupilId: string): RadarSeries[] {
  const runs = listRuns(pupilId);
  return (Object.keys(DOMAIN_LABEL) as Domain[]).map((d) => ({
    domain: d,
    values: runs.map((r) => ({ at: r.at, score: r.scores[d] ?? 0 })),
  }));
}

// ── 2. Multi-rater disagreement ─────────────────────────────────────────────

export interface RaterDisagreement {
  domain: Domain;
  raters: { rater: Rater; score: number }[];
  spread: number;                        // max - min
}

export function disagreementFlags(pupilId: string, threshold = 4): RaterDisagreement[] {
  const runs = listRuns(pupilId);
  const recent = runs.slice(-12);                  // last 12 runs
  const out: RaterDisagreement[] = [];
  for (const d of Object.keys(DOMAIN_LABEL) as Domain[]) {
    const byRater = new Map<Rater, number[]>();
    for (const r of recent) {
      if (!byRater.has(r.rater)) byRater.set(r.rater, []);
      byRater.get(r.rater)!.push(r.scores[d] ?? 0);
    }
    if (byRater.size < 2) continue;                // need at least two raters
    const ratersAvg = Array.from(byRater.entries()).map(([rater, vals]) => ({
      rater, score: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
    }));
    const max = Math.max(...ratersAvg.map((r) => r.score));
    const min = Math.min(...ratersAvg.map((r) => r.score));
    const spread = max - min;
    if (spread >= threshold) out.push({ domain: d, raters: ratersAvg, spread });
  }
  return out;
}

// ── 3. Pathway recommender ──────────────────────────────────────────────────

export type Pathway = "in-class" | "senco" | "external";

export interface PathwayRecommendation {
  pathway: Pathway;
  rationale: string;
  nextSteps: string[];
  disclaimer: string;
}

export function recommendPathway(latestScores: Record<Domain, number>): PathwayRecommendation {
  const scores = Object.values(latestScores);
  const max = Math.max(...scores, 0);
  const sum = scores.reduce((a, b) => a + b, 0);

  if (max <= 3 && sum <= 12) {
    return {
      pathway: "in-class",
      rationale: "All domains scored at low concern — classroom-level adaptive teaching is appropriate.",
      nextSteps: [
        "Ensure passport-driven adaptations apply each lesson",
        "Re-screen at end of next half-term",
      ],
      disclaimer: "This is a screening recommendation, not a diagnosis. Decisions remain professional judgement.",
    };
  }
  if (max <= 6 && sum <= 24) {
    return {
      pathway: "senco",
      rationale: "Moderate concern in one or more domains — escalate to SENCO conversation.",
      nextSteps: [
        "Book a SENCO consultation",
        "Add pupil to monitoring list and re-screen in 6 weeks",
        "Review with class teacher + TA + parent",
      ],
      disclaimer: "This is a screening recommendation, not a diagnosis. Decisions remain professional judgement.",
    };
  }
  return {
    pathway: "external",
    rationale: "Significant concern in at least one domain — consider external referral.",
    nextSteps: [
      "Discuss with parent and obtain consent",
      "Compile referral packet (see Referral tab)",
      "Continue in-class adaptations while waiting for assessment",
    ],
    disclaimer: "This is a screening recommendation, not a diagnosis. The pathway is advisory only.",
  };
}

// ── 4. Validated-instrument interop ─────────────────────────────────────────

export type InstrumentKind = "boxall" | "sdq" | "pass";

export interface ImportedScores {
  kind: InstrumentKind;
  rawScores: Record<string, number>;
  mappedDomainScores: Partial<Record<Domain, number>>;
}

const BOXALL_MAP: Record<string, Domain> = {
  "self-organisation":     "cognition",
  "engagement":            "cognition",
  "self-regulation":       "social-emotional",
  "internalised":          "social-emotional",
  "externalised":          "social-emotional",
};

const SDQ_MAP: Record<string, Domain> = {
  "emotional-symptoms":    "social-emotional",
  "conduct-problems":      "social-emotional",
  "hyperactivity":         "social-emotional",
  "peer-problems":         "communication",
  "prosocial":             "social-emotional",
};

const PASS_MAP: Record<string, Domain> = {
  "feelings-about-school": "social-emotional",
  "perceived-learning-capability": "cognition",
  "self-regard-as-a-learner": "social-emotional",
  "preparedness-for-learning": "cognition",
  "attitudes-to-teachers": "communication",
  "general-work-ethic":    "cognition",
  "confidence-in-learning": "cognition",
  "attitudes-to-attendance": "social-emotional",
  "response-to-curriculum-demands": "cognition",
};

export function importInstrument(kind: InstrumentKind, rawScores: Record<string, number>): ImportedScores {
  const map = kind === "boxall" ? BOXALL_MAP : kind === "sdq" ? SDQ_MAP : PASS_MAP;
  const grouped: Partial<Record<Domain, number[]>> = {};
  for (const [k, v] of Object.entries(rawScores)) {
    const d = map[k.toLowerCase()];
    if (!d) continue;
    if (!grouped[d]) grouped[d] = [];
    // Normalise raw scores: assume 0–10 already; otherwise truncate to 10.
    grouped[d]!.push(Math.max(0, Math.min(10, v)));
  }
  const mappedDomainScores: Partial<Record<Domain, number>> = {};
  for (const [d, vs] of Object.entries(grouped) as [Domain, number[]][]) {
    mappedDomainScores[d] = +(vs.reduce((a, b) => a + b, 0) / vs.length).toFixed(1);
  }
  return { kind, rawScores, mappedDomainScores };
}

// ── 5. Referral packet ──────────────────────────────────────────────────────

export interface ReferralPacket {
  pupilName: string;
  schoolName: string;
  pathway: Pathway;
  domains: Domain[];                     // domains driving the referral
  evidence: string[];                    // bullet evidence pulled from the screener history
  consentNeeded: boolean;
  draftLetter: string;
}

export function buildReferralPacket(opts: {
  pupilId: string;
  pupilName: string;
  schoolName: string;
  recommendation: PathwayRecommendation;
}): ReferralPacket {
  const runs = listRuns(opts.pupilId);
  const last = runs[runs.length - 1];
  const drivers: Domain[] = last
    ? (Object.entries(last.scores).filter(([, v]) => v >= 6).map(([k]) => k) as Domain[])
    : [];

  const evidence: string[] = [
    `Number of screener runs: ${runs.length}`,
    `Most recent run by ${last?.rater || "unknown"} on ${last ? new Date(last.at).toLocaleDateString("en-GB") : "—"}`,
    ...drivers.map((d) => `${DOMAIN_LABEL[d]} consistently elevated (latest: ${last?.scores[d] ?? "—"}/10)`),
  ];

  const draftLetter = [
    `${opts.schoolName}`,
    `${new Date().toLocaleDateString("en-GB")}`,
    "",
    `Re: External SEND assessment referral for ${opts.pupilName}`,
    "",
    `Following routine SEND screening, ${opts.pupilName} has demonstrated sustained concern in ${drivers.map((d) => DOMAIN_LABEL[d]).join(", ") || "specific domains"}.`,
    "",
    "Evidence to date:",
    ...evidence.map((e) => `• ${e}`),
    "",
    opts.recommendation.disclaimer,
    "",
    "We would welcome your specialist input. Parental consent is being / has been obtained.",
  ].join("\n");

  return {
    pupilName: opts.pupilName,
    schoolName: opts.schoolName,
    pathway: opts.recommendation.pathway,
    domains: drivers,
    evidence,
    consentNeeded: opts.recommendation.pathway === "external",
    draftLetter,
  };
}
