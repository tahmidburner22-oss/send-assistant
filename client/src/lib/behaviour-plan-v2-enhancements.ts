/**
 * behaviour-plan-v2-enhancements.ts
 *
 * Five additional improvements layered onto Behaviour Support Plans, separate
 * from the older `behaviour-enhancements.ts` module which covers ABC logging,
 * lanyard cards, restraint compliance, TA-share, and review scheduling.
 *
 * Implemented here:
 *  1. Function-of-behaviour structured picker (Escape / Sensory / Attention /
 *     Tangible) — injected into the AI prompt.
 *  2. Green/Amber/Red reactive strategies hierarchy — extracted from the
 *     generated plan and renderable as a 3-column card.
 *  3. Pupil-voice mini intake — captured as a small structured JSON, then
 *     injected into the AI prompt as first-person quotes.
 *  4. One-page staff briefing card — a compacted print-ready HTML view of the
 *     plan distilled to its actionable lines.
 *  5. ABC heatmap — aggregates the ABC entries from the existing
 *     behaviour-enhancements module into a period × day-of-week grid that the
 *     panel renders as a heatmap.
 */

import { listABC } from "@/lib/behaviour-enhancements";

// ─── 1. Function-of-behaviour ───────────────────────────────────────────────

export type BehaviourFunction = "escape" | "sensory" | "attention" | "tangible";

export const FUNCTION_LABELS: Record<BehaviourFunction, string> = {
  escape: "Escape / Avoidance",
  sensory: "Sensory regulation",
  attention: "Attention seeking",
  tangible: "Access to a tangible (toy / activity / food)",
};

export const FUNCTION_DESCRIPTIONS: Record<BehaviourFunction, string> = {
  escape:
    "The behaviour helps the pupil get away from a demand, person or environment they find aversive.",
  sensory:
    "The behaviour produces a sensory input the pupil seeks (or reduces an input they find overwhelming).",
  attention:
    "The behaviour reliably brings adult or peer attention, even if that attention is corrective.",
  tangible:
    "The behaviour helps the pupil obtain a desired object, food, activity or location.",
};

/** Build a prompt fragment that primes the AI to write the plan around the
 *  selected function-of-behaviour, instead of guessing it. */
export function buildFunctionPromptFragment(fns: BehaviourFunction[]): string {
  if (!fns || fns.length === 0) return "";
  const lines = fns
    .map((f) => `• ${FUNCTION_LABELS[f]} — ${FUNCTION_DESCRIPTIONS[f]}`)
    .join("\n");
  return [
    "FUNCTION OF BEHAVIOUR (teacher-confirmed — do NOT contradict):",
    lines,
    "Anchor Section 3 (Function of Behaviour) and the Teaching Replacement Behaviours section in Section 6 to these function(s) specifically.",
  ].join("\n");
}

// ─── 2. Green/Amber/Red reactive hierarchy ──────────────────────────────────

export interface ReactiveTier {
  tier: "green" | "amber" | "red";
  label: string;
  description: string;
  strategies: string[];
}

const TIER_LABELS = {
  green: "Green — Early / Settled",
  amber: "Amber — Escalating",
  red: "Red — Crisis",
};

const TIER_DESCRIPTIONS = {
  green: "Pupil is regulated. Use proactive supports and connection.",
  amber: "Pupil is showing warning signs. De-escalate and reduce demands.",
  red: "Pupil is in crisis. Ensure safety, follow named-staff protocol.",
};

export const REACTIVE_TIER_PROMPT_FRAGMENT = `
Format Section 7 (Response Strategies) as a 3-tier hierarchy. Use these EXACT subheadings on their own lines so the renderer can detect them:

**GREEN — Early / Settled**
(3–5 bullet strategies for proactive support and connection while the pupil is regulated)

**AMBER — Escalating**
(3–5 bullet strategies for de-escalation, demand reduction and adult presence)

**RED — Crisis**
(3–5 bullet strategies for safety, named-staff response, and post-incident steps)

Keep each bullet a single concrete action a TA can perform without a script.
`.trim();

/**
 * Extract the Green/Amber/Red tier strategies from a generated plan. Returns
 * three tiers with empty `strategies[]` arrays when not detected (the panel
 * shows a "regenerate plan to enable" hint in that case).
 */
