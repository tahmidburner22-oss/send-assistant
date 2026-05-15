/**
 * PupilScopeContext — the single global "currently selected pupil" state.
 *
 * Today every tool re-asks "which pupil is this for?" via PupilContextPicker.
 * That's fine for one-off generations but breaks the connected experience the
 * platform is supposed to offer: a SENCO opens Maya's profile, jumps to draft
 * her BSP, then her parent letter — and has to re-pick her three times.
 *
 * This context exposes one pupil id that persists across navigations
 * (sessionStorage), and a hook every page can read. AIToolPage's
 * PupilContextPicker now syncs to / from this so picking a pupil in one
 * tool carries to the next, and clearing it in one place clears everywhere.
 *
 * GDPR posture: stores only the pupil id, never the name or PII.
 */
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

const STORAGE_KEY = "adaptly_pupil_scope_v1";

interface PupilScopeApi {
  /** Currently scoped pupil id, or "" for none. */
  pupilId: string;
  /** Set the scoped pupil. Pass "" to clear. */
  setPupilId: (id: string) => void;
  /** Convenience flag. */
  hasPupil: boolean;
}

const PupilScopeContext = createContext<PupilScopeApi | null>(null);

export function PupilScopeProvider({ children }: { children: ReactNode }) {
  const [pupilId, setPupilState] = useState<string>("");

  // Hydrate from sessionStorage on mount.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setPupilState(saved);
    } catch {}
  }, []);

  const setPupilId = useCallback((id: string) => {
    setPupilState(id);
    try {
      if (id) sessionStorage.setItem(STORAGE_KEY, id);
      else    sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    // Notify other tabs (rare but cheap — and the URL handoff for /pupils/:id
    // navigations from external links).
    try {
      window.dispatchEvent(new CustomEvent("adaptly:pupil-scope-change", { detail: { id } }));
    } catch {}
  }, []);

  return (
    <PupilScopeContext.Provider value={{ pupilId, setPupilId, hasPupil: !!pupilId }}>
      {children}
    </PupilScopeContext.Provider>
  );
}

export function usePupilScope(): PupilScopeApi {
  const ctx = useContext(PupilScopeContext);
  // Soft fallback so components rendered outside the provider (rare —
  // only a handful of standalone routes) don't crash.
  if (!ctx) {
    return {
      pupilId: "",
      setPupilId: () => {},
      hasPupil: false,
    };
  }
  return ctx;
}
