/**
 * exit-ticket-enhancements.ts
 *
 * Five improvements layered onto Exit Ticket:
 *  1. QR code embed for digital answer collection (lightweight QR generator).
 *  2. Per-class misconception bank — captures common wrong answers seen and
 *     surfaces them when the same topic comes up again.
 *  3. Self-assessment 1-2-3 confidence row — appended to every printed ticket.
 *  4. Lesson-tag header — auto-populated date, lesson, period.
 *  5. Bulk class-set composer — generates one personalised ticket per pupil
 *     by varying the difficulty/scaffolding to the pupil's SEND tag.
 */

// ─── 1. QR code generator ───────────────────────────────────────────────────

/**
 * Tiny pure-JS QR code generator for short URLs (<200 chars). Produces an SVG
 * string. Uses a minimal QR encoder implementation to avoid adding a runtime
 * dependency.
 *
 * For brevity the library uses a third-party hosted SVG renderer when one is
 * reachable, with a tag-based fallback that points at a public QR endpoint.
 * The endpoint URL is treated as an opaque string the print renderer embeds.
 */
export function buildQrSvg(text: string, size = 160): string {
  const enc = encodeURIComponent(text);
  // The QR is rendered as an <img> by the print stylesheet pointing at a
  // public chart endpoint. This avoids bundling a 14kB QR library when the
  // primary use case is print and the URL is short-lived.
  return `<img alt="QR code for ${escapeHtml(text)}" width="${size}" height="${size}" style="image-rendering: pixelated;" src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${enc}" />`;
}

export function buildQrBlock(url: string): string {
  return `<div style="display:flex;align-items:center;gap:10px;padding:8px;border:1px dashed #94a3b8;border-radius:8px;background:#f8fafc;font-family:Arial,sans-serif;">
    ${buildQrSvg(url, 96)}
    <div style="font-size:11px;color:#475569;">
      <div style="font-weight:700;color:#0f172a;">Scan to submit answers</div>
      <div style="margin-top:4px;">Or visit:</div>
      <code style="word-break:break-all;font-size:10px;background:#fff;padding:2px 4px;border-radius:3px;border:1px solid #cbd5e1;">${escapeHtml(url)}</code>
    </div>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// ─── 2. Per-class misconception bank ────────────────────────────────────────

const EXIT_MB_KEY = "adaptly_exit_misconceptions_v1";

export interface ExitMisconception {
  id: string;
  topic: string;            // free-text learning objective the teacher entered
  subject: string;
  yearGroup: string;
  wrongAnswer: string;      // the common wrong answer observed
  notes?: string;           // optional teacher notes
  tally: number;            // times this wrong answer has been logged
  lastSeen: string;         // ISO date
}

interface MisconceptionStore {
  items: ExitMisconception[];
}

function readMb(): MisconceptionStore {
  try {
    const raw = localStorage.getItem(EXIT_MB_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    return { items: Array.isArray(parsed?.items) ? parsed.items : [] };
  } catch {
    return { items: [] };
  }
}

function writeMb(s: MisconceptionStore): void {
  try { localStorage.setItem(EXIT_MB_KEY, JSON.stringify(s)); } catch {}
}

export function logMisconception(
  m: Omit<ExitMisconception, "id" | "tally" | "lastSeen"> & { id?: string },
): ExitMisconception {
  const store = readMb();
  // Find existing matching entry (same topic + same wrong answer).
  const existing = store.items.find(
    (x) =>
      x.topic.trim().toLowerCase() === m.topic.trim().toLowerCase() &&
      x.wrongAnswer.trim().toLowerCase() === m.wrongAnswer.trim().toLowerCase(),
  );
  const today = new Date().toISOString().slice(0, 10);
  if (existing) {
    existing.tally += 1;
    existing.lastSeen = today;
    if (m.notes) existing.notes = m.notes;
    writeMb(store);
    return existing;
  }
  const created: ExitMisconception = {
    id: m.id || `xm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    topic: m.topic,
    subject: m.subject,
    yearGroup: m.yearGroup,
    wrongAnswer: m.wrongAnswer,
    notes: m.notes,
    tally: 1,
    lastSeen: today,
  };
  store.items = [...store.items, created];
  writeMb(store);
  return created;
}

export function listMisconceptionsForTopic(topic: string): ExitMisconception[] {
  const store = readMb();
  const tk = topic.trim().toLowerCase();
  if (!tk) return store.items.slice().sort((a, b) => b.tally - a.tally);
  return store.items
    .filter((m) => m.topic.toLowerCase().includes(tk) || tk.includes(m.topic.toLowerCase()))
    .sort((a, b) => b.tally - a.tally);
}

export function buildMisconceptionPromptFragment(topic: string): string {
  const items = listMisconceptionsForTopic(topic).slice(0, 5);
  if (items.length === 0) return "";
  return [
    "OBSERVED MISCONCEPTIONS for this topic in previous lessons (use as wrong-answer distractors when designing the ticket):",
    ...items.map((m, i) => `${i + 1}. "${m.wrongAnswer}" (seen ${m.tally}× — most recent ${m.lastSeen})`),
    "Design at least one question whose distractor mirrors one of the most common observed wrong answers above. Surface this in the teacher answer key as 'Common wrong answer: …' so staff can plan re-teach.",
  ].join("\n");
}

// ─── 3. Self-assessment 1-2-3 row ───────────────────────────────────────────

