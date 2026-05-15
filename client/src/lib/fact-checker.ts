/**
 * fact-checker.ts — citation-backed verification (Phase 4 / FEAT-008)
 *
 * Runs a separate, non-blocking AI pass over the generated worksheet that
 * tags factual claims, dates, equations, and quotes against a curated
 * whitelist of UK educational sources (BBC Bitesize, Oak National, AQA,
 * OCR, Edexcel, WJEC/Eduqas spec sheets, gov.uk subject content). The
 * pass returns:
 *
 *   - citations: per-claim mapping → which whitelisted source supports it
 *   - unverified: any claims the AI could not confidently attribute
 *
 * IMPORTANT: this does NOT do live web search (cost is £0). It only asks
 * the LLM whether each claim is consistent with the named UK sources from
 * its training data, and to point to the single most likely source. The
 * footnote that ships in the worksheet says "based on UK National
 * Curriculum and exam-board specifications" rather than a live URL — the
 * point is to give teachers a reproducible audit trail, not a live link.
 *
 * Cost profile:
 *   - 1 extra AI call per generation (Groq/Gemini free tier)
 *   - max ~500 tokens out
 *   - safe to skip on failure (best-effort enrichment)
 */

import { callAI, parseWithFixes, repairTruncatedJson } from "./ai";

// ── Whitelist ──────────────────────────────────────────────────────────────
// The set of authoritative UK sources the model is told to attribute to.
// Order matters: more specific (exam boards) before generic (BBC Bitesize).
export const UK_SOURCE_WHITELIST: ReadonlyArray<{ id: string; name: string; description: string }> = [
  { id: "aqa", name: "AQA", description: "AQA exam-board subject specifications and assessment objectives." },
  { id: "ocr", name: "OCR", description: "OCR exam-board subject specifications and assessment objectives." },
  { id: "edexcel", name: "Pearson Edexcel", description: "Pearson Edexcel exam-board specifications and assessment objectives." },
  { id: "wjec", name: "WJEC / Eduqas", description: "WJEC and Eduqas exam-board specifications." },
  { id: "ccea", name: "CCEA", description: "CCEA exam-board specifications (Northern Ireland)." },
  { id: "sqa", name: "SQA", description: "Scottish Qualifications Authority specifications (Scotland)." },
  { id: "national-curriculum", name: "UK National Curriculum (DfE)", description: "Department for Education programmes of study (gov.uk)." },
  { id: "oak", name: "Oak National Academy", description: "Oak National Academy curriculum-aligned materials (oaknationalacademy.org)." },
  { id: "bbc-bitesize", name: "BBC Bitesize", description: "BBC Bitesize KS1–KS5 study materials (bbc.co.uk/bitesize)." },
  { id: "stem-learning", name: "STEM Learning", description: "STEM Learning UK — curriculum-aligned STEM resources." },
  { id: "ncetm", name: "NCETM", description: "National Centre for Excellence in the Teaching of Mathematics (ncetm.org.uk)." },
];

const WHITELIST_BLOCK = UK_SOURCE_WHITELIST.map((s) => `- ${s.name} (${s.id}): ${s.description}`).join("\n");

// ── Result shape ──────────────────────────────────────────────────────────
export interface FactCheckCitation {
  /** Stable section index in the worksheet's sections array. */
  sectionIndex: number;
  /** Short verbatim claim from the worksheet (≤ 140 chars). */
  claim: string;
  /** Whitelist source id (must match UK_SOURCE_WHITELIST[i].id). */
  sourceId: string;
  /** Optional sub-reference (e.g. "AQA GCSE Combined Science 4.4.1"). */
  detail?: string;
}

export interface FactCheckUnverified {
  sectionIndex: number;
  claim: string;
  reason: string;
}

export interface FactCheckResult {
  /** ISO timestamp of when the check ran. */
  checkedAt: string;
  /** Provider used (echoed from callAI for telemetry). */
  provider?: string;
  /** Verified claims with citations. */
  citations: FactCheckCitation[];
  /** Claims the model could not attribute to a whitelisted source. */
  unverified: FactCheckUnverified[];
  /** Pass-level status. */
  status: "ok" | "warnings" | "error";
  /** Top-line message for UI. */
  summary: string;
}

// ── Helper: shrink a worksheet's sections to a compact prompt ──────────────
function summariseSections(sections: Array<{ title?: string; content?: string; type?: string; teacherOnly?: boolean }>): string {
  const lines: string[] = [];
  sections.forEach((s, i) => {
    if (s.teacherOnly) return; // skip teacher-only sections
    const t = (s.title || "").slice(0, 60);
    const c = (s.content || "").replace(/\s+/g, " ").trim().slice(0, 320);
    if (!c) return;
    lines.push(`[${i}] ${t}: ${c}`);
  });
  return lines.join("\n");
}

// ── Public API ─────────────────────────────────────────────────────────────
/**
 * Run a non-blocking citation pass over the generated worksheet. Returns a
 * FactCheckResult; never throws (errors are mapped to status: "error" with
 * empty citation arrays).
 */
