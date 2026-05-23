/**
 * RevisionSessionRunner — orchestrator for an active revision session.
 *
 * Owns:
 *  • the master clock for the current phase (elapsed seconds, paused flag),
 *  • the live `RevisionSessionRun` state (persisted to in-progress every
 *    couple of seconds and on every transition),
 *  • the phase-advance state machine (skip / +2 min / auto-advance / "I'm
 *    done" / final phase complete).
 *
 * Renders:
 *  • a top "Now playing" header with the timer + control row,
 *  • the PhaseSchedule strip,
 *  • the active phase component (LessonPhase, QuizPhase, etc.),
 *  • a footer with sound toggle, accessibility shortcuts, and the
 *    "I'm done — finish session" exit ramp.
 *
 * The Runner is route-less: ParentPortal renders <RevisionSessionRunner>
 * inside its `revision` section when there's an active session, otherwise
 * renders <RevisionSessionLanding>.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Check, X } from "lucide-react";

import AccessibilityPanel, { type AccessibilityStyles } from "@/components/AccessibilityPanel";

import PhaseSchedule from "./PhaseSchedule";
import PhaseTimer from "./PhaseTimer";
import { phaseShortLabel } from "./phase-meta";

import WarmupPhase from "./phases/WarmupPhase";
import LessonPhase from "./phases/LessonPhase";
import BreakPhase from "./phases/BreakPhase";
import QuizPhase from "./phases/QuizPhase";
import StretchPhase from "./phases/StretchPhase";
import FlashcardsPhase from "./phases/FlashcardsPhase";
import ReflectPhase from "./phases/ReflectPhase";

import type { ActiveChild, PhaseComponentProps } from "./phase-types";
import {
  clearInProgress,
  clearNotes,
  saveCompletedRun,
  saveInProgress,
  type PhaseProgress,
  type RevisionPhase,
  type RevisionSessionPlan,
  type RevisionSessionRun,
} from "@/lib/revision-session-store";

// ─── Public API ────────────────────────────────────────────────────────────

interface RunnerProps {
  /** The pupil this session belongs to. */
  child: ActiveChild;
  /** The full session plan (built by the planner on the landing page). */
  plan: RevisionSessionPlan;
  /** Stable session id used for in-progress persistence + notes pad. */
  sessionId: string;
  /** Optional: pass an existing run to resume mid-session. */
  resumeFrom?: RevisionSessionRun;
  /** Called when the session ends (saved or discarded). */
  onExit: () => void;
}

const TICK_MS = 1000;
const PERSIST_EVERY_TICKS = 5; // save to localStorage every 5 seconds

// ─── Component ─────────────────────────────────────────────────────────────

