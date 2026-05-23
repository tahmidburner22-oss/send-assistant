/**
 * StretchPhase — "Stretch & apply" — the harder questions phase.
 *
 * Three modes (parent-selected on the landing page):
 *  • ai-worksheet     — 3 AI-generated exam-style questions, free-text answers,
 *                       optional hint + worked solution. Numerical answers are
 *                       auto-marked exactly; long answers are flagged "to review".
 *  • past-paper       — friendly hand-off to /past-papers (real PDFs hosted at
 *                       PMT) since topic-aligned past papers are out of scope
 *                       for v1.
 *  • worked-example   — 2 AI-generated worked walkthroughs, one step at a time.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronRight,
  ExternalLink,
  Lightbulb,
  Loader2,
  ScrollText,
  Volume2,
} from "lucide-react";
import PhaseHero from "../PhaseHero";
import {
  generateStretchQuestions,
  generateWorkedExamples,
  type StretchQuestion,
  type WorkedExample,
} from "@/lib/revision-content";
import { speakText, speechSupported, stopSpeaking } from "@/lib/flashcards-v2-enhancements";
import type { PhaseComponentProps } from "../phase-types";

interface ItemResult {
  question: string;
  answer?: string;
  correct: boolean;
  skipped?: boolean;
}

export default function StretchPhase(props: PhaseComponentProps) {
  const mode = props.phase.config?.stretchMode ?? "ai-worksheet";
  if (mode === "past-paper") return <PastPaperMode {...props} />;
  if (mode === "worked-example") return <WorkedExampleMode {...props} />;
  return <AiWorksheetMode {...props} />;
}

// ─── Mode 1: AI worksheet ──────────────────────────────────────────────────

function AiWorksheetMode({
  plan,
  child,
  fontSize,
  fontFamily,
  onResultUpdate,
  onAdvance,
}: PhaseComponentProps) {
  const [questions, setQuestions] = useState<StretchQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [marked, setMarked] = useState<null | "correct" | "incorrect" | "review">(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [results, setResults] = useState<ItemResult[]>([]);

  const ttsAvailable = speechSupported();

  const input = useMemo(
    () => ({
      subjectId: plan.subject,
      subjectLabel: plan.subjectLabel,
      topic: plan.topic,
      yearGroup: plan.yearGroup,
      difficulty: plan.difficulty,
      readingAgeOverride: child.readingAgeOverride,
      sendNeeds: child.sendNeeds,
    }),
    [plan, child],
  );

  useEffect(() => {
    let cancelled = false;
    setQuestions(null);
    setError(null);
    generateStretchQuestions(input, 3)
      .then((qs) => { if (!cancelled) setQuestions(qs); })
      .catch(() => { if (!cancelled) setError("We couldn't load these questions. Feel free to skip ahead."); });
    return () => { cancelled = true; stopSpeaking(); };
  }, [input]);

  const currentQ = questions?.[idx] ?? null;

  // Push results back up.
  useEffect(() => {
    onResultUpdate({ itemResults: results });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  const speakQ = () => {
    if (!ttsAvailable || !currentQ) return;
    speakText(currentQ.question, { rate: 0.9, lang: "en-GB" });
  };

  const submit = () => {
    if (!currentQ) return;
    let outcome: "correct" | "incorrect" | "review";
    if (currentQ.isNumerical) {
      const expected = currentQ.expectedAnswer.replace(/[^0-9.\-]/g, "").trim();
      const given = answer.replace(/[^0-9.\-]/g, "").trim();
      outcome = expected !== "" && given === expected ? "correct" : "incorrect";
    } else {
      outcome = answer.trim().length >= 2 ? "review" : "incorrect";
    }
    setMarked(outcome);
    setResults((prev) => [
      ...prev,
      {
        question: currentQ.question,
        answer: answer.trim(),
        correct: outcome === "correct",
      },
    ]);
  };

  const next = () => {
    if (!questions) return;
    setAnswer("");
    setMarked(null);
    setShowHint(false);
    setShowSolution(false);
    if (idx + 1 < questions.length) setIdx(idx + 1);
    else onAdvance();
  };

  const skip = () => {
    if (!currentQ) return;
    setResults((prev) => [
      ...prev,
      { question: currentQ.question, correct: false, skipped: true },
    ]);
    next();
  };

  return (
    <div className="space-y-4" style={{ fontSize, fontFamily }}>
      <PhaseHero
        kind="stretch"
        tone="amber"
        title={`${plan.topic} — Stretch & apply`}
        instruction="Take your time. Hints and worked answers are here if you need them."
        speakable="Stretch and apply. Try a few harder questions."
        fontFamily={fontFamily}
      />

      {!questions && !error && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Building your stretch questions…
        </div>
      )}
      {error && (
        <ErrorBlock message={error} onAdvance={onAdvance} />
      )}

      {questions && currentQ && (
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border/50 bg-white shadow-sm p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-amber-700">
                  Q{idx + 1} of {questions.length} · {currentQ.marks} mark{currentQ.marks === 1 ? "" : "s"}
                </p>
                <h4
                  className="font-semibold text-foreground leading-relaxed mt-1"
                  style={{ fontSize: fontSize + 1 }}
                >
                  {currentQ.question}
                </h4>
              </div>
              {ttsAvailable && (
                <button
                  type="button"
                  onClick={speakQ}
                  aria-label="Read aloud"
                  className="flex-shrink-0 w-7 h-7 rounded-full border border-border bg-white hover:bg-muted flex items-center justify-center"
                >
                  <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Show your working / write your answer…"
              disabled={marked !== null}
              className="w-full resize-none px-3 py-2 rounded-xl border border-border/60 bg-muted/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm disabled:opacity-70"
              style={{ fontFamily, minHeight: 96 }}
            />

            {/* Help row */}
            <div className="flex flex-wrap items-center gap-2">
              {currentQ.hint && (
                <button
                  type="button"
                  onClick={() => setShowHint((s) => !s)}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-amber-700 hover:text-amber-900"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  {showHint ? "Hide hint" : "Stuck? Show a hint"}
                </button>
              )}
              {currentQ.workedSolution && (
                <button
                  type="button"
                  onClick={() => setShowSolution((s) => !s)}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  {showSolution ? "Hide worked example" : "Show worked example"}
                </button>
              )}
            </div>

            {showHint && currentQ.hint && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
                💡 {currentQ.hint}
              </div>
            )}
            {showSolution && currentQ.workedSolution && (
              <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-2 text-sm text-indigo-900 whitespace-pre-line">
                {currentQ.workedSolution}
              </div>
            )}

            {/* Marking feedback */}
            {marked === "correct" && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-900 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Spot on!</p>
                  <p className="text-emerald-800 text-[13px]">
                    Expected answer: <strong>{currentQ.expectedAnswer}</strong>
                  </p>
                </div>
              </div>
            )}
            {marked === "review" && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-900">
                <p className="font-semibold">Saved to review.</p>
                <p className="text-blue-800 text-[13px]">
                  Long answers are tricky to mark automatically — your teacher can review this later.
                </p>
                {currentQ.expectedAnswer && (
                  <p className="text-blue-800 text-[13px] mt-1">
                    Model answer: <em>{currentQ.expectedAnswer}</em>
                  </p>
                )}
              </div>
            )}
            {marked === "incorrect" && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-900">
                <p className="font-semibold">Not quite. We'll add this to your flashcards.</p>
                {currentQ.expectedAnswer && (
                  <p className="text-rose-800 text-[13px] mt-1">
                    Expected: <strong>{currentQ.expectedAnswer}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={skip}
                disabled={marked !== null}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                Skip this one
              </button>
              {marked === null ? (
                <button
                  type="button"
                  onClick={submit}
                  disabled={answer.trim().length === 0}
                  className="inline-flex items-center gap-2 px-4 h-9 rounded-xl font-semibold text-sm text-white bg-amber-600 hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save & check
                </button>
              ) : (
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-2 px-4 h-9 rounded-xl font-semibold text-sm text-white bg-amber-600 hover:bg-amber-700 transition-colors"
                >
                  {idx + 1 >= questions.length ? "Finish" : "Next question"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Mode 2: Past paper hand-off ──────────────────────────────────────────

function PastPaperMode({
  plan,
  fontSize,
  fontFamily,
  onAdvance,
}: PhaseComponentProps) {
  return (
    <div className="space-y-4" style={{ fontSize, fontFamily }}>
      <PhaseHero
        kind="stretch"
        tone="amber"
        title={`${plan.topic} — Past papers`}
        instruction="Open the past papers library and pick a question on this topic."
        fontFamily={fontFamily}
      />

      <div className="rounded-2xl border border-border/50 bg-white p-4 space-y-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <ScrollText className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Real exam papers, all in one place</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Browse {plan.subjectLabel} papers across exam boards and years.
              Pick a recent paper and try one or two questions on{" "}
              <span className="font-semibold text-foreground">{plan.topic}</span>.
            </p>
          </div>
        </div>

        <Link
          href="/parent-portal/past-papers"
          className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-2xl font-semibold text-sm text-white bg-amber-600 hover:bg-amber-700 transition-colors"
        >
          Open past papers
          <ExternalLink className="w-4 h-4" />
        </Link>

        <p className="text-[11px] text-muted-foreground text-center">
          When you're done, come back and tap "I'm done with this phase" below.
        </p>
      </div>

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={onAdvance}
          className="inline-flex items-center gap-2 px-5 h-10 rounded-2xl font-semibold text-sm text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
        >
          I'm done with this phase
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Mode 3: Worked examples ──────────────────────────────────────────────

function WorkedExampleMode({
  plan,
  child,
  fontSize,
  fontFamily,
  onAdvance,
}: PhaseComponentProps) {
  const [examples, setExamples] = useState<WorkedExample[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    generateWorkedExamples(
      {
        subjectId: plan.subject,
        subjectLabel: plan.subjectLabel,
        topic: plan.topic,
        yearGroup: plan.yearGroup,
        difficulty: plan.difficulty,
        readingAgeOverride: child.readingAgeOverride,
        sendNeeds: child.sendNeeds,
      },
      2,
    )
      .then((ex) => { if (!cancelled) setExamples(ex); })
      .catch(() => { if (!cancelled) setError("We couldn't load worked examples — feel free to skip ahead."); });
    return () => { cancelled = true; };
  }, [plan, child]);

  const current = examples?.[idx];

  const nextStep = () => {
    if (!current) return;
    if (stepIdx + 1 < current.steps.length) {
      setStepIdx(stepIdx + 1);
    } else if (idx + 1 < (examples?.length ?? 0)) {
      setIdx(idx + 1);
      setStepIdx(0);
    } else {
      onAdvance();
    }
  };

  const isLastStep =
    !!current && stepIdx === current.steps.length - 1 &&
    idx === (examples?.length ?? 0) - 1;

  return (
    <div className="space-y-4" style={{ fontSize, fontFamily }}>
      <PhaseHero
        kind="stretch"
        tone="amber"
        title={`${plan.topic} — Worked examples`}
        instruction="Walk through each step. When it makes sense, move on."
        fontFamily={fontFamily}
      />
      {!examples && !error && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Building your examples…
        </div>
      )}
      {error && <ErrorBlock message={error} onAdvance={onAdvance} />}
      {examples && current && (
        <div className="rounded-2xl border border-border/50 bg-white shadow-sm p-4 space-y-3">
          <p className="text-[11px] font-semibold text-amber-700">
            Example {idx + 1} of {examples.length} · Step {stepIdx + 1} of {current.steps.length}
          </p>
          <p className="text-sm font-semibold text-foreground" style={{ fontSize: fontSize + 1 }}>
            {current.scenario}
          </p>
          <ol className="space-y-2 list-none">
            {current.steps.slice(0, stepIdx + 1).map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 rounded-xl px-3 py-2 ${
                  i === stepIdx ? "bg-amber-50 border border-amber-200" : "bg-muted/30"
                }`}
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-md bg-white border border-border flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground leading-relaxed" style={{ fontFamily }}>
                  {step}
                </span>
              </motion.li>
            ))}
          </ol>
          {isLastStep && current.finalAnswer && (
            <p className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-900">
              <strong>Final answer:</strong> {current.finalAnswer}
            </p>
          )}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-2 px-4 h-9 rounded-xl font-semibold text-sm text-white bg-amber-600 hover:bg-amber-700 transition-colors"
            >
              {isLastStep ? "I get it — finish" : "Got it — next step"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared small components ──────────────────────────────────────────────

function ErrorBlock({ message, onAdvance }: { message: string; onAdvance: () => void }) {
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-800">
      {message}
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
  );
}
