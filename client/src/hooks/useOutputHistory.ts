/**
 * useOutputHistory — per-tool localStorage history of recent generations.
 *
 * Solves the single most-asked feature in any AI generator product: "I clicked
 * Regenerate, the new output is worse, give me my old one back". useDraftAutosave
 * persists the *form*; this persists the *result*.
 *
 * Storage layout:  adaptly_history_v1_<toolSlug>  →  HistoryEntry[] (newest first)
 * Cap:             10 entries per tool, 50 KB per entry, ~500 KB total per tool
 * Eviction:        oldest first when over MAX_ENTRIES; size-prune on push
 *
 * GDPR: identical to useDraftAutosave — localStorage, origin-scoped, never sent
 * over the wire. Entries auto-expire after MAX_AGE_MS (14 days).
 */
import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX  = "adaptly_history_v1_";
const MAX_ENTRIES     = 10;
const MAX_BYTES_ENTRY = 50_000;
const MAX_AGE_MS      = 14 * 24 * 60 * 60 * 1000;

export interface HistoryEntry {
  id: string;
  at: number;                     // epoch ms
  values: Record<string, string>; // form values used to generate
  output: string;                 // raw AI output text
  title?: string;                 // human-readable summary
}

export interface UseOutputHistoryApi {
  entries: HistoryEntry[];
  push: (entry: Omit<HistoryEntry, "id" | "at">) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** Restore a single entry's data (caller decides what to do with it). */
  get: (id: string) => HistoryEntry | undefined;
}

function keyFor(toolSlug: string): string {
  return STORAGE_PREFIX + toolSlug;
}

function readAll(toolSlug: string): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(keyFor(toolSlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter(e =>
      e && typeof e.id === "string" && typeof e.output === "string" &&
      typeof e.at === "number" && (now - e.at) < MAX_AGE_MS,
    );
  } catch {
    return [];
  }
}

function writeAll(toolSlug: string, entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(keyFor(toolSlug), JSON.stringify(entries));
  } catch {
    // Quota exceeded — drop the oldest half and retry once.
    try {
      const halved = entries.slice(0, Math.max(1, Math.floor(entries.length / 2)));
      localStorage.setItem(keyFor(toolSlug), JSON.stringify(halved));
    } catch {
      // Give up silently — history is best-effort.
    }
  }
}

export function useOutputHistory(toolSlug: string): UseOutputHistoryApi {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  // Hydrate on mount and on tool change.
  useEffect(() => {
    if (!toolSlug) return;
    setEntries(readAll(toolSlug));
  }, [toolSlug]);

  const push = useCallback((entry: Omit<HistoryEntry, "id" | "at">) => {
    if (!toolSlug) return;
    const trimmedOutput = (entry.output || "").slice(0, MAX_BYTES_ENTRY);
    const newEntry: HistoryEntry = {
      ...entry,
      output: trimmedOutput,
      id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      at: Date.now(),
    };
    setEntries(prev => {
      // De-dupe: skip if identical output to the most recent entry.
      if (prev[0]?.output === newEntry.output) return prev;
      const next = [newEntry, ...prev].slice(0, MAX_ENTRIES);
      writeAll(toolSlug, next);
      return next;
    });
  }, [toolSlug]);

  const remove = useCallback((id: string) => {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      writeAll(toolSlug, next);
      return next;
    });
  }, [toolSlug]);

  const clear = useCallback(() => {
    setEntries([]);
    try { localStorage.removeItem(keyFor(toolSlug)); } catch {}
  }, [toolSlug]);

  const get = useCallback(
    (id: string) => entries.find(e => e.id === id),
    [entries],
  );

  return { entries, push, remove, clear, get };
}

export default useOutputHistory;
