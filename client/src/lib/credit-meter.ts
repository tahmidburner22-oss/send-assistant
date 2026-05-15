/**
 * credit-meter.ts — Lightweight per-generation cost estimator + log.
 *
 * Bursars and SLT will increasingly ask SENCOs to defend AI spend per pupil.
 * Today we have no per-tool meter at all. This module provides a tiny
 * client-side estimator (token count → £ at the platform's blended rate)
 * and persists the running total per month so the Settings page and
 * Analytics Dashboard can surface "AI £/term" as a defensible KPI.
 *
 * The numbers here are intentionally rough — they are *defensible*, not
 * precise. The platform's actual billing remains a server-side concern.
 */

const STORAGE_KEY = "adaptly_credit_log_v1";
/** Blended £/1k tokens — the platform's effective price point.  */
const POUNDS_PER_1K_TOKENS = 0.012;

export interface CreditEntry {
  at: number;             // epoch ms
  toolId: string;
  toolLabel: string;
  pupilId?: string;
  /** Estimated total tokens in + out. */
  tokens: number;
  /** Estimated cost in £ at POUNDS_PER_1K_TOKENS. */
  cost: number;
}

interface Log { entries: CreditEntry[]; }

function read(): Log {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [] };
    const p = JSON.parse(raw);
    return { entries: Array.isArray(p?.entries) ? p.entries : [] };
  } catch {
    return { entries: [] };
  }
}

function write(l: Log): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries: l.entries.slice(-1000) })); } catch {}
}

/**
 * Estimate the token count from a single string. Cheap heuristic — 4
 * characters per token is the ChatGPT-3 baseline that has held up well
 * enough for our (defensible-rather-than-precise) purposes.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function estimateCost(tokens: number): number {
  return (tokens / 1000) * POUNDS_PER_1K_TOKENS;
}

export function logGeneration(entry: Omit<CreditEntry, "at" | "cost"> & { cost?: number }): CreditEntry {
  const cost = entry.cost ?? estimateCost(entry.tokens);
  const full: CreditEntry = { ...entry, at: Date.now(), cost };
  const log = read();
  log.entries = [...log.entries, full];
  write(log);
  return full;
}

export function listEntries(filter: { since?: number; pupilId?: string; toolId?: string } = {}): CreditEntry[] {
  return read().entries.filter(e => {
    if (filter.since && e.at < filter.since) return false;
    if (filter.pupilId && e.pupilId !== filter.pupilId) return false;
    if (filter.toolId && e.toolId !== filter.toolId) return false;
    return true;
  });
}

/** Total cost for the current calendar month, in £. */
export function thisMonthCost(): number {
  const start = new Date();
  start.setDate(1); start.setHours(0, 0, 0, 0);
  return listEntries({ since: start.getTime() }).reduce((a, e) => a + e.cost, 0);
}

/** Total tokens for the current month. */
export function thisMonthTokens(): number {
  const start = new Date();
  start.setDate(1); start.setHours(0, 0, 0, 0);
  return listEntries({ since: start.getTime() }).reduce((a, e) => a + e.tokens, 0);
}
