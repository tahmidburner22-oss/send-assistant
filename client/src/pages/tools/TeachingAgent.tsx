/**
 * TeachingAgent — SEND AI Teaching Agent (Tool T6).
 * Inspired by Canvas IgniteAI's embedded agent, re-imagined SEND-first.
 *
 * Automates the admin SEND staff dread, with UK SEND frameworks baked in.
 * Three teacher-facing functions (instructor-only, opt-in), all FREE +
 * Gemini-independent (callAI → server fallback chain):
 *   A) EHCP-linked rubric — assessment criteria generated FROM a pupil's EHCP
 *      target (not a generic objective), with emerging/developing/secure
 *      descriptors at the pupil's actual working level.
 *   B) Provision map — interventions → a costed, formatted provision map.
 *   C) Annual-review prep — targets + progress notes → a structured review pack
 *      (progress summary, evidence highlights, next-step targets).
 *
 * All output is a teacher DRAFT to review — a banner says so. No pupil PII is
 * required; teachers can use initials.
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Bot, Sparkles, Printer, Loader2, Target, Grid3x3, CalendarCheck, ShieldCheck } from "lucide-react";
import { callAI, parseWithFixes } from "@/lib/ai";

interface Rubric {
  criteria?: Array<{ criterion?: string; emerging?: string; developing?: string; secure?: string }>;
}
interface ProvisionMap {
  rows?: Array<{ wave?: string; intervention?: string; frequency?: string; staff?: string; cost?: string; outcome?: string }>;
}
interface ReviewPack {
  progressSummary?: string;
  evidenceHighlights?: string[];
  continuingTargets?: string[];
  newTargets?: string[];
  recommendations?: string[];
}

function DraftBanner() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800 print:hidden">
      <ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
      <span>AI-generated draft for a qualified SENCO to review and edit. Use pupil initials — do not enter full names or sensitive data you don't need to.</span>
    </div>
  );
}

export default function TeachingAgent() {
  // ── Rubric ──
  const [ehcpTarget, setEhcpTarget] = useState("");
  const [rubricActivity, setRubricActivity] = useState("");
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [rubricLoading, setRubricLoading] = useState(false);

  // ── Provision map ──
  const [pmPupil, setPmPupil] = useState("");
  const [pmInterventions, setPmInterventions] = useState("");
  const [provisionMap, setProvisionMap] = useState<ProvisionMap | null>(null);
  const [pmLoading, setPmLoading] = useState(false);

  // ── Annual review ──
  const [arTargets, setArTargets] = useState("");
  const [arProgress, setArProgress] = useState("");
  const [reviewPack, setReviewPack] = useState<ReviewPack | null>(null);
  const [arLoading, setArLoading] = useState(false);

  async function handleRubric() {
    if (!ehcpTarget.trim()) { toast.error("Paste the EHCP target the rubric should assess."); return; }
    setRubricLoading(true); setRubric(null);
    try {
      const system =
        "You are a UK SEND assessment lead. Generate an assessment rubric DIRECTLY from the " +
        "pupil's EHCP target (not a generic objective). Return ONLY JSON: " +
        '{"criteria":[{"criterion":"...","emerging":"...","developing":"...","secure":"..."}]}. ' +
        "3-4 criteria. Descriptors describe what you'd OBSERVE at the pupil's actual working " +
        "level (small steps), suitable for pupils working below age-related expectations. British English.";
      const user = `EHCP target: ${ehcpTarget.trim()}${rubricActivity.trim() ? `\nActivity/context: ${rubricActivity.trim()}` : ""}`;
      const { text } = await callAI(system, user, 1400, { responseFormat: "json_object" });
      setRubric(parseWithFixes(text) as Rubric);
      toast.success("Rubric drafted.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg.startsWith("AUTH_REQUIRED") ? "Please log in again to use AI." : "Could not generate the rubric.");
    } finally { setRubricLoading(false); }
  }

  async function handleProvisionMap() {
    if (!pmInterventions.trim()) { toast.error("List the interventions (one per line)."); return; }
    setPmLoading(true); setProvisionMap(null);
    try {
      const system =
        "You are a UK SENCO building a provision map. Return ONLY JSON: " +
        '{"rows":[{"wave":"1|2|3","intervention":"...","frequency":"...","staff":"...","cost":"...","outcome":"..."}]}. ' +
        "One row per intervention. Infer a sensible wave (1 universal, 2 targeted, 3 specialist), a " +
        "realistic frequency, staffing, an INDICATIVE cost band (e.g. '£' low / '££' medium / '£££' high " +
        "— do not invent exact figures), and a measurable intended outcome. British English.";
      const user = `Pupil/group: ${pmPupil.trim() || "(group)"}\nInterventions:\n${pmInterventions.trim()}`;
      const { text } = await callAI(system, user, 1500, { responseFormat: "json_object" });
      setProvisionMap(parseWithFixes(text) as ProvisionMap);
      toast.success("Provision map drafted.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg.startsWith("AUTH_REQUIRED") ? "Please log in again to use AI." : "Could not generate the provision map.");
    } finally { setPmLoading(false); }
  }

  async function handleReview() {
    if (!arTargets.trim()) { toast.error("Add the pupil's current targets."); return; }
    setArLoading(true); setReviewPack(null);
    try {
      const system =
        "You are a UK SENCO preparing an EHCP annual review. Return ONLY JSON: " +
        '{"progressSummary":"...","evidenceHighlights":["..."],"continuingTargets":["..."],' +
        '"newTargets":["..."],"recommendations":["..."]}. Base everything on the targets + progress ' +
        "notes provided. Progress summary 3-4 sentences; 3-4 evidence highlights; continuing vs new " +
        "targets as SMART statements; 2-3 recommendations for the review meeting. British English.";
      const user = `Current targets:\n${arTargets.trim()}\n\nProgress notes:\n${arProgress.trim() || "(none provided)"}`;
      const { text } = await callAI(system, user, 1800, { responseFormat: "json_object" });
      setReviewPack(parseWithFixes(text) as ReviewPack);
      toast.success("Review pack drafted.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg.startsWith("AUTH_REQUIRED") ? "Please log in again to use AI." : "Could not prepare the review pack.");
    } finally { setArLoading(false); }
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="print:hidden">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bot className="w-5 h-5 text-brand" />
          SEND Teaching Agent
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          The admin assistant for SEND staff: turn an EHCP target into an assessment rubric,
          build a costed provision map, and prepare an annual-review pack — all aligned to UK
          SEND frameworks. Drafts for a SENCO to review.
        </p>
      </motion.div>

      <Tabs defaultValue="rubric">
        <TabsList className="print:hidden">
          <TabsTrigger value="rubric"><Target className="w-4 h-4 mr-1.5" />EHCP rubric</TabsTrigger>
          <TabsTrigger value="provision"><Grid3x3 className="w-4 h-4 mr-1.5" />Provision map</TabsTrigger>
          <TabsTrigger value="review"><CalendarCheck className="w-4 h-4 mr-1.5" />Annual review</TabsTrigger>
        </TabsList>

        {/* ── Rubric ── */}
        <TabsContent value="rubric" className="space-y-4">
          <Card className="print:hidden"><CardContent className="p-4 space-y-4">
            <DraftBanner />
            <div className="space-y-1.5">
              <Label htmlFor="ta-target">EHCP target</Label>
              <Textarea id="ta-target" rows={3} placeholder="e.g. 'X will request a preferred item using a symbol or sign in 4 of 5 opportunities.'" value={ehcpTarget} onChange={(e) => setEhcpTarget(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ta-activity">Activity / context (optional)</Label>
              <Input id="ta-activity" placeholder="e.g. snack time, structured play" value={rubricActivity} onChange={(e) => setRubricActivity(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRubric} disabled={rubricLoading}>{rubricLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}Generate rubric</Button>
              {rubric && <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1.5" />Print</Button>}
            </div>
          </CardContent></Card>
          {rubric?.criteria && rubric.criteria.length > 0 && (
            <Card><CardContent className="p-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-muted">
                  <th className="border p-2 text-left">Criterion</th><th className="border p-2 text-left">Emerging</th><th className="border p-2 text-left">Developing</th><th className="border p-2 text-left">Secure</th>
                </tr></thead>
                <tbody>
                  {rubric.criteria.map((c, i) => (
                    <tr key={i}><td className="border p-2 font-semibold">{c.criterion}</td><td className="border p-2">{c.emerging}</td><td className="border p-2">{c.developing}</td><td className="border p-2">{c.secure}</td></tr>
                  ))}
                </tbody>
              </table>
            </CardContent></Card>
          )}
        </TabsContent>

        {/* ── Provision map ── */}
        <TabsContent value="provision" className="space-y-4">
          <Card className="print:hidden"><CardContent className="p-4 space-y-4">
            <DraftBanner />
            <div className="space-y-1.5">
              <Label htmlFor="ta-pupil">Pupil / group (use initials)</Label>
              <Input id="ta-pupil" placeholder="e.g. Year 4 SEND group, or 'AB'" value={pmPupil} onChange={(e) => setPmPupil(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ta-interventions">Interventions (one per line)</Label>
              <Textarea id="ta-interventions" rows={4} placeholder={"Daily reading intervention\nSpeech & language programme\nLego therapy social group"} value={pmInterventions} onChange={(e) => setPmInterventions(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleProvisionMap} disabled={pmLoading}>{pmLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}Generate provision map</Button>
              {provisionMap && <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1.5" />Print</Button>}
            </div>
          </CardContent></Card>
          {provisionMap?.rows && provisionMap.rows.length > 0 && (
            <Card><CardContent className="p-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-muted">
                  <th className="border p-2 text-left">Wave</th><th className="border p-2 text-left">Intervention</th><th className="border p-2 text-left">Frequency</th><th className="border p-2 text-left">Staff</th><th className="border p-2 text-left">Cost</th><th className="border p-2 text-left">Intended outcome</th>
                </tr></thead>
                <tbody>
                  {provisionMap.rows.map((r, i) => (
                    <tr key={i}><td className="border p-2">{r.wave}</td><td className="border p-2 font-semibold">{r.intervention}</td><td className="border p-2">{r.frequency}</td><td className="border p-2">{r.staff}</td><td className="border p-2">{r.cost}</td><td className="border p-2">{r.outcome}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[11px] text-muted-foreground">Costs are indicative bands only — confirm against your school's actual staffing costs.</p>
            </CardContent></Card>
          )}
        </TabsContent>

        {/* ── Annual review ── */}
        <TabsContent value="review" className="space-y-4">
          <Card className="print:hidden"><CardContent className="p-4 space-y-4">
            <DraftBanner />
            <div className="space-y-1.5">
              <Label htmlFor="ta-targets">Current targets (one per line)</Label>
              <Textarea id="ta-targets" rows={3} placeholder={"Target 1: …\nTarget 2: …"} value={arTargets} onChange={(e) => setArTargets(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ta-progress">Progress notes / evidence (optional)</Label>
              <Textarea id="ta-progress" rows={4} placeholder="What has the pupil done this year? What worked? Any setbacks?" value={arProgress} onChange={(e) => setArProgress(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleReview} disabled={arLoading}>{arLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}Prepare review pack</Button>
              {reviewPack && <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1.5" />Print</Button>}
            </div>
          </CardContent></Card>
          {reviewPack && (
            <div className="space-y-3">
              {reviewPack.progressSummary && <Card><CardContent className="p-4"><h3 className="font-bold text-sm mb-1">Progress summary</h3><p className="text-sm leading-relaxed">{reviewPack.progressSummary}</p></CardContent></Card>}
              {reviewPack.evidenceHighlights && reviewPack.evidenceHighlights.length > 0 && <ReviewList title="Evidence highlights" items={reviewPack.evidenceHighlights} />}
              {reviewPack.continuingTargets && reviewPack.continuingTargets.length > 0 && <ReviewList title="Continuing targets" items={reviewPack.continuingTargets} />}
              {reviewPack.newTargets && reviewPack.newTargets.length > 0 && <ReviewList title="Suggested new targets" items={reviewPack.newTargets} />}
              {reviewPack.recommendations && reviewPack.recommendations.length > 0 && <ReviewList title="Recommendations for the meeting" items={reviewPack.recommendations} />}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <Card><CardContent className="p-4">
      <h3 className="font-bold text-sm mb-1.5">{title}</h3>
      <ul className="list-disc pl-5 text-sm space-y-1">{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
    </CardContent></Card>
  );
}
