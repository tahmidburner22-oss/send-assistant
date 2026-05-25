/**
 * school-identity.ts — per-user school branding for the Presentation Maker.
 *
 * Stores a school's name, motto, logo (data-URL) and brand colour locally so
 * every deck the teacher builds can carry a small footer watermark and a
 * front-page logo. Persists in localStorage; no server roundtrip.
 *
 * Each presentation can override the global default by attaching an override
 * to the saved deck JSON in future, but the MVP just reads the global record.
 */

const KEY = "adaptly_school_identity_v1";

export interface SchoolIdentity {
  name?: string;
  motto?: string;
  /** Base64 data URL e.g. "data:image/png;base64,...". */
  logoDataUrl?: string;
  /** Hex with leading '#'. */
  brandColour?: string;
  /** When true, every slide gets a small footer watermark. */
  showOnEverySlide?: boolean;
}

export function readSchoolIdentity(): SchoolIdentity {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}

export function writeSchoolIdentity(v: SchoolIdentity): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {}
}

export function clearSchoolIdentity(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(KEY); } catch {}
}

/** Async helper: read a File and return its data-URL form. Used by the
 *  school-identity dialog when the teacher uploads a logo. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
