/**
 * RevisionSessionLanding — the configure-and-launch screen for the Parent
 * Portal's "All-in-One Revision Session" feature.
 *
 * Layout
 *  • Hero card — friendly greeting + AccessibilityPanel
 *  • Configure card — subject / topic / duration / difficulty / stretch mode
 *  • Phase preview — live "your hour will look like" strip
 *  • Advanced (collapsed) — per-phase minute sliders for parents who want
 *    to tweak the recipe
 *  • In-progress banner — if a session was paused / closed mid-way
 *  • Recent sessions — last few completed runs with score + mood
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Layers,
  Play,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import AccessibilityPanel, { type AccessibilityStyles } from "@/components/AccessibilityPanel";
import { phaseIcon, phaseShortLabel } from "./phase-meta";
import {
  PHASE_TEMPLATES,
  buildPlan,
  formatMinutes,
} from "@/lib/revision-session-planner";
import {
  clearInProgress,
  deleteRunFromHistory,
  loadInProgress,
  newId,
  summariseHistory,
  type RevisionSessionPlan,
  type RevisionSessionRun,
  type StretchMode,
} from "@/lib/revision-session-store";
import { unlockAudio } from "@/lib/revision-sound";
import {
  getSubjectsForYearGroup,
  getDifficultyOptions,
  getLibrarySubjectName,
} from "@/lib/send-data";
import { TOPIC_BANK } from "@/lib/topic-bank";
import type { ActiveChild } from "./phase-types";

// Subject id → topic-bank key. The bank uses english/mathematics/science etc.
const TOPIC_BANK_SUBJECT_KEY: Record<string, string> = {
  mathematics: "mathematics",
  maths: "mathematics",
  english: "english",
  science: "science",
  biology: "biology",
  chemistry: "chemistry",
  physics: "physics",
  history: "history",
  geography: "geography",
  computing: "computing",
  "computer-science": "computing",
  mfl: "mfl",
  re: "re",
  pshe: "pshe",
  business: "business",
};

interface Props {
  child: ActiveChild;
  /** Called with a full plan + session id when the parent presses Start. */
  onStart: (plan: RevisionSessionPlan, sessionId: string) => void;
  /** Called when the parent chooses to resume a saved in-progress session. */
  onResume: (run: RevisionSessionRun) => void;
}

const DURATION_OPTIONS = [
  { mins: 30, label: "30 min" },
  { mins: 45, label: "45 min" },
  { mins: 60, label: "60 min" },
  { mins: 90, label: "90 min" },
];

const STRETCH_OPTIONS: Array<{ id: StretchMode; label: string; blurb: string }> = [
  { id: "ai-worksheet",   label: "AI question sheet",   blurb: "3 exam-style questions, marked here." },
  { id: "past-paper",     label: "Past paper questions", blurb: "Open the past papers library." },
  { id: "worked-example", label: "Worked example",       blurb: "Walk through 2 examples step-by-step." },
];

