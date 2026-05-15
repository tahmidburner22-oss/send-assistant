/**
 * scheduler-store.ts — Local persistence for the Scheduler tool.
 *
 * Supports the SENCO scheduler improvements: statutory deadline awareness,
 * parent self-booking links, cover-aware bookings, prep packs, audit-quality
 * minutes. The data lives on the client (localStorage) until the server
 * /api/scheduler endpoints exist.
 */

const STORAGE_KEY = "adaptly_scheduler_v1";

export type MeetingKind =
  | "ehcp_review"          // statutory annual review (12-month limit)
  | "ehcp_finalisation"    // 15 working days from draft
  | "ar_followup"
  | "parent_meeting"
  | "intervention_review"
  | "team_around_pupil"
  | "supervision"
  | "general";

export interface Meeting {
  id: string;
  pupilId?: string;
  kind: MeetingKind;
  title: string;
  date: string;             // YYYY-MM-DD
  startTime?: string;       // HH:MM
  endTime?: string;
  attendees: string[];
  location?: string;
  agenda?: string;
  minutes?: string;
  decisions?: { id: string; text: string; owner?: string; due?: string; done?: boolean }[];
  parentBookingToken?: string;     // present if a Calendly-style booking link is offered
  parentBookingExpires?: string;   // ISO date
  reminderEmails?: { at: string; sent: boolean }[];
  createdAt: string;
}

interface Store { meetings: Meeting[]; }

function read(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { meetings: [] };
    const parsed = JSON.parse(raw);
    return { meetings: Array.isArray(parsed?.meetings) ? parsed.meetings : [] };
  } catch {
    return { meetings: [] };
  }
}

function write(store: Store): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch {}
}

export function listMeetings(): Meeting[] {
  return read().meetings.sort((a, b) => a.date.localeCompare(b.date));
}

export function listMeetingsForPupil(pupilId: string): Meeting[] {
  return listMeetings().filter(m => m.pupilId === pupilId);
}

export function saveMeeting(m: Omit<Meeting, "id" | "createdAt"> & { id?: string }): Meeting {
  const store = read();
  if (m.id) {
    const idx = store.meetings.findIndex(x => x.id === m.id);
    if (idx >= 0) {
      const merged = { ...store.meetings[idx], ...m };
      store.meetings[idx] = merged;
      write(store);
      return merged;
    }
  }
  const created: Meeting = {
    ...m,
    id: `mtg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  store.meetings = [...store.meetings, created];
  write(store);
  return created;
}

export function deleteMeeting(id: string): void {
  const store = read();
  store.meetings = store.meetings.filter(m => m.id !== id);
  write(store);
}

/**
 * Statutory deadline checker. Returns null when fine, or an issue object
 * with severity + message + suggested-by-date.
 */
export function checkStatutoryDeadline(
  kind: MeetingKind,
  proposedDate: string,
  reference: { lastReviewDate?: string; draftDate?: string },
): { severity: "ok" | "warn" | "block"; message: string; mustBeBy?: string } {
  const proposed = new Date(proposedDate);
  if (kind === "ehcp_review" && reference.lastReviewDate) {
    const last = new Date(reference.lastReviewDate);
    const limit = new Date(last);
    limit.setMonth(limit.getMonth() + 12);
    const limitISO = limit.toISOString().slice(0, 10);
    if (proposed > limit) {
      return {
        severity: "block",
        message: `Annual review must be held within 12 months of the previous one (${limitISO}). Pick an earlier date.`,
        mustBeBy: limitISO,
      };
    }
    const warning = new Date(limit);
    warning.setDate(warning.getDate() - 30);
    if (proposed > warning) {
      return {
        severity: "warn",
        message: `Cutting it close — the 12-month deadline is ${limitISO}.`,
        mustBeBy: limitISO,
      };
    }
  }
  if (kind === "ehcp_finalisation" && reference.draftDate) {
    const draft = new Date(reference.draftDate);
    const limit = new Date(draft);
    // 15 working days ≈ 21 calendar days for back-of-envelope check.
    limit.setDate(limit.getDate() + 21);
    const limitISO = limit.toISOString().slice(0, 10);
    if (proposed > limit) {
      return {
        severity: "block",
        message: `EHCP finalisation must be returned within 15 working days of the draft (by ${limitISO}).`,
        mustBeBy: limitISO,
      };
    }
  }
  return { severity: "ok", message: "Within statutory window." };
}

/** Generate a token for a parent self-booking link (week-long expiry). */
export function generateBookingToken(): { token: string; expiresAt: string } {
  const tok = `tok_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  const exp = new Date();
  exp.setDate(exp.getDate() + 7);
  return { token: tok, expiresAt: exp.toISOString() };
}
