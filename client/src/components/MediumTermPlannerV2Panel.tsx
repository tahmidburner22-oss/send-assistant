/**
 * MediumTermPlannerV2Panel — surfaces 5 second-wave MTP improvements on top of
 * the existing MtpEnhancementsPanel:
 *   1. Prior / next learning bridge
 *   2. Knowledge organiser spinoff (1-pager)
 *   3. Lesson-titles fast pass
 *   4. Tracking grid (pupils × objectives, RAG)
 *   5. Cross-curricular suggestions
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeftRight, BookOpen, ListTree, Grid3x3, Sparkles, Printer, Loader2,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import {
  buildLearningBridge, bridgeHtml,
  deriveKnowledgeOrganiser, knowledgeOrganiserHtml,
  extractLessonTitles, lessonTitlesHtml,
  loadTracking, initTracking, setTrackingCell, summariseTracking,
  type RagStatus, type TrackingGridState,
  suggestCrossCurricular, aiCrossCurricular, crossCurricularHtml,
  type CrossCurricularLink,
} from "@/lib/mtp-v2-enhancements";

interface Props {
  result: string;            // The generated MTP text
  values: Record<string, string>;  // Form values (subject, yearGroup, topic, term, weeks, lessonsPerWeek)
}

function openPrint(html: string, title: string): void {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) {
    toast.error("Pop-up blocked — allow pop-ups to print.");
    return;
  }
  w.document.write(`<!doctype html><html><head><title>${title}</title></head><body>${html}<script>window.print();<\/script></body></html>`);
  w.document.close();
}

function ragColour(status: RagStatus): string {
  if (status === "R") return "bg-rose-500 text-white";
  if (status === "A") return "bg-amber-400 text-slate-900";
  if (status === "G") return "bg-emerald-500 text-white";
  return "bg-white text-slate-400";
}

function nextRag(status: RagStatus): RagStatus {
  if (status === "") return "R";
  if (status === "R") return "A";
  if (status === "A") return "G";
  return "";
}

export default function MediumTermPlannerV2Panel({ result, values }: Props) {
  const { children } = useApp();
  const subject = values.subject || "";
  const yearGroup = values.yearGroup || "";
  const topic = values.topic || "";
  const term = values.term || "";
  const unitTitle = `${topic || subject} (${yearGroup})`.trim();

  // Lesson titles (used as objectives default for tracking)
  const titles = useMemo(() => extractLessonTitles(result || ""), [result]);

  // Bridge
  const bridge = useMemo(() => buildLearningBridge({
    subject, yearGroup, termTag: term,
    currentTitle: unitTitle,
    currentTopics: titles.slice(0, 3).map((t) => t.title),
  }), [subject, yearGroup, term, unitTitle, titles]);

  // Knowledge organiser
  const ko = useMemo(() => deriveKnowledgeOrganiser({ unitTitle, yearGroup, mtpText: result || "" }), [unitTitle, yearGroup, result]);

  // Tracking grid
  const mtpId = `${subject}__${yearGroup}__${topic}__${term}`.replace(/\s+/g, "_") || "mtp_default";
  const [tracking, setTracking] = useState<TrackingGridState | null>(() => loadTracking(mtpId));
  useEffect(() => {
    setTracking(loadTracking(mtpId));
  }, [mtpId]);

  function startTracking() {
    if (children.length === 0) {
      toast.error("Add pupils to your class first.");
      return;
    }
    if (titles.length === 0) {
      toast.error("Generate the MTP first so we can extract lesson objectives.");
      return;
    }
    const objectives = titles.slice(0, 12).map((t) => `Wk${t.weekNumber}.${t.lessonInWeek} — ${t.title}`);
    const t = initTracking({
      mtpId,
      pupils: children.map((c) => ({ id: c.id, name: c.name })),
      objectives,
    });
    setTracking(t);
    toast.success("Tracking grid initialised. Click cells to cycle ⬜→R→A→G→⬜.");
  }

  function cycleCell(pupilId: string, objective: string) {
    if (!tracking) return;
    const cur = tracking.cells.find((c) => c.pupilId === pupilId && c.objective === objective);
    const updated = setTrackingCell(tracking, pupilId, objective, nextRag(cur?.status || ""));
    setTracking(updated);
  }

  const trackingSummary = useMemo(() => tracking ? summariseTracking(tracking) : null, [tracking]);

  // Cross-curricular
  const [crossLinks, setCrossLinks] = useState<CrossCurricularLink[]>(() => suggestCrossCurricular(topic, 6));
  const [crossLoading, setCrossLoading] = useState(false);
  useEffect(() => {
    setCrossLinks(suggestCrossCurricular(topic, 6));
  }, [topic]);

  async function regenerateCrossWithAi() {
    if (!topic) {
      toast.error("Add a topic first.");
      return;
    }
    setCrossLoading(true);
    try {
      const links = await aiCrossCurricular({ topic, yearGroup, subject });
      if (links && links.length > 0) {
        setCrossLinks(links);
        toast.success(`Suggested ${links.length} AI cross-curricular hooks.`);
      } else {
        toast("No AI suggestions returned — keeping deterministic list.");
      }
    } catch {
      toast.error("AI request failed — using built-in library.");
    }
    setCrossLoading(false);
  }

  return (
    <Card className="border-emerald-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-emerald-700" />
          <p className="text-sm font-bold">MTP extras — {unitTitle || "(no unit yet)"}</p>
        </div>

        <Tabs defaultValue="bridge">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="bridge"><ArrowLeftRight className="w-3.5 h-3.5 mr-1" />Prior/Next</TabsTrigger>
            <TabsTrigger value="ko"><BookOpen className="w-3.5 h-3.5 mr-1" />Knowledge organiser</TabsTrigger>
            <TabsTrigger value="titles"><ListTree className="w-3.5 h-3.5 mr-1" />Titles fast-pass</TabsTrigger>
            <TabsTrigger value="tracking"><Grid3x3 className="w-3.5 h-3.5 mr-1" />Tracking grid</TabsTrigger>
            <TabsTrigger value="cross"><Sparkles className="w-3.5 h-3.5 mr-1" />Cross-curricular</TabsTrigger>
          </TabsList>

          <TabsContent value="bridge" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Shows the unit before and after this one for the same subject + year group, drawn from your saved MTPs.
              Save this MTP from the main panel for it to participate in the chain.
            </p>
            <div
              className="rounded-md border bg-white p-2 max-h-72 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: bridgeHtml(bridge) }}
            />
            <Button size="sm" variant="outline" onClick={() => openPrint(bridgeHtml(bridge), `${unitTitle} bridge`)} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print bridge
            </Button>
          </TabsContent>

          <TabsContent value="ko" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              A 1-page knowledge organiser auto-built from the MTP — vocabulary, key facts, sticky questions, diagram slot.
              Print A3 landscape and fold for pupil books.
            </p>
            <div className="text-[11px] flex gap-3 flex-wrap">
              <Badge variant="outline">{ko.vocabulary.length} vocab</Badge>
              <Badge variant="outline">{ko.keyFacts.length} key facts</Badge>
              <Badge variant="outline">{ko.stickyQuestions.length} sticky Qs</Badge>
              {ko.diagramHint && <Badge variant="outline">Diagram suggested</Badge>}
            </div>
            <div
              className="rounded-md border bg-white p-2 max-h-72 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: knowledgeOrganiserHtml(ko) }}
            />
            <Button size="sm" variant="outline" onClick={() => openPrint(knowledgeOrganiserHtml(ko), `${unitTitle} KO`)} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print A3 organiser
            </Button>
          </TabsContent>

          <TabsContent value="titles" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              A titles-only outline of every lesson in the unit so SLT or a parents' evening conversation can hit the highlights in 30 seconds.
            </p>
            {titles.length === 0 ? (
              <p className="text-[11px] italic text-muted-foreground">
                No lesson titles detected. Generate the MTP — titles auto-extract from the standard lesson markers.
              </p>
            ) : (
              <div
                className="rounded-md border bg-white p-2 max-h-72 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: lessonTitlesHtml(titles, unitTitle) }}
              />
            )}
            <Button size="sm" variant="outline" disabled={titles.length === 0} onClick={() => openPrint(lessonTitlesHtml(titles, unitTitle), `${unitTitle} titles`)} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print titles outline
            </Button>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              RAG grid (pupils × lesson objectives) — click a cell to cycle through ⬜ → R → A → G → ⬜. Saved locally, surfaces gap-analysis at unit close.
            </p>
            {!tracking ? (
              <Button size="sm" onClick={startTracking}>
                <Grid3x3 className="w-3.5 h-3.5 mr-1" /> Initialise tracking grid
              </Button>
            ) : (
              <>
                {trackingSummary && (
                  <div className="text-[11px] flex gap-2 flex-wrap">
                    <Badge className="bg-rose-100 text-rose-700 border-rose-300">{trackingSummary.red} red</Badge>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300">{trackingSummary.amber} amber</Badge>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">{trackingSummary.green} green</Badge>
                    <Badge variant="outline">{trackingSummary.totalCells} cells total</Badge>
                  </div>
                )}
                <div className="overflow-x-auto rounded-md border bg-white max-h-72">
                  <table className="text-[10px] border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-1 sticky left-0 bg-emerald-50 z-10">Pupil</th>
                        {tracking.objectives.map((o) => (
                          <th key={o} className="px-1 py-1 text-emerald-800 font-semibold whitespace-nowrap" title={o}>
                            {o.length > 24 ? o.slice(0, 24) + "…" : o}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tracking.pupils.map((p) => (
                        <tr key={p.id} className="border-t border-emerald-50">
                          <td className="p-1 sticky left-0 bg-white whitespace-nowrap pr-2 font-semibold">{p.name}</td>
                          {tracking.objectives.map((o) => {
                            const cell = tracking.cells.find((c) => c.pupilId === p.id && c.objective === o);
                            const status = cell?.status || "";
                            return (
                              <td key={o} className="p-0.5">
                                <button
                                  type="button"
                                  onClick={() => cycleCell(p.id, o)}
                                  className={`w-7 h-6 rounded border border-slate-200 text-[10px] font-bold ${ragColour(status)}`}
                                  aria-label={`${p.name} - ${o}`}
                                >
                                  {status || "·"}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {trackingSummary && trackingSummary.pupilsWithGap.length > 0 && (
                  <details className="text-[11px]">
                    <summary className="cursor-pointer text-rose-700 font-semibold">
                      {trackingSummary.pupilsWithGap.length} pupil(s) with red gaps
                    </summary>
                    <ul className="mt-1 space-y-1 pl-4 list-disc">
                      {trackingSummary.pupilsWithGap.map((g) => (
                        <li key={g.pupilId}>
                          <strong>{g.pupilName}</strong>: {g.gapObjectives.join("; ")}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="cross" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              4–6 cross-subject hooks for this unit. Use the AI button if the deterministic suggestions feel too generic.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={regenerateCrossWithAi} disabled={crossLoading} className="gap-1.5">
                {crossLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Thinking…</> : <><Sparkles className="w-3.5 h-3.5" />AI re-suggest</>}
              </Button>
              <Button size="sm" variant="outline" onClick={() => openPrint(crossCurricularHtml(crossLinks, topic || unitTitle), `${unitTitle} cross-curricular`)} className="gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
            </div>
            <ul className="text-[11px] space-y-1 max-h-56 overflow-y-auto">
              {crossLinks.map((l, i) => (
                <li key={`${l.subject}-${i}`} className="rounded border border-purple-100 bg-purple-50/40 p-2">
                  <strong className="text-purple-800">{l.subject}:</strong> <span className="text-slate-800">{l.hook}</span>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
