/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * gamificationEngine.ts — FEAT-H4.
 *
 * Pure deterministic rules engine over pupil_attempt rows. Computes
 * streaks, badges and an opt-in leaderboard. Research-anchored UX
 * guards are baked in: bottom-3 hidden from public leaderboard;
 * pupils only see percentile, not rank.
 */

export type AttemptStatus = "correct" | "partial" | "incorrect";

export interface GamificationAttempt {
  pupilId: string;
  attemptedAt: string;
  status: AttemptStatus;
  specRef?: string;
}

export interface BadgeAward {
  pupilId: string;
  badgeId: string;
  awardedAt: string;
}

export interface PupilStreak {
  pupilId: string;
  /** Consecutive days with ≥1 correct attempt. */
  currentDays: number;
  /** Longest streak ever recorded for the pupil. */
  longestDays: number;
}

export interface LeaderboardEntry {
  pupilId: string;
  initials: string;
  /** 0-100 percentile. */
  percentile: number;
  totalCorrect: number;
}

export interface GamificationOutput {
  streaks: PupilStreak[];
  badges: BadgeAward[];
  leaderboard: LeaderboardEntry[];
  /** Hidden pupils (bottom-3 in cohort, never shown publicly). */
  hiddenFromLeaderboard: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function calcStreak(rowsForPupil: GamificationAttempt[]): { currentDays: number; longestDays: number } {
  const correctDays = new Set<string>();
  for (const r of rowsForPupil) {
    if (r.status === "correct") correctDays.add(dayKey(r.attemptedAt));
  }
  const sorted = Array.from(correctDays).sort();
  let longest = 0;
  let current = 0;
  let prev: string | null = null;
  let runningStreak = 0;
  for (const d of sorted) {
    if (prev === null) {
      runningStreak = 1;
    } else {
      const gapMs = new Date(d).getTime() - new Date(prev).getTime();
      const gapDays = Math.round(gapMs / DAY_MS);
      runningStreak = gapDays === 1 ? runningStreak + 1 : 1;
    }
    longest = Math.max(longest, runningStreak);
    prev = d;
  }
  // current = streak that ends on the most recent day, only if today or yesterday.
  if (prev) {
    const gapMs = Date.now() - new Date(prev).getTime();
    const gapDays = Math.floor(gapMs / DAY_MS);
    current = gapDays <= 1 ? runningStreak : 0;
  }
  return { currentDays: current, longestDays: longest };
}

function awardBadges(pupilId: string, rows: GamificationAttempt[], streak: PupilStreak): BadgeAward[] {
  const awards: BadgeAward[] = [];
  const correctCount = rows.filter((r) => r.status === "correct").length;
  // first-correct
  const firstCorrect = rows.find((r) => r.status === "correct");
  if (firstCorrect) {
    awards.push({ pupilId, badgeId: "first-correct", awardedAt: firstCorrect.attemptedAt });
  }
  if (correctCount >= 10) {
    awards.push({ pupilId, badgeId: "10-correct", awardedAt: rows[rows.length - 1].attemptedAt });
  }
  if (correctCount >= 50) {
    awards.push({ pupilId, badgeId: "50-correct", awardedAt: rows[rows.length - 1].attemptedAt });
  }
  if (correctCount >= 100) {
    awards.push({ pupilId, badgeId: "century", awardedAt: rows[rows.length - 1].attemptedAt });
  }
  if (streak.longestDays >= 5) {
    awards.push({ pupilId, badgeId: "5-day-streak", awardedAt: rows[rows.length - 1].attemptedAt });
  }
  if (streak.longestDays >= 30) {
    awards.push({ pupilId, badgeId: "30-day-streak", awardedAt: rows[rows.length - 1].attemptedAt });
  }
  return awards;
}

function initialsFromId(pupilId: string): string {
  // Deterministic: first 1-2 chars of the id (already anonymous).
  const trimmed = pupilId.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return trimmed.length >= 2 ? `${trimmed[0]}.${trimmed[1]}.` : trimmed.padEnd(2, "·");
}

export interface GamificationOptions {
  /** Opt-out pupil ids (never appear in leaderboard). */
  optedOutPupilIds?: string[];
  /** Hide bottom-N pupils from leaderboard (default 3). */
  hideBottomN?: number;
}

export function runGamification(
  attempts: GamificationAttempt[],
  options: GamificationOptions = {},
): GamificationOutput {
  const safe = (attempts || []).slice();
  safe.sort((a, b) => {
    if (a.pupilId !== b.pupilId) return a.pupilId.localeCompare(b.pupilId);
    return a.attemptedAt.localeCompare(b.attemptedAt);
  });
  const byPupil = new Map<string, GamificationAttempt[]>();
  for (const a of safe) {
    if (!byPupil.has(a.pupilId)) byPupil.set(a.pupilId, []);
    byPupil.get(a.pupilId)!.push(a);
  }
  const optedOut = new Set(options.optedOutPupilIds || []);
  const streaks: PupilStreak[] = [];
  const badges: BadgeAward[] = [];
  const correctCounts: { pupilId: string; count: number }[] = [];
  for (const [pupilId, rows] of Array.from(byPupil.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    const sr = calcStreak(rows);
    const streak: PupilStreak = { pupilId, ...sr };
    streaks.push(streak);
    badges.push(...awardBadges(pupilId, rows, streak));
    correctCounts.push({ pupilId, count: rows.filter((r) => r.status === "correct").length });
  }
  // Leaderboard: percentile-ranked. Bottom-N hidden from public view.
  const sortedByCorrect = correctCounts.slice().sort((a, b) => a.count - b.count);
  const hideN = Math.max(0, options.hideBottomN ?? 3);
  const hidden = new Set<string>([
    ...optedOut,
    ...sortedByCorrect.slice(0, Math.min(hideN, sortedByCorrect.length)).map((x) => x.pupilId),
  ]);
  const eligible = sortedByCorrect.filter((x) => !hidden.has(x.pupilId));
  const total = eligible.length || 1;
  const leaderboard: LeaderboardEntry[] = eligible
    .map((x, i) => ({
      pupilId: x.pupilId,
      initials: initialsFromId(x.pupilId),
      totalCorrect: x.count,
      percentile: Math.round(((i + 1) / total) * 100),
    }))
    .sort((a, b) => b.totalCorrect - a.totalCorrect);
  return {
    streaks,
    badges,
    leaderboard,
    hiddenFromLeaderboard: Array.from(hidden),
  };
}

export const __testing = { calcStreak, initialsFromId };
