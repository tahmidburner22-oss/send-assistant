/**
 * iep-v2-enhancements.ts
 *
 * Five improvements for the EHCP / IEP Plan Generator, separate from the
 * existing `ehcp-enhancements.ts` (golden thread, tribunal scorer, annual
 * review delta, LA packs, redaction).
 *
 *  1. Section-by-section reviewer checklist — parent / SENCO / class teacher
 *     tri-checkbox per section (persisted locally).
 *  2. Evidence-to-section traceability — pin source-quotes from uploaded
 *     reports against generated needs/provisions.
 *  3. Provision costing helper — input cost per hour for each provision,
 *     auto-totals annual budget.
 *  4. One Page Profile auto-derivation from the same evidence.
 *  5. Plain-English co-production pack — rewrites Sections A and B at
 *     reading age 9 alongside the formal version.
 */

import { callAI } from "@/lib/ai";

// ─── 1. Reviewer checklist ─────────────────────────────────────────────────

export type ReviewerRole = "parent" | "senco" | "class_teacher";

export interface SectionReview {
  pupilId: string;
  sectionCode: string;     // "A".."K"
  reviewer: ReviewerRole;
  reviewedAt: string;      // ISO date
  comments?: string;
}

const REVIEW_KEY = "adaptly_iep_section_reviews_v1";

export function loadReviews(pupilId: string): SectionReview[] {
  try {
    const all = JSON.parse(localStorage.getItem(REVIEW_KEY) || "[]") as SectionReview[];
    return all.filter((r) => r.pupilId === pupilId);
  } catch { return []; }
}

export function setReview(r: SectionReview): void {
  try {
    const all = JSON.parse(localStorage.getItem(REVIEW_KEY) || "[]") as SectionReview[];
    const idx = all.findIndex((x) => x.pupilId === r.pupilId && x.sectionCode === r.sectionCode && x.reviewer === r.reviewer);
    if (idx >= 0) all[idx] = r;
    else all.push(r);
    localStorage.setItem(REVIEW_KEY, JSON.stringify(all.slice(-1000)));
  } catch {}
}

export function clearReview(pupilId: string, sectionCode: string, reviewer: ReviewerRole): void {
  try {
    const all = JSON.parse(localStorage.getItem(REVIEW_KEY) || "[]") as SectionReview[];
    const filtered = all.filter((r) => !(r.pupilId === pupilId && r.sectionCode === sectionCode && r.reviewer === reviewer));
    localStorage.setItem(REVIEW_KEY, JSON.stringify(filtered));
  } catch {}
}

export interface SectionReviewSummary {
  sectionCode: string;
  reviewers: ReviewerRole[];
  comments: { reviewer: ReviewerRole; text: string }[];
}

export function summariseReviews(pupilId: string, sectionCodes: string[]): SectionReviewSummary[] {
  const all = loadReviews(pupilId);
  return sectionCodes.map((code) => {
    const matches = all.filter((r) => r.sectionCode === code);
    return {
      sectionCode: code,
      reviewers: matches.map((m) => m.reviewer),
      comments: matches
        .filter((m) => m.comments && m.comments.trim())
        .map((m) => ({ reviewer: m.reviewer, text: m.comments || "" })),
    };
  });
}

// ─── 2. Evidence traceability ──────────────────────────────────────────────

const EVIDENCE_KEY = "adaptly_iep_evidence_pins_v1";

export interface EvidencePin {
  id: string;
  pupilId: string;
  sectionCode: string;             // A..K
  generatedSentence: string;       // the AI-generated sentence in the section
  sourceQuote: string;             // verbatim quote from the uploaded report
  sourceDocument?: string;         // filename or descriptor
  createdAt: number;
}

