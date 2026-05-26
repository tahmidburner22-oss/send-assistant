/**
 * sendFidelityAudit.ts — FEAT-PB6
 *
 * Each of the 22 SEND profiles in `sendPromptFragments.ts` ships with ~5
 * `worksheetRules` LLM imperatives. Some are enforced deterministically by
 * `sendEnforcer.ts` (ADHD inline checkboxes, hard caps, brain break) but most
 * rely on the LLM following the prompt — and we have no deterministic proof
 * that all five rules actually landed. So a "dyslexia-adapted" worksheet
 * could quietly ship with no word bank or no method box and nobody'd know.
 *
 * This module fills that gap. For every profile we register a small set of
 * **probes** — pure regex / structural checks over the worksheet — that vote
 * `applied | missing | not-checked` per rule. The result is stamped onto
 * `metadata.sendFidelityReport` and surfaced in the renderer's teacher view.
 *
 * Design notes
 *   - Each probe is intentionally SHORT and conservative. False positives are
 *     worse than `not-checked`: a teacher who sees a green tick must trust it.
 *   - Probes operate over student-visible sections only (we never count
 *     evidence found inside teacher-only or mark-scheme sections).
 *   - `applied` requires AT LEAST ONE matching piece of evidence anywhere in
 *     student-visible content; many rules apply per-section but for fidelity
 *     reporting "did the adaptation happen at least once" is the right bar.
 *   - The audit is non-blocking: a missing rule generates a warning; the
 *     worksheet still renders.
 *   - Idempotent — re-running on the same worksheet returns the same report.
 */

import { resolveSendSpec, type SendAdaptationSpec } from "./sendPromptFragments";

// ─── Types ───────────────────────────────────────────────────────────────────

export type FidelityStatus = "applied" | "missing" | "not-checked";

export interface SendFidelityRuleResult {
  /** 1-based rule index (matches the order in sendPromptFragments worksheetRules). */
  ruleIndex: number;
  /** The rule text exactly as it appears in sendPromptFragments. */
  rule: string;
  /** Verdict from the probe. */
  status: FidelityStatus;
  /** Brief evidence (matched fragment, or human reason for missing/not-checked). */
  evidence?: string;
}

export interface SendFidelityReport {
  /** Canonical SEND profile id this audit was run for. */
  sendNeedId: string;
  /** Display name for teacher UI. */
  sendNeedName: string;
  /** Per-rule results, in the same order as worksheetRules. */
  rules: SendFidelityRuleResult[];
  /** Number of probes that returned `applied`. */
  appliedCount: number;
  /** Total number of probes (= worksheetRules.length). */
  totalCount: number;
  /** Number that returned `applied` divided by the number we actually probed. */
  fidelityRatio: number;
  /** Human-readable warnings for every missing rule (empty when all green). */
  warnings: string[];
}

interface FidelityAuditableSection {
  type?: string;
  title?: string;
  content?: string;
  teacherOnly?: boolean;
  [key: string]: unknown;
}

interface FidelityAuditableWorksheet {
  title?: string;
  subtitle?: string;
  sections?: FidelityAuditableSection[];
  metadata?: Record<string, unknown> & { sendFidelityReport?: SendFidelityReport };
  [key: string]: unknown;
}

// ─── Probe registry ──────────────────────────────────────────────────────────
// One probe per rule. The order MUST match the order of worksheetRules in
// sendPromptFragments.ts for each profile. Each probe receives the full
// student-visible content concatenated into a single haystack string and the
// raw sections array; it returns a verdict.
//
// Probes use simple regex fingerprints — high-precision tokens that an LLM
// following the rule will reliably emit. When a rule is genuinely too
// narrative to probe (e.g. "use literal language"), we return `not-checked`
// so it doesn't false-flag.

type Probe = (
  haystack: string,
  sections: FidelityAuditableSection[],
) => Pick<SendFidelityRuleResult, "status" | "evidence">;

const ok = (evidence: string): ReturnType<Probe> => ({ status: "applied", evidence });
const miss = (reason: string): ReturnType<Probe> => ({ status: "missing", evidence: reason });
const skip = (reason: string): ReturnType<Probe> => ({ status: "not-checked", evidence: reason });

// Helpers for question-section traversal (mirrors sendEnforcer logic but
// scoped to read-only fidelity probing).
const QUESTION_SECTION_TYPES = new Set([
  "q-short-answer", "q-extended", "q-challenge", "q-free-response", "q-mcq",
  "q-gap-fill", "q-true-false", "q-label-diagram", "q-data-table", "q-graph",
  "q-circuit", "q-draw", "q-ordering", "q-matching", "q-primary-activity",
  "short-answer", "free-response", "guided", "independent", "challenge",
  "section-a", "section-b", "section-c",
  "recall", "understanding", "application",
]);
function isQuestionSection(s: FidelityAuditableSection): boolean {
  const t = String(s.type || "").toLowerCase();
  if (QUESTION_SECTION_TYPES.has(t)) return true;
  return /\bq\s*\d|question\s*\d|^[\s]*\d+[\.\)]/i.test(String(s.title || ""));
}

function countQuestionLines(content: string): number {
  return content.split("\n").filter((ln) =>
    /^\s*(?:\[\s*[xX]?\s*\]\s+)?(?:Q?\d+[\.\):])\s+/.test(ln) ||
    /^\s*\[\s*[xX]?\s*\]\s+/.test(ln)
  ).length;
}

// ── Per-profile probe tables ────────────────────────────────────────────────
// Each entry's probe array MUST mirror the order of `worksheetRules` for that
// profile in sendPromptFragments.ts. Profiles whose rules are all narrative
// (no reliable fingerprint) are intentionally omitted; the audit returns
// `not-checked` for unmapped profiles rather than false-failing them.

