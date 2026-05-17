/**
 * MtpV2Panel — surfaces the second wave of MTP improvements: prior/next
 * learning bridge inputs, knowledge organiser spinoff, lesson-titles fast
 * pass, tracking grid, and cross-curricular suggestions.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, GitBranch, BookOpen, ListOrdered, Grid, Sparkles } from "lucide-react";
import {
  buildBridgePromptFragment,
  extractKnowledgeOrganiser,
  knowledgeOrganiserHtml,
  generateLessonTitlesFastPass,
  buildTrackingGridHtml,
  suggestCrossCurricularLinks,
  crossCurricularHtml,
  type BridgeInputs,
  type FastPassResult,
} from "@/lib/mtp-v2-enhancements";
import { useApp } from "@/contexts/AppContext";

interface Props {
  /** The latest generated MTP text (empty before the user generates). */
  rawOutput: string;
  /** Inputs the parent collected. */
  topic: string;
  yearGroup: string;
  subject: string;
  weeks: number;
  lessonsPerWeek: number;
  priorLearning?: string;
  /** Bridge values are persisted in this panel and exposed back via callback. */
  onBridgeChange?: (b: BridgeInputs) => void;
  /** Fast-pass titles bubble back so the parent can include them in the
   *  next prompt. */
  onFastPassTitles?: (fragment: string) => void;
}

