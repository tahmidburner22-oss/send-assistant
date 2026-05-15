/**
 * EhcpEnhancementsPanel — sidekick panel embedded inside the EHCP Plan
 * Generator (IEPGenerator.tsx) once the draft has reached Stage 4 (Generate).
 *
 * Renders five tabs, one per listed improvement:
 *   1. Golden thread     — checklist + broken-link callouts
 *   2. Tribunal score    — per-provision scoring + "Make enforceable" rewrite
 *   3. Annual-review     — paste last year's draft, get a redline + summary
 *   4. LA pack           — pick LA constraints; warnings if violated
 *   5. Redact / share    — one-click pseudonymised copy for parent/EP email
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, FileCheck,
  Copy, History, Building2, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  goldenThreadCheck, tribunalScore, rewriteForEnforceability,
  annualReviewDelta, listLAPacks, applyLAPack, redactDraft,
  type GoldenThreadIssue, type ProvisionScore,
} from "@/lib/ehcp-enhancements";
import { useApp } from "@/contexts/AppContext";

interface Props {
  /** Map of section key (A-K) → text content. */
  sections: Record<string, string>;
  /** Pupil name, school name etc. used for the redaction default map. */
  pupilName?: string;
  laPackId: string;
  setLaPackId: (id: string) => void;
}

