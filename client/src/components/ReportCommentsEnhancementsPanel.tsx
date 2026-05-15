/**
 * ReportCommentsEnhancementsPanel — embedded inside Report Comments page.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Wand, ShieldAlert, Sparkles, Layers, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  fitHouseStyle, loadHouseStyle, type HouseStyle,
  validateStructure, type StructureFinding,
  detectGendered, type GenderedFinding,
  type PupilWorkSample, pickEvidenceQuote, injectEvidenceQuote,
  type BatchJob, planBatch,
} from "@/lib/report-comments-enhancements";

interface Props {
  comment: string;                       // current comment draft (live-bound)
  pupilId?: string;
  workSamples?: PupilWorkSample[];       // optional cached samples
  pendingPupils?: { pupilId: string; pupilName: string }[]; // for batch planning
}

export default function ReportCommentsEnhancementsPanel({
  comment, pupilId, workSamples = [], pendingPupils = [],
}: Props) {
  const [exemplars, setExemplars] = useState("");
  const [houseStyle, setHouseStyle] = useState<HouseStyle | null>(loadHouseStyle());

  const validation: StructureFinding[] = useMemo(() => comment ? validateStructure(comment) : [], [comment]);
  const gendered: GenderedFinding[] = useMemo(() => comment ? detectGendered(comment) : [], [comment]);
  const evidence = useMemo(() => pupilId ? pickEvidenceQuote(workSamples, pupilId) : null, [pupilId, workSamples]);
  const batchPlan = useMemo(() => planBatch(pendingPupils.map((p) => ({ ...p, contextSnippet: "" })) as BatchJob[]), [pendingPupils]);

  function trainStyle() {
    const list = exemplars.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
    if (list.length === 0) { toast.error("Paste 3-5 anonymised exemplars."); return; }
    const style = fitHouseStyle(list);
    setHouseStyle(style);
    toast.success(`Learned house style from ${style.exemplarCount} exemplars.`);
  }

  function injectEvidence() {
    if (!evidence) { toast.error("No work samples for this pupil."); return; }
    const next = injectEvidenceQuote(comment, evidence);
    void navigator.clipboard?.writeText(next).catch(() => {});
    toast.success("Comment with evidence quote copied to clipboard.");
  }

  if (!comment) {
    return (
      <Card className="border-emerald-200 mt-4 border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">Generate a comment to enable enhancements.</CardContent>
      </Card>
    );
  }

  const issueCount = validation.length + gendered.length;

  return (
    <Card className="border-emerald-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <p className="text-sm font-bold">Report Comments Enhancements</p>
          {issueCount > 0 && (
            <Badge variant="destructive" className="ml-auto gap-1 text-[10px]">
              <AlertTriangle className="w-3 h-3" /> {issueCount} issue{issueCount === 1 ? "" : "s"}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="lint">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="lint">Validation</TabsTrigger>
            <TabsTrigger value="bias">Bias check</TabsTrigger>
            <TabsTrigger value="style">House style</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="batch">Batch season</TabsTrigger>
          </TabsList>

          <TabsContent value="lint" className="space-y-2 pt-3">
            {validation.length === 0 ? (
              <p className="text-xs text-emerald-700 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Strength + next-step pairing OK.</p>
            ) : (
              <ul className="space-y-1 text-[11px]">
                {validation.map((f, i) => (
                  <li key={i} className="rounded-md border border-amber-300 bg-amber-50/50 p-2 text-amber-800">
                    <Badge variant="outline" className="text-[9px] mr-1">{f.problem}</Badge>
                    {f.message}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="bias" className="space-y-2 pt-3">
            {gendered.length === 0 ? (
              <p className="text-xs text-emerald-700">No gendered-language patterns detected.</p>
            ) : (
              <ul className="space-y-1 text-[11px]">
                {gendered.map((g, i) => (
                  <li key={i} className="rounded-md border border-rose-300 bg-rose-50/50 p-2 text-rose-800">
                    <ShieldAlert className="w-3 h-3 inline mr-1" />
                    "{g.excerpt}" → try: <em>{g.suggestion}</em>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="style" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Paste 3-5 anonymised exemplar reports (separated by blank lines) — the generator will learn voice, length and naming convention.</p>
            <Textarea rows={5} value={exemplars} onChange={(e) => setExemplars(e.target.value)} placeholder={"Exemplar 1…\n\nExemplar 2…"} />
            <Button size="sm" onClick={trainStyle} className="gap-1.5"><Wand className="w-3.5 h-3.5" /> Learn house style</Button>
            {houseStyle && (
              <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
                <p>Calibrated from {houseStyle.exemplarCount} exemplars.</p>
                <p>Avg sentence length: {houseStyle.avgSentenceLength} words · paragraph: {houseStyle.avgParagraphSentences} sentences</p>
                <p>Formality: <Badge variant="outline" className="text-[9px]">{houseStyle.formality}</Badge> · Naming: <Badge variant="outline" className="text-[9px]">{houseStyle.pupilNamingConvention}</Badge></p>
                {houseStyle.commonOpeners.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">Frequent openers: {houseStyle.commonOpeners.join(" · ")}</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="evidence" className="space-y-2 pt-3">
            {!pupilId ? (
              <p className="text-xs italic text-muted-foreground">Pick a pupil first.</p>
            ) : !evidence ? (
              <p className="text-xs italic text-muted-foreground">No work samples cached for this pupil.</p>
            ) : (
              <>
                <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
                  <p className="font-bold">{evidence.topic}</p>
                  <p className="italic mt-1">"{evidence.excerpt.slice(0, 200)}{evidence.excerpt.length > 200 ? "…" : ""}"</p>
                </div>
                <Button size="sm" onClick={injectEvidence} className="gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Inject evidence into comment</Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="batch" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Plan the bulk run before launching the Batch Runner overnight.</p>
            <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
              <p>Pending pupils: <strong>{batchPlan.jobsCount}</strong></p>
              <p>Estimated runtime: <strong>~{batchPlan.estimatedMinutes} min</strong></p>
              <p className="text-[10px] text-muted-foreground mt-1">After the run, only comments that fail validation surface in the review queue — the rest are auto-saved.</p>
            </div>
            <Button size="sm" disabled={batchPlan.jobsCount === 0} className="gap-1.5"><Layers className="w-3.5 h-3.5" /> Launch Batch Runner</Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
