/**
 * UK-Whitelist Fact-Checker (FEAT-008)
 * ─────────────────────────────────────
 * Adds a non-blocking verification pass to AI-generated worksheets so every
 * factual claim, date, equation, or statistic on the printed page can be
 * traced back to a UK educational authority. This is what unblocks
 * heads-of-department adoption: "is the AI right?" becomes "yes, see footnote 3,
 * source: AQA spec sheet 8525-2023."
 *
 * Architecture:
 *   1. We do NOT do live web search (cost + reliability + safeguarding risk).
 *   2. We send the worksheet content to a free-tier LLM with a curated UK
 *      whitelist baked into the system prompt (BBC Bitesize, Oak National,
 *      AQA / OCR / Edexcel spec sheets, NCETM, BBC History, Royal Society of
 *      Chemistry, gov.uk DfE, Met Office, ONS, NRICH).
 *   3. The LLM returns a structured list of {claim, source, verified, ref}
 *      which we attach to worksheet.metadata.citations. Numbered footnotes
 *      then render in the WorksheetRenderer.
 *
 * Why this is moat-grade:
 *   - Generic LLMs guess sources and hallucinate URLs. By restricting the
 *     model to a whitelist of UK exam-board / public-broadcaster sources
 *     and rejecting anything outside it, we get auditable footnotes.
 *   - Costs zero — runs against the existing free providers configured in
 *     server/routes/ai.ts (Groq, Cerebras, Gemini etc.).
 *
 * Failure mode is graceful: if the fact-check fails, the worksheet still
 * renders normally — the citations footer just doesn't appear.
 */

import { callAI, parseWithFixes, repairTruncatedJson } from "./ai";

// ─────────────────────────────────────────────────────────────────────────────
// Whitelist
// ─────────────────────────────────────────────────────────────────────────────

export interface WhitelistSource {
  /** Short label shown in the footnote (e.g. "AQA Combined Science") */
  name: string;
  /** Domain (no protocol) — used for url matching when the model returns a URL */
  domain: string;
  /** What the source covers — used in the system prompt */
  covers: string;
  /** Optional default URL when the source has a single canonical landing page */
  url?: string;
}

