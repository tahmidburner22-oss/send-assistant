/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * anotherOneLikeThis.ts — FEAT-G2.
 *
 * Pure dispatcher. Given a worksheet section, looks up its specRef in
 * the curriculum bank and picks a fresh exemplar (preferring one not
 * in `excludeExemplarIds`). Falls back to LLM-driven regeneration via
 * a caller-supplied `aiRegenerate` function when the bank cannot
 * satisfy.
 *
 * Pure: dispatcher logic is deterministic; the LLM call is supplied
 * by the caller (so tests can stub it).
 */

import { lookupBySpecRef, type ExemplarRow, type Tier } from "./curriculumBank";
import type { ExamBoard } from "./specPointTaxonomy";

export interface SectionLite {
  title?: string;
  content?: string;
  specRef?: string;
  ao?: string;
  bloomLevel?: string;
  marks?: number;
  type?: string;
}

export interface AnotherOneInput {
  section: SectionLite;
  /** Subject for bank lookup (e.g. "Physics"). */
  subject: string;
  /** Board/year are required for deterministic curriculum-bank lookup. */
  board?: ExamBoard;
  yearGroup?: string;
  /** Tier filter; passes through to curriculumBank.filterByTier. */
  tier?: Tier;
  /** Exemplar ids already used; the dispatcher avoids these. */
  excludeExemplarIds?: string[];
  /** Optional LLM fallback. Receives the original section + exclude list. */
  aiRegenerate?: (input: {
    section: SectionLite;
    excludeExemplarIds: string[];
    pinSpecRef?: string;
  }) => Promise<SectionLite>;
}

export interface AnotherOneOutput {
  section: SectionLite;
  via: "bank" | "llm-fallback";
  sourceExemplarId?: string;
  warnings: string[];
}

function exemplarId(ex: ExemplarRow): string {
  return `${ex.source}|${ex.specRef}|${ex.tier}|${ex.stem}`;
}

function exemplarToSection(ex: ExemplarRow, original: SectionLite): SectionLite {
  return {
    title: original.title,
    content: ex.stem,
    specRef: ex.specRef,
    ao: ex.ao,
    bloomLevel: original.bloomLevel,
    marks: ex.marks,
    type: original.type,
  };
}

function levenshteinSimilar(a: string, b: string): number {
  // Simple proxy for Levenshtein-distance threshold; returns ratio.
  if (a === b) return 1;
  if (!a || !b) return 0;
  const minLen = Math.min(a.length, b.length);
  const maxLen = Math.max(a.length, b.length);
  let same = 0;
  for (let i = 0; i < minLen; i++) if (a[i] === b[i]) same += 1;
  return same / maxLen;
}

export async function anotherOneLikeThis(input: AnotherOneInput): Promise<AnotherOneOutput> {
  const { section, subject, board, yearGroup, tier, excludeExemplarIds = [], aiRegenerate } = input;
  const warnings: string[] = [];
  const specRef = section.specRef || "";
  if (!specRef) {
    if (!aiRegenerate) {
      return { section, via: "llm-fallback", warnings: ["No specRef — cannot regenerate without LLM fallback."] };
    }
    const fresh = await aiRegenerate({ section, excludeExemplarIds });
    return { section: fresh, via: "llm-fallback", warnings };
  }
  const entry = board && yearGroup ? lookupBySpecRef(board, subject, yearGroup, specRef) : null;
  const tierMatches = !tier || tier === "both" || !entry?.specPoint.tier || entry.specPoint.tier === "both" || entry.specPoint.tier === tier;
  const candidates = tierMatches ? (entry?.exemplars ?? []) : [];
  const fresh = candidates.find((c) => {
    const id = exemplarId(c);
    if (excludeExemplarIds.includes(id)) return false;
    if (section.content && levenshteinSimilar(c.stem, section.content) > 0.85) return false;
    return true;
  });
  if (fresh) {
    return {
      section: exemplarToSection(fresh, section),
      via: "bank",
      sourceExemplarId: exemplarId(fresh),
      warnings,
    };
  }
  warnings.push("Bank exhausted — falling back to LLM.");
  if (!aiRegenerate) {
    return {
      section,
      via: "llm-fallback",
      warnings: [...warnings, "No LLM fallback supplied."],
    };
  }
  const llmOut = await aiRegenerate({ section, excludeExemplarIds, pinSpecRef: specRef });
  return {
    section: { ...llmOut, specRef: specRef || llmOut.specRef },
    via: "llm-fallback",
    warnings,
  };
}
