/**
 * citationGroundedFactual.ts — PR-20 / audit item #48.
 *
 * Citation-grounded factual layer for history / science / English
 * Lit. Pure / deterministic. Ships dark behind
 * `PROMPT_CITATION_LAYER_ENABLED=true`.
 *
 * History dates, science values, and English Lit quotations are the
 * three subject areas where the LLM most commonly hallucinates. This
 * module declares a lookup table of canonical facts (sourced from
 * UK National Curriculum / awarding-body materials) plus a
 * `validateFactualClaim` helper that the post-validator chain can
 * call once the layer is enabled.
 *
 * The canonical-fact table is intentionally tiny in this PR — enough
 * to demonstrate the wire-up and unit-test the validator. Production
 * deployments expand the table from
 * `client/src/lib/curriculumAuthorityPrompt.ts` and the awarding-body
 * spec data already in the repo.
 */

export type CitationSubject = "history" | "biology" | "chemistry" | "physics" | "english-literature";

export interface CitationFact {
  id: string;
  subject: CitationSubject;
  /** The canonical claim, sentence form. */
  claim: string;
  /** Source — typically a UK National Curriculum / awarding body. */
  source: string;
  /** Optional alt-phrasings the LLM might use. */
  aliases?: string[];
  /** Optional numeric value the LLM must match. */
  value?: number | string;
  /** Optional unit attached to the value. */
  unit?: string;
}

/**
 * Tiny demo corpus. Each entry is curated so no fact is in dispute.
 * Production deployments load a larger corpus from the database.
 */
export const CITATION_CORPUS: CitationFact[] = [
  {
    id: "hist-1066",
    subject: "history",
    claim: "The Battle of Hastings took place on 14 October 1066.",
    source: "AQA GCSE History — Spec point 8145.",
    aliases: ["1066", "October 1066"],
  },
  {
    id: "hist-1939",
    subject: "history",
    claim: "Britain declared war on Germany on 3 September 1939.",
    source: "AQA GCSE History — Spec point 8145/2A.",
  },
  {
    id: "phys-c",
    subject: "physics",
    claim: "The speed of light in a vacuum is 3.0 × 10^8 m/s.",
    source: "AQA GCSE Physics — Data sheet.",
    value: 3e8,
    unit: "m/s",
  },
  {
    id: "phys-g",
    subject: "physics",
    claim: "The gravitational field strength at Earth's surface is 9.8 N/kg (often approximated to 10 N/kg).",
    source: "AQA GCSE Physics — Data sheet.",
    value: 9.8,
    unit: "N/kg",
  },
  {
    id: "chem-h-water",
    subject: "chemistry",
    claim: "Water has the chemical formula H2O.",
    source: "AQA GCSE Chemistry — Spec point 4.2.",
  },
  {
    id: "lit-mac-quote",
    subject: "english-literature",
    claim: 'Macbeth — "Is this a dagger which I see before me, the handle toward my hand?" Act II Scene 1.',
    source: "AQA GCSE English Literature — Macbeth set text.",
  },
];

export interface FactualClaimCheckResult {
  matched: boolean;
  fact?: CitationFact;
  /** When the claim was rejected, why. */
  reason?: string;
}

/**
 * Check a free-text claim against the canonical corpus. Conservative
 * — returns `matched: true` only when the corpus contains an exact
 * substring match (case-insensitive) on the claim or one of its
 * aliases.
 *
 * `subject` is required so a chemistry fact can never accidentally
 * "match" a history claim.
 */
export function validateFactualClaim(
  claim: string,
  subject: CitationSubject,
): FactualClaimCheckResult {
  const text = String(claim || "").trim().toLowerCase();
  if (!text) return { matched: false, reason: "empty claim" };
  const candidates = CITATION_CORPUS.filter((c) => c.subject === subject);
  for (const c of candidates) {
    const haystacks = [c.claim, ...(c.aliases || [])].map((s) => s.toLowerCase());
    for (const h of haystacks) {
      if (text.includes(h.toLowerCase())) return { matched: true, fact: c };
    }
  }
  return { matched: false, reason: "no canonical match in corpus" };
}

/**
 * Bulk-validate every section in a worksheet. Returns the per-section
 * findings + a summary count. Only sections with a `factualClaims[]`
 * array stamped by the LLM are checked; sections without that array
 * are silently skipped (the layer is opt-in by section, not by
 * worksheet).
 */
export interface CitationAuditWorksheet {
  metadata?: {
    subject?: string;
    citationAudit?: { totalClaims: number; matchedCount: number; unmatchedCount: number };
  };
  sections?: Array<{
    title?: string;
    factualClaims?: string[];
    [k: string]: unknown;
  }>;
}

export interface CitationAuditFinding {
  sectionIndex: number;
  sectionTitle: string;
  claim: string;
  matched: boolean;
  factId?: string;
  reason?: string;
}

export interface CitationAuditReport {
  findings: CitationAuditFinding[];
  totalClaims: number;
  matchedCount: number;
  unmatchedCount: number;
  warnings: string[];
}

export function auditCitations(ws: CitationAuditWorksheet): CitationAuditReport {
  const findings: CitationAuditFinding[] = [];
  const subjectKey = subjectToCitationSubject(ws.metadata?.subject);
  if (!subjectKey) {
    return { findings: [], totalClaims: 0, matchedCount: 0, unmatchedCount: 0, warnings: [] };
  }
  const sections = ws.sections || [];
  for (let i = 0; i < sections.length; i++) {
    const claims = sections[i].factualClaims || [];
    for (const claim of claims) {
      const r = validateFactualClaim(claim, subjectKey);
      findings.push({
        sectionIndex: i,
        sectionTitle: String(sections[i].title || `Section ${i + 1}`),
        claim,
        matched: r.matched,
        factId: r.fact?.id,
        reason: r.reason,
      });
    }
  }
  const matchedCount = findings.filter((f) => f.matched).length;
  const unmatchedCount = findings.length - matchedCount;
  const warnings: string[] = [];
  if (unmatchedCount > 0) {
    warnings.push(
      `[Phase PR-20 — Citation-grounded factual layer] ${unmatchedCount} factual claim(s) did not match the canonical corpus.`,
    );
  }
  return {
    findings,
    totalClaims: findings.length,
    matchedCount,
    unmatchedCount,
    warnings,
  };
}

function subjectToCitationSubject(subject: string | undefined): CitationSubject | null {
  const s = String(subject || "").toLowerCase();
  if (/history/.test(s)) return "history";
  if (/biology/.test(s)) return "biology";
  if (/chemistry/.test(s)) return "chemistry";
  if (/physics/.test(s)) return "physics";
  if (/literature|english\s*lit/.test(s)) return "english-literature";
  return null;
}

/**
 * Worksheet-level adapter compatible with the registry shape. Stamps
 * `metadata.citationAudit` and emits warnings. No-op when
 * `PROMPT_CITATION_LAYER_ENABLED` is not "true".
 */
export function enforceCitationGrounding(
  ws: CitationAuditWorksheet,
): { worksheet: CitationAuditWorksheet; warnings: string[] } {
  const enabled = String(typeof process !== "undefined" ? process.env.PROMPT_CITATION_LAYER_ENABLED : "").toLowerCase() === "true";
  if (!enabled) return { worksheet: ws, warnings: [] };
  const report = auditCitations(ws);
  return {
    worksheet: {
      ...ws,
      metadata: {
        ...(ws.metadata || {}),
        citationAudit: {
          totalClaims: report.totalClaims,
          matchedCount: report.matchedCount,
          unmatchedCount: report.unmatchedCount,
        },
      },
    },
    warnings: report.warnings,
  };
}
