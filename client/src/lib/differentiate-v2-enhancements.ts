/**
 * differentiate-v2-enhancements.ts
 *
 * Five further improvements layered onto Differentiate, separate from
 * `differentiate-enhancements.ts` (OCR, multi-need stacking, source-respecting,
 * reading-age dial, paragraph diff utility).
 *
 * Implemented here:
 *  1. Side-by-side diff renderer — renders the existing `diffAdaptation()` output
 *     as a two-column view with colour-coded change tags and rationales.
 *  2. "Show me why" rationale panel — single AI call returns one paragraph
 *     justifying the adaptation choices in plain-English; cached locally.
 *  3. Dual-output composer — calls the AI twice (Support + Stretch) and merges
 *     the responses into a labelled markdown payload.
 *  4. Reading overlay live preview — converts a Differentiate result to a
 *     ready-to-print HTML string with the chosen overlay applied.
 *  5. Symbol/icon support pack — auto-suggests Widgit-style symbol slots based
 *     on Tier-2/3 nouns in the differentiated text.
 */

import { diffAdaptation, type AdaptationParagraph } from "@/lib/differentiate-enhancements";
import { aiDifferentiateTask, callAI } from "@/lib/ai";

// ─── 1. Side-by-side diff renderer ──────────────────────────────────────────

const KIND_COLOURS: Record<string, { bg: string; border: string; label: string; emoji: string }> = {
  "vocab-swap":        { bg: "#fef9c3", border: "#facc15", label: "Vocab",    emoji: "📚" },
  "sentence-shorter":  { bg: "#dcfce7", border: "#22c55e", label: "Shorter",  emoji: "✂️" },
  "scaffold-added":    { bg: "#dbeafe", border: "#3b82f6", label: "Scaffold", emoji: "🪜" },
  "scaffold-stem":     { bg: "#e0e7ff", border: "#6366f1", label: "Stem",     emoji: "💬" },
  "image-cue":         { bg: "#fae8ff", border: "#a855f7", label: "Visual",   emoji: "🖼️" },
  "removed":           { bg: "#fee2e2", border: "#ef4444", label: "Removed",  emoji: "🗑️" },
  "added":             { bg: "#cffafe", border: "#06b6d4", label: "Added",    emoji: "➕" },
  "unchanged":         { bg: "#f3f4f6", border: "#d1d5db", label: "Same",     emoji: "·"  },
};

export function renderDiffAsHtml(rows: AdaptationParagraph[]): string {
  return `
<div style="font-family:Arial,sans-serif;">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
    <div style="font-weight:800;color:#475569;text-transform:uppercase;font-size:11px;letter-spacing:0.04em;">Original</div>
    <div style="font-weight:800;color:#0f172a;text-transform:uppercase;font-size:11px;letter-spacing:0.04em;">Adapted</div>
  </div>
  ${rows.map((r) => {
    const cfg = KIND_COLOURS[r.kind] || KIND_COLOURS.unchanged;
    return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;">
      <div style="background:${r.kind === "removed" ? cfg.bg : "#fff"};border:1px solid ${r.kind === "removed" ? cfg.border : "#e5e7eb"};border-radius:8px;padding:8px;font-size:12px;line-height:1.5;color:#475569;">
        ${escapeHtml(r.before || "—")}
      </div>
      <div style="background:${cfg.bg};border:2px solid ${cfg.border};border-radius:8px;padding:8px;font-size:12px;line-height:1.5;color:#0f172a;">
        <span style="display:inline-block;background:${cfg.border};color:#fff;border-radius:10px;padding:0 8px;font-size:10px;font-weight:700;margin-right:4px;">${cfg.emoji} ${cfg.label}</span>
        ${escapeHtml(r.after || "—")}
        ${r.rationale ? `<div style="margin-top:4px;font-size:10px;color:#475569;font-style:italic;">${escapeHtml(r.rationale)}</div>` : ""}
      </div>
    </div>`;
  }).join("")}