export default function RevisionSessionRunner({
  child,
  plan,
  sessionId,
  resumeFrom,
  onExit,
}: RunnerProps) {
  // ── Run state — initialise once. Either we resume an existing run or we
  //    create a fresh one with the warmup phase already started.
  const [run, setRun] = useState<RevisionSessionRun>(() =>
    resumeFrom ?? createFreshRun(plan, sessionId, child.id),
  );

  // Mutable working plan — phases may be extended (+2 min) over time. We
  // keep a copy so we can mutate `phases[i].durationSec` without poking at
  // the persisted plan object.
  const [livePlan, setLivePlan] = useState<RevisionSessionPlan>(
    resumeFrom?.plan ?? plan,
  );

  // ── Clock state ────────────────────────────────────────────────────────
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [styles, setStyles] = useState<AccessibilityStyles>({
    fontSize: 14,
    fontFamily: "inherit",
    backgroundColor: "#FFFFFF",
  });

  // ── Confirm-end-session dialog visibility
  const [confirmEnd, setConfirmEnd] = useState(false);

  // ── Tick counter to throttle persistence
  const persistTickRef = useRef<number>(0);

  // ── Derived state ──────────────────────────────────────────────────────
  const currentIndex = run.currentPhaseIndex;
  const currentPhase: RevisionPhase = livePlan.phases[currentIndex] ?? livePlan.phases[0];
  const currentTotalSec = currentPhase.durationSec;
  const remainingSec = Math.max(0, currentTotalSec - elapsedSec);

  /** Quiz mistakes accumulated so far — fed to FlashcardsPhase. */
  const quizMistakes = useMemo(() => {
    const out: Array<{ question: string; correctAnswer: string }> = [];
    run.phaseProgress.forEach((pp) => {
      const phase = livePlan.phases[pp.phaseIndex];
      if (!phase || phase.kind !== "quiz") return;
      (pp.itemResults ?? []).forEach((it) => {
        if (!it.correct && it.question) {
          out.push({
            question: it.question,
            correctAnswer: it.answer ?? "(check your notes)",
          });
        }
      });
    });
    return out;
  }, [run.phaseProgress, livePlan.phases]);

  // ── Persistence helpers ────────────────────────────────────────────────
  const persistRun = useCallback((next: RevisionSessionRun) => {
    saveInProgress(next);
  }, []);

  /** Patch the *current* phase's progress entry. */
  const patchCurrentProgress = useCallback(
    (patch: Partial<PhaseProgress>) => {
      setRun((prev) => {
        const idx = prev.currentPhaseIndex;
        const next = { ...prev };
        next.phaseProgress = prev.phaseProgress.map((p, i) =>
          i === prev.phaseProgress.length - 1 && p.phaseIndex === idx
            ? { ...p, ...patch }
            : p,
        );
        // Roll up totalScore — average across all quiz phases that have
        // produced one.
        const quizScores = next.phaseProgress
          .filter((p) => livePlan.phases[p.phaseIndex]?.kind === "quiz" && typeof p.score === "number")
          .map((p) => p.score as number);
        if (quizScores.length > 0) {
          next.totalScore = quizScores.reduce((a, b) => a + b, 0) / quizScores.length;
        }
        if (patch.reflection) {
          next.reflectionMood = patch.reflection.mood;
          next.reflectionNote = patch.reflection.note;
        }
        persistRun(next);
        return next;
      });
    },
    [livePlan.phases, persistRun],
  );

  // ── Phase advancement ──────────────────────────────────────────────────

  /** Move to the next phase, marking the current one complete-or-skipped. */
  const advancePhase = useCallback(
    (opts: { skipped?: boolean } = {}) => {
      setRun((prev) => {
        const idx = prev.currentPhaseIndex;
        const lastIdx = livePlan.phases.length - 1;
        const now = new Date().toISOString();

        // Close out the current phaseProgress entry.
        const closed = prev.phaseProgress.map((p, i) => {
          if (i !== prev.phaseProgress.length - 1) return p;
          return {
            ...p,
            endedAt: p.endedAt ?? now,
            completed: !opts.skipped,
            skipped: opts.skipped ?? p.skipped,
          };
        });

        // If we're already on the last phase, mark the run as ended.
        if (idx >= lastIdx) {
          const finished: RevisionSessionRun = {
            ...prev,
            phaseProgress: closed,
            endedAt: now,
          };
          // Persist + history.
          saveCompletedRun(finished);
          clearInProgress(child.id);
          clearNotes(prev.id);
          return finished;
        }

        // Otherwise open the next phase.
        const nextIdx = idx + 1;
        const opened: PhaseProgress = {
          phaseIndex: nextIdx,
          startedAt: now,
          completed: false,
          extendedSec: 0,
          skipped: false,
        };
        const next: RevisionSessionRun = {
          ...prev,
          currentPhaseIndex: nextIdx,
          phaseProgress: [...closed, opened],
        };
        persistRun(next);
        return next;
      });
      setElapsedSec(0);
      setPaused(false);
    },
    [livePlan.phases.length, child.id, persistRun],
  );

  /** Add 2 minutes to the current phase. */
  const extendPhase = useCallback(() => {
    setLivePlan((prev) => ({
      ...prev,
      phases: prev.phases.map((p, i) =>
        i === currentIndex
          ? { ...p, durationSec: p.durationSec + 120 }
          : p,
      ),
    }));
    setRun((prev) => {
      const next = {
        ...prev,
        phaseProgress: prev.phaseProgress.map((pp, i) =>
          i === prev.phaseProgress.length - 1
            ? { ...pp, extendedSec: (pp.extendedSec ?? 0) + 120 }
            : pp,
        ),
      };
      persistRun(next);
      return next;
    });
  }, [currentIndex, persistRun]);

  /** Toggle pause. */
  const togglePause = useCallback(() => {
    setPaused((p) => !p);
  }, []);

  /** End the session early — jump to the reflect phase if we aren't there. */
  const endEarly = useCallback(() => {
    setConfirmEnd(false);
    const reflectIdx = livePlan.phases.findIndex((p) => p.kind === "reflect");
    const targetIdx = reflectIdx >= 0 ? reflectIdx : livePlan.phases.length - 1;
    const now = new Date().toISOString();

    setRun((prev) => {
      // Skip every phase between current and reflect, in order, marking
      // each skipped + completed=false.
      const skippedEntries: PhaseProgress[] = [];
      for (let i = prev.currentPhaseIndex + 1; i < targetIdx; i++) {
        skippedEntries.push({
          phaseIndex: i,
          startedAt: now,
          endedAt: now,
          completed: false,
          extendedSec: 0,
          skipped: true,
        });
      }
      // Close current.
      const closed = prev.phaseProgress.map((p, i) => {
        if (i !== prev.phaseProgress.length - 1) return p;
        return {
          ...p,
          endedAt: p.endedAt ?? now,
          skipped: true,
          completed: false,
        };
      });

      const opened: PhaseProgress = {
        phaseIndex: targetIdx,
        startedAt: now,
        completed: false,
        extendedSec: 0,
        skipped: false,
      };
      const next: RevisionSessionRun = {
        ...prev,
        currentPhaseIndex: targetIdx,
        phaseProgress: [...closed, ...skippedEntries, opened],
        endedEarly: true,
      };
      persistRun(next);
      return next;
    });
    setElapsedSec(0);
    setPaused(false);
  }, [livePlan.phases, persistRun]);

  // ── The clock ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (paused) return;
    if (currentPhase.kind === "reflect") return; // reflect has no auto-advance
    if (remainingSec <= 0) return; // already drained — let the boundary effect handle it

    const id = window.setInterval(() => {
      setElapsedSec((e) => e + 1);
      persistTickRef.current += 1;
      if (persistTickRef.current >= PERSIST_EVERY_TICKS) {
        persistTickRef.current = 0;
        // We don't need to update state — just flush latest to localStorage.
        setRun((prev) => {
          persistRun(prev);
          return prev;
        });
      }
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [paused, currentPhase.kind, remainingSec, persistRun]);

  // ── Auto-advance on timer drain ────────────────────────────────────────
  useEffect(() => {
    if (currentPhase.kind === "reflect") return;
    if (elapsedSec >= currentTotalSec && currentTotalSec > 0) {
      advancePhase({ skipped: false });
    }
  }, [elapsedSec, currentTotalSec, currentPhase.kind, advancePhase]);

  // ── Persist on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // If we're still running (no endedAt), keep the in-progress copy fresh.
      setRun((prev) => {
        if (!prev.endedAt) saveInProgress(prev);
        return prev;
      });
    };
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────

  const PhaseComponent = pickPhaseComponent(currentPhase.kind);
  const isFinished = !!run.endedAt;

  return (
    <div
      className="space-y-3"
      style={{
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
        backgroundColor: styles.backgroundColor === "#FFFFFF" ? undefined : styles.backgroundColor,
      }}
    >
      {/* ── Top control bar ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/50 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-3">
          {/* Timer */}
          <div className="flex-shrink-0 self-center sm:self-auto">
            <PhaseTimer
              totalSec={currentTotalSec}
              elapsedSec={elapsedSec}
              paused={paused}
              soundOn={soundOn}
              hideExtend={currentPhase.kind === "reflect"}
              hideControls={isFinished}
              label={`Phase ${currentIndex + 1} of ${livePlan.phases.length}`}
              onTogglePause={togglePause}
              onExtend={extendPhase}
              onSkip={() => advancePhase({ skipped: true })}
            />
          </div>

          {/* Right side meta */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {currentPhase.kind === "reflect" ? "Almost done" : "Currently"}
                </p>
                <h2 className="text-base font-bold text-foreground leading-tight truncate">
                  {phaseShortLabel(currentPhase)}
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  {livePlan.subjectLabel} · {livePlan.topic}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSoundOn((v) => !v)}
                aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
                className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2 h-7 text-[11px] font-semibold border transition-colors ${
                  soundOn
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {soundOn ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                {soundOn ? "Sound on" : "Sound off"}
              </button>
            </div>
            <PhaseSchedule
              phases={livePlan.phases}
              currentIndex={currentIndex}
              compact
            />
          </div>
        </div>
      </div>

      {/* ── Active phase ──────────────────────────────────────────────── */}
      {isFinished ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 text-center space-y-3"
        >
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-sm ring-4 ring-emerald-200">
            <Check className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-lg font-bold text-emerald-900">
            All saved! Lovely work, {child.name}.
          </h2>
          <p className="text-sm text-emerald-800/80 max-w-sm mx-auto">
            Your session is in the "Recent sessions" list, and your flashcards
            are scheduled to come back when you need them.
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`phase-${currentIndex}-${currentPhase.kind}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
          >
            <PhaseComponent
              plan={livePlan}
              phase={currentPhase}
              phaseIndex={currentIndex}
              sessionId={run.id}
              child={child}
              fontSize={styles.fontSize}
              fontFamily={styles.fontFamily}
              paused={paused}
              remainingSec={remainingSec}
              soundOn={soundOn}
              quizMistakes={quizMistakes}
              onResultUpdate={patchCurrentProgress}
              onAdvance={() => advancePhase()}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Accessibility row (collapsible, lower priority) ──────────── */}
      <details className="rounded-2xl border border-border/40 bg-white">
        <summary className="cursor-pointer px-3 py-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground select-none">
          Accessibility — change text size, font or overlay
        </summary>
        <div className="p-2 border-t border-border/40">
          <AccessibilityPanel onChange={setStyles} />
        </div>
      </details>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      {!isFinished && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-2">
          <button
            type="button"
            onClick={() => setConfirmEnd(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900"
          >
            I'm done — finish session
          </button>
          <span className="text-[10px] text-muted-foreground">
            Your work is auto-saved.
          </span>
        </div>
      )}

      {isFinished && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-md hover:shadow-lg transition-all"
          >
            <Check className="w-4 h-4" />
            Back to Revision Session home
          </button>
        </div>
      )}

      {/* ── Confirm-end dialog ─────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmEnd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4"
            onClick={() => setConfirmEnd(false)}
            role="presentation"
          >
            <motion.div
              initial={{ scale: 0.95, y: 4 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 4 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-3"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-end-title"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <X className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 id="confirm-end-title" className="font-bold text-foreground">
                    Finish the session early?
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    No problem — we'll skip ahead to the wrap-up screen so {child.name} can
                    tell us how it felt. The work so far is saved.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmEnd(false)}
                  className="px-3 h-9 rounded-xl border border-border bg-white text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Keep going
                </button>
                <button
                  type="button"
                  onClick={endEarly}
                  className="px-3 h-9 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors"
                >
                  Yes, finish now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function createFreshRun(
  plan: RevisionSessionPlan,
  sessionId: string,
  pupilId: string,
): RevisionSessionRun {
  const now = new Date().toISOString();
  const opened: PhaseProgress = {
    phaseIndex: 0,
    startedAt: now,
    completed: false,
    extendedSec: 0,
    skipped: false,
  };
  return {
    id: sessionId,
    planId: plan.id,
    plan,
    pupilId,
    startedAt: now,
    currentPhaseIndex: 0,
    phaseProgress: [opened],
  };
}

function pickPhaseComponent(kind: RevisionPhase["kind"]): ComponentType<PhaseComponentProps> {
  switch (kind) {
    case "warmup":     return WarmupPhase;
    case "lesson":     return LessonPhase;
    case "break":      return BreakPhase;
    case "quiz":       return QuizPhase;
    case "stretch":    return StretchPhase;
    case "flashcards": return FlashcardsPhase;
    case "reflect":    return ReflectPhase;
  }
}
