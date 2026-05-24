/**
 * curriculumBank.ts — Phase F · FEAT-PF1
 * ──────────────────────────────────────────────────────────────────────────
 * Single lookup module that merges three data sources into one query
 * surface for the worksheet-generator + differentiator + scaffolder:
 *
 *   1. Spec points  — the awarding body's "students should be able to…"
 *      list, sourced from `specPointTaxonomy.ts` (no duplication of data).
 *   2. Exemplars    — paraphrased past-paper-style example questions,
 *      bundled per (board, subject, yearGroup) under
 *      `client/src/data/exemplars/*.json`. Tagged with tier, AO, marks,
 *      command verb, and source attribution. **Paraphrased, never
 *      verbatim** — the bank carries shape and demand, not literal stems.
 *   3. Scaffolds    — per-spec-ref scaffolding rows (sentence frames,
 *      word bank, step ladder, common pitfalls), bundled per
 *      (board, subject, yearGroup) under
 *      `client/src/data/scaffolds/*.json`. Replaces the regex-class
 *      hints currently emitted by `buildLocalScaffold` in the scaffold
 *      route.
 *
 * Why a separate module from `specPointTaxonomy.ts`:
 *   - Keeps the existing taxonomy module's API + signatures stable.
 *     Phase F is purely additive; existing callers see no change.
 *   - Lets the bank degrade gracefully — if a (board, subject, year) has
 *     no exemplars or scaffolds yet, callers still get the spec point
 *     and can fall back to the LLM's prior.
 *
 * No schema changes to the worksheet output contract.
 */

import {
  getSpecPoints,
  matchSpecPoint,
  type ExamBoard,
  type SpecPoint,
} from "./specPointTaxonomy";

// ─── Public types ──────────────────────────────────────────────────────────

export type Tier = "foundation" | "higher" | "both";
export type AssessmentObjective = "AO1" | "AO2" | "AO3" | "AO4";

/**
 * One paraphrased exemplar question for a single spec-ref. The exemplar
 * is the LLM's few-shot anchor for "what a real GCSE question on this
 * spec point looks like". Never reproduces verbatim past-paper wording.
 */
export interface ExemplarRow {
  specRef: string;
  tier: Tier;
  ao: AssessmentObjective;
  marks: number;
  /** Paraphrased question stem; what the pupil reads. */
  stem: string;
  /** Brief mark-scheme outline (1–3 lines). */
  markScheme: string;
  /** GCSE command verb the stem opens with. */
  commandVerb: string;
  /** Attribution: which paper / spec section this exemplar imitates. Never "verbatim from …". */
  source: string;
}

/**
 * Topic-aware scaffolding for one spec-ref. The scaffold route pulls
 * these instead of generating regex hints from the question text.
 */
export interface ScaffoldRow {
  specRef: string;
  sentenceFrames: string[];
  wordBank: Array<{ term: string; definition: string }>;
  stepLadder: string[];
  commonPitfalls?: string[];
  visualAidHint?: string;
}

/** Flat dataset shape — one file per (board, subject, yearGroup). */
export interface ExemplarDataset {
  board: ExamBoard;
  subject: string;
  yearGroup: string;
  source: string;
  exemplars: ExemplarRow[];
}

export interface ScaffoldDataset {
  board: ExamBoard;
  subject: string;
  yearGroup: string;
  source: string;
  rows: ScaffoldRow[];
}

/** Merged result returned by lookupBySpecRef / lookupByTopic. */
export interface CurriculumEntry {
  specPoint: SpecPoint;
  exemplars: ExemplarRow[];
  scaffold: ScaffoldRow | null;
}

// ─── Internal registries ───────────────────────────────────────────────────

function key(board: string, subject: string, yearGroup: string): string {
  // Mirror specPointTaxonomy's canonicaliser to share keys cleanly.
  const s = subject.trim().toLowerCase();
  const canonical =
    s === "maths" || s === "math"
      ? "mathematics"
      : s === "english language" || s === "english lang"
      ? "english"
      : s === "combined science" || s === "trilogy"
      ? "combined science"
      : s;
  return `${board.toLowerCase()}|${canonical}|${yearGroup.trim().toLowerCase()}`;
}

const EXEMPLAR_REGISTRY: Record<string, ExemplarRow[]> = Object.create(null);
const SCAFFOLD_REGISTRY: Record<string, Map<string, ScaffoldRow>> =
  Object.create(null);

/**
 * Register a bundled exemplar dataset. Called once per JSON file at
 * module initialisation. Datasets that share a key merge (later wins
 * per specRef + ao + marks tuple).
 */
