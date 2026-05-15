/**
 * companion-share.ts — Phase 4 / FEAT-005 (Pupil Companion mode)
 *
 * Token-protected, localStorage-backed share record for the
 * `/share/companion/:token` route. Mirrors the pattern used by
 * `PupilPassportShare` so the same teacher device can issue a share link
 * without a server round-trip while we wait for the DB-backed share table.
 *
 * Privacy notes:
 *  - The body stored is a *redacted* worksheet (questions + hint ladders +
 *    title + subject + topic + year group). NO teacher notes, NO answer
 *    keys, NO mark schemes, NO pupil identifiers.
 *  - Tokens are 32-char alphanumerics generated client-side. They expire 60
 *    days after issue (long enough for an end-of-half-term project).
 *  - The cache is capped at 200 records to avoid unbounded growth.
 */

import type { HintLadderEntry } from "@/lib/hint-ladder";

export interface CompanionQuestion {
  /** Stable id — matches `parseQuestionsFromSection` ladder ids (e.g. s0q3). */
  questionId: string;
  /** Section title for grouping in the pupil view. */
  sectionTitle: string;
  /** The actual question text (verbatim from the worksheet). */
  question: string;
  /** Optional 3-step hint ladder. Pupils reveal one at a time. */
  hints?: [string, string, string];
}

export interface CompanionShareRecord {
  token: string;
  /** Worksheet display title (e.g. "Year 8 Maths · Fractions"). */
  title: string;
  subject?: string;
  topic?: string;
  yearGroup?: string;
  /** ISO date string. Default 60 days. */
  expiresAt: string;
  /** ISO date string. */
  issuedAt: string;
  /** Email or display name of the teacher who issued the link, for audit only. */
  issuedBy?: string;
  /** Question list with optional hint ladders. */
  questions: CompanionQuestion[];
  /** Optional one-line encouragement printed at the top of the pupil view. */
  encouragement?: string;
}

const STORE_KEY = "adaptly_companion_shares_v1";
const MAX_RECORDS = 200;
const DEFAULT_TTL_DAYS = 60;

function readStore(): CompanionShareRecord[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeStore(records: CompanionShareRecord[]): void {
  try {
    // Cap at MAX_RECORDS, dropping the oldest by issuedAt.
    const sorted = [...records].sort((a, b) => {
      const ta = Date.parse(a.issuedAt) || 0;
      const tb = Date.parse(b.issuedAt) || 0;
      return ta - tb;
    });
    while (sorted.length > MAX_RECORDS) sorted.shift();
    localStorage.setItem(STORE_KEY, JSON.stringify(sorted));
  } catch {
    /* quota or private mode — best-effort */
  }
}

export function readCompanionShare(token: string): CompanionShareRecord | null {
  if (!token) return null;
  const all = readStore();
  const found = all.find((r) => r.token === token);
  if (!found) return null;
  if (Date.parse(found.expiresAt) < Date.now()) return null;
  return found;
}

export function writeCompanionShare(
  rec: Omit<CompanionShareRecord, "token" | "issuedAt" | "expiresAt"> & {
    token?: string;
    issuedAt?: string;
    expiresAt?: string;
    ttlDays?: number;
  },
): CompanionShareRecord {
  const all = readStore().filter((r) => r.token !== rec.token);
  const issuedAt = rec.issuedAt || new Date().toISOString();
  const ttl = rec.ttlDays ?? DEFAULT_TTL_DAYS;
  const expiresAt =
    rec.expiresAt || new Date(Date.now() + ttl * 24 * 60 * 60 * 1000).toISOString();
  const token = rec.token || generateToken();
  const out: CompanionShareRecord = {
    token,
    title: rec.title,
    subject: rec.subject,
    topic: rec.topic,
    yearGroup: rec.yearGroup,
    issuedBy: rec.issuedBy,
    issuedAt,
    expiresAt,
    questions: rec.questions || [],
    encouragement: rec.encouragement,
  };
  all.push(out);
  writeStore(all);
  return out;
}

export function deleteCompanionShare(token: string): void {
  const all = readStore().filter((r) => r.token !== token);
  writeStore(all);
}

/** Build a CompanionShareRecord from a generated worksheet + optional hint ladders. */
export function buildCompanionShare(input: {
  title: string;
  subject?: string;
  topic?: string;
  yearGroup?: string;
  issuedBy?: string;
  encouragement?: string;
  ttlDays?: number;
  sections: Array<{ title?: string; content?: string; type?: string; teacherOnly?: boolean }>;
  ladders?: HintLadderEntry[];
  /** Pre-existing token to overwrite (used when regenerating QR for the same worksheet). */
  token?: string;
}): CompanionShareRecord {
  const ladderById = new Map<string, HintLadderEntry>();
  (input.ladders || []).forEach((l) => ladderById.set(l.questionId, l));

  // Inline parser to avoid a circular dep through hint-ladder.ts.
  const parseQs = (content: string): string[] => {
    if (!content) return [];
    const stripped = content
      .replace(/^>\s.*$/gm, "")
      .replace(/^\s*\[.*?\]\s*$/gm, "")
      .replace(/^\s*✓.*$/gm, "")
      .trim();
    const lines = stripped.split(/\r?\n/);
    const out: string[] = [];
    let buf: string[] = [];
    const isStart = (l: string) =>
      /^\s*(?:Q?\d+[.)]\s|\(?[a-z]\)\s|[ivx]+[.)]\s)/i.test(l);
    const flush = () => {
      const j = buf.join("\n").trim();
      if (j) out.push(j);
      buf = [];
    };
    for (const ln of lines) {
      if (isStart(ln)) {
        flush();
        buf.push(ln.trim());
      } else if (buf.length > 0) buf.push(ln);
    }
    flush();
    if (out.length <= 1 && stripped.length > 0) return [stripped];
    return out;
  };

  const SKIP = new Set([
    "answers",
    "mark-scheme",
    "teacher-notes",
    "teacher-note",
    "vocabulary",
    "header",
    "send-support",
    "diagram",
    "reflection",
    "exit-question",
  ]);

  const questions: CompanionQuestion[] = [];
  for (let si = 0; si < input.sections.length; si++) {
    const s = input.sections[si] || {};
    if (s.teacherOnly) continue;
    if (s.type && SKIP.has(s.type)) continue;
    const qs = parseQs(String(s.content || ""));
    for (let qi = 0; qi < qs.length; qi++) {
      const id = `s${si}q${qi}`;
      const ladder = ladderById.get(id);
      questions.push({
        questionId: id,
        sectionTitle: s.title || `Section ${si + 1}`,
        question: qs[qi],
        hints: ladder?.hints,
      });
    }
  }

  return writeCompanionShare({
    title: input.title,
    subject: input.subject,
    topic: input.topic,
    yearGroup: input.yearGroup,
    issuedBy: input.issuedBy,
    encouragement: input.encouragement,
    ttlDays: input.ttlDays,
    questions,
    token: input.token,
  });
}

/** 32-char URL-safe random token. */
function generateToken(): string {
  const out: string[] = [];
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 32; i++) out.push(chars[bytes[i] % chars.length]);
  } else {
    for (let i = 0; i < 32; i++)
      out.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  return out.join("");
}
