/**
 * SkillLadderEnhancementsPanel — embeddable inside the Skill Ladder page.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, GitBranch, Star, FileDown, Users } from "lucide-react";
import { toast } from "sonner";
import {
  type Rung, type RungStatus,
  loadGraph,
  upstreamPrerequisites, gapBelow,
  posterFor, posterAsText,
  isMastered, getState, DEFAULT_MASTERY,
  cohortGaps, smallGroupBrief,
} from "@/lib/skill-ladder-enhancements";

interface Props {
  pupilId: string;
  pupilName: string;
  pupilCohort?: string[];      // optional list of pupil ids in the class (for gap report)
}

export default function SkillLadderEnhancementsPanel({ pupilId, pupilName, pupilCohort = [] }: Props) {
  const graph = useMemo(() => loadGraph(), []);
  const [selectedRungId, setSelectedRungId] = useState<string>(graph[0]?.id || "");
  const [masteryRatio, setMasteryRatio] = useState(DEFAULT_MASTERY.masteryRatio);
  const [minAttempts, setMinAttempts] = useState(DEFAULT_MASTERY.minAttempts);

  const upstream = useMemo(() => selectedRungId ? upstreamPrerequisites(selectedRungId, graph) : [], [selectedRungId, graph]);
  const gap = useMemo(() => selectedRungId ? gapBelow(selectedRungId, pupilId, graph) : null, [selectedRungId, pupilId, graph]);
  const poster = useMemo(() => posterFor(pupilId, graph), [pupilId, graph]);
  const gaps = useMemo(() => cohortGaps(pupilCohort, graph), [pupilCohort, graph]);

  function exportPoster() {
    const blob = new Blob([posterAsText(poster, pupilName)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pupilName.replace(/\W+/g, "_")}-skill-poster.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Poster exported.");
  }

  function exportSmallGroup(rungId: string) {
    const gap = gaps.find((g) => g.rungId === rungId);
    if (!gap) return;
    const blob = new Blob([smallGroupBrief(gap)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `small-group-${rungId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const stateBadge = (status: RungStatus) =>
    status === "mastered" ? <Badge className="bg-emerald-500 text-white text-[10px]">★ mastered</Badge>
      : status === "taught" ? <Badge variant="outline" className="text-[10px]">taught</Badge>
      : <Badge variant="secondary" className="text-[10px]">not yet</Badge>;

  if (!pupilId) {
    return (
      <Card className="border-sky-200 mt-4 border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">Pick a pupil to enable Skill Ladder enhancements.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-sky-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-600" />
          <p className="text-sm font-bold">Skill Ladder Enhancements — {pupilName}</p>
        </div>

        <Tabs defaultValue="graph">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="poster">Poster</TabsTrigger>
            <TabsTrigger value="mastery">Mastery</TabsTrigger>
            <TabsTrigger value="gaps">Cohort gaps</TabsTrigger>
          </TabsList>

          <TabsContent value="graph" className="space-y-2 pt-3">
            <Label className="text-xs">Pick a rung</Label>
            <select className="block w-full h-8 text-xs border rounded-md px-2"
                    value={selectedRungId} onChange={(e) => setSelectedRungId(e.target.value)}>
              <option value="">— select —</option>
              {graph.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            {selectedRungId && (
              <div className="text-[11px] space-y-1.5">
                <p className="font-bold flex items-center gap-1.5"><GitBranch className="w-3 h-3" /> Prerequisites:</p>
                {upstream.length === 0 ? (
                  <p className="text-muted-foreground">No prerequisites — root rung.</p>
                ) : (
                  <ul className="list-disc pl-5">
                    {upstream.map((r) => <li key={r.id}>{r.label}</li>)}
                  </ul>
                )}
                {gap ? (
                  <p className="rounded-md border-amber-300 border bg-amber-50/50 p-2 text-amber-800">
                    Actual gap: <strong>{gap.label}</strong> — re-teach this first before retrying the selected rung.
                  </p>
                ) : (
                  <p className="text-emerald-700">All upstream prerequisites mastered for this pupil.</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="poster" className="space-y-2 pt-3">
            {poster.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">No rungs in graph yet.</p>
            ) : (
              <ul className="space-y-1 text-[11px]">
                {poster.slice(0, 20).map((p) => (
                  <li key={p.rungId} className="rounded-md border bg-muted/20 p-2 flex items-center justify-between">
                    <span>{p.iCanStatement}</span>
                    {stateBadge(p.status)}
                  </li>
                ))}
              </ul>
            )}
            <Button size="sm" onClick={exportPoster} className="gap-1.5"><FileDown className="w-3.5 h-3.5" /> Export poster</Button>
          </TabsContent>

          <TabsContent value="mastery" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">A rung is <strong>mastered</strong> only when it meets the threshold below — distinct from <strong>taught</strong>.</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Mastery ratio</Label>
                <Input type="number" min={0.5} max={1} step={0.05} value={masteryRatio} onChange={(e) => setMasteryRatio(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Min attempts</Label>
                <Input type="number" min={1} max={20} value={minAttempts} onChange={(e) => setMinAttempts(Number(e.target.value))} />
              </div>
            </div>
            {selectedRungId && (() => {
              const s = getState(pupilId, selectedRungId);
              const mastered = isMastered(s, { masteryRatio, minAttempts });
              return (
                <p className="text-[11px] rounded-md border bg-muted/20 p-2">
                  Selected rung: {s.successes}/{s.attempts} attempts. {mastered ? <Star className="w-3 h-3 inline text-emerald-600" /> : null} {mastered ? "Mastered" : "Not yet mastered"} at the chosen threshold.
                </p>
              );
            })()}
          </TabsContent>

          <TabsContent value="gaps" className="space-y-2 pt-3">
            {gaps.length === 0 ? (
              <p className="text-xs text-emerald-700">No cohort-level gaps detected (≥3 stuck pupils).</p>
            ) : (
              <ul className="space-y-1.5 text-[11px]">
                {gaps.slice(0, 8).map((g) => (
                  <li key={g.rungId} className="rounded-md border bg-amber-50/50 border-amber-300 p-2 flex items-center justify-between">
                    <span><Users className="w-3 h-3 inline mr-1" /> <strong>{g.rungLabel}</strong> — {g.stuckPupilIds.length} pupils stuck</span>
                    <Button size="sm" variant="ghost" onClick={() => exportSmallGroup(g.rungId)}>brief</Button>
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
