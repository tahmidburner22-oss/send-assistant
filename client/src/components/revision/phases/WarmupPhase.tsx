/**
 * WarmupPhase — the "Now / Next / Then" opener every revision session
 * begins with. Reduces uncertainty for SEND learners by previewing the
 * first three phases of the session before any work starts.
 */
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import PhaseHero from "../PhaseHero";
import { phaseIcon, phaseLongBlurb, phaseShortLabel } from "../phase-meta";
import { formatMinutes } from "@/lib/revision-session-planner";
import type { PhaseComponentProps } from "../phase-types";

export default function WarmupPhase({
  plan,
  child,
  fontSize,
  fontFamily,
  onAdvance,
}: PhaseComponentProps) {
  // The next 3 phases after warmup form the Now / Next / Then preview.
  const upcoming = plan.phases.slice(1, 4);
  const labels = ["Now", "Next", "Then"];

  const speakable =
    `Hi ${child.name}! Today we'll revise ${plan.topic} in ${plan.subjectLabel}. ` +
    upcoming
      .map((p, i) => `${labels[i]}: ${phaseShortLabel(p)} for ${formatMinutes(p.durationSec)}.`)
      .join(" ") +
    " When you're ready, press 'I'm ready' to begin.";

  return (
    <div className="space-y-4" style={{ fontSize, fontFamily }}>
      <PhaseHero
        kind="warmup"
        tone="indigo"
        title={`Hi ${child.name}! Here's what we'll do today`}
        instruction={`Today's topic: ${plan.topic} (${plan.subjectLabel}).`}
        subInstruction="Take a moment to look at what's coming. When you're ready, press the green button."
        speakable={speakable}
        fontFamily={fontFamily}
      />

      {/* Now / Next / Then cards */}
      <div className="grid grid-cols-3 gap-2">
        {upcoming.map((p, idx) => {
          const Icon = phaseIcon(p.kind);
          return (
            <motion.div
              key={`${p.kind}-${idx}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07, duration: 0.25 }}
              className="rounded-2xl border border-indigo-200 bg-white shadow-sm p-3 flex flex-col items-center text-center"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                {labels[idx] ?? "Then"}
              </span>
              <div className="mt-2 w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="mt-2 text-[11px] font-semibold text-foreground leading-tight">
                {phaseShortLabel(p)}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                {formatMinutes(p.durationSec)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 leading-snug">
                {phaseLongBlurb(p.kind)}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Continuing-after preview */}
      {plan.phases.length > 4 && (
        <div className="rounded-2xl border border-border/50 bg-white p-3 text-xs text-muted-foreground text-center leading-relaxed">
          After that we'll have a longer break, then some harder questions,
          then flashcards, then a quick check-in about how it felt.
        </div>
      )}

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={onAdvance}
          className="inline-flex items-center gap-2 px-5 h-11 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-md hover:shadow-lg hover:from-emerald-700 hover:to-emerald-800 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          I'm ready
        </button>
      </div>
    </div>
  );
}
