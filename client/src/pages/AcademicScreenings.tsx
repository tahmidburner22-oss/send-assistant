import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Clock3, FlaskConical, GraduationCap, Loader2, Pause, Play, Printer, RefreshCw, Target, Timer, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext";
import { data as dataApi } from "@/lib/api";
import {
  buildAcademicScreening,
  getAssessmentBlueprint,
  getItemCount,
  markAcademicScreening,
  SUBJECT_LABELS,
  type AcademicSubject,
  type AssessmentDuration,
  type ScreeningConfig,
  type ScreeningItem,
  type ScreeningReport,
} from "@/lib/academicScreening";

const YEAR_GROUPS = ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11"];
const DURATIONS: AssessmentDuration[] = [15, 30, 60];

const SUBJECT_META: Record<AcademicSubject, { icon: typeof BarChart3; description: string; accent: string }> = {
  mathematics: { icon: BarChart3, description: "Number, Algebra, Geometry, Statistics and Probability", accent: "border-blue-300 bg-blue-50 text-blue-900" },
  english: { icon: BookOpen, description: "Vocabulary, Grammar, Reading and Sentence Craft", accent: "border-violet-300 bg-violet-50 text-violet-900" },
  science: { icon: FlaskConical, description: "Biology, Chemistry, Physics and Working Scientifically", accent: "border-emerald-300 bg-emerald-50 text-emerald-900" },
};

