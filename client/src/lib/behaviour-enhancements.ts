/**
 * behaviour-enhancements.ts — Improvements layered onto Behaviour Support Plans.
 *
 *  1. ABC log → BSP autoflow (5 logged incidents → trigger pre-fill)
 *  2. De-escalation lanyard card (A6 print-ready strategy summary)
 *  3. Restraint & Team-Teach compliance check
 *  4. Shared with TAs via SMS link (token + read-receipt registry)
 *  5. Review schedule with auto-reminders (calendar + email)
 */

const ABC_KEY        = "adaptly_abc_log_v1";
const SHARE_KEY      = "adaptly_bsp_shares_v1";
const REVIEW_KEY     = "adaptly_bsp_reviews_v1";

// ── 1. ABC log ───────────────────────────────────────────────────────────────

export interface ABCEntry {
  id: string;
  pupilId: string;
  date: string;             // YYYY-MM-DD
  antecedent: string;       // what was happening just before
  behaviour: string;        // what the pupil did
  consequence: string;      // what happened next
  trigger?: string;         // optional teacher-tagged trigger keyword
  recordedBy: string;
  at: number;
}

function readABC(): ABCEntry[] {
  try { return JSON.parse(localStorage.getItem(ABC_KEY) || "[]"); } catch { return []; }
}
function writeABC(rows: ABCEntry[]): void {
  try { localStorage.setItem(ABC_KEY, JSON.stringify(rows.slice(-500))); } catch {}
}

