/**
 * LessonPlannerV2Panel — surfaces 5 second-wave Lesson Planner improvements
 * on top of the existing LessonPlannerEnhancementsPanel:
 *   1. 5-min slot timeline
 *   2. Resources auto-list
 *   3. Adaptive teaching matrix
 *   4. TA brief (one-page A4)
 *   5. MTP back-reference (jump to MTP unit/week)
 */
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Clock3, ListChecks, Grid3x3, ClipboardList, Link2, Printer, ArrowUpRight,
} from "lucide-react";
import {
  buildFiveMinTimeline, timelineHtml, type FiveMinSlot, type PlanPhaseInput,
  detectResources, resourcesChecklistHtml, type DetectedResource,
  buildAdaptiveMatrix, adaptiveMatrixHtml, MATRIX_PROFILES, type MatrixCell,
  buildTaBrief, taBriefHtml,
  findMtpBackReferences, backReferenceSummaryHtml, type MtpBackReference,
} from "@/lib/lesson-planner-v2-enhancements";

interface Props {
  topic: string;
  yearGroup: string;
  subject?: string;
  sendNeeds?: string;
  /** Plan phases (5–6 entries) parsed from the current LessonPlanData. */
  phases: PlanPhaseInput[];
  /** Concatenated plan text (used for resource detection + TA brief hints). */
  planText: string;
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

export default function LessonPlannerV2Panel({
  topic, yearGroup, subject, sendNeeds, phases, planText,
}: Props) {
  const [, navigate] = useLocation();
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>(MATRIX_PROFILES.slice(0, 4));

  const timeline: FiveMinSlot[] = useMemo(() => buildFiveMinTimeline(phases || []), [phases]);
  const resources: DetectedResource[] = useMemo(() => detectResources(planText || ""), [planText]);
  const matrix: MatrixCell[] = useMemo(() => buildAdaptiveMatrix(selectedProfiles), [selectedProfiles]);
  const brief = useMemo(
    () => buildTaBrief({ topic, yearGroup, planText: planText || "", sendNeeds }),
    [topic, yearGroup, planText, sendNeeds],
  );
  const backRefs: MtpBackReference[] = useMemo(
    () => findMtpBackReferences({ topic, subject, yearGroup }, 3),
    [topic, subject, yearGroup],
  );

  function toggleProfile(p: string) {
    setSelectedProfiles((curr) =>
      curr.includes(p) ? curr.filter((x) => x !== p) : [...curr, p],
    );
  }

  return (
    <Card className="border-blue-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock3 className="w-4 h-4 text-blue-600" />
          <p className="text-sm font-bold">Lesson Planner extras — {topic || "(no topic)"}</p>
        </div>

        <Tabs defaultValue="timeline">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="timeline"><Clock3 className="w-3.5 h-3.5 mr-1" />5-min slots</TabsTrigger>
            <TabsTrigger value="resources"><ListChecks className="w-3.5 h-3.5 mr-1" />Resources</TabsTrigger>
            <TabsTrigger value="matrix"><Grid3x3 className="w-3.5 h-3.5 mr-1" />Adaptive matrix</TabsTrigger>
            <TabsTrigger value="ta"><ClipboardList className="w-3.5 h-3.5 mr-1" />TA brief</TabsTrigger>
            <TabsTrigger value="mtp"><Link2 className="w-3.5 h-3.5 mr-1" />MTP link</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Slices the plan into 5-minute slots so a supply teacher can pace the lesson minute-by-minute.
              Each slot pairs the teacher action with the matching pupil step.
            </p>
            {timeline.length === 0 ? (
              <p className="text-[11px] italic text-muted-foreground">
                No phase data yet — generate the lesson plan first.
              </p>
            ) : (
              <>
                <div className="rounded-md border bg-white max-h-72 overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <thead className="bg-blue-50 sticky top-0">
                      <tr>
                        <th className="text-left p-1.5 w-16">Time</th>
                        <th className="text-left p-1.5 w-28">Phase</th>
                        <th className="text-left p-1.5">Teacher</th>
                        <th className="text-left p-1.5">Pupils</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeline.map((s) => (
                        <tr key={s.slotIndex} className="border-t border-blue-50">
                          <td className="p-1.5 font-mono">{Math.floor(s.startMin / 60)}:{(s.startMin % 60).toString().padStart(2, "0")}–{Math.floor(s.endMin / 60)}:{(s.endMin % 60).toString().padStart(2, "0")}</td>
                          <td className="p-1.5 text-blue-800">{s.phaseName}</td>
                          <td className="p-1.5">{s.activity}</td>
                          <td className="p-1.5 text-slate-600">{s.pupilDoing}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button size="sm" variant="outline" onClick={() => openPrint(timelineHtml(timeline, { topic, yearGroup }), `${topic} timeline`)} className="gap-1.5">
                  <Printer className="w-3.5 h-3.5" /> Print timeline
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="resources" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Auto-extracts every resource named in the plan (mini-whiteboards, slides, manipulatives…)
              and groups them by category — drop the printout on the resource trolley.
            </p>
            {resources.length === 0 ? (
              <p className="text-[11px] italic text-muted-foreground">
                No specific resources detected. Encourage the AI to name resources by adding them to the
                "Available Resources" form field.
              </p>
            ) : (
              <ul className="text-[11px] space-y-1 max-h-56 overflow-y-auto">
                {resources.map((r) => (
                  <li key={r.label} className="flex items-start gap-2">
                    <span className="text-blue-600">☐</span>
                    <span className="flex-1">{r.label}</span>
                    <Badge variant="outline" className="text-[9px]">{r.category}</Badge>
                    {r.occurrences > 1 && <span className="text-[10px] text-muted-foreground">×{r.occurrences}</span>}
                  </li>
                ))}
              </ul>
            )}
            <Button size="sm" variant="outline" disabled={resources.length === 0} onClick={() => openPrint(resourcesChecklistHtml(resources, { topic, yearGroup }), `${topic} resources`)} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print checklist
            </Button>
          </TabsContent>

          <TabsContent value="matrix" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              A 2D grid (Profile × Inputs/Tasks/Outputs/Environment) — the "what to actually change" reference
              for adaptive teaching. Pin to the back of the door.
            </p>
            <div className="flex flex-wrap gap-1 text-[10px]">
              <span className="text-muted-foreground self-center mr-1">Show:</span>
              {MATRIX_PROFILES.map((p) => {
                const active = selectedProfiles.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleProfile(p)}
                    className={`px-2 py-0.5 rounded border ${active ? "bg-purple-600 border-purple-600 text-white" : "border-purple-300 text-purple-700 bg-white"}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <div
              className="rounded-md border bg-white p-2 max-h-72 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: adaptiveMatrixHtml(matrix, { topic, yearGroup }) }}
            />
            <Button size="sm" variant="outline" disabled={matrix.length === 0} onClick={() => openPrint(adaptiveMatrixHtml(matrix, { topic, yearGroup }), `${topic} adaptive matrix`)} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print A3 matrix
            </Button>
          </TabsContent>

          <TabsContent value="ta" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              A one-page A4 brief for the TA / support staff: phrases to say, what to watch, scaffolds available,
              and (if you typed needs into the form) which pupils to prioritise.
            </p>
            <div className="rounded-md border bg-emerald-50/40 p-2 max-h-72 overflow-y-auto"
                 dangerouslySetInnerHTML={{ __html: taBriefHtml(brief) }} />
            <Button size="sm" variant="outline" onClick={() => openPrint(taBriefHtml(brief), `${topic} TA brief`)} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print TA brief
            </Button>
          </TabsContent>

          <TabsContent value="mtp" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Searches your saved Medium-Term Plans for the unit / week this lesson belongs to.
              Click <em>Open MTP</em> to jump back to it for sequencing context.
            </p>
            <div
              className="rounded-md border bg-white p-2"
              dangerouslySetInnerHTML={{ __html: backReferenceSummaryHtml(backRefs) }}
            />
            {backRefs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {backRefs.map((r) => (
                  <Button key={`${r.mtpId}-${r.weekNumber}`} size="sm" variant="outline"
                    onClick={() => navigate(r.jumpHref)} className="gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {r.mtpTitle} · Wk {r.weekNumber}
                  </Button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
