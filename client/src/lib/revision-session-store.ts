/**
 * revision-session-store.ts
 *
 * Types + localStorage helpers for the Parent Portal's "All-in-One Revision
 * Session" feature.
 *
 * Storage layout (localStorage; v1 has no DB sync):
 *  - adaptly_revision_sessions_<pupilId>   — array of completed RevisionSessionRun
 *  - adaptly_revision_inprogress_<pupilId> — single in-progress run, if any
 *  - adaptly_revision_notes_<sessionId>    — notes typed during a Lesson phase
 *
 * Notes:
 *  - Capped at 50 completed runs per pupil to keep localStorage sane.
 *  - Every read/write is wrapped in try/catch so a malformed JSON never breaks
 *    the UI; failures degrade gracefully to "no history".
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type RevisionPhaseKind =
  | "warmup"
  | "lesson"
  | "break"
  | "quiz"
  | "stretch"
  | "flashcards"
  | "reflect";

export type StretchMode = "ai-worksheet" | "past-paper" | "worked-example";
export type BreakType = "breathing" | "stretch" | "quiet" | "drink-walk";

export interface RevisionPhase {
  kind: RevisionPhaseKind;
  /** Short pupil-facing label e.g. "Listen & Learn". */
  label: string;
  /** Duration in seconds. */
  durationSec: number;
  config?: {
    /** For break phases — which menu of activities to offer. */
    breakMenu?: BreakType[];
    /** For stretch phases — which mode the parent picked. */
    stretchMode?: StretchMode;
    /** For flashcards — auto-build from quiz mistakes vs from key terms. */
    autoBuiltFromMistakes?: boolean;
  };
}

export interface RevisionSessionPlan {
  id: string;
  pupilId: string;
  pupilName: string;
  subject: string;          // subject id, e.g. "mathematics"
  subjectLabel: string;     // human label, e.g. "Mathematics"
  topic: string;            // human label, e.g. "Ratio and Proportion"
  yearGroup: string;
  difficulty: "foundation" | "mixed" | "higher";
  totalSec: number;
  phases: RevisionPhase[];
  createdAt: string;
}

export interface PhaseProgress {
  phaseIndex: number;
  startedAt: string;
  endedAt?: string;
  completed: boolean;
  extendedSec: number;
  skipped: boolean;
  /** Quiz score (0..1) for quiz phase, 0..1 for stretch phase auto-mark. */
  score?: number;
  /** Plain-text notes from lesson phase. */
  notes?: string;
  /** Reflection from final phase. */
  reflection?: { mood: 1 | 2 | 3 | 4 | 5; note?: string };
  /** Stretch / quiz item-level results to feed downstream flashcards. */
  itemResults?: Array<{
    question: string;
    answer?: string;
    correct: boolean;
    skipped?: boolean;
  }>;
}

export interface RevisionSessionRun {
  id: string;
  planId: string;
  plan: RevisionSessionPlan;          // denormalised so history is self-contained
  pupilId: string;
  startedAt: string;
  endedAt?: string;
  phaseProgress: PhaseProgress[];
  /** Live currentPhase pointer, persisted so we can resume after a tab close. */
  currentPhaseIndex: number;
  /** Aggregate quiz score (0..1) once at least one quiz phase is complete. */
  totalScore?: number;
  /** Mood emoji 1..5 from the reflect phase, if reached. */
  reflectionMood?: 1 | 2 | 3 | 4 | 5;
  /** Free-text reflection note. */
  reflectionNote?: string;
  /** Whether the parent ended the session early via "I'm done". */
  endedEarly?: boolean;
}

// ─── Storage keys ───────────────────────────────────────────────────────────

const HISTORY_PREFIX = "adaptly_revision_sessions_";
const IN_PROGRESS_PREFIX = "adaptly_revision_inprogress_";
const NOTES_PREFIX = "adaptly_revision_notes_";