const PROBES: Record<string, Probe[]> = {
  // ── ADHD ──────────────────────────────────────────────────────────────────
  adhd: [
    // Rule 1: every question starts with "[ ] "
    (h, sections) => {
      const qSections = sections.filter(isQuestionSection).filter(s => !s.teacherOnly);
      if (qSections.length === 0) return skip("no question sections to probe");
      const lines = qSections.flatMap(s => String(s.content || "").split("\n"));
      const qLines = lines.filter(l => /^\s*(?:Q?\d+[\.\):])?\s*\S/.test(l) && /^\s*(?:Q?\d+[\.\):])?\s*\[/.test(l));
      const totalQs = lines.filter(l => /^\s*(?:Q?\d+[\.\):])\s+/.test(l)).length;
      if (totalQs === 0) return skip("no numbered question lines");
      const hits = lines.filter(l => /\[\s\]/.test(l)).length;
      return hits >= Math.max(1, Math.floor(totalQs * 0.5))
        ? ok(`${hits}/${totalQs} questions carry [ ] checkbox`)
        : miss(`only ${hits}/${totalQs} questions carry [ ] checkbox`);
    },
    // Rule 2: hard cap Section A=3, Section B=5
    (_h, sections) => {
      const findSection = (re: RegExp) =>
        sections.find(s => re.test(String(s.title || "").toLowerCase()) && !s.teacherOnly);
      const a = findSection(/section\s*a|warm[\s-]?up|quick\s*start/);
      const b = findSection(/section\s*b|main\s*practice/);
      if (!a && !b) return skip("section A/B not found by title");
      const aQs = a ? countQuestionLines(String(a.content || "")) : 0;
      const bQs = b ? countQuestionLines(String(b.content || "")) : 0;
      const aOk = !a || aQs <= 3;
      const bOk = !b || bQs <= 5;
      return aOk && bOk
        ? ok(`Section A=${aQs}/3, Section B=${bQs}/5`)
        : miss(`cap exceeded — Section A=${aQs} (max 3), Section B=${bQs} (max 5)`);
    },
    // Rule 3: at least one calculation, one fill-in, one matching, one true/false
    (_h, sections) => {
      const types = new Set(sections.map(s => String(s.type || "").toLowerCase()));
      const wanted = ["q-mcq", "q-gap-fill", "q-matching", "q-true-false"];
      const have = wanted.filter(t => types.has(t));
      return have.length >= 3
        ? ok(`varied formats present: ${have.join(", ")}`)
        : miss(`only ${have.length}/4 varied question formats present (have: ${have.join(", ") || "none"})`);
    },
    // Rule 4: bolded action verb at start of every question
    (h) => {
      const verbs = ["Calculate", "Identify", "Explain", "Describe", "Solve", "Compare", "Find", "State", "Suggest", "Show", "Work out"];
      const re = new RegExp(`\\*\\*(?:${verbs.join("|")})`, "i");
      return re.test(h)
        ? ok("at least one bolded action verb present")
        : miss("no bolded action verb (e.g. **Calculate**, **Identify**) found");
    },
    // Rule 5: BRAIN BREAK midway through Section B
    (h) => /BRAIN\s*BREAK/i.test(h)
      ? ok("BRAIN BREAK marker present")
      : miss("'BRAIN BREAK' marker not found in any section"),
    // Rule 6: BONUS labelling on challenge
    (h) => /BONUS\s*[—–-]\s*only/i.test(h) || /BONUS\b/.test(h)
      ? ok("'BONUS' label on challenge")
      : miss("challenge not labelled 'BONUS — only if you want to!'"),
    // Rule 7: worked example ≤ 5 numbered steps (covered by post-validator)
    (_h, sections) => {
      const ex = sections.find(s => /worked.example|^example/i.test(String(s.title || "")) || String(s.type || "") === "example");
      if (!ex) return skip("no worked example section");
      const stepCount = String(ex.content || "").split("\n")
        .filter(l => /^\s*(?:Step\s*\d+|[0-9]+[\.\)])\s+/i.test(l)).length;
      return stepCount <= 5
        ? ok(`${stepCount} numbered steps (≤ 5)`)
        : miss(`worked example has ${stepCount} steps (cap 5)`);
    },
  ],

  // ── Dyslexia ──────────────────────────────────────────────────────────────
  dyslexia: [
    // Rule 1: every question is one sentence ≤ 12 words
    (_h, sections) => {
      const qs = sections.filter(isQuestionSection).filter(s => !s.teacherOnly);
      if (qs.length === 0) return skip("no question sections to probe");
      const lines = qs.flatMap(s => String(s.content || "").split("\n"))
        .filter(l => /^\s*(?:Q?\d+[\.\):])\s+/.test(l));
      if (lines.length === 0) return skip("no numbered question lines");
      const longLines = lines.filter(l => l.replace(/^\s*Q?\d+[\.\):]\s*/, "").trim().split(/\s+/).length > 14);
      return longLines.length === 0
        ? ok(`all ${lines.length} questions ≤ 14 words`)
        : miss(`${longLines.length}/${lines.length} questions exceed 12-word target`);
    },
    // Rule 2: bolded key terms present
    (h) => /\*\*[A-Za-z]/.test(h)
      ? ok("bold emphasis present")
      : miss("no bold (**term**) emphasis on subject terms"),
    // Rule 3: sentence starter / answer frame in Section A
    (_h, sections) => {
      const a = sections.find(s => /section\s*a|warm[\s-]?up|guided/i.test(String(s.title || "")) && !s.teacherOnly);
      if (!a) return skip("Section A not found");
      const c = String(a.content || "");
      return /(\bThe\s+answer\s+is\s+_+|because\s+_+|Sentence\s+starter|frame:|I\s+think|This\s+is\b)/i.test(c)
        ? ok("sentence starter / answer frame in Section A")
        : miss("no sentence starter / answer frame in Section A");
    },
    // Rule 4: step-by-step method box before Section A
    (_h, sections) => {
      const idx = sections.findIndex(s => /section\s*a/i.test(String(s.title || "")));
      if (idx <= 0) return skip("no Section A or it is the first section");
      const before = sections.slice(0, idx);
      return before.some(s => /step.by.step|method/i.test(String(s.title || "") + String(s.content || "")))
        ? ok("step-by-step method present before Section A")
        : miss("no 'Step-by-step method' box before Section A");
    },
    // Rule 5: line spacing — narrative, not probable from JSON content
    () => skip("line spacing is rendered via CSS; not probable from content"),
    // Rule 6: word bank at top of each section
    (_h, sections) => {
      const wb = sections.some(s => /word\s*bank|key\s*vocab/i.test(String(s.title || "") + String(s.content || "")));
      return wb ? ok("word bank / key vocabulary section present") : miss("no word bank / key vocabulary section");
    },
    // Rule 7: reflection uses 'I can …' tickboxes
    (_h, sections) => {
      const ref = sections.find(s => /reflection/i.test(String(s.type || "") + String(s.title || "")));
      if (!ref) return skip("no reflection section");
      const c = String(ref.content || "");
      return /\bI\s+can\s+/i.test(c) || /\[\s*\]\s+I\s+/i.test(c)
        ? ok("'I can …' tick-box reflection")
        : miss("reflection is not 'I can …' tick-box style");
    },
  ],

  // ── Dyscalculia ───────────────────────────────────────────────────────────
  dyscalculia: [
    // Rule 1: Section A questions split into Step 1/2/3
    (_h, sections) => {
      const a = sections.find(s => /section\s*a|guided|recall/i.test(String(s.title || "")) && !s.teacherOnly);
      if (!a) return skip("Section A not found");
      const c = String(a.content || "");
      return /Step\s*1\s*:.*Step\s*2\s*:/is.test(c)
        ? ok("Step 1/Step 2 sub-steps present in Section A")
        : miss("Section A questions not split into Step 1/Step 2/Step 3");
    },
    // Rule 2: number line OR place-value chart before Section A
    (h) => /(number.line|place.value|\[\[DIAGRAM:[^\]]*number-line|\[\[DIAGRAM:[^\]]*place-value)/i.test(h)
      ? ok("number-line or place-value reference present")
      : miss("no number-line / place-value chart"),
    // Rule 3: every arithmetic step has a 'why' annotation in worked example
    (_h, sections) => {
      const ex = sections.find(s => /worked.example|^example/i.test(String(s.title || "")));
      if (!ex) return skip("no worked example");
      const c = String(ex.content || "");
      return /\bbecause\b|\bwhy\b|→\s+\w+|\(.*because.*\)|\bso that\b/i.test(c)
        ? ok("'why' annotations in worked example")
        : miss("worked example has no 'why' annotation per step");
    },
    // Rule 4: Key Facts box at top of Section B
    (_h, sections) => {
      const idx = sections.findIndex(s => /section\s*b|main\s*practice|understanding/i.test(String(s.title || "")));
      if (idx < 0) return skip("Section B not found");
      const c = sections[idx];
      const before = sections[idx - 1];
      const haystack = String(c?.content || "") + " " + String(before?.title || "") + " " + String(before?.content || "");
      return /\bkey\s*facts\b|\bnumber\s*bonds\b|\btimes\s*tables?\b/i.test(haystack)
        ? ok("Key Facts box near Section B")
        : miss("no Key Facts box at top of Section B");
    },
    // Rule 5: real-world contexts in word problems
    (h) => /(shop|cost|price|£|cooking|recipe|distance|kilometr|sport|football|train|bus|ticket|home|school)/i.test(h)
      ? ok("real-world context tokens present in content")
      : miss("no real-world context tokens (£, shop, recipe, distance, sport)"),
    // Rule 6: small whole numbers in Section A (1–20)
    () => skip("number-range probe is too noisy — covered by curriculum tier rules"),
    // Rule 7: reflection is 'Great / OK / Struggling'
    (_h, sections) => {
      const ref = sections.find(s => /reflection/i.test(String(s.type || "") + String(s.title || "")));
      if (!ref) return skip("no reflection section");
      const c = String(ref.content || "");
      return /Great\b.*OK\b.*Struggling|Calm\s*\|\s*OK|tick.box/is.test(c)
        ? ok("Great/OK/Struggling reflection scale")
        : miss("reflection not Great/OK/Struggling tick-box");
    },
  ],

  // ── ASC (generic) — same structural fingerprints apply to sub-profiles ───
  asc: [
    (h) => /what\s+you\s+need\s+to\s+do/i.test(h)
      ? ok("'What you need to do' box present")
      : miss("no 'What you need to do' box"),
    (_h, sections) => {
      const idx = sections.findIndex(s => /section\s*a/i.test(String(s.title || "")));
      if (idx <= 0) return skip("Section A not found");
      const before = sections.slice(0, idx);
      return before.some(s => /worked\s*example|^example/i.test(String(s.title || "")))
        ? ok("worked example precedes Section A")
        : miss("no worked example before Section A");
    },
    () => skip("'one word per concept' is too narrative to probe"),
    () => skip("'literal language' is too narrative to probe"),
    () => skip("'neutral contexts' is too narrative to probe"),
    (_h, sections) => {
      const ref = sections.find(s => /reflection/i.test(String(s.type || "") + String(s.title || "")));
      if (!ref) return skip("no reflection section");
      return /\[\s*\]/.test(String(ref.content || ""))
        ? ok("tick-box reflection present")
        : miss("reflection not tick-box format");
    },
    () => skip("'identical layout' is rendered via CSS"),
  ],

  // ── EAL ───────────────────────────────────────────────────────────────────
  eal: [
    (h) => /\b(key\s*vocabulary|word\s*bank|glossary)\b/i.test(h)
      ? ok("vocabulary / word bank present")
      : miss("no Key Vocabulary / Word Bank section"),
    (h) => /\b(answer\s*frame|sentence\s*starter|The\s+answer\s+is\s+_|This\s+shows\s+that\s+_)/i.test(h)
      ? ok("sentence frame / answer frame present")
      : miss("no sentence frame / answer frame for written responses"),
    () => skip("'culturally neutral contexts' is too narrative to probe"),
    () => skip("'short sentences / simple grammar' covered by reading-age check"),
    (_h, sections) => {
      const hasDiag = sections.some(s => /diagram/i.test(String(s.type || "")));
      return hasDiag
        ? ok("diagram / visual support present")
        : miss("no visual support / diagram section");
    },
  ],

  // ── SLCN ──────────────────────────────────────────────────────────────────
  slcn: [
    (h) => /\b(word\s*bank|key\s*vocabulary)\b/i.test(h)
      ? ok("word bank / key vocabulary present")
      : miss("no word bank at start of section(s)"),
    (h) => /\b(answer\s*frame|sentence\s*starter|The\s+answer\s+is\s+_)/i.test(h)
      ? ok("sentence frame present")
      : miss("no sentence frame for answers"),
    () => skip("max sentence length probed by reading-age check"),
    (_h, sections) => {
      const types = new Set(sections.map(s => String(s.type || "").toLowerCase()));
      const have = ["q-matching", "q-mcq", "q-label-diagram"].filter(t => types.has(t));
      return have.length >= 1
        ? ok(`reduced-language formats: ${have.join(", ")}`)
        : miss("Section B has no matching / labelling / MCQ format");
    },
    (_h, sections) => sections.some(s => /diagram/i.test(String(s.type || "")))
      ? ok("visual support present")
      : miss("no visual support beside text questions"),
  ],

  // ── Anxiety / SEMH ────────────────────────────────────────────────────────
  anxiety: [
    (h) => /no\s*pressure|warm.up|you'?ve\s+got\s+this/i.test(h)
      ? ok("calm framing present")
      : miss("Section A not framed 'no pressure' / 'warm-up'"),
    (h) => /OPTIONAL\s*BONUS|only\s+if\s+you\s+want/i.test(h)
      ? ok("OPTIONAL BONUS label present")
      : miss("challenge not labelled 'OPTIONAL BONUS'"),
    () => skip("'positive priming sentence' is hard to fingerprint deterministically"),
    (h) => /How\s+are\s+you\s+feeling|feelings?\s*check/i.test(h)
      ? ok("emoji / mood check-in present")
      : miss("no 'How are you feeling?' check-in"),
    (h) => /\b(must|should|need\s+to)\b/i.test(h)
      ? miss("found 'must / should / need to' — should be 'try to' / 'have a go at'")
      : ok("no 'must / should / need to' language"),
    (h) => /tip\b|take\s+a\s+break/i.test(h)
      ? ok("'Take a break' / 'Tip' present")
      : miss("no 'Take a break' / 'Tip' box"),
  ],

  // ── PDA / ODD ─────────────────────────────────────────────────────────────
  "pda-odd": [
    (h) => /(explore\s*[—–-]\s*choose|investigate|secret\s*mission)/i.test(h)
      ? ok("invitational section names present")
      : miss("Section A/B/Challenge not renamed Explore/Investigate/Secret Mission"),
    (h) => /\b(must|should|need\s+to)\b/i.test(h)
      ? miss("'must / should / need to' present — should use 'might like to'")
      : ok("no 'must / should / need to' language"),
    (h) => /option\s*A\s*:|option\s*B\s*:/i.test(h)
      ? ok("Option A / Option B choices present")
      : miss("no 'Option A / Option B' choice within questions"),
    (h) => /take\s+a\s+break/i.test(h)
      ? ok("'Take a break' break-point present")
      : miss("no 'Take a break here if you need to' prompt"),
    (h) => /\bwe\s+(can|will|might|are)/i.test(h)
      ? ok("'we' framing present")
      : miss("no 'we' framing language"),
  ],

  // ── Working memory ────────────────────────────────────────────────────────
  "working-memory": [
    (h) => /memory\s*aid|key\s*facts/i.test(h)
      ? ok("Memory Aid / Key Facts box present")
      : miss("no Memory Aid box at start of question section"),
    (h) => /step\s*1\s*:.*step\s*2/is.test(h)
      ? ok("multi-step questions broken into Step 1/Step 2")
      : miss("multi-step questions not broken into Step 1 / Step 2 / Step 3"),
    (h) => /\b(word\s*bank|key\s*facts|key\s*vocabulary)\b/i.test(h)
      ? ok("visible word bank / key facts panel")
      : miss("no visible word bank / key facts panel"),
    (_h, sections) => sections.some(s => /worked.example|^example/i.test(String(s.title || "")))
      ? ok("worked example present")
      : miss("no worked example before practice"),
    () => skip("'one instruction per line' is hard to probe without parsing every line"),
    (_h, sections) => {
      const ref = sections.find(s => /reflection/i.test(String(s.type || "") + String(s.title || "")));
      if (!ref) return skip("no reflection section");
      return /\[\s*\]/.test(String(ref.content || ""))
        ? ok("tick-box reflection present")
        : miss("reflection not tick-box format");
    },
  ],

  // ── Visual impairment ─────────────────────────────────────────────────────
  vi: [
    () => skip("font size is rendered via CSS overlay"),
    () => skip("contrast is rendered via CSS overlay"),
    (_h, sections) => {
      const diags = sections.filter(s => /diagram/i.test(String(s.type || "")));
      if (diags.length === 0) return skip("no diagram sections to probe");
      const allHaveAlt = diags.every(s => Boolean((s as any).altText) || (String(s.content || "").length > 30));
      return allHaveAlt
        ? ok("all diagrams have alt-text or text description")
        : miss(`${diags.filter(s => !((s as any).altText)).length} diagram(s) missing alt-text / description`);
    },
    () => skip("'no diagram-only questions' covered by validator diagram-question rule"),
    () => skip("spacing is rendered via CSS overlay"),
    () => skip("worked example all-text rule overlaps with rule 4"),
    () => skip("question numbering style is rendered via CSS"),
  ],

  // ── Hearing impairment ────────────────────────────────────────────────────
  hi: [
    () => skip("'instructions written in full' overlaps with our default schema"),
    (h) => /\b(key\s*vocabulary|word\s*bank|glossary)\b/i.test(h)
      ? ok("Word Bank / Key Vocabulary present")
      : miss("no Word Bank / Key Vocabulary"),
    () => skip("'self-contained question' is hard to probe deterministically"),
    (_h, sections) => sections.some(s => /diagram/i.test(String(s.type || "")))
      ? ok("visual support present")
      : miss("no visual diagram beside text questions"),
    (h) => /\b(listen|hear|audio|narrat[ie]|spoken)\b/i.test(h)
      ? miss("found audio / listening references — should be removed for HI")
      : ok("no audio / listening references"),
    () => skip("'worked example written in full' covered by core schema"),
  ],

  // ── ASC — Social Communication profile ────────────────────────────────────
  // 6 rules. The first two are too narrative to fingerprint without false
  // positives; rules 3–6 have clear structural fingerprints.
  "asc-social": [
    () => skip("'no social scenarios' is too narrative — would false-flag legitimate human contexts"),
    () => skip("'idioms rewritten literally' is too narrative to probe deterministically"),
    (h) => /\b(key\s*vocabulary|word\s*bank|glossary)\b/i.test(h)
      ? ok("Word Bank / Key Vocabulary present (defines subject terms)")
      : miss("no Word Bank — subject terms not defined for the literal-processing pupil"),
    (h) => /(?:^|\n)\s*(?:1\.|Step\s*1\s*:)\s+\S[\s\S]*?(?:\n)\s*(?:2\.|Step\s*2\s*:)/i.test(h)
      ? ok("numbered step instructions present")
      : miss("multi-step instructions not broken into numbered steps"),
    (h) => /what\s+you\s+need\s+to\s+do/i.test(h)
      ? ok("'What you need to do' box present")
      : miss("no 'What you need to do' box opening section(s)"),
    (_h, sections) => {
      const ref = sections.find(s => /reflection/i.test(String(s.type || "") + String(s.title || "")));
      if (!ref) return skip("no reflection section");
      const c = String(ref.content || "");
      const hasTickBox = /\[\s*\]/.test(c);
      const hasExitQ = /(write\s+one|one\s+fact|one\s+thing\s+you\s+learned)/i.test(c);
      return hasTickBox && hasExitQ
        ? ok("tick-box reflection + single exit question")
        : miss(`reflection ${hasTickBox ? "" : "missing tick-boxes; "}${hasExitQ ? "" : "missing single exit question"}`.trim());
    },
  ],

  // ── ASC — Demand-Avoidant profile ─────────────────────────────────────────
  // 7 rules. Several overlap with pda-odd; we re-probe here because the user
  // can pick this profile directly without going via pda-odd.
  "asc-demand-avoidant": [
    // Rule 1 — anchor "you must" / "you need to" / "answer the following" to
    // start-of-sentence so the legitimate "What you need to do:" box header
    // doesn't false-trigger. We require the imperative to be followed by
    // another word (to filter out the bare "What you need to do:" label).
    (h) => /(^|[.!?\n])\s*(?:you\s+(?:must|need\s+to|should)|answer\s+the\s+following)\b\s+\w/i.test(h)
      ? miss("'you must / need to / should / answer the following' present — should be 'you might like to'")
      : ok("no demand-language imperatives in student-visible content"),
    (h) => /what\s+you\s+need\s+to\s+do/i.test(h) && /(might\s+like\s+to|have\s+a\s+go\s+at)/i.test(h)
      ? ok("'What you need to do' box phrased invitationally ('might like to' / 'have a go at')")
      : miss("no 'What you need to do' box OR not phrased invitationally"),
    (h) => /option\s*A\s*[:.]|option\s*B\s*[:.]/i.test(h)
      ? ok("Option A / Option B choices present")
      : miss("no 'Option A / Option B' choice within practice questions"),
    (h) => /(explore\s*[—–-]\s*choose|investigate|secret\s*mission)/i.test(h)
      ? ok("invitational section names present (Explore / Investigate / Secret Mission)")
      : miss("Section A / B / Challenge not renamed to Explore / Investigate / Secret Mission"),
    (h) => /take\s+a\s+break\s+here/i.test(h)
      ? ok("'Take a break here' break-point present")
      : miss("no 'Take a break here if you need to' break-point"),
    (h) => /\[\s*\]/.test(h) || /Q?\d+\s*\/\s*\d+\s+(?:complete|done)/i.test(h)
      ? miss("checkbox / progress tracker present — demand-avoidant pupils experience this as surveillance")
      : ok("no checkboxes or progress trackers"),
    (_h, sections) => {
      const ref = sections.find(s => /reflection/i.test(String(s.type || "") + String(s.title || "")));
      if (!ref) return skip("no reflection section");
      return /(if\s+you\s+would\s+like|you\s+might\s+like\s+to\s+(?:write|note))/i.test(String(ref.content || ""))
        ? ok("invitational reflection prompt")
        : miss("reflection not framed invitationally");
    },
  ],

  // ── ASC — Sensory-Dominant profile ────────────────────────────────────────
  // 7 rules; palette / whitespace / layout-uniformity are CSS-rendered.
  "asc-sensory": [
    () => skip("muted / low-saturation palette is rendered via CSS overlay"),
    () => skip("whitespace and spacing are rendered via CSS overlay"),
    (h) => /[\u{1F300}-\u{1FAFF}]|[★☆✨🎉🎊🌟⭐]/u.test(h)
      ? miss("decorative icons / emojis / stars detected — should be removed for sensory-dominant ASC")
      : ok("no decorative icons / emojis / stars"),
    () => skip("'identical layout across sections' is rendered via CSS"),
    (_h, sections) => {
      const diags = sections.filter(s => /diagram/i.test(String(s.type || "")));
      if (diags.length === 0) return skip("no diagram sections to probe");
      const allDescribed = diags.every(s =>
        Boolean((s as any).altText) || String(s.content || "").trim().length >= 30,
      );
      return allDescribed
        ? ok(`all ${diags.length} diagram(s) carry a text description alongside`)
        : miss("at least one diagram has no text description alongside");
    },
    (h) => /what\s+you\s+need\s+to\s+do/i.test(h)
      ? ok("'What you need to do' box present")
      : miss("no 'What you need to do' box opening section(s)"),
    (_h, sections) => {
      const ref = sections.find(s => /reflection/i.test(String(s.type || "") + String(s.title || "")));
      if (!ref) return skip("no reflection section");
      return /\[\s*\]/.test(String(ref.content || ""))
        ? ok("minimal tick-box reflection")
        : miss("reflection not minimal tick-box format");
    },
  ],

  // ── ASC — Rigid-Thinking / Routine profile ────────────────────────────────
  // 7 rules. Identical-verb rule is fingerprinted by counting unique
  // sentence-initial command verbs across question stems.
  "asc-rigid": [
    () => skip("fixed question count is enforced by Phase 1 section-count validator"),
    (_h, sections) => {
      const examples = sections.filter(s =>
        /worked.example|^example/i.test(String(s.title || "") + String(s.type || "")),
      );
      return examples.length >= 2
        ? ok(`${examples.length} worked-example sections (one per practice section)`)
        : miss(`only ${examples.length} worked-example section(s) — rigid-thinking pupils need a fresh worked example before each practice section`);
    },
    (_h, sections) => {
      // Collect the leading imperative verb of each numbered question line.
      const verbs = new Set<string>();
      for (const s of sections) {
        if (s.teacherOnly) continue;
        const lines = String(s.content || "").split("\n");
        for (const ln of lines) {
          const m = ln.match(/^\s*(?:\[\s*[xX]?\s*\]\s+)?(?:Q?\d+[.)])\s+(?:\*\*)?([A-Za-z][A-Za-z\s]{2,15}?)(?:\*\*)?\b/);
          if (m) {
            const verb = m[1].trim().toLowerCase().split(/\s+/)[0];
            if (verb.length >= 3) verbs.add(verb);
          }
        }
      }
      if (verbs.size === 0) return skip("no leading imperative verbs detected on numbered questions");
      // Rigid-thinking pupils benefit from ≤ 2 distinct lead verbs across the sheet.
      return verbs.size <= 2
        ? ok(`${verbs.size} distinct lead verb(s): ${Array.from(verbs).join(", ")}`)
        : miss(`${verbs.size} distinct lead verbs (${Array.from(verbs).join(", ")}) — rigid-thinking pupils need ONE consistent verb`);
    },
    () => skip("'identical question structure' overlaps with the lead-verb probe and is hard to fingerprint independently"),
    (h) => /\boptional\b/i.test(h)
      ? ok("'Optional' label present (bonus items separated)")
      : miss("no 'Optional' labelled section — bonus items must be visibly separated"),
    (h) => /what\s+you\s+need\s+to\s+do/i.test(h)
      ? ok("'What you need to do' box present")
      : miss("no 'What you need to do' box opening section(s)"),
    (_h, sections) => {
      const ref = sections.find(s => /reflection/i.test(String(s.type || "") + String(s.title || "")));
      if (!ref) return skip("no reflection section");
      return /\[\s*\]/.test(String(ref.content || ""))
        ? ok("tick-box reflection present")
        : miss("reflection not tick-box format");
    },
  ],

  // ── Asperger Syndrome ─────────────────────────────────────────────────────
  // 6 rules; rules 2-5 are too narrative to fingerprint reliably.
  asperger: [
    (h) => /what\s+you\s+need\s+to\s+do/i.test(h)
      ? ok("'What you need to do' box present")
      : miss("no 'What you need to do' box opening section(s)"),
    () => skip("'direct, literal language; no idioms' is too narrative to probe deterministically"),
    () => skip("'one word per concept' requires a synonym graph; too narrative for a regex probe"),
    () => skip("'identical layout across every section' is rendered via CSS"),
    () => skip("'interest-based context' depends on per-pupil profile not visible in worksheet content"),
    (_h, sections) => {
      const ref = sections.find(s => /reflection/i.test(String(s.type || "") + String(s.title || "")));
      if (!ref) return skip("no reflection section");
      return /\[\s*\]/.test(String(ref.content || ""))
        ? ok("tick-box reflection present")
        : miss("reflection not tick-box format");
    },
  ],

  // ── Moderate Learning Difficulties (MLD) ──────────────────────────────────
  mld: [
    (_h, sections) => {
      // Q1 of Section A should contain a fully completed model answer inline.
      const a = sections.find(s =>
        /section\s*a|guided|recall/i.test(String(s.title || "")) ||
        String(s.type || "").toLowerCase() === "recall",
      );
      if (!a) return skip("Section A not found");
      const c = String(a.content || "");
      // Look for "Q1" / "1." followed somewhere by an inline answer marker
      // ("Answer:", "= ", "✓", or a "Model answer" header).
      const hasQ1 = /(^|\n)\s*(?:Q?1[.)])\s+\S/.test(c);
      const hasModel = /(model\s+answer|answer\s*[:=])/i.test(c.split(/\n\s*(?:Q?2[.)])/)[0] || c);
      return hasQ1 && hasModel
        ? ok("Q1 carries a model answer inline")
        : miss(`Q1 of Section A ${hasQ1 ? "" : "missing; "}${hasModel ? "" : "no inline model answer"}`.trim());
    },
    (_h, sections) => {
      const a = sections.find(s =>
        /section\s*a|guided|recall/i.test(String(s.title || "")) ||
        String(s.type || "").toLowerCase() === "recall",
      );
      if (!a) return skip("Section A not found");
      const c = String(a.content || "");
      return /(hint\s*:|sentence\s*starter|_{2,})/i.test(c)
        ? ok("hints / sentence starters / partial answers in Section A")
        : miss("Section A questions have no hints, sentence starters, or partial answers");
    },
    (_h, sections) => {
      const idx = sections.findIndex(s =>
        /section\s*b|main\s*practice|understanding/i.test(String(s.title || "")) ||
        String(s.type || "").toLowerCase() === "understanding",
      );
      if (idx < 0) return skip("Section B not found");
      const before = sections[idx - 1];
      const cur = sections[idx];
      const haystack = `${String(before?.title || "")} ${String(before?.content || "")} ${String(cur?.content || "")}`;
      return /help\s*box/i.test(haystack)
        ? ok("Help Box near top of Section B")
        : miss("no Help Box at the top of Section B");
    },
    () => skip("'KS2 reading level throughout' covered by Phase 5 reading-age check"),
    () => skip("'Concrete → Pictorial → Abstract progression' is too narrative to probe deterministically"),
    (_h, sections) => {
      const a = sections.find(s =>
        /section\s*a|guided|recall/i.test(String(s.title || "")) ||
        String(s.type || "").toLowerCase() === "recall",
      );
      if (!a) return skip("Section A not found");
      const c = String(a.content || "");
      // No multi-step in Section A: warn if we see "Step 1: ... Step 2:" or "(a) ... (b)".
      const hasSteps = /step\s*1\s*:.*step\s*2\s*:/is.test(c);
      const hasSubparts = /\(a\)\s*\S[\s\S]*?\(b\)\s*\S/i.test(c);
      return hasSteps || hasSubparts
        ? miss("Section A contains multi-step / sub-part questions — should be single-step only")
        : ok("Section A questions are single-step");
    },
    (h) => /OPTIONAL\s*(?:BONUS|CHALLENGE)|only\s+if\s+you\s+want/i.test(h)
      ? ok("Challenge labelled OPTIONAL")
      : miss("Challenge not labelled OPTIONAL — should be optional for MLD pupils"),
  ],

  // ── Dyspraxia / DCD ───────────────────────────────────────────────────────
  dyspraxia: [
    (_h, sections) => {
      const a = sections.find(s =>
        /section\s*a|guided|recall/i.test(String(s.title || "")) ||
        String(s.type || "").toLowerCase() === "recall",
      );
      if (!a) return skip("Section A not found");
      const aSections = sections.filter(s => {
        const t = String(s.type || "").toLowerCase();
        return ["q-mcq", "q-matching", "q-true-false", "q-label-diagram"].includes(t);
      });
      return aSections.length >= 3
        ? ok(`${aSections.length} reduced-handwriting questions (MCQ / matching / T-F / labelling)`)
        : miss(`only ${aSections.length} reduced-handwriting question type(s) — Section A needs ≥ 3`);
    },
    () => skip("answer-box size is rendered via CSS overlay"),
    (_h, sections) => {
      const types = new Set(sections.map(s => String(s.type || "").toLowerCase()));
      const have = ["q-data-table", "q-gap-fill", "table_complete"].filter(t => types.has(t));
      return have.length >= 1
        ? ok(`structured-frame format(s) present: ${have.join(", ")}`)
        : miss("no table / fill-in-the-blank / structured-frame question in Section B");
    },
    (_h, sections) => {
      const ch = sections.find(s =>
        /challenge|secret\s*mission|bonus/i.test(String(s.title || "")) ||
        String(s.type || "").toLowerCase() === "challenge" ||
        String(s.type || "").toLowerCase() === "q-challenge",
      );
      if (!ch) return skip("no challenge section");
      const t = String(ch.type || "").toLowerCase();
      const reducedTypes = ["q-mcq", "q-matching", "q-true-false", "q-label-diagram", "q-gap-fill"];
      if (reducedTypes.includes(t)) return ok(`challenge uses reduced-writing type "${t}"`);
      // Fall back to content heuristic — extended writing prompt detected?
      return /\bextended\s+(?:answer|response)|\bessay|\bdiscuss in detail/i.test(String(ch.content || ""))
        ? miss("challenge uses extended-writing format — should be tick / circle / label")
        : ok("challenge appears not to require extended writing");
    },
    (_h, sections) => {
      const ex = sections.find(s => /worked.example|^example/i.test(String(s.title || "")));
      if (!ex) return skip("no worked example");
      const lines = String(ex.content || "").split("\n").filter(l => l.trim().length > 0);
      // Treat lines > 30 words as paragraphs.
      const paras = lines.filter(l => l.trim().split(/\s+/).length > 30).length;
      return paras === 0
        ? ok("worked example uses brief bullet steps (no paragraph runs)")
        : miss(`${paras} paragraph-length step(s) detected — should be brief bullets`);
    },
    () => skip("'minimise handwriting demands' overlaps with rules 1-4"),
  ],

  // ── Tourette's Syndrome ───────────────────────────────────────────────────
  tourettes: [
    (_h, sections) => {
      const types = new Set(sections.map(s => String(s.type || "").toLowerCase()));
      const have = ["q-mcq", "q-matching", "q-true-false", "q-gap-fill", "q-label-diagram"].filter(t =>
        types.has(t),
      );
      return have.length >= 3
        ? ok(`${have.length} varied response formats present: ${have.join(", ")}`)
        : miss(`only ${have.length} varied formats — need ≥ 3 (MCQ / match / T-F / fill / label)`);
    },
    (h) => /take\s+a\s+breath|take\s+a\s+break/i.test(h)
      ? ok("'Take a breath / break' break-point(s) present")
      : miss("no 'Take a breath here if you need to' break-points"),
    (_h, sections) => {
      const a = sections.find(s =>
        /section\s*a/i.test(String(s.title || "")) ||
        String(s.type || "").toLowerCase() === "recall",
      );
      if (!a) return skip("Section A not found");
      const qCount = countQuestionLines(String(a.content || ""));
      return qCount <= 4 && qCount > 0
        ? ok(`Section A has ${qCount} question(s) (≤ 4)`)
        : miss(`Section A has ${qCount} questions — cap is 4`);
    },
    (h) => /\b(quickly|in\s+\d+\s*(?:min|sec|seconds|minutes)|hurry|fast\s+as\s+you\s+can)\b/i.test(h)
      ? miss("urgency / time-pressure language detected (quickly / in N minutes / hurry)")
      : ok("no urgency / time-pressure language"),
    () => skip("'no loud or urgent language' overlaps with the time-pressure probe"),
  ],

  // ── Older Learners (KS3 / KS4 / KS5) ──────────────────────────────────────
  "older-learners": [
    () => skip("'graphic organiser table' is hard to detect without parsing markdown tables"),
    (h) => /(cornell|key\s*terms[\s\S]{0,80}summary)/i.test(h)
      ? ok("Cornell-style note section present")
      : miss("no Cornell-style 'Key terms / Summary' section"),
    () => skip("'age-appropriate academic language' overlaps with Phase 5 reading-age check"),
    (h) => /study\s*tips?\b/i.test(h)
      ? ok("'Study Tips' box present")
      : miss("no 'Study Tips' box opening sections"),
    (_h, sections) => {
      const sectionTitles = sections.map(s => String(s.title || ""));
      const withTime = sectionTitles.filter(t => /\b(\d+\s*(?:min|minute)|≈\s*\d+)/i.test(t));
      return withTime.length >= 2
        ? ok(`${withTime.length} section(s) carry an estimated time`)
        : miss("section headers don't show estimated time (e.g. 'Section A (≈ 10 min)')");
    },
    (_h, sections) => {
      const ref = sections.find(s => /reflection/i.test(String(s.type || "") + String(s.title || "")));
      if (!ref) return skip("no reflection section");
      const c = String(ref.content || "");
      return /(what\s+went\s+well|what\s+do\s+I\s+need\s+to\s+revise)/i.test(c)
        ? ok("'What went well? / What do I need to revise?' reflection present")
        : miss("reflection doesn't ask 'What went well?' / 'What do I need to revise further?'");
    },
  ],

  // ── SEMH (Social, Emotional and Mental Health) ────────────────────────────
  // The SEMH profile shares much pedagogy with `anxiety`; we re-probe here so
  // the audit works when the user (or `resolveSendSpec`) returns the SEMH id
  // directly. NOTE: the resolver currently masks SEMH behind `anxiety` for
  // most input shapes — see SESSION-HANDOFF for the resolver-fix follow-up.
  semh: [
    (h) => /\[\s*\]\s*(?:Calm|OK|Need\s+a\s+break)/i.test(h)
      ? ok("emotional check-in tick-boxes present (Calm / OK / Need a break)")
      : miss("no emotional check-in tick-boxes (Calm / OK / Need a break)"),
    (h) => /warm[\s-]?up\s*[—–-]\s*no\s+pressure|OPTIONAL\s*BONUS/i.test(h)
      ? ok("Warm-Up / OPTIONAL BONUS framing present")
      : miss("Section A not 'Warm-Up — no pressure!' or challenge not 'OPTIONAL BONUS'"),
    () => skip("'positive priming statement at section start' is hard to fingerprint reliably"),
    (h) => /(^|[.!?\n])\s*(?:you\s+(?:must|need\s+to|should)|you\s+have\s+to)\b\s+\w/i.test(h)
      ? miss("'you must / should / need to / have to' demand-language detected — should be 'try to' / 'have a go at'")
      : ok("no 'you must / should / need to' demand-language"),
    (h) => /take\s+a\s+breath|take\s+a\s+break/i.test(h)
      ? ok("'Take a breath / break' break-point present")
      : miss("no 'Take a breath / break' mid-section break-point"),
    (_h, sections) => {
      const ref = sections.find(s => /reflection/i.test(String(s.type || "") + String(s.title || "")));
      if (!ref) return skip("no reflection section");
      return /\[\s*\]\s*(?:Calm|OK|Need\s+a\s+break)/i.test(String(ref.content || ""))
        ? ok("reflection includes Calm / OK / Need-a-break check-in")
        : miss("reflection lacks emotional check-in tick-boxes");
    },
  ],
};

