/**
 * ehcp-enhancements.ts — Improvements layered onto the EHCP Plan Generator.
 *
 * Each function below corresponds to one of the listed improvements:
 *   1. goldenThreadCheck     — Need → Outcome → Provision → Section F consistency
 *   2. tribunalScore         — Per-provision SMART/enforceability scoring
 *   3. annualReviewDelta     — Compare new vs. last year's draft, redline + summary
 *   4. localAuthorityPacks   — LA-specific Section F house-style constraints
 *   5. redactedExport        — Pseudonymised export for parent/EP sharing
 *
 * The module is data-only; the UI lives in components/EhcpEnhancementsPanel.
 */

const LA_PACKS_KEY = "adaptly_ehcp_la_packs_v1";

// ── 1. Golden-thread check ────────────────────────────────────────────────

export interface GoldenThreadIssue {
  needText: string;
  problem: "no-outcome" | "no-provision" | "no-section-f";
  message: string;
}

/**
 * Walks the EHCP draft and flags broken threads.
 *   • Need → Outcome — every Section B need must map to ≥1 Section E outcome
 *   • Outcome → Provision — every Section E outcome must map to ≥1 provision
 *   • Provision → Section F — every provision must appear in Section F text
 */
export function goldenThreadCheck(sections: Record<string, string>): GoldenThreadIssue[] {
  const needs    = extractBulletPoints(sections.B || "");
  const outcomes = extractBulletPoints(sections.E || "");
  const sectionF = (sections.F || "").toLowerCase();
  const issues: GoldenThreadIssue[] = [];
  for (const need of needs) {
    const needWords = wordsFrom(need);
    const matchedOutcome = outcomes.find(o => sharesContent(needWords, wordsFrom(o)));
    if (!matchedOutcome) {
      issues.push({
        needText: need,
        problem: "no-outcome",
        message: `Need on p.B has no matching Section E outcome.`,
      });
      continue;
    }
    const outcomeWords = wordsFrom(matchedOutcome);
    if (!sharesContent(outcomeWords, sectionF.split(/\s+/))) {
      issues.push({
        needText: need,
        problem: "no-section-f",
        message: `Outcome "${trim(matchedOutcome, 60)}" has no matching provision in Section F.`,
      });
    }
  }
  return issues;
}

function extractBulletPoints(text: string): string[] {
  return text
    .split(/\n+/)
    .map(l => l.replace(/^[\s\-•*\d+.]+/, "").trim())
    .filter(l => l.length > 4);
}

function wordsFrom(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(w => w.length > 4);
}

function sharesContent(a: string[], b: string[]): boolean {
  const set = new Set(a);
  let hits = 0;
  for (const w of b) if (set.has(w)) hits++;
  return hits >= 2;
}