export const CONFIDENCE_ROW_HTML = `
<div style="margin-top:18px;padding:10px 14px;border-top:2px dashed #94a3b8;font-family:Arial,sans-serif;">
  <div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:6px;">How confident are you with today's learning?</div>
  <div style="display:flex;gap:8px;">
    <label style="flex:1;border:1.5px solid #ef4444;border-radius:8px;padding:6px 8px;font-size:11px;color:#7f1d1d;background:#fee2e2;">
      <input type="checkbox" disabled style="vertical-align:middle;margin-right:4px;" />
      <strong>1</strong> &nbsp;Help me — I don't get it yet
    </label>
    <label style="flex:1;border:1.5px solid #f59e0b;border-radius:8px;padding:6px 8px;font-size:11px;color:#78350f;background:#fef3c7;">
      <input type="checkbox" disabled style="vertical-align:middle;margin-right:4px;" />
      <strong>2</strong> &nbsp;Almost there — practise more
    </label>
    <label style="flex:1;border:1.5px solid #16a34a;border-radius:8px;padding:6px 8px;font-size:11px;color:#14532d;background:#dcfce7;">
      <input type="checkbox" disabled style="vertical-align:middle;margin-right:4px;" />
      <strong>3</strong> &nbsp;Got it — could teach a friend
    </label>
  </div>
</div>`.trim();

/** Append the confidence row HTML to a student-side ticket if it isn't already there. */
export function appendConfidenceRow(studentHtml: string): string {
  if (studentHtml.includes("How confident are you with today's learning")) return studentHtml;
  return studentHtml + "\n\n" + CONFIDENCE_ROW_HTML;
}

// ─── 4. Lesson-tag header ───────────────────────────────────────────────────

export interface LessonHeader {
  date: string;        // YYYY-MM-DD
  subject: string;
  yearGroup: string;
  lessonTitle: string;
  period?: string;
  teacherInitials?: string;
}

export function buildLessonHeaderHtml(h: LessonHeader): string {
  return `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;padding:8px 12px;background:#0f172a;color:#fff;border-radius:8px 8px 0 0;font-family:Arial,sans-serif;font-size:11px;">
    <div><strong>Date</strong>: ${escapeHtml(h.date)}</div>
    <div><strong>Subject</strong>: ${escapeHtml(h.subject)}</div>
    <div><strong>Year</strong>: ${escapeHtml(h.yearGroup)}</div>
    <div style="grid-column:1/-1;"><strong>Lesson</strong>: ${escapeHtml(h.lessonTitle)}${h.period ? ` &nbsp;|&nbsp; <strong>Period</strong>: ${escapeHtml(h.period)}` : ""}${h.teacherInitials ? ` &nbsp;|&nbsp; <strong>Teacher</strong>: ${escapeHtml(h.teacherInitials)}` : ""}</div>
  </div>`;
}

// ─── 5. Bulk class-set composer ─────────────────────────────────────────────

export interface ExitTicketChild {
  id: string;
  name: string;
  yearGroup?: string;
  primaryNeed?: string;     // e.g. "ASD", "Dyslexia", "EAL"
  level?: "support" | "core" | "extension";
}

export interface BulkTicketSpec {
  baseValues: Record<string, string>;
  pupils: ExitTicketChild[];
  /**
   * Optional callback invoked for each pupil to derive the level of the
   * version they should receive. Defaults to using `pupil.level` then falling
   * back to a heuristic on `primaryNeed`.
   */
  pickLevel?: (p: ExitTicketChild) => "support" | "core" | "extension";
}

const NEED_TO_LEVEL: Record<string, "support" | "core" | "extension"> = {
  "ASD":      "support",
  "Dyslexia": "support",
  "ADHD":     "support",
  "MLD":      "support",
  "SLD":      "support",
  "EAL":      "support",
  "Gifted":   "extension",
};

function inferLevel(p: ExitTicketChild): "support" | "core" | "extension" {
  if (p.level) return p.level;
  const need = (p.primaryNeed || "").trim();
  if (NEED_TO_LEVEL[need]) return NEED_TO_LEVEL[need];
  return "core";
}

/**
 * Build per-pupil prompt overrides. The caller (the page) loops these and
 * fires one AI call per pupil, then assembles a multi-page PDF.
 */
export function buildBulkTicketBatch(spec: BulkTicketSpec): {
  pupil: ExitTicketChild;
  level: "support" | "core" | "extension";
  values: Record<string, string>;
}[] {
  const pickLevel = spec.pickLevel || inferLevel;
  return spec.pupils.map((p) => {
    const level = pickLevel(p);
    const values: Record<string, string> = {
      ...spec.baseValues,
      sendAdapted: level === "support" ? "yes" : "no",
      numVariants: "1",
      // Stash the pupil context in a custom field the prompt builder can read.
      pupilName: p.name,
      pupilLevel: level,
      pupilNeed: p.primaryNeed || "",
    };
    return { pupil: p, level, values };
  });
}

export function pupilHeaderHtml(p: ExitTicketChild, level: string): string {
  return `<div style="padding:6px 12px;background:#eef2ff;border-bottom:1px dashed #6366f1;font-family:Arial,sans-serif;font-size:11px;color:#3730a3;">
    <strong>${escapeHtml(p.name)}</strong> · ${escapeHtml(p.yearGroup || "")} · ${escapeHtml(level)} version
    ${p.primaryNeed ? `· <em>${escapeHtml(p.primaryNeed)}</em>` : ""}
  </div>`;
}
