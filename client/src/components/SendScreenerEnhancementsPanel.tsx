/**
 * SendScreenerEnhancementsPanel — embedded inside SEND Screener tool page.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, AlertTriangle, GitBranch, FileDown, Repeat, Users } from "lucide-react";
import { toast } from "sonner";
import {
  type Domain, DOMAIN_LABEL, type Rater,
  saveRun, listRuns, radarOverTime,
  disagreementFlags,
  recommendPathway,
  importInstrument, type InstrumentKind,
  buildReferralPacket,
} from "@/lib/send-screener-enhancements";

interface Props {
  pupilId: string;
  pupilName: string;
  schoolName?: string;
  /** Latest computed scores from the underlying screener form. */
  latestScores?: Record<Domain, number>;
}

const RATERS: Rater[] = ["teacher", "ta", "parent", "pupil", "specialist"];
const DOMAINS = Object.keys(DOMAIN_LABEL) as Domain[];

export default function SendScreenerEnhancementsPanel({
  pupilId, pupilName, schoolName = "[School]", latestScores,
}: Props) {
  const [rater, setRater] = useState<Rater>("teacher");
  const [tick, setTick] = useState(0);
  const [instrument, setInstrument] = useState<InstrumentKind>("boxall");
  const [importBlob, setImportBlob] = useState("");

  const runs = useMemo(() => listRuns(pupilId), [pupilId, tick]);
  const radar = useMemo(() => radarOverTime(pupilId), [pupilId, tick]);
  const disagreements = useMemo(() => disagreementFlags(pupilId), [pupilId, tick]);

  const baselineScores: Record<Domain, number> = useMemo(() => {
    const init: Partial<Record<Domain, number>> = {};
    for (const d of DOMAINS) init[d] = latestScores?.[d] ?? 0;
    return init as Record<Domain, number>;
  }, [latestScores]);

  const recommendation = useMemo(() => recommendPathway(baselineScores), [baselineScores]);

  function quickSave() {
    saveRun({ pupilId, rater, scores: baselineScores });
    setTick((t) => t + 1);
    toast.success("Screener run saved.");
  }

  function importPasted() {
    try {
      const parsed = JSON.parse(importBlob) as Record<string, number>;
      const result = importInstrument(instrument, parsed);
      const overrideScores: Record<Domain, number> = { ...baselineScores };
      for (const [d, v] of Object.entries(result.mappedDomainScores) as [Domain, number][]) {
        overrideScores[d] = v;
      }
      saveRun({ pupilId, rater: "specialist", scores: overrideScores, notes: `Imported ${instrument}` });
      setTick((t) => t + 1);
      toast.success(`Imported ${instrument} scores into ${Object.keys(result.mappedDomainScores).length} domains.`);
    } catch {
      toast.error("Paste valid JSON of {scaleName: number} scores.");
    }
  }

  function exportReferral() {
    const packet = buildReferralPacket({ pupilId, pupilName, schoolName, recommendation });
    const blob = new Blob([packet.draftLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pupilName.replace(/\W+/g, "_")}-referral.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Referral packet exported.");
  }

  if (!pupilId) {
    return (
      <Card className="border-rose-200 mt-4 border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">Pick a pupil to enable screener enhancements.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-rose-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-rose-600" />
          <p className="text-sm font-bold">Screener Enhancements — {pupilName}</p>
          {disagreements.length > 0 && (
            <Badge variant="destructive" className="ml-auto gap-1 text-[10px]">
              <AlertTriangle className="w-3 h-3" /> {disagreements.length} rater disagreement{disagreements.length === 1 ? "" : "s"}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="repeat">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="repeat">Re-screen</TabsTrigger>
            <TabsTrigger value="raters">Multi-rater</TabsTrigger>
            <TabsTrigger value="pathway">Pathway</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="referral">Referral</TabsTrigger>
          </TabsList>

          <TabsContent value="repeat" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Save the current screen as a re-screen so we can show change-over-time.</p>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs">Rater</Label>
                <Select value={rater} onValueChange={(v) => setRater(v as Rater)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{RATERS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={quickSave} className="gap-1.5"><Repeat className="w-3.5 h-3.5" /> Save run</Button>
            </div>
            <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
              <p className="font-bold mb-1">Change-over-time (last {runs.length} runs)</p>
              <ul className="space-y-1">
                {radar.map((r) => {
                  const first = r.values[0]?.score ?? 0;
                  const last = r.values[r.values.length - 1]?.score ?? 0;
                  const delta = last - first;
                  return (
                    <li key={r.domain} className="flex justify-between">
                      <span>{DOMAIN_LABEL[r.domain]}</span>
                      <span className={delta < 0 ? "text-emerald-700" : delta > 0 ? "text-rose-700" : "text-muted-foreground"}>
                        {first.toFixed(1)} → {last.toFixed(1)} ({delta >= 0 ? "+" : ""}{delta.toFixed(1)})
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="raters" className="space-y-2 pt-3">
            {disagreements.length === 0 ? (
              <p className="text-xs text-emerald-700">No significant rater disagreements (threshold ≥ 4 on a 0–10 scale).</p>
            ) : (
              <ul className="space-y-1.5 text-[11px]">
                {disagreements.map((d) => (
                  <li key={d.domain} className="rounded-md border bg-amber-50/50 border-amber-300 p-2 text-amber-800">
                    <p className="font-bold flex items-center gap-1.5"><Users className="w-3 h-3" /> {DOMAIN_LABEL[d.domain]} — spread {d.spread.toFixed(1)}</p>
                    <ul className="list-disc pl-5">{d.raters.map((r) => <li key={r.rater}><strong>{r.rater}</strong>: {r.score}</li>)}</ul>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="pathway" className="space-y-2 pt-3">
            <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
              <p className="flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5" /> Recommended pathway: <Badge variant="outline" className="ml-1">{recommendation.pathway}</Badge></p>
              <p className="mt-1 text-muted-foreground">{recommendation.rationale}</p>
              <p className="font-bold mt-2">Next steps:</p>
              <ul className="list-disc pl-5">{recommendation.nextSteps.map((s) => <li key={s}>{s}</li>)}</ul>
              <p className="text-[10px] italic text-amber-700 mt-2">{recommendation.disclaimer}</p>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-2 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Instrument</Label>
                <Select value={instrument} onValueChange={(v) => setInstrument(v as InstrumentKind)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boxall">Boxall Profile</SelectItem>
                    <SelectItem value="sdq">SDQ</SelectItem>
                    <SelectItem value="pass">PASS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Label className="text-xs">Paste exported scores (JSON: {`{ scaleName: number }`})</Label>
            <Textarea rows={4} value={importBlob} onChange={(e) => setImportBlob(e.target.value)} placeholder='{"self-regulation": 7, "internalised": 5}' />
            <Button size="sm" onClick={importPasted} className="gap-1.5">Import & merge</Button>
          </TabsContent>

          <TabsContent value="referral" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">One-click referral letter pre-filled from the screener history.</p>
            <Button size="sm" onClick={exportReferral} className="gap-1.5"><FileDown className="w-3.5 h-3.5" /> Export referral packet</Button>
            {recommendation.pathway === "external" && (
              <p className="text-[10px] text-amber-700">Parental consent is required for external referral — capture before sending.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
