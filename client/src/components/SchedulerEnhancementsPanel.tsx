/**
 * SchedulerEnhancementsPanel — embeddable panel showing upcoming meetings,
 * deadline reminders and a one-click ICS download for any pupil context.
 *
 * The full Scheduler UI lives at `/scheduler`. This panel is intended for
 * embedding in pupil profiles, pipelines and dashboards.
 */
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileDown, AlertTriangle, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { listMeetings, listMeetingsForPupil, type Meeting } from "@/lib/scheduler-store";
import { dueReminders, downloadICS, buildPrepPack, prepPackAsText } from "@/lib/scheduler-enhancements";

interface Props {
  pupilId?: string;
  pupilName?: string;
  pupilSummary?: string;
}

export default function SchedulerEnhancementsPanel({ pupilId, pupilName, pupilSummary = "" }: Props) {
  const meetings: Meeting[] = useMemo(
    () => pupilId ? listMeetingsForPupil(pupilId) : listMeetings().slice(-12),
    [pupilId],
  );
  const reminders = useMemo(() => dueReminders(), []);

  function exportPrep(m: Meeting) {
    const pack = buildPrepPack({ meeting: m, pupilSummary });
    const blob = new Blob([prepPackAsText(pack)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${m.title.replace(/\W+/g, "_")}-prep.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="border-blue-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <p className="text-sm font-bold">Scheduler {pupilName ? `— ${pupilName}` : ""}</p>
          <Link href="/scheduler" className="ml-auto text-[11px] text-blue-700 inline-flex items-center gap-1">
            Open scheduler <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-2 pt-3">
            {meetings.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">No meetings scheduled.</p>
            ) : (
              <ul className="space-y-1.5 text-[11px]">
                {meetings.map((m) => (
                  <li key={m.id} className="rounded-md border bg-muted/20 p-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{m.title}</p>
                      <p className="text-muted-foreground">{m.date}{m.startTime ? ` · ${m.startTime}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => downloadICS(m)} title="Download .ics">
                        <Calendar className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => exportPrep(m)} title="Export prep pack">
                        <FileDown className="w-3 h-3" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="reminders" className="space-y-2 pt-3">
            {reminders.length === 0 ? (
              <p className="text-xs text-emerald-700">No reminders in the next 14 days.</p>
            ) : (
              <ul className="space-y-1 text-[11px]">
                {reminders.slice(0, 10).map((r) => (
                  <li key={`${r.meetingId}-${r.triggerAt}`} className="rounded-md border bg-amber-50/50 border-amber-300 p-2 text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>{r.message}</span>
                    <Badge variant="outline" className="ml-auto text-[9px]">{new Date(r.triggerAt).toLocaleDateString("en-GB")}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
