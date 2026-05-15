/**
 * flashcards-enhancements.ts — Improvements layered onto Flash Cards.
 *
 *  1. Spaced repetition (SM-2 / FSRS-lite) with per-pupil retention tracking
 *  2. Cloze + image-occlusion modes
 *  3. Print-to-A6 and lanyard formats
 *  4. Auto-generation from another tool's output (manifest)
 *  5. Pupil-creation mode with QA gate (teacher must approve)
 */

const DECKS_KEY    = "adaptly_flashcard_decks_v1";
const REVIEWS_KEY  = "adaptly_flashcard_reviews_v1";
const PUPIL_CARDS_KEY = "adaptly_flashcard_pupil_drafts_v1";

// ── Shared types ────────────────────────────────────────────────────────────

export type CardKind = "qa" | "cloze" | "image-occlusion";

export interface FlashCard {
  id: string;
  deckId: string;
  kind: CardKind;
  front: string;
  back: string;
  /** For cloze: front = "The capital of France is {{c1::Paris}}." Backend renders with hidden segment. */
  /** For image-occlusion: front = imageUrl; back = description of hidden region(s) as JSON. */
  metadata?: Record<string, unknown>;
  createdAt: number;
  approvedBy?: string;
}

export interface FlashCardDeck {
  id: string;
  title: string;
  pupilId?: string;       // null = class deck
  cards: FlashCard[];
}

// ── 1. Spaced repetition (SM-2 lite) ────────────────────────────────────────

export interface ReviewState {
  pupilId: string;
  cardId: string;
  easiness: number;       // E-factor, default 2.5
  interval: number;       // days
  repetitions: number;
  lastReviewedAt?: number;
  dueAt: number;
}

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * SM-2: returns updated state given quality 0-5 (>=3 means recalled correctly).
 */
export function reviewCard(state: ReviewState, q: Quality, now = Date.now()): ReviewState {
  let { easiness, interval, repetitions } = state;
  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easiness);
    repetitions++;
  }
  easiness = Math.max(1.3, easiness + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  const dueAt = now + interval * 86400_000;
  return { ...state, easiness, interval, repetitions, lastReviewedAt: now, dueAt };
}

export function newReviewState(pupilId: string, cardId: string): ReviewState {
  return { pupilId, cardId, easiness: 2.5, interval: 0, repetitions: 0, dueAt: Date.now() };
}

export function loadReviews(pupilId: string): ReviewState[] {
  try {
    return (JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]") as ReviewState[])
      .filter((r) => r.pupilId === pupilId);
  } catch { return []; }
}

export function saveReview(state: ReviewState): void {
  try {
    const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]") as ReviewState[];
    const idx = all.findIndex((r) => r.pupilId === state.pupilId && r.cardId === state.cardId);
    if (idx >= 0) all[idx] = state; else all.push(state);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(all.slice(-5000)));
  } catch {}
}

export function dueCardsToday(pupilId: string, deck: FlashCardDeck, now = Date.now()): FlashCard[] {
  const reviews = new Map(loadReviews(pupilId).map((r) => [r.cardId, r]));
  return deck.cards.filter((c) => {
    const r = reviews.get(c.id);
    return !r || r.dueAt <= now;
  });
}

// ── 2. Cloze + image-occlusion ──────────────────────────────────────────────

const CLOZE_PATTERN = /\{\{c\d+::([^}]+)\}\}/g;

export interface ClozeRender {
  prompt: string;        // text with the cloze hidden
  answer: string;        // the hidden text
}

export function renderCloze(text: string): ClozeRender[] {
  const cards: ClozeRender[] = [];
  let m: RegExpExecArray | null;
  CLOZE_PATTERN.lastIndex = 0;
  while ((m = CLOZE_PATTERN.exec(text)) !== null) {
    const answer = m[1];
    const prompt = text.replace(m[0], "[ ____ ]");
    cards.push({ prompt, answer });
  }
  return cards;
}

export interface OcclusionRegion {
  x: number; y: number; w: number; h: number;
  label: string;
}

export interface ImageOcclusionRender {
  imageUrl: string;
  occluded: OcclusionRegion[];
}

export function makeImageOcclusion(imageUrl: string, regions: OcclusionRegion[]): FlashCard {
  return {
    id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    deckId: "tmp",
    kind: "image-occlusion",
    front: imageUrl,
    back: JSON.stringify(regions),
    createdAt: Date.now(),
  };
}

// ── 3. Print formats ────────────────────────────────────────────────────────

export type PrintFormat = "a4-grid" | "a6-cut" | "lanyard";

export interface PrintLayout {
  format: PrintFormat;
  cardsPerSheet: number;
  cardWidthMm: number;
  cardHeightMm: number;
  cutMarks: boolean;
  guidance: string;
}