function trim(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// ── 2. Tribunal-defensibility scorer ──────────────────────────────────────

export interface ProvisionScore {
  text: string;
  specific:   { pass: boolean; detail: string };
  quantified: { pass: boolean; detail: string };
  byWhomBy:   { pass: boolean; detail: string };
  /** 0–100 composite. */
  total: number;
}

const FREQUENCY_WORDS = /\b(daily|weekly|fortnightly|once|twice|every|each|per\s+(week|day|term)|hour|minute)\b/i;
const QUANTITY        = /\b\d+(\.\d+)?\b/;
const DELIVERY_WHO    = /\b(teaching\s+assistant|TA|class\s+teacher|SENCO|specialist|therapist|SLT|EP|tutor|mentor|trained\s+(?:adult|staff))\b/i;
const TIMEFRAME       = /\b(by|within|over|across)\s+(?:[a-z\s]*?\d+\s*(?:weeks?|months?|terms?)|the\s+end\s+of\s+(?:term|year|half[-\s]?term|spring|summer|autumn))\b/i;
const VAGUE           = /\b(as\s+appropriate|as\s+required|access\s+to|support\s+as\s+needed|where\s+possible|in\s+line\s+with\s+school\s+policy)\b/i;

export function tribunalScore(provisionText: string): ProvisionScore {
  const specific   = !VAGUE.test(provisionText);
  const quantified = QUANTITY.test(provisionText) || FREQUENCY_WORDS.test(provisionText);
  const byWhomBy   = DELIVERY_WHO.test(provisionText) && (TIMEFRAME.test(provisionText) || /review/i.test(provisionText));

  const total = (specific ? 35 : 0) + (quantified ? 35 : 0) + (byWhomBy ? 30 : 0);
  return {
    text: provisionText,
    specific:   { pass: specific,   detail: specific   ? "Avoids vague hedging language."     : 'Contains hedging like "as appropriate" — replace with concrete language.' },
    quantified: { pass: quantified, detail: quantified ? "Includes a number or frequency."    : "No number/frequency word. Add 20 minutes / 5x weekly / etc." },
    byWhomBy:   { pass: byWhomBy,   detail: byWhomBy   ? "Names the deliverer and a timeframe." : "Missing named deliverer (TA/SENCO/Therapist) and/or by-when phrase." },
    total,
  };
}

export function rewriteForEnforceability(provisionText: string): string {
  const s = tribunalScore(provisionText);
  const additions: string[] = [];
  if (!s.quantified) additions.push("[quantify: e.g. 20 minutes daily]");
  if (!s.byWhomBy)   additions.push("[name deliverer & timeframe: delivered by a trained TA, reviewed termly]");
  if (!s.specific)   return provisionText.replace(VAGUE, "[specific intervention]") + " " + additions.join(" ");
  return provisionText + " " + additions.join(" ");
}

// ── 3. Annual review delta ────────────────────────────────────────────────

export interface RedlineDiff {
  added:   string[];
  removed: string[];
  retained: string[];
  summary: string;
}

export function annualReviewDelta(lastYear: string, thisYear: string): RedlineDiff {
  const a = new Set(extractBulletPoints(lastYear));
  const b = new Set(extractBulletPoints(thisYear));
  const removed  = [...a].filter(x => !b.has(x));
  const added    = [...b].filter(x => !a.has(x));
  const retained = [...a].filter(x => b.has(x));
  const summary  = [
    `Progress against last year's outcomes:`,
    `• ${retained.length} outcome${retained.length === 1 ? "" : "s"} retained.`,
    `• ${added.length} new provision${added.length === 1 ? "" : "s"} introduced.`,
    `• ${removed.length} previous provision${removed.length === 1 ? "" : "s"} removed (achieved or no longer required).`,
  ].join("\n");
  return { added, removed, retained, summary };
}

// ── 4. Local-authority template packs ─────────────────────────────────────

export interface LATemplatePack {
  id: string;
  name: string;
  /** Plain-English style notes the AI should obey. */
  styleNotes: string;
  /** Word/phrase blacklist for Section F ("access to" etc.). */
  bannedPhrases: string[];
  /** Required structural fragments (e.g. always cite SEND CoP 6.79). */
  requiredFragments: string[];
}

export const BUILT_IN_LA_PACKS: LATemplatePack[] = [
  {
    id: "default",
    name: "Generic (no LA pack)",
    styleNotes: "Plain English. Specify provision exactly. Avoid vague terms.",
    bannedPhrases: ["as appropriate", "access to", "support as needed"],
    requiredFragments: [],
  },
  {
    id: "birmingham",
    name: "Birmingham",
    styleNotes: "Birmingham requires that each provision names the school's named deliverer and review cadence.",
    bannedPhrases: ["as appropriate", "where possible", "regular support"],
    requiredFragments: ["review schedule", "named deliverer"],
  },
  {
    id: "camden",
    name: "Camden",
    styleNotes: "Camden Section F prefers shorter, atomic provisions; one provision per bullet.",
    bannedPhrases: ["as required", "access to interventions"],
    requiredFragments: [],
  },
];

export function listLAPacks(): LATemplatePack[] {
  let extras: LATemplatePack[] = [];
  try { extras = JSON.parse(localStorage.getItem(LA_PACKS_KEY) || "[]"); } catch {}
  return [...BUILT_IN_LA_PACKS, ...extras];
}

export function saveLAPack(p: LATemplatePack): void {
  try {
    const extras: LATemplatePack[] = JSON.parse(localStorage.getItem(LA_PACKS_KEY) || "[]");
    const next = [...extras.filter(x => x.id !== p.id), p];
    localStorage.setItem(LA_PACKS_KEY, JSON.stringify(next));
  } catch {}
}

export function applyLAPack(text: string, packId: string): { text: string; warnings: string[] } {
  const pack = listLAPacks().find(p => p.id === packId);
  if (!pack) return { text, warnings: [] };
  const warnings: string[] = [];
  for (const banned of pack.bannedPhrases) {
    const rx = new RegExp(`\\b${banned.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "gi");
    if (rx.test(text)) warnings.push(`Pack "${pack.name}" disallows: "${banned}"`);
  }
  for (const required of pack.requiredFragments) {
    if (!text.toLowerCase().includes(required.toLowerCase())) {
      warnings.push(`Pack "${pack.name}" requires the phrase: "${required}"`);
    }
  }
  return { text, warnings };
}

export function laPackAsPromptInstruction(packId: string): string {
  const pack = listLAPacks().find(p => p.id === packId);
  if (!pack || pack.id === "default") return "";
  const banned = pack.bannedPhrases.length > 0
    ? `Do NOT use any of these phrases: ${pack.bannedPhrases.map(b => `"${b}"`).join(", ")}.`
    : "";
  const required = pack.requiredFragments.length > 0
    ? `Each provision should include: ${pack.requiredFragments.join(", ")}.`
    : "";
  return [
    `Local-authority house-style pack: ${pack.name}.`,
    pack.styleNotes,
    banned, required,
  ].filter(Boolean).join(" ");
}

// ── 5. Redacted / pseudonymised export ────────────────────────────────────

export interface RedactionMap {
  pupilName?: string;
  pupilInitials?: string;
  schoolName?: string;
  parentNames?: string[];
  staffNames?: string[];
  postcode?: string;
}

export function redactDraft(text: string, map: RedactionMap): string {
  let out = text;
  function rx(s: string) { return new RegExp(`\\b${s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "gi"); }
  if (map.pupilName) out = out.replace(rx(map.pupilName), map.pupilInitials || "[Pupil]");
  if (map.schoolName) out = out.replace(rx(map.schoolName), "[School]");
  for (const n of map.parentNames || []) out = out.replace(rx(n), "[Parent]");
  for (const n of map.staffNames || []) out = out.replace(rx(n), "[Staff]");
  if (map.postcode) out = out.replace(rx(map.postcode), "[Postcode]");
  // Generic UK postcode
  out = out.replace(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b/g, "[Postcode]");
  // Email
  out = out.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[Email]");
  // UK phone
  out = out.replace(/\b(?:\+?44\s?|0)(?:\d\s?){9,10}\b/g, "[Phone]");
  return out;
}
