/**
 * DailyWorkEnhancementsPanel — embeddable inside the Daily Adaptive Work page.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Brain, Timer, Users, FileDown, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  type Difficulty, type VisualScheduleEntry,
  typicalConcentration, questionsForTarget,
  nowNextThen,
  buildCompanionSheet, companionAsText,
  nextDifficulty,
  buildOfflinePack, offlinePackAsText,
} from "@/lib/daily-work-enhancements";

interface Props {
  pupilId: string;
  pupilName: string;
  topics?: string[];           // current topics for the daily pack
  language?: string;
  recentResults?: boolean[];   // last N results for adaptive nudge
  currentDifficulty?: Difficulty;
}

export default function DailyWorkEnhancementsPanel({
  pupilId, pupilName, topics = [], language = "en-GB",
  recentResults = [], currentDifficulty = 3,
}: Props) {
  const [targetMinutes, setTargetMinutes] = useState(20);
  const concentration = useMemo(() => typicalConcentration(pupilId, 15), [pupilId]);
  const questions = questionsForTarget({ targetMinutes });

  const schedule: VisualScheduleEntry[] = useMemo(() => topics.map((t, i) => ({
    id: `t${i}`,
    label: t,
    minutes: Math.round(targetMinutes / Math.max(1, topics.length)),
    icon: i === 0 ? "🟢" : i === 1 ? "🟡" : "🔵",
  })), [topics, targetMinutes]);
  const [scheduleIndex, setScheduleIndex] = useState(0);
  const slot = useMemo(() => nowNextThen(schedule, scheduleIndex), [schedule, scheduleIndex]);

  const adaptive = useMemo(() => nextDifficulty({ current: currentDifficulty, recentResults }), [currentDifficulty, recentResults]);

  function exportCompanion() {
    const sheet = buildCompanionSheet({
      pupilName, topics, durationMinutes: targetMinutes, language,
    });
    const blob = new Blob([companionAsText(sheet)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pupilName.replace(/\W+/g, "_")}-parent-companion.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Companion sheet exported.");
  }

  function exportOfflinePack() {
    const pack = buildOfflinePack({
      pupilId, pupilName,
      startDate: new Date(),
      topics: topics.length ? topics : ["Maths", "Reading"],
      perDayMinutes: targetMinutes,
    });
    const blob = new Blob([offlinePackAsText(pack)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pupilName.replace(/\W+/g, "_")}-offline-pack.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Offline pack exported (QR included).");
  }

  if (!pupilId) {
    return (
      <Card className="border-lime-200 mt-4 border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">Pick a pupil to enable daily work enhancements.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-lime-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-lime-600" />
          <p className="text-sm font-bold">Daily Adaptive Work — {pupilName}</p>
        </div>

        <Tabs defaultValue="effort">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="effort">Effort target</TabsTrigger>
            <TabsTrigger value="visual">Now/Next/Then</TabsTrigger>
            <TabsTrigger value="parent">Parent sheet</TabsTrigger>
            <TabsTrigger value="adaptive">Adaptive</TabsTrigger>
            <TabsTrigger value="offline">Offline</TabsTrigger>
          </TabsList>

          <TabsContent value="effort" className="space-y-2 pt-3">
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <Label className="text-xs">Effort target</Label>
                <span className="text-xs font-bold text-lime-700">{targetMinutes} min</span>
              </div>
              <Slider value={[targetMinutes]} onValueChange={(v) => setTargetMinutes(v[0])} min={5} max={45} step={5} />
            </div>
            <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
              <p>Typical concentration window for {pupilName}: <strong>{concentration} min</strong> (averaged from last 10 sessions).</p>
              <p>Pack size at {targetMinutes} min: <strong>{questions} questions</strong> at ~1.5 min/question.</p>
            </div>
          </TabsContent>

          <TabsContent value="visual" className="space-y-2 pt-3">
            {schedule.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">No topics — bind topics to populate the visual strip.</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="rounded-md border bg-emerald-50/40 border-emerald-300 p-2">
                    <p className="text-[10px] uppercase tracking-wide text-emerald-700">Now</p>
                    <p className="text-2xl">{slot.now?.icon || "▶"}</p>
                    <p className="font-bold">{slot.now?.label || "—"}</p>
                  </div>
                  <div className="rounded-md border bg-amber-50/40 border-amber-300 p-2">
                    <p className="text-[10px] uppercase tracking-wide text-amber-700">Next</p>
                    <p className="text-2xl">{slot.next?.icon || "•"}</p>
                    <p className="font-bold">{slot.next?.label || "—"}</p>
                  </div>
                  <div className="rounded-md border bg-blue-50/40 border-blue-300 p-2">
                    <p className="text-[10px] uppercase tracking-wide text-blue-700">Then</p>
                    <p className="text-2xl">{slot.then?.icon || "•"}</p>
                    <p className="font-bold">{slot.then?.label || "—"}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setScheduleIndex((i) => Math.min(i + 1, schedule.length - 1))}>Advance</Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="parent" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Generates a one-paragraph "help in 2 minutes" sheet for the parent — auto-translated into the family's language.</p>
            <Button size="sm" onClick={exportCompanion} className="gap-1.5"><FileDown className="w-3.5 h-3.5" /> Export companion sheet</Button>
          </TabsContent>

          <TabsContent value="adaptive" className="space-y-2 pt-3">
            <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
              <p>Current difficulty: <Badge variant="outline">{adaptive.current}</Badge></p>
              <p className="mt-1">Recommendation:
                {adaptive.recommended > adaptive.current ? <span className="text-emerald-700"> <ChevronUp className="w-3 h-3 inline" /> step UP to {adaptive.recommended}</span>
                  : adaptive.recommended < adaptive.current ? <span className="text-rose-700"> <ChevronDown className="w-3 h-3 inline" /> step DOWN to {adaptive.recommended}</span>
                  : <span className="text-muted-foreground"> hold at {adaptive.current}</span>}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{adaptive.reason}</p>
            </div>
          </TabsContent>

          <TabsContent value="offline" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Generate a 5-day printable pack for families without home internet, with a QR-code answer key.</p>
            <Button size="sm" onClick={exportOfflinePack} className="gap-1.5"><FileDown className="w-3.5 h-3.5" /> Export offline pack</Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
