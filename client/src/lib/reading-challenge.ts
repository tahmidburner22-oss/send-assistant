/**
 * reading-challenge.ts — Year of Reading 2026 habit tracker.
 *
 * Stores a per-pupil reading log in localStorage so teachers can track
 * books-read, pages-read, genre diversity and weekly streaks during the
 * UK Year of Reading. Designed to be additive — no backend changes.
 *
 * Storage shape:
 *   adaptly_reading_challenge_v1 = {
 *     entries: ReadingEntry[],
 *     goalsByPupil: Record<pupilId, ReadingGoals>,
 *   }
 *
 * Aggregations (class thermometer, milestones) are computed on read to
 * avoid stale derived state.
 */

const STORAGE_KEY = "adaptly_reading_challenge_v1";

export interface ReadingEntry {
  id: string;
  pupilId: string;
  pupilName: string;
  bookTitle: string;
  author?: string;
  genre?: string;
  pagesRead: number;
  /** ISO date string (YYYY-MM-DD) — the day the reading happened. */
  date: string;
  /** Optional 1–5 enjoyment rating. */
  rating?: number;
  notes?: string;
  /** Marks an entry as a *finished* book (counts to "books completed"). */
  finished?: boolean;
}

export interface ReadingGoals {
  /** Target books to finish during the challenge window. */
  booksTarget: number;
  /** Target distinct genres. */
  genresTarget: number;
}

interface ReadingChallengeStore {
  entries: ReadingEntry[];
  goalsByPupil: Record<string, ReadingGoals>;
}

const DEFAULT_GOALS: ReadingGoals = { booksTarget: 12, genresTarget: 6 };

function load(): ReadingChallengeStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [], goalsByPupil: {} };
    const parsed = JSON.parse(raw) as Partial<ReadingChallengeStore>;
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      goalsByPupil: parsed.goalsByPupil ?? {},
    };
  } catch {
    return { entries: [], goalsByPupil: {} };
  }
}

function save(store: ReadingChallengeStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* localStorage quota — ignore */
  }
}

export function listEntries(pupilId?: string): ReadingEntry[] {
  const { entries } = load();
  const filtered = pupilId ? entries.filter(e => e.pupilId === pupilId) : entries;
  return [...filtered].sort((a, b) => b.date.localeCompare(a.date));
}

export function addEntry(entry: Omit<ReadingEntry, "id">): ReadingEntry {
  const store = load();
  const newEntry: ReadingEntry = {
    ...entry,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  };
  store.entries.unshift(newEntry);
  save(store);
  return newEntry;
}

export function deleteEntry(id: string): void {
  const store = load();
  store.entries = store.entries.filter(e => e.id !== id);
  save(store);
}

export function getGoals(pupilId: string): ReadingGoals {
  const { goalsByPupil } = load();
  return goalsByPupil[pupilId] ?? DEFAULT_GOALS;
}

export function setGoals(pupilId: string, goals: ReadingGoals): void {
  const store = load();
  store.goalsByPupil[pupilId] = goals;
  save(store);
}

// ── Aggregations ────────────────────────────────────────────────────────────

export interface PupilSummary {
  pupilId: string;
  pupilName: string;
  totalEntries: number;
  totalPages: number;
  booksFinished: number;
  uniqueGenres: string[];
  /** Consecutive weeks with at least one entry, ending this week. */
  weeklyStreak: number;
  /** ISO date of most recent entry, or null. */
  lastReadAt: string | null;
  goals: ReadingGoals;
}

export interface ClassSummary {
  totalEntries: number;
  totalPages: number;
  booksFinished: number;
  uniqueGenres: string[];
  pupilCount: number;
  /** Total books finished across all pupils, against a per-pupil target. */
  classBooksTarget: number;
}

/**
 * Calculate the ISO-week index (Mon-Sun) of a YYYY-MM-DD date string.
 * Returns a number that increases monotonically — used only for diffs.
 */
function isoWeekIndex(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return 0;
  const day = (d.getUTCDay() + 6) % 7; // Mon=0
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
  return Math.floor(monday.getTime() / (7 * 24 * 60 * 60 * 1000));
}

function computeWeeklyStreak(entries: ReadingEntry[]): number {
  if (entries.length === 0) return 0;
  const weeks = new Set(entries.map(e => isoWeekIndex(e.date)));
  const today = new Date();
  const todayWeek = isoWeekIndex(today.toISOString().slice(0, 10));
  let streak = 0;
  // Allow either this-week or last-week as starting point so a Monday
  // generates a sensible "1" without requiring a Sunday entry.
  const start = weeks.has(todayWeek) ? todayWeek : todayWeek - 1;
  for (let w = start; weeks.has(w); w--) streak++;
  return streak;
}

