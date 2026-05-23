/**
 * nowNextThenBuilder.ts — PR-10 / PD11
 *
 * Thin pure wrapper around lesson-bundle.ts buildNowNextThen.
 * No LLM call, no I/O.
 */
import { buildNowNextThen, type NowNextThenStrip } from "./lesson-bundle";
export type { NowNextThenStrip };

export interface WorksheetInput {
  metadata?: Record<string, unknown>;
}

/**
 * Build a Now/Next/Then flow card from worksheet metadata.
 * Reads metadata.subject and metadata.topic, delegates to buildNowNextThen.
 */
export function buildNowNextThenForWorksheet(ws: WorksheetInput): NowNextThenStrip {
  const meta = ws.metadata || {};
  return buildNowNextThen({
    subject: typeof meta.subject === "string" ? meta.subject : undefined,
    topic: typeof meta.topic === "string" ? meta.topic : undefined,
  });
}

/**
 * Render a Now/Next/Then card as printable A6 HTML.
 */
export function nowNextThenHtml(strip: NowNextThenStrip): string {
  const box = (slot: { label: string; minutes: number; detail?: string }, color: string) =>
    `<div style="flex:1;border:2px solid ${color};border-radius:6px;padding:8px;text-align:center;">
      <h3 style="margin:0 0 4px;font-size:11pt;color:${color};">${escapeHtml(slot.label)}</h3>
      <p style="margin:0;font-size:16pt;font-weight:700;color:${color};">${slot.minutes} min</p>
      ${slot.detail ? `<p style="margin:4px 0 0;font-size:8.5pt;color:#4b5563;">${escapeHtml(slot.detail)}</p>` : ""}
    </div>`;

  return `<div style="font-family:Arial,sans-serif;padding:6mm;max-width:148mm;max-height:105mm;">
  <h2 style="font-size:13pt;margin:0 0 4mm;color:#1f2937;text-align:center;">Now / Next / Then</h2>
  <div style="display:flex;gap:4mm;">
    ${box(strip.now, "#15803d")}
    ${box(strip.next, "#1d4ed8")}
    ${box(strip.then, "#b45309")}
  </div>
  <p style="margin:4mm 0 0;font-size:8pt;color:#9ca3af;text-align:center;">Print A6 - place on pupil desk at lesson start.</p>
</div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
