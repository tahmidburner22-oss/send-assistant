/**
 * featureFlags.ts — small, browser-only feature flag helper.
 *
 * Two layers, checked in this order:
 *
 *   1. Build-time env via import.meta.env.VITE_<FLAG>=1 — ships true for
 *      every build that bakes the flag in.
 *   2. localStorage opt-in via key "adaptly:flag:<flag>" === "1" — lets the
 *      dev or a beta tester turn the flag on without a redeploy.
 *
 * Default is OFF. We deliberately return a plain boolean (no observable)
 * so call sites can be `if (isFeatureEnabled('COVERAGE_MAP_ENABLED'))` and
 * the page code stays trivial. If the flag flips at runtime via the
 * localStorage path, a manual page reload picks it up — that matches what
 * the Phase C PHASE-PLAN.md asks for ("hide behind feature flag while spec-
 * point taxonomy is bootstrapping").
 */

export type FeatureFlag = "COVERAGE_MAP_ENABLED";

const STORAGE_PREFIX = "adaptly:flag:";

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  // 1. Build-time env. Vite exposes import.meta.env.VITE_*; access through
  //    `(import.meta as any).env` so this file compiles in node-test contexts
  //    where import.meta is otherwise narrow.
  try {
    const env = (import.meta as { env?: Record<string, string | undefined> }).env;
    if (env && env[`VITE_${flag}`] === "1") return true;
  } catch { /* swallow — typeof import.meta in unusual environments */ }

  // 2. localStorage opt-in (dev / beta tester).
  // Accepts both the canonical key (adaptly:flag:<FLAG>=1) and the legacy
  // shorthand key (<FLAG>=true) so the QA spec's setItem call also works.
  if (typeof window !== "undefined") {
    try {
      if (window.localStorage.getItem(STORAGE_PREFIX + flag) === "1") return true;
      // Legacy / QA-spec shorthand: COVERAGE_MAP_ENABLED=true
      const legacyVal = window.localStorage.getItem(flag);
      if (legacyVal === "1" || legacyVal === "true") return true;
    } catch { /* swallow — denied or full */ }
  }

  return false;
}

/**
 * Convenience setter for the localStorage opt-in. Used by the Settings
 * surface (and dev consoles) to flip a flag on without redeploying.
 */
export function setFeatureFlagOptIn(flag: FeatureFlag, enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (enabled) window.localStorage.setItem(STORAGE_PREFIX + flag, "1");
    else         window.localStorage.removeItem(STORAGE_PREFIX + flag);
  } catch { /* swallow */ }
}