export function extractReactiveTiers(text: string): ReactiveTier[] {
  const tiers: ReactiveTier[] = (
    [
      { tier: "green", regex: /\*\*\s*GREEN[^\*]*?\*\*([\s\S]*?)(?=\*\*\s*AMBER|\*\*\s*RED|$)/i },
      { tier: "amber", regex: /\*\*\s*AMBER[^\*]*?\*\*([\s\S]*?)(?=\*\*\s*RED|\*\*\s*GREEN|$)/i },
      { tier: "red",   regex: /\*\*\s*RED[^\*]*?\*\*([\s\S]*?)(?=\*\*\s*GREEN|\*\*\s*AMBER|$)/i },
    ] as const
  ).map(({ tier, regex }) => {
    const m = text.match(regex);
    const body = (m?.[1] || "").trim();
    const strategies = body
      .split(/\n+/)
      .map((l) => l.replace(/^[-•*\d\.\)\s]+/, "").trim())
      .filter((l) => l.length > 6);
    return {
      tier: tier as "green" | "amber" | "red",
      label: TIER_LABELS[tier as "green" | "amber" | "red"],
      description: TIER_DESCRIPTIONS[tier as "green" | "amber" | "red"],
      strategies: strategies.slice(0, 8),
    };
  });
  return tiers;
}