</div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

/** Convenience — diff + render in one call. */
export function buildDiffView(before: string, after: string): {
  rows: AdaptationParagraph[];
  html: string;
  summary: { vocab: number; shorter: number; scaffold: number; visual: number; added: number; removed: number };
} {
  const rows = diffAdaptation(before, after);
  const summary = { vocab: 0, shorter: 0, scaffold: 0, visual: 0, added: 0, removed: 0 };
  for (const r of rows) {
    if (r.kind === "vocab-swap") summary.vocab++;
    else if (r.kind === "sentence-shorter") summary.shorter++;
    else if (r.kind === "scaffold-added" || r.kind === "scaffold-stem") summary.scaffold++;
    else if (r.kind === "image-cue") summary.visual++;
    else if (r.kind === "added") summary.added++;
    else if (r.kind === "removed") summary.removed++;
  }
  return { rows, html: renderDiffAsHtml(rows), summary };
}

// ─── 2. "Show me why" rationale panel ───────────────────────────────────────

const RATIONALE_KEY = "adaptly_diff_rationales_v1";

function rationaleKey(beforeHash: string, afterHash: string): string {
  return `${beforeHash}::${afterHash}`;
}

function quickHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

export async function explainAdaptation(before: string, after: string): Promise<string> {
  const key = rationaleKey(quickHash(before), quickHash(after));
  try {
    const cache = JSON.parse(localStorage.getItem(RATIONALE_KEY) || "{}");
    if (cache[key]) return cache[key];
  } catch {}

  const system =
    "You are an expert SEND teacher writing a one-paragraph explanation of why a task was adapted. Be specific about the changes you observe (sentence length, vocabulary tier, scaffolding, visual cues). 90 words maximum. Plain prose — no bullet points.";
  const user = `ORIGINAL TASK:\n${before}\n\nADAPTED TASK:\n${after}\n\nWrite a 90-word teacher-facing rationale. Reference concrete differences like average sentence length (estimate it), scaffolding added, or vocabulary swapped.`;
  const { text } = await callAI(system, user, 400);
  const trimmed = text.trim();

  try {
    const cache = JSON.parse(localStorage.getItem(RATIONALE_KEY) || "{}");
    cache[key] = trimmed;
    localStorage.setItem(RATIONALE_KEY, JSON.stringify(cache));
  } catch {}
  return trimmed;
}

// ─── 3. Dual-output composer ────────────────────────────────────────────────

export interface DualOutputArgs {
  taskContent: string;
  yearGroup: string;
  subject: string;
  sendNeed?: string;
}

export async function differentiateDual(args: DualOutputArgs): Promise<string> {
  const support = await aiDifferentiateTask({
    taskContent: args.taskContent,
    yearGroup: args.yearGroup,
    subject: args.subject,
    sendNeed: args.sendNeed,
  });

  const stretchSystem =
    "You are an expert teacher writing the STRETCH/EXTENSION version of a task. Keep the same context but raise the cognitive demand: open-ended questions, multi-step problems, justification required, vocabulary at one Bloom level higher. Return only the rewritten task.";
  const stretchUser = `ORIGINAL TASK:\n${args.taskContent}\n\nYear group: ${args.yearGroup}\nSubject: ${args.subject}\n\nReturn the stretch version in markdown.`;
  const { text: stretchText } = await callAI(stretchSystem, stretchUser, 1500);

  return [
    "## Support version",
    "",
    support.differentiatedContent.trim(),
    "",
    "---",
    "",
    "## Stretch version",
    "",
    stretchText.trim(),
  ].join("\n");
}

// ─── 4. Reading overlay live preview ────────────────────────────────────────

export const PRINT_OVERLAY_COLOURS = {
  none:      "#ffffff",
  cream:     "#fffacd",
  blue:      "#cce5ff",
  green:     "#d4edda",
  yellow:    "#fff3cd",
  pink:      "#ffd6e0",
  lavender:  "#e6dcff",
  grey:      "#e9ecef",
} as const;

