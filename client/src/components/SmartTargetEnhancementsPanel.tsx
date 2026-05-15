/**
 * SmartTargetEnhancementsPanel — embedded inside SMART Targets tool page.
 * Surfaces the five SMART improvements.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckSquare, GitMerge, FileDown, ShieldCheck, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  buildTargetLadder, addTarget, listTargets, isBaselineMeasurable,
  suggestBaselinePrompts, logProgress, progressFor, sparklinePath,
  buildARMeetingPack, packAsText, statutoryCheck,
} from "@/lib/smart-target-enhancements";

interface Props {
  pupilId: string;
  pupilName: string;
  outcomeRefs?: string[];     // EHCP Section E references this pupil has, for compliance check
}

export default function SmartTargetEnhancementsPanel({ pupilId, pupilName, outcomeRefs = [] }: Props) {
  const [outcomeRef, setOutcomeRef] = useState("EHCP Section E #1");
  const [baseline,   setBaseline]   = useState("");
  const [yearTarget, setYearTarget] = useState("");
  const [tick, setTick] = useState(0);

  const targets = useMemo(() => listTargets(pupilId), [pupilId, tick]);
  const compliance = useMemo(() => statutoryCheck(targets, outcomeRefs), [targets, outcomeRefs]);
  const baselineOk = isBaselineMeasurable(baseline);

  function buildLadder() {
    if (!baselineOk) { toast.error('Baseline must be measurable (e.g. "reads 42 wcpm").'); return; }
    if (!yearTarget) { toast.error("Set a year target."); return; }
    const ladder = buildTargetLadder({ pupilId, outcomeRef, baseline, yearTarget });
    for (const t of ladder) addTarget(t);
    setTick(t => t + 1);
    toast.success(`Built ${ladder.length}-step target ladder.`);
  }

  function logFakeProgress(targetId: string, value: number) {
    logProgress({ targetId, value });
    setTick(t => t + 1);
  }

  function exportPack() {
    const pack = buildARMeetingPack(pupilId, pupilName);
    const blob = new Blob([packAsText(pack)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${pupilName.replace(/\W+/g, "_")}-AR-pack.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success("AR meeting pack exported.");
  }

  if (!pupilId) return (
    <Card className="border-teal-200 mt-4 border-dashed">
      <CardContent className="p-4 text-xs text-muted-foreground">Pick a pupil to enable SMART target enhancements.</CardContent>
    </Card>
  );

  return (
    <Card className="border-teal-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-teal-600" />
          <p className="text-sm font-bold">SMART Target Enhancements — {pupilName}</p>
        </div>

        <Tabs defaultValue="ladder">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="ladder">Target ladder</TabsTrigger>
            <TabsTrigger value="baseline">Baseline wizard</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="pack">AR pack</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="ladder" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              From one EHCP outcome, build three sequenced termly stepping-stone targets.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Outcome ref</Label>
                <Input value={outcomeRef} onChange={(e) => setOutcomeRef(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Year target</Label>
                <Input value={yearTarget} onChange={(e) => setYearTarget(e.target.value)} placeholder="e.g. read 90 wcpm on Y3 passage" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Baseline (must be measurable)</Label>
                <Input
                  value={baseline}
                  onChange={(e) => setBaseline(e.target.value)}
                  placeholder='e.g. "currently reads 42 wcpm"'
                  className={baselineOk ? "" : "border-amber-300"}
                />
                {!baselineOk && baseline && (
                  <p className="text-[10px] text-amber-700 mt-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" /> Baseline lacks a number/unit. Try: {suggestBaselinePrompts(yearTarget).join(" · ")}
                  </p>
                )}
              </div>
            </div>
            <Button size="sm" onClick={buildLadder} className="gap-1.5"><GitMerge className="w-3.5 h-3.5" /> Build ladder</Button>
          </TabsContent>

          <TabsContent value="baseline" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Force a measurable starting point — examples for common areas:</p>
            <ul className="text-[11px] space-y-1">
              {["reading","writing","maths","behaviour"].map(area => (
                <li key={area}><strong className="capitalize">{area}:</strong> {suggestBaselinePrompts(area).join(" · ")}</li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="progress" className="space-y-2 pt-3">
            {targets.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No targets yet — build a ladder first.</p>
            ) : (
              <ul className="space-y-2">
                {targets.map(t => {
                  const data = progressFor(t.id).map(p => p.value);
                  const path = sparklinePath(data);
                  return (
                    <li key={t.id} className="rounded-md border bg-muted/20 p-2">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-[10px]">T{t.termTarget}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs">{t.description}</p>
                          <p className="text-[10px] text-muted-foreground">{t.measurable} · review {t.reviewDate}</p>
                        </div>
                        <svg width="80" height="24" className="flex-shrink-0">
                          {path && <path d={path} stroke="currentColor" fill="none" className="text-teal-600" strokeWidth="1.5" />}
                          {data.length === 0 && <text x="40" y="14" textAnchor="middle" className="text-muted-foreground" fontSize="10">no data</text>}
                        </svg>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1">
                        {[20, 40, 60, 80, 100].map(v => (
                          <Button key={v} size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => logFakeProgress(t.id, v)}>+{v}%</Button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="pack" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Generate the meeting pack: targets + sparklines + parent-friendly progress summary.</p>
            <Button size="sm" onClick={exportPack} className="gap-1.5"><FileDown className="w-3.5 h-3.5" /> Export AR pack</Button>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-2 pt-3">
            {compliance.orphans.length === 0 && compliance.uncovered.length === 0 ? (
              <p className="text-xs text-emerald-700 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Every target maps to a Section E outcome and every outcome is covered.</p>
            ) : (
              <>
                {compliance.orphans.length > 0 && (
                  <div className="text-[11px] text-amber-700">
                    <p className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Orphan targets (no matching outcome):</p>
                    <ul className="list-disc pl-5">
                      {compliance.orphans.map(t => <li key={t.id}>{t.description} (ref: {t.outcomeRef})</li>)}
                    </ul>
                  </div>
                )}
                {compliance.uncovered.length > 0 && (
                  <div className="text-[11px] text-amber-700">
                    <p className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Outcomes with no targets:</p>
                    <ul className="list-disc pl-5">
                      {compliance.uncovered.map(r => <li key={r}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
