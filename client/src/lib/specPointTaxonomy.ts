/**
 * specPointTaxonomy.ts — FEAT-PC4 · Phase C
 * ──────────────────────────────────────────────────────────────────────────
 * Static spec-point taxonomies per UK awarding body. Each (board, subject,
 * yearGroup) is bundled as a JSON file under client/src/data/spec-points/
 * and registered here. The Curriculum Coverage page reads from this module
 * to render its column headers; the aggregator reads from it to know which
 * specRefs are even *possible* for a given class (so we can colour an
 * untouched cell as "unseen" rather than missing it entirely).
 *
 * Why static JSON, not a server fetch:
 *   - Spec points are public, slow-changing, deterministic.
 *   - Bundling them makes the coverage page work offline.
 *   - The set is small (≤ ~120 rows per board/subject/year), so the bundle
 *     hit is tens of KB total even at full coverage.
 *
 * Bootstrap PR ships AQA Maths Y10 only; new datasets land alongside the
 * Curriculum Coverage UI in the sibling PR. Adding a new dataset is one
 * line in REGISTRY plus the matching JSON file under data/spec-points.
 */

import aqaMathsY10 from "@/data/spec-points/aqa-maths-y10.json";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ExamBoard =
  | "aqa"
  | "edexcel"
  | "ocr"
  | "cie"
  | "sqa"
  | "ccea"
  | "white-rose";

export type AssessmentObjective = "AO1" | "AO2" | "AO3" | "AO4";

export interface SpecPoint {
  /** Awarding-body shortcode (e.g. "N1", "A19", "RP-3"). Stable id. */
  specRef: string;
  /** Human-readable description of the spec point. */
  specTitle: string;
  /** Assessment Objective tag, AO1–AO4. */
  ao?: AssessmentObjective;
  /** Optional Bloom anchor when the awarding body publishes one. */
  bloomLevel?: string;
  /** Foundation / Higher tier (Maths, Combined Science…). */
  tier?: "foundation" | "higher" | "both";
  /** Optional grade band (1–9) when the body publishes one. */
  band?: string;
}

export interface SpecPointDataset {
  board: ExamBoard;
  subject: string;
  yearGroup: string;
  qualification?: string;
  source: string;
  specPoints: SpecPoint[];
}

// ─── Registry ───────────────────────────────────────────────────────────────

/**
 * Maps `${board}|${subject}|${yearGroup}` keys to their dataset. Keys are
 * normalised through `taxonomyKey()` so callers can pass case-insensitive
 * strings ("aqa" / "AQA", "Maths" / "Mathematics", "Year 10" / "year 10").
 */
const REGISTRY: Record<string, SpecPointDataset> = {};

function register(dataset: SpecPointDataset) {
  REGISTRY[taxonomyKey(dataset.board, dataset.subject, dataset.yearGroup)] = dataset;
}

register(aqaMathsY10 as SpecPointDataset);

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Build the registry key. Subject names are coerced to a canonical form so
 * "Mathematics" / "Maths" / "MATHS" all hit the same dataset.
 */
export function taxonomyKey(board: string, subject: string, yearGroup: string): string {
  const canonicalSubject = canonicaliseSubject(subject);
  return `${board.toLowerCase()}|${canonicalSubject}|${yearGroup.trim().toLowerCase()}`;
}

function canonicaliseSubject(subject: string): string {
  const s = subject.trim().toLowerCase();
  if (s === "maths" || s === "math") return "mathematics";
  if (s === "english language" || s === "english lang") return "english";
  if (s === "combined science" || s === "trilogy") return "combined science";
  return s;
}

/**
 * Look up a spec-point dataset. Returns null when unknown — callers should
 * surface a "taxonomy not yet bundled for this board/subject/year" notice
 * rather than crashing.
 */
export function getSpecPoints(
  board: ExamBoard,
  subject: string,
  yearGroup: string,
): SpecPointDataset | null {
  return REGISTRY[taxonomyKey(board, subject, yearGroup)] ?? null;
}

/**
 * Convenience helper: union of every spec point across boards for a
 * (subject, yearGroup) combination. Used by the "All boards" filter in the
 * Curriculum Coverage page so a school running mixed boards still gets a
 * single grid.
 */
export function getSpecPointsAcrossBoards(
  subject: string,
  yearGroup: string,
): SpecPoint[] {
  const seen = new Set<string>();
  const out: SpecPoint[] = [];
  for (const dataset of Object.values(REGISTRY)) {
    if (canonicaliseSubject(dataset.subject) !== canonicaliseSubject(subject)) continue;
    if (dataset.yearGroup.trim().toLowerCase() !== yearGroup.trim().toLowerCase()) continue;
    for (const sp of dataset.specPoints) {
      // Prefix the awarding board so two boards never collide on "N1".
      const id = `${dataset.board}:${sp.specRef}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ ...sp, specRef: id });
    }
  }
  return out;
}

/**
 * Best-effort match: given a free-text specRef stamped onto a question
 * (PB1 questionProvenance can produce things like "Y10 Maths — Algebra
 * (linear graphs)"), find the closest taxonomy row. Returns the canonical
 * spec point or null.
 *
 * Matching strategy:
 *   1. Exact id match (case-insensitive) on `specRef`.
 *   2. Substring match against the title.
 *   3. Substring match the other way around.
 */
export function matchSpecPoint(
  rawRef: string,
  dataset: SpecPointDataset,
): SpecPoint | null {
  if (!rawRef) return null;
  const needle = rawRef.trim().toLowerCase();
  if (!needle) return null;
  // Step 1: id match.
  for (const sp of dataset.specPoints) {
    if (sp.specRef.toLowerCase() === needle) return sp;
  }
  // Steps 2 & 3: title fuzz.
  for (const sp of dataset.specPoints) {
    const title = sp.specTitle.toLowerCase();
    if (title.includes(needle) || needle.includes(title)) return sp;
  }
  return null;
}

/**
 * List every (board, subject, yearGroup) tuple this build understands. The
 * Coverage page filter dropdowns iterate this so we never offer a board
 * the bundle doesn't actually have data for.
 */
export function listAvailableTaxonomies(): Array<{
  board: ExamBoard;
  subject: string;
  yearGroup: string;
  qualification?: string;
}> {
  return Object.values(REGISTRY).map((d) => ({
    board: d.board,
    subject: d.subject,
    yearGroup: d.yearGroup,
    qualification: d.qualification,
  }));
}