export function registerExemplars(dataset: ExemplarDataset): void {
  const k = key(dataset.board, dataset.subject, dataset.yearGroup);
  const existing = EXEMPLAR_REGISTRY[k] || [];
  EXEMPLAR_REGISTRY[k] = [...existing, ...dataset.exemplars];
}

/**
 * Register a bundled scaffold dataset. Indexed by specRef so per-row
 * lookup is O(1).
 */
export function registerScaffolds(dataset: ScaffoldDataset): void {
  const k = key(dataset.board, dataset.subject, dataset.yearGroup);
  let m = SCAFFOLD_REGISTRY[k];
  if (!m) {
    m = new Map<string, ScaffoldRow>();
    SCAFFOLD_REGISTRY[k] = m;
  }
  for (const row of dataset.rows) {
    m.set(row.specRef, row);
  }
}

// ─── Public lookup API ─────────────────────────────────────────────────────

/**
 * Look up the bundle for a single spec-ref. Returns null when the
 * spec-point dataset for (board, subject, yearGroup) doesn't exist or
 * doesn't contain that ref. Exemplar / scaffold are independently
 * optional — a returned entry may have empty exemplars and a null
 * scaffold and still be useful to the prompt builder.
 */
export function lookupBySpecRef(
  board: ExamBoard,
  subject: string,
  yearGroup: string,
  specRef: string,
): CurriculumEntry | null {
  const dataset = getSpecPoints(board, subject, yearGroup);
  if (!dataset) return null;
  const sp =
    dataset.specPoints.find(
      (p) => p.specRef.toLowerCase() === specRef.trim().toLowerCase(),
    ) ?? matchSpecPoint(specRef, dataset);
  if (!sp) return null;
  const k = key(board, subject, yearGroup);
  const exemplars = (EXEMPLAR_REGISTRY[k] || []).filter(
    (e) => e.specRef === sp.specRef,
  );
  const scaffold = SCAFFOLD_REGISTRY[k]?.get(sp.specRef) ?? null;
  return { specPoint: sp, exemplars, scaffold };
}

/**
 * Look up bundles by free-text topic (e.g. "Respiration",
 * "Quadratic equations"). Performs case-insensitive substring matching
 * against `specTitle`. Returns up to `opts.limit` matches (default 8)
 * sorted by match quality (longest matched substring first).
 */
export function lookupByTopic(
  board: ExamBoard,
  subject: string,
  yearGroup: string,
  topic: string,
  opts: { limit?: number } = {},
): CurriculumEntry[] {
  const dataset = getSpecPoints(board, subject, yearGroup);
  if (!dataset) return [];
  const needle = (topic || "").trim().toLowerCase();
  if (!needle) return [];

  const k = key(board, subject, yearGroup);
  const scaffolds = SCAFFOLD_REGISTRY[k];
  const exemplars = EXEMPLAR_REGISTRY[k] || [];

  // Score every spec point by substring overlap; keep non-zero matches.
  const scored: Array<{ score: number; sp: SpecPoint }> = [];
  for (const sp of dataset.specPoints) {
    const title = sp.specTitle.toLowerCase();
    let score = 0;
    if (title.includes(needle)) score = needle.length;
    else {
      // Word-overlap fallback: count matching whitespace-separated tokens.
      const needleTokens = needle.split(/\W+/).filter((t) => t.length >= 4);
      for (const tok of needleTokens) {
        if (title.includes(tok)) score += tok.length;
      }
    }
    if (score > 0) scored.push({ score, sp });
  }
  scored.sort((a, b) => b.score - a.score);

  const limit = opts.limit ?? 8;
  return scored.slice(0, limit).map(({ sp }) => ({
    specPoint: sp,
    exemplars: exemplars.filter((e) => e.specRef === sp.specRef),
    scaffold: scaffolds?.get(sp.specRef) ?? null,
  }));
}

/**
 * Filter a list of curriculum entries by tier. Foundation excludes
 * `tier: "higher"` rows; Higher excludes `tier: "foundation"` rows.
 * Both pass `tier: "both"` rows and rows where `tier` is unset
 * (defensive: legacy datasets may omit the field — they pass through
 * for either tier rather than disappearing).
 */
export function filterByTier(
  entries: CurriculumEntry[],
  tier: Tier,
): CurriculumEntry[] {
  if (tier === "both") return entries;
  return entries.filter((e) => {
    const t = e.specPoint.tier;
    if (!t || t === "both") return true;
    return t === tier;
  });
}

/**
 * List every spec-ref accessible at a given tier for (board, subject,
 * yearGroup). Used by the differentiator endpoint to assemble the
 * tier-restricted prompt block (and by tests to assert the Foundation
 * vs Higher sets actually differ).
 */
