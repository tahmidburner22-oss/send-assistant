/**
 * IepV2Panel — surfaces 5 improvements on top of the existing IEP / EHCP
 * generator: section reviewer checklist, evidence-to-section traceability,
 * provision costing, One Page Profile derivation, plain-English co-prod pack.
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ListChecks, Link2, Banknote, IdCard, BookOpen, Loader2, Plus, Trash2 } from "lucide-react";
import {
  loadReviews,
  setReview,
  clearReview,
  type ReviewerRole,
  type SectionReview,
  pinEvidence,
  listEvidencePins,
  deleteEvidencePin,
  suggestPins,
  loadCosts,
  saveCost,
  deleteCost,
  totalAnnualCost,
  costsTableHtml,
  suggestProvisionLabels,
  annualCost,
  type ProvisionCost,
  deriveOnePageProfile,
  onePageProfileHtml,
  type OnePageProfile,
  buildPlainEnglishPack,
  plainPackHtml,
  type PlainEnglishPack,
} from "@/lib/iep-v2-enhancements";

interface Props {
  pupilId: string;
  pupilName: string;
  /** Map of section code → text content (e.g. {"A":"...", "B":"..."}). */
  sections: Record<string, string>;
  /** Aggregated source-evidence text (uploaded reports + manual notes). */
  sourceText: string;
}

const SECTION_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "K"];

const REVIEWER_LABELS: Record<ReviewerRole, string> = {
  parent: "Parent",
  senco: "SENCO",
  class_teacher: "Class teacher",
};

