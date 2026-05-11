/**
 * piiScanner — UK-focused personal-identifier detection for tool form inputs.
 *
 * Every tool in /pages/tools/ currently lets teachers paste free text that will
 * be sent to a third-party LLM. About half the tools enforce "initials only"
 * via the `maxLength` hint; the rest do not. This utility gives AIToolPage a
 * single, consistent pre-flight check to warn (or block) when a field looks
 * like it contains a full name, DOB, address, or pupil identifier.
 *
 * Detection is regex-based (deliberately — no model calls, no network, no
 * latency). False positives are possible; every finding exposes a short
 * `hint` so the UI can let the teacher confirm and override if appropriate.
 *
 * We DO NOT block on mere "looks like a name" — names are the trickiest case
 * and the lowest-severity one when paired with initials. We DO flag:
 *   - dates of birth
 *   - UK postcodes
 *   - UPN (Unique Pupil Number) — 13 chars, digits + letters
 *   - NHS number — 10 digits with Modulus-11 checksum
 *   - UK phone numbers
 *   - email addresses
 *   - national insurance numbers (NI numbers)
 *   - sequences of first-name + last-name pairs (2–3 capitalised words, not
 *     preceded by "the/a/an/mr/mrs/dr"); severity "low" — warn, don't block.
 *
 * Severity levels:
 *   - "high": block submission by default (DOB, UPN, NHS, NI)
 *   - "medium": warn, ask to confirm (email, phone, postcode, full name)
 *   - "low": soft hint only
 */

export type PiiSeverity = "low" | "medium" | "high";

export interface PiiMatch {
  kind:
    | "dob"
    | "postcode"
    | "upn"
    | "nhs"
    | "ni"
    | "email"
    | "phone"
    | "full_name"
    | "address_line";
  severity: PiiSeverity;
  text: string;      // matched text (already trimmed to 80 chars for safety)
  hint: string;      // short advice shown to user
  /** Byte-offset of the match start within the scanned string. */
  index: number;
}

const NAME_PREFIXES = /(?:mr|mrs|miss|ms|mx|dr|sir|lady|rev|prof|the|a|an|at|in|on|by|for)\b/i;

const REGEXES: Array<{
  kind: PiiMatch["kind"];
  severity: PiiSeverity;
  re: RegExp;
  hint: string;
  /** Optional validator — return true to keep the match. */
  validate?: (match: string, full: string, offset: number) => boolean;
}> = [
  // UK postcode — strict format (A9 9AA, AA9 9AA, etc.)
  {
    kind: "postcode",
    severity: "medium",
    re: /\b(?:GIR ?0AA|[A-PR-UWYZ](?:[0-9]|[A-HK-Y][0-9]|[A-HK-Y][0-9][A-Z]?|[0-9][A-HJKPS-UW]) ?[0-9][ABD-HJLNP-UW-Z]{2})\b/gi,
    hint: "Looks like a UK postcode — avoid including exact addresses.",
  },
  // DOB: dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, "5th March 2012" or "March 5, 2012"
  {
    kind: "dob",
    severity: "high",
    re: /\b(?:(?:0?[1-9]|[12][0-9]|3[01])[\/\-.](?:0?[1-9]|1[0-2])[\/\-.](?:19|20)\d{2}|(?:19|20)\d{2}[\/\-.](?:0?[1-9]|1[0-2])[\/\-.](?:0?[1-9]|[12][0-9]|3[01])|(?:0?[1-9]|[12][0-9]|3[01])(?:st|nd|rd|th)? (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]* (?:19|20)\d{2})\b/gi,
    hint: "Looks like a date of birth — use the pupil's age or year group instead.",
  },
  // UK UPN: 13 chars, digits + 1 check letter + 3 digits + letter + 8 digits pattern.
  // Standard: A123456789012 (A + 12 digits) OR 4-digit LA code + A + 8-digit serial.
  // Common DfE pattern: [A-Z]\d{12}
  {
    kind: "upn",
    severity: "high",
    re: /\b[A-Z]\d{12}\b/g,
    hint: "Looks like a UPN (Unique Pupil Number) — do not share pupil identifiers with AI.",
  },
  // UK National Insurance number — 2 letters, 6 digits, 1 letter. Exclude invalid prefixes.
  {
    kind: "ni",
    severity: "high",
    re: /\b(?!BG|GB|NK|KN|TN|NT|ZZ)[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z]\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/g,
    hint: "Looks like a National Insurance number — do not share.",
  },
  // NHS number — 10 digits; we don't enforce Mod-11 to avoid complexity, but
  // require it to be standalone so we don't flag phone numbers.
  {
    kind: "nhs",
    severity: "high",
    re: /\b\d{3}[ -]?\d{3}[ -]?\d{4}\b/g,
    hint: "Looks like an NHS number — remove before sending to AI.",
    validate: (m) => {
      // Strip separators, must be 10 digits and Mod-11 check passes.
      const d = m.replace(/[ -]/g, "");
      if (d.length !== 10) return false;
      let sum = 0;
      for (let i = 0; i < 9; i++) sum += Number(d[i]) * (10 - i);
      const remainder = sum % 11;
      const check = 11 - remainder;
      const expected = check === 11 ? 0 : check;
      return expected !== 10 && expected === Number(d[9]);
    },
  },
  // Email
  {
    kind: "email",
    severity: "medium",
    re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    hint: "Email address detected — consider whether sharing is necessary.",
  },
  // UK phone numbers — +44, 0xxx 10–11 digits with common separators.
  {
    kind: "phone",
    severity: "medium",
    re: /(?:\+44\s?|0)(?:\d\s?){9,10}\b/g,
    hint: "Looks like a phone number — remove before sending to AI.",
    validate: (m) => m.replace(/\D/g, "").length >= 10,
  },
  // Full name: two or three capitalised words in a row, each ≥ 2 letters, not preceded
  // by a common word. This is deliberately forgiving; severity is medium so we
  // warn rather than block.
  {
    kind: "full_name",
    severity: "medium",
    re: /\b[A-Z][a-z]{1,}(?:[-'][A-Z][a-z]+)?(?:\s+[A-Z][a-z]{1,}(?:[-'][A-Z][a-z]+)?){1,2}\b/g,
    hint: "Looks like a full name — use initials (e.g. M.W.) to comply with GDPR.",
    validate: (match, full, offset) => {
      // Reject if immediately preceded by a known non-name token.
      const before = full.slice(Math.max(0, offset - 6), offset).trim();
      if (before && NAME_PREFIXES.test(before.split(/\s+/).pop() || "")) return false;
      // Reject single capitalised phrases that are common noun phrases.
      const COMMON = new Set([
        "Year Group", "National Curriculum", "Key Stage", "Learning Objective",
        "Success Criteria", "Exit Ticket", "Social Story", "Personal Statement",
        "Cover Letter", "United Kingdom", "Great Britain", "Tell Me", "Please Note",
        "Dear Sir", "Dear Madam", "Yours Sincerely", "Yours Faithfully",
      ]);
      if (COMMON.has(match)) return false;
      return true;
    },
  },
  // Address-like lines: "12 High Street", "Flat 3, 45 Acacia Avenue".
  {
    kind: "address_line",
    severity: "medium",
    re: /\b\d{1,4}[A-Z]? (?:[A-Z][a-z]+ ){0,3}(?:Road|Street|Lane|Avenue|Close|Drive|Way|Court|Crescent|Grove|Place|Square|Terrace|Hill|Gardens|Gdns|Rd|St|Ln|Ave|Cl|Dr)\b/g,
    hint: "Looks like a street address — remove before sending to AI.",
  },
];