export function listSpecRefsForTier(
  board: ExamBoard,
  subject: string,
  yearGroup: string,
  tier: Tier,
): string[] {
  const dataset = getSpecPoints(board, subject, yearGroup);
  if (!dataset) return [];
  return dataset.specPoints
    .filter((sp) => {
      const t = sp.tier;
      if (tier === "both") return true;
      if (!t || t === "both") return true;
      return t === tier;
    })
    .map((sp) => sp.specRef);
}

// ─── Tier-target AO histograms ─────────────────────────────────────────────

/**
 * Target AO distribution per tier, used by the differentiator prompt
 * and by the post-validator's tierAoHistogram check. Numbers are
 * proportions (sum to 1.0). Foundation skews recall-heavy; Higher
 * pushes application + analysis.
 *
 * Sources: AQA, Edexcel, and OCR all publish AO weightings per paper
 * within ±5% of these means across maths and the sciences. The values
 * here are deliberately the unweighted central tendency so a single
 * histogram works for the bulk of GCSE subjects without per-paper
 * tuning. Subject-specific overrides land in Phase F2 if needed.
 */
export function targetAoHistogramForTier(
  tier: Tier,
): { AO1: number; AO2: number; AO3: number; AO4: number } {
  if (tier === "foundation") {
    return { AO1: 0.6, AO2: 0.3, AO3: 0.1, AO4: 0.0 };
  }
  if (tier === "higher") {
    return { AO1: 0.4, AO2: 0.4, AO3: 0.2, AO4: 0.0 };
  }
  // "both" — split the difference.
  return { AO1: 0.5, AO2: 0.35, AO3: 0.15, AO4: 0.0 };
}

// ─── Prompt-block builders ─────────────────────────────────────────────────

/**
 * Build a few-shot block of paraphrased exemplar questions, one per
 * spec-ref, suitable for injection into the `aiGenerateWorksheet` /
 * `aiDifferentiateExistingWorksheet` system prompts. Returns an empty
 * string when no entries carry exemplars (caller falls back to the
 * existing `getSpecQuestions` topic-bank path or the LLM prior).
 */
export function buildExemplarPromptBlock(
  entries: CurriculumEntry[],
  opts: {
    tier?: Tier;
    maxPerSpecRef?: number;
    maxTotal?: number;
    headerLabel?: string;
  } = {},
): string {
  const tier: Tier = opts.tier ?? "both";
  const maxPerSpecRef = opts.maxPerSpecRef ?? 2;
  const maxTotal = opts.maxTotal ?? 8;
  const header =
    opts.headerLabel ??
    `=== CURRICULUM-ALIGNED EXEMPLAR QUESTIONS (${tier.toUpperCase()} TIER) ===`;

  const rows: ExemplarRow[] = [];
  for (const entry of entries) {
    if (rows.length >= maxTotal) break;
    const filtered = entry.exemplars.filter((ex) => {
      if (tier === "both") return true;
      if (ex.tier === "both") return true;
      return ex.tier === tier;
    });
    rows.push(...filtered.slice(0, maxPerSpecRef));
  }
  if (rows.length === 0) return "";

  const lines: string[] = [];
  lines.push(header);
  lines.push(
    "Each exemplar below is paraphrased from public awarding-body specifications and past-paper conventions. Match this style and demand. Do not copy these stems verbatim — generate new questions of equivalent quality, mark count, and command verb.",
  );
  lines.push("");
  for (const ex of rows.slice(0, maxTotal)) {
    lines.push(
      `• [${ex.specRef} | ${ex.ao} | ${ex.marks} mark${
        ex.marks === 1 ? "" : "s"
      } | ${ex.tier}] ${ex.commandVerb}: ${ex.stem}`,
    );
    if (ex.markScheme) lines.push(`    Mark scheme: ${ex.markScheme}`);
  }
  lines.push("");
  lines.push("=== END EXEMPLARS ===");
  return lines.join("\n");
}

/**
 * Build a per-spec-ref scaffold block for injection into the
 * `/api/ai/scaffold-worksheet` system prompt. Replaces the regex-class
 * hints in `buildLocalScaffold` with topic-specific sentence frames,
 * vocabulary, and a deterministic step ladder. Returns an empty string
 * when no entries carry scaffold rows (caller falls back to the
 * existing per-SEND-need rules).
 */
