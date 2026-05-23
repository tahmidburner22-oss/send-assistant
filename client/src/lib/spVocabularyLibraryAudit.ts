/**
 * spVocabularyLibraryAudit.ts — PR-19 / audit item #83
 *
 * Subject-vocabulary library audit. Pure, deterministic, no LLM.
 *
 * The post-validator chain already audits Tier-3 vocabulary at the
 * worksheet level (`enforceTier3VocabularyDeclared`). This module is
 * the corpus-level companion: given a corpus of worksheets covering
 * the same (subject, key-stage), it reports per-subject vocabulary
 * coverage gaps so the curriculum-authority team can spot terms that
 * never appear in any Word Bank across an entire scheme of work.
 *
 * Shape mirrors the other PR-19 audits: a `runFooAudit(...)` that takes
 * a corpus + a target list and returns a structured report; an
 * `enforceFoo(...)` adapter that takes a single worksheet, runs the
 * worksheet-level slice of the audit, and returns
 * `{ worksheet, warnings }` for the post-validator chain.
 *
 * Out of scope:
 *   - Loading the canonical subject-vocabulary corpus from disk. The
 *     audit takes `targetTerms` as an injected parameter so it can be
 *     unit-tested without I/O. Production loaders live in
 *     server/lib/subjectVocabularyCorpus.ts (PR-23 follow-up).
 */

export interface VocabularySection {
  type?: string;
  title?: string;
  content?: string;
  [key: string]: unknown;
}

export interface VocabularyWorksheet {
  metadata?: { subject?: string; yearGroup?: string; topic?: string } & Record<string, unknown>;
  sections?: VocabularySection[];
  [key: string]: unknown;
}

/** One subject-vocabulary target, e.g. ("respiration", ["aerobic","anaerobic","mitochondria","glucose"]). */
export interface VocabularyTarget {
  topic: string;
  /** Canonical Tier-3 terms expected to appear in any worksheet on this topic. Lowercase. */
  expectedTerms: string[];
}

export interface VocabularyAuditFinding {
  topic: string;
  missingTerms: string[];
  declaredTerms: string[];
  coverageRatio: number; // declared / expected
}

export interface VocabularyAuditReport {
  findings: VocabularyAuditFinding[];
  totalExpected: number;
  totalDeclared: number;
  totalMissing: number;
  warnings: string[];
}

const WORD_BANK_SECTION_TYPES = new Set(["key-vocab", "word-bank", "vocabulary"]);
const WORD_BANK_TITLE_RE = /\b(word\s*bank|key\s*vocab|vocabulary)\b/i;

/** Extract the Tier-3 terms declared on a single worksheet's Word Bank,
 *  lowercased + trimmed + deduped. Falls back to empty when the section
 *  is missing. Conservative: tokenises on newlines, commas and
 *  semicolons only; does NOT word-split free prose. */
export function extractDeclaredTerms(ws: VocabularyWorksheet): string[] {
  const sections = Array.isArray(ws.sections) ? ws.sections : [];
  const wordBank = sections.find(
    (s) =>
      WORD_BANK_SECTION_TYPES.has(String(s.type || "").toLowerCase()) ||
      WORD_BANK_TITLE_RE.test(String(s.title || "")),
  );
  if (!wordBank) return [];
  const content = String(wordBank.content || "");
  const tokens = content
    .split(/[\n,;]+/)
    .map((t) => t.replace(/^[\s\-\*\u2022\d.)]+/, "").trim().toLowerCase())
    .filter((t) => t.length > 0 && t.length <= 60);
  return Array.from(new Set(tokens));
}

/**
 * Audit a corpus of worksheets against the supplied vocabulary targets.
 * Returns one finding per target with the missing terms and coverage
 * ratio.
 */
export function runVocabularyLibraryAudit(
  corpus: VocabularyWorksheet[],
  targets: VocabularyTarget[],
): VocabularyAuditReport {
  // Aggregate every term declared across the corpus.
  const declaredAll = new Set<string>();
  for (const ws of corpus) {
    for (const t of extractDeclaredTerms(ws)) declaredAll.add(t);
  }

  const findings: VocabularyAuditFinding[] = [];
  const warnings: string[] = [];
  let totalExpected = 0;
  let totalDeclared = 0;
  let totalMissing = 0;

  for (const target of targets) {
    const expected = (target.expectedTerms || []).map((t) => t.toLowerCase());
    const declared = expected.filter((t) => declaredAll.has(t));
    const missing = expected.filter((t) => !declaredAll.has(t));
    const ratio = expected.length > 0 ? declared.length / expected.length : 1;
    findings.push({
      topic: target.topic,
      missingTerms: missing,
      declaredTerms: declared,
      coverageRatio: Number(ratio.toFixed(3)),
    });
    totalExpected += expected.length;
    totalDeclared += declared.length;
    totalMissing += missing.length;
    if (missing.length > 0) {
      warnings.push(
        `[Phase PR-19 — Subject vocabulary] ${target.topic}: ${missing.length} of ${expected.length} Tier-3 terms not declared in any Word Bank: ${missing.join(", ")}.`,
      );
    }
  }

  return { findings, totalExpected, totalDeclared, totalMissing, warnings };
}

/**
 * Worksheet-level slice: warn when a worksheet's Word Bank is empty
 * for a topic the curriculum knows has expected Tier-3 terms.
 *
 * Always-pure. Stamps no metadata (the corpus-level report is the
 * primary surface). Compatible with the registry's `adapt()` shape.
 */
export function enforceSpVocabularyLibrary(
  ws: VocabularyWorksheet,
): { worksheet: VocabularyWorksheet; warnings: string[] } {
  const declared = extractDeclaredTerms(ws);
  const warnings: string[] = [];
  const subject = String(ws.metadata?.subject || "").toLowerCase();
  // Conservative: only emit a warning when an obvious sciences /
  // humanities worksheet ships with no Word Bank at all. Maths sheets
  // legitimately omit the section when the topic is purely numerical.
  const needsBank = /science|biology|chemistry|physics|history|geography|english/.test(subject);
  if (needsBank && declared.length === 0) {
    warnings.push(
      `[Phase PR-19 — Subject vocabulary] No Word Bank declared for ${ws.metadata?.subject || "this subject"} worksheet on "${ws.metadata?.topic || "the topic"}".`,
    );
  }
  return { worksheet: ws, warnings };
}