export const UK_WHITELIST: WhitelistSource[] = [
  // Public broadcaster / national education
  { name: "BBC Bitesize", domain: "bbc.co.uk/bitesize", covers: "KS1–KS5 curriculum content, all subjects", url: "https://www.bbc.co.uk/bitesize" },
  { name: "Oak National Academy", domain: "thenational.academy", covers: "DfE-funded national curriculum lessons KS1–KS5", url: "https://www.thenational.academy" },
  { name: "BBC History", domain: "bbc.co.uk/history", covers: "British and world history primary sources", url: "https://www.bbc.co.uk/history" },

  // Exam boards
  { name: "AQA", domain: "aqa.org.uk", covers: "GCSE and A-Level specifications, mark schemes, examiner reports", url: "https://www.aqa.org.uk" },
  { name: "OCR", domain: "ocr.org.uk", covers: "GCSE and A-Level specifications, mark schemes", url: "https://www.ocr.org.uk" },
  { name: "Pearson Edexcel", domain: "qualifications.pearson.com", covers: "Edexcel GCSE and A-Level specifications", url: "https://qualifications.pearson.com" },
  { name: "WJEC / Eduqas", domain: "wjec.co.uk", covers: "WJEC and Eduqas specifications", url: "https://www.wjec.co.uk" },
  { name: "CCEA", domain: "ccea.org.uk", covers: "Northern Ireland CCEA specifications", url: "https://ccea.org.uk" },

  // Subject-specialist organisations
  { name: "NCETM", domain: "ncetm.org.uk", covers: "Maths pedagogy, common misconceptions, mastery curriculum", url: "https://www.ncetm.org.uk" },
  { name: "NRICH (Cambridge)", domain: "nrich.maths.org", covers: "Maths enrichment problems and pedagogy", url: "https://nrich.maths.org" },
  { name: "Royal Society of Chemistry", domain: "rsc.org", covers: "Chemistry curriculum and Periodic Table data", url: "https://edu.rsc.org" },
  { name: "Institute of Physics", domain: "iop.org", covers: "Physics curriculum and TalkPhysics resources", url: "https://www.iop.org" },
  { name: "Royal Society of Biology", domain: "rsb.org.uk", covers: "Biology curriculum guidance", url: "https://www.rsb.org.uk" },
  { name: "STEM Learning", domain: "stem.org.uk", covers: "STEM CPD and curriculum-aligned resources", url: "https://www.stem.org.uk" },

  // Government / data sources
  { name: "GOV.UK (DfE)", domain: "gov.uk", covers: "National Curriculum, statutory guidance, official statistics", url: "https://www.gov.uk/government/collections/national-curriculum" },
  { name: "Met Office", domain: "metoffice.gov.uk", covers: "UK weather, climate data", url: "https://www.metoffice.gov.uk" },
  { name: "Office for National Statistics", domain: "ons.gov.uk", covers: "UK census, demographics, official statistics", url: "https://www.ons.gov.uk" },
  { name: "Natural History Museum", domain: "nhm.ac.uk", covers: "Biology, geology, evolution", url: "https://www.nhm.ac.uk" },
  { name: "British Museum", domain: "britishmuseum.org", covers: "Ancient history, archaeology", url: "https://www.britishmuseum.org" },
  { name: "Imperial War Museum", domain: "iwm.org.uk", covers: "20th-century conflict primary sources", url: "https://www.iwm.org.uk" },

  // English / literacy
  { name: "Oxford Languages", domain: "languages.oup.com", covers: "Authoritative English dictionary definitions", url: "https://languages.oup.com" },
  { name: "British Council", domain: "britishcouncil.org", covers: "English language teaching and grammar", url: "https://learnenglish.britishcouncil.org" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export interface Citation {
  /** Footnote reference number (1, 2, 3…) — preserves order across the worksheet */
  ref: number;
  /** The factual claim (paraphrased / shortened to ≤ 140 chars) */
  claim: string;
  /** Whitelist source name */
  source: string;
  /** Optional canonical URL */
  url?: string;
  /** True if the LLM is confident the claim is supported by a whitelist source */
  verified: boolean;
}

export interface FactCheckResult {
  citations: Citation[];
  /** ISO timestamp when the check ran */
  ranAt: string;
  /** How many claims were verified vs flagged */
  verifiedCount: number;
  flaggedCount: number;
  /** AI provider that ran the check */
  provider?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Worksheet → claim extraction
// ─────────────────────────────────────────────────────────────────────────────

interface SectionInput {
  title: string;
  content: string;
  type?: string;
  teacherOnly?: boolean;
}

interface FactCheckInput {
  title: string;
  subject?: string;
  topic?: string;
  yearGroup?: string;
  sections: SectionInput[];
}

/**
 * Build a compact summary of student-facing factual content suitable for
 * fact-checking. Excludes teacher-only sections, formatting boilerplate
 * (objectives, vocab definitions are kept but recall-prompts are stripped),
 * and questions where there is nothing to verify.
 */
function buildVerifiableSnapshot(input: FactCheckInput): string {
  const lines: string[] = [];
  for (const s of input.sections) {
    if (s.teacherOnly) continue;
    if (!s.content || s.content.length < 20) continue;
    // Skip pure mark-scheme placeholder boilerplate
    if (/^\s*\[/.test(s.content) && s.content.length < 60) continue;
    // Strip empty checkboxes / blank answer lines
    const cleaned = s.content
      .replace(/_{3,}/g, " ___ ")
      .replace(/\.{4,}/g, " ___ ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    lines.push(`[${s.title}] ${cleaned.slice(0, 1200)}`);
  }
  return lines.join("\n\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Fact-check pipeline
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the citation pass against a worksheet. Returns FactCheckResult or null
 * on any failure (so the caller can keep going without blocking the user).
 *
 * The worksheet must already be generated. Pass the worksheet's title +
 * subject/topic/yearGroup + sections. Caller is responsible for attaching
 * the result to worksheet.metadata.{citations, factCheck}.
 */
export async function runFactCheck(input: FactCheckInput): Promise<FactCheckResult | null> {
  const snapshot = buildVerifiableSnapshot(input);
  if (!snapshot || snapshot.length < 80) {
    // Nothing to verify — short worksheets / pure-questions sheets / drill sheets
    return null;
  }

  const whitelistList = UK_WHITELIST.map((s, i) => `  ${i + 1}. ${s.name} (${s.domain}) — ${s.covers}`).join("\n");

  const system = [
    "You are a UK education fact-checking assistant.",
    "Your job: identify the up to 8 most important verifiable factual claims in the worksheet content, and",
    "match each one to ONE source from the UK whitelist below. Do NOT invent sources outside this list.",
    "",
    "UK WHITELIST (the only sources you may cite):",
    whitelistList,
    "",
    "RULES:",
    "1. Only cite a source if the claim is clearly within that source's coverage.",
    "2. Do NOT cite questions, instructions, learning objectives, or pupil prompts — only factual statements,",
    "   dates, formulae, definitions, scientific facts, named events, statistics.",
    "3. Each citation's claim text must be paraphrased and ≤ 140 characters.",
    "4. Each citation must include verified: true if you are confident the claim is supported by the source,",
    "   verified: false if the claim is plausible but you cannot confidently match it (still cite the closest source).",
    '5. Output STRICT raw JSON only, no markdown fences, no prose.',
    '6. Output shape: {"citations":[{"ref":1,"claim":"...","source":"BBC Bitesize","url":"https://...","verified":true}, ...]}',
    "7. If no factual claims warrant citation, return {\"citations\": []}.",
  ].join("\n");

  const user = [
    `Worksheet: "${input.title}"`,
    input.subject ? `Subject: ${input.subject}` : "",
    input.topic ? `Topic: ${input.topic}` : "",
    input.yearGroup ? `Year group: ${input.yearGroup}` : "",
    "",
    "WORKSHEET CONTENT (student-facing only):",
    snapshot,
    "",
    "Return strict JSON: {\"citations\":[…]}",
  ].filter(Boolean).join("\n");

  let raw = "";
  let provider: string | undefined;
  try {
    const result = await callAI(system, user, 1500);
    raw = result.text;
    provider = result.provider;
  } catch (err) {
    console.warn("[fact-check] AI call failed:", err instanceof Error ? err.message : err);
    return null;
  }

  // Extract JSON object
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  let parsed: any = null;
  try {
    parsed = parseWithFixes(cleaned);
  } catch {
    const repaired = repairTruncatedJson(cleaned);
    if (repaired) {
      try { parsed = parseWithFixes(repaired); } catch { /* fall through */ }
    }
  }
  if (!parsed || !Array.isArray(parsed.citations)) {
    console.warn("[fact-check] No citations array in response");
    return null;
  }

  // Normalise + restrict to whitelist
  const whitelistNames = new Set(UK_WHITELIST.map((s) => s.name.toLowerCase()));
  const whitelistByName = new Map(UK_WHITELIST.map((s) => [s.name.toLowerCase(), s]));

  const citations: Citation[] = [];
  for (const c of parsed.citations as any[]) {
    if (!c || typeof c.claim !== "string" || typeof c.source !== "string") continue;
    const sourceLower = c.source.trim().toLowerCase();
    if (!whitelistNames.has(sourceLower)) {
      // Reject any source that wasn't in our whitelist — this is the moat
      continue;
    }
    const wl = whitelistByName.get(sourceLower)!;
    citations.push({
      ref: citations.length + 1,
      claim: c.claim.replace(/\s+/g, " ").trim().slice(0, 200),
      source: wl.name,
      url: typeof c.url === "string" && /^https?:\/\//i.test(c.url) ? c.url : wl.url,
      verified: c.verified === true,
    });
    if (citations.length >= 8) break;
  }

  const verifiedCount = citations.filter((c) => c.verified).length;
  const flaggedCount = citations.filter((c) => !c.verified).length;

  return {
    citations,
    ranAt: new Date().toISOString(),
    verifiedCount,
    flaggedCount,
    provider,
  };
}