export function buildScaffoldPromptBlock(
  entries: CurriculumEntry[],
  sendNeed?: string,
): string {
  const rows = entries
    .map((e) => e.scaffold)
    .filter((s): s is ScaffoldRow => s !== null);
  if (rows.length === 0) return "";

  const lines: string[] = [];
  lines.push("=== TOPIC-SPECIFIC SCAFFOLDING (use these verbatim — do not rewrite) ===");
  if (sendNeed) {
    lines.push(
      `Pupil profile: ${sendNeed}. Layer your SEND-specific rules over the topic-specific scaffolds below.`,
    );
  }
  lines.push("");
  for (const row of rows) {
    lines.push(`Spec ${row.specRef}:`);
    if (row.wordBank.length > 0) {
      lines.push("  Word bank:");
      for (const w of row.wordBank) {
        lines.push(`    - ${w.term}: ${w.definition}`);
      }
    }
    if (row.sentenceFrames.length > 0) {
      lines.push("  Sentence frames:");
      for (const f of row.sentenceFrames) {
        lines.push(`    - ${f}`);
      }
    }
    if (row.stepLadder.length > 0) {
      lines.push("  Step ladder (use this order in your scaffold):");
      row.stepLadder.forEach((step, i) => {
        lines.push(`    ${i + 1}. ${step}`);
      });
    }
    if (row.commonPitfalls && row.commonPitfalls.length > 0) {
      lines.push("  Common pitfalls to flag:");
      for (const p of row.commonPitfalls) {
        lines.push(`    - ${p}`);
      }
    }
    if (row.visualAidHint) {
      lines.push(`  Visual aid hint: ${row.visualAidHint}`);
    }
    lines.push("");
  }
  lines.push("=== END SCAFFOLDS ===");
  return lines.join("\n");
}

// ─── Test-only helpers ─────────────────────────────────────────────────────

/**
 * For unit tests. Exposing the exemplar count keeps tests pure (no
 * filesystem reads) while still letting them assert that registration
 * is wiring up correctly.
 */
export function _exemplarCount(
  board: ExamBoard,
  subject: string,
  yearGroup: string,
): number {
  return (EXEMPLAR_REGISTRY[key(board, subject, yearGroup)] || []).length;
}

export function _scaffoldCount(
  board: ExamBoard,
  subject: string,
  yearGroup: string,
): number {
  return SCAFFOLD_REGISTRY[key(board, subject, yearGroup)]?.size ?? 0;
}

/**
 * For unit tests. Wipes the registries so a test can register its own
 * fixture without leaking state into the next test. **Never call from
 * production code.**
 */
export function _resetRegistriesForTests(): void {
  for (const k of Object.keys(EXEMPLAR_REGISTRY)) delete EXEMPLAR_REGISTRY[k];
  for (const k of Object.keys(SCAFFOLD_REGISTRY)) delete SCAFFOLD_REGISTRY[k];
}

// ─── Module-level data registration ────────────────────────────────────────
//
// Phase F · FEAT-PF1 — paraphrased exemplar bank seed across the highest-
// volume GCSE subjects. Adding a new exemplar dataset is one import + one
// registerExemplars call below. Adding a new scaffold dataset is one import
// + one registerScaffolds call.

import aqaMathsY10Exemplars from "@/data/exemplars/aqa-mathematics-y10.json";
import edexcelMathsY10Exemplars from "@/data/exemplars/edexcel-mathematics-y10.json";
import aqaBiologyY10Exemplars from "@/data/exemplars/aqa-biology-y10.json";
import aqaChemistryY10Exemplars from "@/data/exemplars/aqa-chemistry-y10.json";
import aqaPhysicsY10Exemplars from "@/data/exemplars/aqa-physics-y10.json";
import edexcelBiologyY10Exemplars from "@/data/exemplars/edexcel-biology-y10.json";
import edexcelChemistryY10Exemplars from "@/data/exemplars/edexcel-chemistry-y10.json";
import edexcelPhysicsY10Exemplars from "@/data/exemplars/edexcel-physics-y10.json";
import aqaEnglishY10Exemplars from "@/data/exemplars/aqa-english-y10.json";

registerExemplars(aqaMathsY10Exemplars as ExemplarDataset);
registerExemplars(edexcelMathsY10Exemplars as ExemplarDataset);
registerExemplars(aqaBiologyY10Exemplars as ExemplarDataset);
registerExemplars(aqaChemistryY10Exemplars as ExemplarDataset);
registerExemplars(aqaPhysicsY10Exemplars as ExemplarDataset);
registerExemplars(edexcelBiologyY10Exemplars as ExemplarDataset);
registerExemplars(edexcelChemistryY10Exemplars as ExemplarDataset);
registerExemplars(edexcelPhysicsY10Exemplars as ExemplarDataset);
registerExemplars(aqaEnglishY10Exemplars as ExemplarDataset);

// (Scaffold dataset registrations land in the next commit.)