function formatClock(seconds: number): string {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const remainder = Math.max(0, seconds) % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function reportFromSaved(row: any): ScreeningReport {
  return {
    score: row.score,
    total: row.totalQuestions,
    percentage: row.percentage,
    timeTakenSeconds: row.timeTakenSeconds,
    domainResults: row.domainResults || [],
    strengths: row.strengths || [],
    focusAreas: row.focusAreas || [],
    revisionTips: row.revisionTips || [],
    curriculumAgeMonths: row.curriculumAgeMonths,
    curriculumAge: `${Math.floor(row.curriculumAgeMonths / 12)} years ${row.curriculumAgeMonths % 12} months`,
    itemResults: row.itemResults || [],
  };
}

export default function AcademicScreenings() {
  const { children } = useApp();
  const [subject, setSubject] = useState<AcademicSubject>("mathematics");
  const [yearGroup, setYearGroup] = useState("Year 7");
  const [duration, setDuration] = useState<AssessmentDuration>(15);
  const [pupilId, setPupilId] = useState("unassigned");
  const [items, setItems] = useState<ScreeningItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [report, setReport] = useState<ScreeningReport | null>(null);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const config = useMemo<ScreeningConfig>(() => ({ subject, yearGroup, duration }), [subject, yearGroup, duration]);
  const blueprint = useMemo(() => getAssessmentBlueprint(config), [config]);
  const active = items.length > 0 && !report;
  const currentItem = items[questionIndex];
  const answeredCount = Object.values(answers).filter((answer) => answer.trim()).length;
  const selectedPupil = children.find((child) => child.id === pupilId);

  const loadReports = useCallback(async () => {
    try {
      const results = await dataApi.academicScreenings.list();
      setSavedReports(results);
    } catch {
      // The assessment remains usable if a historic report request is unavailable.
    }
  }, []);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const finishScreen = useCallback(async () => {
    if (!active || !startedAt) return;
    const timeTakenSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const completedReport = markAcademicScreening(items, answers, config, timeTakenSeconds);
    setReport(completedReport);
    setIsSaving(true);
    try {
      await dataApi.academicScreenings.create({
        pupilId: pupilId === "unassigned" ? undefined : pupilId,
        subject,
        yearGroup,
        durationMinutes: duration,
        score: completedReport.score,
        totalQuestions: completedReport.total,
        percentage: completedReport.percentage,
        timeTakenSeconds: completedReport.timeTakenSeconds,
        curriculumAgeMonths: completedReport.curriculumAgeMonths,
        responses: answers,
        domainResults: completedReport.domainResults,
        strengths: completedReport.strengths,
        focusAreas: completedReport.focusAreas,
        revisionTips: completedReport.revisionTips,
        itemResults: completedReport.itemResults,
      });
      toast.success("Academic screening report saved.");
      void loadReports();
    } catch {
      toast.error("The report is ready, but could not be saved. Please try again later.");
    } finally {
      setIsSaving(false);
    }
  }, [active, answers, config, duration, items, loadReports, pupilId, startedAt, subject, yearGroup]);

  useEffect(() => {
    if (!active || paused) return;
    const timer = window.setInterval(() => setSecondsRemaining((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [active, paused]);

  useEffect(() => {
    if (active && secondsRemaining === 0) void finishScreen();
  }, [active, finishScreen, secondsRemaining]);

  function startScreen() {
    setItems(buildAcademicScreening(config));
    setAnswers({});
    setQuestionIndex(0);
    setSecondsRemaining(duration * 60);
    setStartedAt(Date.now());
    setPaused(false);
    setReport(null);
  }

  function startAnother() {
    setItems([]);
    setAnswers({});
    setQuestionIndex(0);
    setSecondsRemaining(0);
    setStartedAt(null);
    setPaused(false);
    setReport(null);
  }

  if (report) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 print:p-0" aria-live="polite">
        <section className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-light/50 via-background to-emerald-50 p-5 print:border-0 print:bg-white">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2 text-brand"><Trophy className="h-5 w-5" /><span className="text-sm font-semibold">Academic screening report</span></div>
              <h1 className="mt-2 text-2xl font-bold text-foreground">{SUBJECT_LABELS[subject]} · {yearGroup}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{duration}-minute year-specific baseline assessment {selectedPupil ? `for ${selectedPupil.name}` : ""}</p>
            </div>
            <div className="rounded-xl border border-brand/20 bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Marks</p>
              <p className="text-3xl font-bold text-brand">{report.score}/{report.total}</p>
              <p className="text-sm text-muted-foreground">{report.percentage}% · {formatClock(report.timeTakenSeconds)} used</p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardDescription>Curriculum working-age estimate</CardDescription><CardTitle className="text-xl">{report.curriculumAge}</CardTitle></CardHeader><CardContent><p className="text-xs leading-relaxed text-muted-foreground">Estimate only, based on this original Adaptly screen. It is not a standardised score, diagnosis, or substitute for a normed assessment.</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Strongest domains</CardDescription><CardTitle className="text-base">{report.strengths.length ? report.strengths.join(" · ") : "More evidence needed"}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">Domains at 75% or above are highlighted as current strengths.</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Priority focus</CardDescription><CardTitle className="text-base">{report.focusAreas.length ? report.focusAreas.join(" · ") : "No priority gap identified"}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">Domains below 60% receive targeted revision actions.</p></CardContent></Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-brand" />Domain breakdown</CardTitle></CardHeader><CardContent className="space-y-4">{report.domainResults.map((result) => <div key={result.domain}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="font-medium">{result.domain}</span><span>{result.correct}/{result.total} · {result.percentage}%</span></div><Progress value={result.percentage} /></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-brand" />Revision next steps</CardTitle></CardHeader><CardContent className="space-y-3">{report.revisionTips.length ? report.revisionTips.map((tip) => <p key={tip} className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm leading-relaxed">{tip}</p>) : <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Keep practising across the subject to confirm the strong performance shown in this screen.</p>}</CardContent></Card>
        </div>

        <Card><CardHeader><CardTitle>Marked question review</CardTitle><CardDescription>Every question is marked against an authored answer rule and an explicit mark allocation. Generative AI is not used to determine marks.</CardDescription></CardHeader><CardContent className="space-y-3">{items.map((item, index) => { const result = report.itemResults[index]; return <div key={item.id} className={`rounded-lg border p-3 ${result.correct ? "border-emerald-200 bg-emerald-50/40" : "border-amber-200 bg-amber-50/40"}`}><div className="flex gap-2"><CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${result.correct ? "text-emerald-600" : "text-amber-600"}`} /><div><div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm font-medium">{index + 1}. {item.prompt}</p><span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-semibold">{result.marksAwarded}/{result.marksAvailable} marks</span></div><p className="mt-1 text-xs text-muted-foreground">Your answer: {answers[item.id] || "No answer"} · Expected: {result.expectedAnswer}</p><p className="mt-1 text-xs leading-relaxed text-foreground">{result.explanation}</p></div></div></div>; })}</CardContent></Card>

        <div className="flex flex-wrap gap-2 print:hidden"><Button onClick={startAnother}><RefreshCw className="mr-2 h-4 w-4" />Start another baseline</Button><Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print report</Button>{isSaving && <span className="inline-flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving report</span>}</div>
      </div>
    );
  }

  if (active && currentItem) {
    const progress = ((questionIndex + 1) / items.length) * 100;
    return (
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div><p className="text-sm font-semibold">{SUBJECT_LABELS[subject]} baseline assessment</p><p className="text-xs text-muted-foreground">Question {questionIndex + 1} of {items.length} · {answeredCount} answered · {blueprint.totalMarks} marks available</p></div>
          <div className={`rounded-lg px-3 py-2 font-mono text-lg font-bold ${secondsRemaining < 60 ? "bg-red-50 text-red-700" : "bg-muted text-foreground"}`} aria-label={`${formatClock(secondsRemaining)} remaining`}><Timer className="mr-1 inline h-4 w-4" />{formatClock(secondsRemaining)}</div>
        </div>
        <Progress value={progress} aria-label={`Assessment progress ${Math.round(progress)} percent`} />
        <Card className="overflow-hidden"><CardHeader className="border-b bg-muted/30"><div className="flex items-center justify-between gap-3"><div><CardDescription>{currentItem.domain} · {currentItem.curriculumReference}</CardDescription><CardTitle className="mt-1 text-lg">Question {questionIndex + 1}</CardTitle></div><div className="flex flex-wrap justify-end gap-2"><span className="rounded-full border border-brand/30 bg-brand-light/40 px-2.5 py-1 text-xs font-semibold text-brand">{currentItem.marks} mark{currentItem.marks === 1 ? "" : "s"}</span><span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium">{currentItem.kind === "multiple-choice" ? "Choose one answer" : "Write your answer"}</span></div></div></CardHeader><CardContent className="space-y-5 p-5"><p className="text-lg font-medium leading-relaxed">{currentItem.prompt}</p><p className="text-xs text-muted-foreground">Suggested working time: about {Math.ceil(currentItem.suggestedSeconds / 60)} minute{currentItem.suggestedSeconds >= 90 ? "s" : ""}. Give your best answer before moving on.</p>{currentItem.context && <blockquote className="rounded-lg border-l-4 border-brand bg-brand-light/30 p-4 text-sm leading-relaxed text-foreground">{currentItem.context}</blockquote>}{currentItem.kind === "multiple-choice" ? <div className="grid gap-2 sm:grid-cols-2">{currentItem.options?.map((option) => <button key={option} type="button" onClick={() => setAnswers((previous) => ({ ...previous, [currentItem.id]: option }))} className={`rounded-xl border p-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${answers[currentItem.id] === option ? "border-brand bg-brand-light text-brand" : "border-border bg-background hover:bg-muted"}`}>{option}</button>)}</div> : <div className="max-w-xl"><Label htmlFor="screen-answer">Your answer</Label><Input id="screen-answer" className="mt-1 h-11 text-base" value={answers[currentItem.id] || ""} onChange={(event) => setAnswers((previous) => ({ ...previous, [currentItem.id]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter" && questionIndex < items.length - 1) setQuestionIndex((index) => index + 1); }} autoComplete="off" /></div>}</CardContent></Card>
        <div className="flex flex-wrap justify-between gap-2"><Button variant="outline" disabled={questionIndex === 0} onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button><div className="flex gap-2"><Button variant="outline" onClick={() => setPaused((value) => !value)}>{paused ? <><Play className="mr-1 h-4 w-4" />Resume</> : <><Pause className="mr-1 h-4 w-4" />Pause</>}</Button>{questionIndex < items.length - 1 ? <Button onClick={() => setQuestionIndex((index) => index + 1)}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button> : <Button onClick={() => void finishScreen()}>Finish and mark</Button>}</div></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
      <section className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-light/50 via-background to-blue-50 p-5"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white"><Clock3 className="h-5 w-5" /></div><div><h1 className="text-2xl font-bold text-foreground">Baseline Assessments</h1><p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">Run original, year-specific Mathematics, English or Science baseline assessments for Years 7–11. Every question has an explicit mark allocation, time guidance and curriculum focus; results identify strengths, teaching priorities and next steps.</p></div></div></section>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]"><Card><CardHeader><CardTitle>Set up a screen</CardTitle><CardDescription>Choose the subject, curriculum year, duration, and optional pupil record.</CardDescription></CardHeader><CardContent className="space-y-5"><div><Label>Subject</Label><div className="mt-2 grid gap-2 md:grid-cols-3">{(Object.keys(SUBJECT_META) as AcademicSubject[]).map((candidate) => { const meta = SUBJECT_META[candidate]; const Icon = meta.icon; return <button key={candidate} type="button" onClick={() => setSubject(candidate)} className={`rounded-xl border p-3 text-left transition-colors ${subject === candidate ? meta.accent : "border-border bg-background hover:bg-muted"}`}><Icon className="h-5 w-5" /><p className="mt-2 text-sm font-semibold">{SUBJECT_LABELS[candidate]}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{meta.description}</p></button>; })}</div></div><div className="grid gap-4 sm:grid-cols-2"><div><Label>Year group</Label><Select value={yearGroup} onValueChange={setYearGroup}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{YEAR_GROUPS.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent></Select></div><div><Label>Attach to a pupil</Label><Select value={pupilId} onValueChange={setPupilId}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassigned">Do not attach this attempt</SelectItem>{children.map((child) => <SelectItem key={child.id} value={child.id}>{child.name} · {child.yearGroup}</SelectItem>)}</SelectContent></Select></div></div><div><Label>Timed format</Label><div className="mt-2 grid gap-2 sm:grid-cols-3">{DURATIONS.map((candidate) => { const candidateBlueprint = getAssessmentBlueprint({ subject, yearGroup, duration: candidate }); return <button key={candidate} type="button" onClick={() => setDuration(candidate)} className={`rounded-xl border p-3 text-left ${duration === candidate ? "border-brand bg-brand-light text-brand" : "border-border bg-background hover:bg-muted"}`}><p className="font-semibold">{candidate} minutes</p><p className="mt-1 text-xs text-muted-foreground">{candidateBlueprint.itemCount} questions · {candidateBlueprint.totalMarks} marks</p></button>; })}</div></div><div className="rounded-xl border border-brand/20 bg-brand-light/20 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-foreground">Assessment blueprint</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{blueprint.itemCount} original questions · {blueprint.totalMarks} marks · about {Math.ceil(blueprint.plannedSeconds / 60)} minutes of working time within a {duration}-minute window.</p></div><span className="rounded-full border border-brand/20 bg-background px-2.5 py-1 text-xs font-semibold text-brand">{yearGroup} · {SUBJECT_LABELS[subject]}</span></div><p className="mt-3 text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Coverage:</strong> {blueprint.domains.join(" · ")}</p></div><Button size="lg" className="w-full" onClick={startScreen}><Play className="mr-2 h-4 w-4" />Start {duration}-minute {SUBJECT_LABELS[subject]} baseline</Button></CardContent></Card>
        <Card><CardHeader><CardTitle>How results are used</CardTitle></CardHeader><CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground"><p><strong className="text-foreground">Immediate marking.</strong> Multiple-choice and short-answer questions use authored deterministic mark rules.</p><p><strong className="text-foreground">Useful teaching evidence.</strong> Reports show domain-level strengths, focus areas, and practical next steps.</p><p><strong className="text-foreground">Important limitation.</strong> The curriculum working-age estimate is not a standardised age score or diagnosis. Use it as a prompt for teaching and further evidence gathering.</p><p className="rounded-lg border border-border bg-muted/30 p-3 text-xs">All question content is original to Adaptly. This screen is not a reproduction of NGRT or any other proprietary assessment.</p></CardContent></Card></div>

      {savedReports.length > 0 && <Card><CardHeader><CardTitle>Recent academic screening reports</CardTitle><CardDescription>School-scoped reports saved from this workspace.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{savedReports.slice(0, 6).map((saved) => { const savedReport = reportFromSaved(saved); return <div key={saved.id} className="rounded-xl border border-border p-3"><p className="text-sm font-semibold">{SUBJECT_LABELS[saved.subject as AcademicSubject]} · {saved.yearGroup}</p><p className="mt-1 text-xs text-muted-foreground">{saved.pupilName || "Not attached"} · {saved.durationMinutes} minutes</p><div className="mt-3 flex justify-between gap-3 text-sm"><span>{savedReport.score}/{savedReport.total} · {savedReport.percentage}%</span><span className="text-muted-foreground">{savedReport.curriculumAge}</span></div></div>; })}</CardContent></Card>}
    </div>
  );
}
