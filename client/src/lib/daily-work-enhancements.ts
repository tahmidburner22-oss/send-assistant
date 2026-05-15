/**
 * daily-work-enhancements.ts — Improvements layered onto Daily Adaptive Work.
 *
 *  1. Effort target (e.g. 20 min/day) — tool sizes pack to pupil's typical concentration window
 *  2. Visual schedule wrapper — Now/Next/Then strip
 *  3. Parent companion sheet (auto-generated, in family's language)
 *  4. Adaptive on success and on struggle (steps up, not just down)
 *  5. Offline pack generator — printable PDF for a week, with QR-code answer key
 */

const SESSION_KEY = "adaptly_daily_work_sessions_v1";

// ── 1. Effort target ────────────────────────────────────────────────────────

export interface PupilSession {
  pupilId: string;
  startedAt: number;
  finishedAt: number;
  questionsAttempted: number;
  questionsCorrect: number;
  packMinutes: number;
}

export function logSession(session: Omit<PupilSession, "startedAt"> & { startedAt?: number }): void {
  try {
    const all = JSON.parse(localStorage.getItem(SESSION_KEY) || "[]") as PupilSession[];
    const rec: PupilSession = {
      pupilId: session.pupilId,
      startedAt: session.startedAt ?? (session.finishedAt - session.packMinutes * 60_000),
      finishedAt: session.finishedAt,
      questionsAttempted: session.questionsAttempted,
      questionsCorrect: session.questionsCorrect,
      packMinutes: session.packMinutes,
    };
    all.push(rec);
    localStorage.setItem(SESSION_KEY, JSON.stringify(all.slice(-2000)));
  } catch {}
}

export function listSessions(pupilId: string): PupilSession[] {
  try {
    return (JSON.parse(localStorage.getItem(SESSION_KEY) || "[]") as PupilSession[])
      .filter((s) => s.pupilId === pupilId)
      .sort((a, b) => a.startedAt - b.startedAt);
  } catch { return []; }
}

/**
 * Pupil's typical concentration window — average actual session minutes,
 * clipped to a sensible range for the year group.
 */
export function typicalConcentration(pupilId: string, fallbackMinutes = 15): number {
  const sessions = listSessions(pupilId).slice(-10);
  if (sessions.length === 0) return fallbackMinutes;
  const avg = sessions.reduce((a, s) => a + (s.finishedAt - s.startedAt) / 60_000, 0) / sessions.length;
  return Math.max(5, Math.min(45, Math.round(avg)));
}

/**
 * Convert an effort target (minutes) into a question count, given a typical
 * minute-per-question pace.
 */
export function questionsForTarget(opts: {
  targetMinutes: number;
  paceMinutesPerQuestion?: number;
}): number {
  const pace = opts.paceMinutesPerQuestion ?? 1.5;
  return Math.max(3, Math.round(opts.targetMinutes / pace));
}

// ── 2. Visual schedule (Now/Next/Then) ──────────────────────────────────────

export interface VisualScheduleEntry {
  id: string;
  label: string;
  minutes: number;
  icon?: string;       // emoji or icon key
  done?: boolean;
}

export function nowNextThen(entries: VisualScheduleEntry[], currentIndex: number): { now?: VisualScheduleEntry; next?: VisualScheduleEntry; then?: VisualScheduleEntry } {
  return {
    now:  entries[currentIndex],
    next: entries[currentIndex + 1],
    then: entries[currentIndex + 2],
  };
}

// ── 3. Parent companion sheet ───────────────────────────────────────────────

export interface CompanionSheet {
  pupilName: string;
  topics: string[];
  durationMinutes: number;
  helpInTwoMinutes: string[];
  praiseScript: string;
  language: string;
}

const HELP_TIPS_BY_TOPIC: Array<[RegExp, string[]]> = [
  [/read|phonic/i,        ["Listen to your child read for 2 minutes.", "Ask one inference question — 'why do you think…?'"]],
  [/maths|number/i,       ["Ask your child to explain one method out loud.", "Make a real-life example (counting in the kitchen)."]],
  [/spell|writ/i,         ["Look at one tricky word together.", "Ask your child to use it in a sentence."]],
  [/science/i,            ["Ask 'what would happen if…?' once.", "Link to something at home (cooking, weather)."]],
];

