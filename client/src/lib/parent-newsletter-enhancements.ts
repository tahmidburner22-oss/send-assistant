/**
 * parent-newsletter-enhancements.ts
 *
 * Five pure-function improvements for the Parent Newsletter / Letter tool:
 *
 *  1. Parent reading-age check — Flesch-Kincaid grade + readability band
 *     with sentence-level highlights for "too long" / "too jargon-heavy".
 *  2. Channel-aware outputs — derive an SMS (≤160 chars), an Instagram
 *     caption (≤220 chars + hashtags), and a noticeboard-poster from the
 *     same source letter. The letter itself is left intact.
 *  3. Tone preview — score the letter on 5 tone axes (warm, formal, urgent,
 *     action-oriented, inclusive) and surface the dominant tone.
 *  4. Mail-merge by surname — given a list of `{firstName, lastName,
 *     parentName?, parentEmail?}` rows, produce per-family rendered copies
 *     with `Dear Mr/Mrs <Surname>` salutations and a CSV-ready table.
 *  5. GDPR scrub validator — flag PII risks: full pupil names, addresses,
 *     phone numbers, DOBs, medical info, anything that looks like a UPN /
 *     NHS number, and pupil-photo descriptors. Returns severity-banded
 *     findings ready for the panel UI to render.
 *
 * No React, no DOM dependencies — safe to import server-side too.
 */

// ─── Shared helpers ────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

