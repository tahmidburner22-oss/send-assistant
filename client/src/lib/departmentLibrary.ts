/**
 * departmentLibrary.ts — PR-17 (audit item #67)
 *
 * Pure scaffolding for the department-shared worksheet library + HOD
 * moderation flow. The DB-side table lives in `server/db/schema.sql`;
 * the client-side helpers here cover the pure logic:
 *
 *   - Ingest: convert a draft worksheet into a moderatable
 *     LibraryEntry (strips PII, captures provenance).
 *   - Moderation: HoD can `approve`, `request-changes` or `reject` an
 *     entry. The state machine here is the source of truth so the
 *     server endpoint and the UI agree.
 *   - Search / filter helpers used by the library browse page.
 */

export type ModerationStatus =
  | "pending-review"
  | "changes-requested"
  | "approved"
  | "rejected";

export interface LibraryEntry {
  id: string;
  title: string;
  subject: string;
  yearGroup: string;
  topic: string;
  examBoard?: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  moderation: {
    status: ModerationStatus;
    moderatorId?: string;
    moderatorName?: string;
    reviewedAt?: string;
    feedback?: string;
  };
  /** Tags drawn from worksheet metadata (sendNeeds, AOs, etc.). */
  tags: string[];
  /** Word-count-only content snapshot — full worksheet kept in blob storage. */
  contentSnapshotChars: number;
}

export interface ModerationTransition {
  from: ModerationStatus;
  to: ModerationStatus;
  allowed: boolean;
  reason?: string;
}

const TRANSITIONS: Record<ModerationStatus, ModerationStatus[]> = {
  "pending-review": ["approved", "changes-requested", "rejected"],
  "changes-requested": ["pending-review", "approved", "rejected"],
  approved: ["changes-requested"],
  rejected: ["pending-review"],
};

export function canTransition(
  from: ModerationStatus,
  to: ModerationStatus,
): ModerationTransition {
  const allowed = TRANSITIONS[from]?.includes(to) ?? false;
  return {
    from,
    to,
    allowed,
    reason: allowed
      ? undefined
      : `Transition ${from} → ${to} is not permitted`,
  };
}

interface DraftWorksheet {
  title?: string;
  metadata?: {
    subject?: string;
    yearGroup?: string;
    topic?: string;
    examBoard?: string;
    sendNeed?: string;
    sendNeeds?: string[];
    aoHistogram?: { AO1?: number; AO2?: number; AO3?: number; AO4?: number };
    [key: string]: unknown;
  };
  sections?: Array<{ content?: string }>;
}

export function ingestForLibrary(
  ws: DraftWorksheet,
  opts: {
    id: string;
    authorId: string;
    authorName: string;
    nowIso?: string;
  },
): LibraryEntry {
  const meta = ws.metadata || {};
  const ts = opts.nowIso || new Date(0).toISOString();
  const tags: string[] = [];

  if (meta.sendNeed) tags.push(`send:${meta.sendNeed}`);
  if (Array.isArray(meta.sendNeeds)) {
    for (const n of meta.sendNeeds) tags.push(`send:${n}`);
  }
  if (meta.aoHistogram) {
    for (const ao of ["AO1", "AO2", "AO3", "AO4"] as const) {
      if ((meta.aoHistogram as Record<string, number | undefined>)[ao]) {
        tags.push(`ao:${ao}`);
      }
    }
  }

  const totalChars = (ws.sections || []).reduce(
    (acc, s) => acc + String(s.content || "").length,
    0,
  );

  return {
    id: opts.id,
    title: ws.title || "Untitled",
    subject: meta.subject || "Unknown",
    yearGroup: meta.yearGroup || "Unknown",
    topic: meta.topic || "Unknown",
    examBoard: meta.examBoard,
    authorId: opts.authorId,
    authorName: opts.authorName,
    createdAt: ts,
    updatedAt: ts,
    moderation: { status: "pending-review" },
    tags,
    contentSnapshotChars: totalChars,
  };
}

/** Pure filter — narrows entries by subject / year / tag / status. */
export function filterLibrary(
  entries: ReadonlyArray<LibraryEntry>,
  filter: {
    subject?: string;
    yearGroup?: string;
    status?: ModerationStatus;
    tag?: string;
    search?: string;
  },
): LibraryEntry[] {
  const search = (filter.search || "").trim().toLowerCase();
  return entries.filter((e) => {
    if (filter.subject && e.subject !== filter.subject) return false;
    if (filter.yearGroup && e.yearGroup !== filter.yearGroup) return false;
    if (filter.status && e.moderation.status !== filter.status) return false;
    if (filter.tag && !e.tags.includes(filter.tag)) return false;
    if (search) {
      const hay = `${e.title} ${e.topic} ${e.authorName}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}

/** Apply a moderation action — returns a new entry, leaves input unchanged. */
export function applyModeration(
  entry: LibraryEntry,
  action: { to: ModerationStatus; moderatorId: string; moderatorName: string; feedback?: string; nowIso?: string },
): { entry: LibraryEntry; ok: boolean; reason?: string } {
  const transition = canTransition(entry.moderation.status, action.to);
  if (!transition.allowed) {
    return { entry, ok: false, reason: transition.reason };
  }
  const ts = action.nowIso || new Date(0).toISOString();
  return {
    entry: {
      ...entry,
      updatedAt: ts,
      moderation: {
        status: action.to,
        moderatorId: action.moderatorId,
        moderatorName: action.moderatorName,
        reviewedAt: ts,
        feedback: action.feedback,
      },
    },
    ok: true,
  };
}