export function buildCompanionSheet(opts: {
  pupilName: string;
  topics: string[];
  durationMinutes: number;
  language?: string;
}): CompanionSheet {
  const tips = new Set<string>();
  for (const t of opts.topics) {
    for (const [rx, list] of HELP_TIPS_BY_TOPIC) {
      if (rx.test(t)) list.forEach((tip) => tips.add(tip));
    }
  }
  if (tips.size === 0) tips.add("Sit with your child for 2 minutes and ask one question about their work.");
  const praise = `${opts.pupilName} worked for ${opts.durationMinutes} minutes today on ${opts.topics.join(", ")}.`;
  return {
    pupilName: opts.pupilName,
    topics: opts.topics,
    durationMinutes: opts.durationMinutes,
    helpInTwoMinutes: Array.from(tips).slice(0, 3),
    praiseScript: praise,
    language: opts.language ?? "en-GB",
  };
}

export function companionAsText(c: CompanionSheet): string {
  return [
    `What ${c.pupilName} is working on today`,
    `(${c.durationMinutes} min · topics: ${c.topics.join(", ")})`,
    "",
    "Help in 2 minutes:",
    ...c.helpInTwoMinutes.map((t) => `• ${t}`),
    "",
    `Say: "${c.praiseScript}"`,
  ].join("\n");
}

// ── 4. Adaptive on success and on struggle ──────────────────────────────────

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface AdaptiveStep {
  current: Difficulty;
  recommended: Difficulty;
  reason: string;
}

/**
 * Bidirectional adaptive: scale up on streak of successes, scale down on streak
 * of struggle. Currently most engines only step down — this fixes that.
 */
export function nextDifficulty(opts: {
  current: Difficulty;
  recentResults: boolean[];        // most recent last; true = correct
  streakWindow?: number;
}): AdaptiveStep {
  const N = opts.streakWindow ?? 4;
  const tail = opts.recentResults.slice(-N);
  const allCorrect = tail.length === N && tail.every(Boolean);
  const allWrong   = tail.length === N && tail.every((r) => !r);
  if (allCorrect && opts.current < 5) {
    return { current: opts.current, recommended: (opts.current + 1) as Difficulty, reason: `${N} correct in a row — step up.` };
  }
  if (allWrong && opts.current > 1) {
    return { current: opts.current, recommended: (opts.current - 1) as Difficulty, reason: `${N} wrong in a row — step down.` };
  }
  return { current: opts.current, recommended: opts.current, reason: "Hold — within target band." };
}

// ── 5. Offline pack generator ───────────────────────────────────────────────

export interface OfflinePack {
  pupilId: string;
  pupilName: string;
  generatedAt: string;
  days: { date: string; minutes: number; topics: string[]; notes: string }[];
  qrAnswerKeyUrl: string;
}

export function buildOfflinePack(opts: {
  pupilId: string;
  pupilName: string;
  startDate: Date;
  topics: string[];
  perDayMinutes: number;
  baseUrl?: string;
}): OfflinePack {
  const baseUrl = opts.baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(opts.startDate);
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().slice(0, 10),
      minutes: opts.perDayMinutes,
      topics: opts.topics.slice(0, 2),
      notes: i === 0 ? "First task: easiest version." : i === 4 ? "Friday: quick recap of the week." : "",
    };
  });
  // QR points to a public answer-key URL the parent can scan.
  const qrTarget = `${baseUrl}/answer-key/${opts.pupilId}/${opts.startDate.toISOString().slice(0, 10)}`;
  const qrAnswerKeyUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrTarget)}`;
  return {
    pupilId: opts.pupilId,
    pupilName: opts.pupilName,
    generatedAt: new Date().toISOString(),
    days,
    qrAnswerKeyUrl,
  };
}

export function offlinePackAsText(p: OfflinePack): string {
  return [
    `${p.pupilName} — Daily Adaptive Work (printable, ${p.days.length}-day pack)`,
    `Generated ${new Date(p.generatedAt).toLocaleDateString("en-GB")}`,
    `QR answer key: ${p.qrAnswerKeyUrl}`,
    "─────────────────────────────",
    ...p.days.flatMap((d) => [
      "",
      `${d.date} (${d.minutes} min)`,
      `Topics: ${d.topics.join(", ")}`,
      d.notes ? `Note: ${d.notes}` : "",
    ]),
  ].filter(Boolean).join("\n");
}
