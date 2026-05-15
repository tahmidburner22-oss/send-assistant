/**
 * LessonBundle — one learning intention, six aligned outputs.
 *
 * Generates a coherent set of teaching artefacts from a single lessonSpec:
 *   1. Worksheet (full sectioned, via aiGenerateWorksheet)
 *   2. 8-slide lesson deck (via callAI structured JSON)
 *   3. 30-second hook video script
 *   4. Exit ticket (3 quick AfL questions)
 *   5. Spaced-retrieval starter for next week
 *   6. Parent-explanation note ("what we learned today")
 *
 * Cost: All calls go through the existing free-tier providers (callAI →
 * /api/ai/generate). No paid services. Worksheet generation is the only
 * heavy call; the other five are short JSON-shape calls (~600-1200 tokens
 * each), well within Groq/Gemini RPM budgets.
 *
 * Why this exists: today the teacher opens Worksheets + Lesson Planner +
 * Exit Ticket + Parent Newsletter + Presentation Maker in five tabs to
 * cover one lesson. This bundle does it once with shared context, and
 * the outputs cite the same learning intention, vocabulary and examples.
 */
import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Sparkles, Loader2, FileText, Presentation, ClipboardCheck, Video,
  Mail, RefreshCw, ChevronLeft, Copy, Check,
} from "lucide-react";

import { aiGenerateWorksheet, callAI, parseWithFixes, repairTruncatedJson, type AIWorksheetResult } from "@/lib/ai";
import {
  SUBJECTS_ALL, YEAR_GROUPS, SEND_NEEDS,
} from "@/lib/tool-vocab";

// Lazy-load WorksheetRenderer so the page itself stays light when teachers
// are still filling in the form.
const WorksheetRenderer = lazy(() => import("@/components/WorksheetRenderer"));

// ─────────────────────────────────────────────────────────────────────────────
// LessonSpec — the canonical shared shape across all six outputs
// ─────────────────────────────────────────────────────────────────────────────

