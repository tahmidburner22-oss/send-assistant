/**
 * LessonPlannerEnhancementsPanel — embedded inside Lesson Planner.
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Clock, FileDown, MessageSquare, Layers, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  type PupilForAdaptation, adaptationsForClass,
  retrievalStarter, recordTaught, priorTopics,
  type PacingSection, type PacingState, startPacing, advancePacing, extendCurrent,
  buildBundleManifest,
  critiquePlan,
} from "@/lib/lesson-planner-enhancements";

interface Props {
  topic: string;
  yearGroup: string;
  planText: string;
  pupils?: PupilForAdaptation[];
}

export default function LessonPlannerEnhancementsPanel({
  topic, yearGroup, planText, pupils = [],
}: Props) {
  const adaptations = useMemo(() => adaptationsForClass(pupils), [pupils]);
  const [retrieval, setRetrieval] = useState(retrievalStarter(topic));
  const [pacing, setPacing] = useState<PacingState | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!pacing) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [pacing]);

  useEffect(() => { setRetrieval(retrievalStarter(topic)); }, [topic]);

  const critique = useMemo(() => critiquePlan(planText), [planText]);
  const prior = useMemo(() => priorTopics(topic), [topic]);

  function startTimer() {
    const sections: PacingSection[] = [
      { name: "Retrieval starter", plannedMinutes: 5 },
      { name: "I do (modelling)",  plannedMinutes: 10 },
      { name: "We do (guided)",    plannedMinutes: 15 },
      { name: "You do (practice)", plannedMinutes: 20 },
      { name: "Plenary",           plannedMinutes: 10 },
    ];
    setPacing(startPacing(sections));
  }

  function exportBundle() {
    const manifest = buildBundleManifest({
      topic, yearGroup,
      has: { lesson: !!planText, worksheet: false, slides: false, exitTicket: false, retrieval: retrieval.length > 0 },
    });
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.replace(/\W+/g, "_")}-bundle-manifest.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Bundle manifest exported.");
  }

  function markTaught() {
    if (!topic) return;
    recordTaught(topic);
    toast.success(`"${topic}" added to taught-topic history.`);
  }

  return (
    <Card className="border-violet-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-violet-600" />
          <p className="text-sm font-bold">Lesson Planner Enhancements</p>
        </div>

        <Tabs defaultValue="adapt">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="adapt">Adaptations</TabsTrigger>
            <TabsTrigger value="retrieval">Retrieval</TabsTrigger>
            <TabsTrigger value="pacing">Pacing</TabsTrigger>
            <TabsTrigger value="bundle">Bundle</TabsTrigger>
            <TabsTrigger value="critique">Critique</TabsTrigger>
          </TabsList>

          <TabsContent value="adapt" className="space-y-2 pt-3">
            {adaptations.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">No SEND pupils selected — bind passport-linked pupils to populate this column.</p>
            ) : (
              <ul className="space-y-2">
                {adaptations.map((a) => (
                  <li key={a.pupilId} className="rounded-md border bg-muted/20 p-2 text-[11px]">
                    <p className="font-bold">{a.name}</p>
                    <ul className="list-disc pl-5 mt-1">
                      {a.adaptations.length === 0 ? <li className="italic text-muted-foreground">No adaptations matched.</li> : a.adaptations.map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="retrieval" className="space-y-2 pt-3">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setRetrieval(retrievalStarter(topic))}>Regenerate</Button>
              <Button size="sm" variant="outline" onClick={markTaught} className="gap-1.5"><Plus className="w-3 h-3" /> Mark "{topic || "topic"}" taught</Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Prior topics in memory: {prior.length === 0 ? "none yet" : prior.join(", ")}</p>
            {retrieval.length === 0 ? (
              <p className="text-[11px] italic">Teach a topic first — retrieval pulls from prior topics.</p>
            ) : (
              <ul className="space-y-1 text-[11px]">
                {retrieval.map((q, i) => (
                  <li key={i} className="rounded-md border bg-muted/20 p-2">
                    <Badge variant="outline" className="text-[9px] mr-1.5">{q.source}</Badge>
                    <span className="text-muted-foreground">[{q.topic}]</span> {q.question}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="pacing" className="space-y-2 pt-3">
            {!pacing ? (
              <Button size="sm" onClick={startTimer} className="gap-1.5"><Clock className="w-3.5 h-3.5" /> Start lesson timer</Button>
            ) : (
              <div className="space-y-2">
                {pacing.sections.map((s, i) => {
                  const isCurrent = i === pacing.currentIndex;
                  const elapsed = isCurrent && s.startedAt ? Math.floor((now - s.startedAt) / 60000) : 0;
                  const remaining = Math.max(0, s.plannedMinutes - elapsed);
                  const done = !!s.finishedAt;
                  return (
                    <div key={i} className={`rounded-md border p-2 text-[11px] ${isCurrent ? "border-violet-400 bg-violet-50/40" : ""} ${done ? "opacity-60" : ""}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{i + 1}. {s.name}</span>
                        <span>{Math.round(s.plannedMinutes)} min</span>
                      </div>
                      {isCurrent && (
                        <div className="mt-1 text-violet-700">⏱ {remaining} min remaining</div>
                      )}
                    </div>
                  );
                })}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPacing(advancePacing(pacing))}>Next section</Button>
                  <Button size="sm" variant="outline" onClick={() => setPacing(extendCurrent(pacing, 5))}>Extend by 5 min (recompress)</Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bundle" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Export a manifest linking lesson + worksheet + slides + exit ticket + retrieval as a single zip.</p>
            <Button size="sm" onClick={exportBundle} className="gap-1.5"><Layers className="w-3.5 h-3.5" /> Export bundle manifest</Button>
          </TabsContent>

          <TabsContent value="critique" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Walkthru-style critique pass — names the top three things to strengthen.</p>
            {critique.length === 0 ? (
              <p className="text-xs text-emerald-700">Plan covers all 5 critique heuristics — no suggestions.</p>
            ) : (
              <ul className="space-y-1.5 text-[11px]">
                {critique.map((c, i) => (
                  <li key={i} className="rounded-md border bg-muted/20 p-2">
                    <Badge variant="outline" className="text-[9px] mr-1.5">{c.area}</Badge>
                    {c.suggestion}
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
