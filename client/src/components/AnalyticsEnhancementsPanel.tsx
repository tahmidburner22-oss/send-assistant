/**
 * AnalyticsEnhancementsPanel — embedded inside Analytics Dashboard.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, AlertTriangle, BarChart3, ChevronRight, PoundSterling, Activity } from "lucide-react";
import { toast } from "sonner";
import {
  type PupilSnapshot, type Cohort, COHORT_LABEL,
  buildDeepDive, deepDiveAsText,
  cohortStats,
  listROIs, saveROIs, type InterventionROI, roiCostPerPoint,
  detectAnomalies,
  drillThrough,
} from "@/lib/analytics-enhancements";

interface Props {
  snapshots: PupilSnapshot[];
  onDrillThrough?: (pupilIds: string[]) => void;
}

export default function AnalyticsEnhancementsPanel({ snapshots, onDrillThrough }: Props) {
  const [cohort, setCohort] = useState<Cohort>("all");
  const [tick, setTick] = useState(0);
  const [draft, setDraft] = useState<InterventionROI>({
    name: "", pupils: 0, termCostGBP: 0, baselinePercentile: 0, currentPercentile: 0,
  });

  const stats = useMemo(() => cohortStats(snapshots), [snapshots]);
  const anomalies = useMemo(() => detectAnomalies(snapshots), [snapshots]);
  const rois = useMemo(() => listROIs(), [tick]);

  function exportDeepDive() {
    const text = deepDiveAsText(buildDeepDive(snapshots));
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ofsted-deep-dive-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Deep Dive export downloaded.");
  }

  function addROI() {
    if (!draft.name) { toast.error("Name the intervention."); return; }
    saveROIs([...rois, draft]);
    setDraft({ name: "", pupils: 0, termCostGBP: 0, baselinePercentile: 0, currentPercentile: 0 });
    setTick((t) => t + 1);
    toast.success("ROI row added.");
  }

  function drill(metric: "toolUsage" | "attendance" | "attainmentDelta") {
    const result = drillThrough(snapshots, { metric, cohort });
    if (onDrillThrough) onDrillThrough(result.pupilIds);
    toast.info(`${result.pupilIds.length} pupils match — drill-through fired.`);
  }

  return (
    <Card className="border-cyan-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-600" />
          <p className="text-sm font-bold">Analytics Enhancements</p>
          {anomalies.length > 0 && (
            <Badge variant="destructive" className="ml-auto gap-1 text-[10px]">
              <AlertTriangle className="w-3 h-3" /> {anomalies.length} anomal{anomalies.length === 1 ? "y" : "ies"}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="deep-dive">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="deep-dive">Deep Dive</TabsTrigger>
            <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
            <TabsTrigger value="roi">ROI</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
            <TabsTrigger value="drill">Drill-through</TabsTrigger>
          </TabsList>

          <TabsContent value="deep-dive" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Pre-built export answering the standard Ofsted SEND deep dive questions with live data.</p>
            <Button size="sm" onClick={exportDeepDive} className="gap-1.5"><FileDown className="w-3.5 h-3.5" /> Export Deep Dive</Button>
            <div className="rounded-md border bg-muted/20 p-2 text-[11px] space-y-1.5 mt-2">
              {buildDeepDive(snapshots).map((s, i) => (
                <div key={i}>
                  <p className="font-bold">{s.question}</p>
                  <ul className="list-disc pl-5">{s.evidence.map((e, j) => <li key={j}>{e}</li>)}</ul>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cohorts" className="space-y-2 pt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead><tr className="text-left text-muted-foreground">
                  <th className="py-1 pr-2">Cohort</th><th className="py-1 pr-2">N</th><th className="py-1 pr-2">Tool/30d</th><th className="py-1 pr-2">Att%</th><th className="py-1 pr-2">Δ Attain</th>
                </tr></thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s.cohort} className="border-t">
                      <td className="py-1 pr-2">{COHORT_LABEL[s.cohort]}</td>
                      <td className="py-1 pr-2">{s.count}</td>
                      <td className="py-1 pr-2">{s.avgToolUsage}</td>
                      <td className="py-1 pr-2">{s.avgAttendance}</td>
                      <td className="py-1 pr-2">{s.avgAttainmentDelta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="roi" className="space-y-2 pt-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <Input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              <Input type="number" placeholder="Pupils" value={draft.pupils || ""} onChange={(e) => setDraft({ ...draft, pupils: Number(e.target.value) })} />
              <Input type="number" placeholder="Term £" value={draft.termCostGBP || ""} onChange={(e) => setDraft({ ...draft, termCostGBP: Number(e.target.value) })} />
              <Input type="number" placeholder="Baseline %" value={draft.baselinePercentile || ""} onChange={(e) => setDraft({ ...draft, baselinePercentile: Number(e.target.value) })} />
              <Input type="number" placeholder="Current %" value={draft.currentPercentile || ""} onChange={(e) => setDraft({ ...draft, currentPercentile: Number(e.target.value) })} />
            </div>
            <Button size="sm" onClick={addROI} className="gap-1.5"><PoundSterling className="w-3.5 h-3.5" /> Add ROI</Button>
            {rois.length > 0 && (
              <ul className="space-y-1 mt-2">
                {rois.map((r, i) => {
                  const cpp = roiCostPerPoint(r);
                  return (
                    <li key={i} className="rounded-md border bg-muted/20 p-2 text-[11px] flex items-center justify-between">
                      <span><strong>{r.name}</strong> · {r.pupils} pupils · £{r.termCostGBP}/term</span>
                      <Badge variant={cpp === null ? "destructive" : "outline"}>
                        {cpp === null ? "no measurable gain" : `£${cpp}/percentile-point`}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-2 pt-3">
            {anomalies.length === 0 ? (
              <p className="text-xs text-emerald-700">No anomalies in the current snapshot window.</p>
            ) : (
              <ul className="space-y-1">
                {anomalies.slice(0, 20).map((a, i) => (
                  <li key={i} className="text-[11px] flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50/50 text-amber-800 p-2">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>
                      <Badge variant="outline" className="text-[9px] mr-1">{a.kind}</Badge>
                      {a.pupilId !== "__cohort__" && <span className="font-mono">{a.pupilId} — </span>}
                      {a.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="drill" className="space-y-2 pt-3">
            <div>
              <Label className="text-xs">Cohort</Label>
              <select className="block w-full h-8 text-xs border rounded-md px-2" value={cohort} onChange={(e) => setCohort(e.target.value as Cohort)}>
                {(Object.keys(COHORT_LABEL) as Cohort[]).map((c) => <option key={c} value={c}>{COHORT_LABEL[c]}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => drill("toolUsage")} className="gap-1.5">No engagement <ChevronRight className="w-3 h-3" /></Button>
              <Button size="sm" variant="outline" onClick={() => drill("attendance")} className="gap-1.5">Below-90% attendance <ChevronRight className="w-3 h-3" /></Button>
              <Button size="sm" variant="outline" onClick={() => drill("attainmentDelta")} className="gap-1.5">Negative attainment delta <ChevronRight className="w-3 h-3" /></Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Click any button to surface the named pupils underlying the metric.</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