export async function runFactCheck(opts: {
  worksheet: {
    title?: string;
    metadata?: { subject?: string; topic?: string; yearGroup?: string; examBoard?: string };
    sections?: Array<{ title?: string; content?: string; type?: string; teacherOnly?: boolean }>;
  };
  signal?: AbortSignal;
}): Promise<FactCheckResult> {
  const checkedAt = new Date().toISOString();
  try {
    const sections = opts.worksheet.sections || [];
    const sectionBlock = summariseSections(sections);
    if (!sectionBlock.trim()) {
      return { checkedAt, citations: [], unverified: [], status: "ok", summary: "No factual content to check." };
    }

    const meta = opts.worksheet.metadata || {};
    const system = [
      "You are an exam-board QA reviewer for UK schools. You verify factual claims, dates, formulae, definitions, and quotations in school worksheets against a fixed whitelist of authoritative UK sources.",
      "RULES:",
      "1. ONLY use sources from the whitelist below. Never invent sources or URLs.",
      "2. For every factual claim that COULD plausibly be checked (a date, formula, definition, scientific fact, named quote), produce ONE entry — either a citation or an unverified flag.",
      "3. NEVER cite procedural rubric (e.g. 'write your name', 'circle one'). Only attribute substantive subject content.",
      "4. If a claim is correct but you cannot point to a specific whitelist source from your training data, mark it unverified with reason: 'no specific source attribution'.",
      "5. Output strict JSON only, no markdown, no commentary.",
      "",
      "WHITELIST (use the 'id' field as sourceId in your output):",
      WHITELIST_BLOCK,
    ].join("\n");

    const user = [
      `Worksheet: ${opts.worksheet.title || "(untitled)"}`,
      `Subject: ${meta.subject || "(unspecified)"} | Year: ${meta.yearGroup || "(unspecified)"} | Topic: ${meta.topic || "(unspecified)"}${meta.examBoard ? ` | Exam Board: ${meta.examBoard}` : ""}`,
      "",
      "Sections (sectionIndex in brackets — student-visible only):",
      sectionBlock,
      "",
      "Output JSON in this EXACT shape:",
      `{
  "citations": [
    { "sectionIndex": 2, "claim": "Exact short claim text", "sourceId": "national-curriculum", "detail": "KS3 Programme of Study — Mathematics — Number" }
  ],
  "unverified": [
    { "sectionIndex": 5, "claim": "Exact claim", "reason": "no specific source attribution" }
  ]
}`,
      "",
      "Return ONLY the JSON. Maximum 12 citations and 6 unverified entries combined. Skip claims you are unsure about rather than guessing.",
    ].join("\n");

    const { text, provider } = await callAI(system, user, 1200);

    let parsed: any = null;
    const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    try {
      parsed = parseWithFixes(cleaned);
    } catch {
      const repaired = repairTruncatedJson(cleaned);
      if (repaired) {
        try { parsed = parseWithFixes(repaired); } catch { /* fall through */ }
      }
    }

    if (!parsed || typeof parsed !== "object") {
      return { checkedAt, provider, citations: [], unverified: [], status: "error", summary: "Citation pass returned no parseable JSON." };
    }

    const allowedIds = new Set(UK_SOURCE_WHITELIST.map((s) => s.id));
    const sectionCount = sections.length;

    const citations: FactCheckCitation[] = Array.isArray(parsed.citations)
      ? parsed.citations
        .map((c: any) => ({
          sectionIndex: typeof c.sectionIndex === "number" ? c.sectionIndex : -1,
          claim: typeof c.claim === "string" ? c.claim.trim().slice(0, 240) : "",
          sourceId: typeof c.sourceId === "string" ? c.sourceId.trim().toLowerCase() : "",
          detail: typeof c.detail === "string" ? c.detail.trim().slice(0, 200) : undefined,
        }))
        .filter((c: FactCheckCitation) => c.claim && c.sectionIndex >= 0 && c.sectionIndex < sectionCount && allowedIds.has(c.sourceId))
        .slice(0, 12)
      : [];

    const unverified: FactCheckUnverified[] = Array.isArray(parsed.unverified)
      ? parsed.unverified
        .map((u: any) => ({
          sectionIndex: typeof u.sectionIndex === "number" ? u.sectionIndex : -1,
          claim: typeof u.claim === "string" ? u.claim.trim().slice(0, 240) : "",
          reason: typeof u.reason === "string" ? u.reason.trim().slice(0, 200) : "no specific source attribution",
        }))
        .filter((u: FactCheckUnverified) => u.claim && u.sectionIndex >= 0 && u.sectionIndex < sectionCount)
        .slice(0, 6)
      : [];

    const status: FactCheckResult["status"] = unverified.length > 0 ? "warnings" : "ok";
    const summary = unverified.length > 0
      ? `${citations.length} claim${citations.length === 1 ? "" : "s"} cited, ${unverified.length} flagged for teacher review.`
      : `${citations.length} claim${citations.length === 1 ? "" : "s"} cited against UK National Curriculum & exam-board specifications.`;

    return { checkedAt, provider, citations, unverified, status, summary };
  } catch (err: any) {
    return {
      checkedAt,
      citations: [],
      unverified: [],
      status: "error",
      summary: `Citation pass skipped: ${err?.message || "unknown error"}.`,
    };
  }
}

// ── Renderer helper: source name lookup ────────────────────────────────────
export function getSourceNameById(id: string): string {
  const found = UK_SOURCE_WHITELIST.find((s) => s.id === id);
  return found ? found.name : id;
}
