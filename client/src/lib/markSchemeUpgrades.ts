/**
 * markSchemeUpgrades.ts — PR-13 (audit items #5, #6, #7)
 *
 * Pure helpers + a non-blocking validator that upgrade mark-scheme
 * sections in three ways:
 *
 *   1. Synonym / equivalent-answer expansion (#5) — looks for
 *      acceptable-equivalents that the LLM commonly omits and warns
 *      when a numeric answer is missing its decimal-form alternate
 *      (e.g. "1/2" but not "0.5"), or a key science term has its
 *      common synonym missing (e.g. "respiration" without "breathing").
 *   2. Method-marks itemisation (#6) — checks multi-mark calculation
 *      questions for explicit M1 / M2 / A1 mark allocations. UK GCSE
 *      mark schemes use M (method) / A (accuracy) / B (basic) bands;
 *      a single "[3 marks]" total without itemisation makes consistent
 *      marking hard.
 *   3. Numerical answer plausibility / order-of-magnitude rail (#7) —
 *      sanity-checks the magnitude of each numeric answer against
 *      what the question is asking. Catches the common LLM error of
 *      claiming a runner's time is "2 seconds" when the question says
 *      a marathon, or a temperature of "5000 °C" for a domestic oven.
 */

interface MSSection {
  type?: string;
  title?: string;
  content?: string;
  teacherOnly?: boolean;
  marks?: number;
}

interface MSWorksheet {
  sections?: MSSection[];
  metadata?: { subject?: string; topic?: string; [key: string]: unknown };
}

// ─── Synonym map ────────────────────────────────────────────────────────────

const SYNONYM_PAIRS: Array<{ a: RegExp; b: RegExp; pretty: [string, string] }> = [
  { a: /\brespiration\b/i, b: /\bbreathing\b/i, pretty: ["respiration", "breathing"] },
  { a: /\bphotosynthesis\b/i, b: /\bplant food\s*production\b/i, pretty: ["photosynthesis", "plant food production"] },
  { a: /\bevaporation\b/i, b: /\bturning\s+to\s+gas\b/i, pretty: ["evaporation", "turning to gas"] },
  { a: /\bcondensation\b/i, b: /\bcooling\s+to\s+liquid\b/i, pretty: ["condensation", "cooling to liquid"] },
  { a: /\bphysical\s+change\b/i, b: /\breversible\s+change\b/i, pretty: ["physical change", "reversible change"] },
];

const FRACTION_RE = /\b(\d+)\s*\/\s*(\d+)\b/g;

// ─── Helpers ────────────────────────────────────────────────────────────────

function isMarkSchemeSection(s: MSSection): boolean {
  const probe = `${s.type || ""} ${s.title || ""}`.toLowerCase();
  return /(mark.scheme|teacher.key|answers|marking)/.test(probe);
}

function findFractionsMissingDecimal(content: string): Array<{ frac: string; decimal: string }> {
  const out: Array<{ frac: string; decimal: string }> = [];
  let m: RegExpExecArray | null;
  // Reset regex state — global regexes carry state between calls.
  const re = new RegExp(FRACTION_RE.source, "g");
  while ((m = re.exec(content))) {
    const num = parseFloat(m[1]);
    const den = parseFloat(m[2]);
    if (den === 0) continue;
    const decimal = (num / den).toFixed(3).replace(/\.?0+$/, "");
    // Only flag when the decimal form is NOT also present in the section.
    const decimalRe = new RegExp(`\\b${decimal.replace(/\./g, "\\.")}\\b`);
    if (!decimalRe.test(content)) {
      out.push({ frac: `${m[1]}/${m[2]}`, decimal });
    }
  }
  return out;
}

function findMissingSynonyms(content: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const { a, b, pretty } of SYNONYM_PAIRS) {
    const hasA = a.test(content);
    const hasB = b.test(content);
    if (hasA && !hasB) out.push([pretty[0], pretty[1]]);
  }
  return out;
}

const M_TAG_RE = /\b(M[1-4]|A[1-4]|B[1-4])\b/;

function isMethodItemised(content: string, totalMarks: number): boolean {
  // Question is multi-mark and the mark-scheme section ought to itemise.
  if (totalMarks < 2) return true; // 1-mark questions don't need itemisation.
  return M_TAG_RE.test(content);
}

