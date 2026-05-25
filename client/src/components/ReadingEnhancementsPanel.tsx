/**
 * ReadingEnhancementsPanel — embedded next to the Reading & Stories
 * output. Surfaces six improvements:
 *   1. Decodable phonics check
 *   2. Comprehension question taxonomy
 *   3. Personalisation safeguarding
 *   4. Audio narration with character voices + speed control
 *   5. Running record / WCPM
 *   6. Miscue analysis log (FY2026 — Year of Reading)
 */
import { useMemo, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  BookOpen, Timer,
  AlertTriangle, CheckCircle2, Pause, Play, Plus, Trash2,
} from "lucide-react";
import {
  validatePhonicsPassage, classifyAll, safeguardPersonalisation,
  tagDialogue, speakWithCharacters, computeRunningRecord,
  categoriseMiscue, type LSPhase,
  type ClassifiedQuestion,
} from "@/lib/reading-enhancements";

interface Props {
  passage: string;
  questions?: string[];
  pupilName?: string;
  pupilInterest?: string;
}

interface Miscue {
  id: string;
  target: string;
  said: string;
  category: ReturnType<typeof categoriseMiscue>;
  selfCorrected: boolean;
}

export default function ReadingEnhancementsPanel({ passage, questions = [], pupilName, pupilInterest }: Props) {
  const [phase, setPhase] = useState<LSPhase>("Phase 5");
  const phonicsIssues = useMemo(() => validatePhonicsPassage(passage, phase), [passage, phase]);
  const classified: ClassifiedQuestion[] = useMemo(() => classifyAll(questions), [questions]);
  const personalisation = useMemo(() =>
    safeguardPersonalisation(passage, pupilName || "", pupilInterest),
    [passage, pupilName, pupilInterest],
  );
  const chunks = useMemo(() => tagDialogue(passage), [passage]);

  // Running record state
  const [running, setRunning] = useState(false);
  const startRef = useRef<number>(0);
  const [record, setRecord] = useState<ReturnType<typeof computeRunningRecord> | null>(null);
  const [miscues, setMiscues] = useState<Miscue[]>([]);
  const [miscueTarget, setMiscueTarget] = useState("");
  const [miscueSaid, setMiscueSaid] = useState("");

  // Audio playback rate (0.6–1.4 covers slow learners through to confident)
  const [audioRate, setAudioRate] = useState(0.95);

  function startRecord() {
    setMiscues([]); setRecord(null);
    startRef.current = Date.now();
    setRunning(true);
  }

  function stopRecord() {
    const totalWords = passage.replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean).length;
    const errors = miscues.filter(m => !m.selfCorrected).length;
    const selfCorrections = miscues.filter(m => m.selfCorrected).length;
    setRecord(computeRunningRecord({
      totalWords, errors, selfCorrections,
      startMs: startRef.current,
      endMs: Date.now(),
    }));
    setRunning(false);
  }

  function logMiscue(opts: { selfCorrected: boolean }) {
    const target = miscueTarget.trim();
    const said = miscueSaid.trim();
    if (!target) return;
    setMiscues(arr => [...arr, {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      target,
      said,
      category: said ? categoriseMiscue(target, said) : "whole",
      selfCorrected: opts.selfCorrected,
    }]);
    setMiscueTarget(""); setMiscueSaid("");
  }

  function removeMiscue(id: string) {
    setMiscues(arr => arr.filter(m => m.id !== id));
  }

  // Miscue-category breakdown for analysis output
  const miscueBreakdown = useMemo(() => {
    const breakdown = { initial: 0, medial: 0, final: 0, whole: 0 };
    for (const m of miscues) if (!m.selfCorrected) breakdown[m.category] += 1;
    return breakdown;
  }, [miscues]);

  const counts: Record<string, number> = {};
  for (const c of classified) counts[c.domain] = (counts[c.domain] || 0) + 1;

  if (!passage) return null;

  return (
    <Card className="border-emerald-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <p className="text-sm font-bold">Reading Enhancements</p>
        </div>

        <Tabs defaultValue="phonics">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="phonics">Decodable</TabsTrigger>
            <TabsTrigger value="taxonomy">Question types</TabsTrigger>
            <TabsTrigger value="personalise">Personalisation</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="record">Running record</TabsTrigger>
            <TabsTrigger value="miscue">Miscue analysis</TabsTrigger>
          </TabsList>

          {/* 1. Decodable */}
          <TabsContent value="phonics" className="space-y-2 pt-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Phonics phase:</Label>
              <Select value={phase} onValueChange={(v) => setPhase(v as LSPhase)}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Phase 2","Phase 3","Phase 4","Phase 5","Phase 6"] as LSPhase[]).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {phonicsIssues.length === 0 ? (
              <p className="text-xs text-emerald-700 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> All words appear decodable for {phase}.</p>
            ) : (
              <div>
                <p className="text-xs text-amber-700 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> {phonicsIssues.length} word{phonicsIssues.length === 1 ? "" : "s"} may exceed phase grapheme set:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {phonicsIssues.slice(0, 24).map(w => <Badge key={w} variant="outline" className="text-[10px]">{w}</Badge>)}
                </div>
              </div>
            )}
          </TabsContent>

          {/* 2. Question taxonomy */}
          <TabsContent value="taxonomy" className="space-y-2 pt-3">
            {classified.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No questions to classify.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {(["retrieval","inference","vocabulary","sequence","predict"] as const).map(d => (
                    <Badge key={d} variant="outline" className="text-[10px] capitalize">
                      {d}: {counts[d] || 0}
                    </Badge>
                  ))}
                </div>
                <ul className="text-[11px] space-y-0.5">
                  {classified.map((c, i) => (
                    <li key={i} className="flex gap-1.5">
                      <Badge variant="outline" className="text-[10px] capitalize flex-shrink-0">{c.domain}</Badge>
                      <span>{c.text}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </TabsContent>

          {/* 3. Personalisation safety */}
          <TabsContent value="personalise" className="space-y-2 pt-3">
            {personalisation.ok ? (
              <p className="text-xs text-emerald-700 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Personalisation looks safe to share.</p>
            ) : (
              <ul className="text-[11px] text-amber-700 list-disc pl-5 space-y-0.5">
                {personalisation.problems.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            )}
          </TabsContent>

          {/* 4. Audio narration */}
          <TabsContent value="audio" className="space-y-3 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Detected {chunks.filter(c => c.speaker === "character").length} dialogue line(s).
              Each named character will be voiced with a distinct pitch.
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="text-xs">Reading speed</Label>
                <span className="text-muted-foreground">
                  {audioRate < 0.8 ? "Slow" : audioRate > 1.1 ? "Fast" : "Normal"} · {audioRate.toFixed(2)}×
                </span>
              </div>
              <Slider
                value={[audioRate]}
                min={0.6}
                max={1.4}
                step={0.05}
                onValueChange={(v) => setAudioRate(v[0])}
                className="w-full"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => speakWithCharacters(chunks, { rate: audioRate })}
              className="gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Read aloud (multi-voice)
            </Button>
          </TabsContent>

          {/* 5. Running record */}
          <TabsContent value="record" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Use during 1:1 reading. Tap "+ Error" each time the pupil misreads,
              "+ SC" when they self-correct. For deeper analysis (initial/medial/final
              sound errors) use the <strong>Miscue analysis</strong> tab.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {!running ? (
                <Button size="sm" onClick={startRecord} className="gap-1.5"><Play className="w-3.5 h-3.5" /> Start</Button>
              ) : (
                <Button size="sm" onClick={stopRecord} variant="outline" className="gap-1.5"><Pause className="w-3.5 h-3.5" /> Stop &amp; calculate</Button>
              )}
              {running && (
                <>
                  <Button size="sm" variant="outline"
                    onClick={() => setMiscues(arr => [...arr, { id: `q${Date.now()}`, target: "(quick)", said: "", category: "whole", selfCorrected: false }])}>
                    + Error ({miscues.filter(m => !m.selfCorrected).length})
                  </Button>
                  <Button size="sm" variant="outline"
                    onClick={() => setMiscues(arr => [...arr, { id: `q${Date.now()}`, target: "(quick)", said: "", category: "whole", selfCorrected: true }])}>
                    + SC ({miscues.filter(m => m.selfCorrected).length})
                  </Button>
                </>
              )}
            </div>
            {record && (
              <div className="rounded-md bg-muted/40 p-2 text-[11px] grid grid-cols-2 gap-1.5">
                <div><strong>WCPM:</strong> {record.wcpm}</div>
                <div><strong>Accuracy:</strong> {record.accuracy}%</div>
                <div><strong>Errors:</strong> {record.errors}</div>
                <div><strong>Self-corrections:</strong> {record.selfCorrections}</div>
                <div className="col-span-2 text-muted-foreground"><Timer className="inline w-3 h-3 mr-1" />{record.durationSec}s on {record.totalWords} words</div>
              </div>
            )}
          </TabsContent>

          {/* 6. Miscue analysis — surfaces categoriseMiscue() */}
          <TabsContent value="miscue" className="space-y-3 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Log each miscue word-by-word to see whether errors cluster at the
              start, middle or end of words — useful for targeting phonics support.
              Accumulates into the running record above when started.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px]">Target word</Label>
                <Input
                  value={miscueTarget}
                  onChange={(e) => setMiscueTarget(e.target.value)}
                  placeholder="e.g. through"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Pupil said</Label>
                <Input
                  value={miscueSaid}
                  onChange={(e) => setMiscueSaid(e.target.value)}
                  placeholder="e.g. though"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => logMiscue({ selfCorrected: false })} disabled={!miscueTarget.trim()} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />Log error
              </Button>
              <Button size="sm" variant="outline" onClick={() => logMiscue({ selfCorrected: true })} disabled={!miscueTarget.trim()} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />Log self-correction
              </Button>
            </div>

            {miscues.length > 0 && (
              <>
                <div className="rounded-md bg-muted/40 p-2 text-[11px] grid grid-cols-4 gap-1.5">
                  <Stat label="Initial" value={miscueBreakdown.initial} />
                  <Stat label="Medial" value={miscueBreakdown.medial} />
                  <Stat label="Final" value={miscueBreakdown.final} />
                  <Stat label="Whole" value={miscueBreakdown.whole} />
                </div>

                <ul className="text-[11px] space-y-0.5 max-h-40 overflow-auto">
                  {miscues.map(m => (
                    <li key={m.id} className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize ${m.selfCorrected ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                      >
                        {m.selfCorrected ? "SC" : m.category}
                      </Badge>
                      <span className="font-medium">{m.target}</span>
                      {m.said && <><span className="text-muted-foreground">→</span><span>{m.said}</span></>}
                      <button
                        aria-label="Remove miscue"
                        onClick={() => removeMiscue(m.id)}
                        className="ml-auto text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>

                {miscueBreakdown.initial > miscueBreakdown.medial + miscueBreakdown.final && (
                  <p className="text-[11px] text-amber-700">
                    Pattern: errors cluster at the <strong>start</strong> of words.
                    Consider targeted onset-phoneme practice.
                  </p>
                )}
                {miscueBreakdown.final > miscueBreakdown.initial + miscueBreakdown.medial && (
                  <p className="text-[11px] text-amber-700">
                    Pattern: errors cluster at the <strong>end</strong> of words.
                    Consider suffix and final-blend practice.
                  </p>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
