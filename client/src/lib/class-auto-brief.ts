/**
 * class-auto-brief.ts — Phase A · PR-1
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure, synchronous data layer for "Auto-from-class" worksheet generation.
 *
 * Given a class id and the in-memory list of children, produce a
 * `ClassAutoBrief` summarising what an auto-generated worksheet should
 * target: suggested topic, tier mix, reading-age range, recent
 * misconceptions, distinct SEND needs.
 *
 * Honest mapping note: this app does NOT model "Class" as a separate
 * entity. ClassPackDialog and the rest of the codebase already group
 * pupils by `Child.yearGroup`, so `classId === yearGroup` here too. The
 * `classLabel` is just the year-group string. If a richer Class entity
 * is added later, only this file needs to change.
 *
 * No AI calls, no fetches, no React. Inputs come from the existing
 * AppContext children array. PR-2 wires the React side; this file is
 * test-friendly and import-cheap.
 */

import type { Child } from "@/contexts/AppContext";
import { peekCurrentTopic } from "@/lib/topic-bank";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClassTier = "foundation" | "core" | "higher" | "send";

export interface ClassAutoBriefPupilSummary {
  pupilId: string;
  tier: ClassTier;
  /** 0 means "not estimated" — caller should fall back to year-group default. */
  readingAge: number;
  topNeed: string | null;
}

