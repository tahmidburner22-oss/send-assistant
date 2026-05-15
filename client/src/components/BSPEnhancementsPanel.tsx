/**
 * BSPEnhancementsPanel — embedded next to the Behaviour Support Plan output.
 * Surfaces the five BSP improvements.
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldAlert, Clock, Share2, ClipboardList, AlertTriangle, CheckCircle2,
  Plus, Copy,
} from "lucide-react";
import { toast } from "sonner";
import {
  logABC, listABC, autoFillFromABC, buildLanyardCard, lanyardCardAsHtml,
  checkRestraintCompliance, shareWithTAs, scheduleReview, listReviews,
} from "@/lib/behaviour-enhancements";

interface Props {
  pupilId: string;
  pupilName: string;
  bspText: string;
}

export default function BSPEnhancementsPanel({ pupilId, pupilName, bspText }: Props) {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  const abcEntries  = useMemo(() => listABC(pupilId), [pupilId, tick]);
  const triggerHint = useMemo(() => autoFillFromABC(pupilId), [pupilId, tick]);
  const lanyard     = useMemo(() => buildLanyardCard(bspText, pupilName), [bspText, pupilName]);
  const restraint   = useMemo(() => checkRestraintCompliance(bspText), [bspText]);
  const reviews     = useMemo(() => listReviews(pupilId), [pupilId, tick]);

  const [abc, setAbc] = useState({ antecedent: "", behaviour: "", consequence: "", trigger: "" });
  const [reviewDate, setReviewDate] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() + 42); return d.toISOString().slice(0, 10);
  });
  const [taLink, setTaLink] = useState<string>("");

  function submitAbc() {
    if (!abc.antecedent || !abc.behaviour) { toast.error("Antecedent and Behaviour are required."); return; }
    logABC({
      pupilId,
      date: new Date().toISOString().slice(0, 10),
      ...abc,
      recordedBy: "current user",
    });
    setAbc({ antecedent: "", behaviour: "", consequence: "", trigger: "" });
    refresh();
    toast.success("ABC entry logged.");
  }

  function printLanyard() {
    const html = lanyardCardAsHtml(lanyard);
    const w = window.open("", "_blank", "width=420,height=620");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${pupilName} lanyard</title></head><body>${html}<script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  function shareTo() {
    const rec = shareWithTAs(pupilId, pupilName, bspText);
    const url = `${window.location.origin}/share/passport/${rec.token}`;
    setTaLink(url);
    navigator.clipboard.writeText(url);
    toast.success("TA-share link generated and copied.");
  }

  function scheduleNow() {
    scheduleReview(pupilId, reviewDate);
    refresh();
    toast.success(`Review scheduled for ${reviewDate}. Reminder will fire 7 days before.`);
  }

  if (!pupilId) {
    return (
      <Card className="border-orange-200 mt-4 border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">
          Pick a pupil from the top bar to enable Behaviour Plan enhancements (ABC log, lanyard card, share-with-TAs).
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-orange-600" />
          <p className="text-sm font-bold">Behaviour Plan Enhancements — {pupilName}</p>
        </div>

        <Tabs defaultValue="abc">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="abc">ABC log</TabsTrigger>
            <TabsTrigger value="lanyard">Lanyard card</TabsTrigger>
            <TabsTrigger value="restraint">Restraint check</TabsTrigger>
            <TabsTrigger value="share">Share w/ TAs</TabsTrigger>
            <TabsTrigger value="review">Review schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="abc" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">{abcEntries.length} entries logged. {triggerHint && (<>Top triggers: <strong>{triggerHint.topTriggers.join(", ")}</strong>.</>)}</p>
            {triggerHint && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-[11px]">
                <strong>Pre-fill triggers section with:</strong> {triggerHint.triggerSummary}
              </div>
            )}
            <div className="grid sm:grid-cols-3 gap-2">
              <Input placeholder="Antecedent" value={abc.antecedent} onChange={(e) => setAbc(s => ({ ...s, antecedent: e.target.value }))} />
              <Input placeholder="Behaviour" value={abc.behaviour}    onChange={(e) => setAbc(s => ({ ...s, behaviour: e.target.value }))} />
              <Input placeholder="Consequence" value={abc.consequence} onChange={(e) => setAbc(s => ({ ...s, consequence: e.target.value }))} />
            </div>
            <Button size="sm" onClick={submitAbc} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Log incident (30s)</Button>
            {abcEntries.slice(0, 5).length > 0 && (
              <ul className="text-[11px] space-y-0.5 max-h-32 overflow-y-auto">
                {abcEntries.slice(0, 5).map(e => (
                  <li key={e.id} className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{e.date}</Badge>
                    <span className="truncate">{e.antecedent} → {e.behaviour} → {e.consequence}</span>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="lanyard" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">A6-sized 1-page lanyard summary of the top 3 strategies. Print on a card and clip to your lanyard.</p>
            <div className="rounded-md border bg-amber-50/40 p-3 text-[11px] space-y-1.5">
              <p className="font-bold">{lanyard.pupilName} — de-escalation</p>
              {lanyard.topThreeStrategies.length === 0
                ? <p className="text-muted-foreground italic">No strategies detected — re-generate the BSP first.</p>
                : lanyard.topThreeStrategies.map((s, i) => (
                  <p key={i} className="bg-amber-100 px-2 py-1 rounded"><strong>{i + 1}.</strong> {s}</p>
                ))}
              <p className="text-red-700">Emergency: {lanyard.emergencyContact}</p>
            </div>
            <Button size="sm" onClick={printLanyard} variant="outline" className="gap-1.5"><Copy className="w-3.5 h-3.5" /> Print lanyard card</Button>
          </TabsContent>

          <TabsContent value="restraint" className="space-y-2 pt-3">
            {restraint.length === 0 ? (
              <p className="text-xs text-emerald-700 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> No restraint compliance issues found, or restraint not mentioned.</p>
            ) : (
              <ul className="text-[11px] text-amber-700 list-disc pl-5 space-y-0.5">
                {restraint.map((r, i) => <li key={i}>{r.problem}</li>)}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="share" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Generate a magic-link TAs can open on their phone. Read receipts come back to the SENCO automatically.
            </p>
            <Button size="sm" onClick={shareTo} className="gap-1.5"><Share2 className="w-3.5 h-3.5" /> Generate link</Button>
            {taLink && (
              <div className="rounded-md border bg-muted/30 p-2 text-[10px] break-all">
                <p className="font-bold mb-1">SMS body</p>
                <p>"Hi — {pupilName}'s updated behaviour plan: {taLink} (expires in 7 days)"</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="review" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Set a review date. Reminder fires to the keyworker 7 days before; the date also lands in the Scheduler.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} className="w-44" />
              <Button size="sm" onClick={scheduleNow} className="gap-1.5"><Clock className="w-3.5 h-3.5" /> Schedule</Button>
            </div>
            {reviews.length > 0 && (
              <ul className="text-[11px] space-y-0.5">
                {reviews.map(r => (
                  <li key={r.id} className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{r.reviewOn}</Badge>
                    {r.keyworkerEmail || "(keyworker not set)"}
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
