/**
 * flashcards-v2-enhancements.ts
 *
 * Five improvements layered onto Flash Cards, separate from the existing
 * `flashcards-enhancements.ts` (SM-2, cloze, image-occlusion, print formats,
 * pupil-creation gate).
 *
 *  1. Leitner box mode — 5 physical-style boxes, alternative to SM-2.
 *  2. Image cards — attach image URL to the front, render under the term.
 *  3. Audio-on-flip — SpeechSynthesis read-aloud helper for front+back.
 *  4. Foldable strip print layout — A4 sheets where front/back are stacked
 *     and pupils fold the page in half so back is hidden until peek.
 *  5. Class progress export — aggregate the cards every pupil finds hardest
 *     across the class, for re-teach planning.
 */

const LEITNER_KEY = "adaptly_leitner_v1";
const IMAGE_CARDS_KEY = "adaptly_image_cards_v1";
const CLASS_PROGRESS_KEY = "adaptly_flashcards_class_v1";

// ─── 1. Leitner box mode ────────────────────────────────────────────────────

export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

/** Standard Leitner cadence — box 1 daily, 2 every 2 days, 3 weekly, 4 fortnightly, 5 monthly. */
export const LEITNER_INTERVAL_DAYS: Record<LeitnerBox, number> = {
  1: 1,
  2: 2,
  3: 7,
  4: 14,
  5: 30,
};

export interface LeitnerEntry {
  cardKey: string;
  box: LeitnerBox;
  lastSeen: number;       // ms epoch
}

export function loadLeitner(): Record<string, LeitnerEntry> {
  try { return JSON.parse(localStorage.getItem(LEITNER_KEY) || "{}"); } catch { return {}; }
}

export function saveLeitner(state: Record<string, LeitnerEntry>): void {
  try { localStorage.setItem(LEITNER_KEY, JSON.stringify(state)); } catch {}
}

/**
 * Move a card up a box on correct, back to box 1 on incorrect.
 */
export function leitnerReview(state: LeitnerEntry, correct: boolean, now = Date.now()): LeitnerEntry {
  const nextBox: LeitnerBox = correct
    ? (Math.min(5, state.box + 1) as LeitnerBox)
    : 1;
  return { ...state, box: nextBox, lastSeen: now };
}

export function newLeitnerEntry(cardKey: string): LeitnerEntry {
  return { cardKey, box: 1, lastSeen: 0 };
}

export function leitnerDueCardKeys(state: Record<string, LeitnerEntry>, now = Date.now()): string[] {
  const due: string[] = [];
  for (const e of Object.values(state)) {
    const days = LEITNER_INTERVAL_DAYS[e.box];
    if (e.lastSeen + days * 86400_000 <= now) due.push(e.cardKey);
  }
  return due;
}

/**
 * Group cards into a per-box summary for the panel.
 */
export function leitnerSummary(state: Record<string, LeitnerEntry>): Record<LeitnerBox, number> {
  const out: Record<LeitnerBox, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const e of Object.values(state)) out[e.box] += 1;
  return out;
}

// ─── 2. Image cards ─────────────────────────────────────────────────────────

export interface ImageCardAttachment {
  cardKey: string;
  imageUrl: string;
  alt?: string;
}

export function attachImage(cardKey: string, imageUrl: string, alt?: string): void {
  try {
    const all = JSON.parse(localStorage.getItem(IMAGE_CARDS_KEY) || "{}") as Record<string, ImageCardAttachment>;
    all[cardKey] = { cardKey, imageUrl, alt };
    localStorage.setItem(IMAGE_CARDS_KEY, JSON.stringify(all));
  } catch {}
}

export function getImageCard(cardKey: string): ImageCardAttachment | null {
  try {
    const all = JSON.parse(localStorage.getItem(IMAGE_CARDS_KEY) || "{}") as Record<string, ImageCardAttachment>;
    return all[cardKey] || null;
  } catch {
    return null;
  }
}