export default function RevisionSessionLanding({ child, onStart, onResume }: Props) {
  // ── Accessibility prefs ─────────────────────────────────────────────────
  const [styles, setStyles] = useState<AccessibilityStyles>({
    fontSize: 14,
    fontFamily: "inherit",
    backgroundColor: "#FFFFFF",
  });

  // ── Subjects + topics (filtered by year group) ──────────────────────────
  const subjects = useMemo(
    () => getSubjectsForYearGroup(child.yearGroup),
    [child.yearGroup],
  );
  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id || "mathematics");
  const subject = subjects.find((s) => s.id === subjectId) ?? subjects[0];

  const topicList = useMemo(() => {
    const key = TOPIC_BANK_SUBJECT_KEY[subjectId] || subjectId;
    return TOPIC_BANK[key] ?? TOPIC_BANK.mathematics;
  }, [subjectId]);

  const [topic, setTopic] = useState<string>(topicList[0]?.topic ?? "");
  // When subject changes, reset topic to the first one for that subject.
  useEffect(() => {
    if (!topicList.find((t) => t.topic === topic)) {
      setTopic(topicList[0]?.topic ?? "");
    }
  }, [topicList, topic]);

  // ── Difficulty + stretch mode + duration ────────────────────────────────
  const difficultyOptions = useMemo(
    () => getDifficultyOptions(subjectId),
    [subjectId],
  );
  const [difficulty, setDifficulty] = useState<"foundation" | "mixed" | "higher">("mixed");
  const [stretchMode, setStretchMode] = useState<StretchMode>("ai-worksheet");
  const [durationMin, setDurationMin] = useState<number>(60);

  // ── Advanced phase weights ─────────────────────────────────────────────
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [phaseSecs, setPhaseSecs] = useState<number[]>(() =>
    PHASE_TEMPLATES.map((p) => Math.round(p.weight * 60 * 60)),
  );
  // When durationMin changes, rescale phaseSecs proportionally.
  useEffect(() => {
    const total = durationMin * 60;
    const ref = buildPlan({
      pupilId: child.id,
      pupilName: child.name,
      subject: subjectId,
      subjectLabel: subject?.name || getLibrarySubjectName(subjectId),
      topic,
      yearGroup: child.yearGroup,
      difficulty,
      totalSec: total,
      stretchMode,
    });
    setPhaseSecs(ref.phases.map((p) => p.durationSec));
  }, [durationMin, subjectId, topic, difficulty, stretchMode, child.id, child.name, child.yearGroup, subject?.name]);

  // ── Live plan preview ──────────────────────────────────────────────────
  const previewPlan = useMemo(
    () =>
      buildPlan({
        pupilId: child.id,
        pupilName: child.name,
        subject: subjectId,
        subjectLabel: subject?.name || getLibrarySubjectName(subjectId),
        topic,
        yearGroup: child.yearGroup,
        difficulty,
        totalSec: durationMin * 60,
        stretchMode,
        customWeights: advancedOpen
          ? phaseSecs.map((s) => s)
          : undefined,
      }),
    [child, subjectId, subject?.name, topic, difficulty, durationMin, stretchMode, advancedOpen, phaseSecs],
  );

  // ── In-progress + history ─────────────────────────────────────────────
  const [inProgress, setInProgress] = useState<RevisionSessionRun | null>(null);
  const [history, setHistory] = useState(() => summariseHistory(child.id));
  useEffect(() => {
    setInProgress(loadInProgress(child.id));
    setHistory(summariseHistory(child.id));
  }, [child.id]);

  const handleStart = () => {
    unlockAudio();
    const plan: RevisionSessionPlan = {
      ...previewPlan,
      // Ensure plan id is fresh for each "Start" press.
      id: newId("plan"),
    };
    onStart(plan, newId("rs"));
  };

  const handleResume = () => {
    if (inProgress) onResume(inProgress);
  };

  const handleDiscardInProgress = () => {
    clearInProgress(child.id);
    setInProgress(null);
  };

  const handleDeleteHistory = (runId: string) => {
    deleteRunFromHistory(child.id, runId);
    setHistory(summariseHistory(child.id));
  };

  const moodEmoji = (m: 1 | 2 | 3 | 4 | 5 | null) =>
    m === null ? "—" : ["😣", "🙁", "😐", "🙂", "😄"][m - 1];

  return (
    <div
      className="space-y-4"
      style={{
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
        backgroundColor: styles.backgroundColor === "#FFFFFF" ? undefined : styles.backgroundColor,
      }}
    >
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-xl"
      >
        <div className="pointer-events-none absolute -top-16 -right-12 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-black/10 blur-3xl" />
        <div className="relative px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/20 ring-4 ring-white/30 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-extrabold leading-tight">
                Let's revise with {child.name}
              </h2>
              <p className="text-sm text-white/90 mt-0.5 leading-relaxed">
                Pick a topic and we'll build a SEND-friendly session — a lesson, a quiz,
                a brain break, harder questions and flashcards. All in one place.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  {child.yearGroup}
                </span>
                {child.sendNeeds.slice(0, 3).map((n) => (
                  <span
                    key={n}
                    className="inline-flex items-center text-[11px] font-semibold bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Accessibility row */}
      <AccessibilityPanel onChange={setStyles} />

      {/* ── In-progress banner ─────────────────────────────────────────── */}
      {inProgress && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-3 sm:p-4 flex items-start gap-3"
        >
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900 text-sm">
              You have a session in progress
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              {inProgress.plan.subjectLabel}: {inProgress.plan.topic} ·
              phase {inProgress.currentPhaseIndex + 1} of {inProgress.plan.phases.length}.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                type="button"
                onClick={handleResume}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Resume
              </button>
              <button
                type="button"
                onClick={handleDiscardInProgress}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-xl bg-white border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors"
              >
                Start fresh
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Configure card ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/50 bg-white shadow-sm p-4 space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          What are we revising?
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Subject</label>
            <Select value={subjectId} onValueChange={(v) => setSubjectId(v)}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Topic</label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {topicList.map((t) => (
                  <SelectItem key={t.topic} value={t.topic}>{t.topic}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">How long?</label>
          <div className="grid grid-cols-4 gap-1.5">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d.mins}
                type="button"
                onClick={() => setDurationMin(d.mins)}
                className={`h-10 rounded-xl border text-sm font-semibold transition-colors ${
                  durationMin === d.mins
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-border text-foreground hover:border-indigo-300 hover:bg-indigo-50/30"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Difficulty</label>
          <div className="grid grid-cols-3 gap-1.5">
            {difficultyOptions.map((d) => {
              const id = d.id as "foundation" | "mixed" | "higher";
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDifficulty(id)}
                  className={`h-10 rounded-xl border text-sm font-semibold transition-colors ${
                    difficulty === id
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "bg-white border-border text-foreground hover:border-violet-300 hover:bg-violet-50/30"
                  }`}
                  title={d.description}
                >
                  {d.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Stretch phase</label>
          <div className="grid sm:grid-cols-3 gap-1.5">
            {STRETCH_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStretchMode(opt.id)}
                className={`flex flex-col items-start gap-0.5 px-3 py-2 rounded-xl border text-left transition-colors ${
                  stretchMode === opt.id
                    ? "bg-amber-50 border-amber-300 ring-1 ring-amber-300"
                    : "bg-white border-border hover:border-amber-300"
                }`}
              >
                <span className="text-[12px] font-bold text-foreground">{opt.label}</span>
                <span className="text-[10px] text-muted-foreground leading-snug">
                  {opt.blurb}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Phase preview ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Your {durationMin}-minute session
          </p>
          <span className="text-[10px] text-indigo-700/80 uppercase tracking-wider">
            {previewPlan.phases.length} phases
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {previewPlan.phases.map((p, i) => {
            const Icon = phaseIcon(p.kind);
            return (
              <div
                key={`${p.kind}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-indigo-200 pl-1.5 pr-2.5 py-1"
              >
                <span className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center">
                  <Icon className="w-3 h-3 text-indigo-700" />
                </span>
                <span className="text-[11px] font-semibold text-indigo-900">
                  {phaseShortLabel(p)}
                </span>
                <span className="text-[10px] text-indigo-700/80 tabular-nums">
                  {formatMinutes(p.durationSec)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Advanced (optional sliders) */}
        <div>
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
          >
            {advancedOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Advanced — tweak each phase
          </button>
          {advancedOpen && (
            <div className="mt-2 space-y-2 rounded-xl bg-white/60 border border-indigo-100 p-3">
              {previewPlan.phases.map((p, i) => (
                <div key={`adv-${i}`} className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-24 text-[12px] font-medium text-indigo-900 truncate">
                    {phaseShortLabel(p)}
                  </div>
                  <Slider
                    min={Math.max(60, Math.round(PHASE_TEMPLATES[i].minSec))}
                    max={Math.max(60 * 6, durationMin * 60)}
                    step={30}
                    value={[phaseSecs[i] ?? p.durationSec]}
                    onValueChange={(vals) => {
                      setPhaseSecs((prev) => {
                        const next = [...prev];
                        next[i] = vals[0];
                        return next;
                      });
                    }}
                    className="flex-1"
                  />
                  <div className="flex-shrink-0 text-[11px] tabular-nums text-indigo-800 w-12 text-right">
                    {formatMinutes(phaseSecs[i] ?? p.durationSec)}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const ref = buildPlan({
                    pupilId: child.id,
                    pupilName: child.name,
                    subject: subjectId,
                    subjectLabel: subject?.name || getLibrarySubjectName(subjectId),
                    topic,
                    yearGroup: child.yearGroup,
                    difficulty,
                    totalSec: durationMin * 60,
                    stretchMode,
                  });
                  setPhaseSecs(ref.phases.map((x) => x.durationSec));
                }}
                className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 underline"
              >
                Reset to recommended
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Start button ──────────────────────────────────────────────── */}
      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={handleStart}
          disabled={!topic}
          className="inline-flex items-center gap-2 px-6 h-12 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5" />
          Start {child.name}'s session
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Recent sessions ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/50 bg-white p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            Recent sessions
          </p>
          {history.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {history.length} saved
            </span>
          )}
        </div>
        {history.length === 0 ? (
          <div className="rounded-xl bg-muted/30 px-4 py-6 text-center">
            <Layers className="w-6 h-6 mx-auto text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground mt-2">No sessions yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Once you finish a session, it'll appear here with the score and how it felt.
            </p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {history.map((s) => {
              const date = new Date(s.startedAt);
              const dateLabel = date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
              return (
                <li
                  key={s.id}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-white px-3 py-2 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {s.subjectLabel}: {s.topic}
                      </span>
                      {s.endedEarly && (
                        <span className="text-[9px] uppercase font-bold text-amber-700 bg-amber-100 rounded-full px-1.5">
                          early
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {dateLabel} · {s.durationMin} min
                      {s.quizScorePct !== null && <> · Quiz {s.quizScorePct}%</>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none" aria-label={s.mood ? `mood ${s.mood} of 5` : "no mood"}>
                      {moodEmoji(s.mood)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteHistory(s.id)}
                      aria-label="Delete this session"
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full hover:bg-rose-50 flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
