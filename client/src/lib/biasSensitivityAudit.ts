/**
 * biasSensitivityAudit.ts — PR-12 (audit item #12)
 *
 * Pure / deterministic / idempotent post-validator that scans pupil-facing
 * worksheet content for bias and sensitivity drift. Heuristics only —
 * no LLM call. Warn-only — never rewrites because removing the wrong
 * trigger word can silently change a question's pedagogy.
 *
 * What it flags (warn-only):
 *   - Gendered exemplar names from a single tradition (audits the
 *     name diversity across all worksheet examples — a worksheet
 *     populated with five "John / Sarah / Tom" names with no
 *     non-Anglo entry triggers a warning).
 *   - Non-UK / cultural-context drift (US sports, US currency,
 *     non-metric measurements masquerading as everyday context).
 *   - Stigmatising disability-first phrasing ("the autistic boy",
 *     "the dyslexic girl", "suffers from"). UK SEND guidance now
 *     prefers identity-affirming or person-first language.
 *   - Heteronormative framing in word problems ("his wife", "her
 *     husband") in subjects where alternative framings are available.
 *   - Class / SES-loaded contexts ("at the country club", "his
 *     gardener"). Warn-only — context might be deliberate (e.g.
 *     a Macbeth comprehension where class IS the topic).
 *
 * Skips teacher-only sections; never rewrites; pure / idempotent.
 */

const ANGLO_NAMES = new Set([
  "john", "sarah", "tom", "emma", "james", "olivia", "william",
  "harry", "george", "lucy", "henry", "lily", "charlie", "amelia",
]);

const NON_ANGLO_NAMES = new Set([
  "aisha", "fatima", "priya", "zara", "amir", "sanjay", "wei",
  "mei", "diego", "sofia", "kofi", "amara", "rohan", "yara",
  "noor", "kwame", "yusuf", "anika", "tariq", "leila", "raj",
  "chen", "haruto", "sakura", "okello",
]);

const US_CONTEXT_TOKENS = [
  /\b(dollar|cent|usd|\$\d)/i,
  /\b(yards?|feet|inches?|miles?|gallons?|pounds?\s*\(weight\))\b/i,
  /\b(soccer field|football \(american\)|baseball|nfl|nba|mlb|super bowl|world series)\b/i,
  /\b(walmart|costco|target store|cvs|7-eleven)\b/i,
  /\b(grade [1-9]|grade 1[0-2])\b/i,
];

const STIGMATISING_PHRASES: Array<{ re: RegExp; suggestion: string }> = [
  { re: /\b(the\s+autistic\s+(boy|girl|child|pupil|student))\b/i, suggestion: 'use "an autistic pupil" or "a pupil with autism" depending on local preference' },
  { re: /\b(the\s+dyslexic\s+(boy|girl|child|pupil|student))\b/i, suggestion: 'use "a pupil with dyslexia"' },
  { re: /\bsuffers?\s+from\s+(autism|adhd|dyslexia|dyspraxia|asd|asc)\b/i, suggestion: 'replace "suffers from" with "has" or "is"' },
  { re: /\b(retarded|spastic|cripple|crippled|wheelchair-bound)\b/i, suggestion: 'avoid stigmatising language; use UK SEND-preferred terminology' },
];

const HETERONORMATIVE_TOKENS = [
  /\b(his\s+wife|her\s+husband)\b/i,
];

const CLASS_LOADED_TOKENS = [
  /\b(country club|polo club|yacht club|private chef|family\s+driver|the\s+nanny\s+takes)\b/i,
];

interface AuditSection {
  type?: string;
  title?: string;
  content?: string;
  teacherOnly?: boolean;
}

interface AuditWorksheet {
  sections?: AuditSection[];
  metadata?: { subject?: string; topic?: string; [key: string]: unknown };
}

export interface BiasFinding {
  bucket: "name-diversity" | "uk-context" | "stigmatising" | "heteronormative" | "class-loaded";
  message: string;
}

export interface BiasAuditReport {
  findings: BiasFinding[];
  nameStats: {
    angloCount: number;
    nonAngloCount: number;
    totalDistinct: number;
  };
}