// All 21 SEND profiles in `sendPromptFragments.ts:SEND_ADAPTATION_SPECS` now
// have at least one deterministic probe in `PROBES` above. The set below is
// retained (empty) as the contract surface for any future profile that
// genuinely cannot be probed deterministically — when that happens, add the
// id here and the audit will surface a `not-checked` line per rule with the
// "narrative rule" reason rather than the "no probe registered" reason.
const NOT_PROBED_PROFILES = new Set<string>([]);

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Build a haystack of student-visible content concatenated with section
 * titles. Diagrams and teacher-only content are excluded.
 */
function buildHaystack(sections: FidelityAuditableSection[]): string {
  return sections
    .filter((s) => !s.teacherOnly)
    .map((s) => `${String(s.title || "")}\n${String(s.content || "")}`)
    .join("\n\n");
}

/**
 * Run the SEND fidelity audit for the given worksheet + SEND profile id.
 * Returns null when no SEND profile applies (or it is unknown). The audit is
 * pure — it never mutates the worksheet.
 */
export function runSendFidelityAudit(
  worksheet: FidelityAuditableWorksheet,
  sendNeed: string | undefined | null,
): SendFidelityReport | null {
  const spec: SendAdaptationSpec | null = resolveSendSpec(sendNeed);
  if (!spec) return null;
  const sections = worksheet.sections || [];
  const haystack = buildHaystack(sections);

  const probes = PROBES[spec.id];
  // Build a results array. If no probes registered, default to not-checked
  // for every rule (still shows the rule list to the teacher with a banner).
  const results: SendFidelityRuleResult[] = spec.worksheetRules.map((rule, i) => {
    const probe = probes?.[i];
    if (!probe) {
      return {
        ruleIndex: i + 1,
        rule,
        status: "not-checked",
        evidence: NOT_PROBED_PROFILES.has(spec.id)
          ? "narrative rule — fidelity probe not registered"
          : "no probe registered for this rule",
      };
    }
    const r = probe(haystack, sections);
    return { ruleIndex: i + 1, rule, ...r };
  });

  const appliedCount = results.filter((r) => r.status === "applied").length;
  const probeable = results.filter((r) => r.status !== "not-checked").length;
  const fidelityRatio = probeable === 0 ? 0 : appliedCount / probeable;
  const warnings = results
    .filter((r) => r.status === "missing")
    .map((r) => `[SEND fidelity] ${spec.name}: rule ${r.ruleIndex} not applied — ${r.evidence}`);

  return {
    sendNeedId: spec.id,
    sendNeedName: spec.name,
    rules: results,
    appliedCount,
    totalCount: results.length,
    fidelityRatio,
    warnings,
  };
}

