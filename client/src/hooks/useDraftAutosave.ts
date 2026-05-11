/**
 * useDraftAutosave — debounced localStorage persistence for tool form state.
 *
 * Every tool in /pages/tools/ is a form whose values are passed to an AI call.
 * If the tab reloads, the user navigates away, or the AI call fails mid-flight,
 * carefully-typed inputs are lost. This hook fixes that for all 23 tools with
 * one line inside AIToolPage.
 *
 * Contract:
 *   - values are serialised with JSON.stringify, capped at ~100KB per key
 *   - writes are debounced by `delayMs` (default 800ms) to avoid churn
 *   - returned `restore` reads the stored draft or null if empty/corrupt
 *   - returned `discard` removes the stored draft (called on successful generate)
 *   - returned `hasDraft` is true if a stored value exists for this toolId
 *
 * Storage key layout:  adaptly_draft_v1_<toolId>
 *
 * GDPR note: field values may contain teacher-provided PII (initials etc.).
 * This hook stores to localStorage only, which is origin-scoped and never
 * leaves the user's browser. Drafts auto-expire after MAX_AGE_MS (7 days).
 */
import { useCallback, useEffect, useRef } from "react";

const STORAGE_PREFIX = "adaptly_draft_v1_";
const MAX_BYTES = 100_000;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface StoredDraft<T> {
  v: 1;
  at: number; // epoch ms
  d: T;       // the data
}

function keyFor(toolId: string): string {
  return STORAGE_PREFIX + toolId;
}

export interface UseDraftAutosaveApi<T> {
  /** Read the stored draft (if any, and not expired). Returns null otherwise. */
  restore: () => T | null;
  /** Remove the stored draft — call this after a successful generation. */
  discard: () => void;
  /** True when a non-empty draft is currently persisted for this toolId. */
  hasDraft: () => boolean;
}

export function useDraftAutosave<T>(
  toolId: string,
  values: T,
  opts: { delayMs?: number; enabled?: boolean; isEmpty?: (v: T) => boolean } = {}
): UseDraftAutosaveApi<T> {
  const { delayMs = 800, enabled = true, isEmpty } = opts;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWrittenRef = useRef<string>("");

  // Default emptiness check — treats `null`, `undefined`, `""`, empty objects
  // and arrays-of-only-empty-strings as empty so we don't persist useless rows.
  const defaultIsEmpty = useCallback((v: T): boolean => {
    if (v == null) return true;
    if (typeof v === "string") return v.trim() === "";
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === "object") {
      const entries = Object.values(v as Record<string, unknown>);
      if (entries.length === 0) return true;
      return entries.every(e => e == null || (typeof e === "string" && e.trim() === ""));
    }
    return false;
  }, []);

  // Debounced write effect.
  useEffect(() => {
    if (!enabled || !toolId) return;
    const empty = (isEmpty || defaultIsEmpty)(values);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        if (empty) {
          // Clear any previously saved draft when values return to empty.
          if (lastWrittenRef.current !== "") {
            window.localStorage.removeItem(keyFor(toolId));
            lastWrittenRef.current = "";
          }
          return;
        }
        const record: StoredDraft<T> = { v: 1, at: Date.now(), d: values };
        const serialised = JSON.stringify(record);
        if (serialised.length > MAX_BYTES) return; // silently drop oversized drafts
        if (serialised === lastWrittenRef.current) return;
        window.localStorage.setItem(keyFor(toolId), serialised);
        lastWrittenRef.current = serialised;
      } catch {
        /* quota / disabled storage — ignore */
      }
    }, delayMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toolId, values, delayMs, enabled, isEmpty, defaultIsEmpty]);

  const restore = useCallback((): T | null => {
    if (!toolId) return null;
    try {
      const raw = window.localStorage.getItem(keyFor(toolId));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredDraft<T>;
      if (!parsed || parsed.v !== 1 || typeof parsed.at !== "number") return null;
      if (Date.now() - parsed.at > MAX_AGE_MS) {
        window.localStorage.removeItem(keyFor(toolId));
        return null;
      }
      return parsed.d;
    } catch {
      return null;
    }
  }, [toolId]);

  const discard = useCallback((): void => {
    try {
      window.localStorage.removeItem(keyFor(toolId));
      lastWrittenRef.current = "";
    } catch { /* ignore */ }
  }, [toolId]);

  const hasDraft = useCallback((): boolean => {
    try {
      const raw = window.localStorage.getItem(keyFor(toolId));
      if (!raw) return false;
      const parsed = JSON.parse(raw) as StoredDraft<T>;
      return !!parsed && parsed.v === 1 && Date.now() - (parsed.at || 0) <= MAX_AGE_MS;
    } catch {
      return false;
    }
  }, [toolId]);

  return { restore, discard, hasDraft };
}

export default useDraftAutosave;
