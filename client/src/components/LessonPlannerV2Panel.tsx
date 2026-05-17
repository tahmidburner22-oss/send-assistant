/**
 * LessonPlannerV2Panel — surfaces the second wave of Lesson Planner
 * improvements: 5-min slot timeline, resources auto-list, adaptive teaching
 * matrix, TA briefing card, and MTP back-reference.
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Clock, ListChecks, Grid3x3, Users, Link2, Printer } from "lucide-react";
import {
  buildTimeline,
  timelineHtml,
  extractResources,
  buildAdaptiveMatrix,
  matrixHtml,
  buildTaBriefing,
  taBriefingHtml,
  findMtpReference,
  mtpReferenceBadgeHtml,
  type MtpReference,
} from "@/lib/lesson-planner-v2-enhancements";

interface PlanShape {
  phases: { name: string; mins: number; teacherSteps: string[]; pupilSteps: string[]; differentiation: string }[];
  vocab: { term: string; definition: string }[];
  sendAdaptations: string;
}

interface Props {
  plan: PlanShape;
  rawText: string;             // full plan text for the resource scanner
  topic: string;
  yearGroup: string;
  subject: string;
}

export default function LessonPlannerV2Panel({ plan, rawText, topic, yearGroup, subject }: Props) {
  const [pupilFocus, setPupilFocus] = useState("");
  const [seatingNote, setSeatingNote] = useState("");
  const [mtpRef, setMtpRef] = useState<MtpReference | null>(null);

  const timeline = useMemo(
    () => buildTimeline(plan.phases.map((p) => ({ name: p.name, mins: p.mins }))),
    [plan.phases],
  );

  const resources = useMemo(() => extractResources(rawText), [rawText]);

  const matrixCells = useMemo(() => {
    const text = [
      plan.sendAdaptations,
      ...plan.phases.map((p) => p.differentiation),
    ].join(" ");
    return buildAdaptiveMatrix(text);
  }, [plan]);

  const briefing = useMemo(
    () => buildTaBriefing({
      vocab: plan.vocab,
      phases: plan.phases,
      sendAdaptations: plan.sendAdaptations,
      pupilFocus,
      seatingNote,
    }),
    [plan, pupilFocus, seatingNote],
  );

  useEffect(() => {
    if (!topic || !yearGroup) {
      setMtpRef(null);
      return;
    }
    setMtpRef(findMtpReference({ topic, yearGroup, subject }));
  }, [topic, yearGroup, subject]);

  function printTimeline() {
    const html = timelineHtml(timeline);
    const w = window.open("", "_blank", "width=900,height=300");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${topic} timeline</title></head><body>${html}<script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  function printMatrix() {
    const w = window.open("", "_blank", "width=900,height=600");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${topic} adaptive matrix</title></head><body>${matrixHtml(matrixCells)}<script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  function printBriefing() {
    const html = taBriefingHtml(briefing, `${subject} \u2014 ${topic} (${yearGroup})`);
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>TA briefing</title></head><body>${html}<script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  function copyResourceList() {
    if (resources.length === 0) {
      toast.error("No resources detected in the plan.");
      return;
    }
    const lines = resources.map((r) => `- [ ] ${r.label}`).join("\n");
    navigator.clipboard.writeText(`Resources for ${topic} (${yearGroup}):\n${lines}`);
    toast.success(`${resources.length} resource items copied.`);
  }

  return (
    <Card className="border-blue-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Clock className="w-4 h-4 text-blue-600" />
          <p className="text-sm font-bold">Lesson plan extras</p>
          {mtpRef && (
            <span dangerouslySetInnerHTML={{ __html: mtpReferenceBadgeHtml(mtpRef) }} />
          )}
        </div>

        <Tabs defaultValue="timeline">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="timeline"><Clock className="w-3.5 h-3.5 mr-1" />Timeline</TabsTrigger>
            <TabsTrigger value="resources"><ListChecks className="w-3.5 h-3.5 mr-1" />Resources</TabsTrigger>
            <TabsTrigger value="matrix"><Grid3x3 className="w-3.5 h-3.5 mr-1" />Matrix</TabsTrigger>
            <TabsTrigger value="ta"><Users className="w-3.5 h-3.5 mr-1" />TA brief</TabsTrigger>
            <TabsTrigger value="mtp"><Link2 className="w-3.5 h-3.5 mr-1" />MTP link</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Horizontal timeline of the lesson with 5-minute markers. Block widths are proportional to planned time.
            </p>
            <div
              className="rounded-md border bg-white p-3"
              dangerouslySetInnerHTML={{ __html: timelineHtml(timeline) }}
            />
            <Button size="sm" variant="outline" onClick={printTimeline} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print timeline strip
            </Button>
          </TabsContent>

          <TabsContent value="resources" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Resources mentioned anywhere in the generated plan, ranked by frequency.
              Tick-list ready to copy onto the prep board.
            </p>
            {resources.length === 0 ? (
              <p className="text-[11px] italic text-muted-foreground">No resources auto-detected.</p>
            ) : (
              <ul className="grid sm:grid-cols-2 gap-1 text-[11px]">
                {resources.map((r) => (
                  <li key={r.label} className="flex items-center gap-2 px-2 py-1 rounded border border-blue-100 bg-blue-50">
                    <input type="checkbox" disabled className="rounded" />
                    <span className="flex-1">{r.label}</span>
                    <Badge variant="outline" className="text-[10px]">{r.occurrences}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Button size="sm" variant="outline" onClick={copyResourceList} disabled={resources.length === 0}>
              Copy as tick-list
            </Button>
          </TabsContent>

          <TabsContent value="matrix" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              4 modalities x 3 attainment tiers. Cells show suggestions extracted from the plan,
              with curated fallbacks where the plan doesn\u2019t cover that combination.
            </p>
            <div
              className="rounded-md border bg-white p-2 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: matrixHtml(matrixCells) }}
            />
            <Button size="sm" variant="outline" onClick={printMatrix} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print matrix
            </Button>
          </TabsContent>

          <TabsContent value="ta" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              One-page briefing for the TA / LSA \u2014 pupils to focus on, vocab to pre-teach,
              scaffolds available, and what to do at each phase.
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Pupils to focus on</label>
                <Textarea
                  value={pupilFocus}
                  onChange={(e) => setPupilFocus(e.target.value)}
                  placeholder="e.g. M.W. (ASD), J.S. (ADHD)\u2014 comma or new-line separated"
                  className="text-xs min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Seating note (optional)</label>
                <Input
                  value={seatingNote}
                  onChange={(e) => setSeatingNote(e.target.value)}
                  placeholder="e.g. Sit M.W. at front near door"
                  className="text-xs h-8"
                />
              </div>
            </div>
            <div
              className="rounded-md border bg-white p-2 max-h-72 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: taBriefingHtml(briefing, `${subject} \u2014 ${topic} (${yearGroup})`) }}
            />
            <Button size="sm" variant="outline" onClick={printBriefing} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print TA briefing
            </Button>
          </TabsContent>

          <TabsContent value="mtp" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Looks up your locally saved Medium-Term Plans and reports the position of this lesson
              within its unit.
            </p>
            {mtpRef ? (
              <div className="rounded-md border bg-indigo-50 p-3 text-[12px] space-y-1">
                <div><strong>Unit:</strong> {mtpRef.unitTitle}</div>
                <div><strong>Term:</strong> {mtpRef.termTag}</div>
                <div><strong>Lesson:</strong> {mtpRef.lessonNumber} of {mtpRef.totalLessons}</div>
                {mtpRef.date && <div><strong>Scheduled date:</strong> {mtpRef.date}</div>}
              </div>
            ) : (
              <p className="text-[11px] italic text-muted-foreground">
                No matching MTP found. Generate a Medium-Term Plan first and the bridge will appear here automatically.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