export function logABC(entry: Omit<ABCEntry, "id" | "at">): ABCEntry {
  const rec: ABCEntry = {
    ...entry,
    id: `abc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    at: Date.now(),
  };
  writeABC([...readABC(), rec]);
  return rec;
}

export function listABC(pupilId: string): ABCEntry[] {
  return readABC().filter(r => r.pupilId === pupilId).sort((a, b) => b.at - a.at);
}

/** Detect the top antecedents/triggers for a pupil to seed BSP form pre-fill. */
export function detectTriggers(pupilId: string): { trigger: string; count: number }[] {
  const entries = listABC(pupilId);
  if (entries.length < 5) return [];
  const counts: Record<string, number> = {};
  for (const e of entries) {
    const key = String(e.trigger || extractTriggerKeyword(e.antecedent) || "").toLowerCase();
    if (key) counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([trigger, count]) => ({ trigger, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

const TRIGGER_KEYWORDS = ["transition","unstructured","loud","change","group","new","unfamiliar","writing","reading","peer","conflict","sensory","tired","hungry"];
function extractTriggerKeyword(text: string): string | null {
  const lower = text.toLowerCase();
  for (const kw of TRIGGER_KEYWORDS) if (lower.includes(kw)) return kw;
  return null;
}

export function autoFillFromABC(pupilId: string): { triggerSummary: string; topTriggers: string[] } | null {
  const triggers = detectTriggers(pupilId);
  if (triggers.length === 0) return null;
  return {
    triggerSummary: triggers
      .map(t => `${t.trigger} (observed ${t.count}× in last 30 days)`)
      .join("; "),
    topTriggers: triggers.map(t => t.trigger),
  };
}

// ── 2. Lanyard card ─────────────────────────────────────────────────────────

export interface LanyardCard {
  pupilName: string;
  topThreeStrategies: string[];
  emergencyContact: string;
  noGoStrategies?: string[];
}

/**
 * Extract the first 3 named de-escalation strategies + any emergency lines
 * from a long BSP. Heuristic: lines beginning with "•" / "-" inside a
 * heading containing "de-escalation" or "strategies".
 */
export function buildLanyardCard(bspText: string, pupilName: string): LanyardCard {
  const lines = bspText.split(/\n+/);
  const strategies: string[] = [];
  let inSection = false;
  for (const l of lines) {
    if (/de[-\s]?escalation|strategies/i.test(l) && /^#{1,4}\s/.test(l)) inSection = true;
    else if (/^#{1,4}\s/.test(l)) inSection = false;
    else if (inSection && /^[•\-*]\s/.test(l) && strategies.length < 3) {
      strategies.push(l.replace(/^[•\-*]\s+/, "").trim());
    }
  }
  if (strategies.length === 0) {
    // fallback — first 3 bullet points anywhere
    for (const l of lines) {
      if (/^[•\-*]\s/.test(l) && strategies.length < 3) strategies.push(l.replace(/^[•\-*]\s+/, "").trim());
    }
  }
  const emergencyMatch = bspText.match(/emergency.{0,80}?\b(\d{4,5}[\s\d]+|\b[A-Z][a-z]+\b)/i);
  return {
    pupilName,
    topThreeStrategies: strategies,
    emergencyContact: emergencyMatch?.[0] || "(see full plan)",
  };
}

export function lanyardCardAsHtml(c: LanyardCard): string {
  return `
<style>
  .lc { width: 105mm; height: 148mm; padding: 8mm; font-family: Arial, sans-serif; }
  .lc h1 { font-size: 16pt; margin: 0 0 4mm; }
  .lc .strat { background: #fef3c7; padding: 3mm; border-radius: 2mm; margin-bottom: 2mm; font-size: 11pt; }
  .lc .em { background: #fee2e2; padding: 3mm; margin-top: 4mm; font-size: 10pt; }
</style>
<div class="lc">
  <h1>${c.pupilName} · de-escalation</h1>
  ${c.topThreeStrategies.map((s, i) => `<div class="strat"><strong>${i + 1}.</strong> ${s}</div>`).join("")}
  <div class="em">In emergency: ${c.emergencyContact}</div>
</div>`;
}

// ── 3. Restraint compliance check ───────────────────────────────────────────

export interface RestraintIssue { problem: string; }

export function checkRestraintCompliance(bspText: string): RestraintIssue[] {
  const issues: RestraintIssue[] = [];
  const lower = bspText.toLowerCase();
  const mentionsPhysical = /(restraint|physical intervention|hold|team[\s-]teach|physical[\s-]positive[\s-]handling)/i.test(bspText);
  if (!mentionsPhysical) return issues;
  if (!/(team[\s-]teach\s+trained|trained staff|named adults|trained\s+adults)/i.test(bspText)) {
    issues.push({ problem: "Physical intervention mentioned but no Team-Teach (or equivalent) trained staff are named. Required by 'Use of Reasonable Force' DfE 2013." });
  }
  if (!/(reasonable force|use of reasonable force|dfe 2013|legal basis)/i.test(bspText)) {
    issues.push({ problem: "Missing reference to the legal basis (Use of Reasonable Force, DfE 2013) for any physical intervention." });
  }
  if (!/(post[-\s]incident|debrief|review after|reflection)/i.test(bspText)) {
    issues.push({ problem: "No post-incident debrief / review-after process documented." });
  }
  return issues;
}

// ── 4. Share with TAs via SMS link ──────────────────────────────────────────

export interface BSPShare {
  token: string;
  pupilId: string;
  pupilName: string;
  body: string;
  expiresAt: string;
  reads: number;
}

export function shareWithTAs(pupilId: string, pupilName: string, body: string, daysValid = 7): BSPShare {
  const token = `bsp_${Math.random().toString(36).slice(2, 10)}`;
  const exp = new Date(); exp.setDate(exp.getDate() + daysValid);
  const rec: BSPShare = { token, pupilId, pupilName, body, expiresAt: exp.toISOString(), reads: 0 };
  try {
    const all: BSPShare[] = JSON.parse(localStorage.getItem(SHARE_KEY) || "[]");
    all.push(rec);
    localStorage.setItem(SHARE_KEY, JSON.stringify(all.slice(-100)));
  } catch {}
  return rec;
}

export function readShare(token: string): BSPShare | null {
  try {
    const all: BSPShare[] = JSON.parse(localStorage.getItem(SHARE_KEY) || "[]");
    const idx = all.findIndex(s => s.token === token);
    if (idx === -1) return null;
    if (new Date(all[idx].expiresAt) < new Date()) return null;
    all[idx].reads += 1;
    localStorage.setItem(SHARE_KEY, JSON.stringify(all));
    return all[idx];
  } catch { return null; }
}

// ── 5. Review schedule ──────────────────────────────────────────────────────

export interface BSPReview {
  id: string;
  pupilId: string;
  reviewOn: string;          // YYYY-MM-DD
  keyworkerEmail?: string;
  reminderSent?: boolean;
}

export function scheduleReview(pupilId: string, reviewOn: string, keyworkerEmail?: string): BSPReview {
  const rec: BSPReview = { id: `rev_${Date.now()}`, pupilId, reviewOn, keyworkerEmail };
  try {
    const all: BSPReview[] = JSON.parse(localStorage.getItem(REVIEW_KEY) || "[]");
    all.push(rec);
    localStorage.setItem(REVIEW_KEY, JSON.stringify(all));
  } catch {}
  return rec;
}

export function listReviews(pupilId: string): BSPReview[] {
  try {
    const all: BSPReview[] = JSON.parse(localStorage.getItem(REVIEW_KEY) || "[]");
    return all.filter(r => r.pupilId === pupilId);
  } catch { return []; }
}

/** Reviews due in 7 days — caller can fire emails / WS notifications. */
export function reviewsDueSoon(): BSPReview[] {
  const now = new Date();
  const week = new Date(); week.setDate(week.getDate() + 7);
  try {
    return (JSON.parse(localStorage.getItem(REVIEW_KEY) || "[]") as BSPReview[])
      .filter(r => !r.reminderSent && new Date(r.reviewOn) <= week && new Date(r.reviewOn) >= now);
  } catch { return []; }
}
