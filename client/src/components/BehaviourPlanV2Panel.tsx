/**
 * BehaviourPlanV2Panel — surfaces the second wave of Behaviour Support Plan
 * improvements (function-of-behaviour, GAR tiers, pupil voice, briefing card,
 * ABC heatmap). Rendered below the BSP output.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Activity, Quote, FileText, Grid3x3 } from "lucide-react";
import {
  extractReactiveTiers,
  reactiveTiersAsHtml,
  buildStaffBriefingHtml,
  buildAbcHeatmap,
  HEATMAP_DAYS,
  HEATMAP_PERIODS,
  loadPupilVoice,
  savePupilVoice,
  type PupilVoice,
} from "@/lib/behaviour-plan-v2-enhancements";

interface Props {
  pupilId: string;
  pupilName: string;
  bspText: string;
}

export default function BehaviourPlanV2Panel({ pupilId, pupilName, bspText }: Props) {
  const [voiceTick, setVoiceTick] = useState(0);
  const [voiceDraft, setVoiceDraft] = useState<PupilVoice>(() => {
    const v = pupilId ? loadPupilVoice(pupilId) : null;
    return v || { whatHelps: "", whatTriggers: "", whoToCallOn: "" };
  });

  const tiers = useMemo(() => extractReactiveTiers(bspText), [bspText]);
  const heatmap = useMemo(() => (pupilId ? buildAbcHeatmap(pupilId) : []), [pupilId, voiceTick]);
  const maxCount = Math.max(1, ...heatmap.map((c) => c.count));

  function printBriefing() {
    const html = buildStaffBriefingHtml(bspText, pupilName || "Pupil");
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${pupilName} briefing</title></head><body>${html}<script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  function printTiers() {
    const html = reactiveTiersAsHtml(tiers);
    const w = window.open("", "_blank", "width=900,height=600");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${pupilName} GAR tiers</title></head><body>${html}<script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  function saveVoice() {
    if (!pupilId) {
      toast.error("Pick a pupil first.");
      return;
    }
    savePupilVoice(pupilId, voiceDraft);
    setVoiceTick((t) => t + 1);
    toast.success("Pupil voice saved — it will be injected next time you generate.");
  }

  // Always render so tabs are visible — content is empty-state when no pupil scoped.
  return (
    <Card className="border-amber-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-600" />
          <p className="text-sm font-bold">Plan extras — {pupilName || "(no pupil selected)"}</p>
        </div>

        <Tabs defaultValue="tiers">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="tiers">Green/Amber/Red</TabsTrigger>
            <TabsTrigger value="voice">Pupil voice</TabsTrigger>
            <TabsTrigger value="briefing">Briefing card</TabsTrigger>
            <TabsTrigger value="heatmap">ABC heatmap</TabsTrigger>
          </TabsList>

          <TabsContent value="tiers" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Detected response strategies grouped by escalation tier. To populate this fully,
              tick "Green/Amber/Red response tiers" before generating.
            </p>
            <div
              className="rounded-md border bg-white p-2"
              dangerouslySetInnerHTML={{ __html: reactiveTiersAsHtml(tiers) }}
            />
            <Button size="sm" variant="outline" onClick={printTiers} className="gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Print tiers
            </Button>
          </TabsContent>

          <TabsContent value="voice" className="space-y-2 pt-3">
            <div className="flex items-center gap-2 text-amber-700">
              <Quote className="w-3.5 h-3.5" />
              <p className="text-[11px] font-semibold">Capture the pupil's own words (used as direct quotes inside Section 1).</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">What helps you when you are upset?</label>
              <Textarea
                value={voiceDraft.whatHelps}
                onChange={(e) => setVoiceDraft((s) => ({ ...s, whatHelps: e.target.value }))}
                placeholder="In their own words…"
                className="text-xs min-h-[50px] resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">What makes things harder for you?</label>
              <Textarea
                value={voiceDraft.whatTriggers}
                onChange={(e) => setVoiceDraft((s) => ({ ...s, whatTriggers: e.target.value }))}
                placeholder="In their own words…"
                className="text-xs min-h-[50px] resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Who do you trust to help?</label>
              <Textarea
                value={voiceDraft.whoToCallOn}
                onChange={(e) => setVoiceDraft((s) => ({ ...s, whoToCallOn: e.target.value }))}
                placeholder="In their own words…"
                className="text-xs min-h-[50px] resize-none"
              />
            </div>
            <Button size="sm" onClick={saveVoice} disabled={!pupilId}>
              Save pupil voice
            </Button>
          </TabsContent>

          <TabsContent value="briefing" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              A one-page A4 staff briefing distilling the plan to its actionable lines —
              ideal for supply teachers and lunchtime supervisors.
            </p>
            <Button size="sm" variant="outline" onClick={printBriefing} className="gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Open briefing for print
            </Button>
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-2 pt-3">
            <div className="flex items-center gap-2">
              <Grid3x3 className="w-3.5 h-3.5 text-amber-600" />
              <p className="text-[11px] font-semibold">ABC incidents — day × period</p>
            </div>
            {!pupilId ? (
              <p className="text-[11px] text-muted-foreground">Select a pupil to render the heatmap.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="text-[10px] border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-1 text-muted-foreground"></th>
                      {HEATMAP_DAYS.map((d) => (
                        <th key={d} className="px-2 py-1 font-semibold text-amber-700">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HEATMAP_PERIODS.map((p) => (
                      <tr key={p}>
                        <td className="p-1 text-muted-foreground whitespace-nowrap pr-2">{p}</td>
                        {HEATMAP_DAYS.map((d) => {
                          const cell = heatmap.find((c) => c.day === d && c.period === p);
                          const intensity = cell ? cell.count / maxCount : 0;
                          const bg = `rgba(217,119,6,${0.08 + intensity * 0.7})`;
                          return (
                            <td
                              key={`${d}-${p}`}
                              className="text-center w-10 h-7 border border-amber-100"
                              style={{ background: bg, color: intensity > 0.5 ? "#fff" : "#92400e" }}
                              title={`${d} ${p}: ${cell?.count || 0} incident(s)`}
                            >
                              {cell?.count || ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground italic">
              Aggregated from ABC log entries. Use the ABC log tab in the main BSP enhancements panel to add incidents.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
