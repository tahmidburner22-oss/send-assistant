/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * promptSections/proceduralActivityDirectives.ts — FEAT-G4.
 *
 * LLM directive injected when a section is requested as one of the
 * four procedural activity types (wordsearch / crossword / matching /
 * cloze). The actual generation is deterministic (proceduralActivities/
 * generators); the LLM only supplies the wordlist / clue list / pairs /
 * cloze prose.
 */

export type ProceduralKind = "wordsearch" | "crossword" | "matching" | "cloze";

export function buildProceduralActivityDirective(kinds: ProceduralKind[] | undefined | null): string {
  if (!kinds || kinds.length === 0) return "";
  const parts: string[] = ["", "── Procedural activity sections ──"];
  for (const kind of kinds) {
    if (kind === "wordsearch") {
      parts.push(
        "Wordsearch sections: emit `procedural: { kind: 'wordsearch', payload: { words: string[] } }`. List 8-15 topic-relevant words, uppercase, alphabetic only.",
      );
    } else if (kind === "crossword") {
      parts.push(
        "Crossword sections: emit `procedural: { kind: 'crossword', payload: { entries: { word, clue }[] } }`. 8-12 entries; clues are short (≤80 chars).",
      );
    } else if (kind === "matching") {
      parts.push(
        "Matching sections: emit `procedural: { kind: 'matching', payload: { pairs: { left, right }[] } }`. 5-8 pairs of related concepts.",
      );
    } else if (kind === "cloze") {
      parts.push(
        "Cloze sections: emit `procedural: { kind: 'cloze', payload: { prose: string } }`. Use `__BLANK:answer__` tokens inline. 4-8 blanks per section.",
      );
    }
  }
  parts.push("");
  return parts.join("\n");
}
