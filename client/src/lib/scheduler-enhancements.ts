/**
 * scheduler-enhancements.ts — additional helpers on top of scheduler-store.ts.
 *
 * The five Scheduler improvements (statutory deadline awareness, parent
 * self-booking links, cover-awareness, prep packs, audit minutes) are wired
 * directly inside `pages/Scheduler.tsx`. This file provides re-usable
 * pieces that other tools (Pupil Profile, Annual Review pipeline, Parent
 * Portal) can call without rewiring everything.
 */

import { type Meeting, listMeetings } from "@/lib/scheduler-store";

// ── ICS calendar export ─────────────────────────────────────────────────────

function pad(n: number): string { return n < 10 ? `0${n}` : `${n}`; }

function toICSDate(date: string, time?: string): string {
  // YYYYMMDD or YYYYMMDDTHHMMSS
  const [y, m, d] = date.split("-").map(Number);
  if (!time) return `${y}${pad(m)}${pad(d)}`;
  const [hh, mm] = time.split(":").map(Number);
  return `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`;
}

export function meetingToICS(m: Meeting): string {
  const dtStart = toICSDate(m.date, m.startTime);
  const dtEnd = m.endTime ? toICSDate(m.date, m.endTime) : dtStart;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Adaptly//Scheduler//EN",
    "BEGIN:VEVENT",
    `UID:${m.id}@adaptly`,
    `DTSTAMP:${toICSDate(new Date().toISOString().slice(0, 10))}T000000Z`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(m.title)}`,
    `DESCRIPTION:${escapeICS(m.agenda || "")}`,
    m.location ? `LOCATION:${escapeICS(m.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

function escapeICS(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function downloadICS(m: Meeting): void {
  const blob = new Blob([meetingToICS(m)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${m.title.replace(/\W+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Reminder logic ──────────────────────────────────────────────────────────

export interface Reminder {
  meetingId: string;
  triggerAt: number;
  message: string;
}

export function dueReminders(now = Date.now(), windowDays = 14): Reminder[] {
  const out: Reminder[] = [];
  for (const m of listMeetings()) {
    const date = new Date(m.date + "T09:00:00").getTime();
    if (date < now) continue;
    const days = (date - now) / 86400_000;
    if (days <= windowDays) {
      const message = days <= 1
        ? `Tomorrow: ${m.title}`
        : `In ${Math.round(days)} days: ${m.title}`;
      out.push({ meetingId: m.id, triggerAt: date, message });
    }
  }
  return out.sort((a, b) => a.triggerAt - b.triggerAt);
}

// ── Conflict detection (light-weight cover-aware helper) ────────────────────

export interface BusySlot {
  date: string;
  startTime: string;
  endTime: string;
  who: string;
  reason: string;
}

export function meetingConflicts(m: Meeting, busy: BusySlot[]): BusySlot[] {
  if (!m.startTime || !m.endTime) return [];
  return busy.filter((b) => {
    if (b.date !== m.date) return false;
    return overlap(m.startTime!, m.endTime!, b.startTime, b.endTime);
  });
}

function overlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// ── Meeting prep pack ───────────────────────────────────────────────────────

export interface MeetingPrepPack {
  meeting: Meeting;
  agenda: string;
  pupilSnapshot: string;
  priorActions: { text: string; owner?: string; due?: string }[];
}

export function buildPrepPack(opts: {
  meeting: Meeting;
  pupilSummary: string;
}): MeetingPrepPack {
  const previous = listMeetings()
    .filter((mm) => mm.pupilId === opts.meeting.pupilId && mm.id !== opts.meeting.id && mm.date < opts.meeting.date)
    .slice(-2);
  const priorActions = previous
    .flatMap((mm) => mm.decisions || [])
    .filter((d) => !d.done)
    .slice(0, 8);

  return {
    meeting: opts.meeting,
    agenda: opts.meeting.agenda || "Standard agenda — review progress, agree next steps.",
    pupilSnapshot: opts.pupilSummary,
    priorActions,
  };
}

export function prepPackAsText(p: MeetingPrepPack): string {
  return [
    `Meeting Prep — ${p.meeting.title}`,
    `${p.meeting.date} ${p.meeting.startTime || ""}-${p.meeting.endTime || ""}`,
    "─────────────────────────────",
    "AGENDA",
    p.agenda,
    "",
    "PUPIL SNAPSHOT",
    p.pupilSnapshot,
    "",
    "PRIOR ACTIONS (open)",
    ...(p.priorActions.length === 0 ? ["• None"] : p.priorActions.map((a) => `• ${a.text}${a.owner ? ` — ${a.owner}` : ""}${a.due ? ` (due ${a.due})` : ""}`)),
  ].join("\n");
}
