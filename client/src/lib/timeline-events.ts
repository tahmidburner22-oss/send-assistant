/**
 * timeline-events.ts — Per-pupil timeline log written to by every tool.
 *
 * Today, AI tools generate-and-vanish: a teacher draws an EHCP draft for a
 * pupil and unless they explicitly assign it, nothing connects the
 * generation back to the pupil's record. This module fixes that.
 *
 * Every successful AI generation that has a pupil-context selected is
 * recorded as a structured event, which the /pupils/:id profile renders as
 * a chronological timeline.
 *
 * Storage layout: localStorage `adaptly_timeline_v1` →
 *   Record<pupilId, TimelineEvent[]>
 * Cap: 100 events per pupil, ~100KB per event payload, 12-month retention.
 *
 * Future: this will be backed by `/api/data/timeline` once the server is
 * extended; until then localStorage is the single source of truth on the
 * teacher's machine. The hook + helpers below have an identical shape so
 * the swap is transparent to consumers.
 */

import { TOOLS } from "./tool-registry";

const STORAGE_KEY    = "adaptly_timeline_v1";
const MAX_PER_PUPIL  = 100;
const MAX_BYTES      = 100_000;
const MAX_AGE_MS     = 365 * 24 * 60 * 60 * 1000;

export interface TimelineEvent {
  id: string;
  pupilId: string;
  toolId: string;          // matches a TOOLS[].id
  toolLabel: string;
  at: number;              // epoch ms
  title: string;           // e.g. "Behaviour Plan — Term 2 update"
  summary?: string;        // single-paragraph human summary
  link?: string;           // route to deep-link back to the source artifact
  outputPreview?: string;  // first ~500 chars of generation
  meta?: Record<string, string | number | boolean>;
}

type Store = Record<string, TimelineEvent[]>;

function read(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Quota — drop oldest 25% per pupil and retry.
    try {
      const trimmed: Store = {};
      for (const [k, v] of Object.entries(store)) {
        trimmed[k] = v.slice(0, Math.floor(v.length * 0.75));
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch { /* give up silently */ }
  }
}

function cleanupExpired(events: TimelineEvent[]): TimelineEvent[] {
  const now = Date.now();
  return events.filter(e => (now - e.at) < MAX_AGE_MS);
}

/** Append an event for a pupil. Best-effort, non-throwing. */
export function recordEvent(
  pupilId: string,
  partial: Omit<TimelineEvent, "id" | "at" | "pupilId">,
): TimelineEvent | null {
  if (!pupilId) return null;
  const event: TimelineEvent = {
    ...partial,
    pupilId,
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    outputPreview: partial.outputPreview?.slice(0, 500),
    title: partial.title.slice(0, 140),
  };

  const store = read();
  const existing = cleanupExpired(store[pupilId] || []);

  // De-dupe near-identical recent events (within 2 seconds) so AIToolPage's
  // double-fire on streaming + final write doesn't double-log.
  if (existing[0] &&
      existing[0].toolId === event.toolId &&
      Math.abs(existing[0].at - event.at) < 2000) {
    return null;
  }

  const next = [event, ...existing].slice(0, MAX_PER_PUPIL);
  store[pupilId] = next;
  write(store);
  return event;
}

/** Get the timeline for one pupil, newest first. */
export function getEvents(pupilId: string): TimelineEvent[] {
  if (!pupilId) return [];
  const store = read();
  return cleanupExpired(store[pupilId] || []);
}

/** Get all events across all pupils, newest first (for global Recent view). */
export function getAllEvents(limit = 200): TimelineEvent[] {
  const store = read();
  const all = Object.values(store).flat();
  all.sort((a, b) => b.at - a.at);
  return all.slice(0, limit);
}

/** Remove a single event. */
export function deleteEvent(pupilId: string, eventId: string): void {
  const store = read();
  if (!store[pupilId]) return;
  store[pupilId] = store[pupilId].filter(e => e.id !== eventId);
  write(store);
}

/** Clear the timeline for one pupil (e.g. after archiving). */
export function clearForPupil(pupilId: string): void {
  const store = read();
  delete store[pupilId];
  write(store);
}

/** Compact summary of recent events for the AI prompt context block. */
export function recentEventSummary(pupilId: string, max = 8): string {
  const events = getEvents(pupilId).slice(0, max);
  if (events.length === 0) return "";
  const lines = events.map(e => {
    const tool = TOOLS.find(t => t.id === e.toolId);
    const date = new Date(e.at).toLocaleDateString("en-GB");
    return `  • ${date} — ${tool?.label || e.toolLabel}: ${e.title}`;
  });
  return [
    "[Recent records — use as context, do not name the pupil in the output]",
    ...lines,
  ].join("\n");
}
