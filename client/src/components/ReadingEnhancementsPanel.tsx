/**
 * ReadingEnhancementsPanel — embedded next to the Reading & Stories
 * output. Surfaces all five improvements.
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
import {
  BookOpen, ShieldAlert, Headphones, GitBranch, Timer,
  AlertTriangle, CheckCircle2, Pause, Play,
} from "lucide-react";
import { toast } from "sonner";
import {
  validatePhonicsPassage, classifyAll, safeguardPersonalisation,
  tagDialogue, speakWithCharacters, computeRunningRecord, type LSPhase,
  type ClassifiedQuestion,
} from "@/lib/reading-enhancements";

interface Props {
  passage: string;
  questions?: string[];
  pupilName?: string;
  pupilInterest?: string;
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

  const [running, setRunning] = useState(false);
  const [errors, setErrors] = useState(0);
  const [selfCorrections, setSelfCorrections] = useState(0);
  const startRef = useRef<number>(0);
  const [record, setRecord] = useState<ReturnType<typeof computeRunningRecord> | null>(null);

  function startRecord() {
    setErrors(0); setSelfCorrections(0); setRecord(null);
    startRef.current = Date.now();
    setRunning(true);
  }
  function stopRecord() {
    const totalWords = passage.replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean).length;
    setRecord(computeRunningRecord({
      totalWords, errors, selfCorrections,
      startMs: startRef.current,
      endMs: Date.now(),
    }));
    setRunning(false);
  }

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
          <TabsContent value="audio" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Detected {chunks.filter(c => c.speaker === "character").length} dialogue line(s). Each named character will be voiced with a distinct pitch.
            </p>
            <Button size="sm" variant="outline" onClick={() => speakWithCharacters(chunks)} className="gap-1.5">
              <Play className="w-3.5 h-3.5" /> Read aloud (multi-voice)
            </Button>
          </TabsContent>

          {/* 5. Running record */}
          <TabsContent value="record" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Use during 1:1 reading. Tap "Error" each time the pupil misreads, "SC" when they self-correct.
            </p>
            <div className="flex items-center gap-2">
              {!running ? (
                <Button size="sm" onClick={startRecord} className="gap-1.5"><Play className="w-3.5 h-3.5" /> Start</Button>
              ) : (
                <Button size="sm" onClick={stopRecord} variant="outline" className="gap-1.5"><Pause className="w-3.5 h-3.5" /> Stop &amp; calculate</Button>
              )}
              {running && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setErrors(e => e + 1)}>+ Error ({errors})</Button>
                  <Button size="sm" variant="outline" onClick={() => setSelfCorrections(e => e + 1)}>+ SC ({selfCorrections})</Button>
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
        </Tabs>
      </CardContent>
    </Card>
  );
}