/** Tokenise into sentences. Splits on . ! ? while preserving "Mr." etc. */
function splitSentences(text: string): string[] {
  if (!text) return [];
  const cleaned = text.replace(/\s+/g, " ").trim();
  // Naive but works for school comms (no decimals, no abbreviations beyond Mr/Mrs/Dr/St)
  const protectedText = cleaned
    .replace(/\b(Mr|Mrs|Ms|Dr|St|Jr|Sr)\./g, "$1<DOT>")
    .replace(/\b(\d+)\.(\d+)/g, "$1<DOT>$2");
  return protectedText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/<DOT>/g, ".").trim())
    .filter(Boolean);
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length === 0) return 0;
  if (w.length <= 3) return 1;
  const stripped = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const matches = stripped.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function countWords(text: string): number {
  return (text.match(/\b[a-zA-Z][a-zA-Z'-]*\b/g) || []).length;
}

// ─── 1. Reading-age check ──────────────────────────────────────────────────

export type ReadabilityBand = "easy" | "fair" | "hard" | "very-hard";

export interface ReadabilityReport {
  fkGrade: number;            // Flesch-Kincaid Grade Level
  readingAge: number;         // approx UK reading age (years)
  band: ReadabilityBand;
  bandLabel: string;
  sentenceCount: number;
  wordCount: number;
  avgSentenceLen: number;
  avgSyllablesPerWord: number;
  longSentences: { text: string; words: number; index: number }[];
  jargonHits: { word: string; count: number; suggestion: string }[];
}

const JARGON_LIBRARY: Record<string, string> = {
  pedagogy: "teaching",
  pedagogical: "teaching",
  scaffolding: "step-by-step support",
  differentiation: "adapting work for each child",
  intervention: "extra support",
  assessment: "check / test",
  benchmark: "target",
  rigorous: "thorough",
  consolidation: "practice",
  curriculum: "what we're learning",
  cohort: "year group / class",
  metacognition: "thinking about how we learn",
  facilitate: "help / make easier",
  utilise: "use",
  ascertain: "find out",
  commensurate: "matching",
  endeavour: "try",
  prerequisite: "needed first",
  stipulate: "say clearly",
  subsequently: "later / then",
  furthermore: "also",
  notwithstanding: "even though",
  modality: "way / method",
  paradigm: "approach",
  efficacious: "works well",
};

/**
 * Score a letter for parent readability. UK reading-age guidance is
 * Flesch-Kincaid Grade 8 or below for parent comms (≈ age 13).
 */
export function analyseReadability(text: string): ReadabilityReport {
  const sentences = splitSentences(text);
  const wordCount = countWords(text);
  const sentenceCount = Math.max(sentences.length, 1);
  const syllables = (text.match(/\b[a-zA-Z][a-zA-Z'-]*\b/g) || [])
    .reduce((sum, w) => sum + countSyllables(w), 0);
  const avgSentenceLen = wordCount / sentenceCount;
  const avgSyllablesPerWord = wordCount > 0 ? syllables / wordCount : 0;
  // Flesch-Kincaid Grade Level
  const fkGrade = Math.max(0, 0.39 * avgSentenceLen + 11.8 * avgSyllablesPerWord - 15.59);
  const readingAge = Math.round(fkGrade + 5);

  let band: ReadabilityBand;
  let bandLabel: string;
  if (fkGrade <= 6) { band = "easy";       bandLabel = "Easy — accessible to nearly all parents"; }
  else if (fkGrade <= 8) { band = "fair";  bandLabel = "Fair — suitable for parent comms (Grade 8 or below recommended)"; }
  else if (fkGrade <= 10) { band = "hard"; bandLabel = "Hard — likely to lose EAL parents and lower-literacy readers"; }
  else                  { band = "very-hard"; bandLabel = "Very hard — rewrite recommended"; }

  // Long-sentence flag (>22 words is hard for skim-reading)
  const longSentences = sentences
    .map((s, i) => ({ text: s, words: countWords(s), index: i }))
    .filter((s) => s.words > 22)
    .slice(0, 8);

  // Jargon scan
  const lower = text.toLowerCase();
  const jargonCounts = new Map<string, number>();
  for (const word of Object.keys(JARGON_LIBRARY)) {
    const rx = new RegExp("\\b" + word + "\\b", "g");
    const m = lower.match(rx);
    if (m && m.length > 0) jargonCounts.set(word, m.length);
  }
  const jargonHits = Array.from(jargonCounts.entries())
    .map(([word, count]) => ({ word, count, suggestion: JARGON_LIBRARY[word] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return {
    fkGrade: Math.round(fkGrade * 10) / 10,
    readingAge,
    band,
    bandLabel,
    sentenceCount,
    wordCount,
    avgSentenceLen: Math.round(avgSentenceLen * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    longSentences,
    jargonHits,
  };
}

export function readabilityHtml(report: ReadabilityReport): string {
  const colour = report.band === "easy" ? "#15803d"
    : report.band === "fair" ? "#0891b2"
    : report.band === "hard" ? "#b45309"
    : "#be123c";
  return `<div style="font-family:Arial,sans-serif;padding:8mm;max-width:210mm;">
    <h2 style="font-size:13pt;color:${colour};margin:0 0 3mm;">Reading-age report</h2>
    <p style="font-size:11pt;margin:0 0 2mm;">
      <strong>Reading age:</strong> ~${report.readingAge} years
      <span style="color:#64748b;"> · FK Grade ${report.fkGrade}</span>
    </p>
    <p style="font-size:10pt;color:${colour};margin:0 0 3mm;font-weight:700;">${escapeHtml(report.bandLabel)}</p>
    <p style="font-size:9.5pt;color:#64748b;margin:0 0 4mm;">
      ${report.wordCount} words · ${report.sentenceCount} sentences ·
      avg ${report.avgSentenceLen} words/sentence · ${report.avgSyllablesPerWord} syllables/word
    </p>
    ${report.longSentences.length > 0 ? `
      <h3 style="font-size:11pt;color:#b45309;margin:0 0 2mm;">Long sentences (&gt;22 words)</h3>
      <ul style="margin:0 0 4mm;padding-left:5mm;font-size:9.5pt;">
        ${report.longSentences.map((s) => `<li><span style="color:#94a3b8;">[${s.words} words]</span> ${escapeHtml(s.text)}</li>`).join("")}
      </ul>` : ""}
    ${report.jargonHits.length > 0 ? `
      <h3 style="font-size:11pt;color:#7c3aed;margin:0 0 2mm;">Jargon to swap</h3>
      <ul style="margin:0;padding-left:5mm;font-size:9.5pt;list-style:none;">
        ${report.jargonHits.map((j) => `<li style="margin-bottom:1mm;"><strong>${escapeHtml(j.word)}</strong> <span style="color:#64748b;">(${j.count}×)</span> → <em>${escapeHtml(j.suggestion)}</em></li>`).join("")}
      </ul>` : ""}
  </div>`;
}

// ─── 2. Channel-aware outputs ──────────────────────────────────────────────

export interface ChannelOutputs {
  sms: string;            // ≤160 chars (single SMS)
  instagram: string;      // ≤220 chars + hashtags
  noticeboard: string;    // bold-headline + 3 bullet points (poster-friendly)
  emailSubject: string;   // single-line subject for an email blast
}

const SCHOOL_HASHTAGS = ["#SchoolNews", "#ParentUpdate"];

/**
 * Derive multi-channel comms variants from a source letter. Pure-string
 * extraction — no AI needed. Best results when the letter has the
 * structure produced by the existing tool (greeting / body / sign-off).
 */
export function deriveChannels(args: {
  letterText: string;
  schoolName?: string;
  yearGroup?: string;
  date?: string;
  actionRequired?: string;
}): ChannelOutputs {
  const sentences = splitSentences(args.letterText || "");
  // Pick 2–3 most informative sentences (skip greeting & sign-off)
  const body = sentences.filter((s) => {
    const lower = s.toLowerCase();
    if (/^(dear |hello |hi )/i.test(s)) return false;
    if (/(yours sincerely|kind regards|warm regards|best wishes|many thanks)/i.test(lower)) return false;
    return true;
  });
  const headline = body[0] || "An update from school";
  const second = body[1] || "";
  const third = body[2] || "";
  const yg = args.yearGroup ? `${args.yearGroup}: ` : "";

  // SMS — 160 chars, single best sentence + action
  const smsCore = `${yg}${headline}`;
  const smsAction = args.actionRequired ? ` ACTION: ${args.actionRequired}` : "";
  const smsBudget = 160 - smsAction.length;
  const sms = (smsCore.length > smsBudget ? smsCore.slice(0, smsBudget - 1).replace(/\s\S*$/, "") + "…" : smsCore) + smsAction;

  // Instagram — 220 chars + hashtags
  const igCore = [headline, second].filter(Boolean).join(" ");
  const tags = SCHOOL_HASHTAGS.concat(args.yearGroup ? [`#${args.yearGroup.replace(/\s+/g, "")}`] : []).join(" ");
  const igBudget = 220 - tags.length - 2;
  const igTrim = igCore.length > igBudget ? igCore.slice(0, igBudget - 1).replace(/\s\S*$/, "") + "…" : igCore;
  const instagram = `${igTrim}\n\n${tags}`;

  // Noticeboard — bold headline + bullets
  const noticeBullets = [second, third, args.actionRequired || ""].filter(Boolean).slice(0, 3);
  const noticeboard = `**${headline.toUpperCase()}**\n${noticeBullets.map((b) => `• ${b}`).join("\n")}${args.date ? `\n\n📅 ${args.date}` : ""}`;

  // Email subject
  const subjBase = headline.replace(/[.!?]+$/, "");
  const emailSubject = `${args.schoolName ? `[${args.schoolName}] ` : ""}${subjBase}`.slice(0, 90);

  return { sms, instagram, noticeboard, emailSubject };
}

// ─── 3. Tone preview ───────────────────────────────────────────────────────

export type ToneAxis = "warm" | "formal" | "urgent" | "actionOriented" | "inclusive";

export interface ToneScores {
  warm: number;
  formal: number;
  urgent: number;
  actionOriented: number;
  inclusive: number;
  dominant: ToneAxis;
  warnings: string[];     // e.g. "tone reads urgent without an action — risk of alarm"
}

const TONE_KEYWORDS: Record<ToneAxis, RegExp> = {
  warm:           /\b(?:thank|appreciate|kindly|delighted|warmly|lovely|wonderful|enjoy|celebrate|community|together|family)\b/gi,
  formal:         /\b(?:hereby|notification|inform|advise|kindly note|please ensure|with reference to|in accordance|further to|respectfully|formally)\b/gi,
  urgent:         /\b(?:urgent|immediately|asap|today|tomorrow|deadline|expiry|expires|do not|must|by \d+ (?:am|pm)|essential)\b/gi,
  actionOriented: /\b(?:please (?:return|sign|complete|attend|bring|confirm|reply)|return slip|reply by|click here|sign and return|rsvp|book at|register at)\b/gi,
  inclusive:      /\b(?:parents and carers|families|all (?:pupils|children)|every (?:family|child)|each child|inclusive|welcoming|open to all)\b/gi,
};

export function scoreTone(text: string): ToneScores {
  const t = text || "";
  const wordCount = Math.max(countWords(t), 1);
  const score = (rx: RegExp) => {
    const matches = t.match(rx) || [];
    // Density per 100 words → cap at 100
    return Math.min(100, Math.round((matches.length * 100 * 100) / wordCount));
  };
  const warm = score(TONE_KEYWORDS.warm);
  const formal = score(TONE_KEYWORDS.formal);
  const urgent = score(TONE_KEYWORDS.urgent);
  const actionOriented = score(TONE_KEYWORDS.actionOriented);
  const inclusive = score(TONE_KEYWORDS.inclusive);

  const axes: { axis: ToneAxis; v: number }[] = [
    { axis: "warm", v: warm },
    { axis: "formal", v: formal },
    { axis: "urgent", v: urgent },
    { axis: "actionOriented", v: actionOriented },
    { axis: "inclusive", v: inclusive },
  ];
  const dominant = axes.reduce((best, a) => a.v > best.v ? a : best, axes[0]).axis;

  const warnings: string[] = [];
  if (urgent > 30 && actionOriented < 10) warnings.push("Reads urgent but no clear action — risk of alarming parents.");
  if (formal > 35 && warm < 10) warnings.push("Very formal — consider adding a warm opener or sign-off.");
  if (warm < 5 && inclusive < 5) warnings.push("No inclusive language detected — add 'parents and carers' or 'all families'.");
  if (urgent > 50)             warnings.push("Heavy urgency markers — strip duplicates so the real action stands out.");

  return { warm, formal, urgent, actionOriented, inclusive, dominant, warnings };
}

export const TONE_AXIS_LABEL: Record<ToneAxis, string> = {
  warm: "Warm",
  formal: "Formal",
  urgent: "Urgent",
  actionOriented: "Action-oriented",
  inclusive: "Inclusive",
};

// ─── 4. Mail-merge by surname ──────────────────────────────────────────────

export interface MergeRecipient {
  firstName?: string;
  lastName: string;
  parentName?: string;     // explicit "Mr A Khan" — wins over derived
  parentEmail?: string;
}

export interface MergedLetter {
  recipient: MergeRecipient;
  salutation: string;
  body: string;
}

const TITLE_HINTS = /^(?:Mr|Mrs|Ms|Mx|Miss|Dr|Rev)\b/i;

function buildSalutation(r: MergeRecipient): string {
  if (r.parentName && r.parentName.trim().length > 0) {
    const pn = r.parentName.trim();
    if (TITLE_HINTS.test(pn)) return `Dear ${pn},`;
    // No title — assume given-name + surname
    const parts = pn.split(/\s+/);
    if (parts.length >= 2) return `Dear Mr/Mrs ${parts[parts.length - 1]},`;
    return `Dear ${pn},`;
  }
  if (r.lastName) return `Dear Mr/Mrs ${r.lastName.trim()},`;
  if (r.firstName) return `Dear ${r.firstName} (parent/carer),`;
  return "Dear Parents and Carers,";
}

/**
 * Replace the generic salutation with a per-family one, leaving the rest of
 * the letter intact. Strips any "[Pupil Name]" placeholder if present.
 */
export function mergeLetter(letterText: string, recipient: MergeRecipient): MergedLetter {
  const salutation = buildSalutation(recipient);
  // Replace the first salutation-like line, otherwise prepend.
  const lines = (letterText || "").split(/\n/);
  let replaced = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(?:Dear|Hello|Hi)\b/i.test(lines[i])) {
      lines[i] = salutation;
      replaced = true;
      break;
    }
  }
  if (!replaced) lines.unshift(salutation, "");
  let body = lines.join("\n");
  // Personalisation tokens
  if (recipient.firstName) {
    body = body.replace(/\[Pupil Name\]/g, recipient.firstName);
    body = body.replace(/\{\{first_name\}\}/g, recipient.firstName);
  }
  if (recipient.lastName) {
    body = body.replace(/\[Pupil Surname\]/g, recipient.lastName);
    body = body.replace(/\{\{last_name\}\}/g, recipient.lastName);
  }
  return { recipient, salutation, body };
}

export function mergeAll(letterText: string, recipients: MergeRecipient[]): MergedLetter[] {
  return recipients.map((r) => mergeLetter(letterText, r));
}

/**
 * Parse a CSV-ish string (one recipient per line: `lastName,firstName,parentName,parentEmail`)
 * into a recipient list. Tolerates extra whitespace and missing trailing fields.
 */
export function parseRecipientsCsv(csv: string): MergeRecipient[] {
  const lines = (csv || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: MergeRecipient[] = [];
  for (const line of lines) {
    if (/^(?:lastName|surname)\s*,/i.test(line)) continue;     // header
    const cells = line.split(",").map((c) => c.trim());
    const [lastName = "", firstName = "", parentName = "", parentEmail = ""] = cells;
    if (!lastName) continue;
    out.push({
      lastName,
      firstName: firstName || undefined,
      parentName: parentName || undefined,
      parentEmail: parentEmail || undefined,
    });
  }
  return out;
}

export function mergeCsvExport(merged: MergedLetter[]): string {
  // CSV: surname, firstName, salutation, parentEmail, body (escaped)
  const rows = [
    ["lastName", "firstName", "salutation", "parentEmail", "body"].join(","),
  ];
  for (const m of merged) {
    rows.push([
      `"${(m.recipient.lastName || "").replace(/"/g, '""')}"`,
      `"${(m.recipient.firstName || "").replace(/"/g, '""')}"`,
      `"${m.salutation.replace(/"/g, '""')}"`,
      `"${(m.recipient.parentEmail || "").replace(/"/g, '""')}"`,
      `"${m.body.replace(/"/g, '""').replace(/\n/g, "\\n")}"`,
    ].join(","));
  }
  return rows.join("\n");
}

// ─── 5. GDPR scrub validator ───────────────────────────────────────────────

export type GdprSeverity = "high" | "medium" | "low";

export interface GdprFinding {
  severity: GdprSeverity;
  category: string;
  match: string;
  context: string;       // surrounding text
  recommendation: string;
}

const UPN_RX = /\b[A-Z]\d{12}\b/g;                              // UK Unique Pupil Number
const NHS_RX = /\b\d{3}\s?\d{3}\s?\d{4}\b/g;                    // NHS number 10 digits
const UK_PHONE_RX = /\b(?:0|\+44\s?)\d{2,4}\s?\d{3,4}\s?\d{3,4}\b/g;
const EMAIL_RX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const POSTCODE_RX = /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/g;
const DOB_RX = /\b(?:0?[1-9]|[12]\d|3[01])[\/\-.](?:0?[1-9]|1[0-2])[\/\-.](?:19|20)\d{2}\b/g;
const FULL_NAME_HINTS_RX = /\b(?:pupil|child|student)\s+(?:[A-Z][a-z]+\s+[A-Z][a-z]+)/g;
const MEDICAL_RX = /\b(?:asthma|epilepsy|adhd|asd|autistic|diabetic|allergy|allergic|epipen|inhaler|seizure|medication|behavioural\s+plan|safeguarding\s+concern|child\s+protection|social\s+worker|looked[-\s]after\s+child|lac\b)\b/gi;
const PHOTO_RX = /\b(?:photo|photograph|picture|video|filmed)\s+of\s+(?:[A-Z][a-z]+|the\s+pupil|the\s+child)/gi;

function snippet(text: string, start: number, len: number): string {
  const s = Math.max(0, start - 24);
  const e = Math.min(text.length, start + len + 24);
  return (s > 0 ? "…" : "") + text.slice(s, e).replace(/\s+/g, " ").trim() + (e < text.length ? "…" : "");
}

/**
 * Scan the letter for PII / sensitive info. The intent is "audit before
 * sending" — flag risks even when the school's lawful basis covers them,
 * because parent letters are widely forwarded.
 */
export function scrubGdpr(text: string): GdprFinding[] {
  const t = text || "";
  const findings: GdprFinding[] = [];
  const push = (rx: RegExp, severity: GdprSeverity, category: string, recommendation: string) => {
    let m: RegExpExecArray | null;
    rx.lastIndex = 0;
    // Limit per category to avoid spam
    let count = 0;
    while ((m = rx.exec(t)) !== null && count < 8) {
      findings.push({
        severity, category,
        match: m[0],
        context: snippet(t, m.index, m[0].length),
        recommendation,
      });
      count += 1;
      if (rx.lastIndex === m.index) rx.lastIndex += 1;     // safety
    }
  };

  push(UPN_RX,         "high",   "UPN",                "Never include UPNs in parent letters — internal data only.");
  push(NHS_RX,         "high",   "NHS number",         "Strip — NHS numbers are special category data.");
  push(MEDICAL_RX,     "high",   "Medical / SEN",      "Move to a named, restricted-distribution channel; not in a class-wide letter.");
  push(PHOTO_RX,       "high",   "Photo consent",      "Confirm a current photo-consent form is on file before sending.");
  push(FULL_NAME_HINTS_RX, "medium", "Full pupil name", "Use first names only or initials in class-wide letters.");
  push(DOB_RX,         "medium", "Date of birth",      "DOBs are personal data — strip unless legally required.");
  push(POSTCODE_RX,    "medium", "Postcode",           "Postcode + name = identifying. Remove if combined with names.");
  push(UK_PHONE_RX,    "low",    "Phone number",       "OK if it's the school office number — flag if it's a personal mobile.");
  push(EMAIL_RX,       "low",    "Email address",      "OK if it's a school address — flag if it's a personal teacher email.");

  return findings;
}

export interface GdprSummary {
  total: number;
  high: number;
  medium: number;
  low: number;
  pass: boolean;            // true = no high-severity findings
  findings: GdprFinding[];
}

export function summariseGdpr(text: string): GdprSummary {
  const findings = scrubGdpr(text);
  const high = findings.filter((f) => f.severity === "high").length;
  const medium = findings.filter((f) => f.severity === "medium").length;
  const low = findings.filter((f) => f.severity === "low").length;
  return { total: findings.length, high, medium, low, pass: high === 0, findings };
}

/**
 * Teacher-facing decision support for a family communication draft. It never
 * approves sending: the product does not send a message, and the teacher
 * remains responsible for accuracy, lawful sharing and final distribution.
 */
export type FamilyDraftReviewStatus = "blocked" | "attention" | "review";

export interface FamilyDraftReviewGate {
  status: FamilyDraftReviewStatus;
  label: string;
  blockers: string[];
  checks: string[];
  mayExportPersonalisedCopies: boolean;
}

export function buildFamilyDraftReviewGate(args: {
  privacy: GdprSummary;
  readability: ReadabilityReport;
  communicationType?: string;
}): FamilyDraftReviewGate {
  const blockers: string[] = [];
  const checks: string[] = ["Confirm the intended recipients, factual accuracy and final school approval before distribution."];
  if (args.privacy.high > 0) blockers.push(`${args.privacy.high} high-severity privacy or safeguarding concern${args.privacy.high === 1 ? "" : "s"} must be removed or moved to a restricted channel.`);
  if (args.privacy.medium > 0) checks.push(`${args.privacy.medium} medium-severity personal-data concern${args.privacy.medium === 1 ? "" : "s"} need a teacher decision.`);
  if (args.readability.band === "hard" || args.readability.band === "very-hard") checks.push("Rewrite long sentences or jargon so families can scan the message easily.");
  if (args.communicationType === "send-update") checks.push("For SEND updates, keep the draft strengths-based and share only information appropriate for that family.");

  if (blockers.length > 0) {
    return { status: "blocked", label: "Personalised export blocked", blockers, checks, mayExportPersonalisedCopies: false };
  }
  if (checks.length > 1) {
    return { status: "attention", label: "Teacher review needed", blockers, checks, mayExportPersonalisedCopies: true };
  }
  return { status: "review", label: "Human review still required", blockers, checks, mayExportPersonalisedCopies: true };
}

export function gdprSummaryHtml(summary: GdprSummary): string {
  const colour = summary.pass ? "#15803d" : "#be123c";
  const banner = summary.pass
    ? `<p style="color:${colour};font-weight:700;font-size:11pt;margin:0 0 3mm;">✓ No high-severity issues.</p>`
    : `<p style="color:${colour};font-weight:700;font-size:11pt;margin:0 0 3mm;">⚠ ${summary.high} high-severity issue(s) — review before sending.</p>`;
  const rows = summary.findings.map((f) => {
    const sevColour = f.severity === "high" ? "#be123c" : f.severity === "medium" ? "#b45309" : "#0891b2";
    return `<tr>
      <td style="padding:3px 6px;border:1px solid #e5e7eb;color:${sevColour};font-weight:700;text-transform:uppercase;font-size:9pt;">${f.severity}</td>
      <td style="padding:3px 6px;border:1px solid #e5e7eb;font-size:10pt;">${escapeHtml(f.category)}</td>
      <td style="padding:3px 6px;border:1px solid #e5e7eb;font-size:9.5pt;font-family:monospace;">${escapeHtml(f.match)}</td>
      <td style="padding:3px 6px;border:1px solid #e5e7eb;font-size:9pt;color:#475569;">${escapeHtml(f.context)}</td>
      <td style="padding:3px 6px;border:1px solid #e5e7eb;font-size:9pt;color:#1f2937;">${escapeHtml(f.recommendation)}</td>
    </tr>`;
  }).join("");
  return `<div style="font-family:Arial,sans-serif;padding:8mm;max-width:280mm;">
    <h2 style="font-size:13pt;color:${colour};margin:0 0 3mm;">GDPR scrub report</h2>
    ${banner}
    ${summary.findings.length === 0 ? "" : `<table style="width:100%;border-collapse:collapse;font-size:10pt;">
      <thead style="background:#f1f5f9;"><tr>
        <th style="text-align:left;padding:4px 6px;border:1px solid #cbd5e1;">Severity</th>
        <th style="text-align:left;padding:4px 6px;border:1px solid #cbd5e1;">Category</th>
        <th style="text-align:left;padding:4px 6px;border:1px solid #cbd5e1;">Match</th>
        <th style="text-align:left;padding:4px 6px;border:1px solid #cbd5e1;">Context</th>
        <th style="text-align:left;padding:4px 6px;border:1px solid #cbd5e1;">Recommendation</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`}
  </div>`;
}
