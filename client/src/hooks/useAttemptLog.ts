/**
 * useAttemptLog — FEAT-PC4 (UI half) · Phase C
 *
 * React hook that gives the Curriculum Coverage page a reactive, persisted
 * view of every WorksheetAttempt that has been recorded in this browser.
 *
 * The log itself lives in localStorage, keyed by attemptLog.STORAGE_KEY.
 * Two events trigger a re-read:
 *
 *   - "storage"  → another browser tab scanned a worksheet, append our copy.
 *   - "adaptly:attempt-log-updated" → THIS tab scanned a worksheet, the
 *     attemptLog module dispatched the custom event after appendAttempt().
 *
 * No timers, no polling. The hook is a thin reactive wrapper — the heavy
 * lifting (dedupe, cap, parse) lives in lib/attemptLog.
 */

import { useCallback, useEffect, useState } from "react";
import {
  readAttemptLog,
  appendAttempt as appendToStore,
  clearAttemptLog as clearStore,
  type StoredAttempt,
} from "@/lib/attemptLog";

export interface UseAttemptLogReturn {
  attempts: StoredAttempt[];
  /** Append-or-upsert a single attempt and refresh the in-memory snapshot. */
  appendAttempt: (attempt: StoredAttempt) => void;
  /** Wipe the log — used by the "Clear history" action on the Coverage page. */
  clearAttemptLog: () => void;
}

export function useAttemptLog(): UseAttemptLogReturn {
  const [attempts, setAttempts] = useState<StoredAttempt[]>(() => readAttemptLog());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const refresh = () => setAttempts(readAttemptLog());
    const onStorage = (e: StorageEvent) => {
      // Only refresh when our key changed; other tabs writing unrelated
      // keys shouldn't cost us a render.
      if (e.key && !e.key.startsWith("adaptly:attemptLog")) return;
      refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("adaptly:attempt-log-updated", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("adaptly:attempt-log-updated", refresh);
    };
  }, []);

  const appendAttempt = useCallback((attempt: StoredAttempt) => {
    const next = appendToStore(attempt);
    setAttempts(next);
  }, []);

  const clearAttemptLog = useCallback(() => {
    clearStore();
    setAttempts([]);
  }, []);

  return { attempts, appendAttempt, clearAttemptLog };
}