const HISTORY_CAP = 50;

function historyKey(pupilId: string): string { return `${HISTORY_PREFIX}${pupilId}`; }
function inProgressKey(pupilId: string): string { return `${IN_PROGRESS_PREFIX}${pupilId}`; }
function notesKey(sessionId: string): string { return `${NOTES_PREFIX}${sessionId}`; }

// ─── Safe JSON helpers ──────────────────────────────────────────────────────

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Likely a quota error — silently swallow; the UI keeps working.
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(key); } catch {}
}

// ─── ID helper ──────────────────────────────────────────────────────────────

export function newId(prefix = "rs"): string {
  // Short, sortable enough, collision-resistant for a single pupil's history.
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

// ─── Completed-session history ──────────────────────────────────────────────

export function loadHistory(pupilId: string): RevisionSessionRun[] {
  const items = safeRead<RevisionSessionRun[]>(historyKey(pupilId), []);
  if (!Array.isArray(items)) return [];
  // Defensive — drop anything that doesn't look like a run.
  return items.filter((r) => r && typeof r.id === "string" && r.plan && r.startedAt);
}

export function saveCompletedRun(run: RevisionSessionRun): void {
  if (!run.pupilId) return;
  const existing = loadHistory(run.pupilId);
  // Replace if same id, else prepend.
  const filtered = existing.filter((r) => r.id !== run.id);
  const next = [run, ...filtered].slice(0, HISTORY_CAP);
  safeWrite(historyKey(run.pupilId), next);
}

export function deleteRunFromHistory(pupilId: string, runId: string): void {
  const existing = loadHistory(pupilId);
  safeWrite(historyKey(pupilId), existing.filter((r) => r.id !== runId));
}

// ─── In-progress (resumable) session ────────────────────────────────────────

export function loadInProgress(pupilId: string): RevisionSessionRun | null {
  const run = safeRead<RevisionSessionRun | null>(inProgressKey(pupilId), null);
  if (!run || typeof run !== "object" || !run.id) return null;
  return run;
}

export function saveInProgress(run: RevisionSessionRun): void {
  if (!run.pupilId) return;
  safeWrite(inProgressKey(run.pupilId), run);
}

export function clearInProgress(pupilId: string): void {
  safeRemove(inProgressKey(pupilId));
}

// ─── Lesson notes ───────────────────────────────────────────────────────────

export function loadNotes(sessionId: string): string {
  return safeRead<string>(notesKey(sessionId), "") || "";
}

export function saveNotes(sessionId: string, notes: string): void {
  safeWrite(notesKey(sessionId), notes);
}

export function clearNotes(sessionId: string): void {
  safeRemove(notesKey(sessionId));
}

// ─── Convenience aggregates for the landing page ────────────────────────────

export interface SessionSummaryForList {
  id: string;
  startedAt: string;
  subjectLabel: string;
  topic: string;
  durationMin: number;
  quizScorePct: number | null;
  mood: 1 | 2 | 3 | 4 | 5 | null;
  endedEarly: boolean;
}

export function summariseHistory(pupilId: string, max = 10): SessionSummaryForList[] {
  return loadHistory(pupilId).slice(0, max).map((r) => {
    const quizPhases = r.phaseProgress.filter(
      (p) => r.plan.phases[p.phaseIndex]?.kind === "quiz" && typeof p.score === "number",
    );
    const avg = quizPhases.length
      ? quizPhases.reduce((a, p) => a + (p.score || 0), 0) / quizPhases.length
      : null;
    return {
      id: r.id,
      startedAt: r.startedAt,
      subjectLabel: r.plan.subjectLabel,
      topic: r.plan.topic,
      durationMin: Math.round(r.plan.totalSec / 60),
      quizScorePct: avg !== null ? Math.round(avg * 100) : null,
      mood: r.reflectionMood ?? null,
      endedEarly: !!r.endedEarly,
    };
  });
}