const NUMERIC_RE = /\b(\d+(?:\.\d+)?)\s*(°C|°F|kg|g|m|cm|mm|km|ml|L|s|min|hr|hours?|seconds?|metres?|kilometres?)\b/gi;

interface PlausibilityFinding {
  value: number;
  unit: string;
  reason: string;
}

const PLAUSIBILITY_RANGES: Array<{ keyword: RegExp; unit: RegExp; min: number; max: number; description: string }> = [
  { keyword: /marathon/i, unit: /^(s|sec|seconds?|min|minutes?)$/i, min: 6000, max: 30000, description: "marathon time should be in the 100-500 minute range" },
  { keyword: /domestic\s+oven|kitchen\s+oven/i, unit: /^°C$/i, min: 50, max: 280, description: "domestic oven temperatures top out around 280 °C" },
  { keyword: /human\s+(body|core)\s+temperature/i, unit: /^°C$/i, min: 35, max: 42, description: "human core body temperature falls in 35-42 °C" },
  { keyword: /room\s+temperature/i, unit: /^°C$/i, min: 15, max: 28, description: "room temperature falls in 15-28 °C" },
];

function findImplausibleMagnitudes(qContent: string, msContent: string): PlausibilityFinding[] {
  const out: PlausibilityFinding[] = [];
  for (const range of PLAUSIBILITY_RANGES) {
    if (!range.keyword.test(qContent)) continue;
    const re = new RegExp(NUMERIC_RE.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(msContent))) {
      const val = parseFloat(m[1]);
      const unit = m[2];
      if (!range.unit.test(unit)) continue;
      if (val < range.min || val > range.max) {
        out.push({ value: val, unit, reason: range.description });
      }
    }
  }
  return out;
}

export function enforceMarkSchemeUpgrades(
  ws: MSWorksheet,
): { worksheet: MSWorksheet; warnings: string[] } {
  const warnings: string[] = [];
  const sections = ws.sections || [];

  // Find pupil-facing question content for plausibility.
  const questionContent = sections
    .filter((s) => !s.teacherOnly && /q-|question|application/i.test(s.type || ""))
    .map((s) => s.content || "")
    .join("\n");

  for (const s of sections) {
    if (!s.teacherOnly && !isMarkSchemeSection(s)) continue;
    const content = String(s.content || "");
    if (!content) continue;

    // Synonym audit.
    const missing = findMissingSynonyms(content);
    for (const [a, b] of missing) {
      warnings.push(
        `[Phase PR-13 — Mark-scheme synonyms] "${s.title || "Mark scheme"}" accepts "${a}" but not "${b}". Add the equivalent so pupils aren't penalised for an everyday wording.`,
      );
    }

    // Decimal/fraction parity.
    for (const f of findFractionsMissingDecimal(content)) {
      warnings.push(
        `[Phase PR-13 — Mark-scheme synonyms] "${s.title || "Mark scheme"}" accepts ${f.frac} but not the decimal ${f.decimal}. Accept both forms.`,
      );
    }

    // Method-mark itemisation.
    if (s.marks && s.marks >= 2 && !isMethodItemised(content, s.marks)) {
      warnings.push(
        `[Phase PR-13 — Method marks] "${s.title || "Mark scheme"}" is worth ${s.marks} marks but has no M/A/B itemisation. UK mark schemes use M1/M2/A1 to allocate method vs accuracy marks.`,
      );
    }

    // Plausibility.
    if (questionContent) {
      const findings = findImplausibleMagnitudes(questionContent, content);
      for (const f of findings) {
        warnings.push(
          `[Phase PR-13 — Plausibility] "${s.title || "Mark scheme"}" reports ${f.value} ${f.unit} which is outside the plausible range — ${f.reason}.`,
        );
      }
    }
  }

  if (warnings.length === 0) return { worksheet: ws, warnings: [] };

  return {
    worksheet: {
      ...ws,
      metadata: {
        ...(ws.metadata || {}),
        markSchemeUpgrades: {
          warningCount: warnings.length,
        },
      },
    },
    warnings,
  };
}