export default function MtpV2Panel({
  rawOutput,
  topic,
  yearGroup,
  subject,
  weeks,
  lessonsPerWeek,
  priorLearning,
  onBridgeChange,
  onFastPassTitles,
}: Props) {
  const { children } = useApp();

  // ── Bridge ────
  const [bridge, setBridge] = useState<BridgeInputs>({
    priorUnitTitle: "",
    priorUnitOutcomes: "",
    nextUnitTitle: "",
    nextUnitOutcomes: "",
  });

  function updateBridge(patch: Partial<BridgeInputs>) {
    const next = { ...bridge, ...patch };
    setBridge(next);
    onBridgeChange?.(next);
  }

  const bridgeFragment = useMemo(() => buildBridgePromptFragment(bridge), [bridge]);

  // ── Knowledge organiser ────
  const ko = useMemo(() => extractKnowledgeOrganiser(rawOutput), [rawOutput]);
  function printKo() {
    if (!rawOutput) {
      toast.error("Generate an MTP first.");
      return;
    }
    const html = knowledgeOrganiserHtml({
      unitTitle: topic,
      yearGroup,
      subject,
      ko,
    });
    const w = window.open("", "_blank", "width=1100,height=700");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${topic} KO</title></head><body>${html}<script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  // ── Fast pass titles ────
  const [fastPass, setFastPass] = useState<FastPassResult | null>(null);
  const [fastPassLoading, setFastPassLoading] = useState(false);
  const [editedTitles, setEditedTitles] = useState<{ lessonNumber: number; week: number; title: string }[]>([]);

  async function runFastPass() {
    if (!subject || !yearGroup || !topic) {
      toast.error("Fill subject, year group and topic on the form first.");
      return;
    }
    setFastPassLoading(true);
    try {
      const res = await generateLessonTitlesFastPass({
        subject,
        yearGroup,
        topic,
        weeks,
        lessonsPerWeek,
        priorLearning,
      });
      setFastPass(res);
      setEditedTitles(res.titles);
      const fragment = buildPromptFragmentLocal(res.titles);
      onFastPassTitles?.(fragment);
      toast.success(`Drafted ${res.titles.length} titles \u2014 edit then re-generate the full plan.`);
    } catch {
      toast.error("Couldn\u2019t draft titles right now.");
    }
    setFastPassLoading(false);
  }

  function updateTitle(idx: number, title: string) {
    const next = editedTitles.map((t, i) => (i === idx ? { ...t, title } : t));
    setEditedTitles(next);
    onFastPassTitles?.(buildPromptFragmentLocal(next));
  }

  function buildPromptFragmentLocal(titles: { lessonNumber: number; week: number; title: string }[]): string {
    if (titles.length === 0) return "";
    return [
      "EDITED LESSON TITLES (use these EXACTLY \u2014 do not paraphrase, do not change order):",
      ...titles.map((t) => `Lesson ${t.lessonNumber} (Week ${t.week}): ${t.title}`),
    ].join("\n");
  }

  // ── Tracking grid ────
  const [selectedPupilIds, setSelectedPupilIds] = useState<string[]>([]);
  const [objectives, setObjectives] = useState("");

  function togglePupil(id: string) {
    setSelectedPupilIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function printTrackingGrid() {
    const objectiveLines = objectives
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (objectiveLines.length === 0) {
      toast.error("Add at least one objective.");
      return;
    }
    if (selectedPupilIds.length === 0) {
      toast.error("Select at least one pupil.");
      return;
    }
    const pupils = selectedPupilIds
      .map((id) => children.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => ({ id: c!.id, name: c!.name }));
    const html = buildTrackingGridHtml({
      pupils,
      objectives: objectiveLines,
      unitTitle: topic,
    });
    const w = window.open("", "_blank", "width=1100,height=700");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${topic} tracking grid</title></head><body>${html}<script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  // ── Cross-curricular ────
  const crossLinks = useMemo(
    () =>
      suggestCrossCurricularLinks({
        topic,
        unitOverview: rawOutput.slice(0, 2000),
        primarySubject: subject,
      }),
    [topic, rawOutput, subject],
  );

  return (
    <Card className="border-emerald-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-emerald-600" />
          <p className="text-sm font-bold">MTP extras</p>
        </div>

        <Tabs defaultValue="bridge">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="bridge"><GitBranch className="w-3.5 h-3.5 mr-1" />Bridge</TabsTrigger>
            <TabsTrigger value="ko"><BookOpen className="w-3.5 h-3.5 mr-1" />KO</TabsTrigger>
            <TabsTrigger value="titles"><ListOrdered className="w-3.5 h-3.5 mr-1" />Fast titles</TabsTrigger>
            <TabsTrigger value="tracking"><Grid className="w-3.5 h-3.5 mr-1" />Tracking grid</TabsTrigger>
            <TabsTrigger value="cross"><Sparkles className="w-3.5 h-3.5 mr-1" />Cross-curricular</TabsTrigger>
          </TabsList>

          <TabsContent value="bridge" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Tell the AI what came before and what comes next so the unit threads through the long-term sequence.
              These values are injected into the prompt the next time you generate.
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Previous unit title</label>
                <Input
                  value={bridge.priorUnitTitle || ""}
                  onChange={(e) => updateBridge({ priorUnitTitle: e.target.value })}
                  placeholder="e.g. Place value to 1,000,000"
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Pupils achieved</label>
                <Input
                  value={bridge.priorUnitOutcomes || ""}
                  onChange={(e) => updateBridge({ priorUnitOutcomes: e.target.value })}
                  placeholder="e.g. round to the nearest 10,000"
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Next unit title</label>
                <Input
                  value={bridge.nextUnitTitle || ""}
                  onChange={(e) => updateBridge({ nextUnitTitle: e.target.value })}
                  placeholder="e.g. Decimals"
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Pupils will need</label>
                <Input
                  value={bridge.nextUnitOutcomes || ""}
                  onChange={(e) => updateBridge({ nextUnitOutcomes: e.target.value })}
                  placeholder="e.g. divide by 10 and 100 fluently"
                  className="text-xs h-8"
                />
              </div>
            </div>
            {bridgeFragment && (
              <details className="text-[11px]">
                <summary className="cursor-pointer text-emerald-700 font-semibold">Prompt fragment (preview)</summary>
                <pre className="mt-1 p-2 rounded bg-emerald-50 text-[10px] whitespace-pre-wrap">{bridgeFragment}</pre>
              </details>
            )}
          </TabsContent>

          <TabsContent value="ko" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Auto-extracts vocabulary, key facts, and diagram ideas from the generated MTP into a printable
              A4 knowledge organiser.
            </p>
            {!rawOutput ? (
              <p className="text-[11px] italic text-muted-foreground">Generate the MTP first to populate the KO.</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <Badge variant="outline" className="justify-center">{ko.vocabulary.length} vocab</Badge>
                  <Badge variant="outline" className="justify-center">{ko.keyFacts.length} facts</Badge>
                  <Badge variant="outline" className="justify-center">{ko.diagramIdeas.length} diagrams</Badge>
                </div>
                <Button size="sm" variant="outline" onClick={printKo} className="gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Print A4 knowledge organiser
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="titles" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Drafts just the lesson titles in a single fast call so you can rename them before
              committing tokens to the full plan. Edited titles are injected into the next generation.
            </p>
            <Button size="sm" onClick={runFastPass} disabled={fastPassLoading}>
              {fastPassLoading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />Drafting titles\u2026</>
                : <><ListOrdered className="w-3.5 h-3.5 mr-1" />Draft titles fast pass</>}
            </Button>
            {editedTitles.length > 0 && (
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {editedTitles.map((t, i) => (
                  <div key={t.lessonNumber} className="flex items-center gap-2 text-[11px]">
                    <Badge variant="outline" className="text-[10px]">L{t.lessonNumber} (W{t.week})</Badge>
                    <Input
                      value={t.title}
                      onChange={(e) => updateTitle(i, e.target.value)}
                      className="text-xs h-7 flex-1"
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tracking" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Pupils \u00d7 unit objectives. Print and tick as pupils achieve each objective.
            </p>
            {children.length === 0 ? (
              <p className="text-[11px] italic text-muted-foreground">Add pupils to your class first.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {children.map((c) => {
                  const sel = selectedPupilIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => togglePupil(c.id)}
                      className={`px-2 py-1 rounded-md border text-[11px] ${sel ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-300 text-foreground hover:border-emerald-300"}`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Unit objectives (one per line)</label>
              <Textarea
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="LO1: Identify the components of a flowering plant\nLO2: Describe pollination\nLO3: \u2026"
                className="text-xs min-h-[80px]"
              />
            </div>
            <Button size="sm" variant="outline" onClick={printTrackingGrid} className="gap-1.5">
              <Grid className="w-3.5 h-3.5" /> Print tracking grid
            </Button>
          </TabsContent>

          <TabsContent value="cross" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Suggested cross-curricular links based on the topic and unit overview.
            </p>
            <div
              className="rounded-md border bg-white p-2"
              dangerouslySetInnerHTML={{ __html: crossCurricularHtml(crossLinks) }}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
