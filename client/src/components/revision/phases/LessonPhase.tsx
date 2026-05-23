/**
 * LessonPhase — "Listen & Learn".
 *
 * A proper ten-minute lesson on the topic. Renders, in order:
 *   1. Lesson objective (what they'll be able to do by the end)
 *   2. Why it matters (one short pupil-friendly relevance paragraph)
 *   3. The teaching paragraphs (5–7 short, age-tailored chunks) with a
 *      simple sentence-level "karaoke" highlight when read aloud
 *   4. Key terms (4–6 cards)
 *   5. Worked examples (2–3, fully laid out with steps + final answer)
 *   6. A "common mistake" warning box
 *   7. Recap bullets
 *
 * The NotesPad sits beside the lesson on wide screens and below on narrow.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronRight,
  ListChecks,
  Loader2,
  Pause,
  Play,
  Sparkles,
  Target,
} from "lucide-react";
import PhaseHero from "../PhaseHero";
import NotesPad from "../NotesPad";
import { generateLessonScript, type LessonScript } from "@/lib/revision-content";
import { speakText, speechSupported, stopSpeaking } from "@/lib/flashcards-v2-enhancements";
import type { PhaseComponentProps } from "../phase-types";

export default function LessonPhase({
  plan,
  child,
  sessionId,
  fontSize,
  fontFamily,
  onResultUpdate,
  onAdvance,
}: PhaseComponentProps) {
  const [script, setScript] = useState<LessonScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Index into script.paragraphs that's currently being read aloud. */
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [speaking, setSpeaking] = useState(false);
  const cancelTimerRef = useRef<number | null>(null);

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

  // Generate once on mount.
  useEffect(() => {
    let cancelled = false;
    setScript(null);
    setError(null);
    generateLessonScript(input)
      .then((s) => { if (!cancelled) setScript(s); })
      .catch(() => {
        if (!cancelled) setError("We couldn't load the lesson. The other phases will still work.");
      });
    return () => { cancelled = true; };
  }, [input]);

  // Stop any in-flight speech if we unmount mid-utterance.
  useEffect(() => () => {
    stopSpeaking();
    if (cancelTimerRef.current) window.clearTimeout(cancelTimerRef.current);
  }, []);

  const ttsAvailable = speechSupported();

  /** Speak paragraph at idx; when done, chain to idx+1. */
  const speakParagraph = (idx: number) => {
    if (!script) return;
    const para = script.paragraphs[idx];
    if (!para) {
      setSpeaking(false);
      setActiveIndex(-1);
      return;
    }
    stopSpeaking();
    setActiveIndex(idx);
    setSpeaking(true);
    speakText(para, { rate: 0.9, lang: "en-GB" });
    if (cancelTimerRef.current) window.clearTimeout(cancelTimerRef.current);
    const ms = Math.min(para.length * 70, 30_000) + 600;
    cancelTimerRef.current = window.setTimeout(() => {
      const next = idx + 1;
      if (next < script.paragraphs.length) speakParagraph(next);
      else {
        setSpeaking(false);
        setActiveIndex(-1);
      }
    }, ms);
  };

  const handlePlay = () => {
    if (!script) return;
    if (speaking) {
      stopSpeaking();
      if (cancelTimerRef.current) window.clearTimeout(cancelTimerRef.current);
      setSpeaking(false);
      setActiveIndex(-1);
      return;
    }
    speakParagraph(0);
  };

  return (
    <div className="space-y-4" style={{ fontSize, fontFamily }}>
      <PhaseHero
        kind="lesson"
        tone="indigo"
        title={script?.title || `Listen & Learn: ${plan.topic}`}
        instruction="Read each section. Use the play button to listen along, and jot what you notice on the right."
        speakable={`Listen and learn. Today's topic: ${plan.topic}.`}
        fontFamily={fontFamily}
      />

      {/* Audio bar — controls reading the teaching paragraphs aloud. */}
      {ttsAvailable && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 px-3 py-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handlePlay}
            disabled={!script}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-sm"
            aria-label={speaking ? "Pause" : "Play"}
          >
            {speaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-indigo-900 truncate">
              {speaking
                ? `Reading paragraph ${activeIndex + 1} of ${script?.paragraphs.length ?? 0}…`
                : "Tap play to read the lesson aloud"}
            </div>
            <div className="text-[10px] text-indigo-700/80">
              British English voice · slowed for SEND learners
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[1fr,260px]">
        {/* ── Lesson body ─────────────────────────────────────────────── */}
        <motion.div
          key={script ? "script" : error ? "err" : "loading"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {!script && !error && (
            <div className="rounded-2xl border border-border/50 bg-white p-6 flex flex-col items-center gap-2 text-sm text-muted-foreground shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              Building your lesson…
              <span className="text-[11px] text-muted-foreground/80">
                This usually takes a few seconds.
              </span>
            </div>
          )}
          {error && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {error}
            </p>
          )}

          {script && (
            <>
              {/* 1. Objective */}
              <ObjectiveCard objective={script.objective} fontFamily={fontFamily} />

              {/* 2. Why it matters */}
              {script.whyItMatters && (
                <WhyCard text={script.whyItMatters} fontSize={fontSize} fontFamily={fontFamily} />
              )}

              {/* 3. Teaching paragraphs */}
              <div className="rounded-2xl border border-border/50 bg-white p-4 space-y-3 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  The lesson
                </p>
                <div className="space-y-2.5">
                  {script.paragraphs.map((p, i) => (
                    <p
                      key={i}
                      className={`leading-relaxed transition-colors rounded ${
                        activeIndex === i
                          ? "bg-indigo-50 text-indigo-900 px-2 py-1 -mx-2"
                          : "text-foreground"
                      }`}
                      style={{ fontSize, fontFamily }}
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </div>

              {/* 4. Key terms */}
              {script.keyTerms.length > 0 && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                    Key words
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {script.keyTerms.map((k, i) => (
                      <li
                        key={i}
                        className="rounded-lg border border-indigo-100 bg-white px-2.5 py-1.5"
                      >
                        <span className="text-[12px] font-semibold text-indigo-900">{k.term}</span>
                        <span className="block text-[11px] text-indigo-800/80 leading-snug">
                          {k.definition}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 5. Worked examples */}
              {script.workedExamples.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 px-1">
                    Worked examples
                  </p>
                  {script.workedExamples.map((ex, i) => (
                    <WorkedExampleCard
                      key={i}
                      index={i}
                      example={ex}
                      fontSize={fontSize}
                      fontFamily={fontFamily}
                    />
                  ))}
                </div>
              )}

              {/* 6. Common mistake */}
              {script.commonMistake && (
                <CommonMistakeCard text={script.commonMistake} fontFamily={fontFamily} />
              )}

              {/* 7. Recap */}
              {script.recap.length > 0 && (
                <RecapCard items={script.recap} fontSize={fontSize} fontFamily={fontFamily} />
              )}
            </>
          )}
        </motion.div>

        {/* ── Notes pad sidebar ───────────────────────────────────────── */}
        <NotesPad
          sessionId={sessionId}
          fontSize={fontSize}
          fontFamily={fontFamily}
          disabled={!script}
          onChange={(notes) => onResultUpdate({ notes })}
        />
      </div>

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={onAdvance}
          className="inline-flex items-center gap-2 px-5 h-10 rounded-2xl font-semibold text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
        >
          Next phase
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Section sub-components ─────────────────────────────────────────────────

function ObjectiveCard({
  objective,
  fontFamily,
}: {
  objective: string;
  fontFamily: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 flex items-start gap-3 shadow-sm">
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center ring-4 ring-white shadow-sm">
        <Target className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
          Today's goal
        </p>
        <p className="text-sm font-medium text-emerald-900 leading-relaxed mt-0.5" style={{ fontFamily }}>
          {objective}
        </p>
      </div>
    </div>
  );
}

function WhyCard({
  text,
  fontSize,
  fontFamily,
}: {
  text: string;
  fontSize: number;
  fontFamily: string;
}) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-4 flex items-start gap-3 shadow-sm">
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
          Why it matters
        </p>
        <p
          className="text-foreground leading-relaxed mt-0.5"
          style={{ fontSize, fontFamily }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

function WorkedExampleCard({
  example,
  index,
  fontSize,
  fontFamily,
}: {
  example: { scenario: string; steps: string[]; finalAnswer: string };
  index: number;
  fontSize: number;
  fontFamily: string;
}) {
  return (
    <div className="rounded-2xl border border-violet-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-2 bg-gradient-to-r from-violet-50 to-fuchsia-50 border-b border-violet-100 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-violet-800">
          Worked example {index + 1}
        </span>
      </div>
      <div className="p-4 space-y-3">
        <p
          className="font-semibold text-foreground leading-relaxed"
          style={{ fontSize: fontSize + 1, fontFamily }}
        >
          {example.scenario}
        </p>
        <ol className="space-y-2 list-none">
          {example.steps.map((step, i) => (
            <li
              key={i}
              className="flex gap-2.5 rounded-xl px-3 py-2 bg-muted/30"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-md bg-white border border-violet-200 flex items-center justify-center text-[11px] font-bold text-violet-700">
                {i + 1}
              </span>
              <span
                className="flex-1 leading-relaxed text-foreground"
                style={{ fontSize, fontFamily }}
              >
                {step}
              </span>
            </li>
          ))}
        </ol>
        {example.finalAnswer && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Final answer
            </span>
            <p
              className="font-semibold text-emerald-900 mt-0.5 leading-relaxed"
              style={{ fontSize, fontFamily }}
            >
              {example.finalAnswer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CommonMistakeCard({
  text,
  fontFamily,
}: {
  text: string;
  fontFamily: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
        <AlertTriangle className="w-4 h-4 text-amber-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
          Watch out for
        </p>
        <p className="text-sm text-amber-900 leading-relaxed mt-0.5" style={{ fontFamily }}>
          {text}
        </p>
      </div>
    </div>
  );
}

function RecapCard({
  items,
  fontSize,
  fontFamily,
}: {
  items: string[];
  fontSize: number;
  fontFamily: string;
}) {
  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <ListChecks className="w-4 h-4 text-indigo-700" />
        <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
          Quick recap
        </p>
      </div>
      <ul className="space-y-1.5">
        {items.map((line, i) => (
          <li
            key={i}
            className="flex gap-2 text-foreground leading-relaxed"
            style={{ fontSize, fontFamily }}
          >
            <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-600" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