export type OverlayId = keyof typeof PRINT_OVERLAY_COLOURS;

export function buildOverlayPreviewHtml(text: string, overlay: OverlayId, fontSizePx = 14): string {
  const bg = PRINT_OVERLAY_COLOURS[overlay] || "#ffffff";
  const escaped = escapeHtml(text)
    .replace(/\n\n/g, "</p><p style='margin:0 0 8px;'>")
    .replace(/\n/g, "<br/>");
  return `<div style="background:${bg};padding:18px 22px;font-family:Arial,sans-serif;font-size:${fontSizePx}px;line-height:1.7;color:#0f172a;border-radius:8px;border:1px solid #e5e7eb;"><p style="margin:0 0 8px;">${escaped}</p></div>`;
}

// ─── 5. Symbol/icon support pack ────────────────────────────────────────────

const SYMBOL_HINTS = new Set([
  "school", "classroom", "teacher", "student", "book", "pencil", "paper",
  "computer", "tablet", "chair", "desk", "bag", "lunch", "break", "playground",
  "home", "family", "mother", "father", "brother", "sister", "friend",
  "happy", "sad", "angry", "tired", "hungry", "thirsty", "scared",
  "yes", "no", "stop", "go", "wait", "listen", "look", "read", "write",
  "morning", "afternoon", "evening", "today", "tomorrow", "yesterday",
  "table", "chair", "door", "window", "toilet", "kitchen", "bathroom",
]);

export interface SymbolSlot {
  word: string;
  context: string;
  suggestedQuery: string;   // for a Widgit-style search
}

/** Pull words from the adapted task that warrant a symbol cue. */
export function suggestSymbolSlots(adaptedText: string, max = 12): SymbolSlot[] {
  const out: SymbolSlot[] = [];
  const seen = new Set<string>();
  const sentences = adaptedText.split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    for (const w of sentence.split(/\s+/)) {
      const stripped = w.replace(/[^A-Za-z']/g, "").toLowerCase();
      if (
        stripped.length > 2 &&
        SYMBOL_HINTS.has(stripped) &&
        !seen.has(stripped)
      ) {
        seen.add(stripped);
        out.push({
          word: stripped,
          context: sentence.trim(),
          suggestedQuery: `widgit ${stripped}`,
        });
        if (out.length >= max) return out;
      }
    }
  }
  return out;
}

export function symbolPackAsHtml(slots: SymbolSlot[]): string {
  if (slots.length === 0) {
    return `<p style="font-family:Arial,sans-serif;font-size:11px;color:#64748b;font-style:italic;">No common-curriculum symbol slots detected. Add manually or run after a fuller adaptation.</p>`;
  }
  return `<div style="font-family:Arial,sans-serif;border:1.5px dashed #a855f7;border-radius:10px;padding:10px;background:#faf5ff;">
    <div style="font-weight:800;font-size:12px;color:#6b21a8;margin-bottom:6px;">Symbol / icon support pack — ${slots.length} suggestion${slots.length === 1 ? "" : "s"}</div>
    <ul style="margin:0;padding-left:0;list-style:none;display:grid;grid-template-columns:repeat(2,1fr);gap:5px;font-size:11px;">
      ${slots.map((s) => `<li style="background:#fff;border:1px solid #e9d5ff;border-radius:6px;padding:6px 8px;">
        <strong style="color:#6b21a8;">${escapeHtml(s.word)}</strong>
        <span style="display:block;font-size:10px;color:#64748b;font-style:italic;margin-top:2px;">"${escapeHtml(s.context)}"</span>
        <span style="display:block;font-size:10px;color:#a855f7;margin-top:2px;">Search: ${escapeHtml(s.suggestedQuery)}</span>
      </li>`).join("")}
    </ul>
  </div>`;
}