export function pinEvidence(p: Omit<EvidencePin, "id" | "createdAt">): EvidencePin {
  const pin: EvidencePin = {
    ...p,
    id: `pin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  };
  try {
    const all = JSON.parse(localStorage.getItem(EVIDENCE_KEY) || "[]") as EvidencePin[];
    all.push(pin);
    localStorage.setItem(EVIDENCE_KEY, JSON.stringify(all.slice(-2000)));
  } catch {}
  return pin;
}

export function listEvidencePins(pupilId: string, sectionCode?: string): EvidencePin[] {
  try {
    const all = JSON.parse(localStorage.getItem(EVIDENCE_KEY) || "[]") as EvidencePin[];
    return all.filter((p) => p.pupilId === pupilId && (!sectionCode || p.sectionCode === sectionCode));
  } catch { return []; }
}

export function deleteEvidencePin(id: string): void {
  try {
    const all = JSON.parse(localStorage.getItem(EVIDENCE_KEY) || "[]") as EvidencePin[];
    localStorage.setItem(EVIDENCE_KEY, JSON.stringify(all.filter((p) => p.id !== id)));
  } catch {}
}

/**
 * Suggest evidence pins by finding sentences in the source report that share
 * vocabulary with each generated needs/provision sentence.
 */
export interface SuggestedPin {
  generatedSentence: string;
  candidateSourceQuote: string;
  matchScore: number;
}

export function suggestPins(generatedText: string, sourceText: string, max = 8): SuggestedPin[] {
  const generated = generatedText
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 30 && s.length < 280);
  const source = sourceText
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 25 && s.length < 320);
  const out: SuggestedPin[] = [];
  for (const g of generated) {
    const gWords = new Set(
      g.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 4),
    );
    let best: { quote: string; score: number } | null = null;
    for (const s of source) {
      const sWords = s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
      let hits = 0;
      for (const w of sWords) if (gWords.has(w)) hits += 1;
      const score = hits / Math.max(1, gWords.size);
      if (!best || score > best.score) best = { quote: s, score };
    }
    if (best && best.score > 0.18) {
      out.push({ generatedSentence: g, candidateSourceQuote: best.quote, matchScore: Math.round(best.score * 100) / 100 });
    }
    if (out.length >= max) break;
  }
  return out.sort((a, b) => b.matchScore - a.matchScore);
}

// ─── 3. Provision costing helper ───────────────────────────────────────────

const COSTS_KEY = "adaptly_iep_provision_costs_v1";

export interface ProvisionCost {
  pupilId: string;
  provisionLabel: string;       // e.g. "1:1 Reading TA"
  hoursPerWeek: number;
  weeksPerYear: number;
  costPerHour: number;          // £
  notes?: string;
}

export function loadCosts(pupilId: string): ProvisionCost[] {
  try {
    const all = JSON.parse(localStorage.getItem(COSTS_KEY) || "[]") as ProvisionCost[];
    return all.filter((c) => c.pupilId === pupilId);
  } catch { return []; }
}

export function saveCost(c: ProvisionCost): void {
  try {
    const all = JSON.parse(localStorage.getItem(COSTS_KEY) || "[]") as ProvisionCost[];
    const idx = all.findIndex((x) => x.pupilId === c.pupilId && x.provisionLabel === c.provisionLabel);
    if (idx >= 0) all[idx] = c;
    else all.push(c);
    localStorage.setItem(COSTS_KEY, JSON.stringify(all));
  } catch {}
}

export function deleteCost(pupilId: string, provisionLabel: string): void {
  try {
    const all = JSON.parse(localStorage.getItem(COSTS_KEY) || "[]") as ProvisionCost[];
    const filtered = all.filter((c) => !(c.pupilId === pupilId && c.provisionLabel === provisionLabel));
    localStorage.setItem(COSTS_KEY, JSON.stringify(filtered));
  } catch {}
}

export function annualCost(c: ProvisionCost): number {
  return c.hoursPerWeek * c.weeksPerYear * c.costPerHour;
}

export function totalAnnualCost(pupilId: string): number {
  return loadCosts(pupilId).reduce((sum, c) => sum + annualCost(c), 0);
}

/**
 * Suggest provision labels by extracting phrases from Section F that look
 * like provisions (start with a noun like "1:1", "Daily", "Weekly", etc.).
 */
export function suggestProvisionLabels(sectionFText: string, max = 8): string[] {
  const lines = sectionFText
    .split(/\n+/)
    .map((l) => l.replace(/^[\s\-•*\d.)]+/, "").trim())
    .filter((l) => l.length > 12 && l.length < 160);
  const out: string[] = [];
  for (const l of lines) {
    if (/(daily|weekly|fortnightly|once|twice|every|per\s+week)/i.test(l) || /^\d+\s*[:x]/i.test(l) || /^(specialist|trained|qualified)/i.test(l)) {
      // Take the first 60 chars as the label.
      out.push(l.slice(0, 60).replace(/\s+/g, " ").trim());
    }
    if (out.length >= max) break;
  }
  return Array.from(new Set(out));
}

export function costsTableHtml(pupilName: string, costs: ProvisionCost[]): string {
  const total = costs.reduce((s, c) => s + annualCost(c), 0);
  return `<div style="font-family:Arial,sans-serif;">
    <h2 style="font-size:14pt;margin:0 0 8px;color:#1e40af;">Provision costing — ${escapeHtml(pupilName)}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:11pt;">
      <thead>
        <tr style="background:#dbeafe;">
          <th style="text-align:left;padding:6px;border:1px solid #93c5fd;">Provision</th>
          <th style="text-align:right;padding:6px;border:1px solid #93c5fd;">Hrs/wk</th>
          <th style="text-align:right;padding:6px;border:1px solid #93c5fd;">Wks/yr</th>
          <th style="text-align:right;padding:6px;border:1px solid #93c5fd;">£/hr</th>
          <th style="text-align:right;padding:6px;border:1px solid #93c5fd;">Annual</th>
        </tr>
      </thead>
      <tbody>
        ${costs.map((c) => `<tr>
          <td style="padding:6px;border:1px solid #cbd5e1;">${escapeHtml(c.provisionLabel)}</td>
          <td style="padding:6px;border:1px solid #cbd5e1;text-align:right;">${c.hoursPerWeek}</td>
          <td style="padding:6px;border:1px solid #cbd5e1;text-align:right;">${c.weeksPerYear}</td>
          <td style="padding:6px;border:1px solid #cbd5e1;text-align:right;">£${c.costPerHour.toFixed(2)}</td>
          <td style="padding:6px;border:1px solid #cbd5e1;text-align:right;font-weight:700;">£${annualCost(c).toFixed(2)}</td>
        </tr>`).join("")}
        <tr style="background:#fef3c7;">
          <td colspan="4" style="padding:6px;border:1px solid #fbbf24;text-align:right;font-weight:800;">Total annual budget</td>
          <td style="padding:6px;border:1px solid #fbbf24;text-align:right;font-weight:800;">£${total.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// ─── 4. One Page Profile auto-derivation ───────────────────────────────────

export interface OnePageProfile {
  whatPeopleAdmire: string[];
  whatIsImportantToMe: string[];
  howBestToSupportMe: string[];
}

/**
 * Derive a One Page Profile from sections A & B of the EHCP.
 */
export async function deriveOnePageProfile(args: {
  pupilName: string;
  sectionA: string;
  sectionB: string;
}): Promise<OnePageProfile> {
  const system =
    "You are an expert SENCO writing a person-centred One Page Profile from an EHCP draft. The profile is pupil-facing — friendly, strengths-first, written in the second person where appropriate. Return strictly valid JSON.";
  const user = `Derive a One Page Profile for ${args.pupilName}.

Section A (Views and aspirations):
${args.sectionA}

Section B (Special educational needs):
${args.sectionB}

Return JSON exactly like:
{
  "whatPeopleAdmire": ["3-5 strengths-based bullet points"],
  "whatIsImportantToMe": ["3-5 short personal-priority bullets"],
  "howBestToSupportMe": ["3-5 specific, practical support strategies"]
}

Each bullet under 18 words. Avoid jargon. Strengths-first.`;
  const { text } = await callAI(system, user, 700);
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const obj = JSON.parse(cleaned);
    return {
      whatPeopleAdmire: Array.isArray(obj.whatPeopleAdmire) ? obj.whatPeopleAdmire : [],
      whatIsImportantToMe: Array.isArray(obj.whatIsImportantToMe) ? obj.whatIsImportantToMe : [],
      howBestToSupportMe: Array.isArray(obj.howBestToSupportMe) ? obj.howBestToSupportMe : [],
    };
  } catch {
    return { whatPeopleAdmire: [], whatIsImportantToMe: [], howBestToSupportMe: [] };
  }
}

export function onePageProfileHtml(pupilName: string, profile: OnePageProfile): string {
  return `<style>
    .opp { font-family: Arial, sans-serif; padding: 12mm; max-width: 210mm; }
    .opp h1 { font-size: 18pt; margin: 0 0 4mm; }
    .opp .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5mm; }
    .opp .cell { background: #fff; border: 1.5px solid #6366f1; border-radius: 3mm; padding: 4mm; }
    .opp .cell h2 { font-size: 12pt; margin: 0 0 3mm; color: #4338ca; }
    .opp ul { margin: 0; padding-left: 4mm; font-size: 10pt; line-height: 1.5; }
  </style>
  <div class="opp">
    <h1>One Page Profile — ${escapeHtml(pupilName)}</h1>
    <div class="grid">
      <div class="cell">
        <h2>What people admire about me</h2>
        <ul>${profile.whatPeopleAdmire.map((s) => `<li>${escapeHtml(s)}</li>`).join("") || "<li>(generate to populate)</li>"}</ul>
      </div>
      <div class="cell">
        <h2>What is important to me</h2>
        <ul>${profile.whatIsImportantToMe.map((s) => `<li>${escapeHtml(s)}</li>`).join("") || "<li>(generate to populate)</li>"}</ul>
      </div>
      <div class="cell">
        <h2>How best to support me</h2>
        <ul>${profile.howBestToSupportMe.map((s) => `<li>${escapeHtml(s)}</li>`).join("") || "<li>(generate to populate)</li>"}</ul>
      </div>
    </div>
  </div>`;
}

// ─── 5. Plain-English co-production pack ───────────────────────────────────

export interface PlainEnglishPack {
  sectionAPlain: string;
  sectionBPlain: string;
  targetReadingAge: number;
}

/**
 * Re-write Sections A and B at reading age 9.
 */
export async function buildPlainEnglishPack(args: {
  sectionA: string;
  sectionB: string;
  pupilName: string;
}): Promise<PlainEnglishPack> {
  const system =
    "You are a plain-English specialist writing for a parent who reads at UK reading age 9 (Year 4). Use short sentences (max 12 words). Use everyday words. Define every technical term in brackets the first time. Return valid JSON.";
  const user = `Rewrite these EHCP sections in plain English for the parents of ${args.pupilName}. Keep all the meaning, but make it easy to read.

Section A (formal):
${args.sectionA}

Section B (formal):
${args.sectionB}

Return JSON exactly:
{
  "sectionAPlain": "rewritten Section A — short sentences, everyday words",
  "sectionBPlain": "rewritten Section B — short sentences, everyday words"
}`;
  const { text } = await callAI(system, user, 1500);
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const obj = JSON.parse(cleaned);
    return {
      sectionAPlain: typeof obj.sectionAPlain === "string" ? obj.sectionAPlain : "",
      sectionBPlain: typeof obj.sectionBPlain === "string" ? obj.sectionBPlain : "",
      targetReadingAge: 9,
    };
  } catch {
    return { sectionAPlain: "", sectionBPlain: "", targetReadingAge: 9 };
  }
}

export function plainPackHtml(pupilName: string, pack: PlainEnglishPack): string {
  return `<div style="font-family:Arial,sans-serif;padding:14mm;max-width:210mm;">
    <h1 style="font-size:16pt;color:#0f766e;margin:0 0 5mm;">Plain-English summary — ${escapeHtml(pupilName)}</h1>
    <p style="font-size:10pt;color:#0f766e;font-style:italic;margin:0 0 8mm;">Written at approximately UK reading age ${pack.targetReadingAge}. Keep alongside the formal plan.</p>
    <h2 style="font-size:13pt;color:#134e4a;margin:0 0 3mm;">Section A — About ${escapeHtml(pupilName)}</h2>
    <p style="font-size:11pt;line-height:1.6;color:#1f2937;white-space:pre-wrap;">${escapeHtml(pack.sectionAPlain || "(not generated)")}</p>
    <h2 style="font-size:13pt;color:#134e4a;margin:6mm 0 3mm;">Section B — What ${escapeHtml(pupilName)} needs</h2>
    <p style="font-size:11pt;line-height:1.6;color:#1f2937;white-space:pre-wrap;">${escapeHtml(pack.sectionBPlain || "(not generated)")}</p>
  </div>`;
}
