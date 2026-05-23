/**
 * classPackVisualDiff.ts — pure logic for the Class Pack visual diff
 * surface (audit item #31, PR-19 carry-over).
 *
 * This module holds the deterministic part of the diff: hashing,
 * normalisation, and the per-pupil cell classification. The React
 * component lives in `client/src/components/ClassPackVisualDiff.tsx`
 * and re-exports from here so consumers can import either the pure
 * helpers (for tests) or the rendered component (for the UI).
 */

export interface ClassPackPupilSection {
  title?: string;
  type?: string;
  content?: string;
}

export interface ClassPackPupilEntry {
  pupilId: string;
  pupilName: string;
  sections: ClassPackPupilSection[];
}

export interface DiffCell {
  status: "same" | "changed" | "added" | "removed";
  /** Two-char hash preview for tooltip / hover. */
  hashPreview?: string;
}

/** djb2 hash matching the rest of the codebase (worksheetVersionDiff,
 *  aiCacheKey, editThatLearns). */
export function hashSectionContent(section: ClassPackPupilSection | undefined): string {
  const raw = String(section?.content ?? "");
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

function normaliseTitle(t: string | undefined): string {
  return String(t || "").trim().toLowerCase();
}

/**
 * Compare a pupil's sections against the base. Returns one DiffCell
 * per unique section title in the union of both lists, in base-first
 * order.
 */
export function diffPupilSections(
  baseSections: ClassPackPupilSection[],
  pupilSections: ClassPackPupilSection[],
): Array<{ title: string; cell: DiffCell }> {
  const base = new Map<string, ClassPackPupilSection>();
  for (const s of baseSections) base.set(normaliseTitle(s.title), s);
  const pupil = new Map<string, ClassPackPupilSection>();
  for (const s of pupilSections) pupil.set(normaliseTitle(s.title), s);
  const orderedKeys: string[] = [];
  for (const s of baseSections) {
    const k = normaliseTitle(s.title);
    if (!orderedKeys.includes(k)) orderedKeys.push(k);
  }
  for (const s of pupilSections) {
    const k = normaliseTitle(s.title);
    if (!orderedKeys.includes(k)) orderedKeys.push(k);
  }
  return orderedKeys.map((k) => {
    const inBase = base.get(k);
    const inPupil = pupil.get(k);
    const title = inBase?.title || inPupil?.title || k;
    if (inBase && inPupil) {
      const a = hashSectionContent(inBase);
      const b = hashSectionContent(inPupil);
      return {
        title,
        cell: {
          status: a === b ? "same" : "changed",
          hashPreview: `${a.slice(0, 4)}↔${b.slice(0, 4)}`,
        },
      };
    }
    if (inPupil && !inBase) return { title, cell: { status: "added", hashPreview: hashSectionContent(inPupil).slice(0, 4) } };
    return { title, cell: { status: "removed" } };
  });
}
