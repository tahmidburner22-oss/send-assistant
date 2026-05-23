/**
 * worksheetVersioning.ts — PR-11 / PD7
 * Pure helpers for worksheet version diffing.
 * No I/O, no DOM, works in browser + Node.
 */

export type SectionDiffStatus = "unchanged" | "edited" | "added" | "removed";

export interface SectionDiff {
  index: number;
  status: SectionDiffStatus;
  before?: { title?: string; content?: string; type?: string };
  after?: { title?: string; content?: string; type?: string };
}

export interface WorksheetDiffResult {
  sections: SectionDiff[];
  totalChanged: number;
  totalAdded: number;
  totalRemoved: number;
}

export interface VersionSnapshot {
  versionNumber: number;
  trigger: string;
  sections: Array<{ title?: string; content?: string; type?: string }>;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Compute a section-level diff between two worksheet versions.
 * Sections are matched by index (positional alignment).
 * When lengths differ, excess sections are marked as added or removed.
 */
export function diffWorksheetSections(
  before: Array<{ title?: string; content?: string; type?: string }>,
  after: Array<{ title?: string; content?: string; type?: string }>,
): WorksheetDiffResult {
  const maxLen = Math.max(before.length, after.length);
  const sections: SectionDiff[] = [];
  let totalChanged = 0;
  let totalAdded = 0;
  let totalRemoved = 0;

  for (let i = 0; i < maxLen; i++) {
    const b = before[i];
    const a = after[i];
    if (!b && a) {
      sections.push({ index: i, status: "added", after: a });
      totalAdded++;
    } else if (b && !a) {
      sections.push({ index: i, status: "removed", before: b });
      totalRemoved++;
    } else if (b && a) {
      const same = b.title === a.title && b.content === a.content && b.type === a.type;
      sections.push({
        index: i,
        status: same ? "unchanged" : "edited",
        before: b,
        after: a,
      });
      if (!same) totalChanged++;
    }
  }

  return { sections, totalChanged, totalAdded, totalRemoved };
}

/**
 * Compute a simple word-level diff between two text strings.
 * Returns an array of { word, status } tokens for rendering.
 */
export function diffText(
  before: string,
  after: string,
): Array<{ word: string; status: "same" | "added" | "removed" }> {
  const wordsA = (before || "").split(/\s+/).filter(Boolean);
  const wordsB = (after || "").split(/\s+/).filter(Boolean);

  const result: Array<{ word: string; status: "same" | "added" | "removed" }> = [];

  // For a practical implementation, use a simple positional approach:
  // Walk both arrays, match words that are identical in position
  let ai = 0;
  let bi = 0;

  while (ai < wordsA.length || bi < wordsB.length) {
    if (ai >= wordsA.length) {
      result.push({ word: wordsB[bi], status: "added" });
      bi++;
    } else if (bi >= wordsB.length) {
      result.push({ word: wordsA[ai], status: "removed" });
      ai++;
    } else if (wordsA[ai] === wordsB[bi]) {
      result.push({ word: wordsA[ai], status: "same" });
      ai++;
      bi++;
    } else {
      // Look ahead to find the word in the other sequence
      const lookAheadB = wordsB.indexOf(wordsA[ai], bi);
      const lookAheadA = wordsA.indexOf(wordsB[bi], ai);

      if (lookAheadB !== -1 && (lookAheadA === -1 || lookAheadB - bi <= lookAheadA - ai)) {
        // Words were added in B before this point
        while (bi < lookAheadB) {
          result.push({ word: wordsB[bi], status: "added" });
          bi++;
        }
      } else if (lookAheadA !== -1) {
        // Words were removed from A
        while (ai < lookAheadA) {
          result.push({ word: wordsA[ai], status: "removed" });
          ai++;
        }
      } else {
        // No match found — treat as replacement
        result.push({ word: wordsA[ai], status: "removed" });
        result.push({ word: wordsB[bi], status: "added" });
        ai++;
        bi++;
      }
    }
  }

  return result;
}

/** Maximum versions to retain per worksheet. */
export const MAX_VERSIONS = 20;

/**
 * Given a versions array, determine the next version number.
 */
export function nextVersionNumber(versions: VersionSnapshot[]): number {
  if (versions.length === 0) return 1;
  return Math.max(...versions.map((v) => v.versionNumber)) + 1;
}

/**
 * Enforce the version cap by dropping the oldest versions.
 */
export function enforceVersionCap(versions: VersionSnapshot[]): VersionSnapshot[] {
  if (versions.length <= MAX_VERSIONS) return versions;
  return versions.sort((a, b) => a.versionNumber - b.versionNumber).slice(-MAX_VERSIONS);
}
