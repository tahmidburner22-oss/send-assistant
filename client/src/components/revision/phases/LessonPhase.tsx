/**
 * LessonPhase — "Listen & Learn".
 *
 * Generates a SEND-aware short lesson script via callAI on mount, renders it
 * as a card with key terms + worked example, and provides a Web-Speech
 * read-aloud control with a current-paragraph highlight (basic karaoke).
 *
 * The NotesPad sits below on narrow screens and beside on wide screens.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Loader2, Pause, Play } from "lucide-react";
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
  const [activeIndex, setActiveIndex] = useState<number>(-1); // index of currently-spoken paragraph
  const [speaking, setSpeaking] = useState(false);
  const cancelTimerRef = useRef<number | null>(null);

  // Build the input once per session.
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
      .catch(() => { if (!cancelled) setError("We couldn't load the lesson. The other phases will still work."); });
    return () => { cancelled = true; };
  }, [input]);

  // Stop any in-flight speech if we unmount mid-utterance.
  useEffect(() => () => {
    stopSpeaking();
    if (cancelTimerRef.current) window.clearTimeout(cancelTimerRef.current);
  }, []);

  const ttsAvailable = speechSupported();

  const speakParagraph = (idx: number) => {
    if (!script) return;
    const para = script.paragraphs[idx];
    if (!para) return;
    stopSpeaking();
    setActiveIndex(idx);
    setSpeaking(true);
    speakText(para, { rate: 0.9, lang: "en-GB" });
    // Approximate end-of-speech via length-based timer, then auto-advance.
    if (cancelTimerRef.current) window.clearTimeout(cancelTimerRef.current);
    const ms = Math.min(para.length * 70, 30_000) + 600;
    cancelTimerRef.current = window.setTimeout(() => {
      const next = idx + 1;
      if (next < script.paragraphs.length) {
        speakParagraph(next);
      } else {
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
        instruction="Listen to the lesson and jot down what you notice on the right."
        speakable={`Listen and learn. Today's topic: ${plan.topic}.`}
        fontFamily={fontFamily}
      />

      {/* Audio bar */}
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
                : "Tap play to listen along"}
            </div>
            <div className="text-[10px] text-indigo-700/80">
              British English voice · slows for SEND
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[1fr,260px]">
        {/* Lesson body */}
        <motion.div
          key={script ? "script" : error ? "err" : "loading"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/50 bg-white p-4 space-y-3 shadow-sm"
        >
          {!script && !error && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Building your lesson…
            </div>
          )}
          {error && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {script && (
            <>
              <div className="space-y-2.5">
                {script.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className={`leading-relaxed transition-colors ${
                      activeIndex === i
                        ? "bg-indigo-50 text-indigo-900 px-2 py-1 -mx-2 rounded"
                        : "text-foreground"
                    }`}
                    style={{ fontSize, fontFamily }}
                  >
                    {p}
                  </p>
                ))}
              </div>

              {script.keyTerms.length > 0 && (
                <div className="pt-3 border-t border-border/40 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                    Key words
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {script.keyTerms.map((k, i) => (
                      <li
                        key={i}
                        className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-2.5 py-1.5"
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

              {script.workedExample && (
                <details className="pt-2 border-t border-border/40">
                  <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-wider text-indigo-700 hover:text-indigo-900 transition-colors">
                    See a worked example
                  </summary>
                  <div className="mt-2 whitespace-pre-line rounded-lg bg-muted/40 px-3 py-2 text-[13px] leading-relaxed text-foreground">
                    {script.workedExample}
                  </div>
                </details>
              )}
            </>
          )}
        </motion.div>

        {/* Notes pad */}
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