export default function IepV2Panel({ pupilId, pupilName, sections, sourceText }: Props) {
  const [tick, setTick] = useState(0);

  // ── Reviewer checklist ──
  const reviews = useMemo(() => loadReviews(pupilId), [pupilId, tick]);
  const reviewMap = useMemo(() => {
    const map: Record<string, Record<ReviewerRole, SectionReview | undefined>> = {};
    for (const code of SECTION_ORDER) map[code] = { parent: undefined, senco: undefined, class_teacher: undefined };
    for (const r of reviews) {
      if (map[r.sectionCode]) map[r.sectionCode][r.reviewer] = r;
    }
    return map;
  }, [reviews]);

  function toggleReview(code: string, role: ReviewerRole) {
    const existing = reviewMap[code]?.[role];
    if (existing) {
      clearReview(pupilId, code, role);
    } else {
      setReview({
        pupilId,
        sectionCode: code,
        reviewer: role,
        reviewedAt: new Date().toISOString(),
      });
    }
    setTick((t) => t + 1);
  }

  // ── Evidence traceability ──
  const [pinSection, setPinSection] = useState("B");
  const allPins = useMemo(() => listEvidencePins(pupilId), [pupilId, tick]);
  const suggestions = useMemo(() => {
    const sectionText = sections[pinSection] || "";
    if (!sectionText || !sourceText) return [];
    return suggestPins(sectionText, sourceText, 6);
  }, [sections, sourceText, pinSection]);

  function pinSuggestion(generated: string, source: string) {
    if (!pupilId) {
      toast.error("Pick a pupil scope first.");
      return;
    }
    pinEvidence({
      pupilId,
      sectionCode: pinSection,
      generatedSentence: generated,
      sourceQuote: source,
    });
    setTick((t) => t + 1);
    toast.success("Evidence pinned.");
  }

  // ── Provision costing ──
  const costs = useMemo(() => loadCosts(pupilId), [pupilId, tick]);
  const annualBudget = useMemo(() => totalAnnualCost(pupilId), [pupilId, tick]);
  const sectionFLabels = useMemo(() => suggestProvisionLabels(sections.F || "", 8), [sections]);
  const [costDraft, setCostDraft] = useState<Partial<ProvisionCost>>({
    provisionLabel: "",
    hoursPerWeek: 1,
    weeksPerYear: 38,
    costPerHour: 25,
  });

  function addCost() {
    if (!pupilId) {
      toast.error("Pick a pupil scope first.");
      return;
    }
    if (!costDraft.provisionLabel?.trim()) {
      toast.error("Enter a provision label.");
      return;
    }
    saveCost({
      pupilId,
      provisionLabel: costDraft.provisionLabel.trim(),
      hoursPerWeek: Number(costDraft.hoursPerWeek) || 0,
      weeksPerYear: Number(costDraft.weeksPerYear) || 38,
      costPerHour: Number(costDraft.costPerHour) || 0,
    });
    setCostDraft({ provisionLabel: "", hoursPerWeek: 1, weeksPerYear: 38, costPerHour: 25 });
    setTick((t) => t + 1);
    toast.success("Provision costed.");
  }

  function removeCost(label: string) {
    deleteCost(pupilId, label);
    setTick((t) => t + 1);
  }

  function printCosts() {
    if (costs.length === 0) {
      toast.error("Add at least one provision first.");
      return;
    }
    const html = costsTableHtml(pupilName, costs);
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${pupilName} costs</title></head><body>${html}<script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  // ── One Page Profile ──
  const [opp, setOpp] = useState<OnePageProfile | null>(null);
  const [oppLoading, setOppLoading] = useState(false);
  async function genOpp() {
    if (!sections.A || !sections.B) {
      toast.error("Generate Sections A and B first.");
      return;
    }
    setOppLoading(true);
    try {
      const profile = await deriveOnePageProfile({ pupilName, sectionA: sections.A, sectionB: sections.B });
      setOpp(profile);
      toast.success("One Page Profile derived.");
    } catch {
      toast.error("Could not generate One Page Profile.");
    }
    setOppLoading(false);
  }
  function printOpp() {
    if (!opp) return;
    const html = onePageProfileHtml(pupilName, opp);
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${pupilName} OPP</title></head><body>${html}<script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  // ── Plain-English pack ──
  const [pack, setPack] = useState<PlainEnglishPack | null>(null);
  const [packLoading, setPackLoading] = useState(false);
  async function genPack() {
    if (!sections.A || !sections.B) {
      toast.error("Generate Sections A and B first.");
      return;
    }
    setPackLoading(true);
    try {
      const out = await buildPlainEnglishPack({ pupilName, sectionA: sections.A, sectionB: sections.B });
      setPack(out);
      toast.success("Plain-English pack generated.");
    } catch {
      toast.error("Could not generate plain-English pack.");
    }
    setPackLoading(false);
  }
  function printPack() {
    if (!pack) return;
    const html = plainPackHtml(pupilName, pack);
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${pupilName} plain pack</title></head><body>${html}<script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  useEffect(() => { setOpp(null); setPack(null); }, [pupilId]);

  return (
    <Card className="border-indigo-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-indigo-600" />
          <p className="text-sm font-bold">EHCP / IEP extras — {pupilName || "(no pupil)"}</p>
        </div>

        <Tabs defaultValue="reviewers">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="reviewers"><ListChecks className="w-3.5 h-3.5 mr-1" />Reviewers</TabsTrigger>
            <TabsTrigger value="evidence"><Link2 className="w-3.5 h-3.5 mr-1" />Evidence pins</TabsTrigger>
            <TabsTrigger value="costing"><Banknote className="w-3.5 h-3.5 mr-1" />Costing</TabsTrigger>
            <TabsTrigger value="opp"><IdCard className="w-3.5 h-3.5 mr-1" />One Page Profile</TabsTrigger>
            <TabsTrigger value="plain"><BookOpen className="w-3.5 h-3.5 mr-1" />Plain-English</TabsTrigger>
          </TabsList>

          <TabsContent value="reviewers" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Tri-checkbox per section — Parent / SENCO / Class teacher. Stored locally; carries
              into the annual review meeting.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-left text-indigo-700">
                    <th className="py-1">Section</th>
                    {(Object.keys(REVIEWER_LABELS) as ReviewerRole[]).map((r) => (
                      <th key={r} className="py-1 px-2 text-center">{REVIEWER_LABELS[r]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SECTION_ORDER.map((code) => (
                    <tr key={code} className="border-t border-indigo-100">
                      <td className="py-1.5 pr-3 font-semibold">Section {code}</td>
                      {(Object.keys(REVIEWER_LABELS) as ReviewerRole[]).map((r) => {
                        const reviewed = !!reviewMap[code]?.[r];
                        return (
                          <td key={r} className="py-1.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => toggleReview(code, r)}
                              className={`w-6 h-6 rounded border ${reviewed ? "bg-indigo-600 border-indigo-600 text-white" : "border-indigo-300 bg-white"}`}
                              aria-label={`Mark Section ${code} reviewed by ${REVIEWER_LABELS[r]}`}
                            >
                              {reviewed ? "✓" : ""}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="evidence" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Pin source-quotes from uploaded reports against generated needs/provisions. Builds a
              tribunal-ready audit trail.
            </p>
            <div className="flex gap-2 items-center">
              <span className="text-[11px]">Section:</span>
              {SECTION_ORDER.map((code) => (
                <button
                  key={code}
                  onClick={() => setPinSection(code)}
                  className={`px-2 py-0.5 rounded border text-[10px] ${pinSection === code ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300"}`}
                >
                  {code}
                </button>
              ))}
            </div>
            {suggestions.length === 0 ? (
              <p className="text-[11px] italic text-muted-foreground">
                No suggestions for Section {pinSection}. Generate the section and ensure source evidence is uploaded.
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <div key={i} className="rounded-md border bg-slate-50 p-2 text-[11px]">
                    <div className="font-semibold text-indigo-900">Generated:</div>
                    <div>{s.generatedSentence}</div>
                    <div className="mt-1 font-semibold text-emerald-900">Source quote (match {s.matchScore}):</div>
                    <div className="italic text-slate-700">"{s.candidateSourceQuote}"</div>
                    <Button size="sm" variant="outline" className="mt-2 gap-1.5"
                      onClick={() => pinSuggestion(s.generatedSentence, s.candidateSourceQuote)}>
                      <Plus className="w-3 h-3" /> Pin
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {allPins.length > 0 && (
              <details className="text-[11px]">
                <summary className="cursor-pointer text-indigo-700 font-semibold">Pinned ({allPins.length})</summary>
                <ul className="mt-1 space-y-1 max-h-48 overflow-y-auto">
                  {allPins.map((p) => (
                    <li key={p.id} className="rounded border bg-white p-2">
                      <Badge variant="outline" className="text-[10px] mr-1">§{p.sectionCode}</Badge>
                      <span className="text-foreground/80">{p.generatedSentence.slice(0, 90)}</span>
                      <div className="italic text-slate-600 mt-1">"{p.sourceQuote.slice(0, 110)}"</div>
                      <button type="button" onClick={() => { deleteEvidencePin(p.id); setTick((t) => t + 1); }} className="text-rose-600 text-[10px] mt-1">
                        <Trash2 className="w-3 h-3 inline mr-0.5" /> Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </TabsContent>

          <TabsContent value="costing" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Add £/hr against each provision; the panel auto-totals annual budget for LA caseworkers.
            </p>
            {sectionFLabels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1 text-[10px]">
                <span className="text-muted-foreground">Detected from Section F:</span>
                {sectionFLabels.map((label) => (
                  <button
                    key={label}
                    onClick={() => setCostDraft((s) => ({ ...s, provisionLabel: label }))}
                    className="px-2 py-0.5 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    {label.slice(0, 30)}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
              <Input
                value={costDraft.provisionLabel || ""}
                onChange={(e) => setCostDraft((s) => ({ ...s, provisionLabel: e.target.value }))}
                placeholder="Label (e.g. 1:1 reading TA)"
                className="text-xs col-span-2 sm:col-span-2"
              />
              <Input
                type="number" min={0} step={0.5}
                value={costDraft.hoursPerWeek ?? 0}
                onChange={(e) => setCostDraft((s) => ({ ...s, hoursPerWeek: parseFloat(e.target.value) || 0 }))}
                placeholder="Hrs/wk"
                className="text-xs"
              />
              <Input
                type="number" min={0} step={1}
                value={costDraft.weeksPerYear ?? 38}
                onChange={(e) => setCostDraft((s) => ({ ...s, weeksPerYear: parseFloat(e.target.value) || 0 }))}
                placeholder="Wks/yr"
                className="text-xs"
              />
              <Input
                type="number" min={0} step={0.01}
                value={costDraft.costPerHour ?? 0}
                onChange={(e) => setCostDraft((s) => ({ ...s, costPerHour: parseFloat(e.target.value) || 0 }))}
                placeholder="£/hr"
                className="text-xs"
              />
              <Button size="sm" onClick={addCost} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>
            {costs.length > 0 && (
              <div className="rounded-md border bg-white max-h-48 overflow-y-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr><th className="text-left p-1.5">Provision</th><th>Hrs/wk</th><th>£/hr</th><th>Annual</th><th></th></tr>
                  </thead>
                  <tbody>
                    {costs.map((c) => (
                      <tr key={c.provisionLabel} className="border-t">
                        <td className="p-1.5">{c.provisionLabel}</td>
                        <td className="text-center">{c.hoursPerWeek}</td>
                        <td className="text-center">£{c.costPerHour.toFixed(2)}</td>
                        <td className="text-right font-semibold">£{annualCost(c).toFixed(2)}</td>
                        <td><button onClick={() => removeCost(c.provisionLabel)} className="text-rose-600"><Trash2 className="w-3 h-3" /></button></td>
                      </tr>
                    ))}
                    <tr className="bg-amber-50 font-bold">
                      <td colSpan={3} className="p-1.5 text-right">Total annual</td>
                      <td className="text-right">£{annualBudget.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <Button size="sm" variant="outline" onClick={printCosts} disabled={costs.length === 0}>
              Print costing table
            </Button>
          </TabsContent>

          <TabsContent value="opp" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Generates a person-centred One Page Profile from Sections A &amp; B —
              same evidence, two artefacts.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={genOpp} disabled={oppLoading}>
                {oppLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />Deriving…</> : <><IdCard className="w-3.5 h-3.5 mr-1" />Derive profile</>}
              </Button>
              {opp && <Button size="sm" variant="outline" onClick={printOpp}>Print A4 profile</Button>}
            </div>
            {opp && (
              <div
                className="rounded-md border bg-white p-2 max-h-72 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: onePageProfileHtml(pupilName, opp) }}
              />
            )}
          </TabsContent>

          <TabsContent value="plain" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Re-writes Sections A &amp; B at UK reading age 9 for parents, alongside the formal plan.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={genPack} disabled={packLoading}>
                {packLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />Rewriting…</> : <><BookOpen className="w-3.5 h-3.5 mr-1" />Generate pack</>}
              </Button>
              {pack && <Button size="sm" variant="outline" onClick={printPack}>Print pack</Button>}
            </div>
            {pack && (
              <div
                className="rounded-md border bg-emerald-50 p-2 max-h-72 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: plainPackHtml(pupilName, pack) }}
              />
            )}
          </TabsContent>
        </Tabs>
        <Textarea className="hidden" value="" readOnly />
      </CardContent>
    </Card>
  );
}
