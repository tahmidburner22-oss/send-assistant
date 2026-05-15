/**
 * quizblast-enhancements.ts — Improvements layered onto QuizBlast.
 *
 *  1. Asynchronous "homework" mode (windowed quizzes joinable without live host)
 *  2. Per-pupil adaptive paths (skip mastered questions, escalate easier ones)
 *  3. Anti-cheat (randomised order, tab-blur warnings, one-token-per-pupil)
 *  4. Read-aloud + BSL-symbol toggle on every question
 *  5. Live miss-rate heatmap (per-question red/amber/green strip)
 */

const STORAGE_KEY = "adaptly_quizblast_async_v1";
const ATTEMPT_KEY = "adaptly_quizblast_attempts_v1";
const TOKEN_KEY   = "adaptly_quizblast_tokens_v1";

// ── 1. Asynchronous homework mode ───────────────────────────────────────────

export interface AsyncQuizSession {
  id: string;
  quizId: string;
  title: string;
  opensAt: string;          // ISO
  closesAt: string;         // ISO
  joinPin: string;          // 6-digit
  invitedPupilIds: string[];
}

export function listAsyncSessions(): AsyncQuizSession[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
export function saveAsyncSession(s: AsyncQuizSession): void {
  const all = listAsyncSessions().filter(x => x.id !== s.id).concat(s);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch {}
}
export function isOpen(s: AsyncQuizSession, now = new Date()): boolean {
  return new Date(s.opensAt) <= now && now <= new Date(s.closesAt);
}
export function generateJoinPin(): string {
  return String(100_000 + Math.floor(Math.random() * 900_000));
}

// ── 2. Per-pupil adaptive paths ─────────────────────────────────────────────

export interface PupilHistory {
  pupilId: string;
  /** Fraction correct on the topic over the last N attempts (0-1). */
  topicAccuracy: Record<string, number>;
}

export interface AdaptiveQuestion {
  id: string;
  topic: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  text: string;
  choices: string[];
  correctIndex: number;
  /** Topics the pupil should already have mastered to be set this question. */
  prereqTopics?: string[];
}

/**
 * Pick the next question for a pupil from the available bank.
 * Strategy:
 *   - If accuracy on the topic ≥ 0.85, skip easy questions on that topic.
 *   - If accuracy ≤ 0.4, hand out the easiest unanswered question.
 *   - Otherwise pick mid-difficulty.
 */
export function nextAdaptiveQuestion(
  bank: AdaptiveQuestion[],
  history: PupilHistory,
  alreadyAnsweredIds: string[],
): AdaptiveQuestion | null {
  const remaining = bank.filter(q => !alreadyAnsweredIds.includes(q.id));
  if (remaining.length === 0) return null;
  const acc = history.topicAccuracy;
  const scored = remaining.map(q => {
    const a = acc[q.topic] ?? 0.6;
    let target: number;
    if (a >= 0.85) target = 4;     // stretch
    else if (a <= 0.4) target = 2; // easier
    else target = 3;               // mid
    const score = -Math.abs(q.difficulty - target);
    return { q, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].q;
}

// ── 3. Anti-cheat ───────────────────────────────────────────────────────────

/** One-time-per-pupil join token. */
export function issuePupilToken(pupilId: string, sessionId: string): string {
  const token = `qbt_${sessionId.slice(0, 4)}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    const all = JSON.parse(localStorage.getItem(TOKEN_KEY) || "{}");
    all[`${sessionId}::${pupilId}`] = { token, issued: Date.now(), used: false };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(all));
  } catch {}
  return token;
}

export function consumePupilToken(sessionId: string, pupilId: string, token: string): boolean {
  try {
    const all = JSON.parse(localStorage.getItem(TOKEN_KEY) || "{}");
    const key = `${sessionId}::${pupilId}`;
    const rec = all[key];
    if (!rec || rec.token !== token || rec.used) return false;
    rec.used = true;
    localStorage.setItem(TOKEN_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

/** Fisher-Yates shuffle; deterministic if a seed is provided. */
export function shuffle<T>(arr: T[], seed?: number): T[] {
  const out = [...arr];
  let s = seed ?? Math.random() * 1e6;
  function rand() {
    s = Math.sin(s) * 10_000;
    return s - Math.floor(s);
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor((seed === undefined ? Math.random() : rand()) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * React-friendly tab-blur watchdog. Returns a cleanup fn.
 * `onSuspect` is called every time the tab loses focus during play.
 */
export function watchTabBlur(onSuspect: (eventType: "blur" | "visibilitychange") => void): () => void {
  if (typeof window === "undefined") return () => {};
  const blurHandler = () => onSuspect("blur");
  const visHandler  = () => { if (document.hidden) onSuspect("visibilitychange"); };
  window.addEventListener("blur", blurHandler);
  document.addEventListener("visibilitychange", visHandler);
  return () => {
    window.removeEventListener("blur", blurHandler);
    document.removeEventListener("visibilitychange", visHandler);
  };
}

// ── 4. Read-aloud + BSL toggle ──────────────────────────────────────────────

export interface AccessibilityToggles {
  readAloud: boolean;
  bslSymbols: boolean;
  largePrint: boolean;
}

export const ACCESSIBILITY_DEFAULTS: AccessibilityToggles = {
  readAloud: false,
  bslSymbols: false,
  largePrint: false,
};

const A11Y_KEY = "adaptly_quizblast_a11y_v1";

export function getA11yToggles(): AccessibilityToggles {
  try {
    const raw = localStorage.getItem(A11Y_KEY);
    return raw ? { ...ACCESSIBILITY_DEFAULTS, ...JSON.parse(raw) } : ACCESSIBILITY_DEFAULTS;
  } catch { return ACCESSIBILITY_DEFAULTS; }
}

export function saveA11yToggles(t: AccessibilityToggles): void {
  try { localStorage.setItem(A11Y_KEY, JSON.stringify(t)); } catch {}
}

// ── 5. Live miss-rate heatmap ───────────────────────────────────────────────

export interface AttemptRecord {
  sessionId: string;
  pupilId: string;
  questionId: string;
  correct: boolean;
  at: number;
}

export function recordAttempt(a: Omit<AttemptRecord, "at">): void {
  try {
    const all = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || "[]") as AttemptRecord[];
    all.push({ ...a, at: Date.now() });
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(all.slice(-2000)));
    window.dispatchEvent(new CustomEvent("adaptly:quizblast-attempt", { detail: a }));
  } catch {}
}

export function listAttempts(sessionId: string): AttemptRecord[] {
  try { return (JSON.parse(localStorage.getItem(ATTEMPT_KEY) || "[]") as AttemptRecord[]).filter(a => a.sessionId === sessionId); } catch { return []; }
}

export interface QuestionHeatmapEntry {
  questionId: string;
  attempts: number;
  correct: number;
  /** 0 = no attempts; 1 = all correct; 0..1 fraction. */
  rate: number;
  banner: "green" | "amber" | "red" | "none";
  /** pupil ids who got it wrong. */
  failedBy: string[];
}

export function buildHeatmap(sessionId: string, questionIds: string[]): QuestionHeatmapEntry[] {
  const attempts = listAttempts(sessionId);
  return questionIds.map(qid => {
    const matches = attempts.filter(a => a.questionId === qid);
    const correct = matches.filter(a => a.correct).length;
    const rate    = matches.length === 0 ? 0 : correct / matches.length;
    const banner: QuestionHeatmapEntry["banner"] = matches.length === 0
      ? "none"
      : rate >= 0.75 ? "green" : rate >= 0.5 ? "amber" : "red";
    const failedBy = matches.filter(a => !a.correct).map(a => a.pupilId);
    return { questionId: qid, attempts: matches.length, correct, rate, banner, failedBy };
  });
}