/**
 * Scan a single string for PII markers.
 * Duplicate matches of the same (kind,text) pair are de-duped.
 */
export function scanText(input: string): PiiMatch[] {
  if (!input || typeof input !== "string" || input.length === 0) return [];
  const matches: PiiMatch[] = [];
  const seen = new Set<string>();

  for (const spec of REGEXES) {
    // Reset lastIndex because regexes use the /g flag.
    spec.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    // eslint-disable-next-line no-cond-assign
    while ((m = spec.re.exec(input)) != null) {
      const text = m[0];
      if (spec.validate && !spec.validate(text, input, m.index)) continue;
      const dedupKey = spec.kind + "::" + text.toLowerCase();
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);
      matches.push({
        kind: spec.kind,
        severity: spec.severity,
        text: text.length > 80 ? text.slice(0, 77) + "..." : text,
        hint: spec.hint,
        index: m.index,
      });
    }
  }
  return matches.sort((a, b) => a.index - b.index);
}

/**
 * Scan an object whose values may be strings, arrays of strings, or nested
 * objects — returns a flat map of fieldId → matches for any field that
 * contains at least one hit.
 */
export function scanFormValues(
  values: Record<string, unknown>,
  opts: { ignoreFields?: string[] } = {}
): Record<string, PiiMatch[]> {
  const ignore = new Set(opts.ignoreFields || []);
  const out: Record<string, PiiMatch[]> = {};
  for (const [key, raw] of Object.entries(values || {})) {
    if (ignore.has(key)) continue;
    const text = flatten(raw);
    if (!text) continue;
    const hits = scanText(text);
    if (hits.length > 0) out[key] = hits;
  }
  return out;
}

function flatten(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(flatten).join("\n");
  if (typeof v === "object") return Object.values(v as Record<string, unknown>).map(flatten).join("\n");
  return "";
}

/** Highest severity across a scan result — useful for a one-shot gate. */
export function maxSeverity(result: Record<string, PiiMatch[]>): PiiSeverity | null {
  let worst: PiiSeverity | null = null;
  const rank: Record<PiiSeverity, number> = { low: 1, medium: 2, high: 3 };
  for (const hits of Object.values(result)) {
    for (const h of hits) {
      if (!worst || rank[h.severity] > rank[worst]) worst = h.severity;
    }
  }
  return worst;
}

/**
 * Summarise a scan result for display — one short string per field that was
 * flagged, suitable for a toast or inline warning.
 */
export function summariseFindings(result: Record<string, PiiMatch[]>): string[] {
  const out: string[] = [];
  for (const [field, hits] of Object.entries(result)) {
    const kinds = Array.from(new Set(hits.map(h => h.kind)));
    const label = kinds.join(", ").replace(/_/g, " ");
    out.push(`${field}: ${label}`);
  }
  return out;
}

export default { scanText, scanFormValues, maxSeverity, summariseFindings };