/**
 * Stamps `metadata.sendFidelityReport` onto a worksheet (immutably) when the
 * given SEND profile resolves. No-op when sendNeed is empty / unknown. Also
 * accumulates the report's warnings into `metadata.postValidatorWarnings`
 * so the existing yellow-banner channel surfaces them automatically.
 *
 * When `metadata.sendEnforcerPreserveStems` is true (FEAT-PB5 — exam-style
 * Y9+), probes that necessarily mutate the question stem are downgraded
 * from `missing` to `not-checked` so the teacher panel doesn't show a red
 * cross for a rule that we deliberately suppressed.
 */
export function applySendFidelityAudit<W extends FidelityAuditableWorksheet>(
  worksheet: W,
  sendNeed: string | undefined | null,
): W {
  const report = runSendFidelityAudit(worksheet, sendNeed);
  if (!report) return worksheet;

  // FEAT-PB5 — under preserve-stems mode, downgrade stem-mutating rules.
  // The preservation flag is stamped onto metadata by sendEnforcer.ts.
  const preserveStems = Boolean((worksheet.metadata as any)?.sendEnforcerPreserveStems);
  let finalReport = report;
  if (preserveStems) {
    const STEM_MUTATING_RULES: Record<string, number[]> = {
      // Rule indices are 1-based and match worksheetRules order.
      adhd: [1, 2, 4, 5], // checkbox prefix, hard caps, bolded verb, BRAIN BREAK
      dyslexia: [1, 2, 3], // 12-word stems, bolding inside stems, sentence frames within stems
    };
    const downgrade = STEM_MUTATING_RULES[report.sendNeedId] || [];
    const adjustedRules = report.rules.map((r) => {
      if (r.status === "missing" && downgrade.includes(r.ruleIndex)) {
        return {
          ...r,
          status: "not-checked" as const,
          evidence: "stem-preserving mode (Y9+ exam-style) — adaptation applied via support panels, not stem rewrite",
        };
      }
      return r;
    });
    const appliedCount = adjustedRules.filter((r) => r.status === "applied").length;
    const probeable = adjustedRules.filter((r) => r.status !== "not-checked").length;
    const fidelityRatio = probeable === 0 ? 0 : appliedCount / probeable;
    const warnings = adjustedRules
      .filter((r) => r.status === "missing")
      .map((r) => `[SEND fidelity] ${report.sendNeedName}: rule ${r.ruleIndex} not applied — ${r.evidence}`);
    finalReport = { ...report, rules: adjustedRules, appliedCount, fidelityRatio, warnings };
  }

  const existingWarnings = Array.isArray(worksheet.metadata?.postValidatorWarnings)
    ? (worksheet.metadata!.postValidatorWarnings as string[])
    : [];
  // Phase 4 follow-up bugfix — dedupe by string equality so calling
  // applySendFidelityAudit twice on the same input does not duplicate
  // warnings in metadata.postValidatorWarnings. The audit is otherwise
  // already idempotent (sendFidelityReport is deep-equal across calls);
  // this closes the soft idempotency violation flagged in
  // .agents/tasks/big-bang-improvements/SESSION-HANDOFF.md.
  const seen = new Set<string>();
  const mergedWarnings: string[] = [];
  for (const w of [...existingWarnings, ...finalReport.warnings]) {
    if (seen.has(w)) continue;
    seen.add(w);
    mergedWarnings.push(w);
  }
  return {
    ...worksheet,
    metadata: {
      ...(worksheet.metadata || {}),
      sendFidelityReport: finalReport,
      postValidatorWarnings: mergedWarnings,
    },
  } as W;
}
