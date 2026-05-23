/**
 * worksheetVersionDiff.ts — PR-11 (audit item #66)
 *
 * Pure helper for capturing worksheet revision history and computing
 * the diff between two versions. Used by the worksheet editor to keep
 * a per-worksheet `metadata.versionHistory` log so a teacher can roll
 * back, and by audit panels that want to surface "what changed" at a
 * glance.
 *
 * No I/O. No DB writes — that lives in `server/routes/` once the
 * versioning API ships. This module is the pure layer that both the
 * client editor and the future server endpoint share.
 */

export interface WorksheetVersionEntry {
  /** Stable identifier — `${timestamp}-${djb2(snapshot)}`. */
  id: string;
  /** ISO 8601 capture time. */
  capturedAt: string;
  /** Optional teacher-supplied label (e.g. "Pre-class A edit"). */
  label?: string;
  /** Generator that produced the snapshot (e.g. "ai", "manual", "regenerate"). */
  source: "ai" | "manual" | "regenerate" | "import";
  /** Compact summary of section count + total marks at this revision. */
  summary: {
    sectionCount: number;
    totalMarks: number;
    titleHash: string;
  };
}

export interface WorksheetVersionDiff {
  /** Sections added in `next` that weren't in `prev` (by section title). */
  addedSections: string[];
  /** Sections removed from `prev` in `next`. */
  removedSections: string[];
  /** Sections present in both whose content hashes differ. */
  changedSections: string[];
  /** Title or subtitle change. */
  titleChanged: boolean;
  /** Difference in total marks (next − prev). */
  marksDelta: number;
}

interface DiffInputSection {
  title?: string;
  content?: string;
  marks?: number;
}

interface DiffInputWorksheet {
  title?: string;
  subtitle?: string;
  sections?: DiffInputSection[];
}

// ─── Hashing ────────────────────────────────────────────────────────────────

/** Pure djb2 hash. Same algorithm as `aiCacheKey.ts` for consistency. */
function djb2(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  // Convert to unsigned 32-bit and emit hex.
  return (h >>> 0).toString(16).padStart(8, "0");
}

function sectionContentHash(s: DiffInputSection): string {
  return djb2(`${s.title || ""}::${s.content || ""}::${s.marks ?? ""}`);
}

function totalMarks(ws: DiffInputWorksheet): number {
  return (ws.sections || []).reduce((acc, s) => acc + (s.marks || 0), 0);
}

// ─── Snapshot ──────────────────────────────────────────────────────────────

export function captureVersion(
  ws: DiffInputWorksheet,
  opts: {
    capturedAt?: string;
    label?: string;
    source?: WorksheetVersionEntry["source"];
  } = {},
): WorksheetVersionEntry {
  const sections = ws.sections || [];
  const titleHash = djb2(`${ws.title || ""}::${ws.subtitle || ""}`);
  const snapshotKey = djb2(
    sections.map(sectionContentHash).join("|") + `|${titleHash}`,
  );
  const ts = opts.capturedAt || new Date(0).toISOString();
  return {
    id: `${ts}-${snapshotKey}`,
    capturedAt: ts,
    label: opts.label,
    source: opts.source || "manual",
    summary: {
      sectionCount: sections.length,
      totalMarks: totalMarks(ws),
      titleHash,
    },
  };
}

// ─── Diff ──────────────────────────────────────────────────────────────────

export function diffVersions(
  prev: DiffInputWorksheet,
  next: DiffInputWorksheet,
): WorksheetVersionDiff {
  const prevTitles = new Map<string, DiffInputSection>();
  for (const s of prev.sections || []) {
    if (s.title) prevTitles.set(s.title, s);
  }
  const nextTitles = new Map<string, DiffInputSection>();
  for (const s of next.sections || []) {
    if (s.title) nextTitles.set(s.title, s);
  }

  const added: string[] = [];
  const changed: string[] = [];
  for (const [title, ns] of nextTitles) {
    const ps = prevTitles.get(title);
    if (!ps) {
      added.push(title);
      continue;
    }
    if (sectionContentHash(ps) !== sectionContentHash(ns)) {
      changed.push(title);
    }
  }
  const removed: string[] = [];
  for (const title of prevTitles.keys()) {
    if (!nextTitles.has(title)) removed.push(title);
  }

  return {
    addedSections: added,
    removedSections: removed,
    changedSections: changed,
    titleChanged:
      (prev.title || "") !== (next.title || "") ||
      (prev.subtitle || "") !== (next.subtitle || ""),
    marksDelta: totalMarks(next) - totalMarks(prev),
  };
}

/** Push a version entry onto an existing history array (immutable). */
export function appendVersion(
  history: readonly WorksheetVersionEntry[] | undefined,
  entry: WorksheetVersionEntry,
  maxEntries = 50,
): WorksheetVersionEntry[] {
  const list = history ? [...history] : [];
  list.push(entry);
  if (list.length > maxEntries) {
    return list.slice(list.length - maxEntries);
  }
  return list;
}
