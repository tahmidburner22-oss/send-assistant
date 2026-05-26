/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * companion-answer-log.ts — FEAT-G1 + FEAT-H1.
 *
 * Per-pupil-per-worksheet localStorage log keyed by
 * `companion_answers_<token>`. Used by the companion app (G1) to
 * persist answers across reload and by Phase H's pupil progress
 * dashboard (H1) to roll up per-pupil completion data.
 *
 * Storage shape:
 *   {
 *     token: string,
 *     deviceId: string,
 *     attempts: { sectionIndex, attemptedAt, status, gainedMarks?, pupilAnswer?, misconceptionId? }[]
 *   }
 *
 * Side-effect-free in node (where localStorage is undefined): all
 * helpers degrade to in-memory storage so server-side tests pass.
 */

import type { VerifierStatus } from "./answerVerifier";

export interface AttemptRecord {
  sectionIndex: number;
  attemptedAt: string;
  status: VerifierStatus;
  gainedMarks?: number;
  pupilAnswer?: string;
  misconceptionId?: string;
  marksAvailable?: number;
}

export interface AnswerLog {
  token: string;
  deviceId: string;
  attempts: AttemptRecord[];
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const memoryStore = new Map<string, string>();

function getStorage(): StorageLike {
  if (typeof globalThis !== "undefined" && (globalThis as { localStorage?: StorageLike }).localStorage) {
    try {
      const ls = (globalThis as { localStorage?: StorageLike }).localStorage!;
      ls.getItem("__probe__");
      return ls;
    } catch {
      // localStorage exists but is blocked (private mode etc.) — fall through
    }
  }
  return {
    getItem: (k: string) => (memoryStore.has(k) ? memoryStore.get(k)! : null),
    setItem: (k: string, v: string) => {
      memoryStore.set(k, v);
    },
  };
}

function keyFor(token: string): string {
  return `companion_answers_${token}`;
}

function makeDeviceId(): string {
  // Stable per-storage device id; generated on first call.
  return "dev-" + Math.random().toString(36).slice(2, 12) + "-" + Date.now().toString(36);
}

export function loadAnswerLog(token: string): AnswerLog {
  const storage = getStorage();
  const raw = storage.getItem(keyFor(token));
  if (!raw) {
    const fresh: AnswerLog = { token, deviceId: makeDeviceId(), attempts: [] };
    storage.setItem(keyFor(token), JSON.stringify(fresh));
    return fresh;
  }
  try {
    const parsed = JSON.parse(raw) as AnswerLog;
    if (!parsed.deviceId) parsed.deviceId = makeDeviceId();
    if (!Array.isArray(parsed.attempts)) parsed.attempts = [];
    parsed.token = token;
    return parsed;
  } catch {
    const fresh: AnswerLog = { token, deviceId: makeDeviceId(), attempts: [] };
    storage.setItem(keyFor(token), JSON.stringify(fresh));
    return fresh;
  }
}

export function recordAttempt(token: string, attempt: AttemptRecord): AnswerLog {
  const log = loadAnswerLog(token);
  // Idempotent on (sectionIndex, attemptedAt): updates existing if present.
  const existingIdx = log.attempts.findIndex(
    (a) => a.sectionIndex === attempt.sectionIndex && a.attemptedAt === attempt.attemptedAt,
  );
  if (existingIdx >= 0) {
    log.attempts[existingIdx] = { ...log.attempts[existingIdx], ...attempt };
  } else {
    log.attempts.push(attempt);
  }
  // Cap at 200 attempts per worksheet (matches schema cap).
  if (log.attempts.length > 200) {
    log.attempts = log.attempts.slice(-200);
  }
  getStorage().setItem(keyFor(token), JSON.stringify(log));
  return log;
}

export interface AnswerLogSummary {
  total: number;
  correct: number;
  partial: number;
  incorrect: number;
  marksGained: number;
  marksAvailable: number;
}

export function summarizeLog(log: AnswerLog): AnswerLogSummary {
  let correct = 0;
  let partial = 0;
  let incorrect = 0;
  let gained = 0;
  let avail = 0;
  for (const a of log.attempts) {
    if (a.status === "correct") correct += 1;
    else if (a.status === "partial") partial += 1;
    else if (a.status === "incorrect") incorrect += 1;
    gained += a.gainedMarks || 0;
    avail += a.marksAvailable || 0;
  }
  return { total: log.attempts.length, correct, partial, incorrect, marksGained: gained, marksAvailable: avail };
}

export function clearAnswerLog(token: string): void {
  const storage = getStorage();
  storage.setItem(keyFor(token), JSON.stringify({ token, deviceId: makeDeviceId(), attempts: [] }));
}

export const __testing = { keyFor, makeDeviceId };