export const PRINT_LAYOUTS: Record<PrintFormat, PrintLayout> = {
  "a4-grid": {
    format: "a4-grid", cardsPerSheet: 8, cardWidthMm: 95, cardHeightMm: 65,
    cutMarks: true, guidance: "Standard 8-up A4 sheet, cut along dashed lines.",
  },
  "a6-cut": {
    format: "a6-cut", cardsPerSheet: 4, cardWidthMm: 105, cardHeightMm: 148,
    cutMarks: true, guidance: "4-up A6 cards — laminate-ready.",
  },
  "lanyard": {
    format: "lanyard", cardsPerSheet: 6, cardWidthMm: 54, cardHeightMm: 86,
    cutMarks: true, guidance: "Lanyard / credit-card size — punch-hole top centre after laminating.",
  },
};

export function chooseFormat(opts: { audience: "class" | "pupil"; vocab?: boolean }): PrintFormat {
  if (opts.audience === "pupil" && opts.vocab) return "lanyard";
  if (opts.audience === "pupil") return "a6-cut";
  return "a4-grid";
}

// ── 4. Auto-generation manifest ─────────────────────────────────────────────

export type GeneratorSource = "lesson-plan" | "worksheet" | "story" | "vocab-builder";

export interface AutoGenManifest {
  source: GeneratorSource;
  topic: string;
  candidateCount: number;
  notes: string;
}

/** Slim heuristic — pulls noun+definition pairs from text. */
export function extractCardCandidates(text: string, max = 12): { front: string; back: string }[] {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const out: { front: string; back: string }[] = [];
  for (const line of lines) {
    const m = line.match(/^([A-Z][\w\s]{2,40})\s*[-—:]\s*(.+)$/);
    if (m) out.push({ front: m[1].trim(), back: m[2].trim() });
    if (out.length >= max) break;
  }
  if (out.length === 0) {
    // Fallback — ask-style sentences.
    for (const line of lines) {
      if (/\?/.test(line)) {
        const next = lines[lines.indexOf(line) + 1];
        if (next) out.push({ front: line, back: next });
      }
      if (out.length >= max) break;
    }
  }
  return out;
}

// ── 5. Pupil creation with QA gate ──────────────────────────────────────────

export interface PupilDraftCard {
  id: string;
  pupilId: string;
  deckId: string;
  front: string;
  back: string;
  createdAt: number;
  approved?: boolean;
  rejectedReason?: string;
}

export function submitDraft(opts: { pupilId: string; deckId: string; front: string; back: string }): PupilDraftCard {
  const card: PupilDraftCard = {
    ...opts,
    id: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  };
  try {
    const all = JSON.parse(localStorage.getItem(PUPIL_CARDS_KEY) || "[]") as PupilDraftCard[];
    all.push(card);
    localStorage.setItem(PUPIL_CARDS_KEY, JSON.stringify(all.slice(-2000)));
  } catch {}
  return card;
}

export function listPendingDrafts(pupilId?: string): PupilDraftCard[] {
  try {
    return (JSON.parse(localStorage.getItem(PUPIL_CARDS_KEY) || "[]") as PupilDraftCard[])
      .filter((c) => c.approved === undefined && (!pupilId || c.pupilId === pupilId));
  } catch { return []; }
}

export function approveDraft(id: string, approved: boolean, reason?: string): void {
  try {
    const all = JSON.parse(localStorage.getItem(PUPIL_CARDS_KEY) || "[]") as PupilDraftCard[];
    const c = all.find((x) => x.id === id);
    if (c) { c.approved = approved; if (reason) c.rejectedReason = reason; }
    localStorage.setItem(PUPIL_CARDS_KEY, JSON.stringify(all));
  } catch {}
}

/**
 * Light-touch accuracy heuristic: flag drafts where the back doesn't reference
 * the front (very different lengths, no shared words, suspicious patterns).
 */
export function flagSuspiciousDraft(c: PupilDraftCard): string | null {
  const front = c.front.toLowerCase();
  const back = c.back.toLowerCase();
  if (back.length < 4) return "Back is suspiciously short.";
  if (front.length > 4 && back.length / front.length > 6) return "Back is much longer than front — likely off-topic.";
  const sharedWords = new Set(front.split(/\W+/)).size > 0 &&
    front.split(/\W+/).some((w) => w.length > 3 && back.includes(w));
  if (!sharedWords && front.length > 8 && back.length > 8) return "No vocabulary overlap between front and back.";
  return null;
}

// ── Persistence helpers ─────────────────────────────────────────────────────

export function listDecks(): FlashCardDeck[] {
  try { return JSON.parse(localStorage.getItem(DECKS_KEY) || "[]"); } catch { return []; }
}

export function saveDeck(deck: FlashCardDeck): void {
  try {
    const all = listDecks().filter((d) => d.id !== deck.id);
    all.push(deck);
    localStorage.setItem(DECKS_KEY, JSON.stringify(all.slice(-200)));
  } catch {}
}
