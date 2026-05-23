/**
 * QuizPhase — interactive multiple-choice quiz on the lesson topic.
 *
 * Pulls 8 questions from the existing question bank where possible, falling
 * back to AI generation, and finally to a tiny canned quiz so the phase
 * always runs.
 *
 * Behaviour notes
 *  • There's no per-question timer (only a phase timer) — anxiety reduction.
 *  • TTS available on every question.
 *  • Wrong + skipped questions are reported back to the runner via
 *    `onResultUpdate({ itemResults })` so the Flashcards phase can seed a
 *    deck from them.
 */
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Loader2, SkipForward, Volume2, X } from "lucide-react";
import PhaseHero from "../PhaseHero";
import { pickOrGenerateQuiz } from "@/lib/revision-content";
import {
  speakText,
  speechSupported,
  stopSpeaking,
} from "@/lib/flashcards-v2-enhancements";
import type { QuizQuestion } from "@/lib/quiz-bank";
import type { PhaseComponentProps } from "../phase-types";

interface ItemResult {
  question: string;
  answer?: string;
  correct: boolean;
  skipped?: boolean;
}

export default function QuizPhase({
  plan,
  child,
  fontSize,
  fontFamily,
  onResultUpdate,
  onAdvance,
}: PhaseComponentProps) {
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<ItemResult[]>([]);

  const ttsAvailable = speechSupported();

  // Load questions once per phase.
  useEffect(() => {
    let cancelled = false;
    setQuestions(null);
    setError(null);
    pickOrGenerateQuiz(
      {
        subjectId: plan.subject,
        subjectLabel: plan.subjectLabel,
        topic: plan.topic,
        yearGroup: plan.yearGroup,
        difficulty: plan.difficulty,
        readingAgeOverride: child.readingAgeOverride,
        sendNeeds: child.sendNeeds,
      },
      8,
    )
      .then((res) => { if (!cancelled) setQuestions(res.questions); })
      .catch(() => {
        if (!cancelled) setError("We couldn't build a quiz this time — feel free to skip ahead.");
      });
    return () => { cancelled = true; stopSpeaking(); };
  }, [plan, child]);

  const currentQ = questions?.[idx] ?? null;

  const score = useMemo(() => {
    if (results.length === 0) return 0;
    const correct = results.filter((r) => r.correct).length;
    return correct / results.length;
  }, [results]);

  // Push score + mistakes up to the runner whenever results change.
  useEffect(() => {
    onResultUpdate({
      score: results.length > 0 ? score : undefined,
      itemResults: results,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, score]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const submit = () => {
    if (!currentQ || picked === null || revealed) return;
    setRevealed(true);
    setResults((prev) => [
      ...prev,
      {
        question: currentQ.q,
        answer: currentQ.options[picked],
        correct: picked === currentQ.answer,
      },
    ]);
  };

  const skip = () => {
    if (!currentQ) return;
    setResults((prev) => [
      ...prev,
      {
        question: currentQ.q,
        answer: undefined,
        correct: false,
        skipped: true,
      },
    ]);
    advance();
  };

  const advance = () => {
    setPicked(null);
    setRevealed(false);
    if (questions && idx + 1 < questions.length) {
      setIdx(idx + 1);
    } else {
      onAdvance();
    }
  };

  const speakQuestion = () => {
    if (!currentQ || !ttsAvailable) return;
    const txt = `${currentQ.q}. ${currentQ.options.map((o, i) => `Option ${String.fromCharCode(65 + i)}: ${o}.`).join(" ")}`;
    speakText(txt, { rate: 0.9, lang: "en-GB" });
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4" style={{ fontSize, fontFamily }}>
      <PhaseHero
        kind="quiz"
        tone="violet"
        title="Quiz"
        instruction="No time pressure on each question — take what you need."
        speakable={`Quiz time. ${plan.topic} questions.`}
        fontFamily={fontFamily}
      />

      {!questions && !error && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Picking your questions…
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-800">
          {error}
          <div className="mt-2">
            <button
              type="button"
              onClick={onAdvance}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 underline"
            >
              Skip to next phase
            </button>
          </div>
        </div>
      )}

      {questions && currentQ && (
        <>
          {/* Progress bar */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              Question <span className="font-semibold text-foreground">{idx + 1}</span> of {questions.length}
            </span>
            <span>{Math.round(score * 100)}% so far</span>
          </div>
          <div className="h-1.5 rounded-full bg-violet-100 overflow-hidden">
            <div
              className="h-full bg-violet-600 transition-all"
              style={{ width: `${((idx + (revealed ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-border/50 bg-white p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h4
                  className="font-semibold text-foreground leading-relaxed flex-1"
                  style={{ fontSize: fontSize + 1 }}
                >
                  {currentQ.q}
                </h4>
                {ttsAvailable && (
                  <button
                    type="button"
                    onClick={speakQuestion}
                    aria-label="Read question aloud"
                    className="flex-shrink-0 w-7 h-7 rounded-full border border-border bg-white hover:bg-muted flex items-center justify-center"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Options */}
              <div className="grid gap-2">
                {currentQ.options.map((opt, i) => {
                  const isPicked = picked === i;
                  const isAnswer = currentQ.answer === i;
                  let stateClass =
                    "border-border/60 hover:border-violet-300 hover:bg-violet-50/40";
                  if (revealed) {
                    if (isAnswer) stateClass = "border-emerald-300 bg-emerald-50";
                    else if (isPicked) stateClass = "border-rose-300 bg-rose-50";
                    else stateClass = "border-border/30 opacity-60";
                  } else if (isPicked) {
                    stateClass = "border-violet-500 bg-violet-50 ring-2 ring-violet-500/20";
                  }
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => !revealed && setPicked(i)}
                      disabled={revealed}
                      className={`w-full text-left rounded-xl border px-3 py-2.5 text-sm font-medium transition-all flex items-center gap-2 ${stateClass}`}
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-md bg-white border border-border flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1" style={{ fontFamily }}>
                        {opt}
                      </span>
                      {revealed && isAnswer && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                      {revealed && isPicked && !isAnswer && <X className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Feedback after submit */}
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl px-3 py-2.5 text-sm ${
                    picked === currentQ.answer
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border border-rose-200 text-rose-900"
                  }`}
                >
                  {picked === currentQ.answer ? (
                    <span className="font-semibold">✅ That's right.</span>
                  ) : (
                    <>
                      <span className="font-semibold">
                        Not quite. The right answer is {String.fromCharCode(65 + currentQ.answer)}.
                      </span>{" "}
                      <span className="text-rose-800">
                        We'll add this one to your flashcards for later — no worries.
                      </span>
                    </>
                  )}
                </motion.div>
              )}

              {/* Action row */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={skip}
                  disabled={revealed}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Skip
                </button>
                {!revealed ? (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={picked === null}
                    className="inline-flex items-center gap-2 px-4 h-9 rounded-xl font-semibold text-sm text-white bg-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Check answer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={advance}
                    className="inline-flex items-center gap-2 px-4 h-9 rounded-xl font-semibold text-sm text-white bg-violet-600 hover:bg-violet-700 transition-colors"
                  >
                    {idx + 1 >= questions.length ? "Finish quiz" : "Next question"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
