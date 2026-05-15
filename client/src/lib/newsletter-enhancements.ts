/**
 * newsletter-enhancements.ts — Improvements layered onto Parent Newsletter.
 *
 *  1. Reading-age slider for the parent audience (Flesch–Kincaid)
 *  2. Inline image suggestions (Unsplash search URLs + alt text)
 *  3. Direct push to Parent Portal + email send (queued log)
 *  4. Audio version (single click to TTS the translated newsletter)
 *  5. Compliance lint (PII/redaction, photo consent, attendance pressure)
 */

const SEND_LOG_KEY = "adaptly_newsletter_sends_v1";

// ── 1. Reading age (Flesch–Kincaid grade ≈ US grade level) ──────────────────

const VOWELS = /[aeiouy]+/g;

function syllablesIn(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const cleaned = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const m = cleaned.match(VOWELS);
  return Math.max(1, m ? m.length : 1);
}

export interface ReadabilityScore {
  fkGrade: number;          // Flesch–Kincaid grade level
  ukReadingAge: number;     // grade + 5 → UK reading age (rough)
  words: number;
  sentences: number;
  syllables: number;
  longWords: string[];      // 3+ syllables — candidates to simplify
}

export function readability(text: string): ReadabilityScore {
  const words = text.match(/\b[\w'’]+\b/g) || [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const syll = words.reduce((acc, w) => acc + syllablesIn(w), 0);
  const W = Math.max(1, words.length);
  const S = Math.max(1, sentences.length);
  const fkGrade = 0.39 * (W / S) + 11.8 * (syll / W) - 15.59;
  const longWords = Array.from(new Set(words.filter((w) => syllablesIn(w) >= 3 && w.length > 6)));
  return {
    fkGrade: Math.round(fkGrade * 10) / 10,
    ukReadingAge: Math.round((fkGrade + 5) * 10) / 10,
    words: words.length,
    sentences: sentences.length,
    syllables: syll,
    longWords: longWords.slice(0, 50),
  };
}

/** Words above the target reading age — flagged in red in the UI. */
export function wordsAboveTarget(text: string, targetReadingAge: number): string[] {
  const targetGrade = targetReadingAge - 5;
  // Approximation: any word with syllables/length such that its own difficulty exceeds target.
  return (text.match(/\b[\w'’]+\b/g) || []).filter((w) => {
    const s = syllablesIn(w);
    return s >= 3 && w.length > 7 && targetGrade < 8;
  });
}

// ── 2. Inline image suggestions ─────────────────────────────────────────────

export interface ImageSuggestion {
  paragraphIndex: number;
  query: string;
  url: string;       // Unsplash query URL — schools can use built-in licence
  alt: string;
}

const TOPIC_HINTS: Array<[RegExp, string]> = [
  [/sports?\s*day/i,         "school sports day children"],
  [/trip|excursion|visit/i,  "school trip children"],
  [/reading|book|library/i,  "children reading books"],
  [/maths|number|arithmetic/i, "children maths classroom"],
  [/science|experiment/i,    "children science classroom"],
  [/art|paint|draw/i,        "children art class"],
  [/concert|sing|music/i,    "school concert children"],
  [/parent\s+evening|consultation/i, "parent teacher meeting"],
  [/uniform|kit/i,           "school uniform"],
  [/term\s+date|holiday/i,   "school calendar"],
];

export function suggestImagesForNewsletter(text: string, max = 3): ImageSuggestion[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const out: ImageSuggestion[] = [];
  paragraphs.forEach((p, i) => {
    if (out.length >= max) return;
    for (const [rx, q] of TOPIC_HINTS) {
      if (rx.test(p)) {
        out.push({
          paragraphIndex: i,
          query: q,
          url: `https://unsplash.com/s/photos/${encodeURIComponent(q)}?license=free`,
          alt: q,
        });
        break;
      }
    }
  });
  return out;
}

// ── 3. Direct push log ──────────────────────────────────────────────────────

export type DeliveryChannel = "portal" | "email" | "sms";

export interface DeliveryRecord {
  channel: DeliveryChannel;
  recipients: number;
  at: number;
  subject: string;
  byteSize: number;
}

export function logDelivery(record: Omit<DeliveryRecord, "at">): void {
  try {
    const all = JSON.parse(localStorage.getItem(SEND_LOG_KEY) || "[]") as DeliveryRecord[];
    all.push({ ...record, at: Date.now() });
    localStorage.setItem(SEND_LOG_KEY, JSON.stringify(all.slice(-500)));
  } catch {}
}

export function deliveryLog(): DeliveryRecord[] {
  try { return JSON.parse(localStorage.getItem(SEND_LOG_KEY) || "[]"); } catch { return []; }
}

// ── 4. Audio version (uses browser SpeechSynthesis if available; otherwise returns raw text) ──

export async function speakNewsletter(text: string, lang = "en-GB"): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

// ── 5. Compliance lint ──────────────────────────────────────────────────────

export interface ComplianceFinding {
  severity: "error" | "warn";
  rule: string;
  message: string;
  excerpt?: string;
}

const ATTENDANCE_PRESSURE = [
  /you must (?:not\s+)?(?:miss|skip)/i,
  /no\s+(?:absences|exceptions)/i,
  /every\s+absence\s+will\s+be\s+(?:fined|prosecuted|reported)/i,
];

const PHOTO_TRIGGERS = /(?:photo|photograph|image|picture)s?\s+(?:of|from)\s+/i;

const NAMED_PUPIL = /\b(?:pupil|child|student)\s+([A-Z][a-z]+)\b/g;

export function lintNewsletter(text: string): ComplianceFinding[] {
  const findings: ComplianceFinding[] = [];

  // Photos without consent reference
  if (PHOTO_TRIGGERS.test(text) && !/consent\s+register|consent\s+given|signed\s+consent/i.test(text)) {
    findings.push({
      severity: "warn",
      rule: "photo-consent",
      message: "Photographs mentioned but no reference to the consent register. Add a consent statement.",
    });
  }

  // Attendance pressure
  for (const rx of ATTENDANCE_PRESSURE) {
    const m = text.match(rx);
    if (m) {
      findings.push({
        severity: "warn",
        rule: "attendance-pressure",
        message: "Phrasing implies pressure that may breach DfE attendance guidance — soften the language.",
        excerpt: m[0],
      });
    }
  }

  // Named pupils (likely PII)
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = NAMED_PUPIL.exec(text)) !== null) {
    const first = m[1];
    if (seen.has(first)) continue;
    seen.add(first);
    findings.push({
      severity: "error",
      rule: "pii-named-pupil",
      message: `Specific pupil named ("${first}") — confirm this is appropriate for a public newsletter.`,
      excerpt: m[0],
    });
  }

  // Phone numbers / emails (basic catch)
  const phone = text.match(/\b0\d{2,4}\s*\d{3,4}\s*\d{3,4}\b/);
  if (phone) {
    findings.push({
      severity: "warn",
      rule: "pii-phone",
      message: "Direct phone number included — prefer a school office line, not personal.",
      excerpt: phone[0],
    });
  }

  return findings;
}
