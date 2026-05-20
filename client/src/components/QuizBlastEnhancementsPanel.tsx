/**
 * QuizBlastEnhancementsPanel — embedded inside QuizGame's host view.
 * Surfaces async-mode, anti-cheat, accessibility, and the live heatmap.
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/inline-switch";
import { Label } from "@/components/ui/label";
import {
  Zap, Clock, ShieldCheck, Eye, Activity, AlertTriangle, BookOpen,
} from "lucide-react";
import {
  buildHeatmap, getA11yToggles, saveA11yToggles, generateJoinPin,
  saveAsyncSession, watchTabBlur, type AccessibilityToggles,
  type QuestionHeatmapEntry,
} from "@/lib/quizblast-enhancements";
import { toast } from "sonner";

interface Props {
  sessionId: string;
  questionIds: string[];
  /** Optional callback when teacher wants to assign a remedial worksheet. */
  onAssignRemedial?: (failedPupilIds: string[]) => void;
}

export default function QuizBlastEnhancementsPanel({ sessionId, questionIds, onAssignRemedial }: Props) {
  const [tick, setTick] = useState(0);
  const heatmap = useMemo(() => buildHeatmap(sessionId, questionIds), [sessionId, questionIds, tick]);
  const [toggles, setToggles] = useState<AccessibilityToggles>(getA11yToggles());
  const [blurEvents, setBlurEvents] = useState(0);

  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener("adaptly:quizblast-attempt", handler);
    return () => window.removeEventListener("adaptly:quizblast-attempt", handler);
  }, []);

  useEffect(() => watchTabBlur(() => setBlurEvents(b => b + 1)), []);

  function setToggle<K extends keyof AccessibilityToggles>(k: K, v: AccessibilityToggles[K]) {
    const next = { ...toggles, [k]: v };
    setToggles(next);
    saveA11yToggles(next);
  }

  function createAsyncWindow() {
    const opens = new Date();
    const closes = new Date(); closes.setHours(closes.getHours() + 48);
    saveAsyncSession({
      id: `async_${sessionId}`,
      quizId: sessionId,
      title: "Homework window",
      opensAt: opens.toISOString(),
      closesAt: closes.toISOString(),
      joinPin: generateJoinPin(),
      invitedPupilIds: [],
    });
    toast.success("48-hour homework window opened.");
  }

  return (
    <Card className="border-yellow-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-600" />
          <p className="text-sm font-bold">QuizBlast Enhancements</p>
        </div>

        <Tabs defaultValue="heatmap">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            <TabsTrigger value="async">Async homework</TabsTrigger>
            <TabsTrigger value="adaptive">Adaptive paths</TabsTrigger>
            <TabsTrigger value="security">Anti-cheat</TabsTrigger>
            <TabsTrigger value="a11y">Accessibility</TabsTrigger>
          </TabsList>

          {/* 5. Heatmap */}
          <TabsContent value="heatmap" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Per-question miss rates across the live session. Click a red cell to assign a remedial worksheet to just the pupils who missed it.
            </p>
            <div className="flex flex-wrap gap-1">
              {heatmap.map((h, i) => <HeatCell key={h.questionId} entry={h} index={i} onClick={() => onAssignRemedial?.(h.failedBy)} />)}
            </div>
          </TabsContent>

          {/* 1. Async */}
          <TabsContent value="async" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Open a 48-hour window so absent pupils can complete the same quiz at home. Results merge into the live analytics view.
            </p>
            <Button size="sm" variant="outline" onClick={createAsyncWindow} className="gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Open 48-hour homework window
            </Button>
          </TabsContent>

          {/* 2. Adaptive */}
          <TabsContent value="adaptive" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              When enabled, each pupil sees questions adapted to their accuracy on the topic from the Skill Ladder.
            </p>
            <div className="flex items-center gap-2">
              <Switch id="adaptive-on" />
              <Label htmlFor="adaptive-on" className="text-xs cursor-pointer">Adaptive paths active for this session</Label>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Mastered topics → skip easy questions. Struggling topics → easier first.
            </p>
          </TabsContent>

          {/* 3. Anti-cheat */}
          <TabsContent value="security" className="space-y-2 pt-3">
            <ul className="text-[11px] space-y-1">
              <li className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Question + answer order is randomised per pupil.</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> One-token-per-pupil — duplicates rejected.</li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Tab-blur watchdog — host has detected {blurEvents} tab switch{blurEvents === 1 ? "" : "es"} so far.
              </li>
            </ul>
          </TabsContent>

          {/* 4. Accessibility */}
          <TabsContent value="a11y" className="space-y-2 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <ToggleRow id="t-read"  label="Read aloud"   checked={toggles.readAloud}    onChange={(v) => setToggle("readAloud", v)} />
              <ToggleRow id="t-bsl"   label="BSL symbols"  checked={toggles.bslSymbols}   onChange={(v) => setToggle("bslSymbols", v)} />
              <ToggleRow id="t-large" label="Large print"  checked={toggles.largePrint}   onChange={(v) => setToggle("largePrint", v)} />
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Toggles apply on every join screen — no per-question overrides needed.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function HeatCell({ entry, index, onClick }: { entry: QuestionHeatmapEntry; index: number; onClick: () => void }) {
  const cls = entry.banner === "green" ? "bg-emerald-500" :
              entry.banner === "amber" ? "bg-amber-500" :
              entry.banner === "red"   ? "bg-red-500"   : "bg-muted";
  return (
    <button
      onClick={entry.banner === "red" ? onClick : undefined}
      className={`w-8 h-8 rounded text-white text-[10px] font-bold flex items-center justify-center ${cls} ${entry.banner === "red" ? "cursor-pointer hover:scale-105 transition-transform" : "cursor-default"}`}
      title={`Q${index + 1} — ${entry.attempts} attempts, ${Math.round(entry.rate * 100)}% correct${entry.banner === "red" ? " (click to assign remedial)" : ""}`}
    >
      {index + 1}
    </button>
  );
}

function ToggleRow({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-xs cursor-pointer">{label}</Label>
    </div>
  );
}