export interface ClassAutoBrief {
  /** Currently the same as yearGroup (see file header). */
  classId: string;
  /** Human-readable, e.g. "Year 7". */
  classLabel: string;
  /** Suggested topic, "" if no scheduler entry can supply one. */
  suggestedTopic: string;
  /** Subject the suggested topic is drawn from, "" if unknown. */
  suggestedSubject: string;
  pupilCount: number;
  tierMix: { foundation: number; core: number; higher: number; send: number };
  readingAgeRange: { min: number; max: number };
  /** Distinct misconception tags across the class, deduped, capped at 5. */
  recentMisconceptions: string[];
  /** Distinct SEND needs across the class. */
  sendNeeds: string[];
  pupilSummaries: ClassAutoBriefPupilSummary[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Tier classification mirroring the heuristic ClassPackDialog uses (no shared
 * helper exists — keeping it simple here so we don't tangle the modules).
 *   - any SEND need → "send"
 *   - otherwise default to "core" (no per-pupil tier flag exists on Child yet)
 *
 * Foundation/higher splits are produced by ClassPackDialog at runtime via
 * `tierMode: 'auto' | 'foundation' | 'higher'`. Until pupil-level tier
 * is stored on Child, the brief reports "core" for any non-SEND pupil; PR-3
 * (Class Pack as default) will refine this without changing the brief shape.
 */
function classifyTier(child: Child): ClassTier {
  const sends = (child.sendNeeds && child.sendNeeds.length > 0)
    ? child.sendNeeds
    : (child.sendNeed ? [child.sendNeed] : []);
  if (sends.some(s => s && s.trim().length > 0 && s !== "none-selected")) return "send";
  return "core";
}

/**
 * Best-effort reading-age estimate from year group. Returns 0 if it can't
 * parse, so the caller can decide whether to render "Auto" or surface an
 * empty state. Uses UK conventions: Year N ≈ ages (N + 4)–(N + 5).
 */
function estimateReadingAge(yearGroup: string | undefined): number {
  if (!yearGroup) return 0;
  const lower = yearGroup.toLowerCase();
  if (lower.includes("11+")) return 10;
  const yr = parseInt(lower.replace(/[^0-9]/g, ""), 10);
  if (!Number.isFinite(yr) || yr <= 0) return 0;
  // Mid-of-band so the chip reads as a single representative age. KS1: yr+4,
  // KS2/KS3: yr+5 (more typical of UK age-in-year averages above Y2).
  return yr <= 2 ? yr + 4 : yr + 5;
}

/** First non-empty SEND need on a child, or null. */
function topNeed(child: Child): string | null {
  const sends = (child.sendNeeds && child.sendNeeds.length > 0)
    ? child.sendNeeds
    : (child.sendNeed ? [child.sendNeed] : []);
  for (const s of sends) {
    const t = (s || "").trim();
    if (t && t !== "none-selected") return t;
  }
  return null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Build a synchronous, pure ClassAutoBrief for a given classId.
 *
 * @param classId   Currently the yearGroup string (see file header).
 * @param children  All children in the teacher's roster (from AppContext).
 * @param opts.subject Optional subject hint. When supplied we look up a
 *                     suggestedTopic via peekCurrentTopic against the FIRST
 *                     pupil in the class — the topic-bank index is stored
 *                     per-child so any pupil in the class returns the same
 *                     entry as long as the index hasn't drifted. If no
 *                     subject is given, suggestedTopic is left empty and
 *                     the caller is expected to surface that via
 *                     classAutoBriefIsUsable.
 */
export function buildClassAutoBrief(
  classId: string,
  children: Child[],
  opts: { subject?: string } = {},
): ClassAutoBrief {
  const id = classId || "";
  const inClass = children.filter(c => c.yearGroup === id);

  // Tier mix
  const tierMix = { foundation: 0, core: 0, higher: 0, send: 0 };
  const pupilSummaries: ClassAutoBriefPupilSummary[] = [];
  const sendNeedsSet = new Set<string>();
  const misSet = new Set<string>();
  const misOrdered: string[] = [];
  let raMin = Number.POSITIVE_INFINITY;
  let raMax = 0;

  for (const child of inClass) {
    const tier = classifyTier(child);
    tierMix[tier] += 1;
    const ra = estimateReadingAge(child.yearGroup);
    if (ra > 0) {
      if (ra < raMin) raMin = ra;
      if (ra > raMax) raMax = ra;
    }
    const need = topNeed(child);
    if (need) sendNeedsSet.add(need);
    pupilSummaries.push({ pupilId: child.id, tier, readingAge: ra, topNeed: need });

    // Pull misconceptions, dedupe case-insensitively while preserving the
    // most-recent-first ordering already present on each child record.
    for (const tag of (child.recentMisconceptions || [])) {
      const t = (tag || "").trim();
      if (!t) continue;
      const key = t.toLowerCase();
      if (misSet.has(key)) continue;
      misSet.add(key);
      misOrdered.push(t);
      if (misOrdered.length >= 5) break;
    }
  }

  // Suggested topic — best-effort. Use the first pupil's index as a proxy for
  // "where the class is up to". This will be tightened in a later PR once a
  // class-level scheduler exists; until then it gives a sensible default.
  let suggestedTopic = "";
  let suggestedSubject = "";
  if (opts.subject && inClass.length > 0) {
    try {
      const entry = peekCurrentTopic(inClass[0].id, opts.subject);
      if (entry && entry.topic) {
        suggestedTopic = entry.topic;
        suggestedSubject = opts.subject;
      }
    } catch {
      // localStorage unavailable in some environments — swallow and leave empty
    }
  }

  return {
    classId: id,
    classLabel: id || "(unassigned)",
    suggestedTopic,
    suggestedSubject,
    pupilCount: inClass.length,
    tierMix,
    readingAgeRange: {
      min: raMin === Number.POSITIVE_INFINITY ? 0 : raMin,
      max: raMax,
    },
    recentMisconceptions: misOrdered,
    sendNeeds: Array.from(sendNeedsSet),
    pupilSummaries,
  };
}

/**
 * True iff the brief has enough information to drive a worksheet generation.
 * If the caller will provide a topic explicitly (manual override), pass
 * `requireTopic: false` — otherwise the brief must carry a suggestedTopic.
 */
export function classAutoBriefIsUsable(
  brief: ClassAutoBrief,
  opts: { requireTopic?: boolean } = {},
): boolean {
  if (brief.pupilCount < 1) return false;
  if (opts.requireTopic !== false && !brief.suggestedTopic) return false;
  return true;
}

/**
 * Render the brief as a compact instruction block suitable for appending to
 * `aiGenerateWorksheet.additionalInstructions`. Public so PR-2 can reuse it
 * for an "Edit in form" pre-fill preview.
 */
export function renderClassBriefForPrompt(brief: ClassAutoBrief): string {
  const lines: string[] = [];
  lines.push("[Class context — design the worksheet so every pupil in this class can engage:]");
  lines.push(`- Class: ${brief.classLabel} (${brief.pupilCount} pupil${brief.pupilCount === 1 ? "" : "s"})`);
  if (brief.readingAgeRange.max > 0) {
    if (brief.readingAgeRange.min === brief.readingAgeRange.max) {
      lines.push(`- Reading age: ~${brief.readingAgeRange.max}`);
    } else {
      lines.push(`- Reading age range: ${brief.readingAgeRange.min}–${brief.readingAgeRange.max}`);
    }
  }
  const tm = brief.tierMix;
  const tmParts: string[] = [];
  if (tm.foundation) tmParts.push(`${tm.foundation} foundation`);
  if (tm.core)       tmParts.push(`${tm.core} core`);
  if (tm.higher)     tmParts.push(`${tm.higher} higher`);
  if (tm.send)       tmParts.push(`${tm.send} with SEND need`);
  if (tmParts.length > 0) lines.push(`- Tier mix: ${tmParts.join(", ")}`);
  if (brief.sendNeeds.length > 0) {
    lines.push(`- SEND needs in class: ${brief.sendNeeds.slice(0, 6).join(", ")}`);
  }
  if (brief.recentMisconceptions.length > 0) {
    lines.push(`- Address these recent misconceptions explicitly (top ${Math.min(3, brief.recentMisconceptions.length)}):`);
    for (const m of brief.recentMisconceptions.slice(0, 3)) {
      lines.push(`  • ${m.slice(0, 200)}`);
    }
  }
  return lines.join("\n");
}