const NAME_RE = /\b[A-Z][a-z]{2,}\b/g;

function collectNames(content: string): Set<string> {
  const out = new Set<string>();
  const matches = content.match(NAME_RE) || [];
  for (const m of matches) {
    const lower = m.toLowerCase();
    if (ANGLO_NAMES.has(lower) || NON_ANGLO_NAMES.has(lower)) {
      out.add(lower);
    }
  }
  return out;
}

export function auditBiasSensitivity(ws: AuditWorksheet): BiasAuditReport {
  const findings: BiasFinding[] = [];
  const allNames = new Set<string>();
  const sections = ws.sections || [];

  for (const s of sections) {
    if (s.teacherOnly) continue;
    const content = String(s.content || "");
    if (!content) continue;
    for (const n of collectNames(content)) allNames.add(n);

    // UK context drift.
    const usHits: string[] = [];
    for (const re of US_CONTEXT_TOKENS) {
      const m = content.match(re);
      if (m) usHits.push(m[0]);
    }
    if (usHits.length > 0) {
      findings.push({
        bucket: "uk-context",
        message:
          `[Phase PR-12 — UK context] Section "${s.title || s.type || "?"}" contains non-UK context tokens (${usHits.slice(0, 3).join(", ")}). ` +
          `Worksheets should use UK pounds, metric units, and UK cultural references.`,
      });
    }

    // Stigmatising language.
    for (const { re, suggestion } of STIGMATISING_PHRASES) {
      if (re.test(content)) {
        findings.push({
          bucket: "stigmatising",
          message:
            `[Phase PR-12 — Stigmatising language] Section "${s.title || s.type || "?"}" contains stigmatising phrasing — ${suggestion}.`,
        });
      }
    }

    // Heteronormative framing.
    for (const re of HETERONORMATIVE_TOKENS) {
      if (re.test(content)) {
        findings.push({
          bucket: "heteronormative",
          message:
            `[Phase PR-12 — Inclusive framing] Section "${s.title || s.type || "?"}" uses gendered partner phrasing. Consider neutral alternatives ("their partner", "a friend") unless the context demands it.`,
        });
        break;
      }
    }

    // Class-loaded framing.
    for (const re of CLASS_LOADED_TOKENS) {
      if (re.test(content)) {
        findings.push({
          bucket: "class-loaded",
          message:
            `[Phase PR-12 — Inclusive context] Section "${s.title || s.type || "?"}" uses a high-SES context that may exclude pupils. Consider an everyday alternative.`,
        });
        break;
      }
    }
  }

  // Name diversity audit (worksheet-wide).
  let angloCount = 0;
  let nonAngloCount = 0;
  for (const n of allNames) {
    if (ANGLO_NAMES.has(n)) angloCount += 1;
    else if (NON_ANGLO_NAMES.has(n)) nonAngloCount += 1;
  }
  if (angloCount >= 3 && nonAngloCount === 0) {
    findings.push({
      bucket: "name-diversity",
      message:
        `[Phase PR-12 — Name diversity] Worksheet uses ${angloCount} Anglo first names and zero non-Anglo first names across its examples. ` +
        `Add at least one name from a different tradition (e.g. Aisha, Priya, Diego, Kofi) to reflect a UK classroom.`,
    });
  }

  return {
    findings,
    nameStats: {
      angloCount,
      nonAngloCount,
      totalDistinct: allNames.size,
    },
  };
}

/** Validator entrypoint — matches the registry signature. */
export function enforceBiasSensitivity(
  ws: AuditWorksheet,
): { worksheet: AuditWorksheet; warnings: string[] } {
  const report = auditBiasSensitivity(ws);
  const warnings = report.findings.map((f) => f.message);
  if (warnings.length === 0) {
    return { worksheet: ws, warnings: [] };
  }
  return {
    worksheet: {
      ...ws,
      metadata: {
        ...(ws.metadata || {}),
        biasSensitivityReport: report,
      },
    },
    warnings,
  };
}
