/**
 * ReflectPhase — final wrap-up. Shows what the pupil achieved this session
 * and asks for a 5-emoji mood + optional 1-line reflection.
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Award, Layers, MessageSquare, Target } from "lucide-react";
import PhaseHero from "../PhaseHero";
import { playSessionCompleteChime } from "@/lib/revision-sound";
import type { PhaseComponentProps } from "../phase-types";

const MOODS: Array<{ emoji: string; label: string }> = [
  { emoji: "😣", label: "Really tough" },
  { emoji: "🙁", label: "Tough" },
  { emoji: "😐", label: "OK" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😄", label: "Great" },
];

export default function ReflectPhase({
  plan,
  child,
  fontSize,
  fontFamily,
  soundOn,
  quizMistakes,
  onResultUpdate,
  onAdvance,
}: PhaseComponentProps) {
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [note, setNote] = useState("");

  // Celebrate once when the phase mounts.
  useEffect(() => {
    if (soundOn) playSessionCompleteChime();
  }, [soundOn]);

  // Pre-compute summary numbers from plan + (later) parent-supplied phase
  // progress. v1 simply mirrors what we know — quiz mistakes count, etc.
  const summary = useMemo(() => {
    const totalMin = Math.round(plan.totalSec / 60);
    const cardsScheduled = quizMistakes ? Math.min(8, quizMistakes.length + 4) : 4;
    return {
      totalMin,
      mistakes: quizMistakes?.length ?? 0,
      cardsScheduled,
    };
  }, [plan.totalSec, quizMistakes]);

  const handleSave = () => {
    onResultUpdate({
      reflection: mood !== null ? { mood, note: note.trim() || undefined } : undefined,
    });
    onAdvance();
  };

  return (
    <div className="space-y-4" style={{ fontSize, fontFamily }}>
      <PhaseHero
        kind="reflect"
        tone="emerald"
        title={`Done! Great work, ${child.name}.`}
        instruction="Tell me how that felt — and we'll save your session."
        speakable={`Done! Great work, ${child.name}. Tell me how that felt and we'll save your session.`}
        fontFamily={fontFamily}
      />

      {/* Today summary */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Today</p>
        <ul className="mt-2 space-y-1.5 text-sm text-emerald-900">
          <li className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <span>
              <span className="font-semibold">{summary.totalMin} minutes</span> on{" "}
              {plan.subjectLabel}: {plan.topic}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>
              {summary.mistakes === 0
                ? "Smashed the quiz — no mistakes!"
                : `${summary.mistakes} question${summary.mistakes === 1 ? "" : "s"} saved for review`}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>
              <span className="font-semibold">{summary.cardsScheduled} flashcards</span> scheduled to come back
            </span>
          </li>
        </ul>
      </div>

      {/* Mood scale */}
      <div className="rounded-2xl border border-border/50 bg-white p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground text-center">How did that feel?</p>
        <div className="flex items-center justify-between gap-1">
          {MOODS.map((m, i) => {
            const idx = (i + 1) as 1 | 2 | 3 | 4 | 5;
            const selected = mood === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setMood(idx)}
                aria-label={m.label}
                className="flex-1 flex flex-col items-center gap-1 group"
              >
                <motion.span
                  animate={{ scale: selected ? 1.25 : 1 }}
                  transition={{ duration: 0.15 }}
                  className="text-3xl leading-none select-none"
                >
                  {m.emoji}
                </motion.span>
                <span
                  className={`text-[10px] font-medium ${
                    selected ? "text-emerald-700" : "text-muted-foreground"
                  }`}
                >
                  {idx}
                </span>
              </button>
            );
          })}
        </div>
        {mood !== null && (
          <p className="text-center text-xs text-muted-foreground">
            {MOODS[mood - 1].label}
          </p>
        )}
      </div>

      {/* Optional note */}
      <div className="rounded-2xl border border-border/50 bg-white p-4 space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          Want to add a note? (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything that felt tricky, or that you want to remember…"
          className="w-full resize-none px-3 py-2 rounded-xl border border-border/60 bg-muted/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm"
          style={{ fontFamily, minHeight: 64 }}
          maxLength={400}
        />
      </div>

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-6 h-11 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-md hover:shadow-lg hover:from-emerald-700 hover:to-emerald-800 transition-all"
        >
          Save and finish
        </button>
      </div>
    </div>
  );
}