export function imageCardHtml(att: ImageCardAttachment, size = 110): string {
  return `<img src="${escapeHtml(att.imageUrl)}" alt="${escapeHtml(att.alt || "Card image")}" width="${size}" style="display:block;margin:8px auto;border-radius:6px;max-height:${size}px;object-fit:contain;" />`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// ─── 3. Audio-on-flip ──────────────────────────────────────────────────────

export function speakText(text: string, opts: { rate?: number; pitch?: number; lang?: string } = {}): void {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  try {
    const utt = new window.SpeechSynthesisUtterance(text);
    utt.rate = opts.rate ?? 0.9;
    utt.pitch = opts.pitch ?? 1.0;
    utt.lang = opts.lang ?? "en-GB";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  } catch {
    // best-effort, never throw
  }
}

export function stopSpeaking(): void {
  if (typeof window === "undefined") return;
  try { window.speechSynthesis?.cancel(); } catch {}
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
}

// ─── 4. Foldable strip print layout ────────────────────────────────────────

export interface SimpleCard {
  front: string;
  back: string;
  hint?: string;
}

/**
 * Build an A4 print layout where each strip pairs front (top half) and back
 * (bottom half) of the same card, separated by a fold line. Pupils fold the
 * sheet in half to self-test.
 */
export function buildFoldableStripsHtml(cards: SimpleCard[], opts: { columns?: number; title?: string } = {}): string {
  const columns = opts.columns ?? 2;
  const title = opts.title ?? "Foldable flash cards";
  const cells = cards.map((c, i) => `
    <div class="strip">
      <div class="front"><div class="num">#${i + 1}</div>${escapeHtml(c.front)}${c.hint ? `<div class='hint'>💡 ${escapeHtml(c.hint)}</div>` : ""}</div>
      <div class="fold-line">— fold here —</div>
      <div class="back">${escapeHtml(c.back)}</div>
    </div>
  `).join("");
  return `<style>
    @page { margin: 12mm; }
    .strip-container { display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 6mm; font-family: Arial, sans-serif; }
    .strip { border: 1.5px dashed #94a3b8; border-radius: 6px; padding: 4mm; page-break-inside: avoid; }
    .strip .front { font-weight: 700; min-height: 22mm; padding-bottom: 4mm; font-size: 13pt; }
    .strip .num { font-size: 9pt; color: #6b7280; font-weight: 400; }
    .strip .hint { font-size: 9pt; color: #6366f1; font-weight: 400; font-style: italic; margin-top: 4mm; }
    .strip .fold-line { text-align: center; color: #94a3b8; font-size: 8pt; border-top: 1.5px dashed #cbd5e1; padding: 2mm 0; }
    .strip .back { font-size: 11pt; color: #1f2937; padding-top: 4mm; min-height: 22mm; }
    h1 { font-family: Arial, sans-serif; font-size: 14pt; margin: 0 0 6mm; }
  </style>
  <h1>${escapeHtml(title)}</h1>
  <div class="strip-container">${cells}</div>`;
}

// ─── 5. Class progress export ──────────────────────────────────────────────

export interface ClassFlashProgress {
  pupilId: string;
  pupilName: string;
  cardKey: string;
  cardFront: string;
  ease?: number;          // SM-2 EF; lower = harder
  leitnerBox?: number;    // 1..5; lower = harder
  attempts: number;
  correctRate: number;    // 0..1
  lastSeen: number;
}

interface ClassProgressStore {
  items: ClassFlashProgress[];
}

function readClass(): ClassProgressStore {
  try {
    const raw = localStorage.getItem(CLASS_PROGRESS_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    return { items: Array.isArray(parsed?.items) ? parsed.items : [] };
  } catch {
    return { items: [] };
  }
}

function writeClass(s: ClassProgressStore): void {
  try { localStorage.setItem(CLASS_PROGRESS_KEY, JSON.stringify(s)); } catch {}
}

export function recordPupilProgress(p: Omit<ClassFlashProgress, "lastSeen">): void {
  const store = readClass();
  const idx = store.items.findIndex(
    (x) => x.pupilId === p.pupilId && x.cardKey === p.cardKey,
  );
  const merged: ClassFlashProgress = { ...p, lastSeen: Date.now() };
  if (idx >= 0) store.items[idx] = merged;
  else store.items.push(merged);
  writeClass(store);
}

export function listClassProgress(): ClassFlashProgress[] {
  return readClass().items;
}

export interface StuckCardSummary {
  cardKey: string;
  cardFront: string;
  pupilCount: number;
  averageEase?: number;
  averageLeitnerBox?: number;
  pupils: { name: string; ease?: number; box?: number; correctRate: number }[];
}

/**
 * Aggregate the cards multiple pupils find hard, sorted hardest-first.
 * "Hard" defined as either ease < 2.0 (SM-2) or Leitner box <= 2.
 */
export function classStuckSummary(min = 2): StuckCardSummary[] {
  const items = readClass().items;
  const groups: Record<string, ClassFlashProgress[]> = {};
  for (const it of items) {
    const stuck =
      (typeof it.ease === "number" && it.ease < 2.0) ||
      (typeof it.leitnerBox === "number" && it.leitnerBox <= 2) ||
      it.correctRate < 0.5;
    if (!stuck) continue;
    if (!groups[it.cardKey]) groups[it.cardKey] = [];
    groups[it.cardKey].push(it);
  }
  const out: StuckCardSummary[] = [];
  for (const [cardKey, rows] of Object.entries(groups)) {
    if (rows.length < min) continue;
    const eases = rows.map((r) => r.ease).filter((e): e is number => typeof e === "number");
    const boxes = rows.map((r) => r.leitnerBox).filter((b): b is number => typeof b === "number");
    out.push({
      cardKey,
      cardFront: rows[0].cardFront,
      pupilCount: rows.length,
      averageEase: eases.length ? eases.reduce((a, b) => a + b, 0) / eases.length : undefined,
      averageLeitnerBox: boxes.length ? boxes.reduce((a, b) => a + b, 0) / boxes.length : undefined,
      pupils: rows.map((r) => ({
        name: r.pupilName,
        ease: r.ease,
        box: r.leitnerBox,
        correctRate: r.correctRate,
      })),
    });
  }
  // Sort hardest-first by pupilCount, then by lowest ease/box.
  return out.sort((a, b) => {
    if (b.pupilCount !== a.pupilCount) return b.pupilCount - a.pupilCount;
    const ae = a.averageEase ?? a.averageLeitnerBox ?? 99;
    const be = b.averageEase ?? b.averageLeitnerBox ?? 99;
    return ae - be;
  });
}

export function classStuckSummaryAsCsv(summary: StuckCardSummary[]): string {
  const header = "Card,Pupils stuck,Avg ease,Avg Leitner box,Pupils";
  const rows = summary.map((s) => {
    const pupils = s.pupils.map((p) => p.name).join("; ");
    return [
      JSON.stringify(s.cardFront),
      String(s.pupilCount),
      s.averageEase != null ? s.averageEase.toFixed(2) : "",
      s.averageLeitnerBox != null ? s.averageLeitnerBox.toFixed(2) : "",
      JSON.stringify(pupils),
    ].join(",");
  });
  return [header, ...rows].join("\n");
}