export function summariseForPupil(
  pupilId: string,
  pupilName: string,
): PupilSummary {
  const entries = listEntries(pupilId);
  const uniqueGenres = Array.from(
    new Set(entries.map(e => (e.genre || "").trim()).filter(Boolean)),
  );
  const lastReadAt = entries[0]?.date ?? null;
  return {
    pupilId,
    pupilName,
    totalEntries: entries.length,
    totalPages: entries.reduce((sum, e) => sum + (e.pagesRead || 0), 0),
    booksFinished: entries.filter(e => e.finished).length,
    uniqueGenres,
    weeklyStreak: computeWeeklyStreak(entries),
    lastReadAt,
    goals: getGoals(pupilId),
  };
}

export function summariseForClass(pupils: { id: string; name: string }[]): ClassSummary {
  const all = listEntries();
  const allowed = new Set(pupils.map(p => p.id));
  const inScope = all.filter(e => allowed.has(e.pupilId));
  const uniqueGenres = Array.from(
    new Set(inScope.map(e => (e.genre || "").trim()).filter(Boolean)),
  );
  // Class target derives from the first pupil's goal (teachers usually set
  // a uniform goal); fall back to default.
  const sampleGoals = pupils[0] ? getGoals(pupils[0].id) : DEFAULT_GOALS;
  return {
    totalEntries: inScope.length,
    totalPages: inScope.reduce((sum, e) => sum + (e.pagesRead || 0), 0),
    booksFinished: inScope.filter(e => e.finished).length,
    uniqueGenres,
    pupilCount: pupils.length,
    classBooksTarget: sampleGoals.booksTarget * Math.max(1, pupils.length),
  };
}

// ── Milestones (for celebration certificate) ────────────────────────────────

export type Milestone =
  | "first-book"
  | "five-books"
  | "ten-books"
  | "genre-explorer"
  | "century-pages"
  | "marathon-pages"
  | "streak-four-weeks";

export interface MilestoneInfo {
  id: Milestone;
  label: string;
  description: string;
  emoji: string;
}

const MILESTONE_CATALOG: MilestoneInfo[] = [
  { id: "first-book", label: "First Book Finished", description: "Completed their very first book.", emoji: "📖" },
  { id: "five-books", label: "Five-Book Reader", description: "Completed five whole books.", emoji: "🏅" },
  { id: "ten-books", label: "Ten-Book Reader", description: "Completed ten whole books.", emoji: "🏆" },
  { id: "genre-explorer", label: "Genre Explorer", description: "Read across five different genres.", emoji: "🧭" },
  { id: "century-pages", label: "Century of Pages", description: "Logged 100 pages of reading.", emoji: "💯" },
  { id: "marathon-pages", label: "Reading Marathon", description: "Logged 500 pages of reading.", emoji: "🎯" },
  { id: "streak-four-weeks", label: "Four-Week Streak", description: "Read in four consecutive weeks.", emoji: "🔥" },
];

export function earnedMilestones(summary: PupilSummary): MilestoneInfo[] {
  const earned: Milestone[] = [];
  if (summary.booksFinished >= 1) earned.push("first-book");
  if (summary.booksFinished >= 5) earned.push("five-books");
  if (summary.booksFinished >= 10) earned.push("ten-books");
  if (summary.uniqueGenres.length >= 5) earned.push("genre-explorer");
  if (summary.totalPages >= 100) earned.push("century-pages");
  if (summary.totalPages >= 500) earned.push("marathon-pages");
  if (summary.weeklyStreak >= 4) earned.push("streak-four-weeks");
  return MILESTONE_CATALOG.filter(m => earned.includes(m.id));
}

export function nextMilestone(summary: PupilSummary): { info: MilestoneInfo; progressPct: number } | null {
  const earned = new Set(earnedMilestones(summary).map(m => m.id));
  // Ordered by ease of next-reach.
  const tiers: Array<{ id: Milestone; current: number; target: number }> = [
    { id: "first-book", current: summary.booksFinished, target: 1 },
    { id: "century-pages", current: summary.totalPages, target: 100 },
    { id: "five-books", current: summary.booksFinished, target: 5 },
    { id: "genre-explorer", current: summary.uniqueGenres.length, target: 5 },
    { id: "streak-four-weeks", current: summary.weeklyStreak, target: 4 },
    { id: "ten-books", current: summary.booksFinished, target: 10 },
    { id: "marathon-pages", current: summary.totalPages, target: 500 },
  ];
  for (const t of tiers) {
    if (earned.has(t.id)) continue;
    const info = MILESTONE_CATALOG.find(m => m.id === t.id)!;
    const progressPct = Math.min(100, Math.round((t.current / t.target) * 100));
    return { info, progressPct };
  }
  return null;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
