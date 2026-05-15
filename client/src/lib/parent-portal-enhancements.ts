/**
 * parent-portal-enhancements.ts — Improvements layered onto the Parent Portal.
 *
 *  1. Multi-language UI (top-5 EAL languages + RTL Arabic / Urdu)
 *  2. Pupil-as-user mode (child-friendly view from same login)
 *  3. Read-receipt + nudge (auto-resend after 7 days)
 *  4. Two-way messaging with safeguarding redaction (DSL flag)
 *  5. Consent ledger (versioned signature trail)
 */

const PORTAL_MESSAGES_KEY = "adaptly_portal_messages_v1";
const PORTAL_CONSENT_KEY  = "adaptly_portal_consent_v1";

// ── 1. Multi-language UI ────────────────────────────────────────────────────

export type PortalLang = "en" | "pl" | "ur" | "ro" | "lt" | "ar";

export const PORTAL_LANG_LABEL: Record<PortalLang, string> = {
  en: "English",
  pl: "Polski",
  ur: "اردو",
  ro: "Română",
  lt: "Lietuvių",
  ar: "العربية",
};

export const PORTAL_LANG_DIR: Record<PortalLang, "ltr" | "rtl"> = {
  en: "ltr", pl: "ltr", ur: "rtl", ro: "ltr", lt: "ltr", ar: "rtl",
};

/** Minimal UI string bundle — covers the most-trafficked nouns/verbs. */
const STRINGS: Record<string, Record<PortalLang, string>> = {
  "portal.title":   { en: "Parent Portal", pl: "Portal rodzica", ur: "والدین کا پورٹل", ro: "Portal părinți", lt: "Tėvų portalas", ar: "بوابة ولي الأمر" },
  "messages":       { en: "Messages",      pl: "Wiadomości",      ur: "پیغامات",         ro: "Mesaje",        lt: "Pranešimai",   ar: "الرسائل" },
  "send":           { en: "Send",          pl: "Wyślij",          ur: "بھیجیں",          ro: "Trimite",        lt: "Siųsti",        ar: "إرسال" },
  "consents":       { en: "Consents",      pl: "Zgody",            ur: "رضامندی",          ro: "Consimțăminte", lt: "Sutikimai",      ar: "الموافقات" },
  "child.view":     { en: "Pupil view",    pl: "Widok ucznia",     ur: "طالب علم کا منظر", ro: "Vizualizare elev", lt: "Mokinio rodinys", ar: "عرض الطالب" },
  "today":          { en: "Today",         pl: "Dziś",             ur: "آج",                ro: "Astăzi",         lt: "Šiandien",     ar: "اليوم" },
  "logout":         { en: "Sign out",      pl: "Wyloguj",          ur: "لاگ آؤٹ",          ro: "Deconectare",    lt: "Atsijungti",   ar: "تسجيل الخروج" },
};

export function t(key: string, lang: PortalLang): string {
  return STRINGS[key]?.[lang] ?? STRINGS[key]?.en ?? key;
}

// ── 2. Pupil-as-user mode ───────────────────────────────────────────────────

export type PortalAudience = "parent" | "pupil";

export interface PortalView {
  audience: PortalAudience;
  density: "comfortable" | "child-large";
  showAdminLanguage: boolean;
  iconSizePx: number;
}

export function viewFor(audience: PortalAudience): PortalView {
  return audience === "pupil"
    ? { audience: "pupil", density: "child-large", showAdminLanguage: false, iconSizePx: 36 }
    : { audience: "parent", density: "comfortable", showAdminLanguage: true, iconSizePx: 18 };
}

// ── 3. Read-receipt + nudge ─────────────────────────────────────────────────

export interface PortalMessage {
  id: string;
  pupilId: string;
  recipientUserId: string;     // parent or pupil id
  subject: string;
  body: string;
  lang: PortalLang;
  sentAt: number;
  openedAt?: number;
  nudgedAt?: number;
}

export function listMessages(): PortalMessage[] {
  try { return JSON.parse(localStorage.getItem(PORTAL_MESSAGES_KEY) || "[]"); } catch { return []; }
}

function saveAllMessages(msgs: PortalMessage[]): void {
  try { localStorage.setItem(PORTAL_MESSAGES_KEY, JSON.stringify(msgs.slice(-1000))); } catch {}
}

export function sendMessage(opts: Omit<PortalMessage, "id" | "sentAt" | "openedAt" | "nudgedAt">): PortalMessage {
  const m: PortalMessage = {
    ...opts,
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sentAt: Date.now(),
  };
  const all = listMessages();
  all.push(m);
  saveAllMessages(all);
  return m;
}

export function markOpened(id: string): void {
  const all = listMessages();
  const m = all.find((x) => x.id === id);
  if (m && !m.openedAt) {
    m.openedAt = Date.now();
    saveAllMessages(all);
  }
}