interface LessonSpec {
  subject: string;
  yearGroup: string;
  topic: string;
  learningIntention: string;     // "I can…" or "By the end of the lesson…"
  durationMins: number;
  sendNeed?: string;
  examBoard?: string;
  priorLearning?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Output shapes for the five short artefacts (worksheet handled separately)
// ─────────────────────────────────────────────────────────────────────────────

interface SlideDeck {
  title: string;
  slides: Array<{ title: string; bullets: string[]; teacherNote?: string }>;
}

interface ExitTicket {
  prompt: string;
  questions: Array<{ q: string; a: string }>;
}

interface HookVideo {
  /** Spoken script lines for a 30-second intro video. */
  script: string[];
  /** Visual cues / b-roll suggestions, paired by line index. */
  visuals: string[];
  durationSec: number;
}

interface SpacedStarter {
  /** A 5-minute retrieval starter to deliver next week. */
  prompt: string;
  questions: string[];
  answers: string[];
}

interface ParentNote {
  subject: string;
  body: string;
}

// Step ordering used for status pills and the build pipeline.
const STEP_KEYS = ["worksheet", "deck", "exitTicket", "hook", "starter", "parentNote"] as const;
type StepKey = typeof STEP_KEYS[number];

interface BundleResult {
  worksheet?: AIWorksheetResult;
  deck?: SlideDeck;
  exitTicket?: ExitTicket;
  hook?: HookVideo;
  starter?: SpacedStarter;
  parentNote?: ParentNote;
  /** Per-step status — mirrors the order they're built. */
  status: Record<StepKey, "pending" | "running" | "ok" | "failed">;
  errors: Record<StepKey, string | null>;
}

const STEP_LABELS: Record<StepKey, string> = {
  worksheet: "Worksheet",
  deck: "Slide deck",
  exitTicket: "Exit ticket",
  hook: "Hook video",
  starter: "Next-week starter",
  parentNote: "Parent note",
};

// ─────────────────────────────────────────────────────────────────────────────
// JSON helpers — tolerate fenced output / pre-amble chatter
// ─────────────────────────────────────────────────────────────────────────────

function extractJson(raw: string): string | null {
  if (!raw) return null;
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const obj = raw.match(/\{[\s\S]*\}/);
  if (obj) return obj[0];
  return null;
}

function parseJson<T>(raw: string): T | null {
  const candidate = extractJson(raw);
  if (!candidate) return null;
  try {
    return parseWithFixes(candidate) as T;
  } catch {
    const repaired = repairTruncatedJson(candidate);
    if (!repaired) return null;
    try { return parseWithFixes(repaired) as T; }
    catch { return null; }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-artefact builders. Each uses the shared spec and returns its shape.
// ─────────────────────────────────────────────────────────────────────────────

async function buildDeck(spec: LessonSpec): Promise<SlideDeck> {
  const system = "You are a UK teacher building an 8-slide lesson deck. Return ONLY valid JSON — no markdown, no commentary.";
  const user = `Build an 8-slide deck for the following lesson. The deck must align tightly with the learning intention and be deliverable in ${spec.durationMins} minutes total.

Subject: ${spec.subject}
Year group: ${spec.yearGroup}
Topic: ${spec.topic}
Learning intention: ${spec.learningIntention}
${spec.sendNeed ? `SEND need: ${spec.sendNeed} (use plain language, short bullets, picture-friendly cues in teacher notes).` : ""}
${spec.examBoard ? `Exam board: ${spec.examBoard}` : ""}
${spec.priorLearning ? `Prior learning: ${spec.priorLearning}` : ""}

Slide ordering (must follow this exactly):
  1. Title + LI ("By the end of today…")
  2. Hook / Big question
  3. Key vocabulary (3–5 terms, define each in ≤8 words)
  4. Worked example
  5. Guided practice cue
  6. Independent practice cue
  7. Plenary check / mini-quiz
  8. Recap of LI + next-step preview

Each slide: title (≤6 words), 3–5 bullets (≤12 words each), optional teacherNote (a quick delivery tip).
Return: {"title": "...", "slides": [{"title":"...","bullets":["..."],"teacherNote":"..."}, ... 8 entries ...]}`;

  const { text } = await callAI(system, user, 2400);
  const parsed = parseJson<SlideDeck>(text);
  if (!parsed || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
    throw new Error("Slide deck response was not valid JSON.");
  }
  return parsed;
}

async function buildExitTicket(spec: LessonSpec): Promise<ExitTicket> {
  const system = "You are a UK teacher writing a 3-question exit ticket. Return ONLY valid JSON.";
  const user = `Write a 3-question exit ticket for:
Subject: ${spec.subject}
Year group: ${spec.yearGroup}
Topic: ${spec.topic}
Learning intention: ${spec.learningIntention}
${spec.sendNeed ? `SEND need: ${spec.sendNeed} — keep wording plain.` : ""}

Rules:
- Q1 recall (was the key term remembered?)
- Q2 application (use it on a fresh small example)
- Q3 self-check ("Did I meet today's LI? How do I know?")
- Each question one sentence, ≤ 18 words.

Return: {"prompt": "Before you leave today…", "questions": [{"q":"...","a":"..."}, ... 3 entries ...]}`;

  const { text } = await callAI(system, user, 800);
  const parsed = parseJson<ExitTicket>(text);
  if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("Exit ticket response was not valid JSON.");
  }
  return parsed;
}

async function buildHookVideo(spec: LessonSpec): Promise<HookVideo> {
  const system = "You are a UK teacher writing a 30-second hook video script for a smartboard intro. Return ONLY valid JSON.";
  const user = `Write a 30-second spoken hook for the lesson below. The script must be deliverable to camera by a teacher (no presenter / news anchor energy).

Subject: ${spec.subject}
Year group: ${spec.yearGroup}
Topic: ${spec.topic}
Learning intention: ${spec.learningIntention}

Rules:
- Total speaking time ~30 seconds (≈ 75 words across 4–6 lines).
- Open with a curiosity hook tied to the LI (a real-world surprise, an everyday object, a question pupils will think they know the answer to but don't).
- Avoid jargon. Year-group-appropriate vocabulary only.
- Provide a paired b-roll / visual cue per line for the editor to drop in.

Return: {"script": ["line 1", ...], "visuals": ["visual cue 1", ...], "durationSec": 30}`;

  const { text } = await callAI(system, user, 800);
  const parsed = parseJson<HookVideo>(text);
  if (!parsed || !Array.isArray(parsed.script) || parsed.script.length === 0) {
    throw new Error("Hook video response was not valid JSON.");
  }
  return parsed;
}

async function buildSpacedStarter(spec: LessonSpec): Promise<SpacedStarter> {
  const system = "You are a UK teacher writing a 5-minute spaced-retrieval starter to be used NEXT WEEK to bring this week's content back to mind. Return ONLY valid JSON.";
  const user = `Build a 5-minute retrieval starter for next week, drawing on the learning intention below.

Subject: ${spec.subject}
Year group: ${spec.yearGroup}
Topic: ${spec.topic}
Learning intention: ${spec.learningIntention}

Rules:
- 4 quick questions, low stakes, no marking.
- Question types: 1 recall, 1 transfer to a slightly different example, 1 misconception probe ("which of these is WRONG, and why?"), 1 application.
- Provide model answers (1 sentence each).

Return: {"prompt": "5-minute retrieval starter — silent start.", "questions":["...", "...", "...", "..."], "answers":["...", "...", "...", "..."]}`;

  const { text } = await callAI(system, user, 900);
  const parsed = parseJson<SpacedStarter>(text);
  if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("Spaced starter response was not valid JSON.");
  }
  return parsed;
}

async function buildParentNote(spec: LessonSpec): Promise<ParentNote> {
  const system = "You are a UK teacher writing a short, warm parent-facing note explaining what their child learned today and how to chat about it at home. Return ONLY valid JSON.";
  const user = `Write a parent note for the lesson below.

Subject: ${spec.subject}
Year group: ${spec.yearGroup}
Topic: ${spec.topic}
Learning intention: ${spec.learningIntention}

Rules:
- Plain UK English, ~120 words.
- One paragraph: what we did today + one easy question to ask at home + one optional tiny activity (no printables required).
- No jargon. No bullet points unless absolutely necessary.

Return: {"subject": "Today in ${spec.subject} — ${spec.topic}", "body": "..."}`;

  const { text } = await callAI(system, user, 900);
  const parsed = parseJson<ParentNote>(text);
  if (!parsed || !parsed.body) {
    throw new Error("Parent note response was not valid JSON.");
  }
  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const DURATIONS = ["20", "30", "45", "60", "75", "90"];

export default function LessonBundle() {
  // Form state
  const [subject, setSubject] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [topic, setTopic] = useState("");
  const [learningIntention, setLearningIntention] = useState("");
  const [durationMins, setDurationMins] = useState("60");
  const [sendNeed, setSendNeed] = useState("");
  const [examBoard, setExamBoard] = useState("");
  const [priorLearning, setPriorLearning] = useState("");

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BundleResult | null>(null);
  const [activeTab, setActiveTab] = useState<StepKey>("worksheet");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Cancellation flag — soft cancel; halts further steps after the in-flight one returns.
  const cancelRef = useRef(false);

  const spec: LessonSpec | null = useMemo(() => {
    if (!subject || !yearGroup || !topic || !learningIntention) return null;
    return {
      subject,
      yearGroup,
      topic,
      learningIntention,
      durationMins: parseInt(durationMins, 10) || 60,
      sendNeed: sendNeed || undefined,
      examBoard: examBoard || undefined,
      priorLearning: priorLearning || undefined,
    };
  }, [subject, yearGroup, topic, learningIntention, durationMins, sendNeed, examBoard, priorLearning]);

  const handleGenerate = async () => {
    if (!spec) {
      toast.error("Please fill in subject, year group, topic and learning intention.");
      return;
    }
    cancelRef.current = false;
    setRunning(true);

    // Initialise empty result with all-pending status.
    const init: BundleResult = {
      status: { worksheet: "pending", deck: "pending", exitTicket: "pending", hook: "pending", starter: "pending", parentNote: "pending" },
      errors: { worksheet: null, deck: null, exitTicket: null, hook: null, starter: null, parentNote: null },
    };
    setResult(init);

    const setStepStatus = (key: StepKey, status: BundleResult["status"][StepKey], err?: string) => {
      setResult(prev => prev ? {
        ...prev,
        status: { ...prev.status, [key]: status },
        errors: { ...prev.errors, [key]: err || null },
      } : prev);
    };

    const runStep = async <T,>(key: StepKey, fn: () => Promise<T>, attach: (r: BundleResult, val: T) => void) => {
      if (cancelRef.current) return;
      setStepStatus(key, "running");
      try {
        const value = await fn();
        if (cancelRef.current) return;
        setResult(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          attach(next, value);
          next.status = { ...next.status, [key]: "ok" };
          return next;
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setStepStatus(key, "failed", msg);
      }
    };

    // 1. Worksheet (heaviest — run it first so the teacher sees something).
    await runStep("worksheet", async () => {
      const ws = await aiGenerateWorksheet({
        subject: spec.subject,
        topic: spec.topic,
        yearGroup: spec.yearGroup,
        sendNeed: spec.sendNeed,
        examBoard: spec.examBoard,
        additionalInstructions: `LESSON BUNDLE CONTEXT — these outputs share a single learning intention. Align with it tightly:\n\n  Learning intention: "${spec.learningIntention}"\n  Duration: ${spec.durationMins} minutes\n${spec.priorLearning ? `  Prior learning: ${spec.priorLearning}` : ""}`,
      });
      return ws;
    }, (r, val) => { r.worksheet = val; });

    // After the worksheet, set the active tab to it so the teacher sees something even if subsequent steps are still in flight.
    setActiveTab("worksheet");

    // Run the lighter five in parallel.
    await Promise.all([
      runStep("deck", () => buildDeck(spec), (r, val) => { r.deck = val; }),
      runStep("exitTicket", () => buildExitTicket(spec), (r, val) => { r.exitTicket = val; }),
      runStep("hook", () => buildHookVideo(spec), (r, val) => { r.hook = val; }),
      runStep("starter", () => buildSpacedStarter(spec), (r, val) => { r.starter = val; }),
      runStep("parentNote", () => buildParentNote(spec), (r, val) => { r.parentNote = val; }),
    ]);

    setRunning(false);
    if (!cancelRef.current) {
      toast.success("Lesson bundle ready — six aligned outputs.");
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setRunning(false);
    toast.message("Cancelled — completed steps are kept.");
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/home" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand">
            <ChevronLeft className="w-3 h-3" /> Back to home
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Lesson Bundle</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            One learning intention → six aligned outputs. Worksheet, slide deck, exit ticket, 30-second hook video script,
            spaced-retrieval starter for next week, and a parent note. All share the same vocabulary and examples.
          </p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-brand/10 text-brand font-semibold uppercase">
          Free — runs on your existing AI providers
        </span>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lb-subject">Subject *</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="lb-subject"><SelectValue placeholder="Choose subject…" /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS_ALL.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lb-year">Year group *</Label>
              <Select value={yearGroup} onValueChange={setYearGroup}>
                <SelectTrigger id="lb-year"><SelectValue placeholder="Choose year…" /></SelectTrigger>
                <SelectContent>
                  {YEAR_GROUPS.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lb-topic">Topic *</Label>
              <Input
                id="lb-topic"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Equivalent fractions, Photosynthesis, Roman emperors"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lb-li">Learning intention *</Label>
              <Textarea
                id="lb-li"
                value={learningIntention}
                onChange={e => setLearningIntention(e.target.value)}
                placeholder="By the end of the lesson, pupils will be able to…"
                rows={2}
              />
              <p className="text-[11px] text-muted-foreground">
                One sentence. This is the spine of every output — be specific.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lb-duration">Duration (mins)</Label>
              <Select value={durationMins} onValueChange={setDurationMins}>
                <SelectTrigger id="lb-duration"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATIONS.map(d => <SelectItem key={d} value={d}>{d} mins</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lb-send">SEND need (optional)</Label>
              <Select value={sendNeed} onValueChange={setSendNeed}>
                <SelectTrigger id="lb-send"><SelectValue placeholder="None / mixed ability" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None / mixed ability</SelectItem>
                  {SEND_NEEDS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lb-prior">Prior learning (optional)</Label>
              <Textarea
                id="lb-prior"
                value={priorLearning}
                onChange={e => setPriorLearning(e.target.value)}
                placeholder="What pupils already know about this — keeps the bundle from re-teaching."
                rows={2}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Six AI calls in total. ≈ 60–120 seconds end-to-end.
            </p>
            <div className="flex gap-2">
              {running && (
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleGenerate}
                disabled={running || !spec}
                className="bg-brand hover:bg-brand/90 text-white gap-1.5"
                size="sm"
              >
                {running ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Building bundle…</> : <><Sparkles className="w-3.5 h-3.5" /> Build lesson bundle</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status strip */}
      {result && (
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2">
              {STEP_KEYS.map(k => {
                const status = result.status[k];
                const colour =
                  status === "ok" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : status === "running" ? "bg-amber-100 text-amber-700 border-amber-200"
                  : status === "failed" ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-muted text-muted-foreground border-border";
                return (
                  <button
                    key={k}
                    onClick={() => setActiveTab(k)}
                    className={`text-xs border rounded-full px-3 py-1 inline-flex items-center gap-1.5 ${colour} ${activeTab === k ? "ring-2 ring-brand/40" : ""}`}
                    title={result.errors[k] || undefined}
                  >
                    {status === "running" && <Loader2 className="w-3 h-3 animate-spin" />}
                    {status === "ok" && <Check className="w-3 h-3" />}
                    {STEP_LABELS[k]}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outputs */}
      {result && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StepKey)} className="w-full">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 mb-3">
            <TabsTrigger value="worksheet"><FileText className="w-3 h-3 mr-1" />Worksheet</TabsTrigger>
            <TabsTrigger value="deck"><Presentation className="w-3 h-3 mr-1" />Deck</TabsTrigger>
            <TabsTrigger value="exitTicket"><ClipboardCheck className="w-3 h-3 mr-1" />Exit ticket</TabsTrigger>
            <TabsTrigger value="hook"><Video className="w-3 h-3 mr-1" />Hook</TabsTrigger>
            <TabsTrigger value="starter"><RefreshCw className="w-3 h-3 mr-1" />Starter</TabsTrigger>
            <TabsTrigger value="parentNote"><Mail className="w-3 h-3 mr-1" />Parent note</TabsTrigger>
          </TabsList>

          {/* Worksheet */}
          <TabsContent value="worksheet">
            <ArtefactCard
              title="Worksheet"
              status={result.status.worksheet}
              error={result.errors.worksheet}
            >
              {result.worksheet && (
                <div className="space-y-3">
                  <div className="rounded-md border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">
                    <span className="font-medium">{result.worksheet.title}</span>
                    {result.worksheet.subtitle ? <> — {result.worksheet.subtitle}</> : null}
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Suspense fallback={<div className="text-xs text-muted-foreground p-3">Loading worksheet…</div>}>
                      <WorksheetRenderer
                        worksheet={{
                          title: result.worksheet.title,
                          subtitle: result.worksheet.subtitle,
                          sections: result.worksheet.sections as any,
                          metadata: result.worksheet.metadata as any,
                          isAI: true,
                        }}
                        viewMode="teacher"
                        textSize={14}
                        overlayColor="#ffffff"
                        editMode={false}
                        editedSections={{}}
                      />
                    </Suspense>
                  </motion.div>
                  <p className="text-[11px] text-muted-foreground">
                    Want to edit, share or print this? Open it in the full <Link href="/worksheets" className="text-brand hover:underline">Worksheet generator</Link>.
                  </p>
                </div>
              )}
            </ArtefactCard>
          </TabsContent>

          {/* Deck */}
          <TabsContent value="deck">
            <ArtefactCard
              title="8-slide lesson deck"
              status={result.status.deck}
              error={result.errors.deck}
              onCopy={result.deck ? () => handleCopy("deck", deckToText(result.deck!)) : undefined}
              copied={copiedKey === "deck"}
            >
              {result.deck && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {result.deck.slides.map((s, i) => (
                    <div key={i} className="rounded-lg border border-border/50 bg-card p-3">
                      <p className="text-[10px] uppercase text-muted-foreground font-semibold">Slide {i + 1}</p>
                      <h3 className="font-semibold text-sm mt-1 mb-1.5">{s.title}</h3>
                      <ul className="space-y-1 text-sm text-foreground/90 list-disc ml-4">
                        {s.bullets.map((b, j) => <li key={j}>{b}</li>)}
                      </ul>
                      {s.teacherNote && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                          <strong>Teacher note:</strong> {s.teacherNote}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ArtefactCard>
          </TabsContent>

          {/* Exit ticket */}
          <TabsContent value="exitTicket">
            <ArtefactCard
              title="Exit ticket"
              status={result.status.exitTicket}
              error={result.errors.exitTicket}
              onCopy={result.exitTicket ? () => handleCopy("et", exitTicketToText(result.exitTicket!)) : undefined}
              copied={copiedKey === "et"}
            >
              {result.exitTicket && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">{result.exitTicket.prompt}</p>
                  <ol className="space-y-2 list-decimal ml-5">
                    {result.exitTicket.questions.map((q, i) => (
                      <li key={i} className="text-sm">
                        <p className="text-foreground">{q.q}</p>
                        <p className="text-xs text-muted-foreground mt-0.5"><strong>Model:</strong> {q.a}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </ArtefactCard>
          </TabsContent>

          {/* Hook video */}
          <TabsContent value="hook">
            <ArtefactCard
              title="30-second hook video script"
              status={result.status.hook}
              error={result.errors.hook}
              onCopy={result.hook ? () => handleCopy("hook", hookToText(result.hook!)) : undefined}
              copied={copiedKey === "hook"}
            >
              {result.hook && (
                <div className="space-y-2">
                  {result.hook.script.map((line, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr] gap-3 items-start">
                      <p className="text-sm text-foreground border-l-2 border-brand pl-2">{line}</p>
                      <p className="text-xs text-muted-foreground italic">📹 {result.hook!.visuals[i] || "—"}</p>
                    </div>
                  ))}
                  <p className="text-[11px] text-muted-foreground pt-2">~{result.hook.durationSec}s — read at a normal pace.</p>
                </div>
              )}
            </ArtefactCard>
          </TabsContent>

          {/* Spaced starter */}
          <TabsContent value="starter">
            <ArtefactCard
              title="Spaced-retrieval starter (next week)"
              status={result.status.starter}
              error={result.errors.starter}
              onCopy={result.starter ? () => handleCopy("st", starterToText(result.starter!)) : undefined}
              copied={copiedKey === "st"}
            >
              {result.starter && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">{result.starter.prompt}</p>
                  <ol className="space-y-2 list-decimal ml-5">
                    {result.starter.questions.map((q, i) => (
                      <li key={i} className="text-sm">
                        <p className="text-foreground">{q}</p>
                        <p className="text-xs text-muted-foreground mt-0.5"><strong>Model:</strong> {result.starter!.answers[i] || "—"}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </ArtefactCard>
          </TabsContent>

          {/* Parent note */}
          <TabsContent value="parentNote">
            <ArtefactCard
              title="Parent note"
              status={result.status.parentNote}
              error={result.errors.parentNote}
              onCopy={result.parentNote ? () => handleCopy("pn", `${result.parentNote!.subject}\n\n${result.parentNote!.body}`) : undefined}
              copied={copiedKey === "pn"}
            >
              {result.parentNote && (
                <div className="space-y-2">
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Subject</p>
                  <p className="text-sm font-medium">{result.parentNote.subject}</p>
                  <p className="text-xs uppercase text-muted-foreground font-semibold pt-2">Body</p>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{result.parentNote.body}</p>
                </div>
              )}
            </ArtefactCard>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ArtefactCard({
  title, status, error, children, onCopy, copied,
}: {
  title: string;
  status: BundleResult["status"][StepKey];
  error: string | null;
  children: React.ReactNode;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">{title}</h2>
          {onCopy && status === "ok" && (
            <Button size="sm" variant="outline" onClick={onCopy} className="gap-1.5">
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </Button>
          )}
        </div>
        {status === "pending" && (
          <p className="text-sm text-muted-foreground italic">Waiting…</p>
        )}
        {status === "running" && (
          <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…
          </p>
        )}
        {status === "failed" && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-medium">This step failed.</p>
            {error && <p className="text-xs mt-1">{error}</p>}
          </div>
        )}
        {status === "ok" && children}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Plain-text exporters (used by the Copy buttons)
// ─────────────────────────────────────────────────────────────────────────────

function deckToText(deck: SlideDeck): string {
  let out = `${deck.title}\n\n`;
  deck.slides.forEach((s, i) => {
    out += `Slide ${i + 1} — ${s.title}\n`;
    s.bullets.forEach(b => { out += `  • ${b}\n`; });
    if (s.teacherNote) out += `  (Teacher note: ${s.teacherNote})\n`;
    out += "\n";
  });
  return out.trim();
}

function exitTicketToText(et: ExitTicket): string {
  let out = `${et.prompt}\n\n`;
  et.questions.forEach((q, i) => {
    out += `${i + 1}. ${q.q}\n   Model: ${q.a}\n\n`;
  });
  return out.trim();
}

function hookToText(h: HookVideo): string {
  let out = `30-second hook script\n\n`;
  h.script.forEach((line, i) => {
    out += `LINE ${i + 1}: ${line}\n`;
    out += `VISUAL: ${h.visuals[i] || "—"}\n\n`;
  });
  return out.trim();
}

function starterToText(s: SpacedStarter): string {
  let out = `${s.prompt}\n\n`;
  s.questions.forEach((q, i) => {
    out += `${i + 1}. ${q}\n   Model: ${s.answers[i] || "—"}\n\n`;
  });
  return out.trim();
}