export default function EhcpEnhancementsPanel({ sections, pupilName, laPackId, setLaPackId }: Props) {
  const { school } = useApp();
  const issues: GoldenThreadIssue[] = useMemo(() => goldenThreadCheck(sections), [sections]);

  // Per-provision tribunal scoring
  const sectionFLines = useMemo(
    () => (sections.F || "")
      .split(/\n+/)
      .map(l => l.replace(/^[\s\-•*\d+.]+/, "").trim())
      .filter(l => l.length > 12),
    [sections.F],
  );
  const scores = useMemo(() => sectionFLines.map(tribunalScore), [sectionFLines]);
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, s) => a + s.total, 0) / scores.length) : 0;

  // AR delta inputs
  const [lastYear, setLastYear] = useState("");
  const delta = useMemo(() => lastYear.trim() ? annualReviewDelta(lastYear, sections.F || "") : null, [lastYear, sections.F]);

  // LA pack
  const packs = listLAPacks();
  const fullText = Object.entries(sections).map(([k, v]) => `## Section ${k}\n${v}`).join("\n\n");
  const packCheck = useMemo(() => applyLAPack(fullText, laPackId), [fullText, laPackId]);

  // Redaction
  const [redacted, setRedacted] = useState("");
  function buildRedacted() {
    const map = {
      pupilName,
      pupilInitials: pupilName?.split(/\s+/).map(p => p[0]).join(".") + ".",
      schoolName: school?.name,
    };
    setRedacted(redactDraft(fullText, map));
  }

  return (
    <Card className="border-indigo-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-indigo-600" />
          <p className="text-sm font-bold">EHCP Enhancements</p>
        </div>

        <Tabs defaultValue="thread">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="thread">Golden thread</TabsTrigger>
            <TabsTrigger value="tribunal">Tribunal score</TabsTrigger>
            <TabsTrigger value="ar">Annual review</TabsTrigger>
            <TabsTrigger value="la">LA pack</TabsTrigger>
            <TabsTrigger value="redact">Redact</TabsTrigger>
          </TabsList>

          {/* 1. Golden thread */}
          <TabsContent value="thread" className="space-y-2 pt-3">
            {issues.length === 0
              ? <div className="flex items-center gap-2 text-emerald-700 text-xs"><CheckCircle2 className="w-4 h-4" /> All Need → Outcome → Provision threads consistent.</div>
              : issues.map((iss, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{iss.message}</p>
                    <p className="text-amber-700/80 mt-0.5">"{iss.needText.slice(0, 90)}{iss.needText.length > 90 ? "…" : ""}"</p>
                  </div>
                </div>
              ))}
          </TabsContent>

          {/* 2. Tribunal score */}
          <TabsContent value="tribunal" className="space-y-2 pt-3">
            {scores.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No Section F provisions yet.</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {avg >= 80
                    ? <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    : avg >= 50
                      ? <ShieldAlert className="w-4 h-4 text-amber-500" />
                      : <ShieldAlert className="w-4 h-4 text-red-500" />}
                  <span className="text-xs">Average enforceability: <strong>{avg}/100</strong></span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {scores.map((s, i) => <ScoreCard key={i} s={s} />)}
                </div>
              </>
            )}
          </TabsContent>

          {/* 3. Annual review delta */}
          <TabsContent value="ar" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Paste last year's Section F to get a redline against this year's draft.</p>
            <Textarea
              rows={4}
              placeholder="Last year's Section F text…"
              value={lastYear}
              onChange={(e) => setLastYear(e.target.value)}
              className="text-xs"
            />
            {delta && (
              <div className="text-xs space-y-1.5 mt-2">
                <pre className="whitespace-pre-wrap text-[11px] bg-muted/40 rounded p-2">{delta.summary}</pre>
                {delta.added.length > 0 && (
                  <div>
                    <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-200 mb-1">+ Added ({delta.added.length})</Badge>
                    <ul className="text-[11px] list-disc pl-4">{delta.added.slice(0, 8).map((a, i) => <li key={i}>{a}</li>)}</ul>
                  </div>
                )}
                {delta.removed.length > 0 && (
                  <div>
                    <Badge className="text-[10px] bg-red-100 text-red-800 border-red-200 mb-1">− Removed ({delta.removed.length})</Badge>
                    <ul className="text-[11px] list-disc pl-4">{delta.removed.slice(0, 8).map((a, i) => <li key={i}>{a}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* 4. LA pack */}
          <TabsContent value="la" className="space-y-2 pt-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <p className="text-[11px] font-semibold">Local-authority pack</p>
            </div>
            <Select value={laPackId} onValueChange={setLaPackId}>
              <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {packs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {packCheck.warnings.length > 0 ? (
              <ul className="text-[11px] text-amber-700 list-disc pl-5 space-y-0.5">
                {packCheck.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            ) : laPackId !== "default" ? (
              <p className="text-[11px] text-emerald-700">No pack violations found.</p>
            ) : null}
            <p className="text-[10px] text-muted-foreground italic">
              Pack constraints are also passed into the AI prompt on the next regeneration.
            </p>
          </TabsContent>

          {/* 5. Redaction */}
          <TabsContent value="redact" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Generate a pseudonymised copy of the entire EHCP for emailing parents or external EPs without breaching UK-GDPR Article 9.
            </p>
            <Button size="sm" variant="outline" onClick={buildRedacted} className="gap-1.5">
              <EyeOff className="w-3.5 h-3.5" /> Build redacted copy
            </Button>
            {redacted && (
              <>
                <Textarea rows={6} value={redacted} readOnly className="text-[11px]" />
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(redacted); toast.success("Redacted draft copied"); }} className="gap-1.5">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ScoreCard({ s }: { s: ProvisionScore }) {
  const [rewrite, setRewrite] = useState<string | null>(null);
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 p-2 text-[11px] space-y-1">
      <p className="line-clamp-2">{s.text}</p>
      <div className="flex items-center gap-2 text-[10px] flex-wrap">
        <Badge className={s.specific.pass   ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-red-100 text-red-800 border-red-200"}>{s.specific.pass   ? "✓" : "✗"} Specific</Badge>
        <Badge className={s.quantified.pass ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-red-100 text-red-800 border-red-200"}>{s.quantified.pass ? "✓" : "✗"} Quantified</Badge>
        <Badge className={s.byWhomBy.pass   ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-red-100 text-red-800 border-red-200"}>{s.byWhomBy.pass   ? "✓" : "✗"} By whom + by when</Badge>
        <span className="ml-auto text-muted-foreground">{s.total}/100</span>
      </div>
      {!s.specific.pass && <p className="text-amber-700">{s.specific.detail}</p>}
      {!s.quantified.pass && <p className="text-amber-700">{s.quantified.detail}</p>}
      {!s.byWhomBy.pass && <p className="text-amber-700">{s.byWhomBy.detail}</p>}
      {s.total < 100 && (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[10px]"
          onClick={() => setRewrite(rewriteForEnforceability(s.text))}
        >
          Make enforceable →
        </Button>
      )}
      {rewrite && (
        <pre className="bg-emerald-50 border border-emerald-200 rounded p-1.5 whitespace-pre-wrap">{rewrite}</pre>
      )}
    </div>
  );
}