/** Returns messages older than `days` that have not been opened — eligible for a nudge. */
export function nudgeCandidates(days = 7): PortalMessage[] {
  const cutoff = Date.now() - days * 86400_000;
  return listMessages().filter((m) => !m.openedAt && m.sentAt < cutoff && (!m.nudgedAt || m.nudgedAt < m.sentAt + days * 86400_000));
}

export function markNudged(id: string): void {
  const all = listMessages();
  const m = all.find((x) => x.id === id);
  if (m) { m.nudgedAt = Date.now(); saveAllMessages(all); }
}

// ── 4. Safeguarding redaction (lint before send) ────────────────────────────

const SAFEGUARDING_PATTERNS: Array<{ rx: RegExp; reason: string }> = [
  { rx: /\bhit(?:s|ting)?\s+(?:me|him|her|them|the\s+kids?)/i, reason: "Possible disclosure of physical harm." },
  { rx: /\bhurts?\s+(?:me|him|her|them)/i,                       reason: "Possible disclosure of harm." },
  { rx: /\b(?:abuse|abused|abusing)\b/i,                          reason: "Mention of abuse." },
  { rx: /\bsuicid|self[-\s]?harm/i,                              reason: "Mental-health risk indicator." },
  { rx: /\bran\s+away|disappeared|missing\b/i,                  reason: "Possible safeguarding concern." },
  { rx: /\bdrugs?|alcohol\b/i,                                  reason: "Substance reference — review for context." },
];

export interface RedactionFinding {
  reason: string;
  excerpt: string;
}

export function safeguardingScan(text: string): RedactionFinding[] {
  const out: RedactionFinding[] = [];
  for (const { rx, reason } of SAFEGUARDING_PATTERNS) {
    const m = text.match(rx);
    if (m) out.push({ reason, excerpt: m[0] });
  }
  return out;
}

/**
 * Redact PII / safeguarding terms before forwarding outbound.
 * The DSL still receives the original via the safeguarding queue; only the
 * outbound copy is redacted.
 */
export function redactSafeguarding(text: string): string {
  let out = text;
  for (const { rx } of SAFEGUARDING_PATTERNS) {
    out = out.replace(rx, "[redacted — see DSL]");
  }
  return out;
}

// ── 5. Consent ledger ───────────────────────────────────────────────────────

export type ConsentKind =
  | "photographs"
  | "trips"
  | "data-sharing-mis"
  | "info-sharing-camhs"
  | "info-sharing-salt"
  | "info-sharing-ep"
  | "marketing";

export const CONSENT_LABEL: Record<ConsentKind, string> = {
  "photographs":         "Photographs",
  "trips":               "School trips",
  "data-sharing-mis":    "Data sharing — MIS",
  "info-sharing-camhs":  "Info sharing — CAMHS",
  "info-sharing-salt":   "Info sharing — SALT",
  "info-sharing-ep":     "Info sharing — Educational Psychologist",
  "marketing":           "Marketing communications",
};

export interface ConsentEntry {
  id: string;
  pupilId: string;
  kind: ConsentKind;
  granted: boolean;
  signedBy: string;
  signedAt: number;
  expiresAt?: number;
  notes?: string;
  version: number;
}

export function listConsents(pupilId: string): ConsentEntry[] {
  try {
    return (JSON.parse(localStorage.getItem(PORTAL_CONSENT_KEY) || "[]") as ConsentEntry[])
      .filter((c) => c.pupilId === pupilId)
      .sort((a, b) => a.signedAt - b.signedAt);
  } catch { return []; }
}

export function recordConsent(opts: Omit<ConsentEntry, "id" | "signedAt" | "version">): ConsentEntry {
  const all = (() => { try { return JSON.parse(localStorage.getItem(PORTAL_CONSENT_KEY) || "[]") as ConsentEntry[]; } catch { return []; } })();
  const existing = all.filter((c) => c.pupilId === opts.pupilId && c.kind === opts.kind);
  const version = (existing[existing.length - 1]?.version || 0) + 1;
  const rec: ConsentEntry = {
    ...opts,
    id: `cns_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    signedAt: Date.now(),
    version,
  };
  all.push(rec);
  try { localStorage.setItem(PORTAL_CONSENT_KEY, JSON.stringify(all.slice(-2000))); } catch {}
  return rec;
}

/** Latest consent state per kind for a pupil — used by photo gates etc. */
export function consentState(pupilId: string): Record<ConsentKind, ConsentEntry | undefined> {
  const out: Partial<Record<ConsentKind, ConsentEntry>> = {};
  for (const c of listConsents(pupilId)) out[c.kind] = c;
  return out as Record<ConsentKind, ConsentEntry | undefined>;
}

export function isConsentExpired(c: ConsentEntry, now = Date.now()): boolean {
  return !!c.expiresAt && c.expiresAt < now;
}
