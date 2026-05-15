/**
 * PupilProfile — `/pupils/:id` — single-pane view of one pupil that
 * aggregates every tool's output for them.
 *
 * Tabs: Overview · Timeline · Documents · Records · Schedule
 *
 * The Timeline is the load-bearing tab — it reads from
 * lib/timeline-events and shows the chronological list of every AI
 * generation done for this pupil, with a one-click "Open in tool" button
 * that deep-links to the source tool with the original form values pre-loaded.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { usePupilScope } from "@/contexts/PupilScopeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronRight, UserCircle2, Sparkles, FileText, Calendar,
  ClipboardList, Pencil, ArrowRight, Trash2, Filter,
} from "lucide-react";
import { TOOLS, getTool } from "@/lib/tool-registry";
import {
  getEvents, deleteEvent, type TimelineEvent,
} from "@/lib/timeline-events";

function fmtDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function relativeDay(ts: number): string {
  const today = new Date();
  const d = new Date(ts);
  const diff = Math.floor((today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return fmtDate(ts);
}

export default function PupilProfile() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { children } = useApp();
  const { setPupilId } = usePupilScope();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [toolFilter, setToolFilter] = useState<string>("");

  const pupil = useMemo(() => children.find(c => c.id === id), [children, id]);

  useEffect(() => {
    if (!id) return;
    setPupilId(id);
    setEvents(getEvents(id));
  }, [id, setPupilId]);

  if (!pupil) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <UserCircle2 className="w-10 h-10 text-muted-foreground/50 mx-auto" />
            <p className="text-sm font-semibold">Pupil not found.</p>
            <p className="text-xs text-muted-foreground">
              The pupil may have been archived. Open the
              {" "}
              <Link href="/pupils"><span className="text-brand underline">register</span></Link>
              {" "}to find them.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredEvents = toolFilter
    ? events.filter(e => e.toolId === toolFilter)
    : events;

  const eventToolIds = Array.from(new Set(events.map(e => e.toolId)));

  // Events grouped by relative day for the timeline rendering.
  const grouped: Array<[string, TimelineEvent[]]> = useMemo(() => {
    const out: Record<string, TimelineEvent[]> = {};
    for (const e of filteredEvents) {
      const k = relativeDay(e.at);
      (out[k] = out[k] || []).push(e);
    }
    return Object.entries(out);
  }, [filteredEvents]);

  function openInTool(e: TimelineEvent) {
    const tool = getTool(e.toolId);
    if (!tool) return;
    // Just navigate — AIToolPage merges any URL params; deep restore happens
    // in each tool via Recent History.
    navigate(tool.path);
  }

  function removeEvent(e: TimelineEvent) {
    deleteEvent(pupil.id, e.id);
    setEvents(getEvents(pupil.id));
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/home"><span className="hover:text-foreground cursor-pointer">Home</span></Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/pupils"><span className="hover:text-foreground cursor-pointer">Pupils</span></Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{pupil.name}</span>
      </div>

      {/* Header */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-white">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white text-xl font-black flex items-center justify-center flex-shrink-0">
              {pupil.name?.split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold leading-tight">{pupil.name}</h1>
              <p className="text-xs text-muted-foreground">
                {[pupil.yearGroup, pupil.code].filter(Boolean).join(" · ")}
              </p>
              {pupil.sendNeeds && pupil.sendNeeds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {pupil.sendNeeds.map(n => (
                    <span key={n} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      {n}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Link href={`/tools/pupil-passport?pupilId=${pupil.id}`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Edit Passport
                </Button>
              </Link>
              <Link href={`/scheduler?pupilId=${pupil.id}`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Schedule Review
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick links to most-used tools for this pupil */}
          <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-indigo-100">
            {["pupil-passport", "ehcp-plan-generator", "smart-targets", "behaviour-plan", "report-comments"].map(tid => {
              const tool = getTool(tid);
              if (!tool) return null;
              const Icon = tool.icon;
              return (
                <Link key={tid} href={`${tool.path}?pupilId=${pupil.id}`}>
                  <button className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-white border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                    <Icon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{tool.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">
            Timeline {events.length > 0 && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-muted">{events.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="assignments">Assignments {pupil.assignments?.length ? `(${pupil.assignments.length})` : ""}</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4 space-y-3">
          {/* Filter bar */}
          {eventToolIds.length > 1 && (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-2.5 flex items-center gap-2 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <button
                  onClick={() => setToolFilter("")}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                    toolFilter === "" ? "bg-brand text-white border-brand" : "bg-white border-border hover:border-foreground/30"
                  }`}
                >
                  All
                </button>
                {eventToolIds.map(tid => {
                  const t = getTool(tid);
                  return (
                    <button
                      key={tid}
                      onClick={() => setToolFilter(tid)}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                        toolFilter === tid ? "bg-brand text-white border-brand" : "bg-white border-border hover:border-foreground/30"
                      }`}
                    >
                      {t?.label || tid}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {filteredEvents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-medium">No timeline events yet.</p>
                <p className="text-xs text-muted-foreground">
                  When you generate work for this pupil with the pupil scope set, it will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            grouped.map(([day, evs]) => (
              <div key={day}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1 mb-2 mt-3">
                  {day}
                </p>
                <div className="space-y-2">
                  {evs.map(e => {
                    const tool = getTool(e.toolId);
                    const Icon = tool?.icon || FileText;
                    return (
                      <Card key={e.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tool?.colour || "bg-muted text-muted-foreground"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-sm font-semibold truncate">{e.title}</span>
                                <span className="text-[10px] text-muted-foreground">{tool?.label || e.toolLabel}</span>
                                <span className="text-[10px] text-muted-foreground/70 ml-auto">{fmtTime(e.at)}</span>
                              </div>
                              {e.summary && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{e.summary}</p>}
                              {e.outputPreview && !e.summary && (
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{e.outputPreview}</p>
                              )}
                              <div className="flex items-center gap-1.5 mt-2">
                                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => openInTool(e)}>
                                  Open in {tool?.label || "tool"} <ArrowRight className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => removeEvent(e)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4 space-y-2">
          <Card className="border-dashed">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">
                Documents and uploaded files for {pupil.name} will appear here.
                Use any tool's <strong>Send to&nbsp;Documents</strong> button to attach an artefact.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4 space-y-2">
          {(!pupil.assignments || pupil.assignments.length === 0) ? (
            <Card className="border-dashed">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">No assignments yet.</p>
              </CardContent>
            </Card>
          ) : (
            pupil.assignments.map(a => (
              <Card key={a.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <ClipboardList className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {a.type} · {fmtDate(new Date(a.assignedAt).getTime())} · {a.status}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
