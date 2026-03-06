/**
 * Scheduler persistence layer.
 * Stores scheduler configs in localStorage so they survive page refreshes.
 * The actual interval firing is handled by useScheduler hook (in hooks/useScheduler.ts).
 */

export interface SchedulerConfig {
  childId: string;
  enabled: boolean;
  subject: string;
  frequency: "daily" | "weekly" | "biweekly";
  difficulty: "foundation" | "mixed" | "higher";
  includeAnswers: boolean;
  includeRecall: boolean;
  /** ISO timestamp of when the next worksheet should be generated */
  nextFireAt: string | null;
  /** ISO timestamp of last generation */
  lastFiredAt: string | null;
  /** Title of the last generated worksheet (for recall) */
  lastWorksheetTitle: string | null;
  /** Key vocabulary from the last worksheet topic (for recall) */
  lastKeyVocabulary: string[];
  /** Index into the topic bank for this child+subject */
  topicIndex: number;
}

const STORAGE_KEY = "adaptly_schedulers";

export function loadAllSchedulers(): Record<string, SchedulerConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveAllSchedulers(configs: Record<string, SchedulerConfig>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  } catch {
    // localStorage full or unavailable
  }
}

export function loadScheduler(childId: string): SchedulerConfig {
  const all = loadAllSchedulers();
  return all[childId] || defaultScheduler(childId);
}

export function saveScheduler(config: SchedulerConfig): void {
  const all = loadAllSchedulers();
  all[config.childId] = config;
  saveAllSchedulers(all);
}

export function defaultScheduler(childId: string): SchedulerConfig {
  return {
    childId,
    enabled: false,
    subject: "mathematics",
    frequency: "weekly",
    difficulty: "mixed",
    includeAnswers: true,
    includeRecall: true,
    nextFireAt: null,
    lastFiredAt: null,
    lastWorksheetTitle: null,
    lastKeyVocabulary: [],
    topicIndex: 0,
  };
}

/**
 * Calculate the next fire timestamp from now based on frequency.
 */
export function calcNextFireAt(frequency: SchedulerConfig["frequency"]): string {
  const ms = frequency === "daily" ? 86400000
    : frequency === "weekly" ? 7 * 86400000
    : 14 * 86400000;
  return new Date(Date.now() + ms).toISOString();
}

/**
 * Check if a scheduler is due to fire right now.
 */
export function isDue(config: SchedulerConfig): boolean {
  if (!config.enabled || !config.nextFireAt) return false;
  return new Date(config.nextFireAt).getTime() <= Date.now();
}

/**
 * Human-readable label for frequency.
 */
export function frequencyLabel(f: SchedulerConfig["frequency"]): string {
  return f === "daily" ? "every day" : f === "weekly" ? "every week" : "every 2 weeks";
}
