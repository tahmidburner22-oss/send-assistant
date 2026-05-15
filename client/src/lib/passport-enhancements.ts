/**
 * passport-enhancements.ts — Improvements layered onto Pupil Passport.
 *
 *  1. Supply-teacher 60-second mode (token-protected /share/passport/:token)
 *  2. Pupil-voice section captured by the pupil (sentence-stem flow)
 *  3. Photo with consent metadata + auto-expiry
 *  4. Auto-sync from EHCP and BSP (live pull, not duplicated text)
 *  5. "Strategies that worked" weekly log → ranking
 */
import { writeShare } from "@/pages/PupilPassportShare";

const VOICE_KEY    = "adaptly_pupil_voice_v1";
const PHOTO_KEY    = "adaptly_pupil_photos_v1";
const STRAT_KEY    = "adaptly_strategy_feedback_v1";

// ── 1. Supply-teacher share — uses lib in PupilPassportShare ────────────────

export function generateSupplyShareLink(opts: {
  pupilName: string;
  yearGroup?: string;
  sendNeeds?: string[];
  body: string;
  issuedBy: string;
  daysValid?: number;
}): string {
  const exp = new Date(); exp.setDate(exp.getDate() + (opts.daysValid ?? 14));
  const rec = writeShare({
    pupilName: opts.pupilName,
    yearGroup: opts.yearGroup,
    sendNeeds: opts.sendNeeds,
    body: opts.body,
    issuedBy: opts.issuedBy,
    expiresAt: exp.toISOString(),
  });
  return `${window.location.origin}/share/passport/${rec.token}`;
}

// ── 2. Pupil voice ──────────────────────────────────────────────────────────

export interface PupilVoice {
  pupilId: string;
  capturedAt: string;
  responses: Record<string, string>;
  mood: number;       // 1-5 emoji scale
}

export const PUPIL_VOICE_STEMS: { id: string; prompt: string; placeholder: string }[] = [
  { id: "best",    prompt: "I learn best when…",             placeholder: "e.g. someone explains it to me first" },
  { id: "tricky",  prompt: "I find it tricky when…",         placeholder: "e.g. the room is too noisy" },
  { id: "dont",    prompt: "Please don't…",                  placeholder: "e.g. ask me to read aloud unless I put my hand up" },
  { id: "love",    prompt: "I love it when…",                placeholder: "e.g. I get to draw my answer" },
  { id: "calm",    prompt: "What helps me feel calm…",       placeholder: "e.g. fidget toy, time-out card, headphones" },
];

export function getPupilVoice(pupilId: string): PupilVoice | null {
  try {
    const all = JSON.parse(localStorage.getItem(VOICE_KEY) || "{}") as Record<string, PupilVoice>;
    return all[pupilId] || null;
  } catch { return null; }
}

export function savePupilVoice(v: PupilVoice): void {
  try {
    const all = JSON.parse(localStorage.getItem(VOICE_KEY) || "{}") as Record<string, PupilVoice>;
    all[v.pupilId] = v;
    localStorage.setItem(VOICE_KEY, JSON.stringify(all));
  } catch {}
}

// ── 3. Photo with consent metadata ──────────────────────────────────────────

export interface PhotoRecord {
  pupilId: string;
  dataUrl: string;
  consentDate: string;
  consentBy: string;
  expiresAt: string;
}

export function savePhoto(p: PhotoRecord): void {
  try {
    const all = JSON.parse(localStorage.getItem(PHOTO_KEY) || "{}") as Record<string, PhotoRecord>;
    all[p.pupilId] = p;
    localStorage.setItem(PHOTO_KEY, JSON.stringify(all));
  } catch {}
}

export function getPhoto(pupilId: string): PhotoRecord | null {
  try {
    const all = JSON.parse(localStorage.getItem(PHOTO_KEY) || "{}") as Record<string, PhotoRecord>;
    const rec = all[pupilId];
    if (!rec) return null;
    if (new Date(rec.expiresAt) < new Date()) return null;
    return rec;
  } catch { return null; }
}

export function isPhotoExpired(pupilId: string): boolean {
  try {
    const all = JSON.parse(localStorage.getItem(PHOTO_KEY) || "{}") as Record<string, PhotoRecord>;
    const rec = all[pupilId];
    return !!rec && new Date(rec.expiresAt) < new Date();
  } catch { return false; }
}

// ── 4. Auto-sync from EHCP and BSP ──────────────────────────────────────────

import { getEvents } from "./timeline-events";

export interface SyncedSection {
  source: "ehcp" | "bsp";
  text: string;
  fromEventId: string;
  capturedAt: number;
}

/**
 * Pull the most recent EHCP Section B and BSP-strategies content from the
 * pupil's timeline events. Returns nothing when no events found.
 */
export function syncFromTimeline(pupilId: string): { ehcp?: SyncedSection; bsp?: SyncedSection } {
  const events = getEvents(pupilId);
  const out: { ehcp?: SyncedSection; bsp?: SyncedSection } = {};
  for (const e of events) {
    if (!out.ehcp && e.toolId === "ehcp-plan-generator" && e.outputPreview) {
      out.ehcp = { source: "ehcp", text: e.outputPreview, fromEventId: e.id, capturedAt: e.at };
    }
    if (!out.bsp && e.toolId === "behaviour-plan" && e.outputPreview) {
      out.bsp = { source: "bsp", text: e.outputPreview, fromEventId: e.id, capturedAt: e.at };
    }
    if (out.ehcp && out.bsp) break;
  }
  return out;
}

// ── 5. "Strategies that worked" weekly log ──────────────────────────────────

export interface StrategyFeedback {
  pupilId: string;
  strategy: string;
  worked: boolean;
  at: number;
}

export function logStrategyFeedback(f: Omit<StrategyFeedback, "at">): void {
  try {
    const all = JSON.parse(localStorage.getItem(STRAT_KEY) || "[]") as StrategyFeedback[];
    all.push({ ...f, at: Date.now() });
    localStorage.setItem(STRAT_KEY, JSON.stringify(all.slice(-1000)));
  } catch {}
}

export function rankStrategies(pupilId: string): { strategy: string; success: number; total: number; rate: number }[] {
  try {
    const all = JSON.parse(localStorage.getItem(STRAT_KEY) || "[]") as StrategyFeedback[];
    const buckets: Record<string, { success: number; total: number }> = {};
    for (const f of all.filter(f => f.pupilId === pupilId)) {
      const k = f.strategy.trim().toLowerCase();
      const b = buckets[k] || { success: 0, total: 0 };
      b.total++; if (f.worked) b.success++;
      buckets[k] = b;
    }
    return Object.entries(buckets)
      .map(([s, b]) => ({ strategy: s, success: b.success, total: b.total, rate: b.success / b.total }))
      .sort((a, b) => b.rate - a.rate || b.total - a.total)
      .slice(0, 10);
  } catch { return []; }
}
