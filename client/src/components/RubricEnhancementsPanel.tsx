/**
 * RubricEnhancementsPanel — embedded inside Rubric Generator.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, FileText, Users, Star, BookOpen, FileDown } from "lucide-react";
import { toast } from "sonner";
import {
  type AnalyticRubric,
  COCONSTRUCTION_STEMS, type PupilRubricInput, summarisePupilInputs,
  toSinglePoint, toDualPoint,
  selfPeerCompanion,
  calibrationSamples,
  scorePupil,
} from "@/lib/rubric-enhancements";

interface Props {
  rubric: AnalyticRubric | null;
  pupilId?: string;
  pupilName?: string;
}

export default function RubricEnhancementsPanel({ rubric, pupilId, pupilName }: Props) {
  const [stem, setStem] = useState(COCONSTRUCTION_STEMS[0]);
  const [response, setResponse] = useState("");
  const [pupilInputs, setPupilInputs] = useState<PupilRubricInput[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});

  const summary = useMemo(() => summarisePupilInputs(pupilInputs), [pupilInputs]);
  const singlePoint = useMemo(() => rubric ? toSinglePoint(rubric) : null, [rubric]);
  const dualPoint = useMemo(() => rubric ? toDualPoint(rubric) : null, [rubric]);
  const selfCompanion = useMemo(() => rubric ? selfPeerCompanion(rubric, "self") : null, [rubric]);
  const samples = useMemo(() => rubric ? calibrationSamples(rubric) : [], [rubric]);

  function addInput() {
    if (!response.trim() || !pupilId) return;
    setPupilInputs((prev) => [...prev, { pupilId, stem, response }]);
    setResponse("");
    toast.success("Pupil voice added.");
  }

  function exportCalibration() {
    if (!rubric) return;
    const text = samples.map((s) => `=== ${s.level} ===\n${s.exampleText}\nWhy: ${s.whyThisLevel}`).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rubric.title.replace(/\W+/g, "_")}-calibration-samples.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Calibration samples exported.");
  }

  function commitMarkbook() {
    if (!rubric || !pupilId) return;
    const entry = scorePupil({ pupilId, rubric, scoresByCriterion: scores });
    toast.success(`Scored — comment & skill-ladder updates queued (${entry.scores.length} criteria).`);
  }

  if (!rubric) {
    return (
      <Card className="border-fuchsia-200 mt-4 border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">Generate a rubric to enable enhancements.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-fuchsia-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-fuchsia-600" />
          <p className="text-sm font-bold">Rubric Enhancements — {rubric.title}</p>
        </div>

        <Tabs defaultValue="coconstruct">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="coconstruct">Co-construction</TabsTrigger>
            <TabsTrigger value="formats">Formats</TabsTrigger>
            <TabsTrigger value="selfpeer">Self / Peer</TabsTrigger>
            <TabsTrigger value="samples">Calibration</TabsTrigger>
            <TabsTrigger value="markbook">Mark-book</TabsTrigger>
          </TabsList>

          <TabsContent value="coconstruct" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Pupil-facing sentence stems. Capture pupil voice, then refine into the rubric.</p>
            <Label className="text-xs">Sentence stem</Label>
            <select className="block w-full h-8 text-xs border rounded-md px-2" value={stem} onChange={(e) => setStem(e.target.value)}>
              {COCONSTRUCTION_STEMS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Textarea rows={2} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Pupil response…" />
            <Button size="sm" onClick={addInput} disabled={!pupilId}>Add</Button>
            {summary.length > 0 && (
              <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
                <p className="font-bold mb-1">Pupil voice summary</p>
                <ul className="list-disc pl-5">{summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="formats" className="space-y-2 pt-3">
            {singlePoint && (
              <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
                <p className="font-bold flex items-center gap-1.5"><Star className="w-3 h-3" /> Single-point rubric</p>
                <ul className="list-disc pl-5 mt-1">{singlePoint.expectations.map((e, i) => <li key={i}>{e}</li>)}</ul>
                <p className="text-[10px] text-muted-foreground mt-1">Glow / Grow columns to be filled per pupil.</p>
              </div>
            )}
            {dualPoint && (
              <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
                <p className="font-bold">Dual-point rubric</p>
                <table className="w-full mt-1">
                  <thead><tr className="text-left text-muted-foreground"><th>Criterion</th><th>Currently</th><th>Next step</th></tr></thead>
                  <tbody>
                    {dualPoint.rows.map((r) => (
                      <tr key={r.criterion} className="border-t">
                        <td className="py-1 pr-2">{r.criterion}</td>
                        <td className="py-1 pr-2">{r.current}</td>
                        <td className="py-1 pr-2">{r.nextStep}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="selfpeer" className="space-y-2 pt-3">
            {selfCompanion && (
              <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
                <p className="font-bold flex items-center gap-1.5"><Users className="w-3 h-3" /> Self-assessment tick list</p>
                <ul className="list-disc pl-5 mt-1">
                  {selfCompanion.tickList.map((i) => (
                    <li key={i.criterion}>
                      <input type="checkbox" className="mr-1.5" /> {i.pupilFriendly}
                      <span className="block text-[10px] text-muted-foreground italic">{i.whatToDoNext}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="samples" className="space-y-2 pt-3">
            {samples.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">No levels in rubric.</p>
            ) : (
              <ul className="space-y-1.5 text-[11px]">
                {samples.map((s) => (
                  <li key={s.level} className="rounded-md border bg-muted/20 p-2">
                    <p className="font-bold">{s.level}</p>
                    <pre className="whitespace-pre-wrap font-mono text-[10px] mt-1">{s.exampleText}</pre>
                    <p className="italic mt-1 text-muted-foreground">{s.whyThisLevel}</p>
                  </li>
                ))}
              </ul>
            )}
            <Button size="sm" onClick={exportCalibration} className="gap-1.5"><FileDown className="w-3.5 h-3.5" /> Export calibration pack</Button>
          </TabsContent>

          <TabsContent value="markbook" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Score this pupil — generates a Report Comment seed and updates the Skill Ladder.</p>
            {pupilName && <Badge variant="outline" className="text-[10px]">{pupilName}</Badge>}
            <ul className="space-y-1.5">
              {rubric.criteria.map((c) => (
                <li key={c.name} className="text-[11px]">
                  <p className="font-medium">{c.name}</p>
                  <select className="w-full h-7 text-xs border rounded-md px-1" value={scores[c.name] || ""}
                          onChange={(e) => setScores({ ...scores, [c.name]: e.target.value })}>
                    <option value="">— level —</option>
                    {rubric.levels.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </li>
              ))}
            </ul>
            <Button size="sm" onClick={commitMarkbook} disabled={!pupilId} className="gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Commit to mark-book</Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
