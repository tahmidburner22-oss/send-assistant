/**
 * MtpEnhancementsPanel — embedded inside Medium-Term Planner page.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarRange, ArrowLeftRight, Grid3x3, Repeat2, Users, Wand2, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  type Mtp, type MtpRow,
  backwardsPlan, type BackwardsPlanInput,
  curriculumHeatmap, uncoveredObjectives,
  autoInsertRetrieval, retrievalQuestions,
  logChange, changeFeed, detectClashes,
  rowToLessonPlannerSeed,
} from "@/lib/mtp-enhancements";

interface Props {
  mtp: Mtp;
  ncObjectivesPool: string[];
  onUpdate?: (mtp: Mtp) => void;
  currentAuthor?: string;
}

export default function MtpEnhancementsPanel({ mtp, ncObjectivesPool, onUpdate, currentAuthor = "Teacher" }: Props) {
  const [, navigate] = useLocation();
  const [assessmentDate, setAssessmentDate] = useState("");
  const [assessmentDesc, setAssessmentDesc] = useState("");
  const [weeksAvailable, setWeeksAvailable] = useState(6);
  const [tick, setTick] = useState(0);

  const heatmap = useMemo(() => curriculumHeatmap(mtp.rows, ncObjectivesPool), [mtp.rows, ncObjectivesPool]);
  const uncovered = useMemo(() => uncoveredObjectives(mtp.rows, ncObjectivesPool), [mtp.rows, ncObjectivesPool]);
  const retrievals = useMemo(() => retrievalQuestions(mtp.rows), [mtp.rows]);
  const changes = useMemo(() => changeFeed(mtp.id), [mtp.id, tick]);
  const clashes = useMemo(() => detectClashes(mtp.rows), [mtp.rows]);

  function buildBackwards() {
    if (!assessmentDate || !assessmentDesc) { toast.error("Set assessment date + description."); return; }
    const input: BackwardsPlanInput = {
      assessmentDate,
      assessmentDescription: assessmentDesc,
      weeksAvailable,
      ncObjectivesToCover: ncObjectivesPool,
      startDate: mtp.rows[0]?.date || new Date().toISOString().slice(0, 10),
    };
    const rows = backwardsPlan(input);
    onUpdate?.({ ...mtp, rows });
    logChange({ mtpId: mtp.id, byAuthor: currentAuthor, description: `Built backwards plan from ${rows.length} weeks.` });
    setTick((t) => t + 1);
    toast.success("Backwards plan built — assessment week pinned.");
  }

  function injectRetrieval() {
    const rows = autoInsertRetrieval(mtp.rows);
    onUpdate?.({ ...mtp, rows });
    logChange({ mtpId: mtp.id, byAuthor: currentAuthor, description: "Auto-inserted retrieval slots." });
    setTick((t) => t + 1);
    toast.success(`Inserted retrieval links into ${rows.filter((r) => r.retrievalLink).length} rows.`);
  }

  function jumpToLesson(row: MtpRow) {
    const seed = rowToLessonPlannerSeed(row, { yearGroup: mtp.yearGroup, subject: mtp.subject });
    try {
      sessionStorage.setItem("adaptly_lesson_seed", JSON.stringify(seed));
    } catch {}
    navigate("/tools/lesson-planner");
    toast.success("Lesson Planner pre-filled from this week.");
  }

  return (
    <Card className="border-stone-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-stone-700" />
          <p className="text-sm font-bold">Medium-Term Planner Enhancements — {mtp.title}</p>
          {clashes.length > 0 && (
            <Badge variant="destructive" className="ml-auto gap-1 text-[10px]">
              <AlertTriangle className="w-3 h-3" /> {clashes.length} clash{clashes.length === 1 ? "" : "es"}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="backwards">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="backwards">Backwards plan</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            <TabsTrigger value="retrieval">Retrieval</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="bridge">Lesson bridge</TabsTrigger>
          </TabsList>

          <TabsContent value="backwards" className="space-y-2 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Assessment date</Label>
                <Input type="date" value={assessmentDate} onChange={(e) => setAssessmentDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Weeks available</Label>
                <Input type="number" min={2} max={12} value={weeksAvailable} onChange={(e) => setWeeksAvailable(Number(e.target.value))} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Assessment description</Label>
                <Textarea rows={2} value={assessmentDesc} onChange={(e) => setAssessmentDesc(e.target.value)} placeholder="End-of-unit test on simultaneous equations" />
              </div>
            </div>
            <Button size="sm" onClick={buildBackwards} className="gap-1.5"><ArrowLeftRight className="w-3.5 h-3.5" /> Plan backwards</Button>
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-2 pt-3">
            <div className="overflow-x-auto rounded-md border bg-muted/20 p-2">
              <table className="text-[10px] w-full">
                <thead><tr><th className="text-left pr-2">Wk</th>{ncObjectivesPool.map((o) => <th key={o} className="px-1">{o}</th>)}</tr></thead>
                <tbody>
                  {mtp.rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="pr-2 font-mono">{r.weekNumber}</td>
                      {ncObjectivesPool.map((o) => {
                        const cell = heatmap.find((c) => c.rowId === r.id && c.ncObjective === o);
                        return <td key={o} className="px-1 text-center">{cell?.covered ? "🟩" : "·"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {uncovered.length > 0 && (
              <p className="text-[11px] text-amber-700 flex items-start gap-1.5"><AlertTriangle className="w-3 h-3 mt-0.5" /> {uncovered.length} statutory objective{uncovered.length === 1 ? "" : "s"} not covered: {uncovered.join(", ")}</p>
            )}
          </TabsContent>

          <TabsContent value="retrieval" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Auto-insert retrieval links to a topic from 3 weeks earlier.</p>
            <Button size="sm" onClick={injectRetrieval} className="gap-1.5"><Repeat2 className="w-3.5 h-3.5" /> Auto-insert retrieval</Button>
            {retrievals.length > 0 && (
              <ul className="space-y-1 text-[11px] mt-2">
                {retrievals.slice(0, 6).map((r) => (
                  <li key={r.rowId} className="rounded-md border bg-muted/20 p-2">
                    <p className="text-muted-foreground"><Badge variant="outline" className="text-[9px] mr-1">retrieval</Badge> {r.fromTopic}</p>
                    <p>{r.proposedQuestion}</p>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Author list: {mtp.authors.join(", ") || "—"}. Below: change feed (last 30 events).</p>
            {clashes.length > 0 && (
              <ul className="text-[11px] space-y-1 mb-2">
                {clashes.map((c) => (
                  <li key={c.weekNumber} className="rounded-md border-rose-300 border bg-rose-50/50 p-2 text-rose-800">
                    Week {c.weekNumber}: {c.clashes.join(" / ")}
                  </li>
                ))}
              </ul>
            )}
            {changes.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">No changes logged yet.</p>
            ) : (
              <ul className="space-y-1 text-[11px] max-h-48 overflow-auto">
                {changes.map((c) => (
                  <li key={c.id} className="rounded-md border bg-muted/20 p-2">
                    <Badge variant="outline" className="text-[9px] mr-1">{c.byAuthor}</Badge>
                    {c.description}
                    <span className="text-muted-foreground"> · {new Date(c.at).toLocaleString("en-GB")}</span>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="bridge" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Tap any row to pre-fill the Lesson Planner with topic, date, NC objectives and prior-learning link.</p>
            <ul className="space-y-1 text-[11px] max-h-56 overflow-auto">
              {mtp.rows.map((r) => (
                <li key={r.id} className="rounded-md border bg-muted/20 p-2 flex items-center justify-between">
                  <span><span className="font-mono mr-1">W{r.weekNumber}</span> {r.topic}</span>
                  <Button size="sm" variant="outline" onClick={() => jumpToLesson(r)} className="gap-1.5"><Wand2 className="w-3 h-3" /> Plan</Button>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
