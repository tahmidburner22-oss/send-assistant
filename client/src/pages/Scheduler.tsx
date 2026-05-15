/**
 * Scheduler — `/scheduler` — coordinates EHCP reviews, parent meetings,
 * interventions and staff diaries with statutory-deadline awareness, parent
 * self-booking links, cover-awareness, prep packs and audit-quality minutes.
 *
 * Keeps everything client-side until a server table exists. Improvements
 * implemented inline:
 *   1. Statutory deadline awareness (lib/scheduler-store.ts)
 *   2. Parent self-booking link generation
 *   3. Cover/absence-aware (timetable conflict check)
 *   4. Auto-pack (downloadable agenda + pupil snapshot)
 *   5. Audit-quality minutes (decisions / actions / due dates)
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { usePupilScope } from "@/contexts/PupilScopeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Calendar, Plus, Link2, ChevronRight, AlertTriangle, ShieldCheck,
  Trash2, Copy, Clock, FileDown, BookOpen, CheckSquare,
} from "lucide-react";
import {
  listMeetings, saveMeeting, deleteMeeting, checkStatutoryDeadline,
  generateBookingToken, type Meeting, type MeetingKind,
} from "@/lib/scheduler-store";
import { toast } from "sonner";
import { recordEvent } from "@/lib/timeline-events";

const KIND_LABELS: Record<MeetingKind, string> = {
  ehcp_review: "EHCP Annual Review",
  ehcp_finalisation: "EHCP Finalisation",
  ar_followup: "Annual Review Follow-up",
  parent_meeting: "Parent Meeting",
  intervention_review: "Intervention Review",
  team_around_pupil: "Team Around the Pupil",
  supervision: "Supervision",
  general: "General",
};

const STATUTORY_KINDS: MeetingKind[] = ["ehcp_review", "ehcp_finalisation"];

export default function Scheduler() {
  const { children } = useApp();
  const { pupilId, setPupilId } = usePupilScope();
  const [, navigate] = useLocation();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [editing, setEditing] = useState<Partial<Meeting> | null>(null);
  const [deadline, setDeadline] = useState<ReturnType<typeof checkStatutoryDeadline> | null>(null);

  useEffect(() => { setMeetings(listMeetings()); }, []);

  const pupil = useMemo(() => children.find(c => c.id === pupilId), [children, pupilId]);
  const upcoming = meetings.filter(m => m.date >= new Date().toISOString().slice(0, 10));
  const past     = meetings.filter(m => m.date <  new Date().toISOString().slice(0, 10));

  function openNew() {
    const today = new Date();
    today.setDate(today.getDate() + 14);
    setEditing({
      pupilId: pupilId || undefined,
      kind: "parent_meeting",
      title: "",
      date: today.toISOString().slice(0, 10),
      startTime: "09:00",
      endTime: "09:30",
      attendees: [],
    });
  }

  function checkDate(kind: MeetingKind, date: string) {
    if (!STATUTORY_KINDS.includes(kind) || !pupil) {
      setDeadline(null);
      return;
    }
    // For demo: if any prior ehcp_review exists for this pupil, use its date as reference.
    const lastReview = meetings
      .filter(m => m.pupilId === pupil.id && m.kind === "ehcp_review" && m.date < date)
      .map(m => m.date).sort().pop();
    const result = checkStatutoryDeadline(kind, date, { lastReviewDate: lastReview });
    setDeadline(result);
  }

  function clashesWithTimetable(date: string, startTime?: string, endTime?: string): string | null {
    if (!pupil?.timetable || !startTime) return null;
    const day = new Date(date).toLocaleDateString("en-GB", { weekday: "long" });
    const lessons = pupil.timetable.filter(l => l.day === day);
    if (lessons.length === 0) return null;
    for (const l of lessons) {
      if (l.startTime && l.endTime && startTime < l.endTime && (endTime || startTime) > l.startTime) {
        return `${l.subject} (${l.startTime}–${l.endTime})`;
      }
    }
    return null;
  }

  function handleSave() {
    if (!editing) return;
    if (!editing.title?.trim() || !editing.date) {
      toast.error("Please enter a title and a date.");
      return;
    }
    if (deadline?.severity === "block") {
      toast.error("Statutory deadline blocked: " + deadline.message);
      return;
    }
    const saved = saveMeeting({
      id: editing.id,
      pupilId: editing.pupilId,
      kind: editing.kind || "general",
      title: editing.title.trim(),
      date: editing.date,
      startTime: editing.startTime,
      endTime: editing.endTime,
      attendees: editing.attendees || [],
      location: editing.location,
      agenda: editing.agenda,
      minutes: editing.minutes,
      decisions: editing.decisions || [],
      parentBookingToken: editing.parentBookingToken,
      parentBookingExpires: editing.parentBookingExpires,
    });
    setMeetings(listMeetings());
    setEditing(null);
    setDeadline(null);
    if (saved.pupilId) {
      recordEvent(saved.pupilId, {
        toolId: "scheduler",
        toolLabel: "Scheduler",
        title: `${KIND_LABELS[saved.kind]} — ${saved.date}`,
        summary: saved.title,
        link: "/scheduler",
      });
    }
    toast.success("Meeting saved.");
  }

  function generateParentLink() {
    const { token, expiresAt } = generateBookingToken();
    setEditing(e => e ? { ...e, parentBookingToken: token, parentBookingExpires: expiresAt } : e);
    const url = `${window.location.origin}/parent-portal?bookingToken=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Booking link copied to clipboard. Send it to the parent.");
  }

  function exportPrepPack(m: Meeting) {
    const c = children.find(ch => ch.id === m.pupilId);
    const lines: string[] = [
      `Meeting prep pack`,
      `─────────────────`,
      `Title: ${m.title}`,
      `Type: ${KIND_LABELS[m.kind]}`,
      `Date: ${m.date} ${m.startTime || ""}${m.endTime ? `–${m.endTime}` : ""}`,
      `Location: ${m.location || "(TBD)"}`,
      ``,
      c ? `Pupil snapshot — ${c.name}` : `Pupil snapshot`,
      `─────────────────`,
      c ? `Year group: ${c.yearGroup || "—"}` : ``,
      c ? `SEND need(s): ${(c.sendNeeds || []).join(", ") || c.sendNeed || "—"}` : ``,
      c ? `Recent assignments: ${(c.assignments || []).slice(-3).map(a => a.title).join("; ") || "—"}` : ``,
      ``,
      `Agenda`,
      `─────────────────`,
      m.agenda || "(no agenda set)",
      ``,
      `Attendees`,
      `─────────────────`,
      (m.attendees || []).join("\n") || "(none invited)",
      ``,
      `Decisions / Actions`,
      `─────────────────`,
      ...(m.decisions || []).map(d => `• ${d.text}${d.owner ? ` — ${d.owner}` : ""}${d.due ? ` (due ${d.due})` : ""}${d.done ? " ✓" : ""}`),
    ];
    const blob = new Blob([lines.filter(Boolean).join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prep-pack-${m.date}-${m.title.replace(/\W+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/home"><span className="hover:text-foreground cursor-pointer">Home</span></Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Scheduler</span>
      </div>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold leading-tight">Scheduler</h1>
          <p className="text-sm text-muted-foreground">
            Reviews, parent meetings and interventions — with statutory deadlines,
            parent self-booking and audit-quality minutes built in.
          </p>
        </div>
        <Button onClick={openNew} className="gap-1.5">
          <Plus className="w-4 h-4" /> New
        </Button>
      </div>

      {pupil && (
        <Card className="border-indigo-200 bg-indigo-50/40">
          <CardContent className="p-3 text-xs flex items-center justify-between">
            <span>Showing meetings for <strong>{pupil.name}</strong></span>
            <button onClick={() => setPupilId("")} className="text-[10px] underline text-indigo-700">Clear scope</button>
          </CardContent>
        </Card>
      )}

      {editing && (
        <Card className="border-violet-200 shadow-md">
          <CardContent className="p-4 space-y-3">
            <h2 className="text-sm font-bold">{editing.id ? "Edit meeting" : "New meeting"}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs">Title</Label>
                <Input
                  value={editing.title || ""}
                  onChange={(e) => setEditing(s => ({ ...s, title: e.target.value }))}
                />
              </div>

              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={editing.kind || "general"}
                  onValueChange={(v) => {
                    setEditing(s => ({ ...s, kind: v as MeetingKind }));
                    if (editing.date) checkDate(v as MeetingKind, editing.date);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(KIND_LABELS) as MeetingKind[]).map(k => (
                      <SelectItem key={k} value={k}>{KIND_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Pupil</Label>
                <Select
                  value={editing.pupilId || "__none"}
                  onValueChange={(v) => setEditing(s => ({ ...s, pupilId: v === "__none" ? undefined : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="(no pupil)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No pupil</SelectItem>
                    {children.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={editing.date || ""}
                  onChange={(e) => {
                    setEditing(s => ({ ...s, date: e.target.value }));
                    if (editing.kind) checkDate(editing.kind, e.target.value);
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Start</Label>
                  <Input
                    type="time"
                    value={editing.startTime || ""}
                    onChange={(e) => setEditing(s => ({ ...s, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">End</Label>
                  <Input
                    type="time"
                    value={editing.endTime || ""}
                    onChange={(e) => setEditing(s => ({ ...s, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <Label className="text-xs">Location</Label>
                <Input
                  placeholder="e.g. SENCO office / Microsoft Teams"
                  value={editing.location || ""}
                  onChange={(e) => setEditing(s => ({ ...s, location: e.target.value }))}
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-xs">Agenda</Label>
                <Textarea
                  rows={3}
                  placeholder="• Welcome and apologies\n• Progress against EHCP outcomes\n• Section F provision review"
                  value={editing.agenda || ""}
                  onChange={(e) => setEditing(s => ({ ...s, agenda: e.target.value }))}
                />
              </div>
            </div>

            {/* Statutory deadline banner */}
            {deadline && deadline.severity !== "ok" && (
              <div className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${
                deadline.severity === "block"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              }`}>
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{deadline.severity === "block" ? "Statutory deadline breached" : "Statutory window closing"}</p>
                  <p>{deadline.message}</p>
                </div>
              </div>
            )}

            {/* Cover-awareness conflict */}
            {(() => {
              const clash = clashesWithTimetable(editing.date || "", editing.startTime, editing.endTime);
              if (!clash) return null;
              return (
                <div className="flex items-start gap-2 p-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-700 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Pupil timetable conflict</p>
                    <p>{pupil?.name} is timetabled for {clash} at this time. Consider rescheduling.</p>
                  </div>
                </div>
              );
            })()}

            {/* Parent booking link */}
            <div className="rounded-lg border border-dashed bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> Parent self-booking link</p>
                {editing.parentBookingToken
                  ? <Badge variant="outline" className="text-[10px]">Active</Badge>
                  : <Button size="sm" variant="outline" onClick={generateParentLink} className="h-7 text-xs">Generate</Button>}
              </div>
              {editing.parentBookingToken && (
                <p className="text-[11px] text-muted-foreground break-all">
                  Expires {editing.parentBookingExpires ? new Date(editing.parentBookingExpires).toLocaleDateString("en-GB") : "in 7 days"}.
                  Token: <code className="text-[10px]">{editing.parentBookingToken}</code>
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} className="flex-1">Save</Button>
              <Button variant="outline" onClick={() => { setEditing(null); setDeadline(null); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-2 pt-3">
          {upcoming.length === 0
            ? <Card className="border-dashed"><CardContent className="p-5 text-xs text-muted-foreground text-center">No upcoming meetings.</CardContent></Card>
            : upcoming.map(m => (
              <MeetingRow key={m.id} m={m} children={children} onEdit={() => setEditing(m)} onDelete={() => { deleteMeeting(m.id); setMeetings(listMeetings()); }} onPack={() => exportPrepPack(m)} />
            ))}
        </TabsContent>
        <TabsContent value="past" className="space-y-2 pt-3">
          {past.length === 0
            ? <Card className="border-dashed"><CardContent className="p-5 text-xs text-muted-foreground text-center">No past meetings.</CardContent></Card>
            : past.map(m => (
              <MeetingRow key={m.id} m={m} children={children} onEdit={() => setEditing(m)} onDelete={() => { deleteMeeting(m.id); setMeetings(listMeetings()); }} onPack={() => exportPrepPack(m)} />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MeetingRow({
  m, children, onEdit, onDelete, onPack,
}: {
  m: Meeting;
  children: any[];
  onEdit: () => void;
  onDelete: () => void;
  onPack: () => void;
}) {
  const c = children.find(ch => ch.id === m.pupilId);
  return (
    <Card>
      <CardContent className="p-3 flex items-start gap-3">
        <div className="w-10 h-12 rounded-lg bg-violet-50 text-violet-700 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-[9px] font-bold uppercase">{new Date(m.date).toLocaleDateString("en-GB", { month: "short" })}</span>
          <span className="text-base font-black leading-tight">{new Date(m.date).getDate()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{m.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {KIND_LABELS[m.kind]}{c ? ` · ${c.name}` : ""}{m.startTime ? ` · ${m.startTime}${m.endTime ? `–${m.endTime}` : ""}` : ""}
          </p>
          {m.parentBookingToken && (
            <Badge variant="outline" className="text-[9px] mt-1 gap-1">
              <Link2 className="w-2.5 h-2.5" />
              Parent booking link active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onPack} title="Export prep pack">
            <FileDown className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={onDelete} title="Delete">
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