export function reactiveTiersAsHtml(tiers: ReactiveTier[]): string {
  const colour = { green: "#16a34a", amber: "#d97706", red: "#dc2626" } as const;
  const bg     = { green: "#dcfce7", amber: "#fef3c7", red: "#fee2e2" } as const;
  return `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-family:Arial,sans-serif;">
    ${tiers.map((t) => `
      <div style="border:2px solid ${colour[t.tier]};border-radius:10px;overflow:hidden;">
        <div style="background:${colour[t.tier]};color:#fff;padding:8px 10px;font-weight:800;font-size:12px;">${t.label}</div>
        <div style="background:${bg[t.tier]};padding:8px 10px;font-size:11px;">
          <div style="color:#374151;margin-bottom:4px;font-style:italic;">${t.description}</div>
          <ul style="margin:0;padding-left:14px;">
            ${t.strategies.length === 0
              ? `<li style="color:#9ca3af;">(re-generate plan with Green/Amber/Red toggle)</li>`
              : t.strategies.map((s) => `<li style="margin:2px 0;">${escapeHtml(s)}</li>`).join("")}
          </ul>
        </div>
      </div>
    `).join("")}
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// ─── 3. Pupil voice mini intake ─────────────────────────────────────────────

export interface PupilVoice {
  whatHelps: string;          // "What helps you when you are upset?"
  whatTriggers: string;       // "What makes things harder for you?"
  whoToCallOn: string;        // "Who do you trust to help?"
}

export function buildPupilVoicePromptFragment(v: PupilVoice | null): string {
  if (!v) return "";
  const filled = [v.whatHelps, v.whatTriggers, v.whoToCallOn].filter((x) => x.trim()).length;
  if (filled === 0) return "";
  return [
    "PUPIL VOICE (use these as direct first-person quotes inside Section 1 — Student Profile):",
    v.whatHelps   ? `• When asked what helps: "${v.whatHelps.trim()}"` : "",
    v.whatTriggers ? `• When asked what is hard: "${v.whatTriggers.trim()}"` : "",
    v.whoToCallOn ? `• When asked who they trust: "${v.whoToCallOn.trim()}"` : "",
    "Do NOT paraphrase these quotes — copy them verbatim, in inverted commas.",
  ].filter(Boolean).join("\n");
}

const PUPIL_VOICE_KEY = "adaptly_bsp_pupil_voice_v1";

export function savePupilVoice(pupilId: string, voice: PupilVoice): void {
  try {
    const all = JSON.parse(localStorage.getItem(PUPIL_VOICE_KEY) || "{}");
    all[pupilId] = voice;
    localStorage.setItem(PUPIL_VOICE_KEY, JSON.stringify(all));
  } catch {}
}

export function loadPupilVoice(pupilId: string): PupilVoice | null {
  try {
    const all = JSON.parse(localStorage.getItem(PUPIL_VOICE_KEY) || "{}");
    return all[pupilId] || null;
  } catch {
    return null;
  }
}

// ─── 4. One-page staff briefing card ────────────────────────────────────────

export function buildStaffBriefingHtml(bspText: string, pupilName: string): string {
  // Pull headline lines from each section so the briefing is < 1 A4 page.
  const sectionMatches = [
    { rx: /Function of Behaviour[^\n]*\n([\s\S]*?)(?=\n\d+\.|\n#{1,3}|$)/i,    label: "Function" },
    { rx: /Triggers[^\n]*\n([\s\S]*?)(?=\n\d+\.|\n#{1,3}|$)/i,                 label: "Triggers" },
    { rx: /Preventative Strategies[^\n]*\n([\s\S]*?)(?=\n\d+\.|\n#{1,3}|$)/i,  label: "Prevent" },
    { rx: /Response Strategies[^\n]*\n([\s\S]*?)(?=\n\d+\.|\n#{1,3}|$)/i,      label: "Respond" },
    { rx: /Reward[^\n]*\n([\s\S]*?)(?=\n\d+\.|\n#{1,3}|$)/i,                   label: "Reward" },
    { rx: /Crisis[^\n]*\n([\s\S]*?)(?=\n\d+\.|\n#{1,3}|$)/i,                   label: "Crisis" },
  ];

  const cells = sectionMatches.map(({ rx, label }) => {
    const m = bspText.match(rx);
    const body = (m?.[1] || "").trim();
    const top3 = body
      .split(/\n+/)
      .filter((l) => /^[-•*]/.test(l) || /^\d+\./.test(l))
      .slice(0, 3)
      .map((l) => l.replace(/^[-•*\d\.\s]+/, "").trim());
    return { label, top3: top3.length ? top3 : [body.slice(0, 120) + (body.length > 120 ? "…" : "")] };
  });

  return `<style>
    .briefing { font-family: Arial, sans-serif; padding: 16mm; max-width: 210mm; }
    .briefing h1 { font-size: 16pt; margin: 0 0 4mm; color: #b45309; }
    .briefing .row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6mm; }
    .briefing .cell { border: 1px solid #d1d5db; border-radius: 3mm; padding: 4mm; background: #fffbeb; page-break-inside: avoid; }
    .briefing h2 { font-size: 11pt; margin: 0 0 2mm; color: #b45309; border-bottom: 1px solid #fbbf24; padding-bottom: 1mm; }
    .briefing ul { margin: 0; padding-left: 4mm; font-size: 10pt; line-height: 1.45; color: #374151; }
    .briefing .footer { font-size: 8pt; color: #6b7280; margin-top: 5mm; text-align: center; }
  </style>
  <div class="briefing">
    <h1>${escapeHtml(pupilName)} — Behaviour briefing card</h1>
    <div class="row">
      ${cells.map(({ label, top3 }) => `
        <div class="cell">
          <h2>${label}</h2>
          <ul>${top3.map((s) => `<li>${escapeHtml(s)}</li>`).join("") || "<li>(see full plan)</li>"}</ul>
        </div>
      `).join("")}
    </div>
    <div class="footer">Briefing only — read the full Behaviour Support Plan in the SENCO folder.</div>
  </div>`;
}

// ─── 5. ABC heatmap ─────────────────────────────────────────────────────────

const PERIODS = ["Before school", "AM 1", "AM 2", "Break", "AM 3", "Lunch", "PM 1", "PM 2"] as const;
const DAYS    = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

export interface HeatmapCell {
  day: typeof DAYS[number];
  period: typeof PERIODS[number];
  count: number;
}

/** Approximates the period from an ISO time-of-day string (HH:MM). */
function classifyPeriod(timeStr?: string): typeof PERIODS[number] {
  if (!timeStr) return "AM 1";
  const [h] = timeStr.split(":").map(Number);
  if (h < 9)  return "Before school";
  if (h < 10) return "AM 1";
  if (h < 11) return "AM 2";
  if (h < 11.5) return "Break";
  if (h < 12) return "AM 3";
  if (h < 13) return "Lunch";
  if (h < 14.5) return "PM 1";
  return "PM 2";
}

function classifyDay(dateStr: string): typeof DAYS[number] | null {
  const d = new Date(dateStr);
  const idx = d.getDay(); // 0 = Sun, 1 = Mon, ...
  if (idx < 1 || idx > 5) return null;
  return DAYS[idx - 1];
}

export function buildAbcHeatmap(pupilId: string): HeatmapCell[] {
  const entries = listABC(pupilId);
  const grid: HeatmapCell[] = [];
  for (const day of DAYS) {
    for (const period of PERIODS) {
      grid.push({ day, period, count: 0 });
    }
  }
  for (const e of entries) {
    const day = classifyDay(e.date);
    if (!day) continue;
    // The ABCEntry interface doesn't carry a time, so we slot all entries into
    // a default period. If a later schema adds time, this can be `(e as any).time`.
    const period = classifyPeriod((e as { time?: string }).time);
    const cell = grid.find((c) => c.day === day && c.period === period);
    if (cell) cell.count += 1;
  }
  return grid;
}

export const HEATMAP_DAYS = DAYS;
export const HEATMAP_PERIODS = PERIODS;
